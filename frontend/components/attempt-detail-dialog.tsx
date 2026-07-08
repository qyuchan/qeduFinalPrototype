"use client"

import { useEffect, useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import { CheckCircle2, XCircle, GraduationCap, Paperclip, Upload, BookOpen } from "lucide-react"
import { recommendationsApi, type AttemptDetail } from "@/lib/api/recommendations"
import { MathText } from "@/components/math-text"

interface Props {
  attemptId: number | null
  questionId?: number | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AttemptDetailDialog({ attemptId, questionId, open, onOpenChange }: Props) {
  const [detail,  setDetail]  = useState<AttemptDetail | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!open || !attemptId) return
    setDetail(null)
    setLoading(true)
    recommendationsApi.getAttemptDetail(attemptId)
      .then(setDetail)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [open, attemptId])

  const quiz      = detail?.quiz
  const pct       = detail ? Math.round(detail.percentage) : 0
  const passed    = detail?.pass_status === 'pass'
  const submitted = detail?.submitted_at
    ? new Date(detail.submitted_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
    : ''

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogDescription className="sr-only">
            Full details of this quiz attempt, including each question, your answer, the correct
            answer, and any lecturer feedback.
          </DialogDescription>
          <DialogTitle className="flex items-center gap-2 flex-wrap">
            {quiz?.title ?? 'Quiz Attempt'}
            {quiz?.set_number != null && (
              <span className="text-sm font-normal text-muted-foreground">Set {quiz.set_number}</span>
            )}
          </DialogTitle>
          {(quiz?.topic || submitted) && (
            <div className="flex items-center gap-3 flex-wrap pt-1">
              {quiz?.topic && (
                <Badge variant="outline" className="text-xs">{quiz.topic.topic_name}</Badge>
              )}
              {submitted && (
                <span className="text-xs text-muted-foreground">{submitted}</span>
              )}
              {detail && (
                <Badge
                  variant="outline"
                  className={cn(
                    'text-xs capitalize',
                    passed
                      ? 'text-emerald-600 border-emerald-300 bg-emerald-500/10'
                      : 'text-destructive border-destructive/30 bg-destructive/10'
                  )}
                >
                  {pct}% · {detail.pass_status}
                </Badge>
              )}
            </div>
          )}
        </DialogHeader>

        {loading ? (
          <div className="space-y-3 pt-2">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-20 w-full rounded-xl" />)}
          </div>
        ) : detail ? (
          <div className="space-y-6 pt-2">

            {/* Questions & answers */}
            <section>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                Question &amp; Answer
              </p>
              <div className="space-y-4">
                {detail.student_answers
                  .filter(ans => !questionId || ans.question_id === questionId)
                  .map((ans, i) => {
                  const q = ans.question
                  if (!q) return null
                  return (
                    <div
                      key={ans.answer_id}
                      className={cn(
                        "rounded-xl border p-4 space-y-3",
                        ans.is_correct
                          ? "border-emerald-300/40 bg-emerald-500/5"
                          : "border-destructive/30 bg-destructive/5"
                      )}
                    >
                      {/* Question header */}
                      <div className="flex items-start gap-2">
                        {ans.is_correct
                          ? <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                          : <XCircle      className="w-4 h-4 text-destructive flex-shrink-0 mt-0.5" />
                        }
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant="outline" className="text-xs">Q{i + 1}</Badge>
                            {q.topic_tag && (
                              <span className="text-xs text-muted-foreground">{q.topic_tag}</span>
                            )}
                            <span className="text-xs text-muted-foreground ml-auto">{q.marks} mark{q.marks !== 1 ? 's' : ''}</span>
                          </div>
                          <p className="text-sm font-medium text-foreground">
                            <MathText text={q.question_text} />
                          </p>
                        </div>
                      </div>

                      {/* Options */}
                      <div className="space-y-1.5 pl-6">
                        {q.options.map(opt => {
                          const isSelected = opt.option_id === ans.selected_option_id
                          const isCorrect  = opt.is_correct
                          return (
                            <div
                              key={opt.option_id}
                              className={cn(
                                "flex items-center gap-2 rounded-lg px-3 py-2 text-sm",
                                isCorrect && isSelected   && "bg-emerald-500/15 border border-emerald-400/40 font-medium text-emerald-700",
                                isCorrect && !isSelected  && "bg-emerald-500/8  border border-emerald-300/30 text-emerald-700",
                                !isCorrect && isSelected  && "bg-destructive/10 border border-destructive/30 font-medium text-destructive",
                                !isCorrect && !isSelected && "text-muted-foreground"
                              )}
                            >
                              <span className={cn(
                                "w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center text-[10px] font-bold",
                                isCorrect  && "border-emerald-500 bg-emerald-500 text-white",
                                !isCorrect && isSelected && "border-destructive bg-destructive text-white",
                                !isCorrect && !isSelected && "border-muted-foreground"
                              )}>
                                {(isCorrect || isSelected) && (isCorrect ? '✓' : '✗')}
                              </span>
                              <MathText text={opt.option_text} />
                              {isSelected && !isCorrect && (
                                <span className="ml-auto text-xs text-destructive flex-shrink-0">Your answer</span>
                              )}
                              {isCorrect && !isSelected && (
                                <span className="ml-auto text-xs text-emerald-600 flex-shrink-0">Correct answer</span>
                              )}
                              {isCorrect && isSelected && (
                                <span className="ml-auto text-xs text-emerald-600 flex-shrink-0">Your answer ✓</span>
                              )}
                            </div>
                          )
                        })}
                      </div>

                    </div>
                  )
                })}
              </div>
            </section>

            {/* Lecturer remediations: grouped per question by topic_tag */}
            {(() => {
              const wrongAnswers = detail.student_answers.filter(
                ans => !ans.is_correct &&
                  (ans.question?.remediations?.length ?? 0) > 0 &&
                  (!questionId || ans.question_id === questionId)
              )
              if (wrongAnswers.length === 0) return null
              return (
                <section>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                    General Review
                  </p>
                  <div className="space-y-4">
                    {wrongAnswers.map(ans => (
                      <div key={ans.question!.question_id} className="rounded-xl border border-amber-300/40 bg-amber-500/5 p-4 space-y-3">
                        {/* Question label */}
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="text-xs">
                            Q#{ans.question!.question_id}
                          </Badge>
                          {ans.question!.topic_tag && (
                            <span className="text-xs text-muted-foreground">{ans.question!.topic_tag}</span>
                          )}
                        </div>
                        {/* Remediations for this question */}
                        <div className="space-y-2">
                          {ans.question!.remediations.map(rem => (
                            <div key={rem.remediation_id} className="space-y-1">
                              <div className="flex items-center gap-1.5">
                                <GraduationCap className="w-3.5 h-3.5 text-amber-600" />
                                <span className="text-xs font-semibold text-amber-700">{rem.lecturer?.full_name ?? 'Lecturer'}</span>
                              </div>
                              {rem.material ? (
                                <div className="flex items-center gap-2 flex-wrap pl-5">
                                  <BookOpen className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                                  {(rem.material.file_url ?? rem.material.external_url) ? (
                                    <a
                                      href={(rem.material.file_url ?? rem.material.external_url)!}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-sm font-medium text-primary hover:underline"
                                    >
                                      {rem.material.title}
                                    </a>
                                  ) : (
                                    <span className="text-sm font-medium">{rem.material.title}</span>
                                  )}
                                  <Badge variant="outline" className="text-xs">{rem.material.content_type}</Badge>
                                </div>
                              ) : (
                                <p className="text-sm text-foreground leading-relaxed pl-5">{rem.custom_explanation}</p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )
            })()}

            {/* Lecturer reviews */}
            {detail.reviews.length > 0 && (
              <section>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                  Feedback from Lecturer
                </p>
                <div className="space-y-3">
                  {detail.reviews.map(rev => (
                    <div key={rev.review_id} className="rounded-xl border border-amber-300/40 bg-amber-500/5 p-4 space-y-2">
                      <div className="flex items-center gap-1.5">
                        <GraduationCap className="w-4 h-4 text-amber-600" />
                        <span className="text-sm font-semibold text-amber-700">{rev.lecturer?.full_name ?? 'Lecturer'}</span>
                        <span className="text-xs text-muted-foreground ml-auto">
                          {new Date(rev.updated_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                      </div>
                      {rev.comment && (
                        <p className="text-sm text-foreground leading-relaxed">{rev.comment}</p>
                      )}
                      {rev.file_url && (
                        <a
                          href={rev.file_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
                        >
                          <Paperclip className="w-3.5 h-3.5" />
                          {rev.original_name ?? 'Attached file'}
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Student uploads */}
            {detail.uploads.length > 0 && (
              <section>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                  Your Uploaded Work
                </p>
                <div className="space-y-2">
                  {detail.uploads.map(up => (
                    <a
                      key={up.upload_id}
                      href={up.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 rounded-lg border border-border px-3 py-2.5 text-sm hover:bg-muted/50 transition-colors"
                    >
                      <Upload className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                      <span className="flex-1 truncate">{up.original_name}</span>
                    </a>
                  ))}
                </div>
              </section>
            )}

          </div>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-8">Could not load attempt details.</p>
        )}
      </DialogContent>
    </Dialog>
  )
}
