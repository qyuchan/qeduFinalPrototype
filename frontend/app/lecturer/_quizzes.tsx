"use client"

import { useEffect, useState, useRef, useCallback } from "react"
import { lecturerApi, type Quiz, type Topic, type Subtopic, type ClassRoom, type CreateQuizPayload, type UpdateQuizPayload } from "@/lib/api/lecturer"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Skeleton } from "@/components/ui/skeleton"
import { Plus, Trash2, ChevronDown, ChevronUp, CheckCircle2, ImagePlus, X, Pencil, AlertTriangle } from "lucide-react"
import { cn } from "@/lib/utils"
import { MathText } from "@/components/math-text"

// ─── Types ───────────────────────────────────────────────────────────────────

type NewOption = { option_text: string; is_correct: boolean }
type NewQuestion = {
  question_id?:         number
  question_text:        string
  marks:                number
  difficulty_level:     string
  topic_tag:            string
  subtopic_id:          string
  explanation:          string
  options:              NewOption[]
  image:                File | null
  existing_image_path:  string | null
  remove_image:         boolean
}
type NewQuiz = {
  topic_id:           string
  class_id:           string
  title:              string
  description:        string
  quiz_type:          string
  passing_threshold:  number
  time_limit_minutes: number
  questions:          NewQuestion[]
}

const blankOption   = (): NewOption   => ({ option_text: '', is_correct: false })
const blankQuestion = (): NewQuestion => ({
  question_text: '', marks: 1, difficulty_level: 'medium',
  topic_tag: '', subtopic_id: '', explanation: '',
  options: [blankOption(), blankOption(), blankOption(), blankOption()],
  image: null, existing_image_path: null, remove_image: false,
})
const blankQuiz = (): NewQuiz => ({
  topic_id: '', class_id: 'none', title: '', description: '',
  quiz_type: 'formative', passing_threshold: 60, time_limit_minutes: 30,
  questions: [blankQuestion()],
})

// ─── Compact math symbol picker for question text ────────────────────────────

type Sym = { display: string; insert: string; label?: string; block?: boolean }

const Q_SYMBOL_TABS: { id: string; label: string; symbols: Sym[] }[] = [
  {
    id: 'math',
    label: 'Math',
    symbols: [
      { display: '½',   insert: '\\frac{}{}',          label: 'Fraction' },
      { display: '√x',  insert: '\\sqrt{}',             label: 'Square root' },
      { display: 'xⁿ',  insert: '^{}',                  label: 'Power' },
      { display: 'xₙ',  insert: '_{} ',                 label: 'Subscript' },
      { display: '∑',   insert: '\\sum_{i=1}^{n} ',    label: 'Sum' },
      { display: '∏',   insert: '\\prod_{i=1}^{n} ',   label: 'Product' },
      { display: '∫',   insert: '\\int_{}^{} ',         label: 'Integral' },
      { display: '±',   insert: '\\pm ',                label: '±' },
      { display: '·',   insert: '\\cdot ',              label: 'Dot mult' },
      { display: '×',   insert: '\\times ',             label: 'Times' },
      { display: '÷',   insert: '\\div ',               label: 'Divide' },
      { display: '‖v‖', insert: '\\|\\| v \\|\\|',     label: 'Norm' },
      { display: '…',   insert: '\\cdots ',             label: 'Cdots' },
      { display: '⋮',   insert: '\\vdots ',             label: 'Vdots' },
    ],
  },
  {
    id: 'greek',
    label: 'Greek',
    symbols: [
      { display: 'α', insert: '\\alpha ' },   { display: 'β', insert: '\\beta ' },
      { display: 'γ', insert: '\\gamma ' },   { display: 'δ', insert: '\\delta ' },
      { display: 'ε', insert: '\\epsilon ' }, { display: 'θ', insert: '\\theta ' },
      { display: 'λ', insert: '\\lambda ' },  { display: 'μ', insert: '\\mu ' },
      { display: 'π', insert: '\\pi ' },      { display: 'ρ', insert: '\\rho ' },
      { display: 'σ', insert: '\\sigma ' },   { display: 'τ', insert: '\\tau ' },
      { display: 'φ', insert: '\\phi ' },     { display: 'ω', insert: '\\omega ' },
      { display: 'Σ', insert: '\\Sigma ' },   { display: 'Π', insert: '\\Pi ' },
      { display: 'Δ', insert: '\\Delta ' },   { display: 'Λ', insert: '\\Lambda ' },
      { display: 'Ω', insert: '\\Omega ' },   { display: 'Γ', insert: '\\Gamma ' },
    ],
  },
  {
    id: 'matrices',
    label: 'Matrices',
    symbols: [
      { display: '2×2',  label: 'Matrix 2×2',  block: true, insert: '\\begin{pmatrix} a & b \\\\ c & d \\end{pmatrix}' },
      { display: '3×3',  label: 'Matrix 3×3',  block: true, insert: '\\begin{pmatrix} a & b & c \\\\ d & e & f \\\\ g & h & i \\end{pmatrix}' },
      { display: '[A|b]',label: 'Augmented',   block: true, insert: '\\left[\\begin{array}{cc|c} a & b & e \\\\ c & d & f \\end{array}\\right]' },
      { display: 'det',  label: 'Determinant', insert: '\\det(A)' },
      { display: 'A⁻¹',  label: 'Inverse',    insert: 'A^{-1}' },
      { display: 'Aᵀ',   label: 'Transpose',  insert: 'A^{T}' },
      { display: 'Iₙ',   label: 'Identity',   insert: 'I_n' },
      { display: 'rref', label: 'RREF',        insert: '\\text{rref}(A)' },
      { display: 'rank', label: 'Rank',        insert: '\\text{rank}(A)' },
    ],
  },
  {
    id: 'sets',
    label: 'Sets & Logic',
    symbols: [
      { display: 'ℝ',  insert: '\\mathbb{R}' },     { display: 'ℝⁿ', insert: '\\mathbb{R}^n ' },
      { display: 'ℤ',  insert: '\\mathbb{Z}' },     { display: '∞',  insert: '\\infty ' },
      { display: '∈',  insert: '\\in ' },            { display: '∉',  insert: '\\notin ' },
      { display: '⊆',  insert: '\\subseteq ' },      { display: '∪',  insert: '\\cup ' },
      { display: '∩',  insert: '\\cap ' },           { display: '∅',  insert: '\\emptyset ' },
      { display: '≠',  insert: '\\neq ' },           { display: '≤',  insert: '\\leq ' },
      { display: '≥',  insert: '\\geq ' },           { display: '≈',  insert: '\\approx ' },
      { display: '→',  insert: '\\rightarrow ' },    { display: '⇒',  insert: '\\Rightarrow ' },
      { display: '↔',  insert: '\\leftrightarrow ' },{ display: '⟺', insert: '\\Leftrightarrow ' },
      { display: '∀',  insert: '\\forall ' },        { display: '∃',  insert: '\\exists ' },
    ],
  },
]

// ─── Unified question editor with side-by-side live preview ──────────────────

const OPTION_LABELS = ['A', 'B', 'C', 'D']

function QuestionEditorContent({
  q, qi, tags, subtopics,
  onQField, onCorrect, onOptionText, onImageChange, onRemoveImage,
  onMarks, onDifficulty, onTopicTag, onSubtopicId, onExplanation,
}: {
  q: NewQuestion; qi: number; tags: string[]; subtopics: Subtopic[]
  onQField:       (field: keyof NewQuestion, val: any) => void
  onCorrect:      (oi: number) => void
  onOptionText:   (oi: number, val: string) => void
  onImageChange:  (file: File | null) => void
  onRemoveImage:  () => void
  onMarks:        (v: number) => void
  onDifficulty:   (v: string) => void
  onTopicTag:     (v: string) => void
  onSubtopicId:   (v: string) => void
  onExplanation:  (v: string) => void
}) {
  const [activeTab,   setActiveTab]   = useState('math')
  const lastFocusRef = useRef<HTMLTextAreaElement | null>(null)
  const questionRef  = useRef<HTMLTextAreaElement>(null)
  const optionRefs   = useRef<(HTMLTextAreaElement | null)[]>([null, null, null, null])
  const imageInputRef = useRef<HTMLInputElement>(null)
  const previewUrl   = q.image
    ? URL.createObjectURL(q.image)
    : q.existing_image_path
      ? `/storage/${q.existing_image_path}`
      : null

  const insertSymbol = useCallback((sym: Sym) => {
    const ta = lastFocusRef.current ?? questionRef.current
    if (!ta) return
    const start = ta.selectionStart ?? 0
    const end   = ta.selectionEnd   ?? 0
    const wrap  = `$${sym.insert}$`

    if (ta === questionRef.current) {
      const next = q.question_text.slice(0, start) + wrap + q.question_text.slice(end)
      onQField('question_text', next)
    } else {
      const oi = optionRefs.current.indexOf(ta)
      if (oi >= 0) {
        const cur = q.options[oi].option_text
        onOptionText(oi, cur.slice(0, start) + wrap + cur.slice(end))
      }
    }
    requestAnimationFrame(() => { ta.focus(); ta.setSelectionRange(start + wrap.length, start + wrap.length) })
  }, [q.question_text, q.options, onQField, onOptionText])

  const tab = Q_SYMBOL_TABS.find(t => t.id === activeTab)!

  return (
    <div className="grid grid-cols-2 gap-5">
      {/* ── LEFT: editor ─────────────────────────────── */}
      <div className="space-y-3 min-w-0">
        {/* Shared symbol picker */}
        <div className="space-y-1">
          <div className="flex gap-1 rounded-lg bg-muted/50 p-1 w-fit">
            {Q_SYMBOL_TABS.map(t => (
              <button key={t.id} type="button" onClick={() => setActiveTab(t.id)}
                className={cn("px-2.5 py-1 rounded-md text-xs font-medium transition-colors",
                  activeTab === t.id ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
                )}>{t.label}</button>
            ))}
          </div>
          <div className="flex flex-wrap gap-1 p-2 rounded-lg border bg-muted/20">
            {tab.symbols.map((sym, i) => (
              <button key={i} type="button" title={sym.label ?? sym.insert} onClick={() => insertSymbol(sym)}
                className="h-7 min-w-[2rem] px-2 rounded-md border bg-background text-xs font-mono hover:bg-primary/10 hover:border-primary/40 transition-colors">
                {sym.display}
              </button>
            ))}
          </div>
          <p className="text-[10px] text-muted-foreground">Use <code>$…$</code> for inline math. Symbols insert into the last focused field.</p>
        </div>

        {/* Question text */}
        <div className="space-y-1">
          <Label className="text-xs">Question Text</Label>
          <textarea
            ref={el => { questionRef.current = el; if (!lastFocusRef.current) lastFocusRef.current = el }}
            value={q.question_text}
            onChange={e => onQField('question_text', e.target.value)}
            onFocus={() => { lastFocusRef.current = questionRef.current }}
            placeholder="Enter question… use $math$ for formulas"
            rows={3}
            className="w-full rounded-md border bg-background px-3 py-2 text-sm font-mono resize-y focus:outline-none focus:ring-2 focus:ring-ring min-h-[72px]"
          />
        </div>

        {/* Figure image */}
        <div className="space-y-1">
          <Label className="text-xs">
            Figure / Image <span className="text-muted-foreground font-normal">(optional)</span>
          </Label>
          <input ref={imageInputRef} type="file" accept="image/*" className="hidden"
            onChange={e => { onImageChange(e.target.files?.[0] ?? null); e.target.value = '' }} />
          {previewUrl ? (
            <div className="flex items-center gap-2 rounded-lg border bg-muted/20 p-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={previewUrl} alt="figure" className="max-h-20 rounded object-contain" />
              <div className="flex flex-col gap-1">
                <button type="button" onClick={() => imageInputRef.current?.click()}
                  className="text-xs text-primary hover:underline">Replace</button>
                <button type="button" onClick={() => { if (q.image) onImageChange(null); else onRemoveImage() }}
                  className="text-xs text-destructive hover:underline">Remove</button>
              </div>
            </div>
          ) : (
            <button type="button" onClick={() => imageInputRef.current?.click()}
              className="flex items-center gap-2 rounded-lg border-2 border-dashed border-border hover:border-primary/40 bg-muted/20 px-3 py-2 text-xs text-muted-foreground transition-colors w-full">
              <ImagePlus className="h-4 w-4 shrink-0" /> Upload figure image
            </button>
          )}
        </div>

        {/* Meta row */}
        <div className="grid grid-cols-3 gap-2">
          <div className="space-y-1">
            <Label className="text-xs">Marks</Label>
            <Input type="number" min="1" required value={q.marks}
              onChange={e => onMarks(Number(e.target.value))} className="h-8 text-sm" />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Difficulty</Label>
            <Select value={q.difficulty_level} onValueChange={onDifficulty}>
              <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
              <SelectContent>
                {['easy', 'medium', 'hard'].map(d => (
                  <SelectItem key={d} value={d} className="capitalize">{d}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <TopicTagSelect value={q.topic_tag} onChange={onTopicTag} tags={tags} compact />
          </div>
        </div>

        {/* Subtopic (for CBF matching) */}
        {subtopics.length > 0 && (
          <div className="space-y-1">
            <Label className="text-xs">Subtopic <span className="text-muted-foreground font-normal">(recommendation matching)</span></Label>
            <Select value={q.subtopic_id || 'none'} onValueChange={v => onSubtopicId(v === 'none' ? '' : v)}>
              <SelectTrigger className="h-8 text-sm"><SelectValue placeholder="None" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                {subtopics.map(s => (
                  <SelectItem key={s.topic_id} value={String(s.topic_id)}>{s.topic_name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Explanation */}
        <div className="space-y-1">
          <Label className="text-xs">Explanation <span className="text-muted-foreground font-normal">(shown on wrong answer)</span></Label>
          <Textarea rows={1} value={q.explanation} onChange={e => onExplanation(e.target.value)}
            placeholder="Brief explanation of the correct answer…" className="text-sm min-h-[48px]" />
        </div>

        {/* Options */}
        <div className="space-y-1.5">
          <Label className="text-xs">Options <span className="text-muted-foreground font-normal">(click ● to mark correct; supports $math$)</span></Label>
          {q.options.map((opt, oi) => (
            <div key={oi} className="flex items-start gap-2">
              <button type="button" onClick={() => onCorrect(oi)}
                className={cn(
                  "mt-1.5 w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors",
                  opt.is_correct ? "border-emerald-500 bg-emerald-500" : "border-muted-foreground hover:border-primary"
                )}>
                {opt.is_correct && <CheckCircle2 className="w-3 h-3 text-white" />}
              </button>
              <div className="flex-1 min-w-0">
                <textarea
                  ref={el => { optionRefs.current[oi] = el }}
                  value={opt.option_text}
                  onChange={e => onOptionText(oi, e.target.value)}
                  onFocus={() => { lastFocusRef.current = optionRefs.current[oi] }}
                  placeholder={`Option ${OPTION_LABELS[oi]}…`}
                  rows={1}
                  className={cn(
                    "w-full rounded-md border bg-background px-3 py-1.5 text-sm font-mono resize-none focus:outline-none focus:ring-2 focus:ring-ring",
                    opt.is_correct && "border-emerald-400 bg-emerald-50 dark:bg-emerald-950/20"
                  )}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── RIGHT: live preview ───────────────────────── */}
      <div className="min-w-0">
        <div className="sticky top-4 rounded-xl border bg-muted/30 p-4 space-y-3">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Live Preview</p>

          {/* Figure */}
          {previewUrl && (
            <div className="flex justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={previewUrl} alt="figure" className="max-h-40 rounded-lg border object-contain" />
            </div>
          )}

          {/* Question text */}
          <div className="text-sm font-semibold leading-snug">
            {q.question_text
              ? <MathText text={q.question_text} />
              : <span className="text-muted-foreground italic font-normal">Question text appears here…</span>
            }
          </div>

          {/* Options */}
          <div className="space-y-1.5 pt-1">
            {q.options.map((opt, oi) => (
              <div key={oi}
                className={cn(
                  "flex items-center gap-2 rounded-lg border px-3 py-2 text-sm",
                  opt.is_correct
                    ? "border-emerald-400 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-300"
                    : "border-border bg-background text-foreground"
                )}>
                <span className={cn(
                  "w-5 h-5 rounded-full border-2 text-[10px] font-bold flex items-center justify-center shrink-0",
                  opt.is_correct ? "border-emerald-500 bg-emerald-500 text-white" : "border-muted-foreground text-muted-foreground"
                )}>{OPTION_LABELS[oi]}</span>
                {opt.option_text
                  ? <MathText text={opt.option_text} />
                  : <span className="text-muted-foreground italic text-xs">Option {OPTION_LABELS[oi]}…</span>
                }
              </div>
            ))}
          </div>

          {/* Explanation */}
          {q.explanation && (
            <div className="rounded-md bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 px-3 py-2 text-xs text-amber-700 dark:text-amber-300">
              <span className="font-semibold">Explanation: </span>{q.explanation}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function TopicTagSelect({ value, onChange, tags, compact }: { value: string; onChange: (v: string) => void; tags: string[]; compact?: boolean }) {
  const [search, setSearch] = useState('')
  const [open, setOpen]     = useState(false)

  const filtered = tags.filter(t =>
    !search || t.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="relative space-y-1">
      <Label className={compact ? "text-xs" : undefined}>Topic Tag</Label>
      <input
        value={value}
        onChange={e => { onChange(e.target.value); setSearch(e.target.value); setOpen(true) }}
        onFocus={() => { setSearch(''); setOpen(true) }}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        placeholder="Search or select topic tag..."
        className="w-full h-9 px-3 text-sm rounded-md border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
      />
      {open && filtered.length > 0 && (
        <div className="absolute z-50 w-full mt-0.5 bg-popover border rounded-md shadow-lg max-h-48 overflow-y-auto">
          {filtered.map(tag => (
            <button
              key={tag}
              type="button"
              className={cn(
                'w-full text-left px-3 py-1.5 text-sm hover:bg-accent transition-colors',
                value === tag && 'bg-accent font-medium'
              )}
              onClick={() => { onChange(tag); setSearch(''); setOpen(false) }}
            >
              {tag}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Badge colours ───────────────────────────────────────────────────────────

const quizTypeColor: Record<string, string> = {
  formative:  'bg-blue-500/10   text-blue-600   border-blue-300',
  summative:  'bg-purple-500/10 text-purple-600 border-purple-300',
  diagnostic: 'bg-amber-500/10  text-amber-600  border-amber-300',
  remedial:   'bg-rose-500/10   text-rose-600   border-rose-300',
}

// ─── Component ───────────────────────────────────────────────────────────────

export function QuizzesPanel() {
  const [quizzes,     setQuizzes]     = useState<Quiz[]>([])
  const [topics,      setTopics]      = useState<Topic[]>([])
  const [classes,     setClasses]     = useState<ClassRoom[]>([])
  const [tags,        setTags]        = useState<string[]>([])
  const [subtopics,   setSubtopics]   = useState<Subtopic[]>([])
  const [loading,     setLoading]     = useState(true)
  const [view,        setView]        = useState<'list' | 'create'>('list')
  const [form,        setForm]        = useState<NewQuiz>(blankQuiz())
  const [expanded,    setExpanded]    = useState<Record<number, boolean>>({})
  const [saving,      setSaving]      = useState(false)
  const [error,       setError]       = useState<string | null>(null)
  const [editId,      setEditId]      = useState<number | null>(null)
  const [hasAttempts, setHasAttempts] = useState(false)
  const [loadingEdit, setLoadingEdit] = useState(false)

  useEffect(() => {
    Promise.all([
      lecturerApi.quizzes(),
      lecturerApi.topics(),
      lecturerApi.classes(),
      lecturerApi.questionTags(),
    ])
      .then(([qz, tops, cls, tgs]) => { setQuizzes(qz); setTopics(tops); setClasses(cls); setTags(tgs) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (!form.topic_id) { setSubtopics([]); return }
    lecturerApi.topicSubtopics(Number(form.topic_id)).then(setSubtopics).catch(() => setSubtopics([]))
  }, [form.topic_id])

  // ── Form helpers ──────────────────────────────────────────────────────────

  const setQuizField = (field: keyof Omit<NewQuiz, 'questions'>, val: any) =>
    setForm(f => ({ ...f, [field]: val }))

  const setQField = (qi: number, field: keyof NewQuestion, val: any) =>
    setForm(f => {
      const qs = [...f.questions]
      qs[qi]   = { ...qs[qi], [field]: val }
      return { ...f, questions: qs }
    })

  const setCorrect = (qi: number, oi: number) =>
    setForm(f => {
      const qs   = [...f.questions]
      qs[qi]     = { ...qs[qi], options: qs[qi].options.map((o, i) => ({ ...o, is_correct: i === oi })) }
      return { ...f, questions: qs }
    })

  const setOptionText = (qi: number, oi: number, val: string) =>
    setForm(f => {
      const qs   = [...f.questions]
      const opts = [...qs[qi].options]
      opts[oi]   = { ...opts[oi], option_text: val }
      qs[qi]     = { ...qs[qi], options: opts }
      return { ...f, questions: qs }
    })

  const addQuestion    = () => setForm(f => ({ ...f, questions: [...f.questions, blankQuestion()] }))
  const removeQuestion = (qi: number) => setForm(f => ({ ...f, questions: f.questions.filter((_, i) => i !== qi) }))
  const toggleExpand   = (qi: number) => setExpanded(e => ({ ...e, [qi]: e[qi] === false }))

  const cancelCreate = () => {
    setView('list'); setForm(blankQuiz()); setExpanded({})
    setError(null); setEditId(null); setHasAttempts(false)
  }

  const handleEdit = async (quiz: Quiz) => {
    setLoadingEdit(true)
    try {
      const full = await lecturerApi.showQuiz(quiz.quiz_id)
      setEditId(quiz.quiz_id)
      setHasAttempts(false)
      setForm({
        topic_id:           String(full.topic_id),
        class_id:           full.class_id ? String(full.class_id) : 'none',
        title:              full.title,
        description:        full.description || '',
        quiz_type:          full.quiz_type,
        passing_threshold:  full.passing_threshold,
        time_limit_minutes: full.time_limit_minutes || 0,
        questions: (full.questions ?? []).map(q => ({
          question_id:          q.question_id,
          question_text:        q.question_text,
          marks:                q.marks,
          difficulty_level:     q.difficulty_level,
          topic_tag:            q.topic_tag || '',
          subtopic_id:          q.subtopic_id || '',
          explanation:          q.explanation || '',
          options:              (q.options as any[]).map(o => ({
            option_text: o.option_text,
            is_correct:  !!o.is_correct,
          })),
          image:                null,
          existing_image_path:  q.image_path ?? null,
          remove_image:         false,
        })),
      })
      setExpanded({})
      setView('create')
    } catch {
      setError('Failed to load quiz for editing.')
    } finally {
      setLoadingEdit(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    for (let i = 0; i < form.questions.length; i++) {
      if (!form.questions[i].options.some(o => o.is_correct)) {
        setError(`Question ${i + 1}: mark one correct answer.`)
        return
      }
    }

    setSaving(true)
    try {
      const basePayload = {
        topic_id:           Number(form.topic_id),
        class_id:           (form.class_id && form.class_id !== 'none') ? Number(form.class_id) : undefined,
        title:              form.title,
        description:        form.description || undefined,
        quiz_type:          form.quiz_type,
        passing_threshold:  form.passing_threshold,
        time_limit_minutes: form.time_limit_minutes || undefined,
        questions: form.questions.map(q => ({
          question_id:      q.question_id,
          question_text:    q.question_text,
          marks:            q.marks,
          difficulty_level: q.difficulty_level,
          topic_tag:        q.topic_tag    || undefined,
          subtopic_id:      q.subtopic_id  || undefined,
          explanation:      q.explanation  || undefined,
          options:          q.options.filter(o => o.option_text.trim()),
        })),
      }

      let savedQuiz: any
      if (editId) {
        const updated = await lecturerApi.updateQuiz(editId, basePayload as UpdateQuizPayload)
        setHasAttempts(updated.has_attempts)
        savedQuiz = updated
        setQuizzes(prev => prev.map(q => q.quiz_id === editId ? updated : q))
      } else {
        const created = await lecturerApi.createQuiz(basePayload as CreateQuizPayload)
        savedQuiz = created
        setQuizzes(prev => [created, ...prev])
      }

      // Handle image removals + new uploads (best-effort)
      await Promise.allSettled([
        ...form.questions.map(q => {
          if (q.question_id && q.remove_image) {
            return lecturerApi.deleteQuestionFigure(q.question_id)
          }
          return Promise.resolve()
        }),
        ...form.questions.map((q, i) => {
          if (!q.image) return Promise.resolve()
          const qId = q.question_id ?? (savedQuiz as any).questions?.[i]?.question_id
          if (!qId) return Promise.resolve()
          return lecturerApi.uploadQuestionFigure(qId, q.image)
        }),
      ])

      // Refresh tags after save so new topic_tags become available
      lecturerApi.questionTags().then(setTags).catch(() => {})

      cancelCreate()
    } catch (err: any) {
      setError(err?.data?.message || (editId ? 'Failed to update quiz.' : 'Failed to create quiz.'))
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: number) => {
    await lecturerApi.deleteQuiz(id).catch(() => {})
    setQuizzes(prev => prev.filter(q => q.quiz_id !== id))
  }

  // ── Loading ───────────────────────────────────────────────────────────────

  if (loading) return (
    <div className="space-y-3">
      <Skeleton className="h-8 w-48" />
      {[1, 2, 3].map(i => <Skeleton key={i} className="h-20 w-full" />)}
    </div>
  )

  // ── Create view ───────────────────────────────────────────────────────────

  if (view === 'create') return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{editId ? 'Edit Quiz' : 'Create Quiz'}</h1>
          {editId && hasAttempts && (
            <p className="flex items-center gap-1.5 text-sm text-amber-600 dark:text-amber-400 mt-1">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              This quiz has student attempts. Adding and removing questions is disabled.
            </p>
          )}
        </div>
        <Button variant="outline" onClick={cancelCreate}>Cancel</Button>
      </div>

      {error && <p className="text-destructive text-sm">{error}</p>}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Quiz details */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Quiz Details</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2 space-y-1.5">
              <Label>Title</Label>
              <Input
                required value={form.title}
                onChange={e => setQuizField('title', e.target.value)}
                placeholder="Chapter 1: Introduction to Matrices"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Topic</Label>
              <Select required value={form.topic_id} onValueChange={v => setQuizField('topic_id', v)}>
                <SelectTrigger><SelectValue placeholder="Select topic" /></SelectTrigger>
                <SelectContent>
                  {topics.map(t => (
                    <SelectItem key={t.topic_id} value={String(t.topic_id)}>{t.topic_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Assign to Class <span className="text-muted-foreground font-normal text-xs">(optional)</span></Label>
              <Select value={form.class_id} onValueChange={v => setQuizField('class_id', v)}>
                <SelectTrigger><SelectValue placeholder="All classes / unassigned" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">All classes / unassigned</SelectItem>
                  {classes.map(c => (
                    <SelectItem key={c.class_id} value={String(c.class_id)}>{c.class_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Quiz Type</Label>
              <Select value={form.quiz_type} onValueChange={v => setQuizField('quiz_type', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {['formative', 'summative', 'diagnostic', 'remedial'].map(t => (
                    <SelectItem key={t} value={t} className="capitalize">{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Passing Threshold (%)</Label>
              <Input
                type="number" min="0" max="100" required
                value={form.passing_threshold}
                onChange={e => setQuizField('passing_threshold', Number(e.target.value))}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Time Limit (minutes, optional)</Label>
              <Input
                type="number" min="1"
                value={form.time_limit_minutes || ''}
                onChange={e => setQuizField('time_limit_minutes', e.target.value ? Number(e.target.value) : 0)}
                placeholder="30"
              />
            </div>
          </CardContent>
        </Card>

        {/* Questions */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">
              Questions <span className="text-muted-foreground font-normal text-sm">({form.questions.length})</span>
            </h2>
            {!(editId && hasAttempts) && (
              <Button type="button" variant="outline" size="sm" onClick={addQuestion} className="gap-2">
                <Plus className="w-4 h-4" /> Add Question
              </Button>
            )}
          </div>

          {form.questions.map((q, qi) => {
            const isOpen = expanded[qi] !== false
            return (
              <Card key={qi}>
                {/* Question header: click to collapse */}
                <CardHeader
                  className="pb-2 cursor-pointer select-none"
                  onClick={() => toggleExpand(qi)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 min-w-0">
                      <Badge variant="outline" className="text-primary border-primary/30 flex-shrink-0">
                        Q{qi + 1}
                      </Badge>
                      <span className="text-sm text-muted-foreground truncate">
                        {q.question_text || 'New question…'}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      {form.questions.length > 1 && !(editId && hasAttempts) && (
                        <Button
                          type="button" variant="ghost" size="sm"
                          className="text-destructive h-7 w-7 p-0"
                          onClick={e => { e.stopPropagation(); removeQuestion(qi) }}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      )}
                      {isOpen
                        ? <ChevronUp className="w-4 h-4 text-muted-foreground" />
                        : <ChevronDown className="w-4 h-4 text-muted-foreground" />
                      }
                    </div>
                  </div>
                </CardHeader>

                {isOpen && (
                  <CardContent className="pt-0">
                    <QuestionEditorContent
                      q={q} qi={qi} tags={tags} subtopics={subtopics}
                      onQField={(field, val) => setQField(qi, field, val)}
                      onCorrect={oi => setCorrect(qi, oi)}
                      onOptionText={(oi, val) => setOptionText(qi, oi, val)}
                      onImageChange={file => setQField(qi, 'image', file)}
                      onRemoveImage={() => setForm(f => {
                        const qs = [...f.questions]
                        qs[qi] = { ...qs[qi], image: null, existing_image_path: null, remove_image: true }
                        return { ...f, questions: qs }
                      })}
                      onMarks={v => setQField(qi, 'marks', v)}
                      onDifficulty={v => setQField(qi, 'difficulty_level', v)}
                      onTopicTag={v => setQField(qi, 'topic_tag', v)}
                      onSubtopicId={v => setQField(qi, 'subtopic_id', v)}
                      onExplanation={v => setQField(qi, 'explanation', v)}
                    />
                  </CardContent>
                )}
              </Card>
            )
          })}
        </div>

        <div className="flex justify-end gap-3 pb-6">
          <Button type="button" variant="outline" onClick={cancelCreate}>Cancel</Button>
          <Button type="submit" disabled={saving} className="px-8">
            {saving
              ? (editId ? 'Saving…' : 'Creating…')
              : editId
                ? `Save Changes (${form.questions.length} Q)`
                : `Create Quiz (${form.questions.length} Q)`
            }
          </Button>
        </div>
      </form>
    </div>
  )

  // ── List view ─────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Quizzes</h1>
          <p className="text-muted-foreground text-sm">
            {quizzes.length} quiz{quizzes.length !== 1 ? 'zes' : ''} created
          </p>
        </div>
        <Button onClick={() => setView('create')} className="gap-2">
          <Plus className="w-4 h-4" /> Create Quiz
        </Button>
      </div>

      {quizzes.length === 0 ? (
        <Card>
          <CardContent className="pt-8 pb-8 text-center text-muted-foreground">
            No quizzes yet. Click &quot;Create Quiz&quot; to build your first assessment.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {quizzes.map(quiz => (
            <Card key={quiz.quiz_id} className="hover:border-primary/30 transition-colors">
              <CardContent className="pt-4 pb-4">
                <div className="flex items-start gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="font-semibold text-foreground">{quiz.title}</span>
                      <Badge variant="outline" className={quizTypeColor[quiz.quiz_type] ?? ''}>
                        {quiz.quiz_type}
                      </Badge>
                      {quiz.topic && (
                        <Badge variant="outline" className="text-xs text-primary border-primary/30">
                          {quiz.topic.topic_name}
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span>{quiz.questions_count ?? 0} questions</span>
                      <span>{quiz.total_marks} marks</span>
                      <span>Pass: {quiz.passing_threshold}%</span>
                      {quiz.time_limit_minutes && <span>{quiz.time_limit_minutes} min</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <Button
                      variant="ghost" size="sm"
                      className="text-muted-foreground hover:text-foreground h-8 w-8 p-0"
                      disabled={loadingEdit}
                      onClick={() => handleEdit(quiz)}
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost" size="sm"
                      className="text-destructive hover:text-destructive h-8 w-8 p-0"
                      onClick={() => handleDelete(quiz.quiz_id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
