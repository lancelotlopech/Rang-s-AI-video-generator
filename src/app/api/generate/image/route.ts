import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { fetchWithRetry } from "@/lib/api-client"
import { isOpenAIConfigured } from "@/lib/env"

export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // DALL-E 3 默认使用竖屏 1024x1792 以适配手机
    const { prompt, model, size = "1024x1792" } = await req.json()

    if (!prompt) {
      return new NextResponse("Prompt is required", { status: 400 })
    }

    // 1. Log Start (Pending)
    const { data: record, error: dbError } = await supabase
      .from('generations')
      .insert({
        user_id: user.id,
        type: 'image',
        model: model || "dall-e-3",
        prompt: prompt,
        status: 'processing',
        meta: { size, provider: 'openai' }
      })
      .select()
      .single()

    if (dbError) {
      console.error("[IMAGE_GENERATE] DB Error:", dbError)
      // Continue anyway? Or fail? Better to fail if we want to ensure logging.
    }

    const apiKey = process.env.OPENAI_API_KEY
    // 优先使用 IMAGE 专用的 Base URL，否则使用通用的，最后默认 OpenAI 官方
    let baseURL = process.env.OPENAI_IMAGE_BASE_URL || process.env.OPENAI_BASE_URL || "https://api.openai.com/v1"

    // 移除末尾的斜杠 (如果用户不小心加了)
    if (baseURL.endsWith("/")) {
      baseURL = baseURL.slice(0, -1)
    }

    // 模拟模式：如果没有配置 Key
    if (!isOpenAIConfigured()) {
      console.log("[IMAGE_GENERATE] No API Key configured, returning mock image.")
      await new Promise((resolve) => setTimeout(resolve, 2000))
      
      const mockUrl = "https://images.unsplash.com/photo-1611162617474-5b21e879e113?q=80&w=1000&auto=format&fit=crop"
      
      // Update DB
      if (record) {
        await supabase.from('generations').update({
          status: 'success',
          url: mockUrl,
          meta: { ...record.meta, mock: true }
        }).eq('id', record.id)
      }

      return NextResponse.json({
        url: mockUrl,
        mock: true
      })
    }

    // 构造完整的 API URL
    // 智能处理：如果 baseURL 已经包含了 /images/generations，就不再拼接
    let apiUrl = baseURL
    if (!apiUrl.includes("/images/generations")) {
      apiUrl = `${baseURL}/images/generations`
    }

    console.log(`[IMAGE_GENERATE] Requesting: ${apiUrl} with model: ${model || "dall-e-3"}`)

    const response = await fetchWithRetry(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: model || "dall-e-3",
        prompt: prompt,
        n: 1,
        size: size,
        quality: "standard",
      }),
      maxRetries: 3,
      retryDelay: 2000,
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error("[IMAGE_GENERATE_API_ERROR]", response.status, errorText)
      
      // Update DB with Error
      if (record) {
        await supabase.from('generations').update({
          status: 'failed',
          error_reason: errorText || 'Unknown Error'
        }).eq('id', record.id)
      }
      return new NextResponse(`API Error: ${errorText}`, { status: response.status })
    }

    const data = await response.json()

    if (!data.data || !data.data[0] || !data.data[0].url) {
      console.error("[IMAGE_GENERATE_FORMAT_ERROR]", data)
      if (record) {
        await supabase.from('generations').update({
          status: 'failed',
          error_reason: 'Invalid API Response Format'
        }).eq('id', record.id)
      }
      return new NextResponse("Invalid API response format", { status: 500 })
    }

    const imageUrl = data.data[0].url

    // Update DB Success
    if (record) {
      await supabase.from('generations').update({
        status: 'success',
        url: imageUrl
      }).eq('id', record.id)
    }

    return NextResponse.json({
      url: imageUrl,
    })

  } catch (error: unknown) {
    console.error("[IMAGE_GENERATE_INTERNAL_ERROR]", error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}
