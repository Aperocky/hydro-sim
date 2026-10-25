# Distributary implementation evaluation

The `distributory` branch retains the single-direction basin tree for basin
membership, lake geometry, holds, and merges. Actual river transport is separate.

## Stage 1 — single-channel transport foundation

- Added a downhill water pass, cumulative late-overflow routing, and a separate
  downhill sediment pass. The engine is not yet connected to simulation turns.
- Connections and lake intakes are fixed for a turn. Aquifer exchange is evaluated
  from the original state against cumulative input, avoiding repeated seepage.
- Lake infiltration has one allowance per initial lake cell per turn; newly
  flooded river cells start participating in lake infiltration next turn. This
  intentionally replaces repeated infiltration on every overflow pulse.
- Evaluation: baseline suite passed (66 tests); four new focused tests passed:
  single-channel equivalence, pulse partition invariance and water conservation,
  fixed lake infiltration, and sediment conservation. Browser bundle builds.
