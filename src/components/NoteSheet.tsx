import { useEffect, useState } from 'react'
import { getStore, setNote } from '../lib/store'
import Sheet from './ui/Sheet'

interface Props {
  open: boolean
  onClose: () => void
  verseKey: string
  label: string
  verseText: string
}

export default function NoteSheet({ open, onClose, verseKey, label, verseText }: Props) {
  const [draft, setDraft] = useState('')

  useEffect(() => {
    if (open) setDraft(getStore().notes[verseKey] ?? '')
  }, [open, verseKey])

  const save = () => {
    setNote(verseKey, draft)
    onClose()
  }

  return (
    <Sheet open={open} onClose={save} title={label} subtitle="Your note">
      <p className="verse-type mb-4 text-base" style={{ color: 'var(--fg-dim)' }}>
        {verseText}
      </p>
      <textarea
        autoFocus
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        rows={7}
        placeholder="What do you want to remember about this verse?"
        className="w-full rounded-xl border bg-transparent p-3 text-sm outline-none"
        style={{ borderColor: 'var(--line)', color: 'var(--fg)' }}
      />
      <div className="mt-3 flex gap-2">
        <button
          onClick={save}
          className="flex-1 rounded-full py-2.5 text-sm font-semibold"
          style={{ background: 'var(--accent)', color: 'var(--bg)' }}
        >
          Save note
        </button>
        {draft && (
          <button
            onClick={() => {
              setNote(verseKey, '')
              onClose()
            }}
            className="rounded-full border px-4 text-sm"
            style={{ borderColor: 'var(--line)', color: 'var(--fg-dim)' }}
          >
            Delete
          </button>
        )}
      </div>
    </Sheet>
  )
}
