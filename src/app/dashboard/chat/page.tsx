"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { MessageSquare, Send, User, Bot, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

interface Message {
  role: "user" | "assistant"
  content: string
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "你好！我是你的 AI 设计助手。我可以帮你构思设计灵感，或者帮你测试 API 连接是否正常。",
    },
  ])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" })
    }
  }, [messages])

  const onSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault()
    if (!input.trim() || isLoading) return

    const userMessage: Message = { role: "user", content: input }
    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setIsLoading(true)

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: [...messages, userMessage],
        }),
      })

      if (!response.ok) {
        throw new Error("API Request Failed")
      }

      const data = await response.json()
      setMessages((prev) => [...prev, data])
    } catch (error) {
      console.error(error)
      toast.error("Failed to send message. Please check your API configuration.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="p-4 md:p-8 h-full max-w-4xl mx-auto flex flex-col gap-4">
      <div className="flex items-center gap-4">
        <div className="p-2 w-fit rounded-md bg-blue-500/10">
          <MessageSquare className="w-8 h-8 text-blue-500" />
        </div>
        <div>
          <h2 className="text-3xl font-bold tracking-tight">AI Chat Assistant</h2>
          <p className="text-muted-foreground">
            Test your API connection and get design inspiration.
          </p>
        </div>
      </div>

      <div className="flex-1 border rounded-lg overflow-hidden flex flex-col bg-muted/20 min-h-[500px]">
        <ScrollArea className="flex-1 p-4">
          <div className="space-y-4">
            {messages.map((message, index) => (
              <div
                key={index}
                className={cn(
                  "flex items-start gap-3 text-sm",
                  message.role === "user" ? "flex-row-reverse" : "flex-row"
                )}
              >
                <div
                  className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
                    message.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted"
                  )}
                >
                  {message.role === "user" ? (
                    <User className="w-5 h-5" />
                  ) : (
                    <Bot className="w-5 h-5" />
                  )}
                </div>
                <div
                  className={cn(
                    "p-3 rounded-lg max-w-[80%] break-words",
                    message.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted"
                  )}
                >
                  {message.content}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex items-start gap-3 text-sm">
                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                  <Bot className="w-5 h-5" />
                </div>
                <div className="p-3 rounded-lg bg-muted flex items-center">
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Thinking...
                </div>
              </div>
            )}
            <div ref={scrollRef} />
          </div>
        </ScrollArea>
        <div className="p-4 border-t bg-background">
          <form onSubmit={onSubmit} className="flex gap-2">
            <Input
              placeholder="Type a message..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={isLoading}
            />
            <Button type="submit" disabled={isLoading} size="icon">
              <Send className="w-4 h-4" />
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}
