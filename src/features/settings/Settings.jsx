import { useState } from 'react'
import { supabase } from '../../supabaseClient.js'
import { useSettingsData } from '../../hooks/useSettingsData.js'

const LIFT_ORDER = ['Squat', 'Bench', 'Deadlift', 'OHP']

export default function Settings() {
  const { loading, error, lifts, inventory, version, reload } = useSettingsData()
  if (loading) return <div className="centered muted">Loading settings…</div>
  if (error) return <div className="centered error">Couldn’t load: {error.message}</div>
  return <SettingsForm key={version} lifts={lifts} inventory={inventory} reload={reload} />
}

function SettingsForm({ lifts, inventory, reload }) {
  const orderedLifts = [...lifts].sort(
    (a, b) => LIFT_ORDER.indexOf(a.name) - LIFT_ORDER.indexOf(b.name),
  )

  const [tm, setTm] = useState(() =>
    Object.fromEntries(lifts.map((l) => [l.id, String(l.current_tm)])),
  )
  const [bar, setBar] = useState(String(inventory[0]?.bar_weight ?? 45))
  const [plates, setPlates] = useState(() =>
    inventory.map((p) => ({ plate_weight: Number(p.plate_weight), count: Number(p.count_per_side) })),
  )
  const [newPlate, setNewPlate] = useState('')

  const [tmPhase, setTmPhase] = useState('idle')
  const [invPhase, setInvPhase] = useState('idle')
  const [msg, setMsg] = useState('')

  // --- inventory editing ---
  const setCount = (weight, count) =>
    setPlates((prev) =>
      prev.map((p) => (p.plate_weight === weight ? { ...p, count: Math.max(0, count) } : p)),
    )
  const removePlate = (weight) => setPlates((prev) => prev.filter((p) => p.plate_weight !== weight))
  const addPlate = () => {
    const w = Number(newPlate)
    if (!(w > 0) || plates.some((p) => p.plate_weight === w)) return
    setPlates((prev) => [...prev, { plate_weight: w, count: 1 }].sort((a, b) => a.plate_weight - b.plate_weight))
    setNewPlate('')
  }

  async function saveInventory() {
    setInvPhase('saving')
    try {
      const rows = plates
        .filter((p) => p.plate_weight > 0 && p.count > 0)
        .map((p) => ({
          plate_weight: p.plate_weight,
          count_per_side: p.count,
          bar_weight: Number(bar) || 45,
        }))
      const del = await supabase.from('plate_inventory').delete().not('id', 'is', null)
      if (del.error) throw del.error
      if (rows.length) {
        const ins = await supabase.from('plate_inventory').insert(rows)
        if (ins.error) throw ins.error
      }
      setInvPhase('saved')
      reload()
    } catch (e) {
      setInvPhase('error')
      setMsg(e.message)
    }
  }

  async function saveTMs() {
    setTmPhase('saving')
    try {
      const today = new Date().toISOString().slice(0, 10)
      for (const l of lifts) {
        const v = Number(tm[l.id])
        if (v > 0 && v !== Number(l.current_tm)) {
          const up = await supabase.from('lifts').update({ current_tm: v }).eq('id', l.id)
          if (up.error) throw up.error
          const th = await supabase.from('tm_history').insert({
            lift_id: l.id,
            value: v,
            effective_date: today,
            reason: 'Manual adjustment (settings)',
          })
          if (th.error) throw th.error
        }
      }
      setTmPhase('saved')
      reload()
    } catch (e) {
      setTmPhase('error')
      setMsg(e.message)
    }
  }

  return (
    <section className="screen">
      <div className="session-header">
        <div className="session-title">Settings</div>
      </div>

      <div className="card">
        <div className="set-name">Training Maxes</div>
        <div className="muted acc-hint">Manual override — logged to history with today’s date.</div>
        <div className="tm-grid">
          {orderedLifts.map((l) => (
            <label className="tm-row" key={l.id}>
              <span className="tm-name">
                {l.name} <span className="muted">· {l.category}</span>
              </span>
              <input
                className="input tm-input"
                type="number"
                inputMode="numeric"
                min="0"
                value={tm[l.id] ?? ''}
                onChange={(e) => setTm((prev) => ({ ...prev, [l.id]: e.target.value }))}
              />
            </label>
          ))}
        </div>
        <button className="btn btn-primary finish-btn" onClick={saveTMs} disabled={tmPhase === 'saving'}>
          {tmPhase === 'saving' ? 'Saving…' : tmPhase === 'saved' ? 'Saved ✓' : 'Save Training Maxes'}
        </button>
      </div>

      <div className="card">
        <div className="set-name">Plate inventory</div>
        <div className="muted acc-hint">Per side. Changes recalculate weights immediately.</div>

        <label className="tm-row bar-row">
          <span className="tm-name">Bar weight (lb)</span>
          <input
            className="input tm-input"
            type="number"
            inputMode="decimal"
            min="0"
            value={bar}
            onChange={(e) => setBar(e.target.value)}
          />
        </label>

        <div className="plate-list">
          {plates.map((p) => (
            <div className="plate-stepper" key={p.plate_weight}>
              <span className="plate-w">{p.plate_weight} lb</span>
              <div className="stepper">
                <button className="chip-btn" onClick={() => setCount(p.plate_weight, p.count - 1)}>
                  −
                </button>
                <span className="stepper-count">{p.count}</span>
                <button className="chip-btn" onClick={() => setCount(p.plate_weight, p.count + 1)}>
                  +
                </button>
              </div>
              <button className="link-btn acc-remove" onClick={() => removePlate(p.plate_weight)} aria-label="Remove">
                ✕
              </button>
            </div>
          ))}
        </div>

        <div className="add-plate">
          <input
            className="input"
            type="number"
            inputMode="decimal"
            min="0"
            placeholder="New plate lb (e.g. 2.5)"
            value={newPlate}
            onChange={(e) => setNewPlate(e.target.value)}
          />
          <button className="btn btn-secondary add-plate-btn" onClick={addPlate}>
            Add
          </button>
        </div>

        <button className="btn btn-primary finish-btn" onClick={saveInventory} disabled={invPhase === 'saving'}>
          {invPhase === 'saving' ? 'Saving…' : invPhase === 'saved' ? 'Saved ✓' : 'Save inventory'}
        </button>
      </div>

      {(tmPhase === 'error' || invPhase === 'error') && <p className="error">Save failed: {msg}</p>}
    </section>
  )
}
