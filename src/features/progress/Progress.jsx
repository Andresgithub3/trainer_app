import { useMemo } from 'react'
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts'
import { useProgressData } from '../../hooks/useProgressData.js'

const LIFTS = [
  { name: 'Squat', color: '#ff6b35' },
  { name: 'Bench', color: '#4f9dff' },
  { name: 'Deadlift', color: '#43d17a' },
  { name: 'OHP', color: '#e0c64f' },
]

const tickDate = (d) => {
  if (!d) return ''
  const [, m, day] = d.split('-').map(Number)
  return `${['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][m - 1]} ${day}`
}

const tooltipStyle = {
  background: '#18181b',
  border: '1px solid #2c2c31',
  borderRadius: 10,
  color: '#f2f2f3',
}

// TM over time: forward-fill each lift's value across the union of change dates
// so the step-lines are continuous (PRD §5.3).
function buildTmSeries(tmHistory) {
  const dates = [...new Set(tmHistory.map((r) => r.effective_date))].sort()
  const byLift = {}
  for (const r of tmHistory) (byLift[r.lifts?.name] ??= []).push(r)
  return dates.map((d) => {
    const row = { date: d }
    for (const { name } of LIFTS) {
      let v = null
      for (const e of byLift[name] ?? []) if (e.effective_date <= d) v = Number(e.value)
      row[name] = v
    }
    return row
  })
}

// AMRAP reps per lift, one point per session date.
function buildAmrapSeries(amrap) {
  const rows = {}
  for (const r of amrap) {
    const d = r.sessions?.date
    if (!d) continue
    rows[d] ??= { date: d }
    if (r.lifts?.name) rows[d][r.lifts.name] = r.actual_reps
  }
  return Object.values(rows).sort((a, b) => a.date.localeCompare(b.date))
}

function ChartCard({ title, subtitle, children }) {
  return (
    <div className="card chart-card">
      <div className="chart-title">{title}</div>
      {subtitle && <div className="chart-sub muted">{subtitle}</div>}
      {children}
    </div>
  )
}

function LiftLineChart({ data, connectNulls }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={data} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
        <CartesianGrid stroke="#2c2c31" vertical={false} />
        <XAxis dataKey="date" tickFormatter={tickDate} stroke="#9a9aa2" fontSize={11} />
        <YAxis stroke="#9a9aa2" fontSize={11} width={40} />
        <Tooltip contentStyle={tooltipStyle} labelFormatter={tickDate} />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        {LIFTS.map((l) => (
          <Line
            key={l.name}
            type="stepAfter"
            dataKey={l.name}
            stroke={l.color}
            strokeWidth={2}
            dot={{ r: 3 }}
            connectNulls={connectNulls}
            isAnimationActive={false}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  )
}

export default function Progress() {
  const { loading, error, tmHistory, amrap, sessions, runs } = useProgressData()

  const tmData = useMemo(() => buildTmSeries(tmHistory), [tmHistory])
  const amrapData = useMemo(() => buildAmrapSeries(amrap), [amrap])

  if (loading) return <div className="centered muted">Loading progress…</div>
  if (error) return <div className="centered error">Couldn’t load: {error.message}</div>

  const completed = sessions.filter((s) => s.status === 'completed').length

  return (
    <section className="screen">
      <ChartCard title="Training Max over time" subtitle="Per lift, lb">
        {tmData.length ? (
          <LiftLineChart data={tmData} connectNulls />
        ) : (
          <div className="muted">No TM history yet.</div>
        )}
      </ChartCard>

      <ChartCard title="AMRAP reps" subtitle="Top-set reps per session — the program’s key signal">
        {amrapData.length ? (
          <LiftLineChart data={amrapData} connectNulls />
        ) : (
          <div className="muted">Log an AMRAP top set to start the trend.</div>
        )}
      </ChartCard>

      <ChartCard title="Run volume" subtitle="vs. the 12-week plan">
        {runs.length ? (
          <div className="muted">{runs.length} runs logged.</div>
        ) : (
          <div className="muted">No runs logged yet — run logging is coming next.</div>
        )}
      </ChartCard>

      <div className="card">
        <div className="chart-title">Completion</div>
        <div className="stat-row">
          <div className="stat">
            <div className="stat-num">{completed}</div>
            <div className="stat-label muted">sessions done</div>
          </div>
          <div className="stat">
            <div className="stat-num">{sessions.length}</div>
            <div className="stat-label muted">total tracked</div>
          </div>
        </div>
      </div>
    </section>
  )
}
