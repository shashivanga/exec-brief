import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface RSSItem {
  title: string
  link: string
  pubDate: string
  description?: string
  guid?: string
}

function parseRSSXML(xmlText: string): RSSItem[] {
  const items: RSSItem[] = []
  
  try {
    // Simple XML parsing for RSS items
    const itemMatches = xmlText.match(/<item[^>]*>[\s\S]*?<\/item>/g)
    
    if (!itemMatches) return items
    
    for (const itemXml of itemMatches) {
      const title = itemXml.match(/<title[^>]*><!\[CDATA\[(.*?)\]\]><\/title>/)?.[1] || 
                   itemXml.match(/<title[^>]*>(.*?)<\/title>/)?.[1]
      const link = itemXml.match(/<link[^>]*>(.*?)<\/link>/)?.[1]
      const pubDate = itemXml.match(/<pubDate[^>]*>(.*?)<\/pubDate>/)?.[1]
      const description = itemXml.match(/<description[^>]*><!\[CDATA\[(.*?)\]\]><\/description>/)?.[1] || 
                         itemXml.match(/<description[^>]*>(.*?)<\/description>/)?.[1]
      const guid = itemXml.match(/<guid[^>]*>(.*?)<\/guid>/)?.[1]
      
      if (title && link && pubDate) {
        items.push({
          title: title.trim(),
          link: link.trim(),
          pubDate: pubDate.trim(),
          description: description?.trim(),
          guid: guid?.trim()
        })
      }
    }
  } catch (error) {
    console.error('Error parsing RSS XML:', error)
  }
  
  return items
}

function createSourceId(item: RSSItem): string {
  // Use GUID if available, otherwise hash of URL
  if (item.guid) {
    return item.guid
  }
  
  // Simple hash of the URL
  let hash = 0
  const str = item.link
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32-bit integer
  }
  return Math.abs(hash).toString()
}

function parseDate(dateString: string): Date {
  // Try to parse the date, fallback to current date if parsing fails
  const parsed = new Date(dateString)
  return isNaN(parsed.getTime()) ? new Date() : parsed
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

    console.log('Starting RSS fetch at:', new Date().toISOString())

    // Get all active feeds
    const { data: feeds, error: feedsError } = await supabase
      .from('feeds')
      .select('*')
      .eq('active', true)

    if (feedsError) {
      console.error('Error fetching feeds:', feedsError)
      return new Response(
        JSON.stringify({ error: 'Failed to fetch feeds' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!feeds || feeds.length === 0) {
      console.log('No active feeds found')
      return new Response(
        JSON.stringify({ message: 'No active feeds found', inserted: 0, skipped: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    let totalInserted = 0
    let totalSkipped = 0
    const errors: string[] = []

    // Process each feed
    for (const feed of feeds) {
      try {
        console.log(`Fetching RSS from: ${feed.url}`)
        
        const response = await fetch(feed.url, {
          headers: {
            'User-Agent': 'RSS-Fetcher/1.0'
          }
        })

        if (!response.ok) {
          const error = `HTTP ${response.status} for feed ${feed.id}`
          console.error(error)
          errors.push(error)
          continue
        }

        const xmlText = await response.text()
        const rssItems = parseRSSXML(xmlText)

        console.log(`Parsed ${rssItems.length} items from feed ${feed.id}`)

        // Insert items into database
        for (const rssItem of rssItems) {
          try {
            const sourceId = createSourceId(rssItem)
            const publishedAt = parseDate(rssItem.pubDate)
            
            // Extract summary from description (first 200 chars)
            const summary = rssItem.description ? 
              rssItem.description.replace(/<[^>]*>/g, '').substring(0, 200) + '...' : 
              null

            const { error: insertError } = await supabase
              .from('items')
              .upsert({
                user_id: feed.user_id,
                company_id: feed.company_id,
                topic_id: feed.topic_id,
                source_kind: feed.kind,
                source_id: sourceId,
                title: rssItem.title,
                url: rssItem.link,
                published_at: publishedAt.toISOString(),
                summary: summary,
                raw: rssItem
              }, {
                onConflict: 'user_id,company_id,topic_id,source_kind,source_id',
                ignoreDuplicates: true
              })

            if (insertError) {
              console.error('Error inserting item:', insertError)
              totalSkipped++
            } else {
              totalInserted++
            }
          } catch (itemError) {
            console.error('Error processing item:', itemError)
            totalSkipped++
          }
        }

      } catch (feedError) {
        const error = `Error processing feed ${feed.id}: ${feedError.message}`
        console.error(error)
        errors.push(error)
      }
    }

    console.log(`RSS fetch completed. Inserted: ${totalInserted}, Skipped: ${totalSkipped}`)

    return new Response(
      JSON.stringify({ 
        message: 'RSS fetch completed',
        inserted: totalInserted,
        skipped: totalSkipped,
        errors: errors
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in fetch-rss function:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})