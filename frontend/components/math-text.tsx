"use client"

import katex from 'katex'

// Convert [[r1c1,r1c2],[r2c1,r2c2]] bracket notation to inline LaTeX matrix
function autoMatrix(text: string): string {
  return text.replace(
    /\[(\[[^\[\]]*\](?:,\s*\[[^\[\]]*\])*)\]/g,
    (_, inner) => {
      const rowMatches = inner.match(/\[([^\[\]]*)\]/g)
      if (!rowMatches) return _
      const rows = rowMatches.map((r: string) =>
        r.slice(1, -1).split(',').map((s: string) => s.trim()).join(' & ')
      )
      return `$\\begin{pmatrix} ${rows.join(' \\\\ ')} \\end{pmatrix}$`
    }
  )
}

type Seg =
  | { t: 'text';    s: string }
  | { t: 'inline';  s: string }
  | { t: 'display'; s: string }

function parse(text: string): Seg[] {
  const out: Seg[] = []
  // split on $$...$$ first (display math)
  const parts = text.split(/(\$\$[\s\S]*?\$\$)/)
  for (const part of parts) {
    if (part.startsWith('$$') && part.endsWith('$$') && part.length > 4) {
      out.push({ t: 'display', s: part.slice(2, -2) })
      continue
    }
    // split on $...$ (inline math)
    const chunks = part.split(/(\$[^$\n]+?\$)/)
    for (const chunk of chunks) {
      if (!chunk) continue
      if (chunk.startsWith('$') && chunk.endsWith('$') && chunk.length > 2) {
        out.push({ t: 'inline', s: chunk.slice(1, -1) })
      } else {
        out.push({ t: 'text', s: chunk })
      }
    }
  }
  return out
}

function toHtml(latex: string, displayMode: boolean): string {
  try {
    return katex.renderToString(latex, { displayMode, throwOnError: false, output: 'html' })
  } catch {
    return latex
  }
}

export function MathText({ text, className }: { text: string; className?: string }) {
  const processed = autoMatrix(text)
  const segs = parse(processed)
  if (segs.length === 1 && segs[0].t === 'text') {
    return <span className={className}>{text}</span>
  }
  return (
    <span className={className}>
      {segs.map((seg, i) => {
        if (seg.t === 'text') return <span key={i}>{seg.s}</span>
        return (
          <span
            key={i}
            className={seg.t === 'display' ? 'block my-2 overflow-x-auto' : 'inline'}
            dangerouslySetInnerHTML={{ __html: toHtml(seg.s, seg.t === 'display') }}
          />
        )
      })}
    </span>
  )
}
