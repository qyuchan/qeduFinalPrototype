"use client"

import { MathText } from "@/components/math-text"
import { cn } from "@/lib/utils"

// ── Matrix display components ─────────────────────────────────────────────────

export function Matrix({ data }: { data: (string | number)[][] }) {
  const n = data.length
  const fs = n <= 1 ? "1.3em" : n === 2 ? "1.9em" : n === 3 ? "2.5em" : "3.1em"
  return (
    <span className="inline-flex items-center align-middle mx-1 my-1">
      <span style={{ fontSize: fs, lineHeight: 0.78, fontWeight: 100 }}>(</span>
      <span className="inline-flex flex-col py-0.5">
        {data.map((row, i) => (
          <span key={i} className="flex">
            {row.map((cell, j) => (
              <span key={j} className="font-mono text-sm px-1.5 min-w-[1.8rem] text-center">{cell}</span>
            ))}
          </span>
        ))}
      </span>
      <span style={{ fontSize: fs, lineHeight: 0.78, fontWeight: 100 }}>)</span>
    </span>
  )
}

export function AugMatrix({ left, right }: { left: (string | number)[][]; right: (string | number)[] }) {
  const n = left.length
  const fs = n <= 1 ? "1.3em" : n === 2 ? "1.9em" : "2.5em"
  return (
    <span className="inline-flex items-center align-middle mx-1 my-1">
      <span style={{ fontSize: fs, lineHeight: 0.78, fontWeight: 100 }}>(</span>
      <span className="inline-flex flex-col py-0.5">
        {left.map((row, i) => (
          <span key={i} className="flex items-center">
            {row.map((cell, j) => (
              <span key={j} className="font-mono text-sm px-1.5 min-w-[1.8rem] text-center">{cell}</span>
            ))}
            <span className="border-l border-foreground/50 mx-1 self-stretch" />
            <span className="font-mono text-sm px-1.5 min-w-[1.8rem] text-center">{right[i]}</span>
          </span>
        ))}
      </span>
      <span style={{ fontSize: fs, lineHeight: 0.78, fontWeight: 100 }}>)</span>
    </span>
  )
}

// ── Styled section boxes ──────────────────────────────────────────────────────

export function DefBox({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 space-y-2">
      <p className="text-xs font-bold uppercase tracking-wider text-primary">
        {title ? `Definition: ${title}` : 'Definition'}
      </p>
      <div className="text-sm text-foreground space-y-2">{children}</div>
    </div>
  )
}

export function ExBox({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4 space-y-2">
      <p className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
        {title ? `Example: ${title}` : 'Example'}
      </p>
      <div className="text-sm text-foreground space-y-2">{children}</div>
    </div>
  )
}

export function ThmBox({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-violet-500/30 bg-violet-500/5 p-4 space-y-2">
      <p className="text-xs font-bold uppercase tracking-wider text-violet-600 dark:text-violet-400">
        {title ? `Theorem: ${title}` : 'Theorem'}
      </p>
      <div className="text-sm text-foreground space-y-1">{children}</div>
    </div>
  )
}

export function NoteBox({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-amber-400/30 bg-amber-400/5 p-3 space-y-1">
      <p className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">Note</p>
      <div className="text-sm text-foreground">{children}</div>
    </div>
  )
}

export function RuleBox({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-border bg-muted/40 px-4 py-3 font-mono text-sm">
      {children}
    </div>
  )
}

export function StepBox({ n, label, children }: { n: number; label: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-3 items-start">
      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/15 text-primary text-xs font-bold flex items-center justify-center mt-0.5">
        {n}
      </span>
      <div className="flex-1 space-y-1">
        <p className="text-xs font-semibold text-primary uppercase tracking-wide">{label}</p>
        <div className="text-sm">{children}</div>
      </div>
    </div>
  )
}

// ── Matrix parsers ────────────────────────────────────────────────────────────

function parseMatrix(text: string): (string | number)[][] {
  return text.trim().split(';').map(row =>
    row.split(',').map(cell => cell.trim())
  )
}

function parseAugMatrix(text: string): { left: (string | number)[][]; right: (string | number)[] } {
  // Format: "a,b;c,d|e,f" - rows separated by ;, | splits left cols from right constants
  const pipeIdx = text.lastIndexOf('|')
  if (pipeIdx < 0) {
    const left = parseMatrix(text)
    return { left, right: left.map(() => '') }
  }
  const left  = parseMatrix(text.slice(0, pipeIdx))
  const right = text.slice(pipeIdx + 1).split(',').map(v => v.trim())
  return { left, right }
}

// ── Parser ────────────────────────────────────────────────────────────────────
//
// Block syntax stored in the syllabus field:
//   [def:Title]  content  [/def]
//   [example:Title]  content  [/example]
//   [theorem:Title]  content  [/theorem]
//   [note]  content  [/note]
//   [rule]  content  [/rule]
//   [step:1:Label]  content  [/step]
//   [matrix]row1col1,row1col2;row2col1,row2col2[/matrix]
//   [aug]a,b;c,d|e,f[/aug]       (| splits coefficient columns from constants)
//
// Blocks are recursive: [matrix] inside [def] renders correctly.
// Plain text between blocks is rendered as MathText ($...$ / $$...$$).

const BLOCK_RE_SRC = '\\[(def|example|theorem|note|rule|step|matrix|aug)(?::([^\\]]*))?\\]([\\s\\S]*?)\\[\\/\\1\\]'

export function RichContent({ text, className }: { text: string; className?: string }) {
  const nodes: React.ReactNode[] = []
  let lastIndex = 0
  let key = 0

  const re = new RegExp(BLOCK_RE_SRC, 'g')
  let match: RegExpExecArray | null

  while ((match = re.exec(text)) !== null) {
    // Plain text before this block
    if (match.index > lastIndex) {
      const plain = text.slice(lastIndex, match.index).trim()
      if (plain) {
        nodes.push(
          <MathText key={key++} text={plain} className="leading-loose whitespace-pre-wrap text-sm" />
        )
      }
    }

    const [, type, args, content] = match
    const trimmed = content.trim()

    if (type === 'matrix') {
      const data = parseMatrix(trimmed)
      nodes.push(
        <div key={key++} className="flex justify-center my-2">
          <Matrix data={data} />
        </div>
      )
    } else if (type === 'aug') {
      const { left, right } = parseAugMatrix(trimmed)
      nodes.push(
        <div key={key++} className="flex justify-center my-2">
          <AugMatrix left={left} right={right} />
        </div>
      )
    } else {
      // Structural blocks - inner content parsed recursively so nested matrices work
      const inner = <RichContent key="c" text={trimmed} />

      if (type === 'def') {
        nodes.push(<DefBox key={key++} title={args ?? ''}>{inner}</DefBox>)
      } else if (type === 'example') {
        nodes.push(<ExBox key={key++} title={args ?? ''}>{inner}</ExBox>)
      } else if (type === 'theorem') {
        nodes.push(<ThmBox key={key++} title={args ?? ''}>{inner}</ThmBox>)
      } else if (type === 'note') {
        nodes.push(<NoteBox key={key++}>{inner}</NoteBox>)
      } else if (type === 'rule') {
        nodes.push(<RuleBox key={key++}>{inner}</RuleBox>)
      } else if (type === 'step') {
        const colonIdx = (args ?? '').indexOf(':')
        const n     = colonIdx >= 0 ? Number((args ?? '').slice(0, colonIdx)) : 1
        const label = colonIdx >= 0 ? (args ?? '').slice(colonIdx + 1) : (args ?? '')
        nodes.push(
          <StepBox key={key++} n={isNaN(n) ? 1 : n} label={label}>{inner}</StepBox>
        )
      }
    }

    lastIndex = match.index + match[0].length
  }

  // Trailing plain text
  if (lastIndex < text.length) {
    const plain = text.slice(lastIndex).trim()
    if (plain) {
      nodes.push(
        <MathText key={key++} text={plain} className="leading-loose whitespace-pre-wrap text-sm" />
      )
    }
  }

  if (nodes.length === 0) {
    return <MathText text={text} className={cn("leading-loose whitespace-pre-wrap text-sm", className)} />
  }

  return <div className={cn("space-y-4", className)}>{nodes}</div>
}
