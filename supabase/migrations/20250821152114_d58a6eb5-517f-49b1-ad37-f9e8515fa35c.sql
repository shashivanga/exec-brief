-- ============================================================================
-- COMPREHENSIVE DATABASE SCHEMA IMPLEMENTATION (FINAL)
-- Multi-org tenancy, per-user dashboards, competitor/industry news, documents/KPIs
-- ============================================================================

-- ============================================================================
-- 1) USERS & ORGANIZATIONS (TENANCY)
-- ============================================================================

-- profiles table (app-facing profile data)
CREATE TABLE IF NOT EXISTS public.profiles (
  user_id UUID PRIMARY KEY,
  full_name TEXT,
  avatar_url TEXT,
  timezone TEXT DEFAULT 'America/New_York',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- organizations table (tenant/company with branding)
CREATE TABLE IF NOT EXISTS public.organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  plan TEXT DEFAULT 'free',
  branding JSONB DEFAULT '{"logo_url": null, "primary_color": null, "secondary_color": null, "pdf_header_text": null}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- org_members table (connects users to orgs)
CREATE TABLE IF NOT EXISTS public.org_members (
  org_id UUID NOT NULL,
  user_id UUID NOT NULL,
  role TEXT DEFAULT 'member',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  PRIMARY KEY (org_id, user_id)
);

-- ============================================================================
-- 2) DASHBOARDS & CARDS (PER-USER, SHAREABLE LATER)
-- ============================================================================

-- dashboards table (user's workspace within an org)
CREATE TABLE IF NOT EXISTS public.dashboards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL,
  owner_id UUID NOT NULL,
  name TEXT DEFAULT 'Main',
  is_default BOOLEAN DEFAULT true,
  is_shared BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- card_templates table (canonical card definitions)
CREATE TABLE IF NOT EXISTS public.card_templates (
  key TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL,
  schema JSONB
);

-- cards table (concrete card instances on dashboards)
CREATE TABLE IF NOT EXISTS public.cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL,
  dashboard_id UUID NOT NULL,
  template_key TEXT NOT NULL,
  title TEXT,
  size TEXT DEFAULT 'm' CHECK (size IN ('s', 'm', 'l')),
  position INTEGER NOT NULL,
  pinned BOOLEAN DEFAULT false,
  hidden BOOLEAN DEFAULT false,
  data JSONB DEFAULT '{}'::jsonb,
  sources JSONB DEFAULT '[]'::jsonb,
  refreshed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- ============================================================================
-- 3) COMPANY CATALOG & ORG SELECTIONS (COMPETITORS: PUBLIC + PRIVATE)
-- ============================================================================

-- company_catalog table (global canonical companies)
CREATE TABLE IF NOT EXISTS public.company_catalog (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  ticker TEXT,
  domain TEXT,
  aliases TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- org_companies table (companies an org actively tracks)
CREATE TABLE IF NOT EXISTS public.org_companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL,
  company_id UUID NOT NULL,
  label TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  UNIQUE(org_id, company_id)
);

-- source_feeds table (ingestion endpoints per org-company)
CREATE TABLE IF NOT EXISTS public.source_feeds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  competitor_id UUID NOT NULL,
  kind TEXT NOT NULL CHECK (kind IN ('news', 'rss', 'sec', 'financials')),
  url TEXT NOT NULL,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- ============================================================================
-- 4) INDUSTRY TOPICS (NON-COMPANY NEWS)
-- ============================================================================

-- industry_topics table (topics/keywords an org tracks)
CREATE TABLE IF NOT EXISTS public.industry_topics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL,
  name TEXT NOT NULL,
  queries TEXT[] NOT NULL,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- ============================================================================
-- 5) INGESTION CACHE (NEWS/RSS → CARDS, WITH RETENTION POLICY)
-- ============================================================================

-- ingested_items table (normalized cache of fetched items)
CREATE TABLE IF NOT EXISTS public.ingested_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL,
  competitor_id UUID,
  industry_topic_id UUID,
  source_kind TEXT NOT NULL CHECK (source_kind IN ('news', 'rss', 'sec', 'financials')),
  source_id TEXT NOT NULL,
  title TEXT NOT NULL,
  url TEXT NOT NULL,
  published_at TIMESTAMP WITH TIME ZONE NOT NULL,
  summary TEXT,
  raw JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- ============================================================================
-- 6) DOCUMENTS & KPIS (UPLOADS AND STRUCTURED METRICS)
-- ============================================================================

-- documents table (tracks uploaded files in storage)
CREATE TABLE IF NOT EXISTS public.documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL,
  uploader_id UUID NOT NULL,
  storage_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  kind TEXT NOT NULL CHECK (kind IN ('pdf', 'docx', 'pptx', 'xlsx')),
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  status TEXT DEFAULT 'stored' CHECK (status IN ('stored', 'parsed', 'error'))
);

-- document_texts table (extracted raw text)
CREATE TABLE IF NOT EXISTS public.document_texts (
  document_id UUID PRIMARY KEY,
  page_count INTEGER,
  text TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- document_extractions table (heuristic/AI outputs)
CREATE TABLE IF NOT EXISTS public.document_extractions (
  document_id UUID PRIMARY KEY,
  method TEXT NOT NULL CHECK (method IN ('heuristic', 'ai')),
  bullets JSONB DEFAULT '[]'::jsonb,
  entities JSONB DEFAULT '{}'::jsonb,
  kpis JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- kpi_definitions table (canonical KPIs per org)
CREATE TABLE IF NOT EXISTS public.kpi_definitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL,
  name TEXT NOT NULL,
  unit TEXT NOT NULL CHECK (unit IN ('$', '$M', '%', 'count')),
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  UNIQUE(org_id, name)
);

-- kpi_values table (time-series values for each KPI)
CREATE TABLE IF NOT EXISTS public.kpi_values (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL,
  kpi_id UUID NOT NULL,
  period DATE NOT NULL,
  value NUMERIC NOT NULL,
  source_document_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  UNIQUE(org_id, kpi_id, period)
);

-- ============================================================================
-- 7) BRIEFINGS, EXPORTS, NOTIFICATIONS (DAILY EXECUTIVE FLOW & BRANDING)
-- ============================================================================

-- briefings table (saved "morning briefing" sets)
CREATE TABLE IF NOT EXISTS public.briefings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL,
  user_id UUID NOT NULL,
  for_date DATE NOT NULL,
  card_ids UUID[] NOT NULL,
  generated_by TEXT NOT NULL CHECK (generated_by IN ('heuristic', 'ai')),
  sent_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  UNIQUE(org_id, user_id, for_date)
);

-- exports table (records of rendered PDFs)
CREATE TABLE IF NOT EXISTS public.exports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL,
  user_id UUID NOT NULL,
  kind TEXT NOT NULL CHECK (kind = 'dashboard_pdf'),
  storage_path TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- notification_prefs table (email digest preferences per user)
CREATE TABLE IF NOT EXISTS public.notification_prefs (
  user_id UUID PRIMARY KEY,
  daily_digest_enabled BOOLEAN DEFAULT true,
  digest_hour_utc INTEGER DEFAULT 12
);

-- ============================================================================
-- 8) AI JOBS (FUTURE-PROOFING)
-- ============================================================================

-- ai_jobs table (provider-agnostic queue for AI tasks)
CREATE TABLE IF NOT EXISTS public.ai_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL,
  job TEXT NOT NULL CHECK (job IN ('summarize', 'classify', 'flag_risks', 'embed')),
  input_ref_type TEXT NOT NULL CHECK (input_ref_type IN ('document', 'card', 'kpi_set')),
  input_ref_id UUID NOT NULL,
  provider TEXT,
  model TEXT,
  status TEXT DEFAULT 'queued' CHECK (status IN ('queued', 'processing', 'done', 'error')),
  output JSONB DEFAULT '{}'::jsonb,
  error TEXT,
  cost_usd NUMERIC DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  completed_at TIMESTAMP WITH TIME ZONE
);

-- ============================================================================
-- 9) STORAGE BUCKETS (PRIVATE)
-- ============================================================================

-- Create storage buckets if they don't exist
DO $$
BEGIN
  -- Create uploads bucket if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'uploads') THEN
    INSERT INTO storage.buckets (id, name, public) VALUES ('uploads', 'uploads', false);
  END IF;
  
  -- Create exports bucket if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'exports') THEN
    INSERT INTO storage.buckets (id, name, public) VALUES ('exports', 'exports', false);
  END IF;
END $$;

-- ============================================================================
-- 10) HELPER FUNCTIONS
-- ============================================================================

-- Helper function to check org membership
CREATE OR REPLACE FUNCTION public.is_org_member(org_uuid UUID)
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.org_members 
    WHERE org_id = org_uuid AND user_id = auth.uid()
  );
$$;

-- Helper function to get user's orgs
CREATE OR REPLACE FUNCTION public.get_user_orgs()
RETURNS UUID[]
LANGUAGE SQL
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT ARRAY_AGG(org_id) FROM public.org_members WHERE user_id = auth.uid();
$$;

-- Function to handle new user registration
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

-- Function to update updated_at columns
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- ============================================================================
-- 11) TRIGGERS
-- ============================================================================

-- Trigger for new user registration
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- ============================================================================
-- 12) ROW-LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.org_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dashboards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.card_templates ENABLE ROW LEVEL SECURITY;
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

-- Drop existing policies first to avoid conflicts
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can create organizations" ON public.organizations;
DROP POLICY IF EXISTS "Org members can view their organizations" ON public.organizations;
DROP POLICY IF EXISTS "Org members can update their organizations" ON public.organizations;
DROP POLICY IF EXISTS "Users can insert org memberships" ON public.org_members;
DROP POLICY IF EXISTS "Users can view org memberships" ON public.org_members;
DROP POLICY IF EXISTS "Users can update org memberships" ON public.org_members;
DROP POLICY IF EXISTS "Anyone can view card templates" ON public.card_templates;
DROP POLICY IF EXISTS "Users can create dashboards in their orgs" ON public.dashboards;
DROP POLICY IF EXISTS "Org members can view org dashboards" ON public.dashboards;
DROP POLICY IF EXISTS "Dashboard owners can update their dashboards" ON public.dashboards;
DROP POLICY IF EXISTS "Dashboard owners can delete their dashboards" ON public.dashboards;
DROP POLICY IF EXISTS "Org members can view org cards" ON public.cards;
DROP POLICY IF EXISTS "Org members can insert cards in their orgs" ON public.cards;
DROP POLICY IF EXISTS "Org members can update cards in their orgs" ON public.cards;
DROP POLICY IF EXISTS "Org members can delete cards in their orgs" ON public.cards;

-- Profiles policies
CREATE POLICY "Users can view all profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);

-- Organizations policies
CREATE POLICY "Users can create organizations" ON public.organizations FOR INSERT WITH CHECK (true);
CREATE POLICY "Org members can view their organizations" ON public.organizations FOR SELECT USING (is_org_member(id));
CREATE POLICY "Org members can update their organizations" ON public.organizations FOR UPDATE USING (is_org_member(id));

-- Org members policies
CREATE POLICY "Users can insert org memberships" ON public.org_members FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can view org memberships" ON public.org_members FOR SELECT USING (is_org_member(org_id) OR user_id = auth.uid());
CREATE POLICY "Users can update org memberships" ON public.org_members FOR UPDATE USING (is_org_member(org_id));

-- Card templates policies (universally readable)
CREATE POLICY "Anyone can view card templates" ON public.card_templates FOR SELECT USING (true);

-- Dashboards policies
CREATE POLICY "Users can create dashboards in their orgs" ON public.dashboards FOR INSERT WITH CHECK (is_org_member(org_id) AND owner_id = auth.uid());
CREATE POLICY "Org members can view org dashboards" ON public.dashboards FOR SELECT USING (is_org_member(org_id));
CREATE POLICY "Dashboard owners can update their dashboards" ON public.dashboards FOR UPDATE USING (owner_id = auth.uid() AND is_org_member(org_id));
CREATE POLICY "Dashboard owners can delete their dashboards" ON public.dashboards FOR DELETE USING (owner_id = auth.uid() AND is_org_member(org_id));

-- Cards policies
CREATE POLICY "Org members can view org cards" ON public.cards FOR SELECT USING (is_org_member(org_id));
CREATE POLICY "Org members can insert cards in their orgs" ON public.cards FOR INSERT WITH CHECK (is_org_member(org_id));
CREATE POLICY "Org members can update cards in their orgs" ON public.cards FOR UPDATE USING (is_org_member(org_id));
CREATE POLICY "Org members can delete cards in their orgs" ON public.cards FOR DELETE USING (is_org_member(org_id));

-- Company catalog policies
DROP POLICY IF EXISTS "Anyone can view company catalog" ON public.company_catalog;
DROP POLICY IF EXISTS "Authenticated users can insert companies" ON public.company_catalog;
CREATE POLICY "Anyone can view company catalog" ON public.company_catalog FOR SELECT USING (true);
CREATE POLICY "Authenticated users can insert companies" ON public.company_catalog FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Org companies policies
DROP POLICY IF EXISTS "Org members can view org companies" ON public.org_companies;
DROP POLICY IF EXISTS "Org members can manage org companies" ON public.org_companies;
CREATE POLICY "Org members can view org companies" ON public.org_companies FOR SELECT USING (is_org_member(org_id));
CREATE POLICY "Org members can manage org companies" ON public.org_companies FOR ALL USING (is_org_member(org_id));

-- Source feeds policies
DROP POLICY IF EXISTS "Org members can view source feeds" ON public.source_feeds;
DROP POLICY IF EXISTS "Org members can manage source feeds" ON public.source_feeds;
CREATE POLICY "Org members can view source feeds" ON public.source_feeds FOR SELECT USING (
  EXISTS (SELECT 1 FROM org_companies WHERE org_companies.id = source_feeds.competitor_id AND is_org_member(org_companies.org_id))
);
CREATE POLICY "Org members can manage source feeds" ON public.source_feeds FOR ALL USING (
  EXISTS (SELECT 1 FROM org_companies WHERE org_companies.id = source_feeds.competitor_id AND is_org_member(org_companies.org_id))
);

-- Industry topics policies
DROP POLICY IF EXISTS "Org members can view org industry topics" ON public.industry_topics;
DROP POLICY IF EXISTS "Org members can manage org industry topics" ON public.industry_topics;
CREATE POLICY "Org members can view org industry topics" ON public.industry_topics FOR SELECT USING (is_org_member(org_id));
CREATE POLICY "Org members can manage org industry topics" ON public.industry_topics FOR ALL USING (is_org_member(org_id));

-- Ingested items policies
DROP POLICY IF EXISTS "Org members can view org ingested items" ON public.ingested_items;
DROP POLICY IF EXISTS "Org members can manage org ingested items" ON public.ingested_items;
CREATE POLICY "Org members can view org ingested items" ON public.ingested_items FOR SELECT USING (is_org_member(org_id));
CREATE POLICY "Org members can manage org ingested items" ON public.ingested_items FOR ALL USING (is_org_member(org_id));

-- Documents policies
DROP POLICY IF EXISTS "Org members can view org documents" ON public.documents;
DROP POLICY IF EXISTS "Org members can upload documents to their orgs" ON public.documents;
DROP POLICY IF EXISTS "Document uploaders can update their documents" ON public.documents;
CREATE POLICY "Org members can view org documents" ON public.documents FOR SELECT USING (is_org_member(org_id));
CREATE POLICY "Org members can upload documents to their orgs" ON public.documents FOR INSERT WITH CHECK (is_org_member(org_id) AND uploader_id = auth.uid());
CREATE POLICY "Document uploaders can update their documents" ON public.documents FOR UPDATE USING (uploader_id = auth.uid() AND is_org_member(org_id));

-- Document texts policies
DROP POLICY IF EXISTS "Org members can view document texts" ON public.document_texts;
DROP POLICY IF EXISTS "Org members can manage document texts" ON public.document_texts;
CREATE POLICY "Org members can view document texts" ON public.document_texts FOR SELECT USING (
  EXISTS (SELECT 1 FROM documents WHERE documents.id = document_texts.document_id AND is_org_member(documents.org_id))
);
CREATE POLICY "Org members can manage document texts" ON public.document_texts FOR ALL USING (
  EXISTS (SELECT 1 FROM documents WHERE documents.id = document_texts.document_id AND is_org_member(documents.org_id))
);

-- Document extractions policies
DROP POLICY IF EXISTS "Org members can view document extractions" ON public.document_extractions;
DROP POLICY IF EXISTS "Org members can manage document extractions" ON public.document_extractions;
CREATE POLICY "Org members can view document extractions" ON public.document_extractions FOR SELECT USING (
  EXISTS (SELECT 1 FROM documents WHERE documents.id = document_extractions.document_id AND is_org_member(documents.org_id))
);
CREATE POLICY "Org members can manage document extractions" ON public.document_extractions FOR ALL USING (
  EXISTS (SELECT 1 FROM documents WHERE documents.id = document_extractions.document_id AND is_org_member(documents.org_id))
);

-- KPI definitions policies
DROP POLICY IF EXISTS "Org members can view org KPI definitions" ON public.kpi_definitions;
DROP POLICY IF EXISTS "Org members can manage org KPI definitions" ON public.kpi_definitions;
CREATE POLICY "Org members can view org KPI definitions" ON public.kpi_definitions FOR SELECT USING (is_org_member(org_id));
CREATE POLICY "Org members can manage org KPI definitions" ON public.kpi_definitions FOR ALL USING (is_org_member(org_id));

-- KPI values policies
DROP POLICY IF EXISTS "Org members can view org KPI values" ON public.kpi_values;
DROP POLICY IF EXISTS "Org members can manage org KPI values" ON public.kpi_values;
CREATE POLICY "Org members can view org KPI values" ON public.kpi_values FOR SELECT USING (is_org_member(org_id));
CREATE POLICY "Org members can manage org KPI values" ON public.kpi_values FOR ALL USING (is_org_member(org_id));

-- Briefings policies
DROP POLICY IF EXISTS "Users can view their org briefings" ON public.briefings;
DROP POLICY IF EXISTS "Users can manage their org briefings" ON public.briefings;
CREATE POLICY "Users can view their org briefings" ON public.briefings FOR SELECT USING (user_id = auth.uid() AND is_org_member(org_id));
CREATE POLICY "Users can manage their org briefings" ON public.briefings FOR ALL USING (user_id = auth.uid() AND is_org_member(org_id));

-- Exports policies
DROP POLICY IF EXISTS "Users can view their org exports" ON public.exports;
DROP POLICY IF EXISTS "Users can create exports in their orgs" ON public.exports;
CREATE POLICY "Users can view their org exports" ON public.exports FOR SELECT USING (user_id = auth.uid() AND is_org_member(org_id));
CREATE POLICY "Users can create exports in their orgs" ON public.exports FOR INSERT WITH CHECK (user_id = auth.uid() AND is_org_member(org_id));

-- Notification preferences policies
DROP POLICY IF EXISTS "Users can manage their own notification prefs" ON public.notification_prefs;
CREATE POLICY "Users can manage their own notification prefs" ON public.notification_prefs FOR ALL USING (user_id = auth.uid());

-- AI jobs policies
DROP POLICY IF EXISTS "Org members can view org AI jobs" ON public.ai_jobs;
DROP POLICY IF EXISTS "Org members can manage org AI jobs" ON public.ai_jobs;
CREATE POLICY "Org members can view org AI jobs" ON public.ai_jobs FOR SELECT USING (is_org_member(org_id));
CREATE POLICY "Org members can manage org AI jobs" ON public.ai_jobs FOR ALL USING (is_org_member(org_id));

-- ============================================================================
-- 13) PERFORMANCE INDEXES
-- ============================================================================

-- Key performance indexes (without CONCURRENTLY to work in transaction)
CREATE INDEX IF NOT EXISTS idx_cards_org_dashboard_position ON public.cards (org_id, dashboard_id, position);
CREATE INDEX IF NOT EXISTS idx_ingested_items_org_competitor_published ON public.ingested_items (org_id, competitor_id, published_at DESC);
CREATE INDEX IF NOT EXISTS idx_kpi_values_org_kpi_period ON public.kpi_values (org_id, kpi_id, period DESC);
CREATE INDEX IF NOT EXISTS idx_briefings_org_date ON public.briefings (org_id, for_date DESC);
CREATE INDEX IF NOT EXISTS idx_ai_jobs_org_status_created ON public.ai_jobs (org_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_org_members_user_id ON public.org_members (user_id);

-- Unique indexes for deduplication
CREATE UNIQUE INDEX IF NOT EXISTS idx_company_catalog_unique 
ON public.company_catalog (name, COALESCE(ticker, ''), COALESCE(domain, ''));

CREATE UNIQUE INDEX IF NOT EXISTS idx_ingested_items_unique
ON public.ingested_items (org_id, COALESCE(competitor_id, '00000000-0000-0000-0000-000000000000'::uuid), COALESCE(industry_topic_id, '00000000-0000-0000-0000-000000000000'::uuid), source_kind, source_id);

-- ============================================================================
-- 14) SEED DATA - CARD TEMPLATES
-- ============================================================================

-- Insert card templates for the application
INSERT INTO public.card_templates (key, title, description, type, schema) VALUES 
(
  'competitor_overview',
  'Competitor Overview',
  'Latest news and updates from tracked competitors',
  'news_feed',
  '{"fields": ["headlines", "sources", "summary"], "max_items": 5}'::jsonb
),
(
  'industry_news',
  'Industry News',
  'Broader industry trends and news',
  'news_feed',
  '{"fields": ["headlines", "sources", "summary"], "max_items": 5}'::jsonb
),
(
  'company_health',
  'Company Health',
  'Key performance indicators and metrics',
  'metrics',
  '{"fields": ["kpis", "trends", "alerts"], "chart_types": ["line", "bar"]}'::jsonb
),
(
  'product_metrics',
  'Product Metrics',
  'Product-specific KPIs and performance data',
  'metrics',
  '{"fields": ["kpis", "growth_rates", "comparisons"], "chart_types": ["line", "gauge"]}'::jsonb
),
(
  'macro_snapshot',
  'Macro Snapshot',
  'High-level economic and market indicators',
  'summary',
  '{"fields": ["indicators", "market_data", "summary"], "data_sources": ["external_apis"]}'::jsonb
),
(
  'ai_summary',
  'AI Summary',
  'AI-generated insights and summaries',
  'ai_generated',
  '{"fields": ["summary", "key_insights", "recommendations"], "ai_model": "configurable"}'::jsonb
)
ON CONFLICT (key) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  type = EXCLUDED.type,
  schema = EXCLUDED.schema;