"use client"

import { useEffect, useState } from "react"
import { lecturerApi, type Material, type Topic, type Subtopic, type CreateMaterialPayload } from "@/lib/api/lecturer"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Skeleton } from "@/components/ui/skeleton"
import { Plus, Trash2, ExternalLink, Upload, FileText } from "lucide-react"
import { cn } from "@/lib/utils"

const TAG_GROUPS = [
  { label: 'Topic', items: ['matrices', 'determinants', 'systems of linear equations'] },
  { label: 'Content Nature', items: ['introduction', 'basics', 'summary', 'reference', 'formulas', 'practice', 'worked examples', 'drill', 'exercise', 'cheat sheet'] },
]

const KEYWORD_GROUPS = [
  {
    label: 'Matrices',
    items: [
      'matrix', 'rows', 'columns', 'elements', 'matrix dimensions', 'matrix equality', 'matrix types',
      'square matrix', 'zero matrix', 'matrix addition', 'matrix subtraction', 'scalar multiplication',
      'commutativity', 'distributive law', 'mixed operations', 'matrix multiplication', 'dot product',
      'matrix power', 'matrix equations', 'non-commutative', 'transpose', 'symmetric', 'identity matrix',
      'skew-symmetric', 'orthogonal matrix', 'diagonal matrix', 'triangular matrix', 'block matrix',
      'permutation matrix', 'rotation matrix', 'transpose property', 'matrix inverse', 'invertibility',
      'matrix rank', 'rank', 'similar matrices', 'trace', 'eigenvalues', 'characteristic polynomial',
    ],
  },
  {
    label: 'Determinants',
    items: [
      'determinant', 'cofactor', 'expansion', '2x2 determinant', '3x3 determinant', 'minors',
      'cofactor matrix', 'sarrus rule', 'determinant properties', 'determinant laws', 'adjugate',
      'adjoint', 'inverse determinant', 'inverse via adjugate', 'linearity', 'row proportionality',
      'row swap', 'multiplicative property', 'triangular matrix determinant', 'diagonal matrix determinant',
      'identity determinant', 'determinant calculation', 'determinant power', 'geometric interpretation',
      'collinearity', 'coplanarity', 'singular matrix', 'singular condition',
    ],
  },
  {
    label: 'Systems of Linear Equations',
    items: [
      'linear system', 'consistent', 'inconsistent', 'unique solution', 'solution types', 'system types',
      'system classification', 'simple systems', 'gaussian elimination', 'augmented matrix', 'row echelon',
      'gauss-jordan', 'reduced row echelon form', 'RREF', 'back substitution', 'pivoting', 'pivot',
      'elementary row operations', 'row operations', 'row reduction', "cramer's rule", 'inverse method',
      'homogeneous system', 'free variables', 'parametric solution', 'general solution', 'infinite solutions',
      'infinitely many solutions', 'underdetermined', 'null space', 'nullspace', 'underdetermined homogeneous',
      'verification', 'system simplification', 'rank-nullity',
    ],
  },
]

function PillPicker({ label, hint, value, onChange, groups, searchable }: {
  label: string
  hint?: string
  value: string
  onChange: (v: string) => void
  groups: { label: string; items: string[] }[]
  searchable?: boolean
}) {
  const [search, setSearch] = useState('')
  const selected = new Set(value.split(',').map(s => s.trim()).filter(Boolean))

  const toggle = (item: string) => {
    const next = new Set(selected)
    if (next.has(item)) next.delete(item); else next.add(item)
    onChange([...next].join(', '))
  }

  const shown = search
    ? groups.map(g => ({ ...g, items: g.items.filter(i => i.toLowerCase().includes(search.toLowerCase())) })).filter(g => g.items.length > 0)
    : groups

  return (
    <div className="space-y-2">
      <Label>
        {label}{hint && <span className="text-muted-foreground font-normal text-xs ml-1">{hint}</span>}
      </Label>
      {searchable && (
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder={`Filter ${label.toLowerCase()}...`}
          className="w-full h-8 px-3 text-sm rounded-md border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
        />
      )}
      <div className={cn('space-y-2', searchable && 'max-h-48 overflow-y-auto pr-1')}>
        {shown.map(g => {
          const allSelected = g.items.every(i => selected.has(i))
          const toggleAll = () => {
            const next = new Set(selected)
            if (allSelected) g.items.forEach(i => next.delete(i))
            else g.items.forEach(i => next.add(i))
            onChange([...next].join(', '))
          }
          return (
            <div key={g.label} className="space-y-1">
              <div className="flex items-center gap-2">
                <p className="text-xs font-medium text-muted-foreground">{g.label}</p>
                <button
                  type="button"
                  onClick={toggleAll}
                  className={cn(
                    'px-1.5 py-0 rounded text-xs border transition-colors',
                    allSelected
                      ? 'bg-primary/10 text-primary border-primary/30 hover:bg-primary/20'
                      : 'text-muted-foreground border-border hover:border-primary/50 hover:text-foreground'
                  )}
                >
                  {allSelected ? 'deselect all' : 'all'}
                </button>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {g.items.map(item => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => toggle(item)}
                    className={cn(
                      'px-2 py-0.5 rounded-full text-xs border transition-colors',
                      selected.has(item)
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'bg-transparent text-muted-foreground border-border hover:border-primary/50 hover:text-foreground'
                    )}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>
          )
        })}
      </div>
      {selected.size > 0 && (
        <p className="text-xs text-muted-foreground truncate">{selected.size} selected: {[...selected].join(', ')}</p>
      )}
    </div>
  )
}

const blank = (): CreateMaterialPayload => ({
  topic_id: 0,
  title: '',
  description: '',
  content_type: 'pdf',
  external_url: '',
  difficulty_level: 'basic',
  tags: '',
  keywords: '',
  subtopic_id: '',
  duration_minutes: undefined,
  is_remedial: false,
})

const typeColor: Record<string, string> = {
  video:    'bg-purple-500/10 text-purple-600 border-purple-300',
  pdf:      'bg-red-500/10    text-red-600    border-red-300',
  article:  'bg-blue-500/10   text-blue-600   border-blue-300',
  exercise: 'bg-amber-500/10  text-amber-600  border-amber-300',
  example:  'bg-green-500/10  text-green-600  border-green-300',
  summary:  'bg-slate-500/10  text-slate-600  border-slate-300',
}

export function MaterialsPanel() {
  const [materials,    setMaterials]    = useState<Material[]>([])
  const [topics,       setTopics]       = useState<Topic[]>([])
  const [subtopics,    setSubtopics]    = useState<Subtopic[]>([])
  const [loading,      setLoading]      = useState(true)
  const [showForm,     setShowForm]     = useState(false)
  const [form,         setForm]         = useState<CreateMaterialPayload>(blank())
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [saving,       setSaving]       = useState(false)
  const [error,        setError]        = useState<string | null>(null)

  useEffect(() => {
    Promise.all([lecturerApi.materials(), lecturerApi.topics()])
      .then(([mats, tops]) => { setMaterials(mats); setTopics(tops) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (!form.topic_id) { setSubtopics([]); return }
    lecturerApi.topicSubtopics(Number(form.topic_id)).then(setSubtopics).catch(() => setSubtopics([]))
  }, [form.topic_id])

  const setField = (field: keyof CreateMaterialPayload) => (val: any) =>
    setForm(f => ({ ...f, [field]: val }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSaving(true)
    try {
      const payload = {
        ...form,
        topic_id:         Number(form.topic_id),
        duration_minutes: form.duration_minutes ? Number(form.duration_minutes) : undefined,
        description:      form.description     || undefined,
        external_url:     form.external_url    || undefined,
        tags:             form.tags            || undefined,
        keywords:         form.keywords        || undefined,
        subtopic_id:      form.subtopic_id     || undefined,
      }
      const mat = await lecturerApi.createMaterial(payload, selectedFile ?? undefined)
      setMaterials(prev => [mat, ...prev])
      setForm(blank())
      setSelectedFile(null)
      setShowForm(false)
    } catch (err: any) {
      setError(err?.data?.message || 'Failed to save material.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: number) => {
    await lecturerApi.deleteMaterial(id).catch(() => {})
    setMaterials(prev => prev.filter(m => m.material_id !== id))
  }

  if (loading) return (
    <div className="space-y-3">
      <Skeleton className="h-8 w-48" />
      {[1, 2, 3].map(i => <Skeleton key={i} className="h-20 w-full" />)}
    </div>
  )

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Learning Materials</h1>
          <p className="text-muted-foreground text-sm">
            {materials.length} material{materials.length !== 1 ? 's' : ''} uploaded
          </p>
        </div>
        <Button onClick={() => { setShowForm(!showForm); setError(null) }} className="gap-2">
          <Plus className="w-4 h-4" /> Add Material
        </Button>
      </div>

      {showForm && (
        <Card className="border-primary/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">New Material</CardTitle>
          </CardHeader>
          <CardContent>
            {error && <p className="text-destructive text-sm mb-3">{error}</p>}
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2 space-y-1.5">
                <Label>Title</Label>
                <Input
                  required value={form.title}
                  onChange={e => setField('title')(e.target.value)}
                  placeholder="Introduction to Matrices"
                />
              </div>

              <div className="space-y-1.5">
                <Label>Topic</Label>
                <Select
                  required
                  value={form.topic_id ? String(form.topic_id) : ''}
                  onValueChange={v => setField('topic_id')(Number(v))}
                >
                  <SelectTrigger><SelectValue placeholder="Select topic" /></SelectTrigger>
                  <SelectContent>
                    {topics.map(t => (
                      <SelectItem key={t.topic_id} value={String(t.topic_id)}>
                        {t.topic_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label>Subtopic <span className="text-muted-foreground font-normal text-xs">(for recommendation matching)</span></Label>
                <Select
                  value={form.subtopic_id ?? ''}
                  onValueChange={v => setField('subtopic_id')(v === 'none' ? '' : v)}
                  disabled={subtopics.length === 0}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={subtopics.length === 0 ? 'Select topic first' : 'None (all subtopics)'} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None (all subtopics)</SelectItem>
                    {subtopics.map(s => (
                      <SelectItem key={s.topic_id} value={String(s.topic_id)}>
                        {s.topic_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label>Content Type</Label>
                <Select value={form.content_type} onValueChange={setField('content_type')}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {['pdf', 'video', 'article', 'exercise', 'example', 'summary'].map(t => (
                      <SelectItem key={t} value={t} className="capitalize">{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label>Difficulty</Label>
                <Select value={form.difficulty_level} onValueChange={setField('difficulty_level')}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {['basic', 'intermediate', 'advanced'].map(d => (
                      <SelectItem key={d} value={d} className="capitalize">{d}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label>Duration (minutes)</Label>
                <Input
                  type="number" min="1"
                  value={form.duration_minutes ?? ''}
                  onChange={e => setField('duration_minutes')(e.target.value ? Number(e.target.value) : undefined)}
                  placeholder="15"
                />
              </div>

              <div className="md:col-span-2 flex items-start gap-2.5 rounded-lg border border-border p-3">
                <Checkbox
                  id="is_remedial"
                  checked={form.is_remedial}
                  onCheckedChange={checked => setField('is_remedial')(checked === true)}
                  className="mt-0.5"
                />
                <Label htmlFor="is_remedial" className="font-medium cursor-pointer">
                  Remedial only
                </Label>
              </div>

              {form.content_type === 'pdf' ? (
                <div className="md:col-span-2 space-y-1.5">
                  <Label>PDF File</Label>
                  {selectedFile ? (
                    <div className="flex items-center gap-3 p-3 rounded-lg border border-primary/30 bg-primary/5">
                      <FileText className="w-5 h-5 text-primary flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{selectedFile.name}</p>
                        <p className="text-xs text-muted-foreground">{(selectedFile.size / 1024 / 1024).toFixed(1)} MB</p>
                      </div>
                      <Button type="button" variant="ghost" size="sm" onClick={() => setSelectedFile(null)}>
                        ✕
                      </Button>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center gap-2 p-6 rounded-lg border-2 border-dashed border-border hover:border-primary/40 cursor-pointer transition-colors">
                      <Upload className="w-6 h-6 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">Click to upload PDF (max 20 MB)</span>
                      <input
                        type="file"
                        accept="application/pdf"
                        className="hidden"
                        onChange={e => setSelectedFile(e.target.files?.[0] ?? null)}
                      />
                    </label>
                  )}
                  <p className="text-xs text-muted-foreground">Or paste a link instead:</p>
                  <Input
                    value={form.external_url ?? ''}
                    onChange={e => setField('external_url')(e.target.value)}
                    placeholder="https://..."
                    disabled={!!selectedFile}
                  />
                </div>
              ) : (
                <div className="md:col-span-2 space-y-1.5">
                  <Label>URL (YouTube, article link, etc.)</Label>
                  <Input
                    value={form.external_url ?? ''}
                    onChange={e => setField('external_url')(e.target.value)}
                    placeholder="https://..."
                  />
                </div>
              )}

              <div className="md:col-span-2 space-y-1.5">
                <Label>Description</Label>
                <Textarea
                  rows={2}
                  value={form.description ?? ''}
                  onChange={e => setField('description')(e.target.value)}
                  placeholder="Brief description..."
                />
              </div>

              <div className="md:col-span-2 rounded-lg border border-border p-3">
                <PillPicker
                  label="Tags"
                  value={form.tags ?? ''}
                  onChange={setField('tags')}
                  groups={TAG_GROUPS}
                />
              </div>

              <div className="md:col-span-2 rounded-lg border border-border p-3">
                <PillPicker
                  label="Keywords"
                  hint="(please choose from the suggested keywords below)"
                  value={form.keywords ?? ''}
                  onChange={setField('keywords')}
                  groups={KEYWORD_GROUPS}
                  searchable
                />
              </div>

              <div className="md:col-span-2 flex justify-end gap-3 pt-2">
                <Button
                  type="button" variant="outline"
                  onClick={() => { setShowForm(false); setForm(blank()); setError(null) }}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={saving}>
                  {saving ? 'Saving…' : 'Save Material'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {materials.length === 0 && !showForm ? (
        <Card>
          <CardContent className="pt-8 pb-8 text-center text-muted-foreground">
            No materials uploaded yet. Click &quot;Add Material&quot; to get started.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {materials.map(mat => (
            <Card key={mat.material_id} className="hover:border-primary/30 transition-colors">
              <CardContent className="pt-4 pb-4">
                <div className="flex items-start gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="font-semibold text-foreground">{mat.title}</span>
                      <Badge variant="outline" className={typeColor[mat.content_type] ?? ''}>
                        {mat.content_type}
                      </Badge>
                      <Badge variant="outline" className="text-xs capitalize text-muted-foreground">
                        {mat.difficulty_level}
                      </Badge>
                      {mat.topic && (
                        <Badge variant="outline" className="text-xs text-primary border-primary/30">
                          {mat.topic.topic_name}
                        </Badge>
                      )}
                    </div>
                    {mat.description && (
                      <p className="text-sm text-muted-foreground line-clamp-1">{mat.description}</p>
                    )}
                    <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                      {mat.duration_minutes && <span>{mat.duration_minutes} min</span>}
                      {mat.is_remedial && <span className="text-amber-600">Remedial</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    {(mat.file_url || mat.external_url) && (
                      <Button variant="ghost" size="sm" asChild>
                        <a href={mat.file_url ?? mat.external_url!} target="_blank" rel="noreferrer">
                          {mat.file_url ? <FileText className="w-4 h-4" /> : <ExternalLink className="w-4 h-4" />}
                        </a>
                      </Button>
                    )}
                    <Button
                      variant="ghost" size="sm"
                      className="text-destructive hover:text-destructive"
                      onClick={() => handleDelete(mat.material_id)}
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
