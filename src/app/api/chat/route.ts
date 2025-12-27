import { NextResponse } from "next/server"
import OpenAI from "openai"
import { createClient } from "@/lib/supabase/server"

// 创建 OpenAI 客户端配置
// 注意：这里每次请求都会重新读取环境变量，确保修改 .env 后能生效（在开发模式下）
const getOpenAIClient = () => {
  const apiKey = process.env.OPENAI_API_KEY
  const baseURL = process.env.OPENAI_BASE_URL

  // 如果没有配置 Key，返回 null
  if (!apiKey || apiKey === "your_token_here") {
    return null
  }

  return new OpenAI({
    apiKey,
    baseURL: baseURL || undefined, // 如果没配 baseURL，就用默认的
  })
}

export async function POST(req: Request) {
  try {
    // Auth check
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { messages, model: requestedModel } = await req.json()

    if (!messages) {
      return new NextResponse("Messages are required", { status: 400 })
    }

    const openai = getOpenAIClient()

    // 模拟模式：如果没有配置 Key
    if (!openai) {
      await new Promise((resolve) => setTimeout(resolve, 1000))
      return NextResponse.json({
        role: "assistant",
        content: "这是一个模拟回复。请在 .env.local 中配置你的 API Key 以使用真实 AI。",
      })
    }

    // Use requested model or fallback to env/default
    const model = requestedModel || process.env.OPENAI_MODEL || "gpt-3.5-turbo"

    const response = await openai.chat.completions.create({
      model: model,
      messages: messages,
    })

    return NextResponse.json(response.choices[0].message)
  } catch (error) {
    console.error("[CHAT_ERROR]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}
