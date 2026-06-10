import { lazy, Suspense, useState } from 'react'
import { useAuth } from '../auth/authContext.js'
import TodaySession from '../features/today/TodaySession.jsx'
import SessionLog from '../features/log/SessionLog.jsx'

// Charts (Recharts) are heavy and only needed on the Progress tab — load on demand.
const Progress = lazy(() => import('../features/progress/Progress.jsx'))

const TABS = [
  { id: 'today', label: 'Today' },
  { id: 'log', label: 'Log' },
  { id: 'progress', label: 'Progress' },
]

export default function AppShell() {
  const { signOut } = useAuth()
  const [tab, setTab] = useState('today')

  return (
    <div className="app">
      <header className="topbar">
        <span className="brand">Benchmark</span>
        <button className="link-btn" onClick={signOut}>
          Sign out
        </button>
      </header>

      <main className="content">
        {tab === 'today' && <TodaySession onStartLog={() => setTab('log')} />}
        {tab === 'log' && <SessionLog />}
        {tab === 'progress' && (
          <Suspense fallback={<div className="centered muted">Loading charts…</div>}>
            <Progress />
          </Suspense>
        )}
      </main>

      <nav className="bottom-nav">
        {TABS.map((t) => (
          <button
            key={t.id}
            className={`nav-btn${tab === t.id ? ' nav-btn--active' : ''}`}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </nav>
    </div>
  )
}
