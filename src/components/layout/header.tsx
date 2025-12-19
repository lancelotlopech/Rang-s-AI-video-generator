"use client"

import { MobileSidebar } from "@/components/layout/sidebar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { CreditCard, LogOut, User, Languages } from "lucide-react"
import { useLanguage } from "@/components/language-provider"

export function Header() {
  const { language, setLanguage } = useLanguage()

  return (
    <div className="border-b p-4">
      <div className="flex items-center justify-between">
        <MobileSidebar />
        <div className="flex w-full justify-end gap-x-4">
          <div className="flex items-center gap-x-2">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setLanguage(language === 'en' ? 'zh' : 'en')}
              className="w-9 px-0"
            >
              {language === 'en' ? 'EN' : '中'}
            </Button>
            <Button variant="outline" size="sm" className="hidden md:flex">
              <CreditCard className="mr-2 h-4 w-4" />
              Credits: 120
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src="/avatars/01.png" alt="@shadcn" />
                    <AvatarFallback>CN</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">shadcn</p>
                    <p className="text-xs leading-none text-muted-foreground">
                      m@example.com
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <User className="mr-2 h-4 w-4" />
                  <span>Profile</span>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <CreditCard className="mr-2 h-4 w-4" />
                  <span>Billing</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </div>
  )
}
