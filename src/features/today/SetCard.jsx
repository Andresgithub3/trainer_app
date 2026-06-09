import { closestLoadable } from '../../../lib/plateRounding.js'
import PlateLoading from '../../components/PlateLoading.jsx'

const ordinal = ['Set 1', 'Set 2', 'Top set']

export default function SetCard({ set, barWeight, inventory }) {
  const pct = Math.round(set.pct * 100)
  const repLabel = set.isAmrap ? `${set.reps}+ reps` : `${set.reps} reps`

  return (
    <div className={`set-card${set.isAmrap ? ' set-card--top' : ''}`}>
      <div className="set-head">
        <span className="set-name">{ordinal[set.setIndex] ?? `Set ${set.setIndex + 1}`}</span>
        {set.isAmrap && <span className="badge">AMRAP</span>}
        <span className="set-meta">
          {pct}% · target {set.rawWeight}
        </span>
      </div>

      {set.needsChoice ? (
        <div className="choice">
          <div className="choice-note">No exact load — choose:</div>
          <div className="choice-options">
            {[set.alternatives.below, set.alternatives.above].map((total) => {
              const opt = closestLoadable(total, barWeight, inventory)
              return (
                <div className="choice-option" key={total}>
                  <div className="weight weight--sm">{total}</div>
                  <PlateLoading plates={opt.plates} barWeight={barWeight} />
                </div>
              )
            })}
          </div>
          <div className="set-reps">{repLabel}</div>
        </div>
      ) : (
        <>
          <div className="weight-row">
            <span className="weight">{set.chosen}</span>
            <span className="weight-unit">lb</span>
            <span className="set-reps">{repLabel}</span>
          </div>
          <PlateLoading plates={set.plates} barWeight={barWeight} />
        </>
      )}
    </div>
  )
}
