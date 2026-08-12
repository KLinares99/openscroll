import { useCallback, useEffect, useMemo, useState } from 'react'
import { Canon, getMeta, getVerseText } from './lib/data'
import { getStore, update, useStore } from './lib/store'
import { refKey, type Meta, type Ref } from './lib/types'
import Feed from './components/Feed'
import Nav, { type Screen } from './components/Nav'
import NoteSheet from './components/NoteSheet'
import Onboarding from './components/Onboarding'
import Profile from './components/Profile'
import Saved from './components/Saved'
import Search from './components/Search'
import Library from './components/Library'
import StudySheet from './components/StudySheet'

export default function App() {
  const store = useStore()
  const [meta, setMeta] = useState<Meta | null>(null)
  const [error, setError] = useState('')
  const [screen, setScreen] = useState<Screen>('feed')
  const [start, setStart] = useState(store.lastOrdinal)
  const [studyAt, setStudyAt] = useState<number | null>(null)
  const [noteAt, setNoteAt] = useState<number | null>(null)
  const [sheetText, setSheetText] = useState('')

  useEffect(() => {
    getMeta().then(setMeta).catch(() => setError('Could not load the scripture data.'))
  }, [])

  useEffect(() => {
    document.documentElement.dataset.theme = store.settings.theme
  }, [store.settings.theme])

  const canon = useMemo(() => (meta ? new Canon(meta) : null), [meta])

  /** Load the verse text a sheet needs, in the reader's chosen translation. */
  useEffect(() => {
    const ordinal = studyAt ?? noteAt
    if (!canon || ordinal === null) return
    let cancelled = false
    getVerseText(store.settings.translation, canon.fromOrdinal(ordinal))
      .then((t) => !cancelled && setSheetText(t))
      .catch(() => !cancelled && setSheetText(''))
    return () => {
      cancelled = true
    }
  }, [studyAt, noteAt, canon, store.settings.translation])

  const goto = useCallback(
    (r: Ref) => {
      if (!canon) return
      setStart(canon.toOrdinal(r))
      setScreen('feed')
    },
    [canon]
  )

  if (error) {
    return (
      <div className="flex h-full items-center justify-center px-8 text-center text-sm">
        <div>
          <p className="mb-2">{error}</p>
          <button
            onClick={() => location.reload()}
            className="rounded-full border px-4 py-2 text-xs"
            style={{ borderColor: 'var(--line)' }}
          >
            Try again
          </button>
        </div>
      </div>
    )
  }

  if (!canon) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="verse-type text-2xl" style={{ color: 'var(--accent)' }}>
          OpenScroll
        </div>
      </div>
    )
  }

  if (!store.onboarded) {
    return (
      <Onboarding
        onDone={(atGenesis) => {
          const ordinal = atGenesis ? 0 : Math.floor(Math.random() * canon.total)
          update((d) => {
            d.onboarded = true
            d.lastOrdinal = ordinal
          })
          setStart(ordinal)
        }}
      />
    )
  }

  const sheetOrdinal = studyAt ?? noteAt
  const sheetRef = sheetOrdinal !== null ? canon.fromOrdinal(sheetOrdinal) : null

  return (
    <div className="h-full">
      {screen === 'feed' && (
        <Feed
          canon={canon}
          start={start}
          onOpenStudy={setStudyAt}
          onOpenNote={setNoteAt}
        />
      )}
      {screen === 'search' && <Search canon={canon} onGoto={goto} />}
      {screen === 'library' && <Library canon={canon} onGoto={goto} />}
      {screen === 'saved' && <Saved canon={canon} onGoto={goto} />}
      {screen === 'profile' && <Profile canon={canon} />}

      <Nav
        screen={screen}
        onChange={(next) => {
          // Returning to the feed should resume wherever reading stopped.
          if (next === 'feed') setStart(getStore().lastOrdinal)
          setScreen(next)
        }}
      />

      {sheetRef && studyAt !== null && (
        <StudySheet
          open
          onClose={() => setStudyAt(null)}
          canon={canon}
          ref_={sheetRef}
          verseText={sheetText}
          onGoto={goto}
        />
      )}
      {sheetRef && noteAt !== null && (
        <NoteSheet
          open
          onClose={() => setNoteAt(null)}
          verseKey={refKey(sheetRef)}
          label={canon.label(sheetRef)}
          verseText={sheetText}
        />
      )}
    </div>
  )
}
