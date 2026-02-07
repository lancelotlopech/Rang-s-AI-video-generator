import { NextResponse } from "next/server"
import OpenAI from "openai"
import { createClient } from "@/lib/supabase/server"
import { VIDEO_PROMPT_SYSTEM, buildEnhancePromptMessage, EnhancedPromptResult } from "@/lib/prompt-system"

// Create OpenAI client with configurable base URL
const getOpenAIClient = () => {
  const apiKey = process.env.OPENAI_API_KEY
  const baseURL = process.env.OPENAI_BASE_URL

  if (!apiKey || apiKey === "your_token_here") {
    return null
  }

  return new OpenAI({
    apiKey,
    baseURL: baseURL || undefined,
  })
}

// Try to call AI with fallback
async function callAIWithFallback(
  openai: OpenAI,
  messages: { role: "system" | "user"; content: string }[]
): Promise<string> {
  const primaryModel = process.env.PROMPT_ENHANCE_MODEL || "gemini-2.5-flash-preview"
  const fallbackModel = process.env.PROMPT_ENHANCE_FALLBACK_MODEL || "gpt-4o-mini"

  try {
    // Try primary model first
    const response = await openai.chat.completions.create({
      model: primaryModel,
      messages: messages,
      temperature: 0.7,
      max_tokens: 2000,
    })
    return response.choices[0]?.message?.content || ""
  } catch (primaryError) {
    console.warn(`[ENHANCE_PROMPT] Primary model ${primaryModel} failed, trying fallback...`, primaryError)
    
    try {
      // Try fallback model
      const response = await openai.chat.completions.create({
        model: fallbackModel,
        messages: messages,
        temperature: 0.7,
        max_tokens: 2000,
      })
      return response.choices[0]?.message?.content || ""
    } catch (fallbackError) {
      console.error(`[ENHANCE_PROMPT] Fallback model ${fallbackModel} also failed`, fallbackError)
      throw fallbackError
    }
  }
}

// Parse AI response to extract JSON
function parseAIResponse(content: string): EnhancedPromptResult {
  // Try to extract JSON from markdown code blocks
  const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/)
  const jsonStr = jsonMatch ? jsonMatch[1].trim() : content.trim()
  
  try {
    const parsed = JSON.parse(jsonStr)
    
    // Validate required fields
    if (!parsed.tags || !Array.isArray(parsed.tags)) {
      throw new Error("Missing or invalid 'tags' field")
    }
    if (!parsed.finalPrompt || typeof parsed.finalPrompt !== "string") {
      throw new Error("Missing or invalid 'finalPrompt' field")
    }
    
    // Ensure questions array exists
    if (!parsed.questions) {
      parsed.questions = []
    }
    
    return parsed as EnhancedPromptResult
  } catch (parseError) {
    console.error("[ENHANCE_PROMPT] Failed to parse AI response:", parseError)
    console.error("[ENHANCE_PROMPT] Raw content:", content)
    
    // Return a fallback result
    return {
      tags: [
        { category: "提示", icon: "⚠️", value: "AI 响应解析失败，请重试" }
      ],
      questions: [],
      finalPrompt: content.slice(0, 500) // Use raw content as fallback
    }
  }
}

export async function POST(req: Request) {
  try {
    // Auth check
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { prompt, referenceImages, targetModel } = await req.json()

    if (!prompt || typeof prompt !== "string") {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 })
    }

    const openai = getOpenAIClient()

    // Mock mode if no API key configured
    if (!openai) {
      return NextResponse.json({
        tags: [
          { category: "场景", icon: "🎬", value: "示例场景" },
          { category: "风格", icon: "🎨", value: "电影感" },
          { category: "镜头", icon: "📷", value: "中景" },
          { category: "运镜", icon: "🎥", value: "缓慢推进" },
        ],
        questions: [
          {
            id: "demo",
            question: "这是一个演示问题？",
            options: ["选项1", "选项2", "选项3"]
          }
        ],
        finalPrompt: "This is a demo prompt. Please configure your API key in .env.local to use real AI enhancement."
      } as EnhancedPromptResult)
    }

    // Build messages for AI
    const userMessage = buildEnhancePromptMessage(prompt, referenceImages, targetModel)
    
    const messages: { role: "system" | "user"; content: string }[] = [
      { role: "system", content: VIDEO_PROMPT_SYSTEM },
      { role: "user", content: userMessage }
    ]

    // Call AI with fallback
    const aiResponse = await callAIWithFallback(openai, messages)
    
    // Parse response
    const result = parseAIResponse(aiResponse)

    return NextResponse.json(result)
  } catch (error) {
    console.error("[ENHANCE_PROMPT_ERROR]", error)
    return NextResponse.json(
      { error: "Failed to enhance prompt", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
  }
}

// Also support updating the prompt with user selections
export async function PUT(req: Request) {
  try {
    // Auth check
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { originalResult, selections } = await req.json()

    if (!originalResult || !selections) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const openai = getOpenAIClient()

    if (!openai) {
      // In mock mode, just return the original prompt with selections appended
      let updatedPrompt = originalResult.finalPrompt
      for (const [, value] of Object.entries(selections)) {
        updatedPrompt += `, ${value}`
      }
      return NextResponse.json({ finalPrompt: updatedPrompt })
    }

    // Build a message to refine the prompt with user selections
    const refinementMessage = `
原始 prompt: ${originalResult.finalPrompt}

用户的选择:
${Object.entries(selections).map(([questionId, answer]) => {
  const question = originalResult.questions?.find((q: { id: string }) => q.id === questionId)
  return `- ${question?.question || questionId}: ${answer}`
}).join('\n')}

请根据用户的选择，更新并优化 finalPrompt。只输出更新后的英文 prompt，不需要其他内容。
`

    const messages: { role: "system" | "user"; content: string }[] = [
      { role: "system", content: "你是一个专业的视频 prompt 工程师。根据用户的选择更新 prompt。" },
      { role: "user", content: refinementMessage }
    ]

    const aiResponse = await callAIWithFallback(openai, messages)
    
    return NextResponse.json({ finalPrompt: aiResponse.trim() })
  } catch (error) {
    console.error("[ENHANCE_PROMPT_UPDATE_ERROR]", error)
    return NextResponse.json(
      { error: "Failed to update prompt", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
  }
}
