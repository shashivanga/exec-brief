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
      // Get user's default dashboard
      const { data: dashboard, error: dashboardError } = await supabase
        .from('dashboards')
        .select('id')
        .eq('user_id', user.id)
        .eq('is_default', true)
        .single()

      if (dashboardError || !dashboard) {
        return new Response(
          JSON.stringify({ error: 'Default dashboard not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Get all visible cards
      const { data: allCards, error: cardsError } = await supabase
        .from('cards')
        .select('id, type, title, position, pinned, hidden, data, sources, refreshed_at, created_at')
        .eq('user_id', user.id)
        .eq('dashboard_id', dashboard.id)
        .eq('hidden', false)
        .order('pinned', { ascending: false })
        .order('position', { ascending: true })

      if (cardsError) {
        console.error('Error fetching cards:', cardsError)
        return new Response(
          JSON.stringify({ error: 'Failed to fetch dashboard cards' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Filter cards to prioritize real cards over placeholder cards
      const cardsByTypeAndTitle = new Map()
      const cards = []

      // Group cards by type AND title, prioritize non-placeholder cards
      for (const card of allCards || []) {
        const isPlaceholder = card.data?.placeholder === true
        const key = `${card.type}-${card.title}`
        const existing = cardsByTypeAndTitle.get(key)
        
        if (!existing) {
          cardsByTypeAndTitle.set(key, card)
        } else {
          // Replace if current card is not a placeholder and existing is placeholder
          const existingIsPlaceholder = existing.data?.placeholder === true
          if (existingIsPlaceholder && !isPlaceholder) {
            cardsByTypeAndTitle.set(key, card)
          }
        }
      }

      // Convert map back to array
      cards.push(...cardsByTypeAndTitle.values())

      return new Response(
        JSON.stringify({ cards: cards || [] }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in me-dashboard function:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})