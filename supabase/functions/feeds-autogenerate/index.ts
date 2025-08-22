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
      const { targetType, targetId } = await req.json()

      if (!targetType || !targetId || !['company', 'topic'].includes(targetType)) {
        return new Response(
          JSON.stringify({ error: 'Valid targetType (company|topic) and targetId are required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      let feedUrl = ''
      let feedData: any = {}

      if (targetType === 'company') {
        // Get company details
        const { data: company, error: companyError } = await supabase
          .from('companies')
          .select('*')
          .eq('id', targetId)
          .eq('user_id', user.id)
          .single()

        if (companyError || !company) {
          return new Response(
            JSON.stringify({ error: 'Company not found' }),
            { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        // Generate Google News RSS URL for company
        const searchTerms = [`"${company.name}"`]
        if (company.domain) {
          searchTerms.push(`site:${company.domain}`)
        }
        if (company.ticker) {
          searchTerms.push(`"${company.ticker}"`)
        }
        if (company.aliases && company.aliases.length > 0) {
          company.aliases.forEach(alias => searchTerms.push(`"${alias}"`))
        }

        const query = searchTerms.join(' OR ')
        feedUrl = `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=en-US&gl=US&ceid=US:en`
        
        feedData = {
          user_id: user.id,
          kind: 'news',
          url: feedUrl,
          company_id: targetId,
          topic_id: null,
          active: true
        }

      } else if (targetType === 'topic') {
        // Get topic details
        const { data: topic, error: topicError } = await supabase
          .from('topics')
          .select('*')
          .eq('id', targetId)
          .eq('user_id', user.id)
          .single()

        if (topicError || !topic) {
          return new Response(
            JSON.stringify({ error: 'Topic not found' }),
            { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        // Generate Google News RSS URL for topic
        const query = topic.queries.join(' OR ')
        feedUrl = `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=en-US&gl=US&ceid=US:en`
        
        feedData = {
          user_id: user.id,
          kind: 'news',
          url: feedUrl,
          company_id: null,
          topic_id: targetId,
          active: true
        }
      }

      // Insert feed
      const { data: feed, error: insertError } = await supabase
        .from('feeds')
        .insert(feedData)
        .select()
        .single()

      if (insertError) {
        console.error('Error inserting feed:', insertError)
        return new Response(
          JSON.stringify({ error: 'Failed to create feed' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      return new Response(
        JSON.stringify({ feeds: [feed] }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in feeds-autogenerate function:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})