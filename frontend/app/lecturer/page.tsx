"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { DashboardHeader } from "@/components/dashboard-header"
import { Button } from "@/components/ui/button"
import { BarChart2, BookOpen, ClipboardList, School, AlertTriangle, ChevronLeft, ChevronRight, ChevronDown, GraduationCap } from "lucide-react"
import { cn } from "@/lib/utils"
import Image from "next/image"
import { ClassesPanel }           from "./_classes"
import { MasteryOverviewPanel }   from "./_overview"
import { MaterialsPanel }         from "./_materials"
import { QuizzesPanel }           from "./_quizzes"
import { FlaggedQuestionsPanel }  from "./_flagged"
import { TopicsPanel }            from "./_topics"

const navItems = [
  {
    id: 'overview',
    label: 'Class Overview',
    icon: <BarChart2 className="h-5 w-5" />,
    children: [
      { id: 'classes', label: 'Add Class', icon: <School className="h-4 w-4" /> },
    ],
  },
  {
    id: 'topics',
    label: 'Topics',
    icon: <GraduationCap className="h-5 w-5" />,
    children: [
      { id: 'materials', label: 'Materials', icon: <BookOpen className="h-4 w-4" /> },
    ],
  },
  { id: 'quizzes',   label: 'Quizzes',           icon: <ClipboardList  className="h-5 w-5" /> },
  { id: 'flagged',   label: 'Flagged Questions', icon: <AlertTriangle  className="h-5 w-5" /> },
]

export default function LecturerPage() {
  const { user, loading } = useAuth()
  const router            = useRouter()
  const [tab,          setTab]          = useState('overview')
  const [collapsed,    setCollapsed]    = useState(false)
  const [openParents,  setOpenParents]  = useState<Set<string>>(new Set(['overview', 'topics']))

  useEffect(() => {
    if (loading) return
    if (!user)                    { router.replace('/login'); return }
    if (user.role !== 'lecturer') { router.replace('/');      return }
  }, [user, loading, router])

  if (loading || !user || user.role !== 'lecturer') return null

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      <DashboardHeader />
      <div className="flex flex-1 min-h-0">

        {/* Sidebar */}
        <aside className={cn(
          "flex-shrink-0 flex flex-col bg-sidebar border-r border-sidebar-border transition-all duration-300",
          collapsed ? "w-20" : "w-64"
        )}>
          <div className="p-4 border-b border-sidebar-border">
            <div className="flex flex-col items-center gap-3">
              <div className={cn(
                "rounded-full border-4 border-primary shadow-lg overflow-hidden bg-card transition-all duration-300",
                collapsed ? "w-12 h-12" : "w-16 h-16"
              )}>
                <Image
                  src="/images/lecturerPFP.png"
                  alt="Lecturer Profile"
                  width={64}
                  height={64}
                  className="w-full h-full object-cover object-top"
                  priority
                />
              </div>
              {!collapsed && (
                <div className="text-center">
                  <p className="text-sm font-bold text-sidebar-foreground truncate max-w-[160px]">{user.full_name}</p>
                  <p className="text-xs text-muted-foreground capitalize">{user.role}</p>
                </div>
              )}
            </div>
          </div>

          <nav className="flex-1 p-3 space-y-1">
            {navItems.map(item => {
              const isOpen = openParents.has(item.id)
              const toggleOpen = () => setOpenParents(prev => {
                const next = new Set(prev)
                next.has(item.id) ? next.delete(item.id) : next.add(item.id)
                return next
              })
              return (
                <div key={item.id}>
                  <button
                    onClick={() => {
                      if (item.children) { toggleOpen(); setTab(item.id) }
                      else setTab(item.id)
                    }}
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200",
                      "hover:bg-sidebar-accent",
                      tab === item.id
                        ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-md"
                        : "text-sidebar-foreground"
                    )}
                  >
                    <span className="flex-shrink-0">{item.icon}</span>
                    {!collapsed && (
                      <>
                        <span className="flex-1 truncate text-left">{item.label}</span>
                        {item.children && (
                          <ChevronDown className={cn(
                            "h-3.5 w-3.5 flex-shrink-0 transition-transform duration-200",
                            isOpen ? "rotate-0" : "-rotate-90"
                          )} />
                        )}
                      </>
                    )}
                  </button>

                  {item.children && isOpen && !collapsed && (
                    <div className="ml-4 mt-1 space-y-0.5 border-l border-sidebar-border pl-3">
                      {item.children.map(child => (
                        <button
                          key={child.id}
                          onClick={() => setTab(child.id)}
                          className={cn(
                            "w-full flex items-center gap-2 px-2 py-2 rounded-lg text-xs font-medium transition-all duration-200",
                            "hover:bg-sidebar-accent",
                            tab === child.id
                              ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm"
                              : "text-sidebar-foreground"
                          )}
                        >
                          <span className="flex-shrink-0">{child.icon}</span>
                          <span className="truncate">{child.label}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </nav>

          <div className="p-3 border-t border-sidebar-border">
            <Button
              variant="ghost" size="sm"
              onClick={() => setCollapsed(!collapsed)}
              className="w-full flex items-center justify-center gap-2 rounded-xl hover:bg-sidebar-accent text-sidebar-foreground"
            >
              {collapsed
                ? <ChevronRight className="h-4 w-4" />
                : <><ChevronLeft className="h-4 w-4" /><span className="text-xs">Collapse</span></>
              }
            </Button>
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto p-6">
          {tab === 'classes'   && <ClassesPanel />}
          {tab === 'overview'  && <MasteryOverviewPanel />}
          {tab === 'topics'    && <TopicsPanel />}
          {tab === 'materials' && <MaterialsPanel />}
          {tab === 'quizzes'   && <QuizzesPanel />}
          {tab === 'flagged'   && <FlaggedQuestionsPanel />}
        </main>

      </div>
    </div>
  )
}
