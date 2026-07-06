"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"
import { BookOpen, CheckCircle2, Sparkles, Circle } from "lucide-react"

export type MasteryLevel = "not-started" | "learning" | "practicing" | "mastered"

interface TopicMasteryCardProps {
  topic: string
  description: string
  masteryLevel: MasteryLevel
  icon: React.ReactNode
  practicesCompleted: number
  coursesCompleted: number
  coursesTotal?: number
}

const masteryConfig: Record<MasteryLevel, { 
  label: string
  bgColor: string
  textColor: string
  borderColor: string
  progressColor: string
  icon: React.ReactNode
}> = {
  "not-started": {
    label: "Not Started",
    bgColor: "bg-not-started/10",
    textColor: "text-not-started",
    borderColor: "border-not-started/30",
    progressColor: "[&>div]:bg-not-started",
    icon: <Circle className="w-3 h-3" />
  },
  "learning": {
    label: "Learning",
    bgColor: "bg-learning/10",
    textColor: "text-learning",
    borderColor: "border-learning/30",
    progressColor: "[&>div]:bg-learning",
    icon: <BookOpen className="w-3 h-3" />
  },
  "practicing": {
    label: "Practicing",
    bgColor: "bg-practicing/10",
    textColor: "text-practicing",
    borderColor: "border-practicing/30",
    progressColor: "[&>div]:bg-practicing",
    icon: <Sparkles className="w-3 h-3" />
  },
  "mastered": {
    label: "Mastered",
    bgColor: "bg-mastered/10",
    textColor: "text-mastered",
    borderColor: "border-mastered/30",
    progressColor: "[&>div]:bg-mastered",
    icon: <CheckCircle2 className="w-3 h-3" />
  }
}

export function TopicMasteryCard({
  topic,
  description,
  masteryLevel,
  icon,
  practicesCompleted,
  coursesCompleted,
  coursesTotal = 4,
}: TopicMasteryCardProps) {
  const config       = masteryConfig[masteryLevel]
  const practicesPct = Math.min(practicesCompleted / 10 * 100, 100)
  const coursesPct   = Math.min(coursesCompleted / coursesTotal * 100, 100)
  const overallPct   = Math.round((practicesPct + coursesPct) / 2)

  return (
    <Card className={cn(
      "group relative overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1 cursor-pointer",
      "border-2",
      config.borderColor
    )}>
      {/* Decorative corner accent */}
      <div className={cn(
        "absolute top-0 right-0 w-16 h-16 -translate-y-8 translate-x-8 rounded-full opacity-20",
        masteryLevel === "mastered" && "bg-mastered",
        masteryLevel === "practicing" && "bg-practicing",
        masteryLevel === "learning" && "bg-learning",
        masteryLevel === "not-started" && "bg-not-started"
      )} />
      
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          {/* Topic icon */}
          <div className={cn(
            "flex items-center justify-center w-12 h-12 rounded-xl transition-transform group-hover:scale-110",
            config.bgColor
          )}>
            <div className={config.textColor}>
              {icon}
            </div>
          </div>
          
          {/* Mastery badge */}
          <Badge 
            variant="outline" 
            className={cn(
              "gap-1 font-medium",
              config.bgColor,
              config.textColor,
              config.borderColor
            )}
          >
            {config.icon}
            {config.label}
          </Badge>
        </div>
        
        <CardTitle className="text-lg mt-3 text-foreground group-hover:text-primary transition-colors">
          {topic}
        </CardTitle>
        <p className="text-sm text-muted-foreground line-clamp-2">
          {description}
        </p>
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className="space-y-3">
          {/* Overall progress (avg of practices + courses) */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Progress</span>
              <span className={cn("font-semibold", config.textColor)}>{overallPct}%</span>
            </div>
            <Progress value={overallPct} className={cn("h-2", config.progressColor)} />
          </div>

          {/* Practices */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Practices</span>
              <span>{Math.min(practicesCompleted, 10)} of 10 completed</span>
            </div>
            <Progress
              value={Math.min(practicesCompleted / 10 * 100, 100)}
              className={cn("h-1.5", config.progressColor)}
            />
          </div>

          {/* Courses */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Courses</span>
              <span>{Math.min(coursesCompleted, coursesTotal)} of {coursesTotal} completed</span>
            </div>
            <Progress
              value={Math.min(coursesCompleted / coursesTotal * 100, 100)}
              className="h-1.5 [&>div]:bg-sky-400"
            />
            {coursesCompleted >= coursesTotal && practicesCompleted >= 10 && (
              <div className="flex justify-end">
                <span className="flex items-center gap-1 text-xs text-mastered">
                  <Sparkles className="w-3 h-3" />
                  Complete!
                </span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
