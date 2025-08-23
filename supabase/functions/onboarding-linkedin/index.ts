import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Competitor mapping for instant suggestions
const PEER_SETS: Record<string, { peers: string[], tickers?: Record<string,string>, domains?: Record<string,string> }> = {
  "Nike": { 
    peers: ["Adidas", "Puma", "Under Armour"], 
    tickers: { "Nike":"NKE","Adidas":"ADDYY","Puma":"PUMSY","Under Armour":"UA" }, 
    domains: { "Nike":"nike.com","Adidas":"adidas.com","Puma":"puma.com","Under Armour":"underarmour.com" } 
  },
  "Adidas": { 
    peers: ["Nike","Puma","Under Armour"],
    tickers: { "Nike":"NKE","Adidas":"ADDYY","Puma":"PUMSY","Under Armour":"UA" },
    domains: { "Nike":"nike.com","Adidas":"adidas.com","Puma":"puma.com","Under Armour":"underarmour.com" }
  },
  "Tesla": { 
    peers: ["Ford","GM","Rivian"],
    tickers: { "Tesla":"TSLA","Ford":"F","GM":"GM","Rivian":"RIVN" },
    domains: { "Tesla":"tesla.com","Ford":"ford.com","GM":"gm.com","Rivian":"rivian.com" }
  },
  "Salesforce": { 
    peers: ["Microsoft","HubSpot","Oracle"],
    tickers: { "Salesforce":"CRM","Microsoft":"MSFT","HubSpot":"HUBS","Oracle":"ORCL" },
    domains: { "Salesforce":"salesforce.com","Microsoft":"microsoft.com","HubSpot":"hubspot.com","Oracle":"oracle.com" }
  },
  "Apple": { 
    peers: ["Microsoft","Google","Samsung"],
    tickers: { "Apple":"AAPL","Microsoft":"MSFT","Google":"GOOGL","Samsung":"005930.KS" },
    domains: { "Apple":"apple.com","Microsoft":"microsoft.com","Google":"google.com","Samsung":"samsung.com" }
  },
  "Microsoft": { 
    peers: ["Apple","Google","Amazon"],
    tickers: { "Microsoft":"MSFT","Apple":"AAPL","Google":"GOOGL","Amazon":"AMZN" },
    domains: { "Microsoft":"microsoft.com","Apple":"apple.com","Google":"google.com","Amazon":"amazon.com" }
  }
};

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

    const { linkedinUrl, manualCompany, manualIndustry } = await req.json();
    
    if (!linkedinUrl && !manualCompany) {
      return new Response(
        JSON.stringify({ error: 'LinkedIn URL or company name is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Processing for user ${user.id}: ${linkedinUrl ? `LinkedIn: ${linkedinUrl}` : `Manual: ${manualCompany}`}`);

    let context;
    
    if (manualCompany) {
      // Handle manual company entry
      console.log(`Manual company entry: ${manualCompany} in ${manualIndustry || 'Business'}`);
      
      // Check if it matches known companies in PEER_SETS
      const knownCompany = Object.keys(PEER_SETS).find(
        company => company.toLowerCase() === manualCompany.toLowerCase()
      );
      
      context = {
        name: 'User',
        employer: {
          name: manualCompany,
          ticker: knownCompany ? PEER_SETS[knownCompany]?.tickers?.[knownCompany] || '' : '',
          domain: knownCompany ? PEER_SETS[knownCompany]?.domains?.[knownCompany] || '' : ''
        },
        role: 'Executive',
        industry: manualIndustry || 'Business',
        interests: [],
        location: '',
        confidence: knownCompany ? 0.8 : 0.5
      };
    } else {
      // Handle LinkedIn URL analysis
      const linkedinUsername = linkedinUrl.match(/linkedin\.com\/in\/([^\/\?]+)/)?.[1] || '';
      
      // Extract potential company from URL patterns
      const potentialCompany = linkedinUsername.includes('nike') ? 'Nike' : 
                              linkedinUsername.includes('apple') ? 'Apple' :
                              linkedinUsername.includes('microsoft') ? 'Microsoft' :
                              linkedinUsername.includes('tesla') ? 'Tesla' :
                              linkedinUsername.includes('salesforce') ? 'Salesforce' :
                              '';
      
      context = {
        name: linkedinUsername.replace(/[-_]/g, ' ').split(' ').map(word => 
          word.charAt(0).toUpperCase() + word.slice(1)
        ).join(' '),
        employer: {
          name: potentialCompany || 'Unknown Company',
          ticker: PEER_SETS[potentialCompany]?.tickers?.[potentialCompany] || '',
          domain: PEER_SETS[potentialCompany]?.domains?.[potentialCompany] || ''
        },
        role: 'Executive',
        industry: potentialCompany === 'Nike' || potentialCompany === 'Adidas' ? 'Sportswear' :
                 potentialCompany === 'Tesla' ? 'Automotive' :
                 potentialCompany === 'Salesforce' ? 'Software' :
                 potentialCompany === 'Apple' || potentialCompany === 'Microsoft' ? 'Technology' :
                 'Business',
        interests: [],
        location: '',
        confidence: potentialCompany ? 0.7 : 0.3
      };
    }

    // Update profile with context
    const updateData: any = {
      employer_name: context.employer.name,
      employer_ticker: context.employer.ticker,
      employer_domain: context.employer.domain,
      industry: context.industry,
      inferred: context
    };
    
    if (linkedinUrl) {
      updateData.linkedin_url = linkedinUrl;
    }
    
    const { error: profileError } = await supabase
      .from('profiles')
      .update(updateData)
      .eq('user_id', user.id);

    if (profileError) {
      console.error('Error updating profile:', profileError);
      return new Response(
        JSON.stringify({ error: 'Failed to update profile' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create/update employer company
    let employerCompanyId;
    if (context.employer.name && context.employer.name !== 'Unknown Company') {
      const { data: employerCompany, error: employerError } = await supabase
        .from('companies')
        .upsert({
          user_id: user.id,
          name: context.employer.name,
          ticker: context.employer.ticker || null,
          domain: context.employer.domain || null,
          summary: `Primary employer - ${context.industry} industry`
        })
        .select()
        .single();

      if (employerError) {
        console.error('Error creating employer company:', employerError);
      } else {
        employerCompanyId = employerCompany.id;
      }
    }

    // Create competitor companies
    const peers = PEER_SETS[context.employer.name]?.peers || [];
    const createdPeers = [];
    
    for (const peerName of peers) {
      const peerTicker = PEER_SETS[context.employer.name]?.tickers?.[peerName] || '';
      const peerDomain = PEER_SETS[context.employer.name]?.domains?.[peerName] || '';
      
      const { data: peerCompany, error: peerError } = await supabase
        .from('companies')
        .upsert({
          user_id: user.id,
          name: peerName,
          ticker: peerTicker || null,
          domain: peerDomain || null,
          summary: `Competitor in ${context.industry} industry`
        })
        .select()
        .single();

      if (peerError) {
        console.error(`Error creating peer company ${peerName}:`, peerError);
      } else {
        createdPeers.push(peerCompany);
      }
    }

    // Auto-generate RSS feeds for all companies
    const allCompanies = [employerCompanyId, ...createdPeers.map(p => p.id)].filter(Boolean);
    
    for (const companyId of allCompanies) {
      try {
        await supabase.functions.invoke('feeds-autogenerate', {
          body: { companyId }
        });
      } catch (error) {
        console.error(`Error generating feeds for company ${companyId}:`, error);
      }
    }

    const plan = {
      employerCompany: context.employer.name,
      competitors: peers,
      suggestedCards: [
        { type: 'company_financials', title: `${context.employer.name} Financials` },
        { type: 'competitor_news', title: 'Competitor Updates' },
        { type: 'industry_pulse', title: `${context.industry} Industry` },
        { type: 'peer_financials', title: 'Peer Comparison' },
        { type: 'ai_insights', title: 'AI Summary' }
      ]
    };

    return new Response(
      JSON.stringify({ 
        success: true, 
        context, 
        employerCompanyId,
        peers: createdPeers,
        plan 
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error in onboarding-linkedin function:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});