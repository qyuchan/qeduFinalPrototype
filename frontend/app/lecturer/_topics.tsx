"use client"

import { useEffect, useState, useRef } from "react"
import { lecturerApi, type Topic, type TopicPayload, type Subtopic } from "@/lib/api/lecturer"
import { MathText } from "@/components/math-text"
import { RichContent } from "@/components/rich-content"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { Plus, Pencil, Trash2, ArrowLeft, Clock, BookOpen, ChevronDown, Delete, X, Loader2, Upload, FileText, Presentation, Trash } from "lucide-react"
import { cn } from "@/lib/utils"

// ── Types ─────────────────────────────────────────────────────────────────────

type View = { kind: 'list' } | { kind: 'form'; topic?: Topic }

interface SubtopicDraft {
  localId: string
  topic_id?: number   // set for DB-persisted subtopics
  topic_name: string
  description: string
  syllabus: string
  slide_file_path: string | null  // DB-stored path
  pendingSlide: File | null       // file chosen but not yet uploaded
  sequence_order: number
  showContent: boolean
  showSlide: boolean
}

// ── Symbol palette data ───────────────────────────────────────────────────────

type Sym = { display: string; insert: string; label?: string; block?: boolean; raw?: boolean }

const SYMBOL_TABS: { id: string; label: string; symbols: Sym[] }[] = [
  {
    id: 'math',
    label: 'Math',
    symbols: [
      { display: '½',   insert: '\\frac{}{}',          label: 'Fraction',    block: false },
      { display: '√x',  insert: '\\sqrt{}',             label: 'Square root', block: false },
      { display: 'xⁿ',  insert: '^{}',                  label: 'Power',       block: false },
      { display: 'xₙ',  insert: '_{} ',                 label: 'Subscript',   block: false },
      { display: '∑',   insert: '\\sum_{i=1}^{n} ',    label: 'Sum',         block: false },
      { display: '∏',   insert: '\\prod_{i=1}^{n} ',   label: 'Product',     block: false },
      { display: '∫',   insert: '\\int_{}^{} ',         label: 'Integral',    block: false },
      { display: '±',   insert: '\\pm ',                label: '± ',          block: false },
      { display: '·',   insert: '\\cdot ',              label: 'Dot mult',    block: false },
      { display: '×',   insert: '\\times ',             label: 'Times',       block: false },
      { display: '÷',   insert: '\\div ',               label: 'Divide',      block: false },
      { display: '‖v‖', insert: '\\|\\| v \\|\\|',     label: 'Norm',        block: false },
      { display: '…',   insert: '\\cdots ',             label: 'Cdots',       block: false },
      { display: '⋮',   insert: '\\vdots ',             label: 'Vdots',       block: false },
    ],
  },
  {
    id: 'greek',
    label: 'Greek',
    symbols: [
      { display: 'α', insert: '\\alpha ' },
      { display: 'β', insert: '\\beta ' },
      { display: 'γ', insert: '\\gamma ' },
      { display: 'δ', insert: '\\delta ' },
      { display: 'ε', insert: '\\epsilon ' },
      { display: 'θ', insert: '\\theta ' },
      { display: 'λ', insert: '\\lambda ' },
      { display: 'μ', insert: '\\mu ' },
      { display: 'π', insert: '\\pi ' },
      { display: 'ρ', insert: '\\rho ' },
      { display: 'σ', insert: '\\sigma ' },
      { display: 'τ', insert: '\\tau ' },
      { display: 'φ', insert: '\\phi ' },
      { display: 'ω', insert: '\\omega ' },
      { display: 'Σ', insert: '\\Sigma ' },
      { display: 'Π', insert: '\\Pi ' },
      { display: 'Δ', insert: '\\Delta ' },
      { display: 'Λ', insert: '\\Lambda ' },
      { display: 'Ω', insert: '\\Omega ' },
      { display: 'Γ', insert: '\\Gamma ' },
    ],
  },
  {
    id: 'matrices',
    label: 'Matrices',
    symbols: [
      {
        display: '2×2', label: 'Matrix 2×2', block: true,
        insert: '\\begin{pmatrix} a & b \\\\ c & d \\end{pmatrix}',
      },
      {
        display: '3×3', label: 'Matrix 3×3', block: true,
        insert: '\\begin{pmatrix} a & b & c \\\\ d & e & f \\\\ g & h & i \\end{pmatrix}',
      },
      {
        display: '[A|b]', label: 'Augmented', block: true,
        insert: '\\left[\\begin{array}{cc|c} a & b & e \\\\ c & d & f \\end{array}\\right]',
      },
      { display: 'det', label: 'Determinant', block: false, insert: '\\det(A)' },
      { display: 'A⁻¹', label: 'Inverse',    block: false, insert: 'A^{-1}' },
      { display: 'Aᵀ',  label: 'Transpose',  block: false, insert: 'A^{T}' },
      { display: 'Iₙ',  label: 'Identity',   block: false, insert: 'I_n' },
      { display: 'rref', label: 'RREF',      block: false, insert: '\\text{rref}(A)' },
      { display: 'rank', label: 'Rank',      block: false, insert: '\\text{rank}(A)' },
    ],
  },
  {
    id: 'sections',
    label: 'Sections',
    symbols: [
      {
        display: 'Def',  label: 'Definition', raw: true,
        insert: '[def:Title]\nContent here. Use $math$ for inline or $$math$$ for block.\n[/def]',
      },
      {
        display: 'Ex',   label: 'Example', raw: true,
        insert: '[example:Title]\nExample content here.\n[/example]',
      },
      {
        display: 'Thm',  label: 'Theorem', raw: true,
        insert: '[theorem:Title]\nTheorem statement here.\n[/theorem]',
      },
      {
        display: 'Note', label: 'Note', raw: true,
        insert: '[note]\nNote content here.\n[/note]',
      },
      {
        display: 'Rule', label: 'Rule/Formula', raw: true,
        insert: '[rule]\nFormula or rule here.\n[/rule]',
      },
      {
        display: 'Step', label: 'Step', raw: true,
        insert: '[step:1:Label]\nStep content here.\n[/step]',
      },
      {
        display: 'Mtrx', label: 'Matrix', raw: true,
        insert: '[matrix]a, b; c, d[/matrix]',
      },
      {
        display: 'Aug', label: 'Augmented', raw: true,
        insert: '[aug]a, b; c, d | e, f[/aug]',
      },
    ],
  },
  {
    id: 'sets',
    label: 'Sets & Logic',
    symbols: [
      { display: 'ℝ',  insert: '\\mathbb{R}' },
      { display: 'ℝⁿ', insert: '\\mathbb{R}^n ' },
      { display: 'ℤ',  insert: '\\mathbb{Z}' },
      { display: '∞',  insert: '\\infty ' },
      { display: '∈',  insert: '\\in ' },
      { display: '∉',  insert: '\\notin ' },
      { display: '⊆',  insert: '\\subseteq ' },
      { display: '∪',  insert: '\\cup ' },
      { display: '∩',  insert: '\\cap ' },
      { display: '∅',  insert: '\\emptyset ' },
      { display: '≠',  insert: '\\neq ' },
      { display: '≤',  insert: '\\leq ' },
      { display: '≥',  insert: '\\geq ' },
      { display: '≈',  insert: '\\approx ' },
      { display: '→',  insert: '\\rightarrow ' },
      { display: '⇒',  insert: '\\Rightarrow ' },
      { display: '↔',  insert: '\\leftrightarrow ' },
      { display: '⟺', insert: '\\Leftrightarrow ' },
      { display: '∀',  insert: '\\forall ' },
      { display: '∃',  insert: '\\exists ' },
    ],
  },
]

// ── Syllabus calculator editor ────────────────────────────────────────────────

function SyllabusEditor({ value, onChange, compact = false }: {
  value: string
  onChange: (v: string) => void
  compact?: boolean
}) {
  const [activeTab, setActiveTab] = useState('math')
  const taRef = useRef<HTMLTextAreaElement>(null)

  const insertSym = (sym: Sym) => {
    const ta = taRef.current
    if (!ta) return
    const start = ta.selectionStart
    const end   = ta.selectionEnd

    if (sym.raw) {
      // Section block: insert as-is, select "Title" so lecturer can type immediately
      const text = '\n' + sym.insert + '\n'
      const next = value.slice(0, start) + text + value.slice(end)
      onChange(next)
      const titleIdx = text.indexOf('Title')
      requestAnimationFrame(() => {
        if (titleIdx >= 0) {
          ta.selectionStart = start + titleIdx
          ta.selectionEnd   = start + titleIdx + 5  // select "Title"
        } else {
          ta.selectionStart = ta.selectionEnd = start + text.length
        }
        ta.focus()
      })
      return
    }

    const wrapped = sym.block ? `$$${sym.insert}$$` : `$${sym.insert}$`
    const next = value.slice(0, start) + wrapped + value.slice(end)
    onChange(next)
    const innerCursor = wrapped.indexOf('{}')
    const cursorPos = innerCursor >= 0 ? start + innerCursor + 1 : start + wrapped.length
    requestAnimationFrame(() => {
      ta.selectionStart = ta.selectionEnd = cursorPos
      ta.focus()
    })
  }

  const insertNewline = () => {
    const ta = taRef.current
    if (!ta) return
    const start = ta.selectionStart
    const next  = value.slice(0, start) + '\n' + value.slice(start)
    onChange(next)
    requestAnimationFrame(() => {
      ta.selectionStart = ta.selectionEnd = start + 1
      ta.focus()
    })
  }

  const backspace = () => {
    const ta = taRef.current
    if (!ta) return
    const start = ta.selectionStart
    const end   = ta.selectionEnd
    if (start === end && start === 0) return
    const next = start !== end
      ? value.slice(0, start) + value.slice(end)
      : value.slice(0, start - 1) + value.slice(start)
    onChange(next)
    const newPos = start !== end ? start : Math.max(0, start - 1)
    requestAnimationFrame(() => {
      ta.selectionStart = ta.selectionEnd = newPos
      ta.focus()
    })
  }

  const currentTab = SYMBOL_TABS.find(t => t.id === activeTab)!

  return (
    <div className="space-y-2">
      <div className="rounded-xl border bg-muted/40 overflow-hidden">
        <div className="flex border-b bg-muted">
          {SYMBOL_TABS.map(tab => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex-1 py-1.5 text-xs font-medium transition-colors",
                activeTab === tab.id
                  ? "bg-background border-b-2 border-primary text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div className={cn("p-2 grid gap-1", activeTab === 'sections' ? "grid-cols-4" : "grid-cols-7")}>
          {currentTab.symbols.map((sym, i) => (
            <button
              key={i}
              type="button"
              onClick={() => insertSym(sym)}
              title={sym.label ?? sym.display}
              className={cn(
                "flex flex-col items-center justify-center rounded-lg border bg-background",
                "text-sm font-medium transition-all hover:bg-primary hover:text-primary-foreground hover:border-primary hover:scale-105 active:scale-95",
                activeTab === 'sections' ? "h-14 gap-1 shadow-sm px-2" : "h-10 gap-0.5 shadow-sm"
              )}
            >
              <span className="text-sm leading-none">{sym.display}</span>
              {sym.label && (
                <span className="text-[8px] text-muted-foreground leading-none truncate w-full text-center px-0.5">
                  {sym.label}
                </span>
              )}
            </button>
          ))}
          {activeTab !== 'sections' && <>
            <button
              type="button"
              onClick={insertNewline}
              title="New line"
              className="flex flex-col items-center justify-center rounded-lg border bg-background h-10 gap-0.5 shadow-sm text-sm font-medium transition-all hover:bg-accent hover:scale-105 active:scale-95"
            >
              <span className="text-base leading-none">↵</span>
              <span className="text-[8px] text-muted-foreground">New line</span>
            </button>
            <button
              type="button"
              onClick={backspace}
              title="Backspace"
              className="flex flex-col items-center justify-center rounded-lg border bg-background h-10 gap-0.5 shadow-sm text-sm font-medium transition-all hover:bg-destructive hover:text-destructive-foreground hover:border-destructive hover:scale-105 active:scale-95"
            >
              <Delete className="h-3.5 w-3.5" />
              <span className="text-[8px] text-muted-foreground">Delete</span>
            </button>
          </>}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">Editor</p>
          <textarea
            ref={taRef}
            value={value}
            onChange={e => onChange(e.target.value)}
            placeholder="Type text or click symbols above to insert math…"
            className={cn(
              "w-full rounded-md border bg-background px-3 py-2 text-sm font-mono resize-y focus:outline-none focus:ring-2 focus:ring-ring",
              compact ? "min-h-[300px]" : "min-h-[400px]"
            )}
          />
        </div>
        <div className="space-y-1">
          <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">Live Preview</p>
          <div className={cn(
            "rounded-md border bg-card px-3 py-2 text-sm overflow-y-auto",
            compact ? "min-h-[300px]" : "min-h-[400px]",
            !value && "flex items-center justify-center"
          )}>
            {value
              ? <RichContent text={value} />
              : <span className="text-muted-foreground italic text-xs">Preview appears here.</span>
            }
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Difficulty pill buttons ───────────────────────────────────────────────────

const DIFF_OPTS = [
  { value: 'basic',        label: 'Basic',        active: 'bg-emerald-500/15 border-emerald-500 text-emerald-700 dark:text-emerald-400' },
  { value: 'intermediate', label: 'Intermediate', active: 'bg-amber-500/15   border-amber-500   text-amber-700   dark:text-amber-400' },
  { value: 'advanced',     label: 'Advanced',     active: 'bg-red-500/15     border-red-500     text-red-700     dark:text-red-400' },
]

function DifficultyPills({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex gap-2 flex-wrap">
      {DIFF_OPTS.map(o => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          className={cn(
            "px-3 py-1 rounded-full text-sm border-2 font-medium transition-all",
            value === o.value ? o.active : "border-border text-muted-foreground hover:border-muted-foreground/60"
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

// ── Form section card (Google-Forms style) ────────────────────────────────────

function FormSection({
  accent = "from-violet-500 to-indigo-500",
  children,
}: {
  accent?: string
  children: React.ReactNode
}) {
  return (
    <div className="relative rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
      <div className={cn("absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b", accent)} />
      <div className="pl-6 pr-5 py-5">{children}</div>
    </div>
  )
}

// ── Inline subtopic card ──────────────────────────────────────────────────────

function SlideFileName(name: string) {
  return name.length > 40 ? name.slice(0, 37) + '…' : name
}

function SubtopicDraftCard({
  draft,
  parentOrder,
  onUpdate,
  onRemove,
  parentTopicId,
}: {
  draft: SubtopicDraft
  parentOrder: number
  onUpdate: (d: SubtopicDraft) => void
  onRemove: (permanent: boolean) => void
  parentTopicId?: number
}) {
  const update = (partial: Partial<SubtopicDraft>) => onUpdate({ ...draft, ...partial })
  const [removingSlide,    setRemovingSlide]    = useState(false)
  const [confirmRemove,    setConfirmRemove]    = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const currentFileName = draft.pendingSlide
    ? draft.pendingSlide.name
    : draft.slide_file_path
      ? draft.slide_file_path.split('/').pop() ?? draft.slide_file_path
      : null

  const isPdf = currentFileName?.toLowerCase().endsWith('.pdf')

  const handleRemoveSlide = async () => {
    if (draft.pendingSlide) {
      update({ pendingSlide: null })
      return
    }
    if (draft.topic_id && parentTopicId && draft.slide_file_path) {
      setRemovingSlide(true)
      try {
        await lecturerApi.deleteSubtopicSlide(parentTopicId, draft.topic_id)
        update({ slide_file_path: null })
      } catch { /* ignore */ }
      finally { setRemovingSlide(false) }
    }
  }

  return (
    <div className="relative rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
      {/* Subtopic accent - blue-ish */}
      <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b from-sky-400 to-blue-500" />

      <div className="pl-6 pr-4 py-4 space-y-3">
        {/* Row 1: number + title input + delete */}
        <div className="flex items-center gap-3">
          <span className="shrink-0 w-9 h-9 rounded-full bg-sky-500/10 text-sky-600 dark:text-sky-400 text-xs font-bold flex items-center justify-center border border-sky-400/30">
            {parentOrder}.{draft.sequence_order}
          </span>

          <input
            type="text"
            value={draft.topic_name}
            onChange={e => update({ topic_name: e.target.value })}
            placeholder={`Subtopic ${parentOrder}.${draft.sequence_order} title…`}
            className="flex-1 text-base font-semibold bg-transparent border-0 border-b border-transparent focus:border-primary focus:outline-none py-1 placeholder:text-muted-foreground/40 placeholder:font-normal"
          />

          <button
            type="button"
            onClick={() => draft.topic_id ? setConfirmRemove(v => !v) : onRemove(false)}
            className="shrink-0 h-8 w-8 rounded-full flex items-center justify-center text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
            title="Remove subtopic"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {confirmRemove && draft.topic_id && (
          <div className="ml-12 rounded-xl border border-destructive/30 bg-destructive/5 p-3 space-y-2">
            <p className="text-xs font-medium text-destructive">How do you want to remove this subtopic?</p>
            <div className="flex gap-2 flex-wrap">
              <button type="button" onClick={() => { setConfirmRemove(false); onRemove(false) }}
                className="flex items-center gap-1.5 px-3 py-1 rounded-lg border text-xs font-medium hover:bg-muted transition-colors">
                <Clock className="h-3 w-3" /> Hide from students
              </button>
              <button type="button" onClick={() => { setConfirmRemove(false); onRemove(true) }}
                className="flex items-center gap-1.5 px-3 py-1 rounded-lg border border-destructive/40 text-destructive text-xs font-medium hover:bg-destructive/10 transition-colors">
                <Trash2 className="h-3 w-3" /> Permanently delete
              </button>
              <button type="button" onClick={() => setConfirmRemove(false)}
                className="px-3 py-1 rounded-lg text-xs font-medium text-muted-foreground hover:bg-muted transition-colors">
                Cancel
              </button>
            </div>
            <p className="text-[10px] text-muted-foreground">Permanent delete cannot be undone.</p>
          </div>
        )}

        {/* Row 2: description */}
        <div className="ml-12">
          <input
            type="text"
            value={draft.description}
            onChange={e => update({ description: e.target.value })}
            placeholder="Short description (optional)"
            className="w-full text-sm bg-transparent border-0 border-b border-transparent focus:border-primary focus:outline-none py-1 text-muted-foreground placeholder:text-muted-foreground/40"
          />
        </div>

        {/* Row 3: action toggles */}
        <div className="ml-12 flex flex-wrap gap-4">
          <button
            type="button"
            onClick={() => update({ showContent: !draft.showContent })}
            className="flex items-center gap-1.5 text-xs text-primary hover:underline font-medium"
          >
            <BookOpen className="h-3 w-3" />
            {draft.showContent ? 'Hide content editor' : 'Add content & math formulas'}
            <ChevronDown className={cn("h-3 w-3 transition-transform", draft.showContent && "rotate-180")} />
          </button>

          <button
            type="button"
            onClick={() => update({ showSlide: !draft.showSlide })}
            className="flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400 hover:underline font-medium"
          >
            <Upload className="h-3 w-3" />
            {draft.showSlide ? 'Hide slide upload' : 'Upload slides (PDF / PPTX)'}
            <ChevronDown className={cn("h-3 w-3 transition-transform", draft.showSlide && "rotate-180")} />
          </button>
        </div>

        {/* Content editor */}
        {draft.showContent && (
          <div className="ml-12">
            <SyllabusEditor
              value={draft.syllabus}
              onChange={v => update({ syllabus: v })}
            />
          </div>
        )}

        {/* Slide upload section */}
        {draft.showSlide && (
          <div className="ml-12 mt-1">
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.pptx,.ppt"
              className="hidden"
              onChange={e => {
                const file = e.target.files?.[0] ?? null
                if (file) update({ pendingSlide: file })
                e.target.value = ''
              }}
            />

            {currentFileName ? (
              <div className="flex items-center gap-3 rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30 px-4 py-3">
                {isPdf
                  ? <FileText className="h-5 w-5 text-red-500 shrink-0" />
                  : <Presentation className="h-5 w-5 text-orange-500 shrink-0" />
                }
                <span className="flex-1 text-sm font-medium truncate">{currentFileName}</span>
                {draft.pendingSlide && (
                  <span className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold uppercase tracking-wide shrink-0">
                    Pending save
                  </span>
                )}
                <button
                  type="button"
                  onClick={handleRemoveSlide}
                  disabled={removingSlide}
                  className="shrink-0 h-7 w-7 rounded-full flex items-center justify-center text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                  title="Remove slide"
                >
                  {removingSlide ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash className="h-3.5 w-3.5" />}
                </button>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="shrink-0 text-xs text-primary hover:underline"
                >
                  Replace
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2 rounded-xl border-2 border-dashed border-amber-300 dark:border-amber-700 bg-amber-50/50 dark:bg-amber-950/20 px-5 py-4 text-sm text-amber-700 dark:text-amber-300 hover:border-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40 transition-colors w-full"
              >
                <Upload className="h-4 w-4" />
                Click to upload PDF or PPTX slides
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// ── Google-Forms style topic form ─────────────────────────────────────────────

function TopicForm({
  initial,
  nextOrder,
  onSaved,
  onBack,
}: {
  initial?: Topic
  nextOrder: number
  onSaved: (t: Topic) => void
  onBack: () => void
}) {
  const isEdit = !!initial

  // Topic fields
  const [name,       setName]       = useState(initial?.topic_name      ?? '')
  const [desc,       setDesc]       = useState(initial?.description      ?? '')
  const [syllabus,   setSyllabus]   = useState(initial?.syllabus         ?? '')
  const [difficulty, setDifficulty] = useState(initial?.difficulty_level ?? 'basic')
  const [order,      setOrder]      = useState(initial?.sequence_order   ?? nextOrder)
  const [hours,      setHours]      = useState<string>(String(initial?.estimated_hours ?? ''))
  const [showSyllabus, setShowSyllabus] = useState(!!initial?.syllabus)

  // Subtopics
  const [drafts,          setDrafts]          = useState<SubtopicDraft[]>([])
  const [loadingSubs,     setLoadingSubs]     = useState(false)

  // Form state
  const [saving, setSaving] = useState(false)
  const [error,  setError]  = useState<string | null>(null)

  // Load existing subtopics in edit mode
  useEffect(() => {
    if (!initial) return
    setLoadingSubs(true)
    lecturerApi.topicSubtopics(initial.topic_id)
      .then(subs => setDrafts(subs.map(s => ({
        localId:        `db-${s.topic_id}`,
        topic_id:       s.topic_id,
        topic_name:     s.topic_name,
        description:    s.description ?? '',
        syllabus:       s.syllabus ?? '',
        slide_file_path: s.slide_file_path ?? null,
        pendingSlide:   null,
        sequence_order: s.sequence_order,
        showContent:    false,
        showSlide:      !!s.slide_file_path,
      }))))
      .finally(() => setLoadingSubs(false))
  }, [initial?.topic_id])

  const addSubtopic = () => {
    const nextSeq = drafts.length > 0 ? Math.max(...drafts.map(d => d.sequence_order)) + 1 : 1
    setDrafts(prev => [...prev, {
      localId:         `new-${Date.now()}`,
      topic_name:      '',
      description:     '',
      syllabus:        '',
      slide_file_path: null,
      pendingSlide:    null,
      sequence_order:  nextSeq,
      showContent:     false,
      showSlide:       false,
    }])
  }

  const removeSubtopic = async (draft: SubtopicDraft, permanent: boolean) => {
    if (draft.topic_id) {
      try {
        await lecturerApi.deleteSubtopic(initial!.topic_id, draft.topic_id, permanent)
      } catch {
        alert('Failed to remove subtopic.')
        return
      }
    }
    setDrafts(prev => prev.filter(d => d.localId !== draft.localId))
  }

  const updateDraft = (updated: SubtopicDraft) => {
    setDrafts(prev => prev.map(d => d.localId === updated.localId ? updated : d))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) { setError('Topic name is required.'); return }
    setSaving(true); setError(null)
    try {
      const payload: TopicPayload = {
        topic_name:       name.trim(),
        description:      desc.trim()     || undefined,
        syllabus:         syllabus.trim() || undefined,
        difficulty_level: difficulty,
        sequence_order:   order,
        estimated_hours:  hours !== '' ? Number(hours) : undefined,
      }

      const saved = isEdit
        ? await lecturerApi.updateTopic(initial!.topic_id, payload)
        : await lecturerApi.createTopic(payload)

      // Save subtopics in order
      const validDrafts = drafts.filter(d => d.topic_name.trim())
      const savedSubs = await Promise.all(validDrafts.map(d => {
        const subPayload = {
          topic_name:     d.topic_name.trim(),
          description:    d.description.trim() || undefined,
          syllabus:       d.syllabus.trim()    || undefined,
          sequence_order: d.sequence_order,
        }
        return d.topic_id
          ? lecturerApi.updateSubtopic(saved.topic_id, d.topic_id, subPayload)
          : lecturerApi.createSubtopic(saved.topic_id, subPayload)
      }))

      // Upload any pending slide files
      await Promise.all(validDrafts.map((d, i) => {
        if (!d.pendingSlide) return Promise.resolve()
        const subId = savedSubs[i].topic_id
        return lecturerApi.uploadSubtopicSlide(saved.topic_id, subId, d.pendingSlide)
      }))

      onSaved(saved)
    } catch {
      setError('Failed to save. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-1">
      {/* Header */}
      <div className="flex items-center justify-between pb-4">
        <Button variant="ghost" size="sm" onClick={onBack} className="gap-2 -ml-2">
          <ArrowLeft className="h-4 w-4" />
          All Topics
        </Button>
        <div className="flex items-center gap-2">
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="button" variant="outline" onClick={onBack} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={saving} className="gap-2 min-w-[130px]">
            {saving
              ? <><Loader2 className="h-4 w-4 animate-spin" /> Saving…</>
              : isEdit ? 'Save Changes' : 'Create Topic'
            }
          </Button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">

        {/* ── Card 1: Topic info ───────────────────────────────────────────── */}
        <FormSection accent="from-violet-500 to-indigo-500">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-4">
            Topic Information
          </p>

          {/* Big title input */}
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Topic title…"
            className="w-full text-2xl font-bold bg-transparent border-0 border-b-2 border-muted focus:border-primary focus:outline-none pb-2 mb-5 placeholder:text-muted-foreground/30"
          />

          {/* Description */}
          <div className="space-y-1 mb-5">
            <p className="text-xs text-muted-foreground font-medium">Description</p>
            <textarea
              value={desc}
              onChange={e => setDesc(e.target.value)}
              placeholder="Brief overview of what this topic covers"
              rows={2}
              className="w-full text-sm bg-transparent border-0 border-b border-muted focus:border-primary focus:outline-none resize-none placeholder:text-muted-foreground/40"
            />
          </div>

          {/* Difficulty pills */}
          <div className="space-y-2 mb-5">
            <p className="text-xs text-muted-foreground font-medium">Complexity</p>
            <DifficultyPills value={difficulty} onChange={setDifficulty} />
          </div>

          {/* Order + Hours */}
          <div className="flex gap-4">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground font-medium">Display Order</p>
              <input
                type="number"
                min={1}
                value={order}
                onChange={e => setOrder(Number(e.target.value))}
                className="w-20 text-sm bg-transparent border-b border-muted focus:border-primary focus:outline-none py-1 text-center"
              />
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground font-medium">Estimated Hours</p>
              <input
                type="number"
                min={0.5}
                step={0.5}
                value={hours}
                onChange={e => setHours(e.target.value)}
                placeholder="e.g. 6"
                className="w-24 text-sm bg-transparent border-b border-muted focus:border-primary focus:outline-none py-1 text-center placeholder:text-muted-foreground/40"
              />
            </div>
          </div>
        </FormSection>

        {/* ── Card 2: Syllabus (collapsible) ──────────────────────────────── */}
        <FormSection accent="from-teal-500 to-cyan-500">
          <button
            type="button"
            onClick={() => setShowSyllabus(v => !v)}
            className="flex items-center justify-between w-full text-left"
          >
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                Topic Overview
              </p>
              <p className="text-sm font-medium mt-0.5">
                {showSyllabus ? 'Syllabus & formulas' : syllabus ? 'Syllabus added ✓' : 'Add syllabus & math formulas'}
              </p>
            </div>
            <ChevronDown className={cn("h-5 w-5 text-muted-foreground transition-transform", showSyllabus && "rotate-180")} />
          </button>

          {showSyllabus && (
            <div className="mt-4">
              <SyllabusEditor value={syllabus} onChange={setSyllabus} />
            </div>
          )}
        </FormSection>

        {/* ── Subtopics ────────────────────────────────────────────────────── */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold">Subtopics</p>
              <p className="text-xs text-muted-foreground">
                Each subtopic becomes a lesson card students can click through
              </p>
            </div>
            {drafts.length > 0 && (
              <span className="text-xs text-muted-foreground bg-muted rounded-full px-2.5 py-0.5 font-medium">
                {drafts.length}
              </span>
            )}
          </div>

          {loadingSubs ? (
            <div className="space-y-2">
              {[1, 2].map(i => <Skeleton key={i} className="h-16 rounded-2xl" />)}
            </div>
          ) : (
            <>
              {drafts.map(draft => (
                <SubtopicDraftCard
                  key={draft.localId}
                  draft={draft}
                  parentOrder={order}
                  onUpdate={updateDraft}
                  onRemove={(permanent) => removeSubtopic(draft, permanent)}
                  parentTopicId={initial?.topic_id}
                />
              ))}
            </>
          )}

          {/* Add subtopic button */}
          <button
            type="button"
            onClick={addSubtopic}
            className={cn(
              "w-full rounded-2xl border-2 border-dashed border-border py-4 flex items-center justify-center gap-2",
              "text-sm text-muted-foreground font-medium",
              "hover:border-primary hover:text-primary hover:bg-primary/5 transition-all"
            )}
          >
            <Plus className="h-4 w-4" />
            Add Subtopic
          </button>
        </div>
      </form>
    </div>
  )
}

// ── Difficulty badge colours ──────────────────────────────────────────────────

const diffColor: Record<string, string> = {
  basic:        'text-emerald-600 border-emerald-300 bg-emerald-500/10',
  intermediate: 'text-amber-600   border-amber-300   bg-amber-500/10',
  advanced:     'text-red-600     border-red-300     bg-red-500/10',
}

// ── Topic list card ───────────────────────────────────────────────────────────

function TopicCard({
  topic,
  onEdit,
  onDelete,
}: {
  topic: Topic
  onEdit: () => void
  onDelete: () => void
}) {
  const [expanded,    setExpanded]    = useState(false)
  const [deleting,    setDeleting]    = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)

  const handleDelete = async (permanent: boolean) => {
    setDeleting(true)
    setConfirmOpen(false)
    try { await lecturerApi.deleteTopic(topic.topic_id, permanent); onDelete() }
    catch { setDeleting(false) }
  }

  return (
    <div className="relative rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
      {/* Left accent */}
      <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b from-violet-500 to-indigo-500" />

      <div className="pl-5 pr-4 py-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-muted-foreground">#{topic.sequence_order}</span>
              <p className="font-semibold truncate text-foreground">{topic.topic_name}</p>
            </div>
            <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
              <span className={cn("px-2 py-0.5 rounded-full border text-[10px] font-medium capitalize", diffColor[topic.difficulty_level])}>
                {topic.difficulty_level}
              </span>
              {topic.estimated_hours && (
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" /> {topic.estimated_hours}h
                </span>
              )}
              {topic.description && (
                <span className="truncate max-w-[200px]">{topic.description}</span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <Button size="icon" variant="ghost" className="h-8 w-8" onClick={onEdit} title="Edit topic & subtopics">
              <Pencil className="h-3.5 w-3.5" />
            </Button>
            <Button
              size="icon" variant="ghost"
              className="h-8 w-8 text-destructive hover:text-destructive"
              onClick={() => setConfirmOpen(v => !v)}
              disabled={deleting}
              title="Delete topic"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        {confirmOpen && (
          <div className="mt-3 rounded-xl border border-destructive/30 bg-destructive/5 p-3 space-y-2">
            <p className="text-xs font-medium text-destructive">How do you want to delete &quot;{topic.topic_name}&quot;?</p>
            <div className="flex gap-2 flex-wrap">
              <Button size="sm" variant="outline" className="text-xs h-7 gap-1.5" onClick={() => handleDelete(false)} disabled={deleting}>
                <Clock className="h-3 w-3" /> Hide from students
              </Button>
              <Button size="sm" variant="destructive" className="text-xs h-7 gap-1.5" onClick={() => handleDelete(true)} disabled={deleting}>
                <Trash2 className="h-3 w-3" /> Permanently delete
              </Button>
              <Button size="sm" variant="ghost" className="text-xs h-7" onClick={() => setConfirmOpen(false)} disabled={deleting}>
                Cancel
              </Button>
            </div>
            <p className="text-[10px] text-muted-foreground">Permanent delete removes all subtopics and cannot be undone.</p>
          </div>
        )}

        {topic.syllabus && (
          <div className="mt-3">
            <button
              type="button"
              onClick={() => setExpanded(v => !v)}
              className="flex items-center gap-1 text-xs text-primary hover:underline"
            >
              <BookOpen className="h-3 w-3" />
              {expanded ? 'Hide overview' : 'View overview'}
              <ChevronDown className={cn("h-3 w-3 transition-transform", expanded && "rotate-180")} />
            </button>
            {expanded && (
              <div className="mt-2 rounded-lg border bg-muted/30 p-3 text-sm leading-relaxed">
                <MathText text={topic.syllabus} className="leading-loose" />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// ── Main panel ────────────────────────────────────────────────────────────────

export function TopicsPanel() {
  const [topics,        setTopics]        = useState<Topic[]>([])
  const [hiddenTopics,  setHiddenTopics]  = useState<Topic[]>([])
  const [loading,       setLoading]       = useState(true)
  const [showHidden,    setShowHidden]    = useState(false)
  const [restoring,     setRestoring]     = useState<number | null>(null)
  const [view,          setView]          = useState<View>({ kind: 'list' })

  useEffect(() => {
    lecturerApi.topics()
      .then(setTopics)
      .finally(() => setLoading(false))
    lecturerApi.hiddenTopics().then(setHiddenTopics).catch(() => {})
  }, [])

  const handleRestore = async (id: number) => {
    setRestoring(id)
    try {
      const restored = await lecturerApi.restoreTopic(id)
      setHiddenTopics(prev => prev.filter(t => t.topic_id !== id))
      setTopics(prev => [...prev, restored].sort((a, b) => a.sequence_order - b.sequence_order))
    } catch {}
    finally { setRestoring(null) }
  }

  const nextOrder = topics.length > 0 ? Math.max(...topics.map(t => t.sequence_order)) + 1 : 1

  const handleSaved = (saved: Topic) => {
    setTopics(prev => {
      const idx = prev.findIndex(t => t.topic_id === saved.topic_id)
      if (idx >= 0) {
        const next = [...prev]; next[idx] = saved; return next
      }
      return [...prev, saved].sort((a, b) => a.sequence_order - b.sequence_order)
    })
    setView({ kind: 'list' })
  }

  const handleDeleted = (id: number) => {
    setTopics(prev => prev.filter(t => t.topic_id !== id))
  }

  if (view.kind === 'form') {
    return (
      <TopicForm
        initial={view.topic}
        nextOrder={nextOrder}
        onSaved={handleSaved}
        onBack={() => setView({ kind: 'list' })}
      />
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Topics &amp; Syllabus</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            {loading ? '…' : `${topics.length} topic${topics.length !== 1 ? 's' : ''}`}
          </p>
        </div>
        <Button onClick={() => setView({ kind: 'form' })} className="gap-2">
          <Plus className="h-4 w-4" /> New Topic
        </Button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-24 w-full rounded-2xl" />)}
        </div>
      ) : topics.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center gap-3">
          <BookOpen className="h-10 w-10 text-muted-foreground/40" />
          <p className="text-muted-foreground">No topics yet. Create your first topic to get started.</p>
          <Button onClick={() => setView({ kind: 'form' })} className="gap-2 mt-2">
            <Plus className="h-4 w-4" /> New Topic
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {[...topics].sort((a, b) => a.sequence_order - b.sequence_order).map(topic => (
            <TopicCard
              key={topic.topic_id}
              topic={topic}
              onEdit={() => setView({ kind: 'form', topic })}
              onDelete={() => handleDeleted(topic.topic_id)}
            />
          ))}
        </div>
      )}

      {/* Hidden Topics */}
      {hiddenTopics.length > 0 && (
        <div className="pt-4 border-t border-border">
          <button
            onClick={() => setShowHidden(v => !v)}
            className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronDown className={cn("h-4 w-4 transition-transform", showHidden && "rotate-180")} />
            Hidden Topics ({hiddenTopics.length})
          </button>

          {showHidden && (
            <div className="mt-3 space-y-2">
              {hiddenTopics.map(topic => (
                <div key={topic.topic_id} className="flex items-center justify-between gap-3 rounded-xl border border-dashed border-border bg-muted/30 px-4 py-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-muted-foreground truncate">{topic.topic_name}</p>
                    {topic.description && (
                      <p className="text-xs text-muted-foreground/60 truncate">{topic.description}</p>
                    )}
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="shrink-0 gap-1.5 text-xs h-7"
                    onClick={() => handleRestore(topic.topic_id)}
                    disabled={restoring === topic.topic_id}
                  >
                    {restoring === topic.topic_id
                      ? <Loader2 className="h-3 w-3 animate-spin" />
                      : <ArrowLeft className="h-3 w-3 rotate-180" />
                    }
                    Restore
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
