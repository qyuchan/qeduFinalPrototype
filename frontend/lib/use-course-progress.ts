"use client"

import { useState, useEffect } from "react"
import { progressApi } from "@/lib/api/progress"

export const TOPIC_SUBTOPICS: Record<string, string[]> = {
  matri:       ["1.1", "1.2", "1.3", "1.4"],
  linear:      ["2.1", "2.2", "2.3", "2.4"],
  determinant: ["3.1", "3.2", "3.3", "3.4"],
}

export function topicKeyword(topicName: string): string {
  const n = topicName.toLowerCase()
  if (n.includes("matri"))       return "matri"
  if (n.includes("determinant")) return "determinant"
  return "linear"
}

export function useCourseProgress() {
  const [completed, setCompleted] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem("course_progress")
      return new Set<string>(JSON.parse(saved ?? "[]"))
    } catch { return new Set<string>() }
  })

  // On mount, fetch from DB and overwrite localStorage - keeps state fresh after resets
  useEffect(() => {
    progressApi.getCompleted()
      .then(ids => {
        const next = new Set<string>(ids)
        setCompleted(next)
        localStorage.setItem("course_progress", JSON.stringify(ids))
      })
      .catch(() => {/* offline: keep localStorage state */})
  }, [])

  const markComplete = (subtopicId: string, topicId?: number) => {
    setCompleted(prev => {
      const next = new Set(prev)
      next.add(subtopicId)
      localStorage.setItem("course_progress", JSON.stringify([...next]))
      return next
    })
    if (topicId !== undefined) {
      progressApi.markComplete(subtopicId, topicId).catch(() => {})
    }
  }

  const markIncomplete = (subtopicId: string) => {
    setCompleted(prev => {
      const next = new Set(prev)
      next.delete(subtopicId)
      localStorage.setItem("course_progress", JSON.stringify([...next]))
      return next
    })
    progressApi.markIncomplete(subtopicId).catch(() => {})
  }

  return { completed, markComplete, markIncomplete }
}
