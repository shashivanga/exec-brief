import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    // Get the JWT token from the Authorization header
    const jwt = authHeader.replace('Bearer ', '');
    
    // Verify the JWT and get the user
    const { data: { user }, error: authError } = await supabase.auth.getUser(jwt);
    if (authError || !user) {
      throw new Error('Invalid authentication');
    }

    console.log(`Getting dashboard for user ${user.id}`);

    // Get user's organizations
    const { data: orgMemberships, error: memberError } = await supabase
      .from('org_members')
      .select(`
        org_id,
        organizations (
          id,
          name,
          plan,
          branding
        )
      `)
      .eq('user_id', user.id);

    if (memberError) {
      console.error('Member query error:', memberError);
      throw new Error('Failed to get user organizations');
    }

    if (!orgMemberships || orgMemberships.length === 0) {
      return new Response(
        JSON.stringify({ 
          error: 'No organization found. Please complete onboarding.',
          needsOnboarding: true
        }),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Get the first org (assuming single org for now)
    const orgId = orgMemberships[0].org_id;

    // Get user's default dashboard
    const { data: dashboard, error: dashboardError } = await supabase
      .from('dashboards')
      .select('*')
      .eq('org_id', orgId)
      .eq('owner_id', user.id)
      .eq('is_default', true)
      .single();

    if (dashboardError) {
      console.error('Dashboard query error:', dashboardError);
      throw new Error('Failed to get user dashboard');
    }

    // Get cards for the dashboard, ordered by position
    const { data: cards, error: cardsError } = await supabase
      .from('cards')
      .select(`
        *,
        card_templates (
          title,
          description,
          type
        )
      `)
      .eq('dashboard_id', dashboard.id)
      .eq('hidden', false)
      .order('pinned', { ascending: false })
      .order('position', { ascending: true });

    if (cardsError) {
      console.error('Cards query error:', cardsError);
      throw new Error('Failed to get dashboard cards');
    }

    console.log(`Found ${cards.length} cards for dashboard ${dashboard.id}`);

    return new Response(
      JSON.stringify({ 
        success: true,
        organization: orgMemberships[0].organizations,
        dashboard,
        cards: cards || []
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Dashboard fetch error:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Internal server error',
        success: false
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});