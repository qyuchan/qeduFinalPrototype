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

// Force light theme on this page: must override both --var and --color-var because
// Tailwind v4 @theme inline resolves --color-* from :root, not from child elements.
const lightVars: React.CSSProperties = {
  "--background":               "oklch(0.85 0.08 210)",
  "--foreground":               "oklch(0.2 0.05 250)",
  "--card":                     "oklch(0.98 0.005 210)",
  "--card-foreground":          "oklch(0.2 0.05 250)",
  "--popover":                  "oklch(0.98 0.005 210)",
  "--popover-foreground":       "oklch(0.2 0.05 250)",
  "--primary":                  "oklch(0.7 0.12 200)",
  "--primary-foreground":       "oklch(0.98 0.005 210)",
  "--secondary":                "oklch(0.88 0.06 205)",
  "--secondary-foreground":     "oklch(0.25 0.05 250)",
  "--muted":                    "oklch(0.82 0.05 210)",
  "--muted-foreground":         "oklch(0.4 0.03 250)",
  "--accent":                   "oklch(0.78 0.1 200)",
  "--accent-foreground":        "oklch(0.2 0.05 250)",
  "--destructive":              "oklch(0.577 0.245 27.325)",
  "--destructive-foreground":   "oklch(1 0 0)",
  "--border":                   "oklch(0.78 0.06 210)",
  "--input":                    "oklch(0.95 0.02 210)",
  "--ring":                     "oklch(0.7 0.12 200)",
  // Tailwind v4 --color-* aliases (used by utility classes like from-background)
  "--color-background":         "oklch(0.85 0.08 210)",
  "--color-foreground":         "oklch(0.2 0.05 250)",
  "--color-card":               "oklch(0.98 0.005 210)",
  "--color-card-foreground":    "oklch(0.2 0.05 250)",
  "--color-popover":            "oklch(0.98 0.005 210)",
  "--color-popover-foreground": "oklch(0.2 0.05 250)",
  "--color-primary":            "oklch(0.7 0.12 200)",
  "--color-primary-foreground": "oklch(0.98 0.005 210)",
  "--color-secondary":          "oklch(0.88 0.06 205)",
  "--color-secondary-foreground":"oklch(0.25 0.05 250)",
  "--color-muted":              "oklch(0.82 0.05 210)",
  "--color-muted-foreground":   "oklch(0.4 0.03 250)",
  "--color-accent":             "oklch(0.78 0.1 200)",
  "--color-accent-foreground":  "oklch(0.2 0.05 250)",
  "--color-destructive":        "oklch(0.577 0.245 27.325)",
  "--color-border":             "oklch(0.78 0.06 210)",
  "--color-input":              "oklch(0.95 0.02 210)",
  "--color-ring":               "oklch(0.7 0.12 200)",
} as React.CSSProperties

export default function LoginPage() {
  const { login, loading, error } = useAuth()
  const router = useRouter()
  const [identifier, setIdentifier] = useState('')
  const [password,   setPassword]   = useState('')

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await login(identifier, password)
      router.replace('/')
    } catch {}
  }

  return (
    <div
      style={{ ...lightVars, backgroundColor: "oklch(0.85 0.08 210)" }}
      className="min-h-screen flex items-center justify-center p-4"
    >
      <div className="w-full max-w-md space-y-6">
        {/* Logo */}
        <div className="flex flex-col items-center gap-3">
          <Image
            src="/earlyDesign/qeduLogo.png"
            alt="QEDU"
            width={180}
            height={180}
            className="object-contain drop-shadow-lg"
          />
          <div className="text-center">
            <h1 className="text-2xl font-extrabold text-foreground">Welcome to QEDU</h1>
            <p className="text-sm text-muted-foreground">Your adaptive Linear Algebra companion</p>
          </div>
        </div>

        <Card className="border-border shadow-xl">
          <CardHeader>
            <CardTitle>Sign In</CardTitle>
            <CardDescription>Enter your credentials to continue learning</CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <div className="bg-destructive/10 text-destructive text-sm rounded-lg p-3 mb-4">
                {error}
              </div>
            )}
            <form onSubmit={submit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="identifier">Email or Username</Label>
                <Input
                  id="identifier"
                  type="text"
                  required
                  value={identifier}
                  onChange={e => setIdentifier(e.target.value)}
                  placeholder="your@email.com or username"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Signing in…' : 'Sign In'}
              </Button>
            </form>
            <p className="text-center text-sm text-muted-foreground mt-4">
              No account?{' '}
              <Link href="/register" className="text-primary font-semibold hover:underline">
                Register here
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
