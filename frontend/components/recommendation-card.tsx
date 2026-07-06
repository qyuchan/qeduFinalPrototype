"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { 
  Video, 
  FileText, 
  HelpCircle, 
  Gamepad2,
  Check,
  X,
  Sparkles
} from "lucide-react"

export type MaterialType = "video" | "reading" | "quiz" | "practice"

interface RecommendationCardProps {
  title: string
  materialType: MaterialType
  matchPercentage: number
  topic: string
  duration?: string
  onAccept: () => void
  onDismiss: () => void
}

const materialConfig: Record<MaterialType, {
  icon: React.ReactNode
  label: string
  bgColor: string
  textColor: string
}> = {
  video: {
    icon: <Video className="w-5 h-5" />,
    label: "Video",
    bgColor: "bg-practicing/10",
    textColor: "text-practicing"
  },
  reading: {
    icon: <FileText className="w-5 h-5" />,
    label: "Reading",
    bgColor: "bg-learning/10",
    textColor: "text-learning"
  },
  quiz: {
    icon: <HelpCircle className="w-5 h-5" />,
    label: "Quiz",
    bgColor: "bg-accent/10",
    textColor: "text-accent"
  },
  practice: {
    icon: <Gamepad2 className="w-5 h-5" />,
    label: "Practice",
    bgColor: "bg-mastered/10",
    textColor: "text-mastered"
  }
}

export function RecommendationCard({
  title,
  materialType,
  matchPercentage,
  topic,
  duration,
  onAccept,
  onDismiss
}: RecommendationCardProps) {
  const config = materialConfig[materialType]
  
  const getMatchColor = () => {
    if (matchPercentage >= 90) return "text-mastered bg-mastered/10"
    if (matchPercentage >= 75) return "text-practicing bg-practicing/10"
    return "text-learning bg-learning/10"
  }

  return (
    <Card className="group p-4 transition-all duration-200 hover:shadow-md border-border/50 hover:border-primary/30">
      <div className="flex items-start gap-3">
        {/* Material type icon */}
        <div className={cn(
          "flex items-center justify-center w-10 h-10 rounded-lg flex-shrink-0",
          config.bgColor
        )}>
          <div className={config.textColor}>
            {config.icon}
          </div>
        </div>
        
        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="outline" className="text-xs font-normal">
              {topic}
            </Badge>
            {duration && (
              <span className="text-xs text-muted-foreground">{duration}</span>
            )}
          </div>
          
          <h4 className="font-medium text-sm text-foreground line-clamp-2 mb-2 group-hover:text-primary transition-colors">
            {title}
          </h4>
          
          {/* Match percentage */}
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-3 h-3 text-primary" />
            <span className={cn(
              "text-xs font-medium px-2 py-0.5 rounded-full",
              getMatchColor()
            )}>
              {matchPercentage}% match
            </span>
          </div>
        </div>
      </div>
      
      {/* Action buttons */}
      <div className="flex items-center gap-2 mt-4">
        <Button 
          size="sm" 
          className="flex-1 gap-1.5"
          onClick={onAccept}
        >
          <Check className="w-4 h-4" />
          Accept
        </Button>
        <Button 
          size="sm" 
          variant="outline"
          className="flex-shrink-0"
          onClick={onDismiss}
        >
          <X className="w-4 h-4" />
        </Button>
      </div>
    </Card>
  )
}
