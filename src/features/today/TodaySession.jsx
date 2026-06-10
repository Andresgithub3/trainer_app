import { supabase } from '../../supabaseClient.js'
import { useProgramData } from '../../hooks/useProgramData.js'
import { buildWorkingSets } from '../../../lib/workingSets.js'
import { DAY_LIFT, DAY_LABEL, isStrengthDay, formatSessionDate } from '../../lib/dayTypes.js'
import SetCard from './SetCard.jsx'

export default function TodaySession({ onStartLog }) {
  const { loading, error, lifts, inventory, barWeight, nextSession, reload } = useProgramData()

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

  const skipButton = (
    <button className="link-btn skip-btn" onClick={skip}>
      Skip this session
    </button>
  )

  if (!isStrengthDay(dayType)) {
    return (
      <section className="screen">
        {header}
        <div className="card muted">Run day — run logging arrives in the next step.</div>
        {skipButton}
      </section>
    )
  }

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
      <button className="btn btn-primary finish-btn" onClick={onStartLog}>
        Start logging →
      </button>
      {skipButton}
    </section>
  )
}
