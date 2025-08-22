-- Single-User Refactor: Remove organizations and scope everything to user_id

-- Drop existing tables and constraints that depend on organizations
DROP TABLE IF EXISTS public.org_members CASCADE;
DROP TABLE IF EXISTS public.organizations CASCADE;

-- Update existing tables to use user_id instead of org_id
-- First, add user_id columns where needed and populate them

-- Add user_id to companies and populate from org_members (if data exists)
ALTER TABLE public.companies 
ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

-- Add user_id to topics  
ALTER TABLE public.topics 
ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

-- Add user_id to feeds
ALTER TABLE public.feeds 
ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

-- Add user_id to items
ALTER TABLE public.items 
ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

-- Add user_id to documents  
ALTER TABLE public.documents 
ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

-- Add user_id to kpis
ALTER TABLE public.kpis 
ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

-- Add user_id to kpi_points
ALTER TABLE public.kpi_points 
ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

-- Add user_id to cards
ALTER TABLE public.cards 
ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

-- Update dashboards to use user_id instead of owner_id (rename column)
ALTER TABLE public.dashboards 
RENAME COLUMN owner_id TO user_id;

-- Drop old org_id columns after adding user_id
ALTER TABLE public.companies DROP COLUMN IF EXISTS org_id;
ALTER TABLE public.topics DROP COLUMN IF EXISTS org_id;  
ALTER TABLE public.feeds DROP COLUMN IF EXISTS org_id;
ALTER TABLE public.items DROP COLUMN IF EXISTS org_id;
ALTER TABLE public.documents DROP COLUMN IF EXISTS org_id;
ALTER TABLE public.kpis DROP COLUMN IF EXISTS org_id;
ALTER TABLE public.kpi_points DROP COLUMN IF EXISTS org_id;
ALTER TABLE public.cards DROP COLUMN IF EXISTS org_id;

-- Make user_id columns NOT NULL
ALTER TABLE public.companies ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE public.topics ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE public.feeds ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE public.items ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE public.documents ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE public.kpis ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE public.kpi_points ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE public.cards ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE public.dashboards ALTER COLUMN user_id SET NOT NULL;

-- Update documents table - rename uploader_id to user_id if exists
ALTER TABLE public.documents DROP COLUMN IF EXISTS uploader_id;

-- Add unique constraints for user-scoped data
ALTER TABLE public.kpis ADD CONSTRAINT unique_user_kpi_name UNIQUE (user_id, name);
ALTER TABLE public.kpi_points ADD CONSTRAINT unique_user_kpi_period UNIQUE (user_id, kpi_id, period);
ALTER TABLE public.items ADD CONSTRAINT unique_user_item_source UNIQUE (user_id, company_id, topic_id, source_kind, source_id);

-- Drop old RLS policies
DROP POLICY IF EXISTS "Users can view org companies" ON public.companies;
DROP POLICY IF EXISTS "Users can insert org companies" ON public.companies;
DROP POLICY IF EXISTS "Users can update org companies" ON public.companies;
DROP POLICY IF EXISTS "Users can delete org companies" ON public.companies;

DROP POLICY IF EXISTS "Users can view org topics" ON public.topics;
DROP POLICY IF EXISTS "Users can insert org topics" ON public.topics;
DROP POLICY IF EXISTS "Users can update org topics" ON public.topics;
DROP POLICY IF EXISTS "Users can delete org topics" ON public.topics;

DROP POLICY IF EXISTS "Users can view org feeds" ON public.feeds;
DROP POLICY IF EXISTS "Users can insert org feeds" ON public.feeds;
DROP POLICY IF EXISTS "Users can update org feeds" ON public.feeds;
DROP POLICY IF EXISTS "Users can delete org feeds" ON public.feeds;

DROP POLICY IF EXISTS "Users can view org items" ON public.items;
DROP POLICY IF EXISTS "Users can insert org items" ON public.items;

DROP POLICY IF EXISTS "Users can view org documents" ON public.documents;
DROP POLICY IF EXISTS "Users can insert org documents" ON public.documents;
DROP POLICY IF EXISTS "Users can update org documents" ON public.documents;

DROP POLICY IF EXISTS "Users can view org kpis" ON public.kpis;
DROP POLICY IF EXISTS "Users can insert org kpis" ON public.kpis;
DROP POLICY IF EXISTS "Users can update org kpis" ON public.kpis;
DROP POLICY IF EXISTS "Users can delete org kpis" ON public.kpis;

DROP POLICY IF EXISTS "Users can view org kpi_points" ON public.kpi_points;
DROP POLICY IF EXISTS "Users can insert org kpi_points" ON public.kpi_points;
DROP POLICY IF EXISTS "Users can update org kpi_points" ON public.kpi_points;
DROP POLICY IF EXISTS "Users can delete org kpi_points" ON public.kpi_points;

DROP POLICY IF EXISTS "Users can view org cards" ON public.cards;
DROP POLICY IF EXISTS "Users can insert org cards" ON public.cards;
DROP POLICY IF EXISTS "Users can update org cards" ON public.cards;
DROP POLICY IF EXISTS "Users can delete org cards" ON public.cards;

DROP POLICY IF EXISTS "Users can view org dashboards" ON public.dashboards;
DROP POLICY IF EXISTS "Users can insert org dashboards" ON public.dashboards;
DROP POLICY IF EXISTS "Users can create dashboards in their org" ON public.dashboards;
DROP POLICY IF EXISTS "Users can update own dashboards" ON public.dashboards;

DROP POLICY IF EXISTS "Users can view org document texts" ON public.document_texts;
DROP POLICY IF EXISTS "Users can insert org document texts" ON public.document_texts;

DROP POLICY IF EXISTS "Users can join organizations during onboarding" ON public.org_members;
DROP POLICY IF EXISTS "Users can view org members" ON public.org_members;
DROP POLICY IF EXISTS "Users can insert org members" ON public.org_members;

DROP POLICY IF EXISTS "Users can view their organizations" ON public.organizations;
DROP POLICY IF EXISTS "Users can update their organizations" ON public.organizations;
DROP POLICY IF EXISTS "Authenticated users can create organizations" ON public.organizations;

DROP POLICY IF EXISTS "Users can create cards in their dashboards" ON public.cards;

-- Create new user-based RLS policies
-- Companies
CREATE POLICY "Users can view own companies" ON public.companies
    FOR SELECT TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own companies" ON public.companies
    FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own companies" ON public.companies
    FOR UPDATE TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own companies" ON public.companies
    FOR DELETE TO authenticated
    USING (auth.uid() = user_id);

-- Topics
CREATE POLICY "Users can view own topics" ON public.topics
    FOR SELECT TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own topics" ON public.topics
    FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own topics" ON public.topics
    FOR UPDATE TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own topics" ON public.topics
    FOR DELETE TO authenticated
    USING (auth.uid() = user_id);

-- Feeds
CREATE POLICY "Users can view own feeds" ON public.feeds
    FOR SELECT TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own feeds" ON public.feeds
    FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own feeds" ON public.feeds
    FOR UPDATE TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own feeds" ON public.feeds
    FOR DELETE TO authenticated
    USING (auth.uid() = user_id);

-- Items
CREATE POLICY "Users can view own items" ON public.items
    FOR SELECT TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own items" ON public.items
    FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = user_id);

-- Documents
CREATE POLICY "Users can view own documents" ON public.documents
    FOR SELECT TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own documents" ON public.documents
    FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own documents" ON public.documents
    FOR UPDATE TO authenticated
    USING (auth.uid() = user_id);

-- KPIs
CREATE POLICY "Users can view own kpis" ON public.kpis
    FOR SELECT TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own kpis" ON public.kpis
    FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own kpis" ON public.kpis
    FOR UPDATE TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own kpis" ON public.kpis
    FOR DELETE TO authenticated
    USING (auth.uid() = user_id);

-- KPI Points
CREATE POLICY "Users can view own kpi_points" ON public.kpi_points
    FOR SELECT TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own kpi_points" ON public.kpi_points
    FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own kpi_points" ON public.kpi_points
    FOR UPDATE TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own kpi_points" ON public.kpi_points
    FOR DELETE TO authenticated
    USING (auth.uid() = user_id);

-- Cards
CREATE POLICY "Users can view own cards" ON public.cards
    FOR SELECT TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own cards" ON public.cards
    FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own cards" ON public.cards
    FOR UPDATE TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own cards" ON public.cards
    FOR DELETE TO authenticated
    USING (auth.uid() = user_id);

-- Dashboards
CREATE POLICY "Users can view own dashboards" ON public.dashboards
    FOR SELECT TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own dashboards" ON public.dashboards
    FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own dashboards" ON public.dashboards
    FOR UPDATE TO authenticated
    USING (auth.uid() = user_id);

-- Document texts
CREATE POLICY "Users can view own document texts" ON public.document_texts
    FOR SELECT TO authenticated
    USING (EXISTS (
        SELECT 1 FROM public.documents d
        WHERE d.id = document_texts.document_id 
        AND d.user_id = auth.uid()
    ));

CREATE POLICY "Users can insert own document texts" ON public.document_texts
    FOR INSERT TO authenticated
    WITH CHECK (EXISTS (
        SELECT 1 FROM public.documents d
        WHERE d.id = document_texts.document_id 
        AND d.user_id = auth.uid()
    ));

-- Drop the old is_org_member function since we no longer need it
DROP FUNCTION IF EXISTS public.is_org_member(uuid);

-- Update the prune_old_items function to work with user_id
CREATE OR REPLACE FUNCTION public.prune_old_items()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
  -- Prune items for companies (keep latest 200 per user/company)
  DELETE FROM public.items 
  WHERE id IN (
    SELECT id FROM (
      SELECT id,
             ROW_NUMBER() OVER (
               PARTITION BY user_id, company_id 
               ORDER BY published_at DESC
             ) as rn
      FROM public.items 
      WHERE company_id IS NOT NULL
    ) ranked
    WHERE rn > 200
  );

  -- Prune items for topics (keep latest 200 per user/topic)
  DELETE FROM public.items 
  WHERE id IN (
    SELECT id FROM (
      SELECT id,
             ROW_NUMBER() OVER (
               PARTITION BY user_id, topic_id 
               ORDER BY published_at DESC
             ) as rn
      FROM public.items 
      WHERE topic_id IS NOT NULL
    ) ranked
    WHERE rn > 200
  );

  -- Log the pruning operation
  RAISE NOTICE 'Items pruning completed at %', now();
END;
$function$;