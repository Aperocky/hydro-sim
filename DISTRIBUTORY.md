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

## Stage 3 — initial distributaries and rendering

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
- After the implementation commit, a default-size 200×200 map completed 30 seeded
  turns at 199 ms/turn. Every turn had finite terrain/water/sediment values,
  aquifers within capacity, and outgoing edge volumes matching channel totals.
  No overflow-limit warnings occurred; maximum absolute summed pending terrain
  change was below 9e-13 m. The rebuilt local test server responded with HTTP 200.

## Stage 4 — local split selection across basin divides

- Removed every basin-membership check from split eligibility. The decision uses
  only the source's previous flow volume and neighboring ground/water elevations.
  Raised minimum drop similarity from 80% to 90%; other thresholds are unchanged.
- Ordinary runoff already records arrivals at the actual receiving basin. Late
  overflow now does the same, returning arrivals per basin rather than assigning
  their sum to the first downstream basin. One overflow can enqueue multiple
  subsequent lake overflow events. Receiving owners are resolved after merges.
- Added coverage for basin-label-independent selection, runoff and sediment
  conservation across divides, two receiving overflow events, merged receiving
  lakes, and the 90% threshold boundary.
- Evaluation: all 90 tests across 20 suites passed, as did the browser build and
  project type check with `--skipLibCheck`. A seeded 200×200 map ran 30 turns at
  194 ms/turn with no invalid values, aquifer-capacity violations, outgoing-volume
  mismatches, or overflow-limit warnings. It reached seven simultaneous splits
  with both branches above the drawing threshold, including two crossing base
  basin divides; maximum absolute summed pending terrain change was below 6e-13 m.

## Stage 5 — volume-dependent elevation gaps and branch weights

Let `q` be previous turn flow in millions of m³/year. Below 50, no splitting.
Otherwise, allow a destination elevation gap of:

```
tolerance = 0.20 + 0.30 * clamp((q - 50) / 950, 0, 1)  // metres
```

Inspect the eight neighboring ground/water surfaces and choose the lowest pair
whose gap meets this tolerance and whose destinations are both strictly downhill.
An isolated lower neighbor does not veto two close alternatives. No basin test,
maximum drop, percentage similarity rule, or minimum branch-volume gate remains.

For `d` = drop to the higher destination and `g` = gap between destinations:

```
head = d + 0.004 * q
higherShare = head / (2 * (head + g))
lowerShare = 1 - higherShare
```

The added head is a simple volume weighting, not a calibrated hydraulic depth.
For fixed terrain, larger volume increases the higher branch's share; raising
the source above both destinations also moves the shares toward 50/50. Equal
destination elevations split equally. Shares are positive and conserve volume.

- Tolerance is 0.20 m at 50M/year, 0.35 m at 525M/year, and 0.50 m at/above 1000M/year.
- Pair selection needs at most 28 comparisons and no sorting. Weighting uses
  elementary arithmetic, with no powers, roots, exponentials, or iteration.
- Thin rivers are now drawn above 10M/year (minimum width one pixel), so the
  smaller arm of a 50M/year split is not hidden by the old 30M/year cutoff.
- Evaluation: the complete suite passed 100 of 101 tests. The unseeded erosion
  test asserting every altitude change is under 50 m failed. A separate seeded
  comparison reproduced this existing issue before and after this change:
  seed 64, 150×150, first turn, square (84,86) accumulates exactly the same
  51.53723857667766 m pending rise in both versions. Its bound was not weakened.
  All new routing/weighting/rendering tests passed. Build and project type check
  with `--skipLibCheck` passed.
- A final seeded 200×200, 30-turn run averaged 204 ms/turn, with no invalid numeric
  states, aquifer-capacity violations, outgoing-volume mismatches, or overflow
  warnings. It reached 114 simultaneous splits with each arm above 10M/year,
  including 26 across basin divides. Summed pending terrain change stayed below
  6e-13 m in absolute value.

## Current deliberate limits

- Basin membership and lake geometry retain their original primary tree.
  Distributaries may cross base-basin divides but do not traverse level/uphill cells.
- Lake expansion and split threshold changes affect transport on the next turn.
- Lake infiltration is limited to the starting footprint and its fixed allowance.
  Hydrology/erosion timing therefore differs from master; identical landscapes
  after many turns are not expected.
- Saturated lake/dry-sink sediment fallback retains the existing settlement
  behavior. Normal channel sediment uses the actual branching water network.
- Thresholds are exported at the top of `src/main/sim/util/riverRouting.ts`.
  These initial values are conservative; distributaries should be uncommon on
  steep generated terrain and become more relevant on flat depositional ground.
