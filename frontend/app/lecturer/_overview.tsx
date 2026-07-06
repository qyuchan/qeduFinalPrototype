"use client"

import { useEffect, useState } from "react"
import { lecturerApi, type MasteryOverview, type ClassRoom, type StudentOverview, type StudentAttempt, type AttemptReview, type StudentMasteryRecord, type WrongAnswer, type Remediation } from "@/lib/api/lecturer"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { MathText } from "@/components/math-text"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { Paperclip, MessageSquarePlus, X, ArrowLeft, GraduationCap, CheckCircle2, Upload, FileText } from "lucide-react"

const levelColor: Record<string, string> = {
  mastered:    'bg-emerald-500/15 text-emerald-600 border-emerald-300',
  practicing:  'bg-amber-500/15   text-amber-600  border-amber-300',
  learning:    'bg-blue-500/15    text-blue-600   border-blue-300',
  not_started: 'bg-muted          text-muted-foreground border-border',
}
const levelLabel: Record<string, string> = {
  mastered: 'Mastered', practicing: 'Practicing', learning: 'Learning', not_started: 'N/A',
}

// ── Per-question remediation feedback ────────────────────────────────────────

function QuestionFeedbackInline({ question, topicId }: { question: WrongAnswer; topicId: number }) {
  const [open,        setOpen]        = useState(false)
  const [mode,        setMode]        = useState<'explanation' | 'upload'>('explanation')
  const [explanation, setExplanation] = useState('')
  const [pdfFile,     setPdfFile]     = useState<File | null>(null)
  const [pdfTitle,    setPdfTitle]    = useState('')
  const [saving,      setSaving]      = useState(false)
  const [saved,       setSaved]       = useState<Remediation | null>(null)
  const [error,       setError]       = useState<string | null>(null)

  const reset = () => { setExplanation(''); setPdfFile(null); setPdfTitle(''); setError(null) }

  const save = async () => {
    setError(null)
    if (mode === 'explanation' && !explanation.trim()) { setError('Write an explanation.'); return }
    if (mode === 'upload' && (!pdfFile || !pdfTitle.trim())) { setError('Choose a PDF and enter a title.'); return }
    setSaving(true)
    try {
      let materialId: number | undefined
      if (mode === 'upload') {
        const mat = await lecturerApi.createMaterial(
          {
            topic_id:         topicId,
            title:            pdfTitle.trim(),
            content_type:     'pdf',
            difficulty_level: question.difficulty_level === 'hard' ? 'advanced'
                             : question.difficulty_level === 'medium' ? 'intermediate' : 'basic',
          },
          pdfFile!,
        )
        materialId = mat.material_id
      }
      const rem = await lecturerApi.addRemediation(question.question_id, {
        material_id:        mode === 'upload' ? materialId : undefined,
        custom_explanation: mode === 'explanation' ? explanation.trim() : undefined,
      })
      setSaved(rem)
      setOpen(false)
      reset()
    } catch {
      setError('Failed to save. Try again.')
    } finally {
      setSaving(false)
    }
  }

  if (saved) {
    return (
      <div className="flex items-center gap-1.5 text-xs text-emerald-600 mt-1">
        <CheckCircle2 className="w-3 h-3" /> Feedback saved
      </div>
    )
  }

  return (
    <div className="mt-1">
      {!open ? (
        <button
          onClick={() => setOpen(true)}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors"
        >
          <GraduationCap className="w-3.5 h-3.5" /> Add feedback for this question
        </button>
      ) : (
        <div className="rounded-lg border border-amber-300/40 bg-amber-500/5 p-2.5 space-y-2 mt-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-700">Feedback / remediation</span>
            <button onClick={() => { setOpen(false); reset() }} className="text-muted-foreground hover:text-foreground">
              <X className="w-3 h-3" />
            </button>
          </div>
          {/* Mode toggle */}
          <div className="flex gap-1.5">
            <button
              onClick={() => setMode('explanation')}
              className={cn("px-2.5 py-1 rounded-md text-xs font-medium border transition-colors",
                mode === 'explanation' ? "bg-amber-500/15 border-amber-400/40 text-amber-700" : "border-border text-muted-foreground hover:bg-muted")}
            >
              Write explanation
            </button>
            <button
              onClick={() => setMode('upload')}
              className={cn("px-2.5 py-1 rounded-md text-xs font-medium border transition-colors flex items-center gap-1",
                mode === 'upload' ? "bg-amber-500/15 border-amber-400/40 text-amber-700" : "border-border text-muted-foreground hover:bg-muted")}
            >
              <Upload className="w-3 h-3" /> Upload PDF
            </button>
          </div>

          {mode === 'explanation' ? (
            <textarea
              value={explanation}
              onChange={e => setExplanation(e.target.value)}
              placeholder="Explain the concept or point to the right approach…"
              rows={2}
              className="w-full text-xs rounded-md border border-border bg-background px-2.5 py-1.5 resize-none focus:outline-none focus:ring-1 focus:ring-primary"
            />
          ) : (
            <div className="space-y-1.5">
              <input
                type="text"
                value={pdfTitle}
                onChange={e => setPdfTitle(e.target.value)}
                placeholder="PDF title / description…"
                className="w-full text-xs rounded-md border border-border bg-background px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary"
              />
              <label className="flex items-center gap-2 cursor-pointer rounded-md border border-dashed border-border bg-background px-3 py-2 hover:bg-muted/50 transition-colors">
                {pdfFile
                  ? <><FileText className="w-3.5 h-3.5 text-red-500 shrink-0" /><span className="text-xs truncate">{pdfFile.name}</span></>
                  : <><Upload className="w-3.5 h-3.5 text-muted-foreground" /><span className="text-xs text-muted-foreground">Choose PDF file…</span></>
                }
                <input type="file" accept=".pdf" className="sr-only" onChange={e => setPdfFile(e.target.files?.[0] ?? null)} />
              </label>
            </div>
          )}

          {error && <p className="text-xs text-destructive">{error}</p>}
          <Button size="sm" className="h-6 text-xs px-2.5" onClick={save} disabled={saving}>
            {saving ? 'Saving…' : 'Save'}
          </Button>
        </div>
      )}
    </div>
  )
}

// ── Inline review form per attempt ───────────────────────────────────────────

function AttemptReviewForm({ attempt, existingReview, onSaved }: {
  attempt: StudentAttempt
  existingReview: AttemptReview | undefined
  onSaved: (review: AttemptReview) => void
}) {
  const [open,    setOpen]    = useState(false)
  const [comment, setComment] = useState(existingReview?.comment ?? '')
  const [file,    setFile]    = useState<File | null>(null)
  const [saving,  setSaving]  = useState(false)
  const [error,   setError]   = useState<string | null>(null)

  const save = async () => {
    if (!comment.trim() && !file && !existingReview) return
    setSaving(true)
    setError(null)
    try {
      const saved = await lecturerApi.storeReview(attempt.attempt_id, comment.trim(), file)
      onSaved(saved)
      setFile(null)
      setOpen(false)
    } catch {
      setError('Failed to save review. Try again.')
    } finally {
      setSaving(false)
    }
  }

  const hasReview = !!existingReview

  return (
    <div className="mt-2">
      {/* Existing review preview */}
      {hasReview && !open && (
        <div className="rounded-lg bg-amber-500/8 border border-amber-300/30 px-3 py-2 space-y-1">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-semibold text-amber-700">Your review</span>
            <div className="flex items-center gap-2">
              {existingReview.student_completed_at && (
                <span className="inline-flex items-center gap-1 text-xs text-emerald-600">
                  <CheckCircle2 className="w-3 h-3" /> Seen by student
                </span>
              )}
              <button onClick={() => { setComment(existingReview.comment ?? ''); setOpen(true) }} className="text-xs text-primary hover:underline">Edit</button>
            </div>
          </div>
          {existingReview.comment && <p className="text-xs text-foreground leading-snug">{existingReview.comment}</p>}
          {existingReview.file_url && (
            <a href={existingReview.file_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-primary hover:underline">
              <Paperclip className="w-3 h-3" />{existingReview.original_name}
            </a>
          )}
        </div>
      )}

      {/* Toggle button when no existing review */}
      {!hasReview && !open && (
        <button
          onClick={() => setOpen(true)}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors"
        >
          <MessageSquarePlus className="w-3.5 h-3.5" /> Add feedback
        </button>
      )}

      {/* Edit / create form */}
      {open && (
        <div className="rounded-lg border border-border bg-muted/30 p-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-foreground">{hasReview ? 'Edit review' : 'Leave feedback'}</span>
            <button onClick={() => { setOpen(false); setError(null) }} className="text-muted-foreground hover:text-foreground">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          <textarea
            value={comment}
            onChange={e => setComment(e.target.value)}
            placeholder="Write a comment for this student…"
            rows={3}
            className="w-full text-xs rounded-md border border-border bg-background px-3 py-2 resize-none focus:outline-none focus:ring-1 focus:ring-primary"
          />
          <div className="flex items-center gap-3">
            <label className="cursor-pointer">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border border-border bg-card text-xs font-medium hover:bg-muted/50 transition-colors">
                <Paperclip className="w-3.5 h-3.5 text-muted-foreground" />
                {file ? file.name : (existingReview?.original_name ?? 'Attach file…')}
              </div>
              <input type="file" accept="image/*,.pdf" className="sr-only" onChange={e => setFile(e.target.files?.[0] ?? null)} />
            </label>
            {file && (
              <button onClick={() => setFile(null)} className="text-xs text-muted-foreground hover:text-destructive flex items-center gap-1">
                <X className="w-3 h-3" /> Remove
              </button>
            )}
          </div>
          {error && <p className="text-xs text-destructive">{error}</p>}
          <div className="flex items-center justify-between gap-2">
            <Button size="sm" onClick={save} disabled={saving || (!comment.trim() && !file)}>
              {saving ? 'Saving…' : 'Save feedback'}
            </Button>
            <p className="text-[11px] text-muted-foreground">Student can view &amp; save this feedback</p>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Question preview dialog ───────────────────────────────────────────────────

const diffColor: Record<string, string> = {
  easy:   'bg-emerald-500/15 text-emerald-600 border-emerald-300',
  medium: 'bg-amber-500/15   text-amber-600  border-amber-300',
  hard:   'bg-red-500/15     text-red-600    border-red-300',
}

function QuestionPreviewDialog({ question, onClose }: {
  question: WrongAnswer | null
  onClose: () => void
}) {
  return (
    <Dialog open={!!question} onOpenChange={open => { if (!open) onClose() }}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogDescription className="sr-only">
            Leave remedial feedback for the student on this incorrectly answered question.
          </DialogDescription>
          <DialogTitle className="flex flex-wrap items-center gap-2 text-base">
            <span className="text-muted-foreground font-normal text-sm">Q#{question?.question_id}</span>
            {question?.difficulty_level && (
              <Badge variant="outline" className={cn('text-xs', diffColor[question.difficulty_level] ?? '')}>
                {question.difficulty_level}
              </Badge>
            )}
            {question?.topic_tag && (
              <Badge variant="secondary" className="text-xs">{question.topic_tag}</Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        {question && (
          <div className="space-y-4 pt-1">
            <p className="text-sm leading-relaxed text-foreground">
              <MathText text={question.question_text} />
            </p>
            <div className="space-y-2">
              {question.options.map(opt => {
                const isSelected = opt.option_id === question.selected_option_id
                return (
                  <div
                    key={opt.option_id}
                    className={cn(
                      'flex items-center gap-2 px-3 py-2 rounded-lg border text-xs',
                      opt.is_correct
                        ? 'border-emerald-400/40 bg-emerald-500/8 text-emerald-700'
                        : isSelected
                        ? 'border-destructive/40 bg-destructive/10 text-destructive'
                        : 'border-border/40 text-muted-foreground'
                    )}
                  >
                    <span className={cn(
                      'w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0',
                      opt.is_correct    ? 'border-emerald-500 bg-emerald-500'
                        : isSelected   ? 'border-destructive bg-destructive'
                        : 'border-muted-foreground/40'
                    )}>
                      {(opt.is_correct || isSelected) && <span className="block w-1.5 h-1.5 rounded-full bg-white" />}
                    </span>
                    <MathText text={opt.option_text} />
                    {opt.is_correct && <span className="ml-auto font-semibold text-emerald-600">Correct</span>}
                    {isSelected && !opt.is_correct && <span className="ml-auto font-semibold text-destructive">Student's answer</span>}
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

// ── Attempt card ──────────────────────────────────────────────────────────────

function AttemptCard({ attempt, studentId, onReviewSaved }: {
  attempt: StudentAttempt
  studentId: number
  onReviewSaved: (attemptId: number, review: AttemptReview) => void
}) {
  const existingReview = attempt.reviews?.[0]
  const [wrongQs,      setWrongQs]      = useState<WrongAnswer[] | null>(null)
  const [wrongLoading, setWrongLoading] = useState(false)
  const [showWrong,    setShowWrong]    = useState(false)
  const [previewQ,     setPreviewQ]     = useState<WrongAnswer | null>(null)

  const toggleWrongQuestions = async () => {
    if (wrongQs !== null) { setShowWrong(v => !v); return }
    setShowWrong(true)
    setWrongLoading(true)
    try {
      const data = await lecturerApi.attemptWrongQuestions(studentId, attempt.attempt_id)
      setWrongQs(data)
    } catch {
      setWrongQs([])
    } finally {
      setWrongLoading(false)
    }
  }

  return (
    <>
      <div className="border rounded-lg p-3 space-y-1.5">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-sm font-medium">{attempt.quiz?.title ?? `Quiz #${attempt.quiz_id}`}</p>
            {attempt.quiz?.topic && (
              <p className="text-xs text-muted-foreground">{attempt.quiz.topic.topic_name}</p>
            )}
          </div>
          <Badge
            variant="outline"
            className={cn(
              'shrink-0 text-xs capitalize',
              attempt.pass_status === 'pass'
                ? 'text-emerald-600 border-emerald-300 bg-emerald-500/10'
                : 'text-destructive border-destructive/30 bg-destructive/10'
            )}
          >
            {attempt.pass_status}
          </Badge>
        </div>

        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>
            {Math.round(attempt.percentage)}%
            {attempt.submitted_at && (
              <> · {new Date(attempt.submitted_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</>
            )}
          </span>
          {attempt.uploads && attempt.uploads.length > 0 && (
            <a
              href={attempt.uploads[0].url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-primary hover:underline"
            >
              <Paperclip className="w-3 h-3" />
              {attempt.uploads[0].original_name}
            </a>
          )}
        </div>

        {/* Struggled questions toggle */}
        {attempt.percentage < 100 && (
          <div>
            <button
              onClick={toggleWrongQuestions}
              className="text-xs text-destructive/80 hover:text-destructive flex items-center gap-1 transition-colors"
            >
              <span>{showWrong ? '▾' : '▸'}</span>
              {wrongQs !== null
                ? `${wrongQs.length} struggled question${wrongQs.length !== 1 ? 's' : ''}`
                : 'View struggled questions'}
            </button>

            {showWrong && (
              <div className="mt-2 space-y-1.5">
                {wrongLoading ? (
                  <div className="space-y-1">
                    {[1, 2].map(i => <Skeleton key={i} className="h-7 w-full rounded-md" />)}
                  </div>
                ) : wrongQs?.length === 0 ? (
                  <p className="text-xs text-muted-foreground italic">No incorrect answers recorded.</p>
                ) : (
                  wrongQs?.map(q => (
                    <div key={q.question_id} className="rounded-md border border-destructive/20 bg-destructive/5 px-2.5 py-2 space-y-1">
                      <button
                        onClick={() => setPreviewQ(q)}
                        className="w-full text-left text-xs text-destructive/80 hover:text-destructive transition-colors truncate"
                      >
                        Q#{q.question_id} · {q.question_text.slice(0, 80)}{q.question_text.length > 80 ? '…' : ''}
                      </button>
                      <QuestionFeedbackInline question={q} topicId={attempt.quiz?.topic_id ?? 0} />
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        )}

      </div>

      <AttemptReviewForm
          attempt={attempt}
          existingReview={existingReview}
          onSaved={(review) => onReviewSaved(attempt.attempt_id, review)}
        />

      <QuestionPreviewDialog question={previewQ} onClose={() => setPreviewQ(null)} />
    </>
  )
}

// ── Types ─────────────────────────────────────────────────────────────────────

type View = { kind: 'list' } | { kind: 'detail'; student: StudentOverview }

// ── Main panel ────────────────────────────────────────────────────────────────

export function MasteryOverviewPanel() {
  const [view,            setView]            = useState<View>({ kind: 'list' })
  const [classes,         setClasses]         = useState<ClassRoom[]>([])
  const [selectedId,      setSelectedId]      = useState<string>('all')
  const [data,            setData]            = useState<MasteryOverview | null>(null)
  const [loading,         setLoading]         = useState(true)
  const [attempts,         setAttempts]         = useState<StudentAttempt[] | null>(null)
  const [attemptsLoading,  setAttemptsLoading]  = useState(false)
  const [masteryData,      setMasteryData]      = useState<StudentMasteryRecord[]>([])

  const openStudent = async (student: StudentOverview) => {
    setView({ kind: 'detail', student })
    setAttempts(null)
    setMasteryData([])
    setAttemptsLoading(true)
    try {
      const [attempts, mastery] = await Promise.all([
        lecturerApi.studentAttempts(student.user_id),
        lecturerApi.studentMastery(student.user_id),
      ])
      setAttempts(attempts)
      setMasteryData(mastery)
    } catch {
      setAttempts([])
    } finally {
      setAttemptsLoading(false)
    }
  }

  const handleReviewSaved = (attemptId: number, review: AttemptReview) => {
    setAttempts(prev => prev?.map(a =>
      a.attempt_id === attemptId
        ? { ...a, reviews: [review, ...(a.reviews ?? []).filter(r => r.review_id !== review.review_id)] }
        : a
    ) ?? null)
  }

  useEffect(() => {
    lecturerApi.classes().then(setClasses).catch(() => {})
  }, [])

  useEffect(() => {
    setLoading(true)
    setData(null)
    const classId = selectedId === 'all' ? undefined : Number(selectedId)
    lecturerApi.masteryOverview(classId)
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [selectedId])

  const { topics = [], students = [] } = data ?? {}
  const totalStudents = students.length

  // ── Detail view ─────────────────────────────────────────────────────────────

  if (view.kind === 'detail') {
    const { student } = view
    return (
      <div className="space-y-6 max-w-5xl mx-auto">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => setView({ kind: 'list' })}>
            <ArrowLeft className="w-4 h-4 mr-1" /> Overview
          </Button>
          <div>
            <h1 className="text-xl font-bold">{student.full_name}</h1>
            {student.student_id && (
              <p className="text-sm text-muted-foreground">{student.student_id}</p>
            )}
          </div>
        </div>

        {/* Topic progress cards - all topics, defaulting to 0 if no data yet */}
        {topics.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {topics.map(t => {
              const m            = masteryData.find(r => r.topic_id === t.topic_id)
              const practices    = m?.attempted_set_numbers.length ?? 0
              const courses      = m?.courses_completed ?? 0
              const practicesPct = Math.min(practices / 10 * 100, 100)
              const coursesPct   = Math.min(courses / 4 * 100, 100)
              const overallPct   = Math.round((practicesPct + coursesPct) / 2)

              const barColor =
                m?.mastery_level === 'mastered'   ? '[&>div]:bg-emerald-500' :
                m?.mastery_level === 'practicing' ? '[&>div]:bg-amber-500'   :
                m?.mastery_level === 'learning'   ? '[&>div]:bg-blue-500'    :
                '[&>div]:bg-muted-foreground/40'

              return (
                <Card key={t.topic_id} className="border">
                  <CardContent className="pt-4 pb-4 space-y-3">
                    <p className="font-semibold text-sm text-foreground">{t.topic_name}</p>

                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">Progress</span>
                        <span className="font-medium">{overallPct}%</span>
                      </div>
                      <Progress value={overallPct} className={cn('h-2', barColor)} />
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Practices</span>
                        <span>{Math.min(practices, 10)} of 10 completed</span>
                      </div>
                      <Progress value={practicesPct} className={cn('h-1.5', barColor)} />
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Courses</span>
                        <span>{Math.min(courses, 4)} of 4 completed</span>
                      </div>
                      <Progress value={coursesPct} className="h-1.5 [&>div]:bg-sky-400" />
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}

        {/* Latest attempt per quiz */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Latest Quiz Attempts</CardTitle>
          </CardHeader>
          <CardContent>
            {attemptsLoading ? (
              <div className="space-y-2">
                {[1, 2, 3].map(i => <Skeleton key={i} className="h-14 w-full rounded-lg" />)}
              </div>
            ) : attempts?.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No quiz attempts yet.</p>
            ) : (
              <div className="space-y-2">
                {Object.values(
                  (attempts ?? []).reduce<Record<number, StudentAttempt>>((acc, a) => {
                    const prev = acc[a.quiz_id]
                    if (!prev || new Date(a.submitted_at) > new Date(prev.submitted_at)) {
                      acc[a.quiz_id] = a
                    }
                    return acc
                  }, {})
                ).map(attempt => (
                  <AttemptCard
                    key={attempt.attempt_id}
                    attempt={attempt}
                    studentId={student.user_id}
                    onReviewSaved={handleReviewSaved}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    )
  }

  // ── List view ────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold">Class Mastery Overview</h1>
          <p className="text-muted-foreground text-sm">Student progress across all topics</p>
        </div>

        <Select value={selectedId} onValueChange={setSelectedId}>
          <SelectTrigger className="w-56">
            <SelectValue placeholder="All classes" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Classes</SelectItem>
            {classes.map(c => (
              <SelectItem key={c.class_id} value={String(c.class_id)}>
                {c.class_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="space-y-4">
          <Skeleton className="h-64 w-full" />
        </div>
      ) : students.length === 0 ? (
        <Card>
          <CardContent className="pt-10 pb-10 text-center space-y-2">
            <p className="font-semibold text-foreground">No students enrolled</p>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto">
              {selectedId === 'all'
                ? 'Create a class and enroll students in the Classes tab.'
                : 'No students enrolled in this class yet.'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Student Progress
              <span className="ml-2 font-normal text-muted-foreground">({totalStudents} students)</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto p-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left px-4 py-3 font-semibold sticky left-0 bg-card min-w-[180px]">
                    Student
                  </th>
                  {topics.map(t => (
                    <th key={t.topic_id} className="text-center px-3 py-3 font-semibold min-w-[120px]">
                      <div className="truncate max-w-[110px] mx-auto text-foreground">{t.topic_name}</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {students.map(s => (
                  <tr key={s.user_id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                    <td
                      className="px-4 py-3 sticky left-0 bg-card cursor-pointer group"
                      onClick={() => openStudent(s)}
                    >
                      <div className="font-medium text-primary group-hover:underline">{s.full_name}</div>
                      {s.student_id && <div className="text-xs text-muted-foreground">{s.student_id}</div>}
                    </td>
                    {topics.map(t => {
                      const m     = s.masteries[t.topic_id]
                      const level = m?.mastery_level ?? 'not_started'
                      return (
                        <td key={t.topic_id} className="px-3 py-3 text-center">
                          <Badge variant="outline" className={cn('text-xs', levelColor[level] ?? levelColor.not_started)}>
                            {levelLabel[level] ?? 'N/A'}
                          </Badge>
                          {m?.is_weak && <div className="text-[10px] text-destructive mt-0.5">⚠ Weak</div>}
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
