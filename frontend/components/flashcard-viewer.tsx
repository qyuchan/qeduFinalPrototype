"use client"

import { useState, useCallback } from "react"
import { ArrowLeft, ArrowRight, RotateCcw, Check, X, Lightbulb } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"

export interface Flashcard {
  id: number
  front: string
  back: string
  hint?: string
  example?: string
}

interface FlashcardViewerProps {
  cards: Flashcard[]
  chapterTitle: string
  onBack?: () => void
}

export function FlashcardViewer({ cards, chapterTitle, onBack }: FlashcardViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isFlipped, setIsFlipped] = useState(false)
  const [showHint, setShowHint] = useState(false)
  const [knownCards, setKnownCards] = useState<Set<number>>(new Set())
  const [reviewCards, setReviewCards] = useState<Set<number>>(new Set())

  const currentCard = cards[currentIndex]
  const progress = ((knownCards.size + reviewCards.size) / cards.length) * 100

  const handleFlip = useCallback(() => {
    setIsFlipped(prev => !prev)
    setShowHint(false)
  }, [])

  const handleNext = useCallback(() => {
    if (currentIndex < cards.length - 1) {
      setCurrentIndex(currentIndex + 1)
      setIsFlipped(false)
      setShowHint(false)
    }
  }, [currentIndex, cards.length])

  const handlePrev = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1)
      setIsFlipped(false)
      setShowHint(false)
    }
  }, [currentIndex])

  const markAsKnown = useCallback(() => {
    setKnownCards(prev => { const s = new Set(prev); s.add(currentCard.id); return s })
    setReviewCards(prev => { const s = new Set(prev); s.delete(currentCard.id); return s })
    handleNext()
  }, [currentCard.id, handleNext])

  const markForReview = useCallback(() => {
    setReviewCards(prev => { const s = new Set(prev); s.add(currentCard.id); return s })
    setKnownCards(prev => { const s = new Set(prev); s.delete(currentCard.id); return s })
    handleNext()
  }, [currentCard.id, handleNext])

  const resetProgress = useCallback(() => {
    setKnownCards(new Set())
    setReviewCards(new Set())
    setCurrentIndex(0)
    setIsFlipped(false)
    setShowHint(false)
  }, [])

  const cardStatus = knownCards.has(currentCard.id)
    ? "known"
    : reviewCards.has(currentCard.id)
      ? "review"
      : "unseen"

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="rounded-full" onClick={onBack}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-foreground">{chapterTitle}</h1>
            <p className="text-sm text-muted-foreground">Flashcard Study Mode</p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={resetProgress} className="gap-2">
          <RotateCcw className="w-4 h-4" />
          Reset
        </Button>
      </div>

      {/* Progress Section */}
      <Card className="p-4 mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-foreground">Progress</span>
          <span className="text-sm text-muted-foreground">
            {knownCards.size} known · {reviewCards.size} to review · {cards.length - knownCards.size - reviewCards.size} remaining
          </span>
        </div>
        <Progress value={progress} className="h-2" />
        <div className="flex justify-between mt-2 text-xs text-muted-foreground">
          <span>Card {currentIndex + 1} of {cards.length}</span>
          <span>{Math.round(progress)}% complete</span>
        </div>
      </Card>

      {/* Flashcard */}
      <div className="mb-6" style={{ perspective: "1000px" }}>
        <div
          onClick={handleFlip}
          className="relative w-full min-h-[300px] md:min-h-[350px] cursor-pointer transition-[transform] duration-500"
          style={{
            transformStyle: "preserve-3d",
            transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)",
          }}
        >
          {/* Front */}
          <Card
            className={cn(
              "absolute inset-0 p-6 md:p-8 flex flex-col",
              cardStatus === "known" && "border-mastered/50 bg-mastered/5",
              cardStatus === "review" && "border-learning/50 bg-learning/5"
            )}
            style={{ backfaceVisibility: "hidden" }}
          >
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-medium px-2 py-1 rounded-full bg-primary/10 text-primary">
                Question
              </span>
              {cardStatus !== "unseen" && (
                <span className={cn(
                  "text-xs font-medium px-2 py-1 rounded-full",
                  cardStatus === "known" ? "bg-mastered/20 text-mastered" : "bg-learning/20 text-learning"
                )}>
                  {cardStatus === "known" ? "Known" : "Review"}
                </span>
              )}
            </div>
            <div className="flex-1 flex items-center justify-center">
              <p className="text-lg md:text-xl text-center font-medium text-foreground leading-relaxed">
                {currentCard.front}
              </p>
            </div>
            <p className="text-center text-sm text-muted-foreground mt-4">
              Click to reveal answer
            </p>
          </Card>

          {/* Back */}
          <Card
            className="absolute inset-0 p-6 md:p-8 flex flex-col bg-primary/5 border-primary/20"
            style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
          >
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-medium px-2 py-1 rounded-full bg-accent/20 text-accent-foreground">
                Answer
              </span>
            </div>
            <div className="flex-1 flex flex-col items-center justify-center gap-4">
              <p className="text-lg md:text-xl text-center font-medium text-foreground leading-relaxed">
                {currentCard.back}
              </p>
              {currentCard.example && (
                <div className="mt-4 p-3 bg-card rounded-lg border w-full">
                  <p className="text-xs font-medium text-muted-foreground mb-1">Example:</p>
                  <p className="text-sm text-foreground">{currentCard.example}</p>
                </div>
              )}
            </div>
            <p className="text-center text-sm text-muted-foreground mt-4">
              Click to see question
            </p>
          </Card>
        </div>
      </div>

      {/* Hint */}
      {currentCard.hint && !isFlipped && (
        <div className="mb-6">
          {showHint ? (
            <Card className="p-4 bg-learning/10 border-learning/30">
              <div className="flex items-start gap-3">
                <Lightbulb className="w-5 h-5 text-learning flex-shrink-0 mt-0.5" />
                <p className="text-sm text-foreground">{currentCard.hint}</p>
              </div>
            </Card>
          ) : (
            <Button
              variant="outline"
              className="w-full gap-2 text-learning border-learning/30 hover:bg-learning/10"
              onClick={() => setShowHint(true)}
            >
              <Lightbulb className="w-4 h-4" />
              Show Hint
            </Button>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-col gap-4">
        {isFlipped && (
          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1 gap-2 border-learning text-learning hover:bg-learning/10"
              onClick={markForReview}
            >
              <X className="w-4 h-4" />
              Need Review
            </Button>
            <Button
              className="flex-1 gap-2 bg-mastered hover:bg-mastered/90 text-white"
              onClick={markAsKnown}
            >
              <Check className="w-4 h-4" />
              Got It!
            </Button>
          </div>
        )}

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <Button variant="ghost" onClick={handlePrev} disabled={currentIndex === 0} className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            Previous
          </Button>
          <div className="flex gap-1">
            {cards.map((_, idx) => (
              <button
                key={idx}
                onClick={() => { setCurrentIndex(idx); setIsFlipped(false); setShowHint(false) }}
                className={cn(
                  "h-2 rounded-full transition-all",
                  idx === currentIndex
                    ? "w-6 bg-primary"
                    : knownCards.has(cards[idx].id)
                      ? "w-2 bg-mastered"
                      : reviewCards.has(cards[idx].id)
                        ? "w-2 bg-learning"
                        : "w-2 bg-muted hover:bg-muted-foreground/30"
                )}
              />
            ))}
          </div>
          <Button variant="ghost" onClick={handleNext} disabled={currentIndex === cards.length - 1} className="gap-2">
            Next
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
