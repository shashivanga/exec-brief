import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Enhanced fetch with retry logic and rate limiting
async function fetchWithRetry(url: string, options: RequestInit = {}, maxRetries = 3): Promise<Response> {
  let lastError: Error | null = null
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'User-Agent': 'RSS-Fetcher/1.0',
          ...options.headers
        }
      })

      if (response.ok) {
        return response
      }

      // Don't retry on 4xx errors (client errors)
      if (response.status >= 400 && response.status < 500) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      // Retry on 5xx errors
      if (attempt < maxRetries) {
        const delay = Math.min(1000 * Math.pow(2, attempt), 10000) // Exponential backoff, max 10s
        console.log(`Attempt ${attempt} failed, retrying in ${delay}ms...`)
        await new Promise(resolve => setTimeout(resolve, delay))
        continue
      }

      throw new Error(`HTTP ${response.status}: ${response.statusText}`)

    } catch (error) {
      lastError = error as Error
      
      if (attempt < maxRetries) {
        const delay = Math.min(1000 * Math.pow(2, attempt), 10000)
        console.log(`Attempt ${attempt} failed: ${error.message}, retrying in ${delay}ms...`)
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }
  }

  throw lastError || new Error('All retry attempts failed')
}

// Validate URLs to prevent SSRF
function isValidFeedUrl(url: string): boolean {
  try {
    const parsed = new URL(url)
    
    // Only allow HTTP/HTTPS
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return false
    }
    
    // Block private networks
    const hostname = parsed.hostname.toLowerCase()
    if (
      hostname === 'localhost' ||
      hostname.startsWith('127.') ||
      hostname.startsWith('10.') ||
      hostname.startsWith('192.168.') ||
      hostname.includes('172.16.') ||
      hostname.includes('172.17.') ||
      hostname.includes('172.18.') ||
      hostname.includes('172.19.') ||
      hostname.includes('172.2') ||
      hostname.includes('172.30.') ||
      hostname.includes('172.31.')
    ) {
      return false
    }
    
    return true
  } catch {
    return false
  }
}

// Sanitize text content
function sanitizeText(text: string): string {
  return text
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/[^\w\s.,!?;:-]/g, '') // Keep only safe characters
    .trim()
    .substring(0, 2000) // Limit length
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now()
  console.log('🚀 Enhanced RSS fetch starting at:', new Date().toISOString())

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    // Get all active feeds with rate limiting info
    const { data: feeds, error: feedsError } = await supabase
      .from('feeds')
      .select('*')
      .eq('active', true)
      .limit(100) // Cap number of feeds processed per run

    if (feedsError) {
      console.error('❌ Error fetching feeds:', feedsError)
      return new Response(
        JSON.stringify({ error: 'Failed to fetch feeds', details: feedsError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!feeds || feeds.length === 0) {
      console.log('ℹ️ No active feeds found')
      return new Response(
        JSON.stringify({ 
          message: 'No active feeds found', 
          inserted: 0, 
          skipped: 0,
          processing_time_ms: Date.now() - startTime
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`📡 Processing ${feeds.length} feeds`)

    let totalInserted = 0
    let totalSkipped = 0
    const errors: string[] = []
    const successfulFeeds: string[] = []

    // Process feeds with concurrency limit
    const BATCH_SIZE = 5
    for (let i = 0; i < feeds.length; i += BATCH_SIZE) {
      const batch = feeds.slice(i, i + BATCH_SIZE)
      
      await Promise.allSettled(
        batch.map(async (feed) => {
          try {
            console.log(`🔄 Fetching RSS from: ${feed.url}`)
            
            // Validate URL
            if (!isValidFeedUrl(feed.url)) {
              throw new Error('Invalid or unsafe feed URL')
            }

            const response = await fetchWithRetry(feed.url, {}, 3)
            const xmlText = await response.text()
            
            // Validate XML size (prevent memory issues)
            if (xmlText.length > 5 * 1024 * 1024) { // 5MB limit
              throw new Error('Feed too large')
            }

            // Parse RSS with better error handling
            const items = parseRSSXML(xmlText)
            console.log(`📰 Parsed ${items.length} items from feed ${feed.id}`)

            let feedInserted = 0
            let feedSkipped = 0

            // Process items with item limit per feed
            const MAX_ITEMS_PER_FEED = 20
            const limitedItems = items.slice(0, MAX_ITEMS_PER_FEED)

            for (const rssItem of limitedItems) {
              try {
                const sourceId = createSourceId(rssItem)
                const publishedAt = parseDate(rssItem.pubDate)
                
                // Validate published date (not too old, not future)
                const now = new Date()
                const oneYearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000)
                if (publishedAt < oneYearAgo || publishedAt > now) {
                  feedSkipped++
                  continue
                }
                
                // Sanitize content
                const title = sanitizeText(rssItem.title)
                const summary = rssItem.description ? 
                  sanitizeText(rssItem.description).substring(0, 200) + '...' : 
                  null

                if (!title || title.length < 10) {
                  feedSkipped++
                  continue
                }

                const { error: insertError } = await supabase
                  .from('items')
                  .upsert({
                    org_id: feed.org_id,
                    company_id: feed.company_id,
                    topic_id: feed.topic_id,
                    source_kind: feed.kind,
                    source_id: sourceId,
                    title: title,
                    url: rssItem.link,
                    published_at: publishedAt.toISOString(),
                    summary: summary,
                    raw: {
                      title: rssItem.title,
                      link: rssItem.link,
                      pubDate: rssItem.pubDate,
                      guid: rssItem.guid
                    }
                  }, {
                    onConflict: 'org_id,company_id,topic_id,source_kind,source_id',
                    ignoreDuplicates: true
                  })

                if (insertError) {
                  console.error('⚠️ Error inserting item:', insertError.message)
                  feedSkipped++
                } else {
                  feedInserted++
                }
              } catch (itemError) {
                console.error('⚠️ Error processing item:', itemError.message)
                feedSkipped++
              }
            }

            totalInserted += feedInserted
            totalSkipped += feedSkipped
            successfulFeeds.push(feed.url)
            
            console.log(`✅ Feed ${feed.id}: ${feedInserted} inserted, ${feedSkipped} skipped`)

          } catch (feedError) {
            const error = `Feed ${feed.id} (${feed.url}): ${feedError.message}`
            console.error('❌', error)
            errors.push(error)
          }
        })
      )

      // Brief pause between batches to avoid overwhelming sources
      if (i + BATCH_SIZE < feeds.length) {
        await new Promise(resolve => setTimeout(resolve, 1000))
      }
    }

    const processingTime = Date.now() - startTime
    const successRate = (successfulFeeds.length / feeds.length * 100).toFixed(1)

    console.log(`🎉 RSS fetch completed in ${processingTime}ms`)
    console.log(`📊 Success rate: ${successRate}% (${successfulFeeds.length}/${feeds.length})`)
    console.log(`📈 Total: ${totalInserted} inserted, ${totalSkipped} skipped`)

    return new Response(
      JSON.stringify({ 
        message: 'RSS fetch completed',
        inserted: totalInserted,
        skipped: totalSkipped,
        success_rate: successRate,
        processing_time_ms: processingTime,
        feeds_processed: feeds.length,
        successful_feeds: successfulFeeds.length,
        errors: errors.slice(0, 10) // Limit error list size
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    const processingTime = Date.now() - startTime
    console.error('💥 Critical error in enhanced fetch-rss:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        processing_time_ms: processingTime,
        details: error.message
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

// Helper functions (enhanced versions of previous implementations)
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
  if (item.guid) return item.guid
  
  let hash = 0
  const str = item.link
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash
  }
  return Math.abs(hash).toString()
}

function parseDate(dateString: string): Date {
  const parsed = new Date(dateString)
  return isNaN(parsed.getTime()) ? new Date() : parsed
}