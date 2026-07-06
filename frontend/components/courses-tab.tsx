"use client"

import { useState, useEffect } from "react"
import { materialsApi, type Material } from "@/lib/api/materials"
import { topicsApi, type Subtopic } from "@/lib/api/topics"
import type { Topic } from "@/lib/api/topics"
import { RichContent } from "@/components/rich-content"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import {
  Grid3X3, Calculator, Sigma,
  ArrowLeft, ArrowRight, Check,
  ChevronDown, ChevronUp,
  FileText, Video, BookOpen, Dumbbell, Lightbulb, ClipboardList,
  Clock, ExternalLink, Loader2, GraduationCap, Presentation, Download,
} from "lucide-react"
import { cn } from "@/lib/utils"

// ── Slide viewer ──────────────────────────────────────────────────────────────

function SlideViewer({ path }: { path: string }) {
  const url = `/storage/${path}`
  const isPdf = path.toLowerCase().endsWith('.pdf')
  const fileName = path.split('/').pop() ?? path

  if (isPdf) {
    return (
      <div className="rounded-xl border bg-card overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-2 border-b bg-muted/40">
          <FileText className="h-4 w-4 text-red-500" />
          <span className="text-sm font-medium flex-1 truncate">{fileName}</span>
          <a href={url} download className="flex items-center gap-1 text-xs text-primary hover:underline">
            <Download className="h-3 w-3" /> Download
          </a>
        </div>
        <iframe src={url} className="w-full" style={{ height: '70vh' }} title={fileName} />
      </div>
    )
  }

  return (
    <div className="rounded-xl border bg-card p-5 flex items-center gap-4">
      <Presentation className="h-10 w-10 text-orange-500 shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{fileName}</p>
        <p className="text-xs text-muted-foreground mt-0.5">PowerPoint file. Download to view.</p>
      </div>
      <a href={url} download
        className="shrink-0 flex items-center gap-1.5 rounded-lg bg-primary text-primary-foreground px-3 py-1.5 text-xs font-medium hover:bg-primary/90 transition-colors"
      >
        <Download className="h-3.5 w-3.5" /> Download
      </a>
    </div>
  )
}

// ── Chapter metadata (content now comes from DB via RichContent) ──────────────

const CHAPTERS = [
  {
    id: "matrices",
    title: "Chapter 1: Matrices",
    description: "Matrix notation, types, operations, and algebraic properties",
    icon: Grid3X3,
    color: "from-blue-500 to-cyan-500",
    topicKeyword: "matri",
    subtopics: [
      { id: "1.1", title: "1.1 Introduction to Matrices",   description: "Definition, size, equal matrices, and transpose",                   sequenceOrder: 1 },
      { id: "1.2", title: "1.2 Types of Matrices",          description: "Triangular, diagonal, identity, zero, row/column, and symmetric",   sequenceOrder: 2 },
      { id: "1.3", title: "1.3 Matrix Operations",          description: "Addition, scalar multiplication, and matrix multiplication",         sequenceOrder: 3 },
      { id: "1.4", title: "1.4 Properties and Theorems",    description: "Properties of operations, zero, identity, and transpose",            sequenceOrder: 4 },
    ],
  },
  {
    id: "systems",
    title: "Chapter 2: Systems of Linear Equations",
    description: "Solving systems of linear equations using matrix methods",
    icon: Sigma,
    color: "from-green-500 to-emerald-500",
    topicKeyword: "linear",
    subtopics: [
      { id: "2.1", title: "2.1 Linear Equations",                        description: "Standard form, leading coefficient, and solution sets",      sequenceOrder: 1 },
      { id: "2.2", title: "2.2 Systems of Linear Equations",             description: "Matrix form AX = B, augmented matrix, types of solutions",   sequenceOrder: 2 },
      { id: "2.3", title: "2.3 Elementary Row Operations",               description: "Three operations, row echelon form, and RREF",               sequenceOrder: 3 },
      { id: "2.4", title: "2.4 Gaussian and Gauss-Jordan Elimination",   description: "Solving systems by row reduction",                           sequenceOrder: 4 },
    ],
  },
  {
    id: "determinants",
    title: "Chapter 3: Determinants",
    description: "Computing determinants and applying them to matrix problems",
    icon: Calculator,
    color: "from-purple-500 to-pink-500",
    topicKeyword: "determinant",
    subtopics: [
      { id: "3.1", title: "3.1 Determinant Formulas",          description: "1×1, 2×2 formula, and 3×3 Sarrus' Rule",                          sequenceOrder: 1 },
      { id: "3.2", title: "3.2 Cofactor Expansion",            description: "Minors, cofactors, expansion theorem, and triangular matrices",    sequenceOrder: 2 },
      { id: "3.3", title: "3.3 Elementary Operations Method",  description: "Row/column operations and their effect on determinants",            sequenceOrder: 3 },
      { id: "3.4", title: "3.4 Applications of Determinants",  description: "Finding inverse via adj(A) and Cramer's Rule",                     sequenceOrder: 4 },
    ],
  },
]

// ── Study resources (backend materials) ───────────────────────────────────────

const typeIcon: Record<string, React.ReactNode> = {
  pdf:      <FileText className="w-4 h-4" />,
  video:    <Video className="w-4 h-4" />,
  article:  <BookOpen className="w-4 h-4" />,
  exercise: <Dumbbell className="w-4 h-4" />,
  example:  <Lightbulb className="w-4 h-4" />,
  summary:  <ClipboardList className="w-4 h-4" />,
}
const typeColor: Record<string, string> = {
  pdf:      "bg-red-100 text-red-700 border-red-200",
  video:    "bg-blue-100 text-blue-700 border-blue-200",
  article:  "bg-green-100 text-green-700 border-green-200",
  exercise: "bg-orange-100 text-orange-700 border-orange-200",
  example:  "bg-yellow-100 text-yellow-700 border-yellow-200",
  summary:  "bg-purple-100 text-purple-700 border-purple-200",
}

function StudyResources({ topic }: { topic: Topic }) {
  const [open,      setOpen]      = useState(false)
  const [materials, setMaterials] = useState<Material[]>([])
  const [loading,   setLoading]   = useState(false)
  const [loaded,    setLoaded]    = useState(false)

  const toggle = async () => {
    setOpen(o => !o)
    if (!loaded) {
      setLoading(true)
      try { setMaterials(await materialsApi.getByTopic(topic.topic_id)) }
      catch { setMaterials([]) }
      finally { setLoading(false); setLoaded(true) }
    }
  }

  const openMaterial = (mat: Material) => {
    materialsApi.logView(mat.material_id).catch(() => {})
    const url = mat.external_url ?? mat.file_url
    if (url) window.open(url, "_blank")
  }

  return (
    <div className="rounded-xl border border-border bg-card">
      <button onClick={toggle} className="w-full flex items-center justify-between p-4 text-left">
        <span className="text-sm font-semibold text-foreground">Study Resources</span>
        <span className="flex items-center gap-2 text-muted-foreground">
          {loaded && <Badge variant="outline" className="text-xs">{materials.length} materials</Badge>}
          {open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </span>
      </button>
      {open && (
        <div className="px-4 pb-4 space-y-2">
          {loading && (
            <div className="flex items-center gap-2 text-muted-foreground py-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-sm">Loading…</span>
            </div>
          )}
          {!loading && materials.length === 0 && (
            <p className="text-sm text-muted-foreground py-2 text-center">No materials available.</p>
          )}
          {!loading && materials.map(mat => (
            <div key={mat.material_id} className="flex items-center justify-between p-3 rounded-xl bg-muted/40 border border-border hover:bg-muted/70 transition-colors">
              <div className="flex items-start gap-3 min-w-0">
                <div className={cn("p-1.5 rounded-lg border flex-shrink-0", typeColor[mat.content_type] ?? "bg-muted text-muted-foreground border-border")}>
                  {typeIcon[mat.content_type] ?? <BookOpen className="w-4 h-4" />}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{mat.title}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <Badge variant="outline" className="text-xs capitalize px-1.5 py-0">{mat.content_type}</Badge>
                    <Badge variant="outline" className="text-xs capitalize px-1.5 py-0">{mat.difficulty_level}</Badge>
                    {mat.duration_minutes && (
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="w-3 h-3" />{mat.duration_minutes} min
                      </span>
                    )}
                  </div>
                </div>
              </div>
              {(mat.external_url || mat.file_url) && (
                <Button size="sm" variant="outline" className="flex-shrink-0 ml-3" onClick={() => openMaterial(mat)}>
                  <ExternalLink className="w-3 h-3 mr-1" /> Open
                </Button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

interface CoursesTabProps {
  topics: Topic[]
  loading?: boolean
  selectedTopicId?: number | null
  initialSubtopicId?: string | null
  completed: Set<string>
  markComplete: (id: string, topicId?: number) => void
  markIncomplete: (id: string) => void
}

// Dynamic topic colours cycling for topics not in CHAPTERS
const DYN_COLORS = [
  "from-teal-500 to-cyan-500",
  "from-orange-500 to-amber-500",
  "from-violet-500 to-purple-500",
  "from-rose-500 to-pink-500",
  "from-indigo-500 to-blue-500",
]

export function CoursesTab({ topics, loading, selectedTopicId, initialSubtopicId, completed, markComplete, markIncomplete }: CoursesTabProps) {
  const [selectedChapter,    setSelectedChapter]    = useState<string | null>(null)
  const [selectedSubtopic,   setSelectedSubtopic]   = useState<string | null>(null)
  const [selectedDynamicId,  setSelectedDynamicId]  = useState<number | null>(null)
  const [selectedDynSubId,   setSelectedDynSubId]   = useState<number | null>(null)
  const [dynSubtopicsMap,    setDynSubtopicsMap]    = useState<Map<number, Subtopic[]>>(new Map())
  const [dynSubLoadingId,    setDynSubLoadingId]    = useState<number | null>(null)
  // DB subtopics for hardcoded chapters (keyed by chapter.id)
  const [chapterSubsMap,     setChapterSubsMap]     = useState<Map<string, Subtopic[]>>(new Map())
  const [chapterSubLoadingId, setChapterSubLoadingId] = useState<string | null>(null)

  // Topics that don't match any hardcoded chapter keyword
  const dynamicTopics = topics.filter(t => {
    const n = t.topic_name.toLowerCase()
    return !CHAPTERS.some(ch => n.includes(ch.topicKeyword))
  })

  // Navigate from external click (e.g. topic mastery grid or recommendation)
  useEffect(() => {
    if (initialSubtopicId) {
      const chapterId = initialSubtopicId.startsWith("1") ? "matrices"
                      : initialSubtopicId.startsWith("2") ? "systems"
                      : "determinants"
      setSelectedChapter(chapterId)
      setSelectedSubtopic(initialSubtopicId)
      return
    }
    if (!selectedTopicId || !topics.length) return
    const topic = topics.find(t => t.topic_id === selectedTopicId)
    if (!topic) return
    const name = topic.topic_name.toLowerCase()
    if (name.includes("matri"))                                   setSelectedChapter("matrices")
    else if (name.includes("determinant"))                        setSelectedChapter("determinants")
    else if (name.includes("linear") || name.includes("system")) setSelectedChapter("systems")
    else { setSelectedDynamicId(topic.topic_id); setSelectedChapter(null) }
    setSelectedSubtopic(null)
  }, [selectedTopicId, initialSubtopicId, topics])

  // Fetch DB subtopics for dynamic topics
  useEffect(() => {
    if (selectedDynamicId === null) return
    if (dynSubtopicsMap.has(selectedDynamicId)) return
    setDynSubLoadingId(selectedDynamicId)
    topicsApi.getSubtopics(selectedDynamicId)
      .then(subs => setDynSubtopicsMap(prev => new Map(prev).set(selectedDynamicId, subs)))
      .finally(() => setDynSubLoadingId(null))
  }, [selectedDynamicId])

  // Fetch DB subtopics for hardcoded chapters (content comes from DB now)
  useEffect(() => {
    if (!selectedChapter) return
    if (chapterSubsMap.has(selectedChapter)) return
    const chapter = CHAPTERS.find(c => c.id === selectedChapter)
    if (!chapter) return
    const matchedTopic = topics.find(t => t.topic_name.toLowerCase().includes(chapter.topicKeyword))
    if (!matchedTopic) return
    setChapterSubLoadingId(selectedChapter)
    topicsApi.getSubtopics(matchedTopic.topic_id)
      .then(subs => setChapterSubsMap(prev => new Map(prev).set(selectedChapter, subs)))
      .finally(() => setChapterSubLoadingId(null))
  }, [selectedChapter, topics])

  if (loading) {
    return (
      <div className="space-y-3 max-w-4xl">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-32 bg-card rounded-2xl border border-border animate-pulse" />
        ))}
      </div>
    )
  }

  const chapter  = CHAPTERS.find(c => c.id === selectedChapter)
  const subtopic = chapter?.subtopics.find(s => s.id === selectedSubtopic)

  // ── Dynamic topic - subtopic content (Level 3) ──────────────────────────────
  if (selectedDynamicId !== null && selectedDynSubId !== null) {
    const dynTopic  = topics.find(t => t.topic_id === selectedDynamicId)
    const dynSubs   = dynSubtopicsMap.get(selectedDynamicId) ?? []
    const dynSub    = dynSubs.find(s => s.topic_id === selectedDynSubId)
    const dynIdx    = dynamicTopics.findIndex(t => t.topic_id === selectedDynamicId)
    const color     = DYN_COLORS[dynIdx % DYN_COLORS.length]

    if (!dynTopic || !dynSub) { setSelectedDynSubId(null); return null }

    const completionKey = `sub_${dynSub.topic_id}`
    const isDone        = completed.has(completionKey)
    const subIndex      = dynSubs.findIndex(s => s.topic_id === dynSub.topic_id)
    const doneInDyn     = dynSubs.filter(s => completed.has(`sub_${s.topic_id}`)).length
    const dynPct        = dynSubs.length > 0 ? (doneInDyn / dynSubs.length) * 100 : 0

    return (
      <div className="space-y-5 max-w-3xl mx-auto">
        <div className="flex items-center gap-2 flex-wrap">
          <Button variant="ghost" size="sm" className="gap-1" onClick={() => { setSelectedDynamicId(null); setSelectedDynSubId(null) }}>
            <ArrowLeft className="w-4 h-4" /> Chapters
          </Button>
          <span className="text-muted-foreground">/</span>
          <Button variant="ghost" size="sm" onClick={() => setSelectedDynSubId(null)}>
            {dynTopic.topic_name}
          </Button>
          <span className="text-muted-foreground">/</span>
          <span className="text-sm font-medium text-foreground">{dynSub.topic_name}</span>
        </div>

        <Card className="p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-foreground">Chapter Progress</span>
            <span className="text-sm text-muted-foreground">
              {doneInDyn} completed · {dynSubs.length - doneInDyn} remaining
            </span>
          </div>
          <Progress value={dynPct} className="h-2" />
          <div className="flex justify-between mt-2 text-xs text-muted-foreground">
            <span>Subtopic {subIndex + 1} of {dynSubs.length}</span>
            <span>{Math.round(dynPct)}% complete</span>
          </div>
        </Card>

        <div>
          <h2 className="text-xl font-bold text-foreground">{dynSub.topic_name}</h2>
          {dynSub.description && <p className="text-sm text-muted-foreground">{dynSub.description}</p>}
        </div>

        {dynSub.slide_file_path && <SlideViewer path={dynSub.slide_file_path} />}

        {dynSub.syllabus ? (
          <div className="rounded-xl border bg-card p-5 space-y-4">
            <RichContent text={dynSub.syllabus} />
          </div>
        ) : !dynSub.slide_file_path ? (
          <div className="rounded-xl border border-dashed bg-muted/30 p-8 text-center">
            <GraduationCap className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No content yet for this subtopic.</p>
          </div>
        ) : null}

        <div className="space-y-3 pt-2 pb-4">
          {isDone ? (
            <Button variant="outline" className="w-full gap-2 border-mastered text-mastered hover:bg-mastered/10"
              onClick={() => markIncomplete(completionKey)}>
              <Check className="w-4 h-4" /> Completed ✓ (click to undo)
            </Button>
          ) : (
            <Button className="w-full gap-2 bg-mastered hover:bg-mastered/90 text-white"
              onClick={() => markComplete(completionKey, dynTopic.topic_id)}>
              <Check className="w-4 h-4" /> Mark as Complete
            </Button>
          )}
          <div className="flex items-center justify-between">
            <Button variant="ghost" className="gap-2" disabled={subIndex === 0}
              onClick={() => setSelectedDynSubId(dynSubs[subIndex - 1].topic_id)}>
              <ArrowLeft className="w-4 h-4" /> Previous
            </Button>
            <div className="flex gap-1">
              {dynSubs.map((s, idx) => (
                <button key={idx} onClick={() => setSelectedDynSubId(s.topic_id)}
                  className={cn(
                    "h-2 rounded-full transition-all",
                    idx === subIndex ? "w-6 bg-primary"
                      : completed.has(`sub_${s.topic_id}`) ? "w-2 bg-mastered"
                      : "w-2 bg-muted hover:bg-muted-foreground/30"
                  )}
                />
              ))}
            </div>
            <Button variant="ghost" className="gap-2" disabled={subIndex === dynSubs.length - 1}
              onClick={() => setSelectedDynSubId(dynSubs[subIndex + 1].topic_id)}>
              Next <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <StudyResources topic={dynTopic} />
      </div>
    )
  }

  // ── Dynamic topic detail (Level 2 or single-page) ─────────────────────────
  if (selectedDynamicId !== null) {
    const dynTopic  = topics.find(t => t.topic_id === selectedDynamicId)
    if (!dynTopic) { setSelectedDynamicId(null); return null }
    const dynIdx    = dynamicTopics.findIndex(t => t.topic_id === dynTopic.topic_id)
    const color     = DYN_COLORS[dynIdx % DYN_COLORS.length]
    const dynSubs   = dynSubtopicsMap.get(selectedDynamicId) ?? []
    const isLoading = dynSubLoadingId === selectedDynamicId
    const hasSubtopics = !isLoading && dynSubs.length > 0

    if (hasSubtopics) {
      const doneInDyn = dynSubs.filter(s => completed.has(`sub_${s.topic_id}`)).length
      const dynPct    = (doneInDyn / dynSubs.length) * 100

      return (
        <div className="space-y-5 max-w-4xl">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" className="gap-1" onClick={() => setSelectedDynamicId(null)}>
              <ArrowLeft className="w-4 h-4" /> All Chapters
            </Button>
          </div>
          <div className="flex items-center gap-3">
            <div className={cn("w-12 h-12 rounded-2xl bg-gradient-to-br flex items-center justify-center shadow-md", color)}>
              <GraduationCap className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-foreground">{dynTopic.topic_name}</h2>
              {dynTopic.description && <p className="text-sm text-muted-foreground">{dynTopic.description}</p>}
            </div>
          </div>
          <Card className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-foreground">Progress</span>
              <span className="text-sm text-muted-foreground">
                {doneInDyn} completed · {dynSubs.length - doneInDyn} remaining
              </span>
            </div>
            <Progress value={dynPct} className="h-2" />
            <div className="flex justify-between mt-2 text-xs text-muted-foreground">
              <span>{doneInDyn} of {dynSubs.length} subtopics</span>
              <span>{Math.round(dynPct)}% complete</span>
            </div>
          </Card>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {dynSubs.map(sub => {
              const isDone = completed.has(`sub_${sub.topic_id}`)
              return (
                <Card key={sub.topic_id} onClick={() => setSelectedDynSubId(sub.topic_id)}
                  className={cn(
                    "group relative overflow-hidden cursor-pointer border-2 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200",
                    isDone ? "border-mastered/40 hover:border-mastered/60" : "hover:border-primary/50"
                  )}>
                  {isDone && <div className="absolute inset-0 bg-mastered/[0.03] pointer-events-none" />}
                  <div className={cn("absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-10 transition-opacity", color)} />
                  <div className="relative p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div className={cn("w-10 h-10 rounded-xl bg-gradient-to-br flex items-center justify-center shadow", color)}>
                        <GraduationCap className="w-5 h-5 text-white" />
                      </div>
                      {isDone && (
                        <span className="flex items-center gap-1 text-xs font-medium text-mastered bg-mastered/10 border border-mastered/20 rounded-full px-2 py-0.5">
                          <Check className="w-3 h-3" /> Done
                        </span>
                      )}
                    </div>
                    <h3 className={cn("font-bold transition-colors", isDone ? "text-mastered" : "text-foreground group-hover:text-primary")}>
                      {sub.topic_name}
                    </h3>
                    {sub.description && <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{sub.description}</p>}
                  </div>
                </Card>
              )
            })}
          </div>
          <StudyResources topic={dynTopic} />
        </div>
      )
    }

    // Single-page view
    const completionKey = `dyn_${dynTopic.topic_id}`
    const isDone = completed.has(completionKey)

    return (
      <div className="space-y-5 max-w-3xl mx-auto">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" className="gap-1" onClick={() => setSelectedDynamicId(null)}>
            <ArrowLeft className="w-4 h-4" /> Chapters
          </Button>
          <span className="text-muted-foreground">/</span>
          <span className="text-sm font-medium text-foreground">{dynTopic.topic_name}</span>
        </div>
        <div className="flex items-center gap-3">
          <div className={cn("w-12 h-12 rounded-2xl bg-gradient-to-br flex items-center justify-center shadow-md", color)}>
            <GraduationCap className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground">{dynTopic.topic_name}</h2>
            {dynTopic.description && <p className="text-sm text-muted-foreground">{dynTopic.description}</p>}
          </div>
        </div>
        {isLoading ? (
          <div className="space-y-2"><div className="h-32 rounded-xl bg-muted animate-pulse" /></div>
        ) : dynTopic.syllabus ? (
          <div className="rounded-xl border bg-card p-5 space-y-4">
            <p className="text-xs font-bold uppercase tracking-wider text-primary">Syllabus &amp; Content</p>
            <RichContent text={dynTopic.syllabus} />
          </div>
        ) : (
          <div className="rounded-xl border border-dashed bg-muted/30 p-8 text-center">
            <GraduationCap className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No syllabus content yet.</p>
            <p className="text-xs text-muted-foreground mt-1">The lecturer can add content through the Topics panel.</p>
          </div>
        )}
        {!isLoading && (
          <div className="pt-1">
            {isDone ? (
              <Button variant="outline" className="w-full gap-2 border-mastered text-mastered hover:bg-mastered/10"
                onClick={() => markIncomplete(completionKey)}>
                <Check className="w-4 h-4" /> Completed ✓ (click to undo)
              </Button>
            ) : (
              <Button className="w-full gap-2 bg-mastered hover:bg-mastered/90 text-white"
                onClick={() => markComplete(completionKey, dynTopic.topic_id)}>
                <Check className="w-4 h-4" /> Mark as Complete
              </Button>
            )}
          </div>
        )}
        <StudyResources topic={dynTopic} />
      </div>
    )
  }

  // ── Hardcoded chapter - subtopic content (Level 3) ──────────────────────────
  if (chapter && subtopic) {
    const matchedTopic  = topics.find(t => t.topic_name.toLowerCase().includes(chapter.topicKeyword))
    const isCompleted   = completed.has(subtopic.id)
    const subtopicIndex = chapter.subtopics.findIndex(s => s.id === subtopic.id)
    const doneInChapter = chapter.subtopics.filter(s => completed.has(s.id)).length
    const chapterPct    = (doneInChapter / chapter.subtopics.length) * 100

    // Resolve DB subtopic by sequence order to get the syllabus
    const dbSubs    = chapterSubsMap.get(chapter.id) ?? []
    const dbSub     = dbSubs.find(s => s.sequence_order === subtopic.sequenceOrder)
    const isLoading = chapterSubLoadingId === chapter.id

    return (
      <div className="space-y-5 max-w-3xl mx-auto">
        <div className="flex items-center gap-2 flex-wrap">
          <Button variant="ghost" size="sm" className="gap-1" onClick={() => setSelectedChapter(null)}>
            <ArrowLeft className="w-4 h-4" /> Chapters
          </Button>
          <span className="text-muted-foreground">/</span>
          <Button variant="ghost" size="sm" onClick={() => setSelectedSubtopic(null)}>
            {chapter.title}
          </Button>
          <span className="text-muted-foreground">/</span>
          <span className="text-sm font-medium text-foreground">{subtopic.title}</span>
        </div>

        <Card className="p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-foreground">Chapter Progress</span>
            <span className="text-sm text-muted-foreground">
              {doneInChapter} completed · {chapter.subtopics.length - doneInChapter} remaining
            </span>
          </div>
          <Progress value={chapterPct} className="h-2" />
          <div className="flex justify-between mt-2 text-xs text-muted-foreground">
            <span>Subtopic {subtopicIndex + 1} of {chapter.subtopics.length}</span>
            <span>{Math.round(chapterPct)}% complete</span>
          </div>
        </Card>

        <div>
          <h2 className="text-xl font-bold text-foreground">{subtopic.title}</h2>
          <p className="text-sm text-muted-foreground">{subtopic.description}</p>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[1,2,3].map(i => <div key={i} className="h-24 rounded-xl bg-muted animate-pulse" />)}
          </div>
        ) : (
          <>
            {dbSub?.slide_file_path && <SlideViewer path={dbSub.slide_file_path} />}
            {dbSub?.syllabus ? (
              <div className="rounded-xl border bg-card p-5">
                <RichContent text={dbSub.syllabus} />
              </div>
            ) : !dbSub?.slide_file_path ? (
              <div className="rounded-xl border border-dashed bg-muted/30 p-8 text-center">
                <GraduationCap className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Content not yet loaded.</p>
                <p className="text-xs text-muted-foreground mt-1">Run the SubtopicContentSeeder to populate the content.</p>
              </div>
            ) : null}
          </>
        )}

        <div className="space-y-3 pt-2 pb-4">
          {isCompleted ? (
            <Button variant="outline" className="w-full gap-2 border-mastered text-mastered hover:bg-mastered/10"
              onClick={() => markIncomplete(subtopic.id)}>
              <Check className="w-4 h-4" /> Completed ✓  (click to undo)
            </Button>
          ) : (
            <Button className="w-full gap-2 bg-mastered hover:bg-mastered/90 text-white"
              onClick={() => markComplete(subtopic.id, matchedTopic?.topic_id)}>
              <Check className="w-4 h-4" /> Mark as Complete
            </Button>
          )}

          <div className="flex items-center justify-between">
            <Button variant="ghost" className="gap-2" disabled={subtopicIndex === 0}
              onClick={() => setSelectedSubtopic(chapter.subtopics[subtopicIndex - 1].id)}>
              <ArrowLeft className="w-4 h-4" /> Previous
            </Button>
            <div className="flex gap-1">
              {chapter.subtopics.map((s, idx) => (
                <button key={idx} onClick={() => setSelectedSubtopic(chapter.subtopics[idx].id)}
                  className={cn(
                    "h-2 rounded-full transition-all",
                    idx === subtopicIndex ? "w-6 bg-primary"
                      : completed.has(s.id) ? "w-2 bg-mastered"
                      : "w-2 bg-muted hover:bg-muted-foreground/30"
                  )}
                />
              ))}
            </div>
            <Button variant="ghost" className="gap-2" disabled={subtopicIndex === chapter.subtopics.length - 1}
              onClick={() => setSelectedSubtopic(chapter.subtopics[subtopicIndex + 1].id)}>
              Next <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {matchedTopic && <StudyResources topic={matchedTopic} />}
      </div>
    )
  }

  // ── Hardcoded chapter - subtopic grid (Level 2) ─────────────────────────────
  if (chapter) {
    const Icon          = chapter.icon
    const doneInChapter = chapter.subtopics.filter(s => completed.has(s.id)).length
    const chapterPct    = (doneInChapter / chapter.subtopics.length) * 100
    const matchedTopic  = topics.find(t => t.topic_name.toLowerCase().includes(chapter.topicKeyword))

    return (
      <div className="space-y-5 max-w-4xl">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" className="gap-1" onClick={() => setSelectedChapter(null)}>
            <ArrowLeft className="w-4 h-4" /> All Chapters
          </Button>
        </div>
        <div className="flex items-center gap-3">
          <div className={cn("w-12 h-12 rounded-2xl bg-gradient-to-br flex items-center justify-center shadow-md", chapter.color)}>
            <Icon className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground">{chapter.title}</h2>
            <p className="text-sm text-muted-foreground">{chapter.description}</p>
          </div>
        </div>
        <Card className="p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-foreground">Progress</span>
            <span className="text-sm text-muted-foreground">
              {doneInChapter} completed · {chapter.subtopics.length - doneInChapter} remaining
            </span>
          </div>
          <Progress value={chapterPct} className="h-2" />
          <div className="flex justify-between mt-2 text-xs text-muted-foreground">
            <span>{doneInChapter} of {chapter.subtopics.length} subtopics</span>
            <span>{Math.round(chapterPct)}% complete</span>
          </div>
        </Card>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {chapter.subtopics.map(sub => {
            const isDone = completed.has(sub.id)
            return (
              <Card key={sub.id} onClick={() => setSelectedSubtopic(sub.id)}
                className={cn(
                  "group relative overflow-hidden cursor-pointer border-2 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200",
                  isDone ? "border-mastered/40 hover:border-mastered/60" : "hover:border-primary/50"
                )}>
                {isDone && <div className="absolute inset-0 bg-mastered/[0.03] pointer-events-none" />}
                <div className={cn("absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-10 transition-opacity", chapter.color)} />
                <div className="relative p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className={cn("w-10 h-10 rounded-xl bg-gradient-to-br flex items-center justify-center shadow", chapter.color)}>
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    {isDone && (
                      <span className="flex items-center gap-1 text-xs font-medium text-mastered bg-mastered/10 border border-mastered/20 rounded-full px-2 py-0.5">
                        <Check className="w-3 h-3" /> Done
                      </span>
                    )}
                  </div>
                  <h3 className={cn("font-bold transition-colors", isDone ? "text-mastered" : "text-foreground group-hover:text-primary")}>{sub.title}</h3>
                  <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{sub.description}</p>
                </div>
              </Card>
            )
          })}
        </div>
        {matchedTopic && <StudyResources topic={matchedTopic} />}
      </div>
    )
  }

  // ── Level 1: Chapter grid ──────────────────────────────────────────────────
  return (
    <div className="space-y-5 max-w-4xl">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Courses</h2>
        <p className="text-sm text-muted-foreground mt-1">Select a chapter to explore the complete syllabus</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Hardcoded chapters (Matrices, Systems, Determinants) */}
        {CHAPTERS.map(ch => {
          const Icon  = ch.icon
          const done  = ch.subtopics.filter(s => completed.has(s.id)).length
          const total = ch.subtopics.length
          const pct   = (done / total) * 100

          return (
            <Card key={ch.id}
              onClick={() => { setSelectedChapter(ch.id); setSelectedSubtopic(null); setSelectedDynamicId(null) }}
              className="group relative overflow-hidden cursor-pointer border-2 hover:border-primary/50 hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
              <div className={cn("absolute inset-0 bg-gradient-to-br opacity-5 group-hover:opacity-10 transition-opacity", ch.color)} />
              <div className="relative p-6">
                <div className={cn("w-14 h-14 rounded-2xl bg-gradient-to-br flex items-center justify-center shadow-lg mb-4", ch.color)}>
                  <Icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-lg font-bold text-foreground group-hover:text-primary transition-colors">{ch.title}</h3>
                <p className="text-sm text-muted-foreground mt-1 line-clamp-2 leading-relaxed">{ch.description}</p>
                <div className="mt-4 space-y-1.5">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{done}/{total} subtopics</span>
                    <span>{Math.round(pct)}%</span>
                  </div>
                  <Progress value={pct} className="h-1.5" />
                </div>
              </div>
            </Card>
          )
        })}

        {/* Dynamic topics created by lecturer */}
        {dynamicTopics.map((t, idx) => {
          const color      = DYN_COLORS[idx % DYN_COLORS.length]
          const chapterNum = CHAPTERS.length + idx + 1
          const cachedSubs = dynSubtopicsMap.get(t.topic_id)

          let done = 0, total = 1, pct = 0
          if (cachedSubs && cachedSubs.length > 0) {
            total = cachedSubs.length
            done  = cachedSubs.filter(s => completed.has(`sub_${s.topic_id}`)).length
            pct   = (done / total) * 100
          } else {
            const isDone = completed.has(`dyn_${t.topic_id}`)
            done  = isDone ? 1 : 0
            pct   = isDone ? 100 : 0
          }

          return (
            <Card key={t.topic_id}
              onClick={() => { setSelectedDynamicId(t.topic_id); setSelectedChapter(null); setSelectedSubtopic(null); setSelectedDynSubId(null) }}
              className="group relative overflow-hidden cursor-pointer border-2 hover:border-primary/50 hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
              <div className={cn("absolute inset-0 bg-gradient-to-br opacity-5 group-hover:opacity-10 transition-opacity", color)} />
              <div className="relative p-6">
                <div className={cn("w-14 h-14 rounded-2xl bg-gradient-to-br flex items-center justify-center shadow-lg mb-4", color)}>
                  <GraduationCap className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-lg font-bold text-foreground group-hover:text-primary transition-colors">
                  Chapter {chapterNum}: {t.topic_name}
                </h3>
                <p className="text-sm text-muted-foreground mt-1 line-clamp-2 leading-relaxed">
                  {t.description ?? `Difficulty: ${t.difficulty_level}`}
                </p>
                <div className="mt-4 space-y-1.5">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{done}/{total} subtopics</span>
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
