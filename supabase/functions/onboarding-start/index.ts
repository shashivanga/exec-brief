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

    const { name, orgName } = await req.json();
    
    if (!name || !orgName) {
      throw new Error('Name and organization name are required');
    }

    console.log(`Starting onboarding for user ${user.id}: ${name} at ${orgName}`);

    // Start transaction-like operations
    // 1. Create organization
    const { data: org, error: orgError } = await supabase
      .from('organizations')
      .insert({
        name: orgName,
        plan: 'free'
      })
      .select()
      .single();

    if (orgError) {
      console.error('Organization creation error:', orgError);
      throw new Error('Failed to create organization');
    }

    console.log('Created organization:', org.id);

    // 2. Add user to org_members
    const { error: memberError } = await supabase
      .from('org_members')
      .insert({
        org_id: org.id,
        user_id: user.id,
        role: 'admin'
      });

    if (memberError) {
      console.error('Membership creation error:', memberError);
      throw new Error('Failed to add user to organization');
    }

    console.log('Added user to organization');

    // 3. Create default dashboard
    const { data: dashboard, error: dashboardError } = await supabase
      .from('dashboards')
      .insert({
        org_id: org.id,
        owner_id: user.id,
        name: 'Main Dashboard',
        is_default: true,
        is_shared: false
      })
      .select()
      .single();

    if (dashboardError) {
      console.error('Dashboard creation error:', dashboardError);
      throw new Error('Failed to create dashboard');
    }

    console.log('Created dashboard:', dashboard.id);

    // 4. Seed cards with placeholder data
    const cardTemplates = [
      {
        template_key: 'competitor_overview',
        title: 'Competitor Overview',
        position: 1,
        data: {
          competitor: 'Getting started...',
          headlines: [
            { title: 'Welcome to your executive dashboard', url: '#', ts: new Date().toISOString() },
            { title: 'Add competitors to see real-time updates', url: '#', ts: new Date().toISOString() }
          ],
          last_refreshed: new Date().toISOString()
        },
        sources: [
          { title: 'Getting Started Guide', url: '#' }
        ]
      },
      {
        template_key: 'industry_news',
        title: 'Industry News',
        position: 2,
        data: {
          topic: 'Industry Trends',
          headlines: [
            { title: 'Your industry insights will appear here', url: '#', ts: new Date().toISOString() },
            { title: 'Configure industry topics to get started', url: '#', ts: new Date().toISOString() }
          ],
          last_refreshed: new Date().toISOString()
        },
        sources: [
          { title: 'Industry Setup Guide', url: '#' }
        ]
      },
      {
        template_key: 'company_health',
        title: 'Company Health',
        position: 3,
        data: {
          bullets: [
            'Upload documents to see AI-powered insights',
            'Import KPIs via Excel to track performance',
            'Monitor key metrics and trends'
          ],
          last_refreshed: new Date().toISOString()
        },
        sources: [
          { title: 'Company Health Setup', url: '#' }
        ]
      },
      {
        template_key: 'macro_snapshot',
        title: 'Market Overview',
        position: 4,
        data: {
          indicators: ['Ready to track market indicators'],
          market_data: ['Economic trends will appear here'],
          summary: 'Configure your market tracking preferences',
          last_refreshed: new Date().toISOString()
        },
        sources: [
          { title: 'Market Setup Guide', url: '#' }
        ]
      }
    ];

    const cardsToInsert = cardTemplates.map(template => ({
      org_id: org.id,
      dashboard_id: dashboard.id,
      template_key: template.template_key,
      title: template.title,
      position: template.position,
      data: template.data,
      sources: template.sources,
      size: 'm',
      pinned: false,
      hidden: false,
      refreshed_at: new Date().toISOString()
    }));

    const { data: cards, error: cardsError } = await supabase
      .from('cards')
      .insert(cardsToInsert)
      .select();

    if (cardsError) {
      console.error('Cards creation error:', cardsError);
      throw new Error('Failed to create dashboard cards');
    }

    console.log(`Created ${cards.length} dashboard cards`);

    return new Response(
      JSON.stringify({ 
        success: true,
        org, 
        dashboard, 
        cards,
        message: 'Organization and dashboard created successfully'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Onboarding error:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Internal server error',
        success: false
      }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});