-- Add LinkedIn URL and inferred context to profiles
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS linkedin_url TEXT,
  ADD COLUMN IF NOT EXISTS employer_name TEXT,
  ADD COLUMN IF NOT EXISTS employer_ticker TEXT,
  ADD COLUMN IF NOT EXISTS employer_domain TEXT,
  ADD COLUMN IF NOT EXISTS industry TEXT,
  ADD COLUMN IF NOT EXISTS inferred JSONB;

-- Add enrichment fields to companies
ALTER TABLE public.companies 
  ADD COLUMN IF NOT EXISTS summary TEXT,
  ADD COLUMN IF NOT EXISTS press_rss_url TEXT,
  ADD COLUMN IF NOT EXISTS contact_url TEXT;