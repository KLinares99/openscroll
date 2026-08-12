import { useState } from 'react'

const STEPS = [
  {
    title: 'Scroll the Word',
    body: 'One verse per screen. Swipe up and the next arrives — the same motion you already do all day, pointed somewhere better.',
  },
  {
    title: 'Tap any verse to go deeper',
    body: 'Context, the Greek or Hebrew behind every word, a plain-English rendering, and the verses that speak to it.',
  },
  {
    title: 'Free, for good',
    body: 'No subscription, no adverts, no account, no tracking. Everything works offline, and what you save stays on your device.',
  },
]

export default function Onboarding({ onDone }: { onDone: (startAtGenesis: boolean) => void }) {
  const [step, setStep] = useState(0)
  const last = step === STEPS.length - 1

  return (
    <div className="safe-top safe-bottom flex h-full flex-col justify-between px-7 py-10">
      <div className="flex gap-1.5 pt-2">
        {STEPS.map((_, i) => (
          <div
            key={i}
            className="h-0.5 flex-1 rounded-full"
            style={{ background: i <= step ? 'var(--accent)' : 'var(--line)' }}
          />
        ))}
      </div>

      <div className="fade-in" key={step}>
        <h1 className="verse-type mb-4 text-3xl">{STEPS[step].title}</h1>
        <p className="text-base leading-relaxed" style={{ color: 'var(--fg-dim)' }}>
          {STEPS[step].body}
        </p>
      </div>

      <div className="space-y-3">
        <button
          onClick={() => (last ? onDone(true) : setStep(step + 1))}
          className="w-full rounded-full py-3.5 text-sm font-semibold"
          style={{ background: 'var(--accent)', color: 'var(--bg)' }}
        >
          {last ? 'Start at Genesis 1:1' : 'Next'}
        </button>
        {last && (
          <button
            onClick={() => onDone(false)}
            className="w-full py-2 text-sm"
            style={{ color: 'var(--fg-dim)' }}
          >
            Start somewhere at random
          </button>
        )}
      </div>
    </div>
  )
}
