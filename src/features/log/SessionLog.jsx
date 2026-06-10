import { useMemo, useState } from 'react'
import { supabase } from '../../supabaseClient.js'
import { useProgramData } from '../../hooks/useProgramData.js'
import { buildWorkingSets } from '../../../lib/workingSets.js'
import { suggestTM } from '../../../lib/suggestTM.js'
import { DAY_LIFT, DAY_LABEL, isStrengthDay, formatSessionDate } from '../../lib/dayTypes.js'

const ordinal = ['Set 1', 'Set 2', 'Top set']

export default function SessionLog() {
  const { loading, error, lifts, inventory, barWeight, nextSession, reload } = useProgramData()

  if (loading) return <div className="centered muted">Loading…</div>
  if (error) return <div className="centered error">Couldn’t load: {error.message}</div>
  if (!nextSession) {
    return (
      <section className="screen">
        <div className="card muted">
          No pending session to log. (Future sessions arrive with the program calendar.)
        </div>
      </section>
    )
  }
  if (!isStrengthDay(nextSession.day_type)) {
    return (
      <section className="screen">
        <div className="card muted">Run-day logging arrives in the next step.</div>
      </section>
    )
  }

  const lift = lifts.find((l) => l.name === DAY_LIFT[nextSession.day_type])
  if (!lift) {
    return <section className="screen"><div className="card error">No lift for this day.</div></section>
  }

  const tm = Number(lift.current_tm)
  const sets = buildWorkingSets(tm, nextSession.week, { barWeight, inventory })

  // key forces a fresh form (and useState init) when the session changes.
  return (
    <SessionLogForm
      key={nextSession.id}
      session={nextSession}
      lift={lift}
      tm={tm}
      sets={sets}
      reload={reload}
    />
  )
}

function SessionLogForm({ session, lift, tm, sets, reload }) {
  const [actuals, setActuals] = useState(() =>
    Object.fromEntries(
      sets.map((s) => [s.setIndex, { weight: String(s.chosen), reps: String(s.reps) }]),
    ),
  )
  const [applyRaise, setApplyRaise] = useState(false)
  const [tmValue, setTmValue] = useState('')
  const [phase, setPhase] = useState('editing') // editing | saving | done | error
  const [errorMsg, setErrorMsg] = useState('')

  const setField = (i, field, value) =>
    setActuals((prev) => ({ ...prev, [i]: { ...prev[i], [field]: value } }))

  const amrapSet = sets.find((s) => s.isAmrap)
  const amrapWeight = amrapSet ? Number(actuals[amrapSet.setIndex].weight) : 0
  const amrapReps = amrapSet ? Number(actuals[amrapSet.setIndex].reps) : 0

  const suggestion = useMemo(() => {
    if (!amrapSet || !(amrapWeight > 0) || !(amrapReps > 0)) return null
    return suggestTM(tm, amrapWeight, amrapReps, session.week, lift.category)
  }, [amrapSet, amrapWeight, amrapReps, tm, session.week, lift.category])

  const toggleRaise = (checked) => {
    setApplyRaise(checked)
    if (checked && suggestion) setTmValue(String(suggestion.suggestedTM))
  }

  async function finish() {
    setPhase('saving')
    try {
      const del = await supabase.from('set_logs').delete().eq('session_id', session.id)
      if (del.error) throw del.error

      const rows = sets.map((s) => ({
        session_id: session.id,
        lift_id: lift.id,
        set_index: s.setIndex,
        is_amrap: s.isAmrap,
        prescribed_weight: s.chosen,
        prescribed_reps: s.reps,
        actual_weight: Number(actuals[s.setIndex].weight),
        actual_reps: Number(actuals[s.setIndex].reps),
      }))
      const ins = await supabase.from('set_logs').insert(rows)
      if (ins.error) throw ins.error

      const newTM = Number(tmValue)
      if (applyRaise && newTM > 0 && newTM !== tm) {
        const up = await supabase.from('lifts').update({ current_tm: newTM }).eq('id', lift.id)
        if (up.error) throw up.error
        const th = await supabase.from('tm_history').insert({
          lift_id: lift.id,
          value: newTM,
          effective_date: session.date,
          reason: `AMRAP-driven: ${amrapReps} reps @ ${amrapWeight}`,
        })
        if (th.error) throw th.error
      }

      const done = await supabase.from('sessions').update({ status: 'completed' }).eq('id', session.id)
      if (done.error) throw done.error

      setPhase('done')
      reload()
    } catch (e) {
      setPhase('error')
      setErrorMsg(e.message)
    }
  }

  if (phase === 'done') {
    return (
      <section className="screen">
        <div className="card">
          <h2 className="auth-title">Session logged ✓</h2>
          <p className="muted">
            {DAY_LABEL[session.day_type]} · {formatSessionDate(session.date)} marked complete.
            {applyRaise && Number(tmValue) !== tm ? ` Training Max → ${tmValue}.` : ''}
          </p>
        </div>
      </section>
    )
  }

  return (
    <section className="screen">
      <div className="session-header">
        <div className="session-title">Log: {DAY_LABEL[session.day_type]}</div>
        <div className="session-sub">
          Block {session.block} · Week {session.week} · {formatSessionDate(session.date)} · TM {tm}
        </div>
      </div>

      <div className="set-list">
        {sets.map((s) => (
          <div className={`set-card${s.isAmrap ? ' set-card--top' : ''}`} key={s.setIndex}>
            <div className="set-head">
              <span className="set-name">{ordinal[s.setIndex] ?? `Set ${s.setIndex + 1}`}</span>
              {s.isAmrap && <span className="badge">AMRAP</span>}
              <span className="set-meta">
                prescribed {s.chosen} × {s.reps}
                {s.isAmrap ? '+' : ''}
              </span>
            </div>
            <div className="log-inputs">
              <label className="log-field">
                <span>Weight</span>
                <input
                  className="input"
                  type="number"
                  inputMode="decimal"
                  min="0"
                  value={actuals[s.setIndex].weight}
                  onChange={(e) => setField(s.setIndex, 'weight', e.target.value)}
                />
              </label>
              <label className="log-field">
                <span>Reps{s.isAmrap ? ' (AMRAP)' : ''}</span>
                <input
                  className="input"
                  type="number"
                  inputMode="numeric"
                  min="0"
                  value={actuals[s.setIndex].reps}
                  onChange={(e) => setField(s.setIndex, 'reps', e.target.value)}
                />
              </label>
            </div>
          </div>
        ))}
      </div>

      {suggestion && (
        <div className={`card tm-card${suggestion.recommendRaise ? ' tm-card--raise' : ''}`}>
          <div className="tm-est">
            Est. 1RM <strong>{suggestion.est1RM}</strong> · implied TM{' '}
            <strong>{suggestion.impliedTM}</strong>
          </div>
          <p className="muted tm-reason">{suggestion.reason}</p>
          {suggestion.recommendRaise || suggestion.impliedTM > tm ? (
            <label className="tm-apply">
              <input
                type="checkbox"
                checked={applyRaise}
                onChange={(e) => toggleRaise(e.target.checked)}
              />
              <span>Raise Training Max to</span>
              <input
                className="input tm-input"
                type="number"
                inputMode="numeric"
                disabled={!applyRaise}
                value={applyRaise ? tmValue : suggestion.suggestedTM}
                onChange={(e) => setTmValue(e.target.value)}
              />
            </label>
          ) : (
            <div className="muted">No raise needed — TM holds at {tm}.</div>
          )}
        </div>
      )}

      {phase === 'error' && <p className="error">Save failed: {errorMsg}</p>}

      <button className="btn btn-primary finish-btn" onClick={finish} disabled={phase === 'saving'}>
        {phase === 'saving' ? 'Saving…' : 'Finish & save session'}
      </button>
    </section>
  )
}
