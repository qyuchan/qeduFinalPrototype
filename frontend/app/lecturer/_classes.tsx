"use client"

import { useEffect, useState, useCallback, useRef } from "react"
import { lecturerApi, type ClassRoom, type EnrolledStudent, type StudentSearchResult } from "@/lib/api/lecturer"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { Plus, Trash2, ArrowLeft, Users, Search, UserPlus, UserMinus } from "lucide-react"
import { cn } from "@/lib/utils"

// ─── Types ────────────────────────────────────────────────────────────────────

type View = { kind: 'list' } | { kind: 'detail'; classRoom: ClassRoom }

const blankForm = () => ({ class_name: '', semester: '1', academic_year: '', enrollment_limit: 40 })

// ─── Component ────────────────────────────────────────────────────────────────

export function ClassesPanel() {
  const [view,           setView]           = useState<View>({ kind: 'list' })
  const [classes,        setClasses]        = useState<ClassRoom[]>([])
  const [loading,        setLoading]        = useState(true)
  const [showForm,       setShowForm]       = useState(false)
  const [form,           setForm]           = useState(blankForm())
  const [saving,         setSaving]         = useState(false)
  const [formError,      setFormError]      = useState<string | null>(null)

  // Detail view state
  const [enrolled,       setEnrolled]       = useState<EnrolledStudent[]>([])
  const [detailLoading,  setDetailLoading]  = useState(false)
  const [searchQuery,    setSearchQuery]    = useState('')
  const [searchResults,  setSearchResults]  = useState<StudentSearchResult[]>([])
  const [searching,      setSearching]      = useState(false)
  const [enrollError,    setEnrollError]    = useState<string | null>(null)
  const [enrollingId,    setEnrollingId]    = useState<number | null>(null)

  useEffect(() => {
    lecturerApi.classes()
      .then(setClasses)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const openDetail = async (cls: ClassRoom) => {
    setView({ kind: 'detail', classRoom: cls })
    setEnrolled([])
    setEnrollError(null)
    setSearchQuery('')
    setSearchResults([])
    setDetailLoading(true)
    lecturerApi.classStudents(cls.class_id)
      .then(setEnrolled)
      .catch(() => {})
      .finally(() => setDetailLoading(false))
  }

  // ── Search students (debounced) ───────────────────────────────────────────

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handleSearchChange = useCallback((q: string) => {
    setSearchQuery(q)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (q.length < 2) { setSearchResults([]); return }
    debounceRef.current = setTimeout(async () => {
      setSearching(true)
      try {
        const results = await lecturerApi.searchStudents(q)
        const enrolledIds = new Set(enrolled.map(e => e.user_id))
        setSearchResults(results.filter(r => !enrolledIds.has(r.user_id)))
      } catch {}
      finally { setSearching(false) }
    }, 300)
  }, [enrolled])

  // ── Enroll student ────────────────────────────────────────────────────────

  const handleEnroll = async (student: StudentSearchResult) => {
    if (view.kind !== 'detail' || enrollingId === student.user_id) return
    setEnrollError(null)
    setEnrollingId(student.user_id)
    try {
      const e = await lecturerApi.enrollStudent(view.classRoom.class_id, student.user_id)
      setEnrolled(prev => [...prev, e])
      setSearchResults(prev => prev.filter(r => r.user_id !== student.user_id))
      setClasses(prev => prev.map(c =>
        c.class_id === view.classRoom.class_id
          ? { ...c, student_count: (c.student_count ?? 0) + 1 }
          : c
      ))
    } catch (err: any) {
      setEnrollError(err?.data?.message || 'Failed to enroll student.')
    } finally {
      setEnrollingId(null)
    }
  }

  // ── Unenroll student ──────────────────────────────────────────────────────

  const handleUnenroll = async (student: EnrolledStudent) => {
    if (view.kind !== 'detail') return
    try {
      await lecturerApi.unenrollStudent(view.classRoom.class_id, student.user_id)
      setEnrolled(prev => prev.filter(e => e.user_id !== student.user_id))
      setClasses(prev => prev.map(c =>
        c.class_id === view.classRoom.class_id
          ? { ...c, student_count: Math.max(0, (c.student_count ?? 1) - 1) }
          : c
      ))
    } catch {}
  }

  // ── Create class ──────────────────────────────────────────────────────────

  const handleCreateClass = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError(null)
    setSaving(true)
    try {
      const cls = await lecturerApi.createClass({
        ...form,
        enrollment_limit: Number(form.enrollment_limit),
      })
      setClasses(prev => [{ ...cls, student_count: 0 }, ...prev])
      setForm(blankForm())
      setShowForm(false)
    } catch (err: any) {
      setFormError(err?.data?.message || 'Failed to create class.')
    } finally {
      setSaving(false)
    }
  }

  // ── Delete class ──────────────────────────────────────────────────────────

  const handleDeleteClass = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation()
    await lecturerApi.deleteClass(id).catch(() => {})
    setClasses(prev => prev.filter(c => c.class_id !== id))
  }

  // ── Loading ───────────────────────────────────────────────────────────────

  if (loading) return (
    <div className="space-y-3">
      <Skeleton className="h-8 w-48" />
      {[1, 2, 3].map(i => <Skeleton key={i} className="h-24 w-full" />)}
    </div>
  )

  const semesterLabel = { '1': 'Semester 1', '2': 'Semester 2', '3': 'Semester 3', 'short': 'Short Semester' }

  // ── Detail view ───────────────────────────────────────────────────────────

  if (view.kind === 'detail') {
    const cls = view.classRoom
    return (
      <div className="space-y-6 max-w-3xl mx-auto">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => { setView({ kind: 'list' }); setSearchQuery(''); setSearchResults([]) }}>
            <ArrowLeft className="w-4 h-4 mr-1" /> Classes
          </Button>
          <div>
            <h1 className="text-xl font-bold">{cls.class_name}</h1>
            <p className="text-sm text-muted-foreground">
              {semesterLabel[cls.semester]} · {cls.academic_year} · {cls.enrollment_limit} seat limit
            </p>
          </div>
        </div>

        {/* Search to add students */}
        <Card className="border-primary/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <UserPlus className="w-4 h-4 text-primary" /> Add Students
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                className="pl-9"
                placeholder="Search by name, email or student ID…"
                value={searchQuery}
                onChange={e => handleSearchChange(e.target.value)}
              />
            </div>
            {enrollError && <p className="text-destructive text-sm">{enrollError}</p>}
            {searching && <p className="text-sm text-muted-foreground">Searching…</p>}
            {searchResults.length > 0 && (
              <div className="space-y-2">
                {searchResults.map(s => (
                  <div key={s.user_id} className="flex items-center justify-between p-2.5 rounded-lg bg-muted/50">
                    <div>
                      <p className="text-sm font-medium">{s.full_name}</p>
                      <p className="text-xs text-muted-foreground">{s.email}{s.student_id ? ` · ${s.student_id}` : ''}</p>
                    </div>
                    <Button size="sm" variant="outline" onClick={() => handleEnroll(s)} className="gap-1" disabled={enrollingId === s.user_id}>
                      <UserPlus className="w-3 h-3" /> {enrollingId === s.user_id ? 'Adding…' : 'Add'}
                    </Button>
                  </div>
                ))}
              </div>
            )}
            {searchQuery.length >= 2 && !searching && searchResults.length === 0 && (
              <p className="text-sm text-muted-foreground">No students found.</p>
            )}
          </CardContent>
        </Card>

        {/* Enrolled students */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Users className="w-4 h-4" />
              Enrolled Students
              <span className="text-muted-foreground font-normal">({enrolled.length})</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {detailLoading ? (
              <div className="space-y-2">
                {[1, 2, 3].map(i => <Skeleton key={i} className="h-12 w-full" />)}
              </div>
            ) : enrolled.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">
                No students enrolled yet. Search above to add students.
              </p>
            ) : (
              <div className="space-y-2">
                {enrolled.map((s, i) => (
                  <div key={s.user_id} className="flex items-center justify-between p-2.5 rounded-lg hover:bg-muted/40 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-full bg-primary/15 flex items-center justify-center text-xs font-bold text-primary flex-shrink-0">
                        {i + 1}
                      </div>
                      <div>
                        <p className="text-sm font-medium">{s.full_name}</p>
                        <p className="text-xs text-muted-foreground">{s.email}{s.student_id ? ` · ${s.student_id}` : ''}</p>
                      </div>
                    </div>
                    <Button
                      variant="ghost" size="sm"
                      className="text-destructive hover:text-destructive h-7 w-7 p-0"
                      onClick={() => handleUnenroll(s)}
                    >
                      <UserMinus className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    )
  }

  // ── List view ─────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Classes</h1>
          <p className="text-muted-foreground text-sm">{classes.length} class{classes.length !== 1 ? 'es' : ''}</p>
        </div>
        <Button onClick={() => { setShowForm(!showForm); setFormError(null) }} className="gap-2">
          <Plus className="w-4 h-4" /> New Class
        </Button>
      </div>

      {showForm && (
        <Card className="border-primary/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Create Class</CardTitle>
          </CardHeader>
          <CardContent>
            {formError && <p className="text-destructive text-sm mb-3">{formError}</p>}
            <form onSubmit={handleCreateClass} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2 space-y-1.5">
                <Label>Class Name</Label>
                <Input
                  required value={form.class_name}
                  onChange={e => setForm(f => ({ ...f, class_name: e.target.value }))}
                  placeholder="MAT423 Section 1 / Group A"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Semester</Label>
                <Select value={form.semester} onValueChange={v => setForm(f => ({ ...f, semester: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Semester 1</SelectItem>
                    <SelectItem value="2">Semester 2</SelectItem>
                    <SelectItem value="3">Semester 3</SelectItem>
                    <SelectItem value="short">Short Semester</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Academic Year</Label>
                <Input
                  required value={form.academic_year}
                  onChange={e => setForm(f => ({ ...f, academic_year: e.target.value }))}
                  placeholder="2024/2025"
                  pattern="\d{4}\/\d{4}"
                  title="Format: 2024/2025"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Enrollment Limit</Label>
                <Input
                  type="number" min="1" max="200" value={form.enrollment_limit}
                  onChange={e => setForm(f => ({ ...f, enrollment_limit: Number(e.target.value) }))}
                />
              </div>
              <div className="md:col-span-2 flex justify-end gap-3">
                <Button type="button" variant="outline" onClick={() => { setShowForm(false); setFormError(null) }}>
                  Cancel
                </Button>
                <Button type="submit" disabled={saving}>
                  {saving ? 'Creating…' : 'Create Class'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {classes.length === 0 && !showForm ? (
        <div className="flex flex-1 items-center justify-center min-h-[300px]">
          <div className="text-center space-y-2">
            <p className="font-semibold text-foreground">No classes yet</p>
            <p className="text-sm text-muted-foreground">
              Create a class to start enrolling students and assigning quizzes.
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {classes.map(cls => (
            <Card
              key={cls.class_id}
              className="cursor-pointer hover:border-primary/40 hover:shadow-md transition-all"
              onClick={() => openDetail(cls)}
            >
              <CardContent className="pt-4 pb-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-semibold text-foreground truncate">{cls.class_name}</span>
                      {!cls.is_active && (
                        <Badge variant="outline" className="text-xs text-muted-foreground">Inactive</Badge>
                      )}
                    </div>
                    <div className="space-y-1 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1.5">
                        <span>{semesterLabel[cls.semester]}</span>
                        <span>·</span>
                        <span>{cls.academic_year}</span>
                      </div>
                      <div className={cn(
                        "flex items-center gap-1.5 font-medium",
                        (cls.student_count ?? 0) >= cls.enrollment_limit ? "text-destructive" : "text-foreground"
                      )}>
                        <Users className="w-3.5 h-3.5" />
                        <span>{cls.student_count ?? 0} / {cls.enrollment_limit} students</span>
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="ghost" size="sm"
                    className="text-destructive hover:text-destructive h-7 w-7 p-0 flex-shrink-0"
                    onClick={e => handleDeleteClass(cls.class_id, e)}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
