// Renders the per-side plate breakdown for a loaded bar, e.g. "45 · 5 per side".

export default function PlateLoading({ plates, barWeight = 45 }) {
  if (!plates || plates.length === 0) {
    return <div className="plates muted">Empty bar ({barWeight} lb)</div>
  }
  const sorted = [...plates].sort((a, b) => b - a)
  return (
    <div className="plates">
      <span className="plates-label">{barWeight} bar +</span>
      {sorted.map((p, i) => (
        <span className="plate-chip" key={`${p}-${i}`}>
          {p}
        </span>
      ))}
      <span className="plates-label">/ side</span>
    </div>
  )
}
