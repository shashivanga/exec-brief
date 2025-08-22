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

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    // Get the authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (req.method === 'POST') {
      const { fullName } = await req.json()

      console.log(`Starting onboarding for user ${user.id}`)

      try {
        // Update user profile if fullName provided
        if (fullName) {
          await supabase
            .from('profiles')
            .upsert({
              user_id: user.id,
              full_name: fullName
            })
        }

        // Create default dashboard
        const { data: dashboard, error: dashboardError } = await supabase
          .from('dashboards')
          .insert({
            user_id: user.id,
            name: 'Main',
            is_default: true
          })
          .select()
          .single()

        if (dashboardError) {
          console.error('Error creating dashboard:', dashboardError)
          return new Response(
            JSON.stringify({ error: 'Failed to create dashboard' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        // Seed initial cards
        const seedCards = [
          {
            user_id: user.id,
            dashboard_id: dashboard.id,
            type: 'competitor',
            title: 'Competitor Updates',
            position: 1,
            data: { 
              message: 'Add companies to track competitor news and updates',
              placeholder: true
            },
            sources: []
          },
          {
            user_id: user.id,
            dashboard_id: dashboard.id,
            type: 'industry',
            title: 'Industry Trends',
            position: 2,
            data: { 
              message: 'Add topics to monitor industry trends and news',
              placeholder: true
            },
            sources: []
          },
          {
            user_id: user.id,
            dashboard_id: dashboard.id,
            type: 'company_health',
            title: 'Company Health',
            position: 3,
            data: { 
              message: 'Upload documents to get AI-powered business insights',
              placeholder: true
            },
            sources: []
          },
          {
            user_id: user.id,
            dashboard_id: dashboard.id,
            type: 'metrics',
            title: 'Product Metrics',
            position: 4,
            data: { 
              message: 'Import KPI data to track key business metrics',
              placeholder: true
            },
            sources: []
          }
        ]

        const { data: cards, error: cardsError } = await supabase
          .from('cards')
          .insert(seedCards)
          .select()

        if (cardsError) {
          console.error('Error creating seed cards:', cardsError)
          return new Response(
            JSON.stringify({ error: 'Failed to create initial cards' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        console.log(`Onboarding completed successfully for user ${user.id}`)

        return new Response(
          JSON.stringify({ 
            user: { id: user.id },
            dashboard,
            cards
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )

      } catch (error) {
        console.error('Error during onboarding transaction:', error)
        return new Response(
          JSON.stringify({ error: 'Onboarding failed' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
    }

    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in onboarding-start function:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})