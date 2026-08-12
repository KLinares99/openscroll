import { Bookmark, Library, ScrollText, Search, User } from 'lucide-react'

export type Screen = 'feed' | 'search' | 'library' | 'saved' | 'profile'

const ITEMS: { id: Screen; label: string; icon: React.ReactNode }[] = [
  { id: 'feed', label: 'Scroll', icon: <ScrollText size={20} /> },
  { id: 'search', label: 'Search', icon: <Search size={20} /> },
  { id: 'library', label: 'Library', icon: <Library size={20} /> },
  { id: 'saved', label: 'Marks', icon: <Bookmark size={20} /> },
  { id: 'profile', label: 'You', icon: <User size={20} /> },
]

export default function Nav({
  screen, onChange,
}: {
  screen: Screen
  onChange: (s: Screen) => void
}) {
  return (
    <nav
      className="safe-bottom fixed inset-x-0 bottom-0 z-40 flex justify-around border-t px-2 pt-1.5"
      style={{
        background: 'color-mix(in srgb, var(--bg) 92%, transparent)',
        borderColor: 'var(--line)',
        backdropFilter: 'blur(12px)',
      }}
    >
      {ITEMS.map((item) => (
        <button
          key={item.id}
          onClick={() => onChange(item.id)}
          className="flex flex-1 flex-col items-center gap-0.5 py-1.5"
          style={{ color: screen === item.id ? 'var(--accent)' : 'var(--fg-dim)' }}
          aria-current={screen === item.id ? 'page' : undefined}
        >
          {item.icon}
          <span className="text-[10px]">{item.label}</span>
        </button>
      ))}
    </nav>
  )
}
