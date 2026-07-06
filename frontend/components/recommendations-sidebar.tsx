"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { RecommendationCard, type MaterialType } from "@/components/recommendation-card"
import { Sparkles, RefreshCw, BookOpen, ArrowRight, GraduationCap } from "lucide-react"
import { AttemptDetailDialog } from "@/components/attempt-detail-dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { recommendationsApi, type RecommendationRecord, type LecturerRemediation } from "@/lib/api/recommendations"

function toMaterialType(ct: string): MaterialType {
  if (ct === 'video')                          return 'video'
  if (ct === 'exercise' || ct === 'example')   return 'practice'
  return 'reading'
}

const SUBTOPIC_NAMES: Record<string, string> = {
  "1.1": "Introduction to Matrices",
  "1.2": "Types of Matrices",
  "1.3": "Matrix Operations",
  "1.4": "Properties & Theorems",
  "2.1": "Linear Equations",
  "2.2": "Systems of Linear Equations",
  "2.3": "Elementary Row Operations",
  "2.4": "Gaussian & Gauss-Jordan Elimination",
  "3.1": "Determinant Formulas",
  "3.2": "Cofactor Expansion",
  "3.3": "Elementary Operations Method",
  "3.4": "Applications of Determinants",
}

const CHAPTER_LABEL: Record<string, string> = {
  "1": "Chapter 1: Matrices",
  "2": "Chapter 2: Systems",
  "3": "Chapter 3: Determinants",
}

interface RecommendationsSidebarProps {
  onNavigateToSubtopic?: (subtopicId: string) => void
}

function CourseNavCard({ rec, onNavigate, onDismiss }: {
  rec: RecommendationRecord
  onNavigate: () => void
  onDismiss: () => void
}) {
  const subtopicId   = rec.subtopic_id ?? ""
  const subtopicName = SUBTOPIC_NAMES[subtopicId] ?? subtopicId
  const chapterNum   = subtopicId.charAt(0)
  const chapterLabel = CHAPTER_LABEL[chapterNum] ?? "Linear Algebra"

  return (
    <Card className="group p-4 transition-all duration-200 hover:shadow-md border-learning/30 hover:border-learning/60 bg-learning/5">
      <div className="flex items-start gap-3">
        <div className="flex items-center justify-center w-10 h-10 rounded-lg flex-shrink-0 bg-learning/15">
          <BookOpen className="w-5 h-5 text-learning" />
        </div>
        <div className="flex-1 min-w-0">
          <Badge variant="outline" className="text-xs font-normal mb-1 text-learning border-learning/30">
            {chapterLabel}
          </Badge>
          <p className="font-medium text-sm text-foreground line-clamp-2 mb-1 group-hover:text-learning transition-colors">
            Review: {subtopicName}
          </p>
          <p className="text-xs text-muted-foreground">{rec.reason ?? "You answered questions incorrectly on this subtopic."}</p>
        </div>
      </div>
      <div className="flex items-center gap-2 mt-3">
        <Button size="sm" className="flex-1 gap-1.5 bg-learning hover:bg-learning/90" onClick={onNavigate}>
          <ArrowRight className="w-3 h-3" /> Go to Subtopic
        </Button>
        <Button size="sm" variant="ghost" className="flex-shrink-0 text-muted-foreground" onClick={onDismiss}>
          ✕
        </Button>
      </div>
    </Card>
  )
}

function SidebarRemediationCard({ rem, onDismiss }: { rem: LecturerRemediation; onDismiss: () => void }) {
  const [dialogOpen, setDialogOpen] = useState(false)

  return (
    <>
      <div
        className="rounded-xl border border-amber-300/40 bg-amber-500/5 p-3 space-y-2 cursor-pointer hover:shadow-md transition-shadow"
        onClick={() => setDialogOpen(true)}
      >
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 min-w-0">
            <GraduationCap className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
            <span className="text-xs font-semibold text-amber-700 truncate">{rem.lecturer.full_name}</span>
          </div>
          <Button
            variant="ghost" size="sm"
            className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground flex-shrink-0"
            onClick={e => { e.stopPropagation(); onDismiss() }}
          >
            ✕
          </Button>
        </div>
        {rem.question && (
          <p className="text-xs text-muted-foreground italic line-clamp-2">
            Re: {rem.question.question_text}
          </p>
        )}
        {rem.material ? (
          <div className="flex items-center gap-1.5 min-w-0">
            <BookOpen className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
            <span className="text-sm font-medium truncate">{rem.material.title}</span>
            <Badge variant="outline" className="text-xs flex-shrink-0">{rem.material.content_type}</Badge>
          </div>
        ) : rem.custom_explanation ? (
          <p className="text-sm text-foreground line-clamp-2 leading-snug">{rem.custom_explanation}</p>
        ) : (
          <p className="text-sm text-muted-foreground italic">The material attached to this review was removed.</p>
        )}
        <p className="text-xs text-primary">Tap to view full attempt →</p>
      </div>

      <AttemptDetailDialog
        attemptId={rem.attempt_id}
        questionId={rem.question_id}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
    </>
  )
}

export function RecommendationsSidebar({ onNavigateToSubtopic }: RecommendationsSidebarProps) {
  const [recs,        setRecs]        = useState<RecommendationRecord[]>([])
  const [remediations, setRemediations] = useState<LecturerRemediation[]>([])
  const [loading,     setLoading]     = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [data, rems] = await Promise.all([
        recommendationsApi.getAll(),
        recommendationsApi.lecturerRemediations(),
      ])
      setRecs(data)
      setRemediations(rems)
    } catch {}
    finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  const handleAccept = async (id: number) => {
    await recommendationsApi.accept(id)
    setRecs(prev => prev.filter(r => r.recommendation_id !== id))
  }

  const handleDismiss = async (id: number) => {
    await recommendationsApi.dismiss(id)
    setRecs(prev => prev.filter(r => r.recommendation_id !== id))
  }

  const algoLabel: Record<string, string> = {
    cold_start:    'For You',
    content_based: 'Related',
    collaborative: 'Students Like You',
    hybrid:        'Recommended',
  }

  const navRecs      = recs.filter(r => r.recommendation_type === 'course_navigation')
  const materialRecs = recs.filter(r => r.recommendation_type !== 'course_navigation')

  return (
    <Card className="h-fit sticky top-4">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            <CardTitle className="text-lg">For You</CardTitle>
          </div>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={load}>
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
        <p className="text-sm text-muted-foreground">
          Personalised recommendations based on your quiz performance
        </p>
      </CardHeader>

      <CardContent className="space-y-3">
        {loading ? (
          [...Array(3)].map((_, i) => (
            <div key={i} className="h-24 bg-muted rounded-xl animate-pulse" />
          ))
        ) : recs.length === 0 && remediations.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-sm text-muted-foreground mb-1">No recommendations yet</p>
            <p className="text-xs text-muted-foreground">Take a quiz to get personalised suggestions</p>
          </div>
        ) : (
          <>
            {/* Course navigation recommendations */}
            {navRecs.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Subtopics to Review</p>
                {navRecs.map(rec => (
                  <CourseNavCard
                    key={rec.recommendation_id}
                    rec={rec}
                    onNavigate={() => {
                      handleAccept(rec.recommendation_id)
                      if (rec.subtopic_id) onNavigateToSubtopic?.(rec.subtopic_id)
                    }}
                    onDismiss={() => handleDismiss(rec.recommendation_id)}
                  />
                ))}
              </div>
            )}

            {/* Study material recommendations */}
            {materialRecs.length > 0 && (
              <div className="space-y-2">
                {navRecs.length > 0 && (
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Study Materials</p>
                )}
                {materialRecs.map(rec => (
                  <RecommendationCard
                    key={rec.recommendation_id}
                    title={rec.material?.title ?? 'Study Material'}
                    materialType={toMaterialType(rec.material?.content_type ?? 'pdf')}
                    matchPercentage={rec.confidence_score ? Math.round(rec.confidence_score * 100) : 0}
                    topic={algoLabel[rec.algorithm_used] ?? 'Recommended'}
                    duration={rec.material?.duration_minutes ? `${rec.material.duration_minutes} min` : undefined}
                    onAccept={() => handleAccept(rec.recommendation_id)}
                    onDismiss={() => handleDismiss(rec.recommendation_id)}
                  />
                ))}
              </div>
            )}

            {/* Lecturer remediations */}
            {remediations.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">General Review</p>
                {remediations.map(rem => (
                  <SidebarRemediationCard
                    key={rem.remediation_id}
                    rem={rem}
                    onDismiss={async () => {
                      await recommendationsApi.dismissRemediation(rem.remediation_id)
                      setRemediations(prev => prev.filter(r => r.remediation_id !== rem.remediation_id))
                    }}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}
