"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import { GraduationCap, BookOpen } from "lucide-react"

export default function RegisterPage() {
  const { register, loading, error } = useAuth()
  const router = useRouter()
  const [role, setRole] = useState<'student' | 'lecturer'>('student')
  const [form, setForm] = useState({
    full_name: '', username: '', email: '', student_id: '',
    password: '', password_confirmation: '',
  })

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(f => ({ ...f, [field]: e.target.value }))

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await register({ ...form, role })
      router.replace(role === 'lecturer' ? '/lecturer' : '/')
    } catch {}
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-accent/10 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="flex flex-col items-center gap-3">
          <Image
            src="/earlyDesign/Gemini_Generated_Image_fvbx3efvbx3efvbx-removebg-preview.png"
            alt="QEDU"
            width={70}
            height={70}
            className="object-contain drop-shadow-lg"
          />
          <div className="text-center">
            <h1 className="text-2xl font-extrabold text-foreground">Create Account</h1>
            <p className="text-sm text-muted-foreground">Join QEDU and start your learning journey</p>
          </div>
        </div>

        <Card className="border-border shadow-xl">
          <CardHeader>
            <CardTitle>Register</CardTitle>
            <CardDescription>Fill in your details to get started</CardDescription>
          </CardHeader>
          <CardContent>
            {/* Role selector */}
            <div className="grid grid-cols-2 gap-2 mb-5">
              <button
                type="button"
                onClick={() => setRole('student')}
                className={cn(
                  "flex flex-col items-center gap-1.5 py-3 px-4 rounded-xl border-2 text-sm font-medium transition-all",
                  role === 'student'
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border text-muted-foreground hover:border-primary/40"
                )}
              >
                <GraduationCap className="w-5 h-5" />
                Student
              </button>
              <button
                type="button"
                onClick={() => setRole('lecturer')}
                className={cn(
                  "flex flex-col items-center gap-1.5 py-3 px-4 rounded-xl border-2 text-sm font-medium transition-all",
                  role === 'lecturer'
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border text-muted-foreground hover:border-primary/40"
                )}
              >
                <BookOpen className="w-5 h-5" />
                Lecturer
              </button>
            </div>

            {error && (
              <div className="bg-destructive/10 text-destructive text-sm rounded-lg p-3 mb-4">
                {error}
              </div>
            )}

            <form onSubmit={submit} className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="full_name">Full Name</Label>
                <Input
                  id="full_name" type="text" required
                  value={form.full_name} onChange={set('full_name')}
                  placeholder=""
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username" type="text" required
                  value={form.username} onChange={set('username')}
                  placeholder=""
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email" type="email" required
                  value={form.email} onChange={set('email')}
                  placeholder={role === 'lecturer' ? 'XXX@uitm.edu.my' : '2023XXXXXXX@student.uitm.edu.my'}
                />
              </div>

              {role === 'student' && (
                <div className="space-y-1.5">
                  <Label htmlFor="student_id">Student ID</Label>
                  <Input
                    id="student_id" type="text"
                    value={form.student_id} onChange={set('student_id')}
                    placeholder="2023XXXXXXX"
                  />
                </div>
              )}

              <div className="space-y-1.5">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password" type="password" required autoComplete="new-password"
                  value={form.password} onChange={set('password')}
                  placeholder="min. 8 characters"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="password_confirmation">Confirm Password</Label>
                <Input
                  id="password_confirmation" type="password" required autoComplete="new-password"
                  value={form.password_confirmation} onChange={set('password_confirmation')}
                  placeholder="••••••••"
                />
              </div>

              <Button type="submit" className="w-full mt-2" disabled={loading}>
                {loading ? 'Creating account…' : `Register as ${role === 'lecturer' ? 'Lecturer' : 'Student'}`}
              </Button>
            </form>

            <p className="text-center text-sm text-muted-foreground mt-4">
              Already have an account?{' '}
              <Link href="/login" className="text-primary font-semibold hover:underline">
                Sign in
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
