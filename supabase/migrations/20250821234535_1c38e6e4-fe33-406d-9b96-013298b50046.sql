-- Set up hourly RSS fetching and card refresh schedule
-- Fetch RSS feeds at 5 minutes past each hour
SELECT cron.schedule(
  'fetch-rss-hourly',
  '5 * * * *',
  $$
  select
    net.http_post(
        url:='https://pbfqdfipjnaqhoxhlitw.supabase.co/functions/v1/fetch-rss-enhanced',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBiZnFkZmlwam5hcWhveGhsaXR3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU4MTY0OTMsImV4cCI6MjA3MTM5MjQ5M30.Ms8WYvWheAgPYHZUVDWmE2PD6AMntoJe5Tom5HCsgwE"}'::jsonb,
        body:=concat('{"time": "', now(), '"}')::jsonb
    ) as request_id;
  $$
);

-- Refresh cards at 10 minutes past each hour (after RSS fetch)
SELECT cron.schedule(
  'refresh-cards-hourly',
  '10 * * * *',
  $$
  select
    net.http_post(
        url:='https://pbfqdfipjnaqhoxhlitw.supabase.co/functions/v1/refresh-cards',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBiZnFkZmlwam5hcWhveGhsaXR3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU4MTY0OTMsImV4cCI6MjA3MTM5MjQ5M30.Ms8WYvWheAgPYHZUVDWmE2PD6AMntoJe5Tom5HCsgwE"}'::jsonb,
        body:=concat('{"time": "', now(), '"}')::jsonb
    ) as request_id;
  $$
);

-- Add logging table for function execution tracking
CREATE TABLE public.function_logs (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    function_name TEXT NOT NULL,
    started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    completed_at TIMESTAMP WITH TIME ZONE,
    status TEXT NOT NULL DEFAULT 'running' CHECK (status IN ('running', 'success', 'error')),
    items_processed INTEGER DEFAULT 0,
    errors_count INTEGER DEFAULT 0,
    details JSONB,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for function logs
CREATE INDEX idx_function_logs_function_started ON public.function_logs(function_name, started_at DESC);

-- RLS for function logs (admin only)
ALTER TABLE public.function_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Function logs are read-only for authenticated users" ON public.function_logs
    FOR SELECT USING (auth.role() = 'authenticated');