"use client"

import { useState } from "react"
import { Sidebar } from "@/components/layout/sidebar"
import { Header } from "@/components/layout/header"
import { cn } from "@/lib/utils"

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const [isCollapsed, setIsCollapsed] = useState(false)

  return (
    <div className="h-full relative">
      <div 
        className={cn(
          "hidden h-full md:flex md:flex-col md:fixed md:inset-y-0 z-[80] bg-gray-900 transition-all duration-300",
          isCollapsed ? "md:w-20" : "md:w-72"
        )}
      >
        <Sidebar isCollapsed={isCollapsed} toggleCollapse={() => setIsCollapsed(!isCollapsed)} />
      </div>
      <main 
        className={cn(
          "transition-all duration-300",
          isCollapsed ? "md:pl-20" : "md:pl-72"
        )}
      >
        <Header />
        {children}
      </main>
    </div>
  )
}
