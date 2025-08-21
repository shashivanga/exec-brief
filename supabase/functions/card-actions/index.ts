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

    const url = new URL(req.url);
    const pathParts = url.pathname.split('/');
    const action = pathParts[pathParts.length - 1]; // pin, hide, or reorder
    const cardId = pathParts[pathParts.length - 2];

    console.log(`Card action: ${action} for card ${cardId} by user ${user.id}`);

    if (action === 'pin') {
      // Toggle pin status
      const { data: card } = await supabase
        .from('cards')
        .select('pinned, org_id')
        .eq('id', cardId)
        .single();
      
      if (!card) {
        throw new Error('Card not found');
      }

      // Verify user has access to this org
      const { data: membership } = await supabase
        .from('org_members')
        .select('org_id')
        .eq('org_id', card.org_id)
        .eq('user_id', user.id)
        .single();

      if (!membership) {
        throw new Error('Access denied');
      }

      const { error: updateError } = await supabase
        .from('cards')
        .update({ pinned: !card.pinned })
        .eq('id', cardId);

      if (updateError) {
        throw new Error('Failed to update card');
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          pinned: !card.pinned,
          message: `Card ${!card.pinned ? 'pinned' : 'unpinned'} successfully`
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );

    } else if (action === 'hide') {
      // Toggle hidden status
      const { data: card } = await supabase
        .from('cards')
        .select('hidden, org_id')
        .eq('id', cardId)
        .single();
      
      if (!card) {
        throw new Error('Card not found');
      }

      // Verify user has access to this org
      const { data: membership } = await supabase
        .from('org_members')
        .select('org_id')
        .eq('org_id', card.org_id)
        .eq('user_id', user.id)
        .single();

      if (!membership) {
        throw new Error('Access denied');
      }

      const { error: updateError } = await supabase
        .from('cards')
        .update({ hidden: !card.hidden })
        .eq('id', cardId);

      if (updateError) {
        throw new Error('Failed to update card');
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          hidden: !card.hidden,
          message: `Card ${!card.hidden ? 'hidden' : 'shown'} successfully`
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );

    } else if (action === 'reorder' && req.method === 'POST') {
      // Reorder cards
      const { cardPositions } = await req.json();
      
      if (!Array.isArray(cardPositions)) {
        throw new Error('Invalid card positions data');
      }

      // Update positions in batch
      const updates = cardPositions.map((item: { id: string; position: number }) => 
        supabase
          .from('cards')
          .update({ position: item.position })
          .eq('id', item.id)
      );

      const results = await Promise.all(updates);
      
      const hasErrors = results.some(result => result.error);
      if (hasErrors) {
        throw new Error('Failed to reorder some cards');
      }

      return new Response(
        JSON.stringify({ 
          success: true,
          message: 'Cards reordered successfully'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );

    } else {
      throw new Error('Invalid action');
    }

  } catch (error) {
    console.error('Card action error:', error);
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