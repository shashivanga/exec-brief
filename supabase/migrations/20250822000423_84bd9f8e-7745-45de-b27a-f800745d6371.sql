-- Single-User Refactor: Phase 1 - Drop storage policies first

-- Drop storage policies that depend on is_org_member function
DROP POLICY IF EXISTS "Users can view org documents in uploads" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload org documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can update org documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete org documents" ON storage.objects;
DROP POLICY IF EXISTS "Service can upload" ON storage.objects;

-- Drop any other storage policies
DROP POLICY IF EXISTS "Authenticated users can upload" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their uploads" ON storage.objects;

-- Now drop the function
DROP FUNCTION IF EXISTS public.is_org_member(uuid) CASCADE;

-- Drop organization-related tables
DROP TABLE IF EXISTS public.org_members CASCADE;
DROP TABLE IF EXISTS public.organizations CASCADE;