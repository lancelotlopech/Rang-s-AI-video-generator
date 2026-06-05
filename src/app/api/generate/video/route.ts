import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { SupabaseClient } from '@supabase/supabase-js'

// Allow streaming responses up to 60 seconds
export const maxDuration = 60

type JsonRecord = Record<string, unknown>

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}

function getRecord(value: unknown): JsonRecord | null {
  return value && typeof value === 'object' ? value as JsonRecord : null
}

function getString(value: unknown): string | null {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : null
}

function getNestedRecord(source: JsonRecord, key: string): JsonRecord | null {
  return getRecord(source[key])
}

function getArrayItemRecord(source: JsonRecord, key: string, index: number): JsonRecord | null {
  const value = source[key]
  return Array.isArray(value) ? getRecord(value[index]) : null
}

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

  const baseUrl = (process.env.YUNWU_BASE_URL || 'https://yunwu.ai/v1').replace(/\/+$/, '')

  return { apiKey, createEndpoint, queryEndpoint, baseUrl }
}

// Helper to get cost
async function getModelCost(supabase: SupabaseClient, modelId: string): Promise<number> {
  try {
    const { data } = await supabase
      .from('video_models')
      .select('credits')
      .eq('id', modelId)
      .eq('is_active', true)
      .maybeSingle()

    if (typeof data?.credits === 'number') {
      return data.credits
    }
  } catch (error) {
    console.warn('[Video API] Failed to read model cost from DB, falling back to env:', error)
  }

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

function isKlingModel(modelId: string): boolean {
  return modelId.toLowerCase().includes('kling')
}

function tryParseJson(value: string): JsonRecord | null {
  try {
    return getRecord(JSON.parse(value))
  } catch {
    const match = value.match(/\{[\s\S]*\}/)
    if (!match) return null

    try {
      return getRecord(JSON.parse(match[0]))
    } catch {
      return null
    }
  }
}

function normalizeKlingCreateResponse(data: unknown) {
  const response = getRecord(data) || {}
  const firstChoice = getArrayItemRecord(response, 'choices', 0)
  const message = firstChoice ? getNestedRecord(firstChoice, 'message') : null
  const content = message ? getString(message.content) : null
  const parsedContent = typeof content === 'string' ? tryParseJson(content) : null
  const source = parsedContent || response
  const dataRecord = getNestedRecord(source, 'data')
  const firstDataRecord = getArrayItemRecord(source, 'data', 0)

  const directVideoUrl =
    getString(source.video_url) ||
    getString(source.videoUrl) ||
    getString(source.url) ||
    (dataRecord && (
      getString(dataRecord.video_url) ||
      getString(dataRecord.videoUrl) ||
      getString(dataRecord.url)
    )) ||
    (firstDataRecord && getString(firstDataRecord.url))

  const taskId =
    getString(source.id) ||
    getString(source.task_id) ||
    getString(source.taskId) ||
    (dataRecord && (
      getString(dataRecord.id) ||
      getString(dataRecord.task_id) ||
      getString(dataRecord.taskId)
    )) ||
    (content && !directVideoUrl ? content : null)

  if (directVideoUrl) {
    return {
      id: taskId || crypto.randomUUID(),
      status: getString(source.status) || 'completed',
      video_url: directVideoUrl,
      data: source.data || response,
      raw: response,
    }
  }

  if (taskId) {
    return {
      id: taskId,
      status: getString(source.status) || 'processing',
      data: source.data || response,
      raw: response,
    }
  }

  return {
    status: 'failed',
    error: 'Invalid Kling response',
    details: content || data,
    raw: data,
  }
}

function normalizeVideoQueryResponse(data: unknown) {
  const response = getRecord(data)
  if (!response) return data

  const dataRecord = getNestedRecord(response, 'data')
  const firstDataRecord = getArrayItemRecord(response, 'data', 0)

  const videoUrl =
    getString(response.video_url) ||
    getString(response.videoUrl) ||
    getString(response.url) ||
    (dataRecord && (
      getString(dataRecord.video_url) ||
      getString(dataRecord.videoUrl) ||
      getString(dataRecord.url)
    )) ||
    (firstDataRecord && getString(firstDataRecord.url))

  if (!videoUrl) return response

  return {
    ...response,
    video_url: videoUrl,
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
    const requestedModel = typeof model === 'string' ? model.trim() : ''
    const { apiKey, createEndpoint, baseUrl } = await getEndpoints(supabase)

    if (!apiKey) {
      return NextResponse.json(
        { error: 'Configuration Error', details: 'API Key not found' },
        { status: 500 }
      )
    }

    if (!requestedModel) {
      return NextResponse.json(
        { error: 'Validation Error', details: 'Model is required' },
        { status: 400 }
      )
    }

    // 0. Rate Limit Check (2 requests per minute)
    const oneMinuteAgo = new Date(Date.now() - 60 * 1000).toISOString()
    const { count, error: rateLimitError } = await supabase
      .from('video_generations')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .gte('created_at', oneMinuteAgo)

    if (rateLimitError) {
      console.error('Rate limit check failed:', rateLimitError)
    } else if (count !== null && count >= 2) {
      return NextResponse.json(
        { error: 'Rate limit exceeded', details: 'You can only generate 2 videos per minute.' },
        { status: 429 }
      )
    }

    // 1. Check Credits & Deduct (using RPC for safety)
    const cost = await getModelCost(supabase, requestedModel)
    
    // Call the secure decrement function
    const { error: deductError } = await supabase.rpc('decrement_credits', { amount: cost })

    if (deductError) {
      console.error('Credit deduction failed:', deductError)
      return NextResponse.json(
        { error: 'Insufficient credits', details: deductError.message },
        { status: 402 }
      )
    }

    console.log(`[Video API] Creating task: ${requestedModel} for user ${user.id} (Cost: ${cost})`)

    // 2. Log Generation Start
    // Note: Frontend now handles the initial DB insertion.
    // We trust the frontend to update it with the Task ID.

    let payload: JsonRecord = {}

    const isKling = isKlingModel(requestedModel)

    // Handle Kling models via Yunwu's OpenAI-compatible chat completions endpoint.
    if (isKling) {
      payload = {
        model: requestedModel,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
        stream: false,
      }
    }
    // Handle Sora Models
    else if (requestedModel.startsWith('sora')) {
      payload = {
        model: requestedModel,
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
        model: requestedModel,
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
      debugPayload.images = debugPayload.images.map((img: unknown) =>
        typeof img === 'string' && img.startsWith('data:') ? `${img.substring(0, 30)}...[base64]` : img
      )
    }
    console.log('[Video API] Payload:', JSON.stringify(debugPayload, null, 2))

    const endpoint = isKling ? `${baseUrl}/chat/completions` : createEndpoint!

    const response = await fetch(endpoint, {
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
    
    if (isKling) {
      const normalized = normalizeKlingCreateResponse(data)

      if (!normalized.id) {
        await supabase.rpc('increment_credits', { amount: cost })
        return NextResponse.json(
          { error: 'Provider Error', details: normalized },
          { status: 502 }
        )
      }

      return NextResponse.json(normalized)
    }

    // Yunwu API returns { id: "...", status: "pending", ... }
    return NextResponse.json(data)

  } catch (error) {
    console.error('[Video API] Internal Error:', error)
    return NextResponse.json(
      { error: 'Internal Server Error', details: getErrorMessage(error) },
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

    return NextResponse.json(normalizeVideoQueryResponse(data))

  } catch (error) {
    console.error('[Video API] Poll Internal Error:', error)
    return NextResponse.json(
      { error: 'Internal Server Error', details: getErrorMessage(error) },
      { status: 500 }
    )
  }
}
