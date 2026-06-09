# Product Requirements Document
## Benchmark Tracker — Personal Strength + Hybrid Running App

Owner: Andres
Version: 1.0
Status: Ready for build
Target build tool: Claude Code

## 1. Overview

A mobile-first web app for a single user to run the Benchmark Project 4-Day Strength + Hybrid Running Program over its 12-week duration. The app's core job is to remove all manual math: it calculates each session's wave-loaded working weights from the user's Training Maxes, rounds them to the plates physically available, suggests Training Max increases based on AMRAP performance, and tracks progress across the full program. Existing progress (block 1 plus current Week 2 lifts) seeds the database.

## 2. Goals and non-goals

Goals
- Auto-calculate every working set from Training Max, wave week, and percentage, rounded to loadable weights.
- Recommend Training Max adjustments after AMRAP top sets using the program's logic.
- Visualize progress (TM growth, AMRAP rep trends, run volume) across 12 weeks.
- Provide fast, thumb-friendly workout logging on a phone.
- Sync seamlessly between phone and laptop.

Non-goals
- No multi-user accounts, social features, or sharing (single user only).
- No nutrition tracking, no wearable/HR integration in v1.
- No native app — web only, though installable as a PWA.
- No general workout builder — this app runs this specific program.

## 3. Users and context

Single user, two synced devices (phone primary for logging, laptop for review). Trains early mornings. Uses an Olympic bar (45 lb) and a fixed plate inventory. Needs to glance at a card mid-set and log fast between sets.

## 4. Core domain model

- Lifts: Squat, Bench, Deadlift, OHP — each with its own Training Max.
- Training Max (TM): per-lift, 85–90% of true 1RM. Upper lifts +5 lb/block, lower +10 lb/block on increase.
- Wave weeks (4-week block):
  - Week 1: Set1 5@70%, Set2 5@75%, Top 5+@80%
  - Week 2: Set1 3@75%, Set2 3@80%, Top 3+@85%
  - Week 3: Set1 5@75%, Set2 3@85%, Top 1+@90%
  - Week 4 (deload): Set1 5@40%, Set2 5@50%, Top 5@60%
- Accessories: per-day list, drop-set protocol (failure → −20% → failure), target rep zones.
- Runs: Easy (Z2), Tempo (Z3/Z4), Long (Z2) with the 12-week mileage progression.
- Plate inventory: per-side available plates, used by the rounding engine.

## 5. Features and requirements (in build-priority order)

### 5.1 Wave-weight calculation engine (priority 1)
- Given a lift, current TM, and wave week, compute the three working sets (reps × weight).
- Round each to the nearest loadable total given the plate inventory and bar weight. Prefer rounding that keeps the AMRAP set at or slightly above target rather than under.
- Display the per-side plate loading for each set (e.g., "135 lb = 45/side").
- Surface a flag when a clean round isn't possible and show the two nearest options.
- Plate inventory is editable in settings; recalculation is immediate.

### 5.2 Training Max auto-suggestion (priority 2)
- After an AMRAP top set is logged, estimate 1RM using (weight × reps × 0.0333) + weight.
- Compare implied capacity to current TM. If AMRAP reps substantially exceed the week's target (e.g., a Week-1 5+ set producing 12+), recommend a TM increase and show the suggested new TM and resulting next-session weights.
- Recommendations are suggestions the user confirms or overrides — never auto-applied silently.
- At end of each 4-week block, prompt the standard increase (+5 upper / +10 lower) with the option to accept a larger calibration jump.
- Keep a log of TM changes over time with the reason (block increase vs. AMRAP-driven).

### 5.3 Progress charts (priority 3)
- TM-over-time line per lift.
- AMRAP rep-count trend per lift across blocks (the program's key progress signal).
- Run volume per week against the 12-week plan.
- Block/week completion overview.

### 5.4 Fast mobile logging (priority 4)
- Today's session auto-selected from the program calendar; one tap to open.
- Pre-filled prescribed weights and reps; user confirms or edits actuals inline with large tap targets.
- Accessory logging captures both drop-set weights and failure reps quickly.
- Run logging captures duration, type, and a perceived-effort note.
- Rest-timer affordance between sets (optional, lightweight).

### 5.5 Program calendar
- Maps the Mon-Squat / Tue-Bench / Wed-run / Thu-Deadlift / Fri-OHP / Sat-long-run / Sun-rest structure across 12 weeks and 3 blocks.
- Handles real-world day-shifting: a missed session slides to the next open slot without doubling compound days back-to-back (per program rules), and the run-progression rule (advance only after 2 consecutive completed weeks) is enforced.

### 5.6 Plate-rounding algorithm (part of the calculation engine, 5.1)

Inputs: targetWeight, barWeight, plateInventory (array of per-side plate weights, with duplicates representing multiple pairs — e.g. [5, 10, 10, 25, 35, 45]).

Output: the closest loadable total, the per-side weight, and the specific plates to load. When the nearest total sits equally between two options, or a clean round isn't possible within a tolerance, return both neighbors so the UI can flag it.

Method — enumerate achievable per-side combinations:
Because the inventory is small, brute-force enumeration of all subsets is fast and exact. For n plates there are 2^n subsets; with ~6 plates that's 64 combinations, trivial.
1. The weight a bar carries beyond its own weight is 2 × (sum of plates on one side). Compute every possible per-side sum by taking every subset of the per-side plate list.
2. Each per-side sum s produces a loadable total of barWeight + 2s. Collect these into a set of achievable totals (dedupe).
3. For each achievable total, store which subset produced it (prefer the subset using the fewest plates when sums tie).
4. Find the achievable total with the smallest absolute distance to targetWeight.
5. Apply rounding bias: when two totals are equidistant, prefer the heavier one for AMRAP/top sets (so the top set bites) and the nearer-or-lighter one for fixed back-off sets. Pass a setType flag to control this.
6. If the closest achievable total differs from target by more than a tolerance (> 5 lb), return both nearest-below and nearest-above and set a needsChoice flag for the UI.

Pseudocode:
    function closestLoadable(targetWeight, barWeight, plateInventory, setType = 'backoff') {
      const perSideSums = subsetSums(plateInventory); // includes 0 (empty bar)
      const totalsMap = new Map();
      for (const { sum, plates } of perSideSums) {
        const total = barWeight + 2 * sum;
        if (!totalsMap.has(total) || plates.length < totalsMap.get(total).length) {
          totalsMap.set(total, plates);
        }
      }
      const totals = [...totalsMap.keys()].sort((a, b) => a - b);
      const below = [...totals].reverse().find(t => t <= targetWeight);
      const above = totals.find(t => t >= targetWeight);
      const dBelow = below != null ? targetWeight - below : Infinity;
      const dAbove = above != null ? above - targetWeight : Infinity;
      let chosen;
      if (dBelow === dAbove) {
        chosen = setType === 'amrap' ? above : below;
      } else {
        chosen = dBelow < dAbove ? below : above;
      }
      const needsChoice = Math.min(dBelow, dAbove) > 5;
      return {
        chosen,
        perSide: (chosen - barWeight) / 2,
        plates: totalsMap.get(chosen),
        alternatives: needsChoice ? { below, above } : null,
        needsChoice,
      };
    }

    function subsetSums(plates) {
      const results = [{ sum: 0, plates: [] }];
      for (const p of plates) {
        const snapshot = [...results];
        for (const r of snapshot) {
          results.push({ sum: r.sum + p, plates: [...r.plates, p] });
        }
      }
      return results;
    }

Why enumeration over greedy rounding: achievable totals aren't evenly spaced for this inventory, so a naive "round to nearest 5" would offer weights that can't be physically loaded. Enumeration guarantees every suggested weight is real.

## 6. Seed data

See SEED_DATA.md for exact values. Summary:
- Training Maxes: Squat 185, Bench 150, Deadlift 165, OHP 75.
- Plate inventory (per side): 5, 10, 10, 25, 35, 45 lb; Olympic bar 45 lb.
- Completed sessions: Block 1 all four lifts; Week 2 Squat.
- TM change history: the calibration raises already made.
- Accessory notes: single-leg hamstring curls (left-side priority, ACL), incline DB press capped at 30 lb → 3-sec eccentric.
- Current position: Week 2, next session Bench (Tue Jun 9 2026).

## 7. Technical architecture

- Frontend: React (JavaScript, not TypeScript), mobile-first responsive layout, PWA-installable.
- Storage/backend: Supabase (Postgres + auth + realtime). Single-user auth (email magic link). Realtime or refetch keeps phone/laptop in sync.
- Repo: GitHub.
- CI/CD: GitHub → Vercel auto-deploy on push to main; preview deploys on PRs. GitHub Actions for lint/test on PR.
- Hosting: Vercel.
- Calculation logic lives in a pure, well-tested JS module (no framework coupling) so the math can be unit-tested independently.

## 8. Data schema (initial sketch)

- lifts (id, name, category upper/lower, current_tm)
- tm_history (id, lift_id, value, effective_date, reason)
- sessions (id, date, day_type, block, week, status)
- set_logs (id, session_id, lift_id, set_index, is_amrap, prescribed_weight, prescribed_reps, actual_weight, actual_reps)
- accessory_logs (id, session_id, name, set1_weight, set1_reps, set2_weight, set2_reps, notes)
- runs (id, session_id, type, duration_min, distance, effort_note)
- plate_inventory (id, plate_weight, count_per_side, bar_weight)
- settings (single row: current_block, current_week, program_start_date)

## 9. Success criteria

- Opening today's session shows correct, plate-rounded weights with zero manual math.
- Logging an AMRAP set produces a sensible TM suggestion matching the hand-calculations done so far.
- Phone and laptop reflect the same state within seconds.
- A full week can be logged on the phone in under a minute per strength session.
- Seed data reproduces the current program position exactly on first launch.

## 10. Open questions / future

- Fractional plates (2.5 lb) for true +5 lb OHP jumps — note in settings for when acquired.
- v2: HR zone integration for runs, deload auto-detection, CSV export.