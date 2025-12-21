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
    const { prompt, aspectRatio, model, images, duration } = body
    const { apiKey, createEndpoint } = getEndpoints()

    if (!apiKey) {
      return NextResponse.json(
        { error: 'Configuration Error', details: 'API Key not found' },
        { status: 500 }
      )
    }

    console.log(`[Video API] Creating task: ${model}`)

    // Construct payload strictly according to Yunwu API
    const payload: any = {
      model: model || 'veo3-fast',
      prompt: prompt,
      enhance_prompt: true, // Default to true as per doc recommendation
      enable_upsample: true, // Default to true
    }

    // Add optional fields
    if (aspectRatio) payload.aspect_ratio = aspectRatio
    if (duration) payload.duration = duration
    if (images && Array.isArray(images) && images.length > 0) {
      // Filter out empty strings
      const validImages = images.filter((img: string) => img && img.trim().length > 0)
      if (validImages.length > 0) {
        payload.images = validImages
      }
    }

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
