"use client"

import { useEffect, useState } from "react"
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
import { CreditCard, LogOut, User, Languages, Loader2 } from "lucide-react"
import { useLanguage } from "@/components/language-provider"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { translations } from "@/lib/i18n"

export function Header() {
  const { language, setLanguage } = useLanguage()
  const supabase = createClient()
  const router = useRouter()
  const t = translations[language].nav
  
  const [user, setUser] = useState<any>(null)
  const [credits, setCredits] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUser(user)
        // Fetch profile for credits
        const { data: profile } = await supabase
          .from('profiles')
          .select('credits')
          .eq('id', user.id)
          .single()
        
        if (profile) {
          setCredits(profile.credits)
        }
      }
      setLoading(false)
    }
    getUser()

    // Optional: Subscribe to changes (if needed, but simple fetch is okay for now)
    // For better UX, we could subscribe to profile changes to update credits in real-time
    const channel = supabase
      .channel('header_credits')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
          filter: user ? `id=eq.${user.id}` : undefined
        },
        (payload) => {
          if (payload.new && typeof payload.new.credits === 'number') {
            setCredits(payload.new.credits)
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase, user?.id]) // Re-sub if user changes

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
    toast.success("Logged out successfully")
  }

  return (
    <div className="border-b p-4 bg-card">
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
            
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            ) : user ? (
              <>
                <Button variant="outline" size="sm" className="hidden md:flex bg-muted/50">
                  <CreditCard className="mr-2 h-4 w-4 text-orange-500" />
                  <span>{credits !== null ? credits : '...'} {t.credits}</span>
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                      <Avatar className="h-8 w-8 border">
                        <AvatarImage src={user.user_metadata?.avatar_url} alt={user.email} />
                        <AvatarFallback>{user.email?.substring(0, 2).toUpperCase()}</AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="end" forceMount>
                    <DropdownMenuLabel className="font-normal">
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none truncate">{user.user_metadata?.full_name || 'User'}</p>
                        <p className="text-xs leading-none text-muted-foreground truncate">
                          {user.email}
                        </p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {/* <DropdownMenuItem>
                      <User className="mr-2 h-4 w-4" />
                      <span>Profile</span>
                    </DropdownMenuItem> */}
                    <DropdownMenuItem onClick={() => router.push('/dashboard/billing')}>
                      <CreditCard className="mr-2 h-4 w-4" />
                      <span>{t.billing}</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout} className="text-red-600 focus:text-red-600">
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>{t.logout}</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <Button size="sm" onClick={() => router.push('/login')}>
                {t.login}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
