import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    // Get user from JWT
    const authHeader = req.headers.get('Authorization')!;
    const { data: { user }, error: authError } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Seeding smart cards for user ${user.id}`);

    // Get user's default dashboard
    const { data: dashboard, error: dashboardError } = await supabase
      .from('dashboards')
      .select('id')
      .eq('user_id', user.id)
      .eq('is_default', true)
      .single();

    if (dashboardError || !dashboard) {
      return new Response(
        JSON.stringify({ error: 'Default dashboard not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get user profile with LinkedIn context
    const { data: profile } = await supabase
      .from('profiles')
      .select('employer_name, employer_ticker, industry, inferred')
      .eq('user_id', user.id)
      .single();

    // Get user's companies for context
    const { data: companies } = await supabase
      .from('companies')
      .select('id, name, ticker, domain')
      .eq('user_id', user.id);

    const employerCompany = companies?.find(c => c.name === profile?.employer_name);
    const competitors = companies?.filter(c => c.name !== profile?.employer_name) || [];

    // Define smart cards to create
    const smartCards = [
      {
        type: 'company_financials',
        title: `${profile?.employer_name || 'Company'} Financials`,
        data: {
          company: profile?.employer_name || 'Company',
          ticker: profile?.employer_ticker || '',
          as_of: new Date().toISOString(),
          metrics: [
            { name: 'Revenue (TTM)', value: 'Loading...' },
            { name: 'Gross Margin', value: 'Loading...' },
            { name: 'Operating Margin', value: 'Loading...' },
            { name: 'YoY Growth', value: 'Loading...' }
          ],
          notes: 'Financial data will be updated automatically'
        },
        sources: [{ title: 'Financial APIs', url: '#' }]
      },
      {
        type: 'peer_financials',
        title: 'Peer Comparison',
        data: {
          group: `${profile?.industry || 'Industry'} Peers`,
          rows: [
            { 
              company: profile?.employer_name || 'Company', 
              ticker: profile?.employer_ticker || '', 
              rev: 'Loading...', 
              margin: 'Loading...', 
              yoy: 'Loading...' 
            },
            ...competitors.slice(0, 3).map(comp => ({
              company: comp.name,
              ticker: comp.ticker || '',
              rev: 'Loading...',
              margin: 'Loading...',
              yoy: 'Loading...'
            }))
          ],
          as_of: new Date().toISOString()
        },
        sources: [{ title: 'Market Data', url: '#' }]
      },
      {
        type: 'company_news',
        title: `${profile?.employer_name || 'Company'} News`,
        data: {
          company: profile?.employer_name || 'Company',
          headlines: [],
          flags: { risks: [], opportunities: [] },
          last_refreshed: new Date().toISOString(),
          placeholder: true
        },
        sources: [{ title: 'News Feeds', url: '#' }]
      },
      {
        type: 'competitor_news',
        title: 'Competitor Updates',
        data: {
          companies: competitors.slice(0, 3).map(c => c.name),
          headlines: [],
          last_refreshed: new Date().toISOString(),
          placeholder: true
        },
        sources: [{ title: 'Industry News', url: '#' }]
      },
      {
        type: 'industry_pulse',
        title: `${profile?.industry || 'Industry'} Pulse`,
        data: {
          topic: profile?.industry || 'Industry',
          headlines: [],
          last_refreshed: new Date().toISOString(),
          placeholder: true
        },
        sources: [{ title: 'Industry Reports', url: '#' }]
      },
      {
        type: 'ai_insights',
        title: 'AI Summary',
        data: {
          insights: [
            { type: 'opportunity', text: 'LinkedIn onboarding completed - dashboard is being personalized' },
            { type: 'neutral', text: 'RSS feeds are being generated for your companies' },
            { type: 'neutral', text: 'Financial data will be populated automatically' }
          ],
          sources: [
            { title: 'LinkedIn Profile Analysis', url: '#' },
            { title: 'Industry Mapping', url: '#' }
          ],
          timestamp: new Date().toISOString()
        }
      }
    ];

    // Get current max position
    const { data: existingCards } = await supabase
      .from('cards')
      .select('position')
      .eq('dashboard_id', dashboard.id)
      .order('position', { ascending: false })
      .limit(1);

    let nextPosition = (existingCards?.[0]?.position || 0) + 1;

    // Create all cards
    const createdCards = [];
    for (const cardTemplate of smartCards) {
      const { data: card, error: cardError } = await supabase
        .from('cards')
        .insert({
          user_id: user.id,
          dashboard_id: dashboard.id,
          type: cardTemplate.type,
          title: cardTemplate.title,
          data: cardTemplate.data,
          sources: cardTemplate.sources || [],
          position: nextPosition++,
          pinned: false,
          hidden: false
        })
        .select()
        .single();

      if (cardError) {
        console.error(`Error creating card ${cardTemplate.title}:`, cardError);
      } else {
        createdCards.push(card);
      }
    }

    // Trigger refresh-cards to populate placeholders
    try {
      await supabase.functions.invoke('refresh-cards');
    } catch (error) {
      console.error('Error triggering refresh-cards:', error);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        cardsCreated: createdCards.length,
        cards: createdCards
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error in bootstrap-seed-cards function:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});