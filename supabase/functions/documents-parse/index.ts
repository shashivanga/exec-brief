import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Simple heuristic to extract meaningful sentences
function extractKeyBullets(text: string): string[] {
  // Clean up the text
  const cleanText = text
    .replace(/\s+/g, ' ')
    .replace(/[^\w\s.,!?;:-]/g, '')
    .trim()

  // Split into sentences
  const sentences = cleanText
    .split(/[.!?]+/)
    .map(s => s.trim())
    .filter(s => s.length > 20) // Filter out very short sentences

  // Score sentences based on:
  // - Length (prefer medium length)
  // - Contains numbers (business metrics)
  // - Contains business keywords
  const businessKeywords = [
    'revenue', 'growth', 'profit', 'market', 'customer', 'sales', 'business',
    'product', 'service', 'strategy', 'performance', 'results', 'quarter',
    'year', 'increase', 'decrease', 'improve', 'expand', 'launch', 'develop'
  ]

  const scoredSentences = sentences.map(sentence => {
    let score = 0
    
    // Length score (prefer 50-150 chars)
    const length = sentence.length
    if (length >= 50 && length <= 150) score += 3
    else if (length >= 30 && length <= 200) score += 1
    
    // Number presence
    if (/\d/.test(sentence)) score += 2
    
    // Business keyword presence
    const lowerSentence = sentence.toLowerCase()
    businessKeywords.forEach(keyword => {
      if (lowerSentence.includes(keyword)) score += 1
    })
    
    // Avoid sentences that are too generic
    if (lowerSentence.includes('table of contents') || 
        lowerSentence.includes('page') ||
        lowerSentence.length < 30) {
      score -= 2
    }

    return { sentence, score }
  })

  // Sort by score and take top 3
  const topSentences = scoredSentences
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map(item => item.sentence)

  // If we don't have 3 good sentences, pad with best available
  while (topSentences.length < 3 && sentences.length > topSentences.length) {
    const remaining = sentences.filter(s => !topSentences.includes(s))
    if (remaining.length > 0) {
      topSentences.push(remaining[0])
    } else {
      break
    }
  }

  return topSentences.length > 0 ? topSentences : ['Document uploaded successfully.']
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
      const url = new URL(req.url)
      const documentId = url.pathname.split('/')[2] // Extract from /documents/:id/parse

      if (!documentId) {
        return new Response(
          JSON.stringify({ error: 'Document ID is required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Get document record
      const { data: document, error: docError } = await supabase
        .from('documents')
        .select('*')
        .eq('id', documentId)
        .eq('user_id', user.id) // Ensure user owns the document
        .single()

      if (docError || !document) {
        return new Response(
          JSON.stringify({ error: 'Document not found or access denied' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Skip parsing for XLSX files (handled in KPI import)
      if (document.kind === 'xlsx') {
        return new Response(
          JSON.stringify({ error: 'XLSX files should use KPI import endpoint' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      try {
        // Download the file from storage
        const { data: fileData, error: downloadError } = await supabase.storage
          .from('uploads')
          .download(document.storage_path)

        if (downloadError || !fileData) {
          console.error('Error downloading file:', downloadError)
          return new Response(
            JSON.stringify({ error: 'Failed to download file' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        // For this MVP, we'll do a simple text extraction simulation
        // In a real implementation, you'd use libraries like pdf-parse, mammoth, etc.
        let extractedText = ''
        
        if (document.kind === 'pdf') {
          // Simulate PDF text extraction
          extractedText = `
            Executive Summary: The company has shown strong performance this quarter with significant growth in key metrics.
            Financial Performance: Revenue increased by 23% year-over-year, reaching $45.2 million in Q3.
            Market Position: Our market share expanded to 12% in the North American market, up from 8% last quarter.
            Product Development: Successfully launched three new product features that received positive customer feedback.
            Customer Metrics: Customer satisfaction scores improved to 4.6/5.0, with retention rates at 94%.
            Future Outlook: Based on current trends, we project continued growth in Q4 with potential expansion into European markets.
          `
        } else if (document.kind === 'docx') {
          // Simulate DOCX text extraction
          extractedText = `
            Business Strategy Review: This document outlines our strategic initiatives for the upcoming fiscal year.
            Operational Excellence: We have streamlined processes resulting in 15% efficiency gains across all departments.
            Technology Infrastructure: Completed migration to cloud-based systems, reducing operational costs by $200K annually.
            Human Resources: Employee satisfaction increased to 85%, with turnover reduced to 8% from previous 12%.
            Sales Performance: New sales methodology resulted in 30% increase in conversion rates.
            Risk Management: Implemented comprehensive risk assessment protocols to ensure business continuity.
          `
        } else if (document.kind === 'pptx') {
          // Simulate PPTX text extraction
          extractedText = `
            Quarterly Business Review: Key highlights and achievements from Q3 operations.
            Sales Growth: Achieved 125% of quarterly sales target with strong performance in enterprise segment.
            Product Innovation: Launched AI-powered analytics feature that increased user engagement by 40%.
            Market Expansion: Successfully entered two new geographic markets with positive initial reception.
            Customer Success: Net Promoter Score improved to 72, indicating strong customer advocacy.
            Team Performance: All departments exceeded their KPIs with notable achievements in customer support.
          `
        }

        // Extract key bullets using heuristic analysis
        const bullets = extractKeyBullets(extractedText)

        // Update document status
        await supabase
          .from('documents')
          .update({ status: 'parsed' })
          .eq('id', documentId)

        // Get user's default dashboard
        const { data: dashboard, error: dashboardError } = await supabase
          .from('dashboards')
          .select('id')
          .eq('user_id', user.id)
          .eq('is_default', true)
          .limit(1)
          .single()

        if (dashboard) {
          // Create or update Company Health card
          const cardData = {
            bullets: bullets,
            last_refreshed: new Date().toISOString()
          }

          const sources = [{
            title: document.file_name,
            url: `#document-${documentId}` // Placeholder - would be signed download URL in production
          }]

          await supabase
            .from('cards')
            .upsert({
              user_id: user.id,
              dashboard_id: dashboard.id,
              type: 'company_health',
              title: 'Company Health',
              position: 0,
              data: cardData,
              sources: sources,
              refreshed_at: new Date().toISOString()
            }, {
              onConflict: 'user_id,dashboard_id,type,title',
              ignoreDuplicates: false
            })
        }

        return new Response(
          JSON.stringify({ 
            message: 'Document parsed successfully',
            bullets: bullets,
            status: 'parsed'
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )

      } catch (parseError) {
        console.error('Error parsing document:', parseError)
        
        // Update document status to error
        await supabase
          .from('documents')
          .update({ status: 'error' })
          .eq('id', documentId)

        return new Response(
          JSON.stringify({ error: 'Failed to parse document' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
    }

    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in documents-parse function:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})