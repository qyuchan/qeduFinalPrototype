"use client"

import { useState } from "react"
import Image from "next/image"
import { LayoutDashboard, BookOpen, Target, ChevronLeft, ChevronRight, Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/lib/auth-context"

const navItems = [
  { id: "dashboard",       label: "Dashboard",       icon: <LayoutDashboard className="h-5 w-5" /> },
  { id: "courses",         label: "Courses",         icon: <BookOpen className="h-5 w-5" /> },
  { id: "practice",        label: "Practice",        icon: <Target className="h-5 w-5" /> },
  { id: "recommendations", label: "Recommendations", icon: <Sparkles className="h-5 w-5" /> },
]

interface SidebarNavProps {
  activeTab: string
  onTabChange: (tab: string) => void
}

export function SidebarNav({ activeTab, onTabChange }: SidebarNavProps) {
  const [collapsed, setCollapsed] = useState(false)
  const { user } = useAuth()

  return (
    <aside className={cn(
      "flex-shrink-0 flex flex-col bg-sidebar border-r border-sidebar-border transition-all duration-300",
      collapsed ? "w-20" : "w-64"
    )}>
      {/* User Profile */}
      <div className="p-4 border-b border-sidebar-border">
        <div className="flex flex-col items-center gap-3">
          <div className={cn(
            "rounded-full border-4 border-primary shadow-lg overflow-hidden bg-card transition-all duration-300",
            collapsed ? "w-12 h-12" : "w-16 h-16"
          )}>
            <Image
              src="/images/studentPFP.png"
              alt="Student Profile"
              width={64}
              height={64}
              className="w-full h-full object-cover"
              priority
            />
          </div>
          {!collapsed && (
            <div className="text-center">
              <p className="text-sm font-bold text-sidebar-foreground truncate max-w-[160px]">
                {user?.full_name ?? 'Student'}
              </p>
              <p className="text-xs text-muted-foreground capitalize">{user?.role ?? 'student'}</p>
            </div>
          )}
        </div>
      </div>

      {/* Nav items */}
      <nav className="flex-1 p-3 space-y-1">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onTabChange(item.id)}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200",
              "hover:bg-sidebar-accent",
              activeTab === item.id
                ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-md"
                : "text-sidebar-foreground"
            )}
          >
            <span className="flex-shrink-0">{item.icon}</span>
            {!collapsed && <span className="truncate">{item.label}</span>}
          </button>
        ))}
      </nav>

      {/* Collapse toggle */}
      <div className="p-3 border-t border-sidebar-border">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setCollapsed(!collapsed)}
          className={cn(
            "w-full flex items-center justify-center gap-2 rounded-xl hover:bg-sidebar-accent text-sidebar-foreground",
            collapsed ? "px-2" : "px-4"
          )}
        >
          {collapsed
            ? <ChevronRight className="h-4 w-4" />
            : <><ChevronLeft className="h-4 w-4" /><span className="text-xs">Collapse</span></>
          }
        </Button>
      </div>
    </aside>
  )
}
