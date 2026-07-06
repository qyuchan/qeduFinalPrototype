"use client"

import { TopicMasteryCard, type MasteryLevel } from "@/components/topic-mastery-card"
import { Grid3X3, Calculator, Sigma, ArrowRightLeft, BookOpen } from "lucide-react"
import type { MasteryRecord } from "@/lib/api/mastery"
import type { Topic } from "@/lib/api/topics"

function topicIcon(name: string) {
  const n = name.toLowerCase()
  if (n.includes('matri'))       return <Grid3X3 className="w-6 h-6" />
  if (n.includes('determinant')) return <Sigma className="w-6 h-6" />
  if (n.includes('equation') || n.includes('linear system')) return <Calculator className="w-6 h-6" />
  if (n.includes('vector'))      return <ArrowRightLeft className="w-6 h-6" />
  return <BookOpen className="w-6 h-6" />
}

function toV0Level(level: MasteryRecord['mastery_level']): MasteryLevel {
  return level === 'not_started' ? 'not-started' : level as MasteryLevel
}

interface TopicMasteryGridProps {
  topics: Topic[]
  mastery: MasteryRecord[]
  topicsLoading?: boolean
  onTopicClick?: (topicId: number) => void
  courseProgress?: Record<number, { done: number; total: number }>
}

export function TopicMasteryGrid({ topics, mastery, topicsLoading, onTopicClick, courseProgress }: TopicMasteryGridProps) {

  const masteryMap = new Map(mastery.map(m => [m.topic_id, m]))

  if (topicsLoading) {
    return (
      <div className="space-y-4">
        <div>
          <h2 className="text-xl font-bold text-foreground">Your Topics</h2>
          <p className="text-sm text-muted-foreground">Track your mastery across Linear Algebra</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-32 bg-card rounded-2xl border border-border animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  if (topics.length === 0) {
    return (
      <div className="space-y-4">
        <div>
          <h2 className="text-xl font-bold text-foreground">Your Topics</h2>
          <p className="text-sm text-muted-foreground">Track your mastery across Linear Algebra</p>
        </div>
        <div className="flex items-center justify-center h-48 bg-card rounded-2xl border border-border">
          <div className="text-center">
            <p className="text-muted-foreground font-medium">No topics available</p>
            <p className="text-xs text-muted-foreground mt-1">Make sure the backend is running</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-foreground">Your Topics</h2>
          <p className="text-sm text-muted-foreground">Track your mastery across Linear Algebra</p>
        </div>
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-mastered" />Mastered
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-practicing" />Practicing
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-learning" />Learning
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {topics.map((topic) => {
          const m  = masteryMap.get(topic.topic_id)
          const cp = courseProgress?.[topic.topic_id]
          return (
            <div
              key={topic.topic_id}
              onClick={() => onTopicClick?.(topic.topic_id)}
              className="cursor-pointer"
            >
              <TopicMasteryCard
                topic={topic.topic_name}
                description={topic.description ?? `Difficulty: ${topic.difficulty_level}`}
                masteryLevel={m ? toV0Level(m.mastery_level) : 'not-started'}
                icon={topicIcon(topic.topic_name)}
                practicesCompleted={m?.attempted_set_numbers?.length ?? 0}
                coursesCompleted={cp?.done ?? m?.courses_completed ?? 0}
                coursesTotal={cp?.total ?? 4}
              />
            </div>
          )
        })}
      </div>
    </div>
  )
}
