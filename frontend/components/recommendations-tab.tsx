"use client"

import { useState, useEffect, useCallback } from "react"
import { recommendationsApi, type RecommendationRecord, type LecturerRemediation, type LecturerReview } from "@/lib/api/recommendations"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import {
  Sparkles, RefreshCw, BookOpen, ArrowRight, GraduationCap,
  ExternalLink, Paperclip, Brain, MessageSquare,
} from "lucide-react"
import { AttemptDetailDialog } from "@/components/attempt-detail-dialog"

// ── Helpers ───────────────────────────────────────────────────────────────────

const SUBTOPIC_NAMES: Record<string, string> = {
  "1.1": "Introduction to Matrices",   "1.2": "Types of Matrices",
  "1.3": "Matrix Operations",          "1.4": "Properties & Theorems",
  "2.1": "Linear Equations",           "2.2": "Systems of Linear Equations",
  "2.3": "Elementary Row Operations",  "2.4": "Gaussian & Gauss-Jordan Elimination",
  "3.1": "Determinant Formulas",       "3.2": "Cofactor Expansion",
  "3.3": "Elementary Operations Method","3.4": "Applications of Determinants",
}

function SectionHeader({ icon, title, subtitle }: { icon: React.ReactNode; title: string; subtitle: string }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-primary/10 text-primary flex-shrink-0">
        {icon}
      </div>
      <div>
        <h2 className="text-base font-semibold text-foreground">{title}</h2>
        <p className="text-xs text-muted-foreground">{subtitle}</p>
      </div>
    </div>
  )
}

// ── Lecturer reviews section ──────────────────────────────────────────────────

function ReviewCard({ review, onComplete }: { review: LecturerReview; onComplete: () => void }) {
  const [completing, setCompleting] = useState(false)
  const quiz    = review.attempt?.quiz
  const attempt = review.attempt
  const date    = review.updated_at
    ? new Date(review.updated_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
    : ''

  const handleComplete = async () => {
    setCompleting(true)
    try {
      await recommendationsApi.completeReview(review.review_id)
      onComplete()
    } finally {
      setCompleting(false)
    }
  }

  return (
    <Card className="border-amber-300/40 bg-amber-500/5">
      <CardContent className="pt-4 pb-4 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-1.5 min-w-0">
            <GraduationCap className="w-4 h-4 text-amber-600 flex-shrink-0" />
            <span className="text-sm font-semibold text-amber-700">{review.lecturer?.full_name ?? 'Lecturer'}</span>
          </div>
          <span className="text-xs text-muted-foreground flex-shrink-0">{date}</span>
        </div>

        {quiz && (
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-muted-foreground">{quiz.title}</span>
            {quiz.topic && (
              <Badge variant="outline" className="text-xs">{quiz.topic.topic_name}</Badge>
            )}
            {attempt && (
              <Badge
                variant="outline"
                className={cn(
                  'text-xs capitalize',
                  attempt.pass_status === 'pass'
                    ? 'text-emerald-600 border-emerald-300 bg-emerald-500/10'
                    : 'text-destructive border-destructive/30 bg-destructive/10'
                )}
              >
                {Math.round(attempt.percentage)}% · {attempt.pass_status}
              </Badge>
            )}
          </div>
        )}

        {review.comment && (
          <p className="text-sm text-foreground leading-relaxed">{review.comment}</p>
        )}

        {review.file_url && (
          <a
            href={review.file_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
          >
            <Paperclip className="w-3.5 h-3.5" />
            {review.original_name ?? 'Attached file'}
          </a>
        )}

        <div className="pt-1">
          <Button
            size="sm"
            variant="outline"
            className="gap-1.5 text-emerald-600 border-emerald-300 hover:bg-emerald-500/10"
            onClick={handleComplete}
            disabled={completing}
          >
            ✓ Mark as Completed
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

// ── Algorithm recommendation card ────────────────────────────────────────────

function AlgoRecCard({ rec, onAccept, onDismiss, onView }: {
  rec: RecommendationRecord
  onAccept: () => void
  onDismiss: () => void
  onView?: () => void
}) {
  if (rec.recommendation_type === 'course_navigation') {
    const subtopicId   = rec.subtopic_id ?? ''
    const subtopicName = SUBTOPIC_NAMES[subtopicId] ?? subtopicId
    return (
      <Card className="border-learning/30 bg-learning/5">
        <CardContent className="pt-4 pb-4">
          <div className="flex items-start gap-3">
            <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-learning/15 flex-shrink-0">
              <BookOpen className="w-4 h-4 text-learning" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground">Review: {subtopicName}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{rec.reason ?? 'You answered questions incorrectly on this subtopic.'}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 mt-3">
            <Button size="sm" className="gap-1.5 bg-learning hover:bg-learning/90 text-white" onClick={onAccept}>
              <ArrowRight className="w-3 h-3" /> Go to Subtopic
            </Button>
            <Button size="sm" variant="ghost" className="text-muted-foreground" onClick={onDismiss}>Dismiss</Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  const mat = rec.material
  const confidence = rec.confidence_score ? Math.round(rec.confidence_score * 100) : null

  return (
    <Card>
      <CardContent className="pt-4 pb-4">
        <div className="flex items-start gap-3">
          <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-primary/10 flex-shrink-0">
            <BookOpen className="w-4 h-4 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <p className="text-sm font-medium text-foreground">{mat?.title ?? 'Study Material'}</p>
              {confidence !== null && (
                <Badge variant="outline" className="text-xs">{confidence}% match</Badge>
              )}
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {mat?.content_type && (
                <Badge variant="secondary" className="text-xs capitalize">{mat.content_type}</Badge>
              )}
              {mat?.difficulty_level && (
                <span className="text-xs text-muted-foreground capitalize">{mat.difficulty_level}</span>
              )}
              {mat?.duration_minutes && (
                <span className="text-xs text-muted-foreground">{mat.duration_minutes} min</span>
              )}
            </div>
            {rec.reason && (
              <p className="text-xs text-muted-foreground mt-1">{rec.reason}</p>
            )}
          </div>
          {(mat?.external_url || mat?.file_url) && (
            <a
              href={(mat!.external_url ?? mat!.file_url)!}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-shrink-0 text-primary hover:text-primary/80 mt-1"
              onClick={() => onView?.()}
            >
              <ExternalLink className="w-4 h-4" />
            </a>
          )}
        </div>
        <div className="flex items-center gap-2 mt-3">
          <Button size="sm" variant="outline" onClick={() => { onView?.(); onAccept() }}>Mark as viewed</Button>
          <Button size="sm" variant="ghost" className="text-muted-foreground" onClick={onDismiss}>Dismiss</Button>
        </div>
      </CardContent>
    </Card>
  )
}

// ── Lecturer remediation card ─────────────────────────────────────────────────

function RemediationCard({ rem, onDismiss, onOpen }: {
  rem: LecturerRemediation
  onDismiss: () => Promise<void>
  onOpen: () => void
}) {
  const [dismissing, setDismissing] = useState(false)

  const handleDismiss = async (e: React.MouseEvent) => {
    e.stopPropagation()
    setDismissing(true)
    await onDismiss()
    setDismissing(false)
  }

  return (
    <Card
      className="border-amber-300/40 bg-amber-500/5 cursor-pointer hover:shadow-md transition-shadow"
      onClick={onOpen}
    >
      <CardContent className="pt-4 pb-4 space-y-2">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 min-w-0">
            <GraduationCap className="w-4 h-4 text-amber-600 flex-shrink-0" />
            <span className="text-sm font-semibold text-amber-700">{rem.lecturer.full_name}</span>
          </div>
          <Button
            variant="ghost" size="sm"
            className="h-6 w-6 p-0 text-muted-foreground"
            onClick={handleDismiss}
            disabled={dismissing}
          >✕</Button>
        </div>

        {rem.question && (
          <p className="text-xs text-muted-foreground italic line-clamp-2">
            Re: {rem.question.question_text}
          </p>
        )}

        {rem.material ? (
          <div className="flex items-center gap-1.5 min-w-0 flex-wrap">
            <BookOpen className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
            {(rem.material.file_url ?? rem.material.external_url) ? (
              <a
                href={(rem.material.file_url ?? rem.material.external_url)!}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-medium text-primary hover:underline truncate"
                onClick={e => e.stopPropagation()}
              >
                {rem.material.title}
              </a>
            ) : (
              <span className="text-sm font-medium truncate">{rem.material.title}</span>
            )}
            <Badge variant="outline" className="text-xs flex-shrink-0">{rem.material.content_type}</Badge>
          </div>
        ) : rem.custom_explanation ? (
          <p className="text-sm text-foreground line-clamp-2 leading-snug">{rem.custom_explanation}</p>
        ) : (
          <p className="text-sm text-muted-foreground italic">The material attached to this review was removed.</p>
        )}

        <p className="text-xs text-primary">Tap to view full quiz attempt →</p>
      </CardContent>
    </Card>
  )
}

// ── Main tab ──────────────────────────────────────────────────────────────────

interface RecommendationsTabProps {
  onNavigateToSubtopic?: (subtopicId: string) => void
}

export function RecommendationsTab({ onNavigateToSubtopic }: RecommendationsTabProps) {
  const [recs,                setRecs]                = useState<RecommendationRecord[]>([])
  const [remediations,        setRemediations]        = useState<LecturerRemediation[]>([])
  const [reviews,             setReviews]             = useState<LecturerReview[]>([])
  const [loading,             setLoading]             = useState(true)
  const [selectedRemediation, setSelectedRemediation] = useState<LecturerRemediation | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [r, rems, revs] = await Promise.all([
        recommendationsApi.getAll(),
        recommendationsApi.lecturerRemediations(),
        recommendationsApi.lecturerReviews(),
      ])
      setRecs(r)
      setRemediations(rems)
      setReviews(revs)
    } catch {}
    finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  const handleAccept  = async (id: number) => {
    await recommendationsApi.accept(id)
    setRecs(prev => prev.filter(r => r.recommendation_id !== id))
  }
  const handleDismiss = async (id: number) => {
    await recommendationsApi.dismiss(id)
    setRecs(prev => prev.filter(r => r.recommendation_id !== id))
  }
  const handleView = (materialId: number | null) => {
    if (materialId) recommendationsApi.logInteraction(materialId, 'viewed')
  }
  const handleCompleteReview = async (reviewId: number) => {
    setReviews(prev => prev.filter(r => r.review_id !== reviewId))
  }
  const handleDismissRemediation = async (remId: number) => {
    await recommendationsApi.dismissRemediation(remId)
    setRemediations(prev => prev.filter(r => r.remediation_id !== remId))
  }

  const navRecs         = recs.filter(r => r.recommendation_type === 'course_navigation')
  const cbfRecs         = recs.filter(r => r.recommendation_type !== 'course_navigation' && r.algorithm_used === 'content_based')
  const otherRecs       = recs.filter(r =>
    r.recommendation_type !== 'course_navigation' &&
    r.algorithm_used !== 'content_based'
  )
  const isEmpty = recs.length === 0 && remediations.length === 0 && reviews.length === 0

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Recommendations</h1>
          <p className="text-sm text-muted-foreground">Personalised resources and feedback based on your progress</p>
        </div>
        <Button variant="outline" size="sm" onClick={load} className="gap-2 flex-shrink-0">
          <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
          Refresh
        </Button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1,2,3,4].map(i => <Skeleton key={i} className="h-28 w-full rounded-xl" />)}
        </div>
      ) : isEmpty ? (
        <Card>
          <CardContent className="py-16 text-center space-y-2">
            <Sparkles className="w-8 h-8 text-muted-foreground mx-auto" />
            <p className="font-semibold text-foreground">No recommendations yet</p>
            <p className="text-sm text-muted-foreground">Take a quiz to get personalised suggestions from the system and your lecturer.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-8">

          {/* Personalized lecturer reviews */}
          {reviews.length > 0 && (
            <section>
              <SectionHeader
                icon={<MessageSquare className="w-5 h-5" />}
                title="Feedback from Your Lecturer"
                subtitle="Personalized comments and resources left by your lecturer on your quiz attempts"
              />
              <div className="space-y-3">
                {reviews.map(rev => (
                  <ReviewCard
                    key={rev.review_id}
                    review={rev}
                    onComplete={() => handleCompleteReview(rev.review_id)}
                  />
                ))}
              </div>
            </section>
          )}

          {/* Lecturer question remediations */}
          {remediations.length > 0 && (
            <section>
              <SectionHeader
                icon={<GraduationCap className="w-5 h-5" />}
                title="General Review"
                subtitle="Materials and explanations linked to questions you answered incorrectly"
              />
              <div className="space-y-3">
                {remediations.map(rem => (
                  <RemediationCard
                    key={rem.remediation_id}
                    rem={rem}
                    onDismiss={() => handleDismissRemediation(rem.remediation_id)}
                    onOpen={() => setSelectedRemediation(rem)}
                  />
                ))}
              </div>
            </section>
          )}

          {/* Single dialog owned by parent */}
          <AttemptDetailDialog
            attemptId={selectedRemediation?.attempt_id ?? null}
            questionId={selectedRemediation?.question_id ?? null}
            open={selectedRemediation !== null}
            onOpenChange={open => { if (!open) setSelectedRemediation(null) }}
          />

          {/* Subtopics to review (course navigation) */}
          {navRecs.length > 0 && (
            <section>
              <SectionHeader
                icon={<BookOpen className="w-5 h-5" />}
                title="Subtopics to Review"
                subtitle="Topics where you've had difficulty. Go back and strengthen your understanding."
              />
              <div className="space-y-3">
                {navRecs.map(rec => (
                  <AlgoRecCard
                    key={rec.recommendation_id}
                    rec={rec}
                    onAccept={() => {
                      handleAccept(rec.recommendation_id)
                      if (rec.subtopic_id) onNavigateToSubtopic?.(rec.subtopic_id)
                    }}
                    onDismiss={() => handleDismiss(rec.recommendation_id)}
                    onView={() => handleView(rec.material_id)}
                  />
                ))}
              </div>
            </section>
          )}

          {/* CBF recommendations */}
          {cbfRecs.length > 0 && (
            <section>
              <SectionHeader
                icon={<Brain className="w-5 h-5" />}
                title="Recommended for You"
                subtitle="Based on the topics you've studied and your quiz performance (content-based filtering)"
              />
              <div className="space-y-3">
                {cbfRecs.map(rec => (
                  <AlgoRecCard
                    key={rec.recommendation_id}
                    rec={rec}
                    onAccept={() => handleAccept(rec.recommendation_id)}
                    onDismiss={() => handleDismiss(rec.recommendation_id)}
                    onView={() => handleView(rec.material_id)}
                  />
                ))}
              </div>
            </section>
          )}

          {/* Other / hybrid recs */}
          {otherRecs.length > 0 && (
            <section>
              <SectionHeader
                icon={<Sparkles className="w-5 h-5" />}
                title="Also Recommended"
                subtitle="Additional suggestions based on your learning profile"
              />
              <div className="space-y-3">
                {otherRecs.map(rec => (
                  <AlgoRecCard
                    key={rec.recommendation_id}
                    rec={rec}
                    onAccept={() => handleAccept(rec.recommendation_id)}
                    onDismiss={() => handleDismiss(rec.recommendation_id)}
                    onView={() => handleView(rec.material_id)}
                  />
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  )
}
