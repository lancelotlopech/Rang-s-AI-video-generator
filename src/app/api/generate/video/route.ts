import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { SupabaseClient } from '@supabase/supabase-js'

// Allow streaming responses up to 60 seconds
export const maxDuration = 60

async function getEndpoints(supabase: SupabaseClient) {
  // 1. Try to get from DB first
  let apiKey = null
  try {
    const { data } = await supabase
      .from('app_config')
      .select('value')
      .eq('key', 'YUNWU_API_KEY')
      .single()
    if (data) apiKey = data.value
  } catch {
    // Ignore DB error, fallback to env
  }

  // 2. Fallback to Env
  if (!apiKey) {
    apiKey = process.env.YUNWU_API_KEY || process.env.OPENAI_API_KEY
  }
  
  // Explicit endpoints from env
  let createEndpoint = process.env.YUNWU_VIDEO_ENDPOINT
  let queryEndpoint = process.env.YUNWU_VIDEO_QUERY_ENDPOINT

  // Fallback logic if not set
  if (!createEndpoint) {
    createEndpoint = 'https://yunwu.ai/v1/video/create'
  }
  if (!queryEndpoint) {
    queryEndpoint = 'https://yunwu.ai/v1/video/query'
  }

  return { apiKey, createEndpoint, queryEndpoint }
}

// Helper to get cost
function getModelCost(modelId: string): number {
  try {
    const envModels = process.env.NEXT_PUBLIC_VIDEO_MODELS
    if (!envModels) return 0
    const models = JSON.parse(envModels) as { id: string; credits: number }[]
    const model = models.find(m => m.id === modelId)
    return model?.credits || 0
  } catch {
    return 0
  }
}

export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { prompt, aspectRatio, model, images, duration, enhance_prompt, enable_upsample, resolution } = body
    const { apiKey, createEndpoint } = await getEndpoints(supabase)

    if (!apiKey) {
      return NextResponse.json(
        { error: 'Configuration Error', details: 'API Key not found' },
        { status: 500 }
      )
    }

    // 1. Check Credits & Deduct (using RPC for safety)
    const cost = getModelCost(model)
    
    // Call the secure decrement function
    const { error: deductError } = await supabase.rpc('decrement_credits', { amount: cost })

    if (deductError) {
      console.error('Credit deduction failed:', deductError)
      return NextResponse.json(
        { error: 'Insufficient credits', details: deductError.message },
        { status: 402 }
      )
    }

    console.log(`[Video API] Creating task: ${model} for user ${user.id} (Cost: ${cost})`)

    // 2. Log Generation Start
    // Note: Frontend now handles the initial DB insertion.
    // We trust the frontend to update it with the Task ID.

    let payload: Record<string, unknown> = {}

    // Handle Sora Models
    if (model && model.startsWith('sora')) {
      payload = {
        model: model,
        prompt: prompt,
        // Map aspectRatio to orientation
        orientation: aspectRatio === '16:9' ? 'landscape' : 'portrait',
        // Default to large (1080p)
        size: 'large',
        // Default to no watermark
        watermark: false,
        // Duration
        duration: duration ? parseInt(String(duration), 10) : 10,
        // Images
        images: []
      }

      if (images && Array.isArray(images) && images.length > 0) {
        const validImages = images.filter((img: string) => img && img.trim().length > 0)
        if (validImages.length > 0) {
          payload.images = validImages // Sora supports multiple images
        }
      }
    } 
    // Handle Veo/Other Models
    else {
      // Force upsample if resolution is 1080p or enable_upsample is true
      const shouldUpsample = resolution === '1080p' || enable_upsample === true

      payload = {
        model: model || 'veo3-fast',
        prompt: prompt,
        enhance_prompt: enhance_prompt !== undefined ? enhance_prompt : true,
        enable_upsample: shouldUpsample,
      }

      // Add optional fields
      if (aspectRatio) payload.aspect_ratio = aspectRatio
      if (duration) payload.duration = parseInt(String(duration), 10)
      if (images && Array.isArray(images) && images.length > 0) {
        // Filter out empty strings
        const validImages = images.filter((img: string) => img && img.trim().length > 0)
        if (validImages.length > 0) {
          // Pass all images to support multi-image references (e.g. start/end frames)
          payload.images = validImages
        }
      }
    }

    // Debug payload structure (without full base64)
    const debugPayload = { ...payload }
    if (Array.isArray(debugPayload.images)) {
      debugPayload.images = (debugPayload.images as string[]).map((img: string) => 
        img.startsWith('data:') ? `${img.substring(0, 30)}...[base64]` : img
      )
    }
    console.log('[Video API] Payload:', JSON.stringify(debugPayload, null, 2))

    const response = await fetch(createEndpoint!, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('❌ [Video API] Create Failed!')
      console.error('Status:', response.status)
      console.error('Body:', errorText)
      
      // Refund credits on API failure
      await supabase.rpc('increment_credits', { amount: cost })

      // Update log status
      // (Frontend handles this)

      return NextResponse.json(
        { error: 'Provider Error', details: errorText, status: response.status },
        { status: response.status }
      )
    }

    const data = await response.json()
    console.log('✅ [Video API] Create Success!')
    console.log(JSON.stringify(data, null, 2))

    // Update log status to success (or pending if async)
    // Usually 'pending' is fine until we get callback or poll result
    // But here we mark as 'processing' or keep 'pending'
    
    // Yunwu API returns { id: "...", status: "pending", ... }
    return NextResponse.json(data)

  } catch (error: unknown) {
    console.error('[Video API] Internal Error:', error)
    // Try to refund if possible (might fail if DB is down)
    // For simplicity, we skip complex refund logic on crash for now.

    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      { error: 'Internal Server Error', details: errorMessage },
      { status: 500 }
    )
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const taskId = searchParams.get('taskId')

    if (!taskId) {
      return NextResponse.json({ error: 'Missing taskId' }, { status: 400 })
    }

    const supabase = await createClient()
    const { apiKey, queryEndpoint } = await getEndpoints(supabase)
    
    // Yunwu Query: GET /v1/video/query?id={taskId}
    const pollUrl = `${queryEndpoint}?id=${taskId}`

    const response = await fetch(pollUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      return NextResponse.json(
        { error: 'Poll Error', details: errorText, status: response.status },
        { status: response.status }
      )
    }

    const data = await response.json()
    
    // Optional: Update generation log status if completed
    // This would require finding the log entry by some ID, but we don't store external task ID in generations table yet.
    // For now, we just return the data.

    return NextResponse.json(data)

  } catch (error: unknown) {
    console.error('[Video API] Poll Internal Error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      { error: 'Internal Server Error', details: errorMessage },
      { status: 500 }
    )
  }
}
