import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Video, Smartphone, Palette, MessageSquare, Image as ImageIcon } from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"

export default function DashboardPage() {
  const tools = [
    {
      label: "Screenshot Studio",
      icon: Smartphone,
      href: "/dashboard/screenshot",
      color: "text-violet-500",
      bgColor: "bg-violet-500/10",
      description: "Generate stunning App Store screenshots from prompts.",
    },
    {
      label: "App Store Studio",
      icon: Smartphone,
      href: "/dashboard/studio",
      color: "text-indigo-500",
      bgColor: "bg-indigo-500/10",
      description: "Design beautiful App Store screenshots with templates.",
    },
    {
      label: "Icon & Illustration",
      icon: Palette,
      href: "/dashboard/icon",
      color: "text-pink-700",
      bgColor: "bg-pink-700/10",
      description: "Create unique icons and illustrations with AI.",
    },
    {
      label: "Ad Video Generator",
      icon: Video,
      href: "/dashboard/video",
      color: "text-orange-700",
      bgColor: "bg-orange-700/10",
      description: "Produce engaging ad videos in multiple aspect ratios.",
    },
    {
      label: "AI Chat",
      icon: MessageSquare,
      href: "/dashboard/chat",
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
      description: "Chat with AI assistant for creative ideas.",
    },
    {
      label: "My Gallery",
      icon: ImageIcon,
      href: "/dashboard/gallery",
      color: "text-emerald-500",
      bgColor: "bg-emerald-500/10",
      description: "View and manage your generated content.",
    },
  ]

  return (
    <div className="p-8 space-y-8">
      <div className="space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        <p className="text-muted-foreground">
          Welcome back! Choose a tool to start creating.
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {tools.map((tool) => (
          <Link key={tool.href} href={tool.href}>
            <Card className="hover:bg-accent/50 transition cursor-pointer border-muted-foreground/20">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {tool.label}
                </CardTitle>
                <tool.icon className={cn("h-4 w-4", tool.color)} />
              </CardHeader>
              <CardContent>
                <div className={cn("p-2 w-fit rounded-md mb-2", tool.bgColor)}>
                  <tool.icon className={cn("w-8 h-8", tool.color)} />
                </div>
                <p className="text-xs text-muted-foreground">
                  {tool.description}
                </p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}
