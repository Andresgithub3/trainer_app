// Prescribed accessories per training day (PRD §4: per-day list, drop-set
// protocol, target rep zones). Names + flags come from the program history;
// rep targets are the program's standard zones. Logging pre-fills these for
// EVERY session (merged with last session's weights when available).

export const ACCESSORY_PLAN = {
  squat: [
    { name: 'Bulgarian Split Squat', target: '8–10' },
    { name: 'Hamstring Curl', target: '10–12', note: 'Single-leg; start weaker LEFT leg (ACL), match right to left' },
    { name: 'Incline DB Press', target: '8–10', note: 'DBs capped at 30 lb → 3-sec eccentric' },
    { name: 'DB Row', target: '10–12' },
  ],
  bench: [
    { name: 'Pull-ups', target: 'AMRAP', note: 'Bodyweight, then banded' },
    { name: 'DB Shoulder Press', target: '8–12', note: 'Capped at 35 lb → slow tempo when reps exceed zone' },
    { name: 'Seated Cable Row', target: '12', note: 'Drop set: failure → −20% → failure' },
    { name: 'Barbell Curl', target: '8–12' },
  ],
  deadlift: [
    { name: 'Front Squat', target: '8–12' },
    { name: 'RDL', target: '10–12', note: 'Drop set: failure → −20% → failure' },
    { name: 'Lat Pulldown', target: '8–12' },
    { name: 'Face Pulls', target: '12–15' },
  ],
  ohp: [
    { name: 'Dips', target: '8–10', note: 'Bodyweight; add weight belt when 8 reps is easy' },
    { name: 'Lateral Raises', target: '12–15' },
    { name: 'Single-Arm Landmine Row', target: '10–12' },
    { name: 'Hammer Curls', target: '12' },
    { name: 'Tricep Rope Pushdown', target: '12–15' },
  ],
}

export const accessoriesFor = (dayType) => ACCESSORY_PLAN[dayType] ?? []
