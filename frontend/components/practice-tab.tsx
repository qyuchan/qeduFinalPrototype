"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import type { Topic } from "@/lib/api/topics"
import type { MasteryRecord } from "@/lib/api/mastery"
import { quizApi } from "@/lib/api/quiz"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import {
  Grid3X3, Calculator, Sigma, BookOpen,
  ArrowLeft, PlayCircle, RotateCcw, CheckCircle2, Target,
} from "lucide-react"

function topicIcon(name: string) {
  const n = name.toLowerCase()
  if (n.includes("matri"))       return <Grid3X3 className="w-6 h-6" />
  if (n.includes("determinant")) return <Sigma className="w-6 h-6" />
  if (n.includes("equation") || n.includes("linear system")) return <Calculator className="w-6 h-6" />
  return <BookOpen className="w-6 h-6" />
}

function topicGradient(name: string) {
  const n = name.toLowerCase()
  if (n.includes("matri"))       return "from-blue-500 to-cyan-500"
  if (n.includes("determinant")) return "from-purple-500 to-pink-500"
  return "from-green-500 to-emerald-500"
}

function setTier(setNumber: number) {
  if (setNumber <= 4) return { label: "Warm Up",   difficulty: "Easy",   colorClass: "bg-mastered/10 text-mastered border-mastered/30" }
  if (setNumber <= 7) return { label: "Practice",  difficulty: "Medium", colorClass: "bg-practicing/10 text-practicing border-practicing/30" }
  return                     { label: "Challenge", difficulty: "Hard",   colorClass: "bg-destructive/10 text-destructive border-destructive/30" }
}

const levelConfig: Record<string, { label: string; color: string }> = {
  not_started: { label: "Not Started", color: "bg-muted text-muted-foreground border-border" },
  learning:    { label: "Learning",    color: "bg-learning/10 text-learning border-learning/30" },
  practicing:  { label: "Practicing",  color: "bg-practicing/10 text-practicing border-practicing/30" },
  mastered:    { label: "Mastered",    color: "bg-mastered/10 text-mastered border-mastered/30" },
}

interface PracticeTabProps {
  topics:   Topic[]
  mastery:  MasteryRecord[]
  loading?: boolean
}

export function PracticeTab({ topics, mastery, loading }: PracticeTabProps) {
  const router     = useRouter()
  const masteryMap = new Map(mastery.map(m => [m.topic_id, m]))
  const [selectedTopicId, setSelectedTopicId] = useState<number | null>(null)

  if (loading) {
    return (
      <div className="space-y-3 max-w-4xl">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-36 bg-card rounded-2xl border border-border animate-pulse" />
        ))}
      </div>
    )
  }

  if (topics.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 bg-card rounded-2xl border border-border">
        <div className="text-center">
          <p className="text-muted-foreground font-medium">No topics available</p>
          <p className="text-xs text-muted-foreground mt-1">Make sure the backend is running</p>
        </div>
      </div>
    )
  }

  // ── Level 2: Set selection ────────────────────────────────────────────────

  const [availableSets,     setAvailableSets]     = useState<number[]>([])
  const [setsLoading,       setSetsLoading]       = useState(false)
  const [loadedForTopicId,  setLoadedForTopicId]  = useState<number | null>(null)

  useEffect(() => {
    if (selectedTopicId === null || selectedTopicId === loadedForTopicId) return
    setSetsLoading(true)
    quizApi.availableSets(selectedTopicId)
      .then(sets => { setAvailableSets(sets); setLoadedForTopicId(selectedTopicId) })
      .catch(() => setAvailableSets([]))
      .finally(() => setSetsLoading(false))
  }, [selectedTopicId, loadedForTopicId])

  if (selectedTopicId !== null) {
    const topic = topics.find(t => t.topic_id === selectedTopicId)
    if (!topic) { setSelectedTopicId(null); return null }

    const m            = masteryMap.get(topic.topic_id)
    const attemptedSets = new Set(m?.attempted_set_numbers ?? [])
    const bestScore     = m ? Math.round(m.best_score) : 0
    const totalSets     = availableSets.length
    const doneCount     = availableSets.filter(s => attemptedSets.has(s)).length
    const pct           = totalSets > 0 ? (doneCount / totalSets) * 100 : 0

    return (
      <div className="space-y-6 max-w-4xl">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full"
            onClick={() => setSelectedTopicId(null)}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-xl font-bold text-foreground">{topic.topic_name}</h1>
            <p className="text-sm text-muted-foreground">Choose a practice set</p>
          </div>
        </div>

        {setsLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-20 w-full rounded-xl" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[1,2,3,4].map(i => <Skeleton key={i} className="h-28 w-full rounded-xl" />)}
            </div>
          </div>
        ) : totalSets === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
            <Target className="w-10 h-10 text-muted-foreground/30" />
            <p className="text-muted-foreground font-medium">No practice sets available yet</p>
            <p className="text-xs text-muted-foreground">Your lecturer hasn't added quizzes for this topic.</p>
          </div>
        ) : (
          <>
            {/* Progress card */}
            <Card className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-foreground">Sets Completed</span>
                <span className="text-sm text-muted-foreground">
                  {doneCount} completed · {totalSets - doneCount} remaining
                  {bestScore > 0 && <> · Best: <span className="text-mastered font-medium">{bestScore}%</span></>}
                </span>
              </div>
              <Progress value={pct} className="h-2" />
              <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                <span>{totalSets} total sets</span>
                <span>{Math.round(pct)}% complete</span>
              </div>
            </Card>

            {/* Set grid - only shows sets that actually have quizzes */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {availableSets.map(setNum => {
                const tier      = setTier(setNum)
                const completed = attemptedSets.has(setNum)

                return (
                  <Card
                    key={setNum}
                    className={cn(
                      "p-4 border-2 transition-all duration-200",
                      completed
                        ? "border-mastered/40 hover:border-mastered/60"
                        : "hover:border-primary/50 hover:shadow-md cursor-pointer"
                    )}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold",
                          completed ? "bg-mastered/10 text-mastered" : "bg-primary/10 text-primary"
                        )}>
                          {completed ? <CheckCircle2 className="w-5 h-5" /> : setNum}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-foreground">Set {setNum}</p>
                          <p className="text-xs text-muted-foreground">{tier.label}</p>
                        </div>
                      </div>
                      <Badge variant="outline" className={cn("text-xs", tier.colorClass)}>
                        {tier.difficulty}
                      </Badge>
                    </div>

                    <Button
                      size="sm"
                      variant={completed ? "outline" : "default"}
                      className={cn("w-full gap-2", completed && "border-mastered text-mastered hover:bg-mastered/10")}
                      onClick={() => router.push(`/quiz/${topic.topic_id}?set=${setNum}`)}
                    >
                      {completed
                        ? <><RotateCcw className="w-3 h-3" /> Retake</>
                        : <><PlayCircle className="w-3 h-3" /> Start</>
                      }
                    </Button>
                  </Card>
                )
              })}
            </div>
          </>
        )}
      </div>
    )
  }

  // ── Level 1: Topic grid ───────────────────────────────────────────────────

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h2 className="text-xl font-bold text-foreground">Practice</h2>
        <p className="text-sm text-muted-foreground">Choose a topic to start practising</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {topics.map(topic => {
          const m             = masteryMap.get(topic.topic_id)
          const attemptedSets = new Set(m?.attempted_set_numbers ?? [])
          const bestScore     = m ? Math.round(m.best_score) : 0
          const doneCount     = attemptedSets.size
          const totalForTopic = m?.total_sets ?? doneCount
          const pct           = totalForTopic > 0 ? (doneCount / totalForTopic) * 100 : 0
          const level     = m?.mastery_level ?? "not_started"
          const cfg       = levelConfig[level] ?? levelConfig["not_started"]
          const gradient  = topicGradient(topic.topic_name)

          return (
            <Card
              key={topic.topic_id}
              className="group relative overflow-hidden cursor-pointer border-2 hover:border-primary/50 hover:shadow-lg transition-all duration-200"
              onClick={() => setSelectedTopicId(topic.topic_id)}
            >
              {/* Gradient accent */}
              <div className={cn(
                "absolute top-0 left-0 right-0 h-1 bg-gradient-to-r",
                gradient
              )} />

              <div className="p-5 pt-6">
                {/* Icon + badge row */}
                <div className="flex items-start justify-between mb-4">
                  <div className={cn(
                    "w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-br text-white transition-transform group-hover:scale-110",
                    gradient
                  )}>
                    {topicIcon(topic.topic_name)}
                  </div>
                  <Badge variant="outline" className={cn("text-xs capitalize", cfg.color)}>
                    {cfg.label}
                  </Badge>
                </div>

                {/* Title + meta */}
                <h3 className="text-base font-bold text-foreground group-hover:text-primary transition-colors mb-1">
                  {topic.topic_name}
                </h3>
                <p className="text-xs text-muted-foreground mb-4">
                  {doneCount}{totalForTopic > doneCount ? ` of ${totalForTopic}` : ''} sets completed
                  {bestScore > 0 && <> · Best: {bestScore}%</>}
                </p>

                {/* Progress bar */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Target className="w-3 h-3" /> Practice Sets
                    </span>
                    <span>{Math.round(pct)}%</span>
                  </div>
                  <Progress value={pct} className="h-1.5" />
                </div>
              </div>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
