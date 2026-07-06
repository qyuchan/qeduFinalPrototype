"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { quizApi, type QuizResult } from "@/lib/api/quiz"
import { recommendationsApi } from "@/lib/api/recommendations"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { RecommendationCard, type MaterialType } from "@/components/recommendation-card"
import { DashboardHeader } from "@/components/dashboard-header"
import { CheckCircle2, XCircle, ArrowLeft, Sparkles, Trophy, RotateCcw } from "lucide-react"
import { cn } from "@/lib/utils"
import { MathText } from "@/components/math-text"

function toMaterialType(ct: string): MaterialType {
  if (ct === 'video')                        return 'video'
  if (ct === 'exercise' || ct === 'example') return 'practice'
  return 'reading'
}

export default function QuizResultPage() {
  const params    = useParams()
  const router    = useRouter()
  const attemptId = Number(params.attemptId)
  const [result, setResult] = useState<QuizResult | null>(null)
  const [recs,   setRecs]   = useState<QuizResult['recommendations']>([])

  useEffect(() => {
    quizApi.getResult(attemptId).then(r => {
      setResult(r)
      setRecs(r.recommendations?.filter(rec => rec.material !== null) ?? [])
    }).catch(() => {})
  }, [attemptId])

  if (!result) return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />
      <div className="flex items-center justify-center h-[60vh]">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-muted-foreground font-medium">Loading results…</p>
        </div>
      </div>
    </div>
  )

  const passed  = result.pass_status === 'pass'
  const pct     = result.percentage ?? 0
  const correct = result.student_answers?.filter(a => a.is_correct).length ?? 0
  const total   = result.student_answers?.length ?? 0

  const handleAccept = async (id: number, url: string | null) => {
    await recommendationsApi.accept(id).catch(() => {})
    if (url) window.open(url, '_blank', 'noopener,noreferrer')
    setRecs(prev => prev.filter(r => r.recommendation_id !== id))
  }

  const handleDismiss = async (id: number) => {
    await recommendationsApi.dismiss(id).catch(() => {})
    setRecs(prev => prev.filter(r => r.recommendation_id !== id))
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />
      <main className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        <Button variant="ghost" size="sm" onClick={() => router.push('/')} className="gap-1 text-muted-foreground">
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </Button>

        {/* Score card */}
        <div className={cn(
          "relative rounded-2xl px-6 py-12 text-center text-white overflow-hidden shadow-lg",
          passed
            ? "bg-gradient-to-br from-emerald-500 via-emerald-600 to-green-700"
            : "bg-gradient-to-br from-red-500 via-rose-600 to-red-800"
        )}>
          <div className="absolute -top-8 -right-8 w-40 h-40 rounded-full bg-white/10" />
          <div className="absolute -bottom-10 -left-10 w-48 h-48 rounded-full bg-white/10" />
          <div className="relative z-10">
            {passed
              ? <Trophy className="w-10 h-10 mx-auto mb-3 opacity-90" />
              : <RotateCcw className="w-10 h-10 mx-auto mb-3 opacity-80" />
            }
            <div className="text-6xl font-extrabold mb-1 tracking-tight">{Math.round(pct)}%</div>
            <div className="text-xl font-semibold opacity-90 mb-2">
              {passed ? 'Well Done!' : 'Keep Practising'}
            </div>
            <div className="text-sm opacity-70 font-medium">
              {correct} of {total} correct · {result.score} marks
            </div>
          </div>
        </div>

        {/* Recommendations on fail */}
        {!passed && recs.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" />
                <CardTitle className="text-base">Suggested Study Materials</CardTitle>
              </div>
              <p className="text-sm text-muted-foreground">
                Based on your answers, here&apos;s what to review
              </p>
            </CardHeader>
            <CardContent className="space-y-3">
              {recs.map(rec => (
                <RecommendationCard
                  key={rec.recommendation_id}
                  title={rec.material!.title}
                  materialType={toMaterialType(rec.material!.content_type)}
                  matchPercentage={rec.confidence_score ? Math.round(rec.confidence_score * 100) : 0}
                  topic={rec.algorithm_used === 'cold_start' ? 'For You' : 'Recommended'}
                  duration={rec.material!.duration_minutes ? `${rec.material!.duration_minutes} min` : undefined}
                  onAccept={() => handleAccept(rec.recommendation_id, rec.material!.external_url)}
                  onDismiss={() => handleDismiss(rec.recommendation_id)}
                />
              ))}
            </CardContent>
          </Card>
        )}

        {/* Answer breakdown */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Answer Review</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {result.student_answers?.map((ans, i) => (
              <div key={ans.answer_id} className="flex items-start gap-3 p-3 rounded-xl bg-muted/40">
                {ans.is_correct
                  ? <CheckCircle2 className="w-5 h-5 text-mastered flex-shrink-0 mt-0.5" />
                  : <XCircle     className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
                }
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="outline" className="text-xs">Q{i + 1}</Badge>
                    {ans.question?.topic_tag && (
                      <span className="text-xs text-muted-foreground">{ans.question.topic_tag}</span>
                    )}
                  </div>
                  <p className="text-sm font-medium text-foreground line-clamp-2">
                    {ans.question?.question_text && <MathText text={ans.question.question_text} />}
                  </p>
                  {!ans.is_correct && ans.question?.explanation && (
                    <p className="text-xs text-muted-foreground mt-1 italic">
                      <MathText text={ans.question.explanation} />
                    </p>
                  )}
                </div>
                <span className={cn(
                  "text-xs font-bold flex-shrink-0",
                  ans.is_correct ? "text-mastered" : "text-destructive"
                )}>
                  {ans.marks_awarded} pts
                </span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Button className="w-full" onClick={() => router.push('/')}>
          Return to Dashboard
        </Button>
      </main>
    </div>
  )
}
