-- Enable pg_cron extension for scheduled jobs
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Create function to prune old items (keep latest 200 per company/topic)
CREATE OR REPLACE FUNCTION public.prune_old_items()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Prune items for companies (keep latest 200 per org/company)
  DELETE FROM public.items 
  WHERE id IN (
    SELECT id FROM (
      SELECT id,
             ROW_NUMBER() OVER (
               PARTITION BY org_id, company_id 
               ORDER BY published_at DESC
             ) as rn
      FROM public.items 
      WHERE company_id IS NOT NULL
    ) ranked
    WHERE rn > 200
  );

  -- Prune items for topics (keep latest 200 per org/topic)
  DELETE FROM public.items 
  WHERE id IN (
    SELECT id FROM (
      SELECT id,
             ROW_NUMBER() OVER (
               PARTITION BY org_id, topic_id 
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
$$;

-- Schedule the pruning job to run daily at 2 AM UTC
SELECT cron.schedule(
  'prune-old-items',
  '0 2 * * *',
  'SELECT public.prune_old_items();'
);