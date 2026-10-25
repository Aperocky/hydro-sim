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

## Stage 2 — integrate single-channel transport

- Ordinary river water is collected for all basins before lakes are filled.
  The existing overflow queue and superbasin merge/split machinery are retained.
- Overflow routes incremental water through the same transport engine. Outlet
  connections record actual spill volumes rather than estimating flow from lake
  storage. Sediment/erosion runs once after all water routing, including outlets.
- Initial lake intakes remain fixed during routing, even when lakes expand.
  Channel/lake membership reflects those expansions on the following turn.
- Evaluation: all 70 tests across 19 suites passed, including long-running
  stability, outlet erosion, lake reconstruction, and superbasin regressions.
  Suite time was 62.8 s versus the baseline's 65.6 s (unseeded suite; these are
  observations, not a controlled performance comparison). Browser bundle builds.
