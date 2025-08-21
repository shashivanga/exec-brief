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

    if (req.method === 'GET') {
      console.log(`Generating briefing for user ${user.id}`)

      // Get user's org membership
      const { data: membership, error: memberError } = await supabase
        .from('org_members')
        .select('org_id')
        .eq('user_id', user.id)
        .single()

      if (memberError || !membership) {
        return new Response(
          JSON.stringify({ error: 'User not in any organization' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Get user's default dashboard
      const { data: dashboard, error: dashboardError } = await supabase
        .from('dashboards')
        .select('id')
        .eq('org_id', membership.org_id)
        .eq('owner_id', user.id)
        .eq('is_default', true)
        .single()

      if (dashboardError || !dashboard) {
        console.log('No default dashboard found')
        return new Response(
          JSON.stringify([]),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Get top 5 cards: pinned first, then by most recently refreshed
      const { data: cards, error: cardsError } = await supabase
        .from('cards')
        .select('id, type, title, position, pinned, hidden, data, sources, refreshed_at, created_at')
        .eq('org_id', membership.org_id)
        .eq('dashboard_id', dashboard.id)
        .eq('hidden', false)
        .order('pinned', { ascending: false })
        .order('refreshed_at', { ascending: false, nullsLast: true })
        .order('created_at', { ascending: false })
        .limit(5)

      if (cardsError) {
        console.error('Error fetching briefing cards:', cardsError)
        return new Response(
          JSON.stringify({ error: 'Failed to fetch briefing cards' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const briefingCards = cards || []
      
      console.log(`Generated briefing with ${briefingCards.length} cards for user ${user.id}`)

      // Add briefing metadata
      const briefing = {
        generated_at: new Date().toISOString(),
        user_id: user.id,
        org_id: membership.org_id,
        cards: briefingCards
      }

      return new Response(
        JSON.stringify(briefing),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in briefing-today function:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})