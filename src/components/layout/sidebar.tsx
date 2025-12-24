"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useTheme } from "next-themes"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import {
  LayoutDashboard,
  Smartphone,
  Palette,
  Video,
  CreditCard,
  Settings,
  Menu,
  Image as ImageIcon,
  MessageSquare,
  FileText,
  PanelLeftClose,
  PanelLeftOpen,
  Sun,
  Moon,
  LogOut,
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {
  isCollapsed?: boolean
  toggleCollapse?: () => void
}

export function Sidebar({ className, isCollapsed = false, toggleCollapse }: SidebarProps) {
  const pathname = usePathname()
  const { theme, setTheme } = useTheme()
  const router = useRouter()
  const supabase = createClient()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
    toast.success("Logged out successfully")
  }

  const routes = [
    // {
    //   label: "Overview",
    //   icon: LayoutDashboard,
    //   href: "/dashboard",
    //   color: "text-sky-500",
    // },
    // {
    //   label: "Screenshot Studio",
    //   icon: Smartphone,
    //   href: "/dashboard/screenshot",
    //   color: "text-violet-500",
    // },
    // {
    //   label: "App Store Studio",
    //   icon: Smartphone,
    //   href: "/dashboard/studio",
    //   color: "text-indigo-500",
    // },
    // {
    //   label: "Icon & Illustration",
    //   icon: Palette,
    //   href: "/dashboard/icon",
    //   color: "text-pink-700",
    // },
    {
      label: "Video Generator",
      icon: Video,
      href: "/dashboard/video",
      color: "text-orange-700",
    },
    // {
    //   label: "AI Chat Assistant",
    //   icon: MessageSquare,
    //   href: "/dashboard/chat",
    //   color: "text-blue-500",
    // },
    // {
    //   label: "My Gallery",
    //   icon: ImageIcon,
    //   href: "/dashboard/gallery",
    //   color: "text-emerald-500",
    // },
    {
      label: "Billing & Credits",
      icon: CreditCard,
      href: "/dashboard/billing",
      color: "text-gray-500",
    },
  ]

  return (
    <div className={cn("flex flex-col h-full bg-card border-r", className)}>
      <div className="flex-1 py-4 overflow-y-auto">
        <div className="px-3 py-2">
          <div className={cn("flex items-center mb-6 transition-all duration-300 h-10", isCollapsed ? "justify-center px-0" : "px-4")}>
            {isCollapsed ? (
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold shrink-0">
                F
              </div>
            ) : (
              <h2 className="text-lg font-semibold tracking-tight whitespace-nowrap overflow-hidden text-foreground">
                Foxio Design
              </h2>
            )}
          </div>
          
          <div className="space-y-1">
            {routes.map((route) => (
              <Button
                key={route.href}
                variant={pathname === route.href ? "secondary" : "ghost"}
                className={cn(
                  "w-full transition-all duration-300", 
                  isCollapsed ? "justify-center px-2" : "justify-start"
                )}
                asChild
                title={isCollapsed ? route.label : undefined}
              >
                <Link href={route.href}>
                  <route.icon className={cn("h-5 w-5 transition-all shrink-0", route.color, isCollapsed ? "mr-0" : "mr-2")} />
                  {!isCollapsed && <span className="whitespace-nowrap overflow-hidden">{route.label}</span>}
                </Link>
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="p-3 border-t bg-card space-y-1">
        {/* Theme Toggle */}
        <Button
          variant="ghost"
          className={cn(
            "w-full transition-all duration-300", 
            isCollapsed ? "justify-center px-2" : "justify-start"
          )}
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          title={isCollapsed ? "Toggle Theme" : undefined}
        >
          <div className="relative h-5 w-5 shrink-0">
            <Sun className="absolute h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          </div>
          {!isCollapsed && <span className="ml-2 whitespace-nowrap overflow-hidden">Theme</span>}
        </Button>

        {/* Logout */}
        <Button
          variant="ghost"
          className={cn(
            "w-full transition-all duration-300 text-red-500 hover:text-red-600 hover:bg-red-50", 
            isCollapsed ? "justify-center px-2" : "justify-start"
          )}
          onClick={handleLogout}
          title={isCollapsed ? "Logout" : undefined}
        >
          <LogOut className="h-5 w-5 shrink-0" />
          {!isCollapsed && <span className="ml-2 whitespace-nowrap overflow-hidden">Logout</span>}
        </Button>

        {/* Collapse Toggle */}
        {toggleCollapse && (
          <Button
            variant="ghost"
            className={cn(
              "w-full transition-all duration-300 hidden md:flex", 
              isCollapsed ? "justify-center px-2" : "justify-start"
            )}
            onClick={toggleCollapse}
            title={isCollapsed ? "Expand Sidebar" : undefined}
          >
            {isCollapsed ? <PanelLeftOpen className="h-5 w-5 shrink-0" /> : <PanelLeftClose className="h-5 w-5 shrink-0" />}
            {!isCollapsed && <span className="ml-2 whitespace-nowrap overflow-hidden">Collapse</span>}
          </Button>
        )}
      </div>
    </div>
  )
}

export function MobileSidebar() {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="p-0">
        <Sidebar />
      </SheetContent>
    </Sheet>
  )
}
