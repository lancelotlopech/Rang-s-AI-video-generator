import { NextResponse } from "next/server"

export async function POST(req: Request) {
  try {
    // DALL-E 3 默认使用竖屏 1024x1792 以适配手机
    const { prompt, model, size = "1024x1792" } = await req.json()

    if (!prompt) {
      return new NextResponse("Prompt is required", { status: 400 })
    }

    const apiKey = process.env.OPENAI_API_KEY
    // 优先使用 IMAGE 专用的 Base URL，否则使用通用的，最后默认 OpenAI 官方
    let baseURL = process.env.OPENAI_IMAGE_BASE_URL || process.env.OPENAI_BASE_URL || "https://api.openai.com/v1"

    // 移除末尾的斜杠 (如果用户不小心加了)
    if (baseURL.endsWith("/")) {
      baseURL = baseURL.slice(0, -1)
    }

    // 模拟模式：如果没有配置 Key
    if (!apiKey || apiKey === "your_token_here") {
      console.log("[IMAGE_GENERATE] No API Key configured, returning mock image.")
      await new Promise((resolve) => setTimeout(resolve, 2000))
      return NextResponse.json({
        url: "https://images.unsplash.com/photo-1611162617474-5b21e879e113?q=80&w=1000&auto=format&fit=crop",
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

    let response
    let lastError
    const MAX_RETRIES = 3

    for (let i = 0; i < MAX_RETRIES; i++) {
      try {
        if (i > 0) {
          console.log(`[IMAGE_GENERATE] Retry attempt ${i + 1}/${MAX_RETRIES}...`)
          await new Promise(resolve => setTimeout(resolve, 2000)) // 等待 2 秒
        }

        response = await fetch(apiUrl, {
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
        })

        if (response.ok) break // 成功则跳出循环

        const errorData = await response.text()
        lastError = errorData
        
        // 只有 429 (Too Many Requests) 或 5xx 才重试
        if (response.status !== 429 && response.status < 500) {
          console.error("[IMAGE_GENERATE_API_ERROR]", response.status, errorData)
          return new NextResponse(`API Error: ${response.status} - ${errorData}`, { status: response.status })
        }

        console.warn(`[IMAGE_GENERATE_API_WARN] ${response.status} - ${errorData}`)
      } catch (e) {
        console.error(`[IMAGE_GENERATE_NETWORK_ERROR] Attempt ${i + 1} failed:`, e)
        lastError = String(e)
      }
    }

    if (!response || !response.ok) {
      return new NextResponse(`API Error: Max retries reached. Last error: ${lastError}`, { status: 500 })
    }

    const data = await response.json()

    if (!data.data || !data.data[0] || !data.data[0].url) {
      console.error("[IMAGE_GENERATE_FORMAT_ERROR]", data)
      return new NextResponse("Invalid API response format", { status: 500 })
    }

    return NextResponse.json({
      url: data.data[0].url,
    })

  } catch (error) {
    console.error("[IMAGE_GENERATE_INTERNAL_ERROR]", error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}
