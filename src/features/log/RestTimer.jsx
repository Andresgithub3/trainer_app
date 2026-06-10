import { useEffect, useRef, useState } from 'react'

const PRESETS = [60, 90, 120, 180]
const fmt = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`

// Lightweight between-sets rest timer (PRD §5.4, optional).
export default function RestTimer() {
  const [remaining, setRemaining] = useState(0)
  const [running, setRunning] = useState(false)
  const remainingRef = useRef(0)

  useEffect(() => {
    remainingRef.current = remaining
  }, [remaining])

  useEffect(() => {
    if (!running) return undefined
    const id = setInterval(() => {
      if (remainingRef.current <= 1) {
        setRemaining(0)
        setRunning(false)
        navigator.vibrate?.(200)
      } else {
        setRemaining((r) => r - 1)
      }
    }, 1000)
    return () => clearInterval(id)
  }, [running])

  const start = (s) => {
    setRemaining(s)
    setRunning(true)
  }

  return (
    <div className="card rest-timer">
      <div className="rest-head">
        <span className="rest-label muted">Rest timer</span>
        <span className={`rest-clock${running ? ' rest-clock--run' : ''}`}>{fmt(remaining)}</span>
      </div>
      <div className="rest-presets">
        {PRESETS.map((s) => (
          <button key={s} className="chip-btn" onClick={() => start(s)}>
            {s}s
          </button>
        ))}
        <button className="chip-btn" onClick={() => setRunning(false)} disabled={!running}>
          Stop
        </button>
      </div>
    </div>
  )
}
