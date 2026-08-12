import type { KjvVerse } from '../lib/types'

interface Props {
  /** KJV gives styled runs; other translations give a plain string. */
  value: KjvVerse | string | undefined
  redLetter: boolean
  showSupplied: boolean
  className?: string
}

/**
 * Renders verse text, colouring the words of Jesus and italicising the words
 * the KJV translators supplied (both are per-run flags baked in at build time).
 */
export default function VerseText({ value, redLetter, showSupplied, className }: Props) {
  if (value === undefined) return <span className={className}>&nbsp;</span>
  if (typeof value === 'string') return <span className={className}>{value}</span>

  return (
    <span className={className}>
      {value.map(([text, flags], i) => {
        const classes = [
          redLetter && flags & 1 ? 'jesus' : '',
          showSupplied && flags & 2 ? 'supplied' : '',
        ]
          .filter(Boolean)
          .join(' ')
        return classes ? (
          <span key={i} className={classes}>
            {text}
          </span>
        ) : (
          <span key={i}>{text}</span>
        )
      })}
    </span>
  )
}
