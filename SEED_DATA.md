# SEED DATA & TEST FIXTURES — Benchmark Tracker

## ===== CONSTANTS =====

Bar weight: 45 lb (Olympic)

Plate inventory (per side, each value = one plate available on each side):
[5, 10, 10, 25, 35, 45]

Wave table (4-week block):
Week 1:        Set1 5@70%   Set2 5@75%   Top 5+@80%
Week 2:        Set1 3@75%   Set2 3@80%   Top 3+@85%
Week 3:        Set1 5@75%   Set2 3@85%   Top 1+@90%
Week 4 deload: Set1 5@40%   Set2 5@50%   Top 5@60%

1RM estimate formula: (weight * reps * 0.0333) + weight

TM increase rule at end of block: upper lifts (Bench, OHP) +5 lb; lower lifts (Squat, Deadlift) +10 lb.

## ===== CURRENT TRAINING MAXES (seed) =====

Squat:    185
Bench:    150
Deadlift: 165
OHP:       75

## ===== TM CHANGE HISTORY (seed) =====

Bench:    135 -> 150  (reason: AMRAP calibration, 16 reps @ 110)
Deadlift: 145 -> 165  (reason: AMRAP calibration, 14 reps @ 125)
Squat:    170 -> 185  (reason: AMRAP calibration, 12 reps @ 145)
OHP:       75 confirmed (reason: AMRAP calibration, 12 reps @ 65)

## ===== CURRENT PROGRAM POSITION (seed) =====

Block: 1 complete; now in Week 2 of wave
Next session: Bench, Tuesday June 9 2026
Program day structure: Mon Squat / Tue Bench / Wed easy run / Thu Deadlift / Fri OHP / Sat long run / Sun rest

## ===== COMPLETED SESSIONS (seed) =====

# Block 1 — Bench (Week 1, old TM 135)
Bench top set AMRAP: 16 reps @ 110
Accessories:
- Pull-ups: 7 @ bodyweight(~200), then 8 banded(assisted)
- DB Shoulder Press: 16 @ 35, 14 @ 25
- Seated Cable Row: 12 @ 6plates, 12 @ 6plates  (note: no drop taken)
- Barbell Curl: 8 @ 65, 7 @ 55

# Block 1 — Deadlift (Week 1, old TM 145)
Deadlift top set AMRAP: 14 reps @ 125
Accessories:
- Front Squat: 12 @ 95, 13 @ 75
- RDL: 115, 115  (note: no drop taken)
- Lat Pulldown: 8plates, 6plates
- Face Pulls: 4plates, 3plates

# Block 1 — OHP (Week 1, TM 75 / done at 65 calibration)
OHP top set AMRAP: 12 reps @ 65
Accessories:
- Dips: 8 @ bodyweight, 8 @ bodyweight
- Lateral Raises: 12 @ 15, 12 @ 10
- Single-Arm Landmine Row: 12 @ 35, 12 @ 30
- Hammer Curls: 12 @ 25, 12 @ 20
- Tricep Rope Pushdown: 12 @ 3plates, 12 @ 2plates

# Week 2 — Squat (TM 170 at time of session, since raised to 185)
Squat top set AMRAP: 12 reps @ 145
Accessories:
- Bulgarian Split Squat: 8 @ 60, 8 @ 40
- Hamstring Curl: 10 @ 25, 10 @ 25  (NOW single-leg going forward, weak left side first)
- Incline DB Press: 12 @ 30, 12 @ 30  (DBs maxed at 30 -> use 3-sec eccentric)
- DB Row: 10 @ 45plate, 10 @ 35plate

## ===== ACCESSORY NOTES (seed flags) =====

- Hamstring curls: single-leg, start weaker LEFT leg (ACL surgery imbalance), match right to left.
- Incline DB Press: capped at 30 lb dumbbells -> apply 3-second eccentric tempo to stay in 8-10 zone.
- Dips: bodyweight; add weight belt when 8 reps becomes easy.
- DB Shoulder Press: capped at 35 lb -> slow tempo when reps exceed zone.

## ===== UNIT TEST FIXTURES: plate-rounding engine =====
# closestLoadable(target, bar=45, plates=[5,10,10,25,35,45], setType)

target 145, any        -> chosen 145, perSide 50 (45+5),    exact
target 60,  amrap      -> chosen 65,  perSide 10,            nearest (no 60 loadable)
target 128, backoff    -> needsChoice true, {below:125, above:135}  # bench Wk2 top
target 135, any        -> chosen 135, perSide 45,            exact
target 115, any        -> chosen 115, perSide 35,            exact
target 175, any        -> chosen 175, perSide 65 (45+10+10), exact  # requires 2nd pair of 10s
target 85,  any        -> chosen 85,  perSide 20 (10+10),    exact
target 45,  any        -> chosen 45,  perSide 0,             empty bar

## ===== UNIT TEST FIXTURES: wave-weight calculator =====
# waveWeights(TM, week) -> 3 sets {reps, pct, rawWeight}, before plate-rounding

Bench TM 150, Week 2:    Set1 3@75%=112.5  Set2 3@80%=120  Top 3+@85%=127.5
Squat TM 185, Week 2:    Set1 3@75%=138.75 Set2 3@80%=148   Top 3+@85%=157.25
Deadlift TM 165, Week 1: Set1 5@70%=115.5  Set2 5@75%=123.75 Top 5+@80%=132
OHP TM 75, Week 1:       Set1 5@70%=52.5   Set2 5@75%=56.25 Top 5+@80%=60

## ===== UNIT TEST FIXTURES: TM auto-suggestion =====
# suggestTM(currentTM, amrapWeight, amrapReps, week, liftCategory)

Bench, TM 135, 16 reps @ 110, Week1  -> est1RM ~168, recommend raise toward 150 (raise=true)
Deadlift, TM 145, 14 reps @ 125, Week1 -> est1RM ~183, recommend raise toward 165 (raise=true)
Squat, TM 170, 12 reps @ 145, Week2  -> est1RM ~203, recommend raise toward 185 (raise=true)
OHP, TM 75, 12 reps @ 65, Week1      -> est1RM ~91, modest; confirm/hold ~75 (raise=false or small)
# Rule of thumb to encode: if AMRAP reps exceed the week's target floor by a large margin
# (e.g. Week1 top is 5+, produced 12+), recommend raising TM so next top set lands near target reps.