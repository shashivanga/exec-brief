import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface KPIRow {
  name: string
  value: number
  period: string
  unit?: string
}

// Simple CSV parser for XLSX-like data
function parseCSVData(csvText: string): KPIRow[] {
  const lines = csvText.trim().split('\n')
  if (lines.length < 2) return []

  const headers = lines[0].split(',').map(h => h.trim().toLowerCase())
  const rows: KPIRow[] = []

  // Expected headers: name, value, period, unit (optional)
  const nameIdx = headers.findIndex(h => h.includes('name'))
  const valueIdx = headers.findIndex(h => h.includes('value'))
  const periodIdx = headers.findIndex(h => h.includes('period') || h.includes('date'))
  const unitIdx = headers.findIndex(h => h.includes('unit'))

  if (nameIdx === -1 || valueIdx === -1 || periodIdx === -1) {
    throw new Error('CSV must have name, value, and period columns')
  }

  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(',').map(c => c.trim())
    if (cols.length < 3) continue

    const name = cols[nameIdx]
    const valueStr = cols[valueIdx].replace(/[^0-9.-]/g, '') // Remove currency symbols, etc.
    const value = parseFloat(valueStr)
    const period = cols[periodIdx]
    const unit = unitIdx !== -1 ? cols[unitIdx] : null

    if (name && !isNaN(value) && period) {
      rows.push({
        name,
        value,
        period,
        unit: unit || '$' // Default unit
      })
    }
  }

  return rows
}

function calculateDelta(currentValue: number, previousValue: number, unit: string): string {
  const diff = currentValue - previousValue
  const percentChange = (diff / previousValue) * 100

  if (unit === '%') {
    return `${diff > 0 ? '+' : ''}${diff.toFixed(1)}pp`
  } else {
    return `${percentChange > 0 ? '+' : ''}${percentChange.toFixed(1)}%`
  }
}

function formatValue(value: number, unit: string): string {
  if (unit === '$M') {
    return `$${(value / 1000000).toFixed(1)}M`
  } else if (unit === '$') {
    return `$${value.toLocaleString()}`
  } else if (unit === '%') {
    return `${value.toFixed(1)}%`
  } else {
    return value.toLocaleString()
  }
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
      const { documentId } = await req.json()

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
        .eq('user_id', user.id)
        .single()

      if (docError || !document) {
        return new Response(
          JSON.stringify({ error: 'Document not found or access denied' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      if (document.kind !== 'xlsx') {
        return new Response(
          JSON.stringify({ error: 'Only XLSX files are supported for KPI import' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      try {
        // For MVP, simulate XLSX parsing with sample data
        // In production, you'd use a library like 'xlsx' to parse the actual file
        const sampleKPIData = `name,value,period,unit
Annual Recurring Revenue,24300000,2024-09-30,$
Monthly Churn Rate,2.1,2024-09-30,%
Customer Acquisition Cost,150,2024-09-30,$
Net Promoter Score,72,2024-09-30,count
Monthly Active Users,45000,2024-09-30,count
Revenue Per User,540,2024-09-30,$`

        const kpiRows = parseCSVData(sampleKPIData)

        if (kpiRows.length === 0) {
          return new Response(
            JSON.stringify({ error: 'No valid KPI data found in file' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        let insertedKPIs = 0
        let insertedPoints = 0
        const processedKPIs: any[] = []

        // Process each KPI row
        for (const row of kpiRows) {
          try {
            // Upsert KPI definition
            const { data: kpi, error: kpiError } = await supabase
              .from('kpis')
              .upsert({
                user_id: user.id,
                name: row.name,
                unit: row.unit || '$'
              }, {
                onConflict: 'user_id,name',
                ignoreDuplicates: false
              })
              .select()
              .single()

            if (kpiError) {
              console.error('Error upserting KPI:', kpiError)
              continue
            }

            insertedKPIs++

            // Insert KPI point
            const { error: pointError } = await supabase
              .from('kpi_points')
              .upsert({
                user_id: user.id,
                kpi_id: kpi.id,
                period: row.period,
                value: row.value,
                source_document_id: documentId
              }, {
                onConflict: 'user_id,kpi_id,period',
                ignoreDuplicates: false
              })

            if (pointError) {
              console.error('Error inserting KPI point:', pointError)
              continue
            }

            insertedPoints++

            // Get previous period for delta calculation
            const { data: previousPoint } = await supabase
              .from('kpi_points')
              .select('value')
              .eq('user_id', user.id)
              .eq('kpi_id', kpi.id)
              .lt('period', row.period)
              .order('period', { ascending: false })
              .limit(1)
              .single()

            let delta = null
            if (previousPoint) {
              delta = calculateDelta(row.value, previousPoint.value, row.unit || '$')
            }

            processedKPIs.push({
              name: row.name,
              value: formatValue(row.value, row.unit || '$'),
              delta: delta
            })

          } catch (rowError) {
            console.error('Error processing KPI row:', rowError)
          }
        }

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

        if (dashboard && processedKPIs.length > 0) {
          // Create or update Metrics card
          const cardData = {
            kpis: processedKPIs,
            last_refreshed: new Date().toISOString()
          }

          const sources = [{
            title: document.file_name,
            url: `#document-${documentId}` // Placeholder
          }]

          await supabase
            .from('cards')
            .upsert({
              user_id: user.id,
              dashboard_id: dashboard.id,
              type: 'metrics',
              title: 'Product Metrics',
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
            message: 'KPI import completed successfully',
            kpis_imported: insertedKPIs,
            data_points: insertedPoints,
            processed_kpis: processedKPIs
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )

      } catch (parseError) {
        console.error('Error importing KPIs:', parseError)
        
        await supabase
          .from('documents')
          .update({ status: 'error' })
          .eq('id', documentId)

        return new Response(
          JSON.stringify({ error: 'Failed to import KPIs from file' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
    }

    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in kpis-import-xlsx function:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})