-- Single-User Refactor: Phase 1 - Drop all policies and tables first

-- Drop all existing RLS policies that reference org_id
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

-- Drop the old is_org_member function since we no longer need it
DROP FUNCTION IF EXISTS public.is_org_member(uuid);

-- Drop organization-related tables
DROP TABLE IF EXISTS public.org_members CASCADE;
DROP TABLE IF EXISTS public.organizations CASCADE;