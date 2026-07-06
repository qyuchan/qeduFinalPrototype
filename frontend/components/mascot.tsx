"use client"

import Image from "next/image"
import { cn } from "@/lib/utils"

interface MascotProps {
  variant?: "wizard" | "student" | "teacher"
  size?: "sm" | "md" | "lg" | "xl"
  className?: string
  animate?: boolean
}

export function Mascot({ variant = "wizard", size = "md", className, animate = true }: MascotProps) {
  const sizeClasses = {
    sm: "w-12 h-12",
    md: "w-20 h-20",
    lg: "w-28 h-28",
    xl: "w-36 h-36"
  }

  const sizePx = {
    sm: 48,
    md: 80,
    lg: 112,
    xl: 144
  }

  const getImageSrc = () => {
    switch (variant) {
      case "student":
        return "/earlyDesign/chibi4.PNG"
      case "teacher":
        return "/earlyDesign/chibi2-removebg-preview.png"
      default:
        return "/earlyDesign/Gemini_Generated_Image_fvbx3efvbx3efvbx-removebg-preview.png"
    }
  }

  return (
    <div 
      className={cn(
        "relative flex-shrink-0", 
        sizeClasses[size], 
        animate && "hover:scale-110 transition-transform duration-300",
        className
      )}
    >
      <Image
        src={getImageSrc()}
        alt="QEDU Mascot"
        width={sizePx[size]}
        height={sizePx[size]}
        className={cn(
          "object-contain drop-shadow-lg",
          animate && "animate-bounce-gentle"
        )}
        priority
      />
    </div>
  )
}
