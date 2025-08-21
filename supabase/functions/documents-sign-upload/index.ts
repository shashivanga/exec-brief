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
      const { ext } = await req.json()

      if (!ext || !['pdf', 'docx', 'pptx', 'xlsx'].includes(ext)) {
        return new Response(
          JSON.stringify({ error: 'Valid file extension required (pdf, docx, pptx, xlsx)' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Get user's org
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

      // Generate unique document ID and file path
      const documentId = crypto.randomUUID()
      const storagePath = `uploads/${membership.org_id}/${documentId}.${ext}`

      // Create document record
      const { data: document, error: insertError } = await supabase
        .from('documents')
        .insert({
          id: documentId,
          org_id: membership.org_id,
          uploader_id: user.id,
          storage_path: storagePath,
          file_name: `document.${ext}`, // Will be updated later with actual filename
          kind: ext,
          status: 'stored'
        })
        .select()
        .single()

      if (insertError) {
        console.error('Error creating document record:', insertError)
        return new Response(
          JSON.stringify({ error: 'Failed to create document record' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Generate signed upload URL
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('uploads')
        .createSignedUploadUrl(storagePath)

      if (uploadError) {
        console.error('Error creating signed upload URL:', uploadError)
        return new Response(
          JSON.stringify({ error: 'Failed to create upload URL' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      return new Response(
        JSON.stringify({ 
          documentId: documentId,
          uploadUrl: uploadData.signedUrl
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in documents-sign-upload function:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})