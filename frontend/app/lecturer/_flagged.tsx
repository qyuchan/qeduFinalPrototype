"use client"

import { useEffect, useState, useRef, useCallback } from "react"
import { lecturerApi, type FlaggedQuestion, type FlaggedQuestionOption, type Remediation } from "@/lib/api/lecturer"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Input } from "@/components/ui/input"
import { Trash2, Plus, ChevronDown, ChevronUp, BookOpen, Upload, FileText, Users } from "lucide-react"
import { cn } from "@/lib/utils"
import { MathText } from "@/components/math-text"
import { useAuth } from "@/lib/auth-context"

// ─── Math symbols for explanation editor ──────────────────────────────────────

type Sym = { display: string; insert: string; label?: string }

const EXPLAIN_TABS: { id: string; label: string; symbols: Sym[] }[] = [
  {
    id: 'math', label: 'Math',
    symbols: [
      { display: '½',   insert: '\\frac{}{}',       label: 'Fraction' },
      { display: '√x',  insert: '\\sqrt{}',          label: 'Sqrt' },
      { display: 'xⁿ',  insert: '^{}',               label: 'Power' },
      { display: 'xₙ',  insert: '_{} ',              label: 'Subscript' },
      { display: '∑',   insert: '\\sum_{i=1}^{n} ', label: 'Sum' },
      { display: '∏',   insert: '\\prod_{i=1}^{n} ',label: 'Product' },
      { display: '∫',   insert: '\\int_{}^{} ',      label: 'Integral' },
      { display: '±',   insert: '\\pm ',             label: '±' },
      { display: '·',   insert: '\\cdot ',           label: 'Dot' },
      { display: '×',   insert: '\\times ',          label: 'Times' },
      { display: '÷',   insert: '\\div ',            label: 'Divide' },
      { display: '…',   insert: '\\cdots ',          label: 'Cdots' },
    ],
  },
  {
    id: 'greek', label: 'Greek',
    symbols: [
      { display: 'α', insert: '\\alpha ' },  { display: 'β', insert: '\\beta ' },
      { display: 'γ', insert: '\\gamma ' },  { display: 'δ', insert: '\\delta ' },
      { display: 'λ', insert: '\\lambda ' }, { display: 'μ', insert: '\\mu ' },
      { display: 'π', insert: '\\pi ' },     { display: 'σ', insert: '\\sigma ' },
      { display: 'θ', insert: '\\theta ' },  { display: 'φ', insert: '\\phi ' },
      { display: 'Σ', insert: '\\Sigma ' },  { display: 'Δ', insert: '\\Delta ' },
    ],
  },
  {
    id: 'sets', label: 'Sets & Logic',
    symbols: [
      { display: 'ℝ', insert: '\\mathbb{R}' }, { display: 'ℤ', insert: '\\mathbb{Z}' },
      { display: '∞', insert: '\\infty ' },    { display: '∈', insert: '\\in ' },
      { display: '⊆', insert: '\\subseteq ' }, { display: '∪', insert: '\\cup ' },
      { display: '∩', insert: '\\cap ' },      { display: '≠', insert: '\\neq ' },
      { display: '≤', insert: '\\leq ' },      { display: '≥', insert: '\\geq ' },
      { display: '→', insert: '\\rightarrow ' },{ display: '⇒', insert: '\\Rightarrow ' },
    ],
  },
]

// ─── Question row ─────────────────────────────────────────────────────────────

type AddMode = 'explanation' | 'upload'

const diffColor: Record<string, string> = {
  easy:   'bg-emerald-500/15 text-emerald-600 border-emerald-300',
  medium: 'bg-amber-500/15   text-amber-600  border-amber-300',
  hard:   'bg-red-500/15     text-red-600    border-red-300',
}

function QuestionRow({
  question,
  isOwn,
  onAdded,
  onDeleted,
  onDismissed,
}: {
  question:    FlaggedQuestion
  isOwn:       boolean
  onAdded:     (questionId: number, rem: Remediation) => void
  onDeleted:   (questionId: number, remediationId: number) => void
  onDismissed: (questionId: number) => void
}) {
  const [expanded,    setExpanded]    = useState(false)
  const [mode,        setMode]        = useState<AddMode>('explanation')
  const [explanation, setExplanation] = useState('')
  const [pdfFile,     setPdfFile]     = useState<File | null>(null)
  const [pdfTitle,    setPdfTitle]    = useState('')
  const [saving,      setSaving]      = useState(false)
  const [dismissing,  setDismissing]  = useState(false)
  const [error,       setError]       = useState<string | null>(null)
  const [symTab,      setSymTab]      = useState('math')
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null)
  const explainRef = useRef<HTMLTextAreaElement>(null)

  const handleDismiss = async () => {
    setDismissing(true)
    try {
      await lecturerApi.dismissFlaggedQuestion(question.question_id)
      onDismissed(question.question_id)
    } catch {
      setDismissing(false)
    }
  }

  const insertSymbol = useCallback((sym: Sym) => {
    const ta = explainRef.current
    if (!ta) return
    const start = ta.selectionStart ?? 0
    const end   = ta.selectionEnd   ?? 0
    const wrap  = `$${sym.insert}$`
    setExplanation(prev => prev.slice(0, start) + wrap + prev.slice(end))
    requestAnimationFrame(() => { ta.focus(); ta.setSelectionRange(start + wrap.length, start + wrap.length) })
  }, [])

  const reset = () => {
    setExplanation('')
    setPdfFile(null)
    setPdfTitle('')
    setError(null)
  }

  const handleAdd = async () => {
    setError(null)
    if (mode === 'explanation' && !explanation.trim()) { setError('Write an explanation.'); return }
    if (mode === 'upload') {
      if (!pdfFile) { setError('Choose a PDF file.'); return }
      if (!pdfTitle.trim()) { setError('Enter a title for the PDF.'); return }
    }
    setSaving(true)
    try {
      let materialId: number | undefined
      if (mode === 'upload') {
        const mat = await lecturerApi.createMaterial(
          {
            topic_id:         question.topic_id,
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
        custom_explanation: mode === 'explanation' ? explanation : undefined,
      })
      onAdded(question.question_id, rem)
      reset()
      setExpanded(false)
    } catch (e: any) {
      setError(e?.data?.message || 'Failed to save.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card className="border-border/60">
      <CardContent className="pt-4 pb-4 space-y-3">
        {/* Header */}
        <div className="flex items-start gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1.5">
              <Badge variant="outline" className={cn('text-xs', diffColor[question.difficulty_level] ?? '')}>
                {question.difficulty_level}
              </Badge>
              {question.topic_tag && (
                <Badge variant="secondary" className="text-xs">{question.topic_tag}</Badge>
              )}
              {!isOwn && (
                <Badge variant="outline" className="text-xs text-muted-foreground">
                  By {question.quiz_creator_name}
                </Badge>
              )}
              <span className="text-xs text-destructive font-medium">
                {question.wrong_count} wrong · {question.affected_students} student{question.affected_students !== 1 ? 's' : ''}
              </span>
            </div>
            <p className="text-sm font-semibold text-foreground leading-relaxed"><MathText text={question.question_text} /></p>
          </div>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <Button
              variant="outline" size="sm"
              onClick={() => { setExpanded(!expanded); setError(null) }}
            >
              <Plus className="w-3.5 h-3.5" />
              Add
              {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </Button>
            <Button
              variant="ghost" size="sm"
              className="text-destructive hover:text-destructive h-8 w-8 p-0"
              title="Dismiss from this list: reappears if a student answers it wrong again"
              onClick={handleDismiss}
              disabled={dismissing}
            >
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>

        {/* Answer options */}
        {question.options && question.options.length > 0 && (
          <div className="space-y-1.5 pl-1">
            {question.options.map(opt => (
              <div
                key={opt.option_id}
                className={cn(
                  "flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs",
                  opt.is_correct
                    ? "border-emerald-400/40 bg-emerald-500/8 text-emerald-700"
                    : "border-border/40 text-muted-foreground"
                )}
              >
                <span className={cn(
                  "w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0",
                  opt.is_correct ? "border-emerald-500 bg-emerald-500" : "border-muted-foreground/40"
                )}>
                  {opt.is_correct && <span className="block w-1.5 h-1.5 rounded-full bg-white" />}
                </span>
                <MathText text={opt.option_text} />
                {opt.is_correct && <span className="ml-auto font-semibold text-emerald-600">Correct</span>}
              </div>
            ))}
          </div>
        )}

        {/* Existing remediations */}
        {question.remediations.length > 0 && (
          <div className="space-y-2 border-t border-border/40 pt-3">
            {question.remediations.map(rem => (
              <div key={rem.remediation_id} className="p-2.5 rounded-lg bg-primary/5 border border-primary/15 space-y-2">
                <div className="flex items-start gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-primary mb-0.5">By {rem.lecturer.full_name}</p>
                    {rem.material ? (
                      <div className="flex items-center gap-1.5 text-sm">
                        <BookOpen className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                        {(rem.material.file_url ?? rem.material.external_url) ? (
                          <a
                            href={(rem.material.file_url ?? rem.material.external_url)!}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="truncate text-primary hover:underline"
                          >
                            {rem.material.title}
                          </a>
                        ) : (
                          <span className="truncate">{rem.material.title}</span>
                        )}
                        <Badge variant="outline" className="text-xs ml-1">{rem.material.content_type}</Badge>
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground line-clamp-2">{rem.custom_explanation}</p>
                    )}
                  </div>
                  <Button
                    variant="ghost" size="sm"
                    className="text-destructive hover:text-destructive h-7 w-7 p-0 flex-shrink-0"
                    onClick={() => setConfirmDeleteId(id => id === rem.remediation_id ? null : rem.remediation_id)}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>

                {confirmDeleteId === rem.remediation_id && (
                  <div className="flex items-center gap-2 rounded-md border border-destructive/30 bg-destructive/5 px-2.5 py-2">
                    <p className="text-xs text-destructive flex-1">
                      Remove this feedback permanently? This can&apos;t be undone.
                      {rem.material && " If the attached material isn't used anywhere else, it will be deleted too."}
                    </p>
                    <Button
                      size="sm" variant="destructive" className="h-6 text-xs px-2"
                      onClick={() => { setConfirmDeleteId(null); onDeleted(question.question_id, rem.remediation_id) }}
                    >
                      Remove
                    </Button>
                    <Button
                      size="sm" variant="ghost" className="h-6 text-xs px-2"
                      onClick={() => setConfirmDeleteId(null)}
                    >
                      Cancel
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Add form */}
        {expanded && (
          <div className="space-y-3 border-t border-border/40 pt-3">
            <div className="grid grid-cols-2 gap-2">
              {([
                { key: 'explanation', label: 'Write Explanation' },
                { key: 'upload',      label: 'Upload PDF' },
              ] as { key: AddMode; label: string }[]).map(({ key, label }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => { setMode(key); setError(null) }}
                  className={cn(
                    "py-2 px-3 rounded-lg border text-sm font-medium transition-all",
                    mode === key
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border text-muted-foreground hover:border-primary/40"
                  )}
                >
                  {label}
                </button>
              ))}
            </div>

            {mode === 'explanation' && (
              <div className="space-y-2">
                {/* Symbol picker */}
                <div className="space-y-1">
                  <div className="flex gap-1 rounded-lg bg-muted/50 p-1 w-fit">
                    {EXPLAIN_TABS.map(t => (
                      <button key={t.id} type="button" onClick={() => setSymTab(t.id)}
                        className={cn("px-2.5 py-1 rounded-md text-xs font-medium transition-colors",
                          symTab === t.id ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
                        )}>{t.label}</button>
                    ))}
                  </div>
                  <div className="flex flex-wrap gap-1 p-2 rounded-lg border bg-muted/20">
                    {EXPLAIN_TABS.find(t => t.id === symTab)!.symbols.map((sym, i) => (
                      <button key={i} type="button" title={sym.label ?? sym.insert} onClick={() => insertSymbol(sym)}
                        className="h-7 min-w-[2rem] px-2 rounded-md border bg-background text-xs font-mono hover:bg-primary/10 hover:border-primary/40 transition-colors">
                        {sym.display}
                      </button>
                    ))}
                  </div>
                  <p className="text-[10px] text-muted-foreground">Use <code>$…$</code> for inline math in the explanation.</p>
                </div>
                <textarea
                  ref={explainRef}
                  placeholder="Write a clear explanation for students who got this question wrong…"
                  value={explanation}
                  onChange={e => setExplanation(e.target.value)}
                  rows={3}
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm font-mono resize-y focus:outline-none focus:ring-2 focus:ring-ring min-h-[72px]"
                />
              </div>
            )}

            {mode === 'upload' && (
              <div className="space-y-2">
                <Input
                  placeholder="PDF title (shown to students)…"
                  value={pdfTitle}
                  onChange={e => setPdfTitle(e.target.value)}
                  className="text-sm"
                />
                <label className={cn(
                  "flex flex-col items-center justify-center gap-2 w-full h-24 rounded-lg border-2 border-dashed cursor-pointer transition-colors",
                  pdfFile
                    ? "border-primary/50 bg-primary/5"
                    : "border-border hover:border-primary/40 hover:bg-muted/30"
                )}>
                  <input
                    type="file"
                    accept="application/pdf"
                    className="sr-only"
                    onChange={e => setPdfFile(e.target.files?.[0] ?? null)}
                  />
                  {pdfFile ? (
                    <>
                      <FileText className="w-5 h-5 text-primary" />
                      <span className="text-xs text-primary font-medium truncate max-w-[90%]">{pdfFile.name}</span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-5 h-5 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">Click to choose a PDF (max 20 MB)</span>
                    </>
                  )}
                </label>
              </div>
            )}

            {error && <p className="text-destructive text-xs">{error}</p>}

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" size="sm" onClick={() => { setExpanded(false); reset() }}>
                Cancel
              </Button>
              <Button type="button" size="sm" onClick={handleAdd} disabled={saving}>
                {saving
                  ? (mode === 'upload' ? 'Uploading…' : 'Saving…')
                  : (mode === 'upload' ? <><Upload className="w-3.5 h-3.5 mr-1.5" />Upload & Save</> : 'Save')
                }
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// ─── Panel ────────────────────────────────────────────────────────────────────

export function FlaggedQuestionsPanel() {
  const { user } = useAuth()
  const [scope,     setScope]     = useState<'own' | 'all'>('own')
  const [questions, setQuestions] = useState<FlaggedQuestion[]>([])
  const [loading,   setLoading]   = useState(true)

  useEffect(() => {
    setLoading(true)
    lecturerApi.flaggedQuestions(scope === 'all')
      .then(setQuestions)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [scope])

  const handleAdded = (questionId: number, rem: Remediation) =>
    setQuestions(prev => prev.map(q =>
      q.question_id === questionId ? { ...q, remediations: [...q.remediations, rem] } : q
    ))

  const handleDeleted = async (questionId: number, remediationId: number) => {
    await lecturerApi.deleteRemediation(remediationId).catch(() => {})
    setQuestions(prev => prev.map(q =>
      q.question_id === questionId
        ? { ...q, remediations: q.remediations.filter(r => r.remediation_id !== remediationId) }
        : q
    ))
  }

  const handleDismissed = (questionId: number) =>
    setQuestions(prev => prev.filter(q => q.question_id !== questionId))

  if (loading) return (
    <div className="space-y-3 max-w-3xl mx-auto">
      <Skeleton className="h-8 w-64" />
      {[1, 2, 3].map(i => <Skeleton key={i} className="h-28 w-full" />)}
    </div>
  )

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold">Flagged Questions</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {scope === 'own'
              ? "Questions your students answered incorrectly. Write an explanation or upload a PDF, and it will appear in their dashboard."
              : "Flagged questions across every lecturer's quizzes. You can add your own feedback or dismiss any of them from your view."}
          </p>
        </div>
        <div className="flex gap-1 rounded-lg bg-muted/50 p-1 flex-shrink-0">
          <button
            type="button" onClick={() => setScope('own')}
            className={cn("px-3 py-1.5 rounded-md text-xs font-medium transition-colors",
              scope === 'own' ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
            )}
          >
            My Flagged Questions
          </button>
          <button
            type="button" onClick={() => setScope('all')}
            className={cn("px-3 py-1.5 rounded-md text-xs font-medium transition-colors flex items-center gap-1.5",
              scope === 'all' ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Users className="w-3.5 h-3.5" /> All Lecturers
          </button>
        </div>
      </div>

      {questions.length === 0 ? (
        <div className="flex items-center justify-center min-h-[300px]">
          <div className="text-center space-y-2">
            <p className="font-semibold text-foreground">No flagged questions yet</p>
            <p className="text-sm text-muted-foreground">
              {scope === 'own'
                ? "Questions students answer incorrectly will appear here once quiz attempts are submitted."
                : "No lecturer has any flagged questions right now."}
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {questions.map(q => (
            <QuestionRow
              key={q.question_id}
              question={q}
              isOwn={q.quiz_creator_id === user?.user_id}
              onAdded={handleAdded}
              onDeleted={handleDeleted}
              onDismissed={handleDismissed}
            />
          ))}
        </div>
      )}
    </div>
  )
}
