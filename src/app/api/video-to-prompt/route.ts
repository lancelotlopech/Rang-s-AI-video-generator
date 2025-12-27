import { NextResponse } from "next/server"
import { NextRequest } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { VIDEO_ANALYSIS_SYSTEM_PROMPT, buildVideoAnalysisMessage, VideoAnalysisResult, TokenUsage } from "@/lib/video-analysis-prompt"

// Gemini API configuration
const GEMINI_API_KEY = process.env.OPENAI_API_KEY // Using same key
const GEMINI_BASE_URL = process.env.GEMINI_BASE_URL || "https://yunwu.ai"
const GEMINI_MODEL = process.env.VIDEO_ANALYSIS_MODEL || "gemini-2.5-pro"

// Max video size for base64 (15MB before encoding, ~20MB after)
const MAX_VIDEO_SIZE = 15 * 1024 * 1024

interface GeminiGenerateResponse {
  candidates: Array<{
    content: {
      parts: Array<{
        text?: string
      }>
      role: string
    }
    finishReason: string
    index: number
  }>
  usageMetadata?: {
    promptTokenCount: number
    candidatesTokenCount: number
    totalTokenCount: number
  }
  error?: {
    code: number
    message: string
    status: string
  }
}

// Download video and convert to base64
async function downloadVideoAsBase64(videoUrl: string): Promise<{ base64: string; mimeType: string; size: number }> {
  console.log(`[VIDEO_DOWNLOAD] Downloading video from: ${videoUrl}`)
  
  const response = await fetch(videoUrl)
  if (!response.ok) {
    throw new Error(`Failed to download video: ${response.status} ${response.statusText}`)
  }
  
  const arrayBuffer = await response.arrayBuffer()
  const size = arrayBuffer.byteLength
  
  console.log(`[VIDEO_DOWNLOAD] Video size: ${(size / 1024 / 1024).toFixed(2)} MB`)
  
  if (size > MAX_VIDEO_SIZE) {
    throw new Error(`Video too large: ${(size / 1024 / 1024).toFixed(2)} MB. Maximum allowed: ${(MAX_VIDEO_SIZE / 1024 / 1024).toFixed(0)} MB. Please compress the video first.`)
  }
  
  // Convert to base64
  const uint8Array = new Uint8Array(arrayBuffer)
  let binary = ''
  for (let i = 0; i < uint8Array.length; i++) {
    binary += String.fromCharCode(uint8Array[i])
  }
  const base64 = btoa(binary)
  
  // Determine mime type
  const contentType = response.headers.get('content-type')
  let mimeType = 'video/mp4'
  if (contentType) {
    if (contentType.includes('video/webm')) mimeType = 'video/webm'
    else if (contentType.includes('video/quicktime') || contentType.includes('video/mov')) mimeType = 'video/mov'
    else if (contentType.includes('video/mp4')) mimeType = 'video/mp4'
  }
  
  console.log(`[VIDEO_DOWNLOAD] Converted to base64, mime type: ${mimeType}`)
  
  return { base64, mimeType, size }
}

// Call Gemini generateContent API with inline_data
async function analyzeVideoWithGemini(
  base64Data: string, 
  mimeType: string, 
  prompt: string
): Promise<{ content: string; tokenUsage: TokenUsage }> {
  if (!GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY not configured")
  }
  
  const generateUrl = `${GEMINI_BASE_URL}/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`
  
  console.log(`[VIDEO_ANALYSIS] Calling generateContent with model: ${GEMINI_MODEL}`)
  console.log(`[VIDEO_ANALYSIS] Base64 data length: ${base64Data.length} chars`)
  
  // Use systemInstruction to set the system prompt separately
  // This helps Gemini understand this is a text generation task, not object detection
  const requestBody = {
    systemInstruction: {
      parts: [{ text: VIDEO_ANALYSIS_SYSTEM_PROMPT }]
    },
    contents: [
      {
        parts: [
          {
            inline_data: {
              mime_type: mimeType,
              data: base64Data
            }
          },
          {
            text: prompt
          }
        ]
      }
    ],
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 8000,
      responseMimeType: "application/json"  // Force JSON output
    }
  }
  
  console.log(`[VIDEO_ANALYSIS] Sending request to Gemini...`)
  
  const response = await fetch(generateUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestBody)
  })
  
  const result: GeminiGenerateResponse = await response.json()
  
  if (!response.ok || result.error) {
    const errorMsg = result.error?.message || `API error: ${response.status}`
    console.error(`[VIDEO_ANALYSIS] API error:`, result.error || response.status)
    throw new Error(`Gemini API error: ${errorMsg}`)
  }
  
  const content = result.candidates?.[0]?.content?.parts?.[0]?.text || ""
  const tokenUsage: TokenUsage = {
    promptTokens: result.usageMetadata?.promptTokenCount || 0,
    completionTokens: result.usageMetadata?.candidatesTokenCount || 0,
    totalTokens: result.usageMetadata?.totalTokenCount || 0
  }
  
  console.log(`[VIDEO_ANALYSIS] Token usage:`, tokenUsage)
  console.log(`[VIDEO_ANALYSIS] Response length: ${content.length} chars`)
  
  return { content, tokenUsage }
}

// Parse AI response to extract JSON
function parseAIResponse(content: string): { result: VideoAnalysisResult | null; parseError: string | null } {
  // Try to extract JSON from markdown code blocks
  const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/)
  const jsonStr = jsonMatch ? jsonMatch[1].trim() : content.trim()
  
  try {
    const parsed = JSON.parse(jsonStr)
    
    // Validate required fields
    if (!parsed.generatedPrompt || typeof parsed.generatedPrompt !== "string") {
      return { 
        result: null, 
        parseError: "Missing or invalid 'generatedPrompt' field in AI response" 
      }
    }
    
    return { result: parsed as VideoAnalysisResult, parseError: null }
  } catch (parseError) {
    console.error("[VIDEO_ANALYSIS] Failed to parse AI response:", parseError)
    console.error("[VIDEO_ANALYSIS] Raw content:", content.slice(0, 500))
    
    return { 
      result: null, 
      parseError: `JSON parse error: ${parseError instanceof Error ? parseError.message : 'Unknown error'}` 
    }
  }
}

export async function POST(req: Request) {
  const debugInfo: {
    videoUrl?: string
    model?: string
    videoSize?: string
    mimeType?: string
    requestSent?: boolean
    rawResponse?: string
    parseError?: string
    tokenUsage?: TokenUsage
  } = {}

  try {
    // Auth check
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { videoUrl } = await req.json()
    debugInfo.videoUrl = videoUrl
    debugInfo.model = GEMINI_MODEL

    if (!videoUrl || typeof videoUrl !== "string") {
      return NextResponse.json({ 
        error: "Video URL is required",
        debug: debugInfo
      }, { status: 400 })
    }

    if (!GEMINI_API_KEY || GEMINI_API_KEY === "your_token_here") {
      return NextResponse.json({
        error: "API not configured",
        details: "Please configure OPENAI_API_KEY in .env.local",
        debug: debugInfo
      }, { status: 500 })
    }

    console.log(`[VIDEO_ANALYSIS] ========== START ==========`)
    console.log(`[VIDEO_ANALYSIS] Video URL: ${videoUrl}`)
    console.log(`[VIDEO_ANALYSIS] Model: ${GEMINI_MODEL}`)
    console.log(`[VIDEO_ANALYSIS] Base URL: ${GEMINI_BASE_URL}`)

    // Step 1: Download video and convert to base64
    const { base64, mimeType, size } = await downloadVideoAsBase64(videoUrl)
    debugInfo.videoSize = `${(size / 1024 / 1024).toFixed(2)} MB`
    debugInfo.mimeType = mimeType
    
    // Step 2: Analyze video with Gemini using inline_data
    debugInfo.requestSent = true
    const userMessage = buildVideoAnalysisMessage(videoUrl)
    
    const { content: rawResponse, tokenUsage } = await analyzeVideoWithGemini(
      base64,
      mimeType,
      userMessage
    )
    
    debugInfo.rawResponse = rawResponse
    debugInfo.tokenUsage = tokenUsage

    console.log(`[VIDEO_ANALYSIS] Raw AI response:`)
    console.log(rawResponse.slice(0, 1000))
    console.log(`[VIDEO_ANALYSIS] ========== END ==========`)

    // Parse response
    const { result, parseError } = parseAIResponse(rawResponse)
    
    if (parseError) {
      debugInfo.parseError = parseError
      
      return NextResponse.json({
        error: "Failed to parse AI response",
        details: parseError,
        debug: debugInfo,
        rawResponse: rawResponse,
        tokenUsage
      }, { status: 422 })
    }

    if (!result) {
      return NextResponse.json({
        error: "AI returned empty result",
        debug: debugInfo,
        rawResponse: rawResponse,
        tokenUsage
      }, { status: 422 })
    }

    // Save to database for history
    await supabase.from('generations').insert({
      user_id: user.id,
      type: 'video-analysis',
      prompt: videoUrl,
      model: GEMINI_MODEL,
      status: 'completed',
      meta: {
        result,
        tokenUsage,
        videoSize: debugInfo.videoSize,
        rawResponse: rawResponse.slice(0, 5000) // Limit size
      }
    })

    return NextResponse.json({
      result,
      tokenUsage,
      debug: debugInfo,
      rawResponse: rawResponse
    })
  } catch (error) {
    console.error("[VIDEO_ANALYSIS_ERROR]", error)
    
    const errorMessage = error instanceof Error ? error.message : "Unknown error"
    const errorStack = error instanceof Error ? error.stack : undefined
    
    return NextResponse.json({
      error: "Failed to analyze video",
      details: errorMessage,
      stack: process.env.NODE_ENV === 'development' ? errorStack : undefined,
      debug: debugInfo
    }, { status: 500 })
  }
}

// GET - Fetch video analysis history
export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const searchParams = req.nextUrl.searchParams
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')

    const { data: history, error, count } = await supabase
      .from('generations')
      .select('*', { count: 'exact' })
      .eq('user_id', user.id)
      .eq('type', 'video-analysis')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      console.error("[VIDEO_HISTORY_ERROR]", error)
      return NextResponse.json({ error: "Failed to fetch history" }, { status: 500 })
    }

    return NextResponse.json({
      history: history || [],
      total: count || 0,
      limit,
      offset
    })
  } catch (error) {
    console.error("[VIDEO_HISTORY_ERROR]", error)
    return NextResponse.json({ error: "Failed to fetch history" }, { status: 500 })
  }
}

// DELETE - Delete a video analysis record
export async function DELETE(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const searchParams = req.nextUrl.searchParams
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: "ID is required" }, { status: 400 })
    }

    // Delete only if it belongs to the user
    const { error } = await supabase
      .from('generations')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)
      .eq('type', 'video-analysis')

    if (error) {
      console.error("[VIDEO_DELETE_ERROR]", error)
      return NextResponse.json({ error: "Failed to delete record" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[VIDEO_DELETE_ERROR]", error)
    return NextResponse.json({ error: "Failed to delete record" }, { status: 500 })
  }
}
