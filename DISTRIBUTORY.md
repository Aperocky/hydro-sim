# Distributary routing

Basin membership and lake geometry use the original single-direction terrain tree.
Actual river transport uses separate outgoing edges, with up to two normal branches.
Lake outlets can add an additional transfer edge.

## Split rules

Use the previous turn's flow to choose connections and fractions once per turn.
This lets late overflow add water without retracting previously routed water.

- Below 50M m³/year, do not split.
- Select only the two lowest downhill neighboring ground/water surfaces.
- Require positive falls and descending terrain edges; equal/uphill terrain is excluded.
- Compare that pair only: higher matching alternatives cannot bypass it.
- No basin-membership check or spacing rule is applied.

For `q` in millions of m³/year:

```
maximum drop = clamp(1 + log10(q / 50), 1, 3)           // metres
maximum gap  = 0.20 + 0.30 * clamp((q - 50) / 950, 0, 1)
```

The drop to the lowest neighbor must not exceed the maximum drop. The elevation
separation between the two destinations must not exceed the maximum gap.
With only one downhill neighbor, flow remains single-channel.

For `d` = fall to the higher destination and `g` = destination elevation gap:

```
head = d + 0.004 * q
higher share = head / (2 * (head + g))
lower share  = 1 - higher share
```

More volume or a larger fall moves the higher branch's share toward one half.
The volume allowance is a simple weighting, not a calibrated hydraulic depth.
All parameters and equations are in `src/main/sim/util/riverRouting.ts`.

## Water and sediment

Ordinary water is processed downhill before filling lakes. Overflow uses the same
fixed transport graph and returns arrivals per receiving basin. A shared overflow
queue handles both normal turns and terrain reconstruction, including lake merges.

Aquifer exchange uses cumulative input and the original aquifer snapshot, avoiding
repeated rainfall, infiltration, or seepage on late pulses. Lake infiltration has
one allowance per starting lake cell; newly flooded cells participate next turn.

After water routing, erosion and sediment are processed once per channel using
actual outgoing water shares. Terrain changes apply on the next turn. Lake-mouth
deposition can rise 0.10 m above water; saturated-sink fallback retains its existing
settlement behavior.

## Rendering

For `q` in millions of m³/year, river width is
`min(4, (q / 100)^(log(4) / log(50)))` pixels at the current tile size. This gives
0.653 px at 30M, 1 px at 100M, 2.261 px at 1B, and 4 px at/above 5B.

Visible channels start at 30M/year. Their downstream continuations remain drawn
below that cutoff, with a 0.4 px minimum, so they reach the water. Unconnected
sub-threshold streams remain hidden. The shared graphics layer is cleared each
refresh, and each edge is drawn once.

Water-facing endpoints overlap the shoreline by half a pixel. Actual outlets on
dry spillway tiles receive a lake-edge-to-spillway segment; submerged-to-submerged
segments need no river stroke. Hydrology is unchanged by these rendering bridges.

## Verification

```
npx jest --runInBand --silent
npx tsc --noEmit --skipLibCheck --noUnusedLocals --noUnusedParameters
make tsc
```

Cleanup equivalence was checked on three seeded 120×120 maps (seeds 1, 2, 11),
20 turns each. Before/after state hashes matched exactly for terrain, water depth,
basin membership, aquifers, channel volumes, outgoing edges, erosion, deposition,
and lake volumes/surfaces. No overflow warnings occurred. All 134 tests across
20 suites passed, as did the browser build and type/unused-code checks.

The raw type check encounters incompatible installed Node Buffer declarations;
`--skipLibCheck` checks project code without changing dependencies. An existing
unseeded erosion test's 50 m altitude-change assertion can fail on some terrain:
seed 64 produces the same 51.537 m pending rise before and after these changes.
