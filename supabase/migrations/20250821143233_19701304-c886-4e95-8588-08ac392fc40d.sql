-- Create the complete database schema for the MVP dashboard application
-- Following the db_design.md specification

-- ============================================================================
-- 1) PROFILES TABLE - Shadow auth.users for app-facing profile data
-- ============================================================================

CREATE TABLE public.profiles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  avatar_url TEXT,
  timezone TEXT DEFAULT 'America/New_York',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================================
-- 2) ORGANIZATIONS - Tenant/company data
-- ============================================================================

CREATE TABLE public.organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  plan TEXT DEFAULT 'free',
  branding JSONB DEFAULT '{"logo_url": null, "primary_color": null, "secondary_color": null, "pdf_header_text": null}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================================
-- 3) ORG_MEMBERS - Links users to organizations
-- ============================================================================

CREATE TABLE public.org_members (
  org_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'member',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (org_id, user_id)
);

-- ============================================================================
-- 4) DASHBOARDS - Per-user workspaces within orgs
-- ============================================================================

CREATE TABLE public.dashboards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT DEFAULT 'Main',
  is_default BOOLEAN DEFAULT true,
  is_shared BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================================
-- 5) CARD_TEMPLATES - Canonical definitions for card kinds
-- ============================================================================

CREATE TABLE public.card_templates (
  key TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL,
  schema JSONB
);

-- Insert default card templates
INSERT INTO public.card_templates (key, title, description, type, schema) VALUES
('competitor_overview', 'Competitor Overview', 'Latest news and updates about competitors', 'news', '{"fields": ["headlines", "summary", "sources"]}'),
('industry_news', 'Industry News', 'Industry trends and market updates', 'news', '{"fields": ["headlines", "summary", "sources"]}'),
('macro_snapshot', 'Macro Snapshot', 'Economic and market indicators', 'metrics', '{"fields": ["indicators", "trends", "sources"]}'),
('company_health', 'Company Health', 'Internal company metrics and KPIs', 'metrics', '{"fields": ["kpis", "trends", "sources"]}'),
('product_metrics', 'Product Metrics', 'Product performance and usage data', 'metrics', '{"fields": ["metrics", "trends", "sources"]}'),
('ai_summary', 'AI Summary', 'AI-generated insights and takeaways', 'ai', '{"fields": ["takeaways", "risks", "opportunities", "sources"]}');

-- ============================================================================
-- 6) CARDS - Concrete card instances on dashboards
-- ============================================================================

CREATE TABLE public.cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  dashboard_id UUID NOT NULL REFERENCES public.dashboards(id) ON DELETE CASCADE,
  template_key TEXT NOT NULL REFERENCES public.card_templates(key),
  title TEXT,
  size TEXT DEFAULT 'm' CHECK (size IN ('s', 'm', 'l')),
  position INTEGER NOT NULL,
  pinned BOOLEAN DEFAULT false,
  hidden BOOLEAN DEFAULT false,
  data JSONB DEFAULT '{}',
  sources JSONB DEFAULT '[]',
  refreshed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================================
-- 7) COMPANY_CATALOG - Global canonical companies
-- ============================================================================

CREATE TABLE public.company_catalog (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  ticker TEXT,
  domain TEXT,
  aliases TEXT[],
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create unique index to handle the complex uniqueness constraint
CREATE UNIQUE INDEX idx_company_catalog_unique 
ON public.company_catalog (name, COALESCE(ticker, ''), COALESCE(domain, ''));

-- ============================================================================
-- 8) ORG_COMPANIES - Companies the org actually tracks
-- ============================================================================

CREATE TABLE public.org_companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES public.company_catalog(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (org_id, company_id)
);

-- ============================================================================
-- 9) SOURCE_FEEDS - Ingestion endpoints per company
-- ============================================================================

CREATE TABLE public.source_feeds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  competitor_id UUID NOT NULL REFERENCES public.org_companies(id) ON DELETE CASCADE,
  kind TEXT NOT NULL CHECK (kind IN ('news', 'rss', 'sec', 'financials')),
  url TEXT NOT NULL,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================================
-- 10) INDUSTRY_TOPICS - Topics/keywords an org tracks for industry news
-- ============================================================================

CREATE TABLE public.industry_topics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  queries TEXT[] NOT NULL,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================================
-- 11) INGESTED_ITEMS - Normalized cache of fetched items (pre-AI)
-- ============================================================================

CREATE TABLE public.ingested_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  competitor_id UUID REFERENCES public.org_companies(id) ON DELETE CASCADE,
  industry_topic_id UUID REFERENCES public.industry_topics(id) ON DELETE CASCADE,
  source_kind TEXT NOT NULL CHECK (source_kind IN ('news', 'rss', 'sec', 'financials')),
  source_id TEXT NOT NULL,
  title TEXT NOT NULL,
  url TEXT NOT NULL,
  published_at TIMESTAMPTZ NOT NULL,
  summary TEXT,
  raw JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create unique index for ingested items with complex constraint
CREATE UNIQUE INDEX idx_ingested_items_unique 
ON public.ingested_items (org_id, COALESCE(competitor_id, '00000000-0000-0000-0000-000000000000'::UUID), COALESCE(industry_topic_id, '00000000-0000-0000-0000-000000000000'::UUID), source_kind, source_id);

-- ============================================================================
-- 12) DOCUMENTS - Tracks uploaded files in Storage
-- ============================================================================

CREATE TABLE public.documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  uploader_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  kind TEXT NOT NULL CHECK (kind IN ('pdf', 'docx', 'pptx', 'xlsx')),
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  status TEXT DEFAULT 'stored' CHECK (status IN ('stored', 'parsed', 'error'))
);

-- ============================================================================
-- 13) DOCUMENT_TEXTS - Extracted raw text for quick summaries
-- ============================================================================

CREATE TABLE public.document_texts (
  document_id UUID PRIMARY KEY REFERENCES public.documents(id) ON DELETE CASCADE,
  page_count INTEGER,
  text TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================================
-- 14) DOCUMENT_EXTRACTIONS - Heuristic/AI outputs for card content
-- ============================================================================

CREATE TABLE public.document_extractions (
  document_id UUID PRIMARY KEY REFERENCES public.documents(id) ON DELETE CASCADE,
  method TEXT NOT NULL CHECK (method IN ('heuristic', 'ai')),
  bullets JSONB DEFAULT '[]',
  entities JSONB DEFAULT '{}',
  kpis JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================================
-- 15) KPI_DEFINITIONS - Canonical KPIs per org
-- ============================================================================

CREATE TABLE public.kpi_definitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  unit TEXT NOT NULL CHECK (unit IN ('$', '$M', '%', 'count')),
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (org_id, name)
);

-- ============================================================================
-- 16) KPI_VALUES - Time-series metric values
-- ============================================================================

CREATE TABLE public.kpi_values (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  kpi_id UUID NOT NULL REFERENCES public.kpi_definitions(id) ON DELETE CASCADE,
  period DATE NOT NULL,
  value NUMERIC NOT NULL,
  source_document_id UUID REFERENCES public.documents(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (org_id, kpi_id, period)
);

-- ============================================================================
-- 17) BRIEFINGS - Saved morning briefings (top 5 cards)
-- ============================================================================

CREATE TABLE public.briefings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  for_date DATE NOT NULL,
  card_ids UUID[] NOT NULL,
  generated_by TEXT NOT NULL CHECK (generated_by IN ('heuristic', 'ai')),
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (org_id, user_id, for_date)
);

-- ============================================================================
-- 18) EXPORTS - Records of rendered PDFs
-- ============================================================================

CREATE TABLE public.exports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  kind TEXT NOT NULL CHECK (kind = 'dashboard_pdf'),
  storage_path TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================================
-- 19) NOTIFICATION_PREFS - Email digest preferences
-- ============================================================================

CREATE TABLE public.notification_prefs (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  daily_digest_enabled BOOLEAN DEFAULT true,
  digest_hour_utc INTEGER DEFAULT 12 CHECK (digest_hour_utc >= 0 AND digest_hour_utc <= 23)
);

-- ============================================================================
-- 20) AI_JOBS - Tracks AI tasks (summaries, flags)
-- ============================================================================

CREATE TABLE public.ai_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  job TEXT NOT NULL CHECK (job IN ('summarize', 'classify', 'flag_risks', 'embed')),
  input_ref_type TEXT NOT NULL CHECK (input_ref_type IN ('document', 'card', 'kpi_set')),
  input_ref_id UUID NOT NULL,
  provider TEXT,
  model TEXT,
  status TEXT DEFAULT 'queued' CHECK (status IN ('queued', 'processing', 'done', 'error')),
  output JSONB DEFAULT '{}',
  error TEXT,
  cost_usd NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ
);

-- ============================================================================
-- 21) STORAGE BUCKETS - Files and exports
-- ============================================================================

-- Create storage buckets for uploads and exports
INSERT INTO storage.buckets (id, name, public) VALUES 
('uploads', 'uploads', false),
('exports', 'exports', false);

-- ============================================================================
-- 22) HELPER FUNCTIONS for RLS
-- ============================================================================

-- Function to check if a user is a member of an organization
CREATE OR REPLACE FUNCTION public.is_org_member(org_uuid UUID)
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.org_members 
    WHERE org_id = org_uuid AND user_id = auth.uid()
  );
$$;

-- Function to get user's organizations
CREATE OR REPLACE FUNCTION public.get_user_orgs()
RETURNS UUID[]
LANGUAGE SQL
SECURITY DEFINER
STABLE
AS $$
  SELECT ARRAY_AGG(org_id) FROM public.org_members WHERE user_id = auth.uid();
$$;

-- ============================================================================
-- 23) ROW LEVEL SECURITY POLICIES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.org_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dashboards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_catalog ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.org_companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.source_feeds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.industry_topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ingested_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_texts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_extractions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kpi_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kpi_values ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.briefings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_prefs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_jobs ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view all profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);

-- Organizations policies
CREATE POLICY "Org members can view their organizations" ON public.organizations FOR SELECT USING (public.is_org_member(id));
CREATE POLICY "Org members can update their organizations" ON public.organizations FOR UPDATE USING (public.is_org_member(id));
CREATE POLICY "Users can create organizations" ON public.organizations FOR INSERT WITH CHECK (true);

-- Org members policies
CREATE POLICY "Users can view org memberships" ON public.org_members FOR SELECT USING (public.is_org_member(org_id) OR user_id = auth.uid());
CREATE POLICY "Users can insert org memberships" ON public.org_members FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update org memberships" ON public.org_members FOR UPDATE USING (public.is_org_member(org_id));

-- Dashboards policies
CREATE POLICY "Org members can view org dashboards" ON public.dashboards FOR SELECT USING (public.is_org_member(org_id));
CREATE POLICY "Users can create dashboards in their orgs" ON public.dashboards FOR INSERT WITH CHECK (public.is_org_member(org_id) AND owner_id = auth.uid());
CREATE POLICY "Dashboard owners can update their dashboards" ON public.dashboards FOR UPDATE USING (owner_id = auth.uid() AND public.is_org_member(org_id));
CREATE POLICY "Dashboard owners can delete their dashboards" ON public.dashboards FOR DELETE USING (owner_id = auth.uid() AND public.is_org_member(org_id));

-- Card templates policies (public read)
CREATE POLICY "Anyone can view card templates" ON public.card_templates FOR SELECT USING (true);

-- Cards policies
CREATE POLICY "Org members can view org cards" ON public.cards FOR SELECT USING (public.is_org_member(org_id));
CREATE POLICY "Org members can insert cards in their orgs" ON public.cards FOR INSERT WITH CHECK (public.is_org_member(org_id));
CREATE POLICY "Org members can update cards in their orgs" ON public.cards FOR UPDATE USING (public.is_org_member(org_id));
CREATE POLICY "Org members can delete cards in their orgs" ON public.cards FOR DELETE USING (public.is_org_member(org_id));

-- Company catalog policies (public read for discovery)
CREATE POLICY "Anyone can view company catalog" ON public.company_catalog FOR SELECT USING (true);
CREATE POLICY "Authenticated users can insert companies" ON public.company_catalog FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Org companies policies
CREATE POLICY "Org members can view org companies" ON public.org_companies FOR SELECT USING (public.is_org_member(org_id));
CREATE POLICY "Org members can manage org companies" ON public.org_companies FOR ALL USING (public.is_org_member(org_id));

-- Source feeds policies
CREATE POLICY "Org members can view source feeds" ON public.source_feeds 
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.org_companies WHERE id = competitor_id AND public.is_org_member(org_id))
  );
CREATE POLICY "Org members can manage source feeds" ON public.source_feeds 
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.org_companies WHERE id = competitor_id AND public.is_org_member(org_id))
  );

-- Industry topics policies
CREATE POLICY "Org members can view org industry topics" ON public.industry_topics FOR SELECT USING (public.is_org_member(org_id));
CREATE POLICY "Org members can manage org industry topics" ON public.industry_topics FOR ALL USING (public.is_org_member(org_id));

-- Ingested items policies
CREATE POLICY "Org members can view org ingested items" ON public.ingested_items FOR SELECT USING (public.is_org_member(org_id));
CREATE POLICY "Org members can manage org ingested items" ON public.ingested_items FOR ALL USING (public.is_org_member(org_id));

-- Documents policies
CREATE POLICY "Org members can view org documents" ON public.documents FOR SELECT USING (public.is_org_member(org_id));
CREATE POLICY "Org members can upload documents to their orgs" ON public.documents FOR INSERT WITH CHECK (public.is_org_member(org_id) AND uploader_id = auth.uid());
CREATE POLICY "Document uploaders can update their documents" ON public.documents FOR UPDATE USING (uploader_id = auth.uid() AND public.is_org_member(org_id));

-- Document texts and extractions policies
CREATE POLICY "Org members can view document texts" ON public.document_texts 
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.documents WHERE id = document_id AND public.is_org_member(org_id))
  );
CREATE POLICY "Org members can manage document texts" ON public.document_texts 
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.documents WHERE id = document_id AND public.is_org_member(org_id))
  );

CREATE POLICY "Org members can view document extractions" ON public.document_extractions 
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.documents WHERE id = document_id AND public.is_org_member(org_id))
  );
CREATE POLICY "Org members can manage document extractions" ON public.document_extractions 
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.documents WHERE id = document_id AND public.is_org_member(org_id))
  );

-- KPI policies
CREATE POLICY "Org members can view org KPI definitions" ON public.kpi_definitions FOR SELECT USING (public.is_org_member(org_id));
CREATE POLICY "Org members can manage org KPI definitions" ON public.kpi_definitions FOR ALL USING (public.is_org_member(org_id));

CREATE POLICY "Org members can view org KPI values" ON public.kpi_values FOR SELECT USING (public.is_org_member(org_id));
CREATE POLICY "Org members can manage org KPI values" ON public.kpi_values FOR ALL USING (public.is_org_member(org_id));

-- Briefings policies
CREATE POLICY "Users can view their org briefings" ON public.briefings FOR SELECT USING (user_id = auth.uid() AND public.is_org_member(org_id));
CREATE POLICY "Users can manage their org briefings" ON public.briefings FOR ALL USING (user_id = auth.uid() AND public.is_org_member(org_id));

-- Exports policies
CREATE POLICY "Users can view their org exports" ON public.exports FOR SELECT USING (user_id = auth.uid() AND public.is_org_member(org_id));
CREATE POLICY "Users can create exports in their orgs" ON public.exports FOR INSERT WITH CHECK (user_id = auth.uid() AND public.is_org_member(org_id));

-- Notification preferences policies
CREATE POLICY "Users can manage their own notification prefs" ON public.notification_prefs FOR ALL USING (user_id = auth.uid());

-- AI jobs policies
CREATE POLICY "Org members can view org AI jobs" ON public.ai_jobs FOR SELECT USING (public.is_org_member(org_id));
CREATE POLICY "Org members can manage org AI jobs" ON public.ai_jobs FOR ALL USING (public.is_org_member(org_id));

-- ============================================================================
-- 24) STORAGE POLICIES
-- ============================================================================

-- Uploads bucket policies
CREATE POLICY "Org members can upload files to their org folder" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'uploads' 
    AND (storage.foldername(name))[1] IN (
      SELECT org_id::text FROM public.org_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Org members can view files from their org folder" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'uploads' 
    AND (storage.foldername(name))[1] IN (
      SELECT org_id::text FROM public.org_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Org members can update files in their org folder" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'uploads' 
    AND (storage.foldername(name))[1] IN (
      SELECT org_id::text FROM public.org_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Org members can delete files from their org folder" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'uploads' 
    AND (storage.foldername(name))[1] IN (
      SELECT org_id::text FROM public.org_members WHERE user_id = auth.uid()
    )
  );

-- Exports bucket policies (similar pattern)
CREATE POLICY "Users can create exports in their org folder" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'exports' 
    AND (storage.foldername(name))[1] IN (
      SELECT org_id::text FROM public.org_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can view exports from their org folder" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'exports' 
    AND (storage.foldername(name))[1] IN (
      SELECT org_id::text FROM public.org_members WHERE user_id = auth.uid()
    )
  );

-- ============================================================================
-- 25) INDEXES for Performance
-- ============================================================================

-- Cards index for dashboard performance
CREATE INDEX idx_cards_org_dashboard_position ON public.cards(org_id, dashboard_id, position);

-- Ingested items indexes for feed performance
CREATE INDEX idx_ingested_items_org_competitor_published ON public.ingested_items(org_id, competitor_id, published_at DESC);
CREATE INDEX idx_ingested_items_org_topic_published ON public.ingested_items(org_id, industry_topic_id, published_at DESC);

-- KPI values index for time-series queries
CREATE INDEX idx_kpi_values_org_kpi_period ON public.kpi_values(org_id, kpi_id, period DESC);

-- Briefings index for date-based queries
CREATE INDEX idx_briefings_org_date ON public.briefings(org_id, for_date DESC);

-- AI jobs index for queue processing
CREATE INDEX idx_ai_jobs_org_status_created ON public.ai_jobs(org_id, status, created_at DESC);

-- Org members index for RLS performance
CREATE INDEX idx_org_members_user_id ON public.org_members(user_id);

-- ============================================================================
-- 26) TRIGGERS for automatic profile creation
-- ============================================================================

-- Function to handle new user profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name)
  VALUES (NEW.id, NEW.raw_user_meta_data ->> 'full_name');
  
  -- Insert default notification preferences
  INSERT INTO public.notification_prefs (user_id)
  VALUES (NEW.id);
  
  RETURN NEW;
END;
$$;

-- Trigger to create profile when user signs up
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;