-- Fix the org_members INSERT policy - the current one has a circular dependency
-- Drop the existing policy first
DROP POLICY IF EXISTS "Users can add themselves to organizations" ON public.org_members;

-- Create a new policy that doesn't depend on is_org_member function
CREATE POLICY "Users can join organizations during onboarding" ON public.org_members
    FOR INSERT 
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

-- Also ensure we have the correct INSERT policy for dashboards
CREATE POLICY "Users can create dashboards in their org" ON public.dashboards
    FOR INSERT 
    TO authenticated  
    WITH CHECK (auth.uid() = owner_id);

-- And for cards
CREATE POLICY "Users can create cards in their dashboards" ON public.cards
    FOR INSERT 
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.dashboards d 
            WHERE d.id = cards.dashboard_id 
            AND d.owner_id = auth.uid()
        )
    );