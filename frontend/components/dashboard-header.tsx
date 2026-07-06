"use client"

import Image from "next/image"
import { useRouter } from "next/navigation"
import { Bell, LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/theme-toggle"
import { useAuth } from "@/lib/auth-context"

export function DashboardHeader() {
  const { user, logout } = useAuth()
  const router = useRouter()

  const handleLogout = async () => {
    await logout()
    router.replace('/login')
  }

  return (
    <header className="sticky top-0 z-50 w-full h-16 bg-card border-b border-border shadow-sm">
      <div className="h-full px-6 flex items-center justify-between">
        <div className="flex items-center">
          <Image
            src="/earlyDesign/Gemini_Generated_Image_fvbx3efvbx3efvbx-removebg-preview.png"
            alt="QEDU Logo"
            width={40}
            height={40}
            style={{ width: 'auto', height: '40px' }}
            className="object-contain"
            priority
          />
        </div>

        <div className="flex items-center gap-1">
          <ThemeToggle />
          <Button variant="ghost" size="icon" className="rounded-full hover:bg-secondary">
            <Bell className="h-5 w-5 text-foreground" />
          </Button>
          {user && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="gap-2 rounded-full hover:bg-secondary text-muted-foreground hover:text-foreground"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline text-xs">Logout</span>
            </Button>
          )}
        </div>
      </div>
    </header>
  )
}
