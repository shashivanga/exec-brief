-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create organizations table
CREATE TABLE public.organizations (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    branding JSONB,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create org_members table
CREATE TABLE public.org_members (
    org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    PRIMARY KEY (org_id, user_id)
);

-- Create profiles table
CREATE TABLE public.profiles (
    user_id UUID NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT,
    avatar_url TEXT,
    timezone TEXT DEFAULT 'America/New_York',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create dashboards table
CREATE TABLE public.dashboards (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL DEFAULT 'Main',
    is_default BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create cards table
CREATE TABLE public.cards (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    dashboard_id UUID NOT NULL REFERENCES public.dashboards(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('competitor', 'industry', 'company_health', 'metrics')),
    title TEXT NOT NULL,
    position INTEGER NOT NULL,
    pinned BOOLEAN DEFAULT false,
    hidden BOOLEAN DEFAULT false,
    data JSONB,
    sources JSONB,
    refreshed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create companies table
CREATE TABLE public.companies (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    ticker TEXT,
    domain TEXT,
    aliases TEXT[],
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (org_id, name)
);

-- Create topics table
CREATE TABLE public.topics (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    queries TEXT[] NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (org_id, name)
);

-- Create feeds table
CREATE TABLE public.feeds (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    kind TEXT NOT NULL CHECK (kind IN ('news', 'rss')),
    url TEXT NOT NULL,
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
    topic_id UUID REFERENCES public.topics(id) ON DELETE CASCADE,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    CHECK ((company_id IS NULL AND topic_id IS NOT NULL) OR (company_id IS NOT NULL AND topic_id IS NULL) OR (company_id IS NULL AND topic_id IS NULL))
);

-- Create items table with deduplication
CREATE TABLE public.items (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
    topic_id UUID REFERENCES public.topics(id) ON DELETE CASCADE,
    source_kind TEXT NOT NULL CHECK (source_kind IN ('news', 'rss')),
    source_id TEXT NOT NULL,
    title TEXT NOT NULL,
    url TEXT NOT NULL,
    published_at TIMESTAMP WITH TIME ZONE NOT NULL,
    summary TEXT,
    raw JSONB,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create documents table
CREATE TABLE public.documents (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    uploader_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    storage_path TEXT NOT NULL,
    file_name TEXT NOT NULL,
    kind TEXT NOT NULL CHECK (kind IN ('pdf', 'docx', 'pptx', 'xlsx')),
    uploaded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    status TEXT NOT NULL DEFAULT 'stored' CHECK (status IN ('stored', 'parsed', 'error'))
);

-- Create kpis table
CREATE TABLE public.kpis (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    unit TEXT NOT NULL CHECK (unit IN ('$', '$M', '%', 'count')),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (org_id, name)
);

-- Create kpi_points table
CREATE TABLE public.kpi_points (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    kpi_id UUID NOT NULL REFERENCES public.kpis(id) ON DELETE CASCADE,
    period DATE NOT NULL,
    value NUMERIC NOT NULL,
    source_document_id UUID REFERENCES public.documents(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (org_id, kpi_id, period)
);

-- Create indexes for performance
CREATE INDEX idx_dashboards_org_owner_default ON public.dashboards(org_id, owner_id, is_default);
CREATE INDEX idx_cards_org_dashboard_pinned_position ON public.cards(org_id, dashboard_id, pinned DESC, position ASC);
CREATE INDEX idx_items_org_company_published ON public.items(org_id, company_id, published_at DESC);
CREATE INDEX idx_items_org_topic_published ON public.items(org_id, topic_id, published_at DESC);
CREATE INDEX idx_kpi_points_org_kpi_period ON public.kpi_points(org_id, kpi_id, period DESC);

-- Create unique index for items deduplication handling NULL values properly
CREATE UNIQUE INDEX idx_items_dedup ON public.items(
    org_id, 
    COALESCE(company_id, '00000000-0000-0000-0000-000000000000'::uuid), 
    COALESCE(topic_id, '00000000-0000-0000-0000-000000000000'::uuid), 
    source_kind, 
    source_id
);

-- Create helper function to check org membership
CREATE OR REPLACE FUNCTION public.is_org_member(_org_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.org_members
    WHERE org_id = _org_id
      AND user_id = auth.uid()
  )
$$;

-- Enable RLS on all tables
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.org_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dashboards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feeds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kpis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kpi_points ENABLE ROW LEVEL SECURITY;

-- RLS Policies for organizations
CREATE POLICY "Users can view their organizations" ON public.organizations
    FOR SELECT USING (public.is_org_member(id));

CREATE POLICY "Users can update their organizations" ON public.organizations
    FOR UPDATE USING (public.is_org_member(id));

-- RLS Policies for org_members
CREATE POLICY "Users can view org members" ON public.org_members
    FOR SELECT USING (public.is_org_member(org_id));

CREATE POLICY "Users can insert org members" ON public.org_members
    FOR INSERT WITH CHECK (public.is_org_member(org_id));

-- RLS Policies for profiles
CREATE POLICY "Users can view all profiles" ON public.profiles
    FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS Policies for dashboards
CREATE POLICY "Users can view org dashboards" ON public.dashboards
    FOR SELECT USING (public.is_org_member(org_id));

CREATE POLICY "Users can insert org dashboards" ON public.dashboards
    FOR INSERT WITH CHECK (public.is_org_member(org_id) AND auth.uid() = owner_id);

CREATE POLICY "Users can update own dashboards" ON public.dashboards
    FOR UPDATE USING (public.is_org_member(org_id) AND auth.uid() = owner_id);

-- RLS Policies for cards
CREATE POLICY "Users can view org cards" ON public.cards
    FOR SELECT USING (public.is_org_member(org_id));

CREATE POLICY "Users can insert org cards" ON public.cards
    FOR INSERT WITH CHECK (public.is_org_member(org_id));

CREATE POLICY "Users can update org cards" ON public.cards
    FOR UPDATE USING (public.is_org_member(org_id));

CREATE POLICY "Users can delete org cards" ON public.cards
    FOR DELETE USING (public.is_org_member(org_id));

-- RLS Policies for companies
CREATE POLICY "Users can view org companies" ON public.companies
    FOR SELECT USING (public.is_org_member(org_id));

CREATE POLICY "Users can insert org companies" ON public.companies
    FOR INSERT WITH CHECK (public.is_org_member(org_id));

CREATE POLICY "Users can update org companies" ON public.companies
    FOR UPDATE USING (public.is_org_member(org_id));

CREATE POLICY "Users can delete org companies" ON public.companies
    FOR DELETE USING (public.is_org_member(org_id));

-- RLS Policies for topics
CREATE POLICY "Users can view org topics" ON public.topics
    FOR SELECT USING (public.is_org_member(org_id));

CREATE POLICY "Users can insert org topics" ON public.topics
    FOR INSERT WITH CHECK (public.is_org_member(org_id));

CREATE POLICY "Users can update org topics" ON public.topics
    FOR UPDATE USING (public.is_org_member(org_id));

CREATE POLICY "Users can delete org topics" ON public.topics
    FOR DELETE USING (public.is_org_member(org_id));

-- RLS Policies for feeds
CREATE POLICY "Users can view org feeds" ON public.feeds
    FOR SELECT USING (public.is_org_member(org_id));

CREATE POLICY "Users can insert org feeds" ON public.feeds
    FOR INSERT WITH CHECK (public.is_org_member(org_id));

CREATE POLICY "Users can update org feeds" ON public.feeds
    FOR UPDATE USING (public.is_org_member(org_id));

CREATE POLICY "Users can delete org feeds" ON public.feeds
    FOR DELETE USING (public.is_org_member(org_id));

-- RLS Policies for items
CREATE POLICY "Users can view org items" ON public.items
    FOR SELECT USING (public.is_org_member(org_id));

CREATE POLICY "Users can insert org items" ON public.items
    FOR INSERT WITH CHECK (public.is_org_member(org_id));

-- RLS Policies for documents
CREATE POLICY "Users can view org documents" ON public.documents
    FOR SELECT USING (public.is_org_member(org_id));

CREATE POLICY "Users can insert org documents" ON public.documents
    FOR INSERT WITH CHECK (public.is_org_member(org_id) AND auth.uid() = uploader_id);

CREATE POLICY "Users can update org documents" ON public.documents
    FOR UPDATE USING (public.is_org_member(org_id));

-- RLS Policies for kpis
CREATE POLICY "Users can view org kpis" ON public.kpis
    FOR SELECT USING (public.is_org_member(org_id));

CREATE POLICY "Users can insert org kpis" ON public.kpis
    FOR INSERT WITH CHECK (public.is_org_member(org_id));

CREATE POLICY "Users can update org kpis" ON public.kpis
    FOR UPDATE USING (public.is_org_member(org_id));

CREATE POLICY "Users can delete org kpis" ON public.kpis
    FOR DELETE USING (public.is_org_member(org_id));

-- RLS Policies for kpi_points
CREATE POLICY "Users can view org kpi_points" ON public.kpi_points
    FOR SELECT USING (public.is_org_member(org_id));

CREATE POLICY "Users can insert org kpi_points" ON public.kpi_points
    FOR INSERT WITH CHECK (public.is_org_member(org_id));

CREATE POLICY "Users can update org kpi_points" ON public.kpi_points
    FOR UPDATE USING (public.is_org_member(org_id));

CREATE POLICY "Users can delete org kpi_points" ON public.kpi_points
    FOR DELETE USING (public.is_org_member(org_id));

-- Create storage buckets
INSERT INTO storage.buckets (id, name, public) VALUES 
    ('uploads', 'uploads', false),
    ('exports', 'exports', false);

-- Storage policies for uploads bucket
CREATE POLICY "Users can view org documents in uploads" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'uploads' AND 
        EXISTS (
            SELECT 1 FROM public.documents d 
            WHERE d.storage_path = name 
            AND public.is_org_member(d.org_id)
        )
    );

CREATE POLICY "Users can upload to their org folder" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'uploads' AND 
        auth.uid() IS NOT NULL
    );

-- Storage policies for exports bucket
CREATE POLICY "Users can view org exports" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'exports' AND 
        auth.uid() IS NOT NULL AND
        (storage.foldername(name))[1] IN (
            SELECT org_id::text FROM public.org_members WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create org exports" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'exports' AND 
        auth.uid() IS NOT NULL AND
        (storage.foldername(name))[1] IN (
            SELECT org_id::text FROM public.org_members WHERE user_id = auth.uid()
        )
    );

-- Function to handle new user profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
    INSERT INTO public.profiles (user_id, full_name)
    VALUES (new.id, new.raw_user_meta_data ->> 'full_name');
    RETURN new;
END;
$$;

-- Trigger to create profile on user signup
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();