import { NextResponse } from 'next/server'

// Allow streaming responses up to 60 seconds
export const maxDuration = 60

function getEndpoints() {
  const apiKey = process.env.YUNWU_API_KEY || process.env.OPENAI_API_KEY
  
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

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { prompt, aspectRatio, model, images, duration, enhance_prompt, enable_upsample } = body
    const { apiKey, createEndpoint } = getEndpoints()

    if (!apiKey) {
      return NextResponse.json(
        { error: 'Configuration Error', details: 'API Key not found' },
        { status: 500 }
      )
    }

    console.log(`[Video API] Creating task: ${model}`)

    let payload: any = {}

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
      payload = {
        model: model || 'veo3-fast',
        prompt: prompt,
        enhance_prompt: enhance_prompt !== undefined ? enhance_prompt : true,
        enable_upsample: enable_upsample !== undefined ? enable_upsample : true,
      }

      // Add optional fields
      if (aspectRatio) payload.aspect_ratio = aspectRatio
      if (duration) payload.duration = parseInt(String(duration), 10)
      if (images && Array.isArray(images) && images.length > 0) {
        // Filter out empty strings
        const validImages = images.filter((img: string) => img && img.trim().length > 0)
        if (validImages.length > 0) {
          // Revert: API expects []string according to docs
          // We take only the first image to be safe, as Veo typically supports single ref image
          payload.images = [validImages[0]]
        }
      }
    }

    // Debug payload structure (without full base64)
    const debugPayload = { ...payload }
    if (debugPayload.images) {
      debugPayload.images = debugPayload.images.map((img: string) => 
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
      console.error('Headers:', Object.fromEntries(response.headers.entries()))
      console.error('Body:', errorText)
      
      return NextResponse.json(
        { error: 'Provider Error', details: errorText, status: response.status },
        { status: response.status }
      )
    }

    const data = await response.json()
    console.log('✅ [Video API] Create Success!')
    console.log(JSON.stringify(data, null, 2))

    // Yunwu API returns { id: "...", status: "pending", ... }
    return NextResponse.json(data)

  } catch (error: any) {
    console.error('[Video API] Internal Error:', error)
    return NextResponse.json(
      { error: 'Internal Server Error', details: error.message },
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

    const { apiKey, queryEndpoint } = getEndpoints()
    
    // Yunwu Query: GET /v1/video/query?id={taskId}
    const pollUrl = `${queryEndpoint}?id=${taskId}`

    console.log(`[Video API] Polling: ${pollUrl}`)

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
      console.error(`❌ [Video API] Poll Failed for ${taskId}`)
      console.error('Status:', response.status)
      console.error('Body:', errorText)
      
      return NextResponse.json(
        { error: 'Poll Error', details: errorText, status: response.status },
        { status: response.status }
      )
    }

    const data = await response.json()
    
    // Only log if status changed or failed to avoid spam
    if (data.status === 'failed' || data.status === 'completed' || data.status === 'succeeded') {
      console.log(`ℹ️ [Video API] Task ${taskId} Status: ${data.status}`)
      console.log(JSON.stringify(data, null, 2))
    }

    // Pass through the raw data from Yunwu
    return NextResponse.json(data)

  } catch (error: any) {
    console.error('[Video API] Poll Internal Error:', error)
    return NextResponse.json(
      { error: 'Internal Server Error', details: error.message },
      { status: 500 }
    )
  }
}
