import { useHistory } from '../../hooks/useHistory.js'
import { DAY_LABEL, isStrengthDay, formatSessionDate } from '../../lib/dayTypes.js'

const ordinal = ['Set 1', 'Set 2', 'Top set']

function formatAccessory(a) {
  const set = (w, r) => {
    if (w == null && r == null) return null
    return `${w ?? ''}${r != null ? `×${r}` : ''}`.trim()
  }
  return [set(a.set1_weight, a.set1_reps), set(a.set2_weight, a.set2_reps)].filter(Boolean).join(', ')
}

function HistoryCard({ session }) {
  const sets = [...(session.set_logs ?? [])].sort((a, b) => a.set_index - b.set_index)
  const run = (session.runs ?? [])[0]
  const accessories = session.accessory_logs ?? []

  return (
    <div className="card hist-card">
      <div className="hist-head">
        <span className="set-name">{DAY_LABEL[session.day_type] ?? session.day_type}</span>
        <span className="muted">
          {formatSessionDate(session.date)} · B{session.block} W{session.week}
        </span>
      </div>

      {isStrengthDay(session.day_type) ? (
        <>
          <ul className="hist-sets">
            {sets.map((s) => (
              <li key={s.set_index}>
                <span className="muted">{ordinal[s.set_index] ?? `Set ${s.set_index + 1}`}</span>
                <span className="hist-set-val">
                  {s.actual_weight ?? s.prescribed_weight} × {s.actual_reps ?? s.prescribed_reps}
                  {s.is_amrap ? '+' : ''}
                </span>
              </li>
            ))}
          </ul>
          {accessories.length > 0 && (
            <div className="hist-acc">
              {accessories.map((a, i) => (
                <div className="hist-acc-row" key={`${a.name}-${i}`}>
                  <span className="acc-pname">{a.name}</span>
                  <span className="muted">{formatAccessory(a)}</span>
                </div>
              ))}
            </div>
          )}
        </>
      ) : run ? (
        <div className="muted">
          {run.type} · {run.distance ?? '—'} mi · {run.duration_min ?? '—'} min
          {run.effort_note ? ` · ${run.effort_note}` : ''}
        </div>
      ) : (
        <div className="muted">Completed.</div>
      )}
    </div>
  )
}

export default function History() {
  const { loading, error, sessions } = useHistory(7)

  if (loading) return <div className="centered muted">Loading history…</div>
  if (error) return <div className="centered error">Couldn’t load: {error.message}</div>

  return (
    <section className="screen">
      <div className="session-header">
        <div className="session-title">Last 7 days</div>
        <div className="session-sub">
          {sessions.length} completed session{sessions.length === 1 ? '' : 's'}
        </div>
      </div>
      {sessions.length === 0 ? (
        <div className="card muted">No completed workouts in the last 7 days.</div>
      ) : (
        sessions.map((s) => <HistoryCard key={s.id} session={s} />)
      )}
    </section>
  )
}
