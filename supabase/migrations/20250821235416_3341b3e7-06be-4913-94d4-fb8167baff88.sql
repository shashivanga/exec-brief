-- Add INSERT policy for organizations table to allow authenticated users to create orgs
CREATE POLICY "Authenticated users can create organizations" ON public.organizations
    FOR INSERT 
    TO authenticated
    WITH CHECK (true);

-- Add INSERT policy for org_members to allow users to add themselves to orgs
CREATE POLICY "Users can add themselves to organizations" ON public.org_members
    FOR INSERT 
    TO authenticated
    WITH CHECK (auth.uid() = user_id);