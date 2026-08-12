import { useRef, useState } from 'react'
import { Download, Flame, Upload, RotateCcw } from 'lucide-react'
import type { Canon } from '../lib/data'
import {
  exportData, importData, resetData, streak, useSettings, useStore,
} from '../lib/store'
import type { TranslationCode } from '../lib/types'

const THEMES = [
  ['dark', 'Dark'],
  ['light', 'Light'],
  ['sepia', 'Sepia'],
] as const

export default function Profile({ canon }: { canon: Canon }) {
  const store = useStore()
  const [settings, setSettings] = useSettings()
  const [message, setMessage] = useState('')
  const fileInput = useRef<HTMLInputElement>(null)

  const chaptersRead = Object.values(store.read).reduce((sum, list) => sum + list.length, 0)
  const totalChapters = canon.meta.books.reduce((sum, b) => sum + b.c.length, 0)
  const percent = ((chaptersRead / totalChapters) * 100).toFixed(1)
  const days = streak(store.days)

  const flash = (text: string) => {
    setMessage(text)
    setTimeout(() => setMessage(''), 2500)
  }

  const download = () => {
    const blob = new Blob([exportData()], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `openscroll-backup-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
    flash('Backup downloaded')
  }

  const upload = (file: File) => {
    file
      .text()
      .then((text) => {
        importData(text)
        flash('Backup restored')
      })
      .catch(() => flash('That file could not be read'))
  }

  return (
    <div className="safe-top h-full overflow-y-auto px-5 pb-28 pt-4">
      <h1 className="mb-4 text-xl font-semibold">You</h1>

      <div className="mb-6 grid grid-cols-3 gap-2">
        <Stat value={String(days)} label="day streak" icon={<Flame size={14} />} />
        <Stat value={store.versesSeen.toLocaleString()} label="verses read" />
        <Stat value={`${percent}%`} label="of the Bible" />
      </div>

      <div className="mb-6 h-1.5 overflow-hidden rounded-full" style={{ background: 'var(--line)' }}>
        <div
          className="h-full rounded-full"
          style={{ width: `${percent}%`, background: 'var(--accent)' }}
        />
      </div>

      <Group title="Translation">
        <div className="grid grid-cols-2 gap-2">
          {canon.meta.translations.map((t) => (
            <button
              key={t.code}
              onClick={() => setSettings({ translation: t.code as TranslationCode })}
              className="rounded-xl border p-3 text-left"
              style={{
                borderColor: settings.translation === t.code ? 'var(--accent)' : 'var(--line)',
              }}
            >
              <div className="text-sm font-medium">{t.code.toUpperCase()}</div>
              <div className="text-[11px]" style={{ color: 'var(--fg-dim)' }}>
                {t.name} · {t.year}
              </div>
              <div className="text-[11px]" style={{ color: 'var(--fg-dim)' }}>
                {t.note}
              </div>
            </button>
          ))}
        </div>
      </Group>

      <Group title="Reading">
        <Toggle
          label="Red letter (words of Jesus)"
          value={settings.redLetter}
          onChange={(v) => setSettings({ redLetter: v })}
        />
        <Toggle
          label="Italicise words supplied by translators"
          value={settings.showSupplied}
          onChange={(v) => setSettings({ showSupplied: v })}
        />
        <label className="mt-3 block text-xs" style={{ color: 'var(--fg-dim)' }}>
          Text size
        </label>
        <input
          type="range"
          min={0.8}
          max={1.8}
          step={0.05}
          value={settings.fontScale}
          onChange={(e) => setSettings({ fontScale: Number(e.target.value) })}
          className="w-full"
        />
        <label className="mt-3 block text-xs" style={{ color: 'var(--fg-dim)' }}>
          Auto-advance {settings.autoAdvanceSeconds ? `every ${settings.autoAdvanceSeconds}s` : 'off'}
        </label>
        <input
          type="range"
          min={0}
          max={30}
          step={1}
          value={settings.autoAdvanceSeconds}
          onChange={(e) => setSettings({ autoAdvanceSeconds: Number(e.target.value) })}
          className="w-full"
        />
      </Group>

      <Group title="Appearance">
        <div className="flex gap-2">
          {THEMES.map(([id, label]) => (
            <button
              key={id}
              onClick={() => setSettings({ theme: id })}
              className="flex-1 rounded-xl border py-2 text-sm"
              style={{ borderColor: settings.theme === id ? 'var(--accent)' : 'var(--line)' }}
            >
              {label}
            </button>
          ))}
        </div>
      </Group>

      <Group title="Your data">
        <p className="mb-3 text-xs" style={{ color: 'var(--fg-dim)' }}>
          Everything you save stays on this device. There is no account and nothing is uploaded —
          so back it up if you change phones.
        </p>
        <div className="flex flex-wrap gap-2">
          <Action onClick={download} icon={<Download size={14} />} label="Back up" />
          <Action
            onClick={() => fileInput.current?.click()}
            icon={<Upload size={14} />}
            label="Restore"
          />
          <Action
            onClick={() => {
              if (confirm('Erase all saved verses, notes, highlights and progress?')) {
                resetData()
                flash('Everything cleared')
              }
            }}
            icon={<RotateCcw size={14} />}
            label="Reset"
          />
        </div>
        <input
          ref={fileInput}
          type="file"
          accept="application/json"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) upload(file)
            e.target.value = ''
          }}
        />
      </Group>

      <Group title="About">
        <p className="text-xs leading-relaxed" style={{ color: 'var(--fg-dim)' }}>
          OpenScroll is free, with no adverts, no subscription, no account and no tracking.
          The text is the King James Version (1769), American Standard Version (1901),
          Young's Literal Translation (1898) and Bible in Basic English (1949) — all public domain.
          Strong's dictionaries come from the OpenScriptures project; the {' '}
          {(344799).toLocaleString()} cross references are OpenBible.info's voted dataset, used
          under CC-BY.
        </p>
      </Group>

      {message && (
        <div
          className="fade-in fixed bottom-24 left-1/2 -translate-x-1/2 rounded-full px-4 py-2 text-xs"
          style={{ background: 'var(--accent)', color: 'var(--bg)' }}
        >
          {message}
        </div>
      )}
    </div>
  )
}

function Stat({ value, label, icon }: { value: string; label: string; icon?: React.ReactNode }) {
  return (
    <div className="rounded-xl border p-3" style={{ borderColor: 'var(--line)' }}>
      <div className="flex items-center gap-1 text-lg font-semibold" style={{ color: 'var(--accent)' }}>
        {icon}
        {value}
      </div>
      <div className="text-[11px]" style={{ color: 'var(--fg-dim)' }}>
        {label}
      </div>
    </div>
  )
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-6">
      <h2
        className="mb-2 text-[10px] font-semibold uppercase tracking-[0.16em]"
        style={{ color: 'var(--accent)' }}
      >
        {title}
      </h2>
      {children}
    </section>
  )
}

function Toggle({
  label, value, onChange,
}: {
  label: string
  value: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <button
      onClick={() => onChange(!value)}
      className="flex w-full items-center justify-between py-2 text-left text-sm"
    >
      <span>{label}</span>
      <span
        className="relative h-5 w-9 shrink-0 rounded-full transition"
        style={{ background: value ? 'var(--accent)' : 'var(--line)' }}
      >
        <span
          className="absolute top-0.5 h-4 w-4 rounded-full transition-all"
          style={{ background: 'var(--bg)', left: value ? 18 : 2 }}
        />
      </span>
    </button>
  )
}

function Action({
  onClick, icon, label,
}: {
  onClick: () => void
  icon: React.ReactNode
  label: string
}) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs"
      style={{ borderColor: 'var(--line)', color: 'var(--fg-dim)' }}
    >
      {icon}
      {label}
    </button>
  )
}
