"use client"

import { useState, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { masteryApi, type MasteryRecord } from "@/lib/api/mastery"
import { topicsApi, type Topic } from "@/lib/api/topics"
import { useCourseProgress, TOPIC_SUBTOPICS, topicKeyword } from "@/lib/use-course-progress"
import { SidebarNav } from "@/components/sidebar-nav"
import { DashboardHeader } from "@/components/dashboard-header"
import { WelcomeBanner } from "@/components/welcome-banner"
import { TopicMasteryGrid } from "@/components/topic-mastery-grid"
import { RecommendationsSidebar } from "@/components/recommendations-sidebar"
import { CoursesTab } from "@/components/courses-tab"
import { PracticeTab } from "@/components/practice-tab"
import { RecommendationsTab } from "@/components/recommendations-tab"

export default function StudentDashboard() {
  const { user, loading } = useAuth()
  const router            = useRouter()
  const [activeTab,          setActiveTab]          = useState("dashboard")
  const [selectedTopicId,    setSelectedTopicId]    = useState<number | null>(null)
  const [initialSubtopicId,  setInitialSubtopicId]  = useState<string | null>(null)
  const [mastery,         setMastery]         = useState<MasteryRecord[]>([])
  const [topics,          setTopics]          = useState<Topic[]>([])
  const [topicsLoading,   setTopicsLoading]   = useState(true)
  const { completed, markComplete, markIncomplete } = useCourseProgress()

  const courseProgress = useMemo(() => {
    const map: Record<number, { done: number; total: number }> = {}
    topics.forEach(t => {
      const key  = topicKeyword(t.topic_name)
      const subs = TOPIC_SUBTOPICS[key] ?? []
      map[t.topic_id] = { done: subs.filter(id => completed.has(id)).length, total: subs.length }
    })
    return map
  }, [topics, completed])

  useEffect(() => {
    if (loading) return
    if (!user)                    { router.replace('/login');    return }
    if (user.role === 'lecturer') { router.replace('/lecturer'); return }

    masteryApi.getAll().then(setMastery).catch(() => {})
    topicsApi.getAll()
      .then(setTopics)
      .catch(() => setTopics([]))
      .finally(() => setTopicsLoading(false))
  }, [user, loading, router])

  if (loading || !user) return null

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      <DashboardHeader />
      <div className="flex flex-1 min-h-0">
        <SidebarNav activeTab={activeTab} onTabChange={setActiveTab} />
        <main className="flex-1 overflow-y-auto p-6">

          {activeTab === "dashboard" && (
            <div className="flex flex-col xl:flex-row gap-6 max-w-7xl">
              <div className="flex-1 space-y-6">
                <WelcomeBanner
                  studentName={user.full_name.split(' ')[0]}
                />
                <TopicMasteryGrid
                  topics={topics}
                  mastery={mastery}
                  topicsLoading={topicsLoading}
                  onTopicClick={(id) => { setSelectedTopicId(id); setInitialSubtopicId(null); setActiveTab("courses") }}
                  courseProgress={courseProgress}
                />
              </div>
              <aside className="w-full xl:w-80 flex-shrink-0">
                <RecommendationsSidebar
                  onNavigateToSubtopic={(subtopicId) => {
                    const keyword = subtopicId.startsWith("1") ? "matri"
                                  : subtopicId.startsWith("2") ? "linear"
                                  : "determinant"
                    const topic = topics.find(t => t.topic_name.toLowerCase().includes(keyword))
                    setSelectedTopicId(topic?.topic_id ?? null)
                    setInitialSubtopicId(subtopicId)
                    setActiveTab("courses")
                  }}
                />
              </aside>
            </div>
          )}

          {activeTab === "courses" && (
            <CoursesTab
              topics={topics}
              loading={topicsLoading}
              selectedTopicId={selectedTopicId}
              initialSubtopicId={initialSubtopicId}
              completed={completed}
              markComplete={markComplete}
              markIncomplete={markIncomplete}
            />
          )}

          {activeTab === "practice" && (
            <PracticeTab topics={topics} mastery={mastery} loading={topicsLoading} />
          )}

          {activeTab === "recommendations" && (
            <RecommendationsTab />
          )}

        </main>
      </div>
    </div>
  )
}
