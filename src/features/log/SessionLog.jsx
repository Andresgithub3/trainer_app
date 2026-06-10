import { useMemo, useState } from 'react'
import { supabase } from '../../supabaseClient.js'
import { useProgramData } from '../../hooks/useProgramData.js'
import { useLastAccessories } from '../../hooks/useLastAccessories.js'
import { buildWorkingSets } from '../../../lib/workingSets.js'
import { suggestTM } from '../../../lib/suggestTM.js'
import { weekGlobalOf, runWeekCompleted, currentRunTargets } from '../../../lib/runPlan.js'
import { accessoriesFor } from '../../lib/accessoryPlan.js'
import { DAY_LIFT, DAY_LABEL, isStrengthDay, formatSessionDate } from '../../lib/dayTypes.js'
import RestTimer from './RestTimer.jsx'
import RunLog from './RunLog.jsx'

const ordinal = ['Set 1', 'Set 2', 'Top set']
const blankAccessory = () => ({
  _id: crypto.randomUUID(),
  name: '',
  set1_weight: '',
  set1_reps: '',
  set2_weight: '',
  set2_reps: '',
  notes: '',
})
const str = (v) => (v == null ? '' : String(v))

function LoggedConfirmation({ summary, onContinue }) {
  return (
    <section className="screen">
      <div className="card">
        <h2 className="auth-title">Logged ✓</h2>
        <p className="muted">
          {summary.label} marked complete.{summary.note ? ` ${summary.note}` : ''}
        </p>
      </div>
      <button className="btn btn-primary finish-btn" onClick={onContinue}>
        Next session →
      </button>
    </section>
  )
}

export default function SessionLog() {
  // Held in the parent so the realtime refetch (which advances nextSession the
  // moment a session is completed) can't unmount the confirmation.
  const [completed, setCompleted] = useState(null)
  const { loading, error, lifts, inventory, barWeight, nextSession, allSessions, reload } =
    useProgramData()
  const session = nextSession
  const strength = !!session && isStrengthDay(session.day_type)

  // Called unconditionally (hooks rule); resolves empty for non-strength days.
  const template = useLastAccessories(
    strength ? session.day_type : null,
    session?.date ?? null,
  )

  if (loading || template.loading) return <div className="centered muted">Loading…</div>
  if (error) return <div className="centered error">Couldn’t load: {error.message}</div>
  if (completed) {
    return (
      <LoggedConfirmation
        summary={completed}
        onContinue={() => {
          setCompleted(null)
          reload()
        }}
      />
    )
  }
  if (!session) {
    return (
      <section className="screen">
        <div className="card muted">No pending session to log.</div>
      </section>
    )
  }

  if (!strength) {
    const wg = weekGlobalOf(session.block, session.week)
    const targets = currentRunTargets(wg, (w) => runWeekCompleted(allSessions, w))
    const targetMiles = session.day_type === 'long_run' ? targets.long : targets.easy
    return <RunLog key={session.id} session={session} targetMiles={targetMiles} onDone={setCompleted} />
  }

  const lift = lifts.find((l) => l.name === DAY_LIFT[session.day_type])
  if (!lift) {
    return <section className="screen"><div className="card error">No lift for this day.</div></section>
  }

  const tm = Number(lift.current_tm)
  const sets = buildWorkingSets(tm, session.week, { barWeight, inventory })

  // Every session gets the prescribed accessories, with weights pre-filled from
  // the last same-day session where available (matched by name).
  const lastByName = Object.fromEntries((template.accessories ?? []).map((a) => [a.name, a]))
  const planned = accessoriesFor(session.day_type)
  const initialAccessories = [
    ...planned.map((p) => {
      const last = lastByName[p.name]
      return {
        name: p.name,
        set1_weight: last?.set1_weight ?? '',
        set1_reps: last?.set1_reps ?? '',
        set2_weight: last?.set2_weight ?? '',
        set2_reps: last?.set2_reps ?? '',
        notes: last?.notes ?? p.note ?? '',
      }
    }),
    // keep any past custom accessories not in the prescribed plan
    ...(template.accessories ?? []).filter((a) => !planned.some((p) => p.name === a.name)),
  ]

  return (
    <SessionLogForm
      key={session.id}
      session={session}
      lift={lift}
      tm={tm}
      sets={sets}
      initialAccessories={initialAccessories}
      onDone={setCompleted}
    />
  )
}

function SessionLogForm({ session, lift, tm, sets, initialAccessories, onDone }) {
  const [actuals, setActuals] = useState(() =>
    Object.fromEntries(
      sets.map((s) => [s.setIndex, { weight: String(s.chosen), reps: String(s.reps) }]),
    ),
  )
  const [accessories, setAccessories] = useState(() =>
    initialAccessories.map((a) => ({
      _id: crypto.randomUUID(),
      name: str(a.name),
      set1_weight: str(a.set1_weight),
      set1_reps: str(a.set1_reps),
      set2_weight: str(a.set2_weight),
      set2_reps: str(a.set2_reps),
      notes: str(a.notes),
    })),
  )
  const [applyRaise, setApplyRaise] = useState(false)
  const [tmValue, setTmValue] = useState('')
  const [phase, setPhase] = useState('editing')
  const [errorMsg, setErrorMsg] = useState('')

  const setField = (i, field, value) =>
    setActuals((prev) => ({ ...prev, [i]: { ...prev[i], [field]: value } }))
  const setAcc = (i, field, value) =>
    setAccessories((prev) => prev.map((a, idx) => (idx === i ? { ...a, [field]: value } : a)))
  const addAcc = () => setAccessories((prev) => [...prev, blankAccessory()])
  const removeAcc = (i) => setAccessories((prev) => prev.filter((_, idx) => idx !== i))

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
      const setRows = sets.map((s) => ({
        session_id: session.id,
        lift_id: lift.id,
        set_index: s.setIndex,
        is_amrap: s.isAmrap,
        prescribed_weight: s.chosen,
        prescribed_reps: s.reps,
        actual_weight: Number(actuals[s.setIndex].weight),
        actual_reps: Number(actuals[s.setIndex].reps),
      }))
      const ins = await supabase.from('set_logs').insert(setRows)
      if (ins.error) throw ins.error

      const delAcc = await supabase.from('accessory_logs').delete().eq('session_id', session.id)
      if (delAcc.error) throw delAcc.error
      const accRows = accessories
        .filter((a) => a.name.trim())
        .map((a) => ({
          session_id: session.id,
          name: a.name.trim(),
          set1_weight: a.set1_weight || null,
          set1_reps: a.set1_reps === '' ? null : Number(a.set1_reps),
          set2_weight: a.set2_weight || null,
          set2_reps: a.set2_reps === '' ? null : Number(a.set2_reps),
          notes: a.notes || null,
        }))
      if (accRows.length) {
        const insAcc = await supabase.from('accessory_logs').insert(accRows)
        if (insAcc.error) throw insAcc.error
      }

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

      onDone({
        label: `${DAY_LABEL[session.day_type]} · ${formatSessionDate(session.date)}`,
        note: applyRaise && Number(tmValue) !== tm ? `Training Max → ${tmValue}.` : '',
      })
    } catch (e) {
      setPhase('error')
      setErrorMsg(e.message)
    }
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

      <RestTimer />

      {suggestion && (
        <div className={`card tm-card${suggestion.recommendRaise ? ' tm-card--raise' : ''}`}>
          <div className="tm-est">
            Est. 1RM <strong>{suggestion.est1RM}</strong> · implied TM{' '}
            <strong>{suggestion.impliedTM}</strong>
          </div>
          <p className="muted tm-reason">{suggestion.reason}</p>
          {suggestion.recommendRaise || suggestion.impliedTM > tm ? (
            <label className="tm-apply">
              <input type="checkbox" checked={applyRaise} onChange={(e) => toggleRaise(e.target.checked)} />
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

      <div className="acc-section">
        <div className="acc-head">
          <span className="set-name">Accessories</span>
          <span className="muted acc-hint">prescribed · weights from last session</span>
        </div>
        {accessories.map((a, i) => (
          <div className="card acc-row" key={a._id}>
            <div className="acc-row-head">
              <input
                className="input acc-name"
                placeholder="Accessory name"
                value={a.name}
                onChange={(e) => setAcc(i, 'name', e.target.value)}
              />
              <button className="link-btn acc-remove" onClick={() => removeAcc(i)} aria-label="Remove">
                ✕
              </button>
            </div>
            <div className="acc-grid">
              <input className="input" placeholder="S1 wt" value={a.set1_weight} onChange={(e) => setAcc(i, 'set1_weight', e.target.value)} />
              <input className="input" placeholder="S1 reps" inputMode="numeric" value={a.set1_reps} onChange={(e) => setAcc(i, 'set1_reps', e.target.value)} />
              <input className="input" placeholder="S2 wt" value={a.set2_weight} onChange={(e) => setAcc(i, 'set2_weight', e.target.value)} />
              <input className="input" placeholder="S2 reps" inputMode="numeric" value={a.set2_reps} onChange={(e) => setAcc(i, 'set2_reps', e.target.value)} />
            </div>
            <input
              className="input acc-notes"
              placeholder="Notes"
              value={a.notes}
              onChange={(e) => setAcc(i, 'notes', e.target.value)}
            />
          </div>
        ))}
        <button className="btn btn-secondary" onClick={addAcc}>
          + Add accessory
        </button>
      </div>

      {phase === 'error' && <p className="error">Save failed: {errorMsg}</p>}

      <button className="btn btn-primary finish-btn" onClick={finish} disabled={phase === 'saving'}>
        {phase === 'saving' ? 'Saving…' : 'Finish & save session'}
      </button>
    </section>
  )
}
