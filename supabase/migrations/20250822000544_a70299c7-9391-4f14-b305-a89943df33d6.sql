-- Single-User Refactor: Phase 2 - Update table structure

-- Add user_id columns where needed
ALTER TABLE public.companies 
ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.topics 
ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.feeds 
ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.items 
ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.documents 
ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.kpis 
ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.kpi_points 
ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.cards 
ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

-- Update dashboards to use user_id instead of owner_id (rename column)
ALTER TABLE public.dashboards 
RENAME COLUMN owner_id TO user_id;

-- Drop old org_id columns
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

-- Update documents table - remove uploader_id as we now use user_id
ALTER TABLE public.documents DROP COLUMN IF EXISTS uploader_id;

-- Add unique constraints for user-scoped data
ALTER TABLE public.kpis ADD CONSTRAINT unique_user_kpi_name UNIQUE (user_id, name);
ALTER TABLE public.kpi_points ADD CONSTRAINT unique_user_kpi_period UNIQUE (user_id, kpi_id, period);
ALTER TABLE public.items ADD CONSTRAINT unique_user_item_source UNIQUE (user_id, company_id, topic_id, source_kind, source_id);