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

    const url = new URL(req.url)
    const pathParts = url.pathname.split('/')
    const cardId = pathParts[2] // Extract from /cards/:id/action

    if (!cardId) {
      return new Response(
        JSON.stringify({ error: 'Card ID is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

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

    if (req.method === 'POST') {
      const action = pathParts[3] // pin, hide, or reorder

      if (action === 'pin') {
        const { pinned } = await req.json()
        
        const { error: updateError } = await supabase
          .from('cards')
          .update({ pinned: pinned ?? true })
          .eq('id', cardId)
          .eq('org_id', membership.org_id)

        if (updateError) {
          console.error('Error updating card pin status:', updateError)
          return new Response(
            JSON.stringify({ error: 'Failed to update card' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        return new Response(
          JSON.stringify({ message: 'Card pin status updated' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )

      } else if (action === 'hide') {
        const { hidden } = await req.json()
        
        const { error: updateError } = await supabase
          .from('cards')
          .update({ hidden: hidden ?? true })
          .eq('id', cardId)
          .eq('org_id', membership.org_id)

        if (updateError) {
          console.error('Error updating card hidden status:', updateError)
          return new Response(
            JSON.stringify({ error: 'Failed to update card' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        return new Response(
          JSON.stringify({ message: 'Card visibility updated' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )

      } else if (action === 'reorder') {
        const { position } = await req.json()
        
        if (typeof position !== 'number') {
          return new Response(
            JSON.stringify({ error: 'Position must be a number' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        const { error: updateError } = await supabase
          .from('cards')
          .update({ position })
          .eq('id', cardId)
          .eq('org_id', membership.org_id)

        if (updateError) {
          console.error('Error updating card position:', updateError)
          return new Response(
            JSON.stringify({ error: 'Failed to reorder card' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        return new Response(
          JSON.stringify({ message: 'Card position updated' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )

      } else {
        return new Response(
          JSON.stringify({ error: 'Invalid action. Use pin, hide, or reorder' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
    }

    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in cards-actions function:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})