-- Remove org_id from dashboards table since we're using a single-user approach
ALTER TABLE public.dashboards DROP COLUMN org_id;

-- Update the default value for name to be more descriptive
ALTER TABLE public.dashboards ALTER COLUMN name SET DEFAULT 'Personal Dashboard';