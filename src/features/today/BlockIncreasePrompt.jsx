import { useState } from 'react'
import { supabase } from '../../supabaseClient.js'
import { standardBlockIncrease } from '../../../lib/blockIncrease.js'

const LIFT_ORDER = ['Squat', 'Bench', 'Deadlift', 'OHP']

// Shown on the Today card when entering a new 4-week block (PRD §5.2):
// prescribes +5 upper / +10 lower per lift, editable for a bigger jump.
export default function BlockIncreasePrompt({ block, lifts, onDone }) {
  const ordered = [...lifts].sort((a, b) => LIFT_ORDER.indexOf(a.name) - LIFT_ORDER.indexOf(b.name))
  const [values, setValues] = useState(() =>
    Object.fromEntries(ordered.map((l) => [l.id, String(standardBlockIncrease(Number(l.current_tm), l.category))])),
  )
  const [phase, setPhase] = useState('idle')
  const [msg, setMsg] = useState('')

  async function decide(holdAll) {
    setPhase('saving')
    try {
      const today = new Date().toISOString().slice(0, 10)
      for (const l of ordered) {
        const cur = Number(l.current_tm)
        const target = holdAll ? cur : Number(values[l.id])
        if (!holdAll && target > 0 && target !== cur) {
          const up = await supabase.from('lifts').update({ current_tm: target }).eq('id', l.id)
          if (up.error) throw up.error
        }
        const reason =
          !holdAll && target !== cur
            ? `Block ${block} increase (+${target - cur})`
            : `Block ${block}: held`
        const th = await supabase.from('tm_history').insert({
          lift_id: l.id,
          value: holdAll ? cur : target,
          effective_date: today,
          reason,
        })
        if (th.error) throw th.error
      }
      onDone()
    } catch (e) {
      setPhase('error')
      setMsg(e.message)
    }
  }

  return (
    <div className="card tm-card tm-card--raise block-prompt">
      <div className="set-name">Block {block} — Training Max increase</div>
      <div className="muted acc-hint">Standard +5 upper / +10 lower. Edit for a bigger jump, or hold.</div>
      <div className="tm-grid">
        {ordered.map((l) => (
          <label className="tm-row" key={l.id}>
            <span className="tm-name">
              {l.name} <span className="muted">· {l.current_tm} →</span>
            </span>
            <input
              className="input tm-input"
              type="number"
              inputMode="numeric"
              min="0"
              value={values[l.id]}
              onChange={(e) => setValues((p) => ({ ...p, [l.id]: e.target.value }))}
            />
          </label>
        ))}
      </div>
      {phase === 'error' && <p className="error">Failed: {msg}</p>}
      <div className="block-actions">
        <button className="btn btn-primary" onClick={() => decide(false)} disabled={phase === 'saving'}>
          {phase === 'saving' ? 'Saving…' : 'Apply increases'}
        </button>
        <button className="btn btn-secondary" onClick={() => decide(true)} disabled={phase === 'saving'}>
          Keep current
        </button>
      </div>
    </div>
  )
}
