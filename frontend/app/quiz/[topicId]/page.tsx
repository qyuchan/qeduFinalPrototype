"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter, useSearchParams } from "next/navigation"
import { quizApi, type Quiz, type QuizQuestion } from "@/lib/api/quiz"
import { masteryApi } from "@/lib/api/mastery"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { DashboardHeader } from "@/components/dashboard-header"
import { ArrowLeft, ArrowRight, CheckCircle2, Paperclip, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { MathText } from "@/components/math-text"

export default function QuizPage() {
  const params       = useParams()
  const router       = useRouter()
  const searchParams = useSearchParams()
  const topicId      = Number(params.topicId)
  const setNum       = Number(searchParams.get('set') || 0) || undefined

  const [quiz,       setQuiz]       = useState<Quiz | null>(null)
  const [answers,    setAnswers]    = useState<Record<number, number>>({})
  const [current,    setCurrent]    = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [error,      setError]      = useState<string | null>(null)
  const [workFile,   setWorkFile]   = useState<File | null>(null)

  useEffect(() => {
    quizApi.fetch(topicId, setNum)
      .then(setQuiz)
      .catch(() => setError('No quiz available for this topic yet.'))
  }, [topicId, setNum])

  if (error) return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
        <p className="text-muted-foreground font-medium">{error}</p>
        <Button variant="outline" onClick={() => router.push('/')}>
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Dashboard
        </Button>
      </div>
    </div>
  )

  if (!quiz) return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />
      <div className="flex items-center justify-center h-[60vh]">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-muted-foreground font-medium">Loading quiz…</p>
        </div>
      </div>
    </div>
  )

  const question   = quiz.questions[current]
  const total      = quiz.questions.length
  const answered   = Object.keys(answers).length
  const progress   = (answered / total) * 100

  const submit = async () => {
    if (answered < total) { setError('Please answer all questions first.'); return }
    setSubmitting(true)
    try {
      const res = await quizApi.submit(quiz.quiz_id, answers)
      masteryApi.invalidate()
      if (workFile) {
        try { await quizApi.uploadWork(res.attempt_id, workFile) } catch { /* non-blocking */ }
      }
      router.push(`/quiz/result/${res.attempt_id}`)
    } catch (e: any) {
      setError(e?.data?.message || 'Submission failed. Try again.')
      setSubmitting(false)
    }
  }

  const difficultyColor: Record<string, string> = {
    easy:   'bg-mastered/10 text-mastered border-mastered/30',
    medium: 'bg-practicing/10 text-practicing border-practicing/30',
    hard:   'bg-destructive/10 text-destructive border-destructive/30',
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />
      <main className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        {/* Progress header */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="sm" onClick={() => router.push('/')} className="gap-1 text-muted-foreground">
              <ArrowLeft className="w-4 h-4" /> Dashboard
            </Button>
            <span className="text-sm text-muted-foreground font-medium">
              {answered}/{total} answered
            </span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Question card */}
        <Card className="border-2 border-primary/20">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-primary border-primary/30 bg-primary/5">
                Q{current + 1} of {total}
              </Badge>
              <Badge variant="outline" className={cn('capitalize', difficultyColor[question.difficulty_level] ?? '')}>
                {question.difficulty_level}
              </Badge>
              {question.topic_tag && (
                <Badge variant="outline" className="text-xs text-muted-foreground">
                  {question.topic_tag}
                </Badge>
              )}
            </div>
            {question.image_path && (
              <div className="mt-2 mb-1 flex justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`/storage/${question.image_path}`}
                  alt="Question figure"
                  className="max-h-56 rounded-lg border object-contain"
                />
              </div>
            )}
            <p className="text-base font-semibold text-foreground leading-relaxed mt-2">
              <MathText text={question.question_text} />
            </p>
          </CardHeader>
          <CardContent className="space-y-3">
            {question.options.map(opt => {
              const selected = answers[question.question_id] === opt.option_id
              return (
                <button
                  key={opt.option_id}
                  onClick={() => setAnswers(a => ({ ...a, [question.question_id]: opt.option_id }))}
                  className={cn(
                    "w-full text-left px-4 py-3 rounded-xl border-2 text-sm font-medium transition-all duration-150",
                    selected
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border hover:border-primary/40 text-foreground"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <span className={cn(
                      "w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0",
                      selected ? "border-primary bg-primary" : "border-muted-foreground"
                    )}>
                      {selected && <CheckCircle2 className="w-3 h-3 text-primary-foreground" />}
                    </span>
                    <MathText text={opt.option_text} />
                  </div>
                </button>
              )
            })}
          </CardContent>
        </Card>

        {error && (
          <p className="text-center text-destructive text-sm font-medium">{error}</p>
        )}

        {/* Optional work upload - visible on last question */}
        {current === total - 1 && (
          <div className="rounded-xl border-2 border-dashed border-border p-4 space-y-2">
            <p className="text-sm font-medium text-foreground">Attach your working <span className="font-normal text-muted-foreground">(optional)</span></p>
            <p className="text-xs text-muted-foreground">Upload an image or PDF showing how you solved the questions. Your lecturer will be able to view it.</p>
            <div className="flex items-center gap-3 pt-1">
              <label className="cursor-pointer">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border bg-card text-sm font-medium hover:bg-muted/50 transition-colors">
                  <Paperclip className="w-4 h-4 text-muted-foreground" />
                  {workFile ? workFile.name : 'Choose file…'}
                </div>
                <input
                  type="file"
                  accept="image/*,.pdf"
                  className="sr-only"
                  onChange={e => setWorkFile(e.target.files?.[0] ?? null)}
                />
              </label>
              {workFile && (
                <button
                  onClick={() => setWorkFile(null)}
                  className="text-xs text-muted-foreground hover:text-destructive transition-colors flex items-center gap-1"
                >
                  <X className="w-3 h-3" /> Remove
                </button>
              )}
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex justify-between items-center">
          <Button
            variant="outline"
            disabled={current === 0}
            onClick={() => setCurrent(c => c - 1)}
          >
            <ArrowLeft className="w-4 h-4 mr-2" /> Previous
          </Button>

          {current < total - 1 ? (
            <Button onClick={() => setCurrent(c => c + 1)}>
              Next <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button
              onClick={submit}
              disabled={submitting || answered < total}
              className="bg-mastered hover:bg-mastered/90 text-white"
            >
              {submitting ? 'Submitting…' : 'Submit Quiz'}
              {!submitting && <CheckCircle2 className="w-4 h-4 ml-2" />}
            </Button>
          )}
        </div>

        {/* Question dots navigator */}
        <div className="flex justify-center gap-1.5 flex-wrap">
          {quiz.questions.map((q, i) => (
            <button
              key={q.question_id}
              onClick={() => setCurrent(i)}
              className={cn(
                "w-7 h-7 rounded-full text-xs font-bold border transition-all",
                i === current        ? "bg-primary text-primary-foreground border-primary" :
                answers[q.question_id] ? "bg-mastered/20 text-mastered border-mastered/40" :
                "bg-card text-muted-foreground border-border hover:border-primary/40"
              )}
            >
              {i + 1}
            </button>
          ))}
        </div>
      </main>
    </div>
  )
}
