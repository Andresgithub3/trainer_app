import { useState } from 'react'
import { useAuth } from '../auth/authContext.js'
import TodaySession from '../features/today/TodaySession.jsx'

const TABS = [
  { id: 'today', label: 'Today' },
  { id: 'log', label: 'Log' },
  { id: 'progress', label: 'Progress' },
]

function Placeholder({ title }) {
  return (
    <section className="screen">
      <div className="card muted">{title} — coming in the next step.</div>
    </section>
  )
}

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
        {tab === 'today' && <TodaySession />}
        {tab === 'log' && <Placeholder title="Fast logging" />}
        {tab === 'progress' && <Placeholder title="Progress charts" />}
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
