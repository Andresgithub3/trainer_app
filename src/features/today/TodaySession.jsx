import { supabase } from '../../supabaseClient.js'
import { useProgramData } from '../../hooks/useProgramData.js'
import { buildWorkingSets } from '../../../lib/workingSets.js'
import { weekGlobalOf, runWeekCompleted, currentRunTargets, RUN_UNIT } from '../../../lib/runPlan.js'
import { accessoriesFor } from '../../lib/accessoryPlan.js'
import { DAY_LIFT, DAY_LABEL, isStrengthDay, formatSessionDate } from '../../lib/dayTypes.js'
import SetCard from './SetCard.jsx'

export default function TodaySession({ onStartLog }) {
  const { loading, error, lifts, inventory, barWeight, nextSession, allSessions, reload } =
    useProgramData()

  if (loading) return <div className="centered muted">Loading session…</div>
  if (error) return <div className="centered error">Couldn’t load: {error.message}</div>
  if (!nextSession) {
    return <div className="centered muted">No upcoming session — program complete. 🎉</div>
  }

  const { day_type: dayType, week, block, date } = nextSession

  async function skip() {
    if (!window.confirm(`Skip ${DAY_LABEL[dayType]} (${formatSessionDate(date)})?`)) return
    await supabase.from('sessions').update({ status: 'skipped' }).eq('id', nextSession.id)
    reload()
  }

  const header = (
    <div className="session-header">
      <div className="session-title">{DAY_LABEL[dayType] ?? dayType}</div>
      <div className="session-sub">
        Block {block} · Week {week} · {formatSessionDate(date)}
      </div>
    </div>
  )

  const actions = (
    <>
      <button className="btn btn-primary finish-btn" onClick={onStartLog}>
        Start logging →
      </button>
      <button className="link-btn skip-btn" onClick={skip}>
        Skip this session
      </button>
    </>
  )

  // ---- Run day ----
  if (!isStrengthDay(dayType)) {
    const wg = weekGlobalOf(block, week)
    const targets = currentRunTargets(wg, (w) => runWeekCompleted(allSessions, w))
    const miles = dayType === 'long_run' ? targets.long : targets.easy
    return (
      <section className="screen">
        {header}
        <div className="card run-card">
          <div className="weight-row">
            <span className="weight">{miles}</span>
            <span className="weight-unit">{RUN_UNIT}</span>
            <span className="set-reps">Zone 2</span>
          </div>
          <div className="muted">
            {dayType === 'long_run' ? 'Long run' : 'Easy run'} target
            {targets.held ? ` · held at week ${targets.effectiveWeek} (complete 2 weeks to advance)` : ''}
          </div>
        </div>
        {actions}
      </section>
    )
  }

  // ---- Strength day ----
  const lift = lifts.find((l) => l.name === DAY_LIFT[dayType])
  if (!lift) {
    return (
      <section className="screen">
        {header}
        <div className="card error">No lift configured for {dayType}.</div>
      </section>
    )
  }

  const tm = Number(lift.current_tm)
  const sets = buildWorkingSets(tm, week, { barWeight, inventory })
  const accessories = accessoriesFor(dayType)

  return (
    <section className="screen">
      {header}
      <div className="tm-line muted">
        Training Max {tm} lb · bar {barWeight} lb
      </div>
      <div className="set-list">
        {sets.map((set) => (
          <SetCard key={set.setIndex} set={set} barWeight={barWeight} inventory={inventory} />
        ))}
      </div>

      {accessories.length > 0 && (
        <div className="card acc-preview">
          <div className="set-name">Accessories</div>
          <ul className="acc-preview-list">
            {accessories.map((a) => (
              <li key={a.name}>
                <span className="acc-pname">{a.name}</span>
                {a.target && <span className="muted"> · {a.target}</span>}
                {a.note && <div className="muted acc-pnote">{a.note}</div>}
              </li>
            ))}
          </ul>
        </div>
      )}

      {actions}
    </section>
  )
}
