"use client"

import Image from "next/image"
import { Sparkles } from "lucide-react"
import { Card } from "@/components/ui/card"

interface WelcomeBannerProps {
  studentName: string
}

export function WelcomeBanner({ studentName }: WelcomeBannerProps) {
  return (
    <Card className="relative overflow-hidden bg-gradient-to-r from-primary/10 via-accent/10 to-primary/5 border-primary/20 p-6">
      <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-1/4 w-24 h-24 bg-accent/5 rounded-full translate-y-1/2" />

      <div className="relative flex items-center gap-6">
        <div className="flex-shrink-0">
          <Image
            src="/earlyDesign/Gemini_Generated_Image_fvbx3efvbx3efvbx-removebg-preview.png"
            alt="QEDU Mascot"
            width={120}
            height={120}
            className="object-contain drop-shadow-lg hover:scale-105 transition-transform duration-300"
            priority
          />
        </div>

        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="w-5 h-5 text-primary" />
            <span className="text-sm font-medium text-muted-foreground">
              QEDU Learning Hub
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
            Welcome, <span className="text-primary">{studentName}</span>!
          </h1>
          <p className="text-muted-foreground">
            Ready to continue your Linear Algebra journey? Let&apos;s make progress today!
          </p>
        </div>
      </div>
    </Card>
  )
}
