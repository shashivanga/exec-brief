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
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    console.log('Starting card refresh at:', new Date().toISOString())

    let totalCardsUpdated = 0
    const errors: string[] = []

    // Get all organizations that have companies or topics
    const { data: orgs, error: orgsError } = await supabase
      .from('organizations')
      .select('id')

    if (orgsError) {
      console.error('Error fetching organizations:', orgsError)
      return new Response(
        JSON.stringify({ error: 'Failed to fetch organizations' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    for (const org of orgs) {
      try {
        // Get default dashboard for this org (find any user's dashboard for now)
        const { data: dashboard } = await supabase
          .from('dashboards')
          .select('id')
          .eq('org_id', org.id)
          .eq('is_default', true)
          .limit(1)
          .single()

        if (!dashboard) {
          console.log(`No default dashboard found for org ${org.id}`)
          continue
        }

        // Process companies for this org
        const { data: companies } = await supabase
          .from('companies')
          .select('id, name, ticker')
          .eq('org_id', org.id)

        if (companies) {
          for (const company of companies) {
            try {
              // Get latest 5 items for this company
              const { data: items } = await supabase
                .from('items')
                .select('title, url, published_at')
                .eq('org_id', org.id)
                .eq('company_id', company.id)
                .order('published_at', { ascending: false })
                .limit(5)

              if (items && items.length > 0) {
                const headlines = items.map(item => ({
                  title: item.title,
                  url: item.url,
                  ts: item.published_at
                }))

                const sources = items.map(item => ({
                  title: item.title,
                  url: item.url
                }))

                const cardData = {
                  competitor: company.name,
                  ticker: company.ticker || null,
                  headlines: headlines,
                  last_refreshed: new Date().toISOString()
                }

                // Upsert the card
                const { error: cardError } = await supabase
                  .from('cards')
                  .upsert({
                    org_id: org.id,
                    dashboard_id: dashboard.id,
                    type: 'competitor',
                    title: company.name,
                    position: 0, // Will be updated by user
                    data: cardData,
                    sources: sources,
                    refreshed_at: new Date().toISOString()
                  }, {
                    onConflict: 'org_id,dashboard_id,type,title',
                    ignoreDuplicates: false
                  })

                if (cardError) {
                  console.error(`Error upserting card for company ${company.id}:`, cardError)
                  errors.push(`Company ${company.name}: ${cardError.message}`)
                } else {
                  totalCardsUpdated++
                  console.log(`Updated card for company: ${company.name}`)
                }
              }
            } catch (companyError) {
              console.error(`Error processing company ${company.id}:`, companyError)
              errors.push(`Company ${company.name}: ${companyError.message}`)
            }
          }
        }

        // Process topics for this org
        const { data: topics } = await supabase
          .from('topics')
          .select('id, name')
          .eq('org_id', org.id)

        if (topics) {
          for (const topic of topics) {
            try {
              // Get latest 5 items for this topic
              const { data: items } = await supabase
                .from('items')
                .select('title, url, published_at')
                .eq('org_id', org.id)
                .eq('topic_id', topic.id)
                .order('published_at', { ascending: false })
                .limit(5)

              if (items && items.length > 0) {
                const headlines = items.map(item => ({
                  title: item.title,
                  url: item.url,
                  ts: item.published_at
                }))

                const sources = items.map(item => ({
                  title: item.title,
                  url: item.url
                }))

                const cardData = {
                  topic: topic.name,
                  headlines: headlines,
                  last_refreshed: new Date().toISOString()
                }

                // Upsert the card
                const { error: cardError } = await supabase
                  .from('cards')
                  .upsert({
                    org_id: org.id,
                    dashboard_id: dashboard.id,
                    type: 'industry',
                    title: topic.name,
                    position: 0, // Will be updated by user
                    data: cardData,
                    sources: sources,
                    refreshed_at: new Date().toISOString()
                  }, {
                    onConflict: 'org_id,dashboard_id,type,title',
                    ignoreDuplicates: false
                  })

                if (cardError) {
                  console.error(`Error upserting card for topic ${topic.id}:`, cardError)
                  errors.push(`Topic ${topic.name}: ${cardError.message}`)
                } else {
                  totalCardsUpdated++
                  console.log(`Updated card for topic: ${topic.name}`)
                }
              }
            } catch (topicError) {
              console.error(`Error processing topic ${topic.id}:`, topicError)
              errors.push(`Topic ${topic.name}: ${topicError.message}`)
            }
          }
        }

      } catch (orgError) {
        console.error(`Error processing org ${org.id}:`, orgError)
        errors.push(`Org ${org.id}: ${orgError.message}`)
      }
    }

    console.log(`Card refresh completed. Updated: ${totalCardsUpdated} cards`)

    return new Response(
      JSON.stringify({ 
        message: 'Card refresh completed',
        cards_updated: totalCardsUpdated,
        errors: errors
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in refresh-cards function:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})