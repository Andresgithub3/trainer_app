import { useState } from 'react'
import { supabase } from '../../supabaseClient.js'
import { DAY_LABEL, formatSessionDate } from '../../lib/dayTypes.js'

// Run-day logging (PRD §5.4): type, duration, distance, perceived effort.
export default function RunLog({ session, reload }) {
  const [type, setType] = useState(session.day_type === 'long_run' ? 'long' : 'easy')
  const [duration, setDuration] = useState('')
  const [distance, setDistance] = useState('')
  const [effort, setEffort] = useState('')
  const [phase, setPhase] = useState('editing')
  const [errorMsg, setErrorMsg] = useState('')

  async function finish() {
    setPhase('saving')
    try {
      const del = await supabase.from('runs').delete().eq('session_id', session.id)
      if (del.error) throw del.error
      const ins = await supabase.from('runs').insert({
        session_id: session.id,
        type,
        duration_min: duration === '' ? null : Number(duration),
        distance: distance === '' ? null : Number(distance),
        effort_note: effort || null,
      })
      if (ins.error) throw ins.error
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
          <h2 className="auth-title">Run logged ✓</h2>
          <p className="muted">
            {DAY_LABEL[session.day_type]} · {formatSessionDate(session.date)} marked complete.
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
          Block {session.block} · Week {session.week} · {formatSessionDate(session.date)}
        </div>
      </div>

      <div className="card log-form">
        <label className="log-field">
          <span>Type</span>
          <select className="input" value={type} onChange={(e) => setType(e.target.value)}>
            <option value="easy">Easy (Z2)</option>
            <option value="tempo">Tempo (Z3/Z4)</option>
            <option value="long">Long (Z2)</option>
          </select>
        </label>
        <div className="log-inputs">
          <label className="log-field">
            <span>Duration (min)</span>
            <input
              className="input"
              type="number"
              inputMode="numeric"
              min="0"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
            />
          </label>
          <label className="log-field">
            <span>Distance</span>
            <input
              className="input"
              type="number"
              inputMode="decimal"
              min="0"
              value={distance}
              onChange={(e) => setDistance(e.target.value)}
            />
          </label>
        </div>
        <label className="log-field">
          <span>Effort / notes</span>
          <textarea
            className="input textarea"
            rows={2}
            placeholder="How did it feel?"
            value={effort}
            onChange={(e) => setEffort(e.target.value)}
          />
        </label>
      </div>

      {phase === 'error' && <p className="error">Save failed: {errorMsg}</p>}

      <button className="btn btn-primary finish-btn" onClick={finish} disabled={phase === 'saving'}>
        {phase === 'saving' ? 'Saving…' : 'Finish & save run'}
      </button>
    </section>
  )
}
