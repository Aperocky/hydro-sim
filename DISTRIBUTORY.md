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

## Stage 3 — distributaries and rendering

- Enabled up to two destinations within the same base basin. Both downhill drops
  must be at most 1 m, and the smaller must be at least 80% of the larger.
  Submerged neighbors use water surface elevation. Branch shares follow drops.
- Splitting requires at least 80 million m³ in the previous turn, with each
  predicted branch above 30 million m³. Fractions stay fixed during the turn;
  volume changes can activate/deactivate a split on the following turn.
- River drawing now uses actual per-edge volumes, including recorded outlet
  transfers. Removed fabricated outlet flows and the obsolete recursive routines.
- Evaluation: all 84 tests across 20 suites passed. Coverage includes split/rejoin
  conservation, late overflow, pulse partition/order, eligibility boundaries,
  lake surface comparisons, actual rendered widths, stale-line clearing, and
  three complete turns on a controlled flat shelf that develops distributaries.
- Browser build and project type check (`tsc --noEmit --skipLibCheck`) passed.
  The raw type check encounters incompatible installed Node Buffer declarations;
  no dependency versions or compiler settings were changed.
- Seeded bundled comparison against master: three 120×120 maps, 12 turns per map.
  Baseline averaged 48–54 ms/turn; this branch averaged 58–67 ms/turn. Neither
  produced invalid numeric states or overflow-limit warnings. One map developed
  two simultaneous distributaries. Maximum absolute net pending terrain change
  on this branch was below 1.8e-13 m summed across tiles, consistent with sediment
  conservation; baseline was 0.078–0.272 m in the same diagnostic.

## Deliberate limits

- Basin membership and lake geometry retain their original primary tree.
  Distributaries do not cross base-basin divides or traverse level/uphill cells.
- Lake expansion and split threshold changes affect transport on the next turn.
- Lake infiltration is limited to the starting footprint and its fixed allowance.
  Hydrology/erosion timing therefore differs from master; identical landscapes
  after many turns are not expected.
- Saturated lake/dry-sink sediment fallback retains the existing settlement
  behavior. Normal channel sediment uses the actual branching water network.
- Thresholds are exported at the top of `src/main/sim/util/riverRouting.ts`.
  These initial values are conservative; distributaries should be uncommon on
  steep generated terrain and become more relevant on flat depositional ground.
