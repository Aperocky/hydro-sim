import { Basin } from '../../components/basin/basin';

export function basinBoundaryTest(basins: Map<number, Basin>): (edgeOf: Set<number>) => boolean {
    const downstream = new Map<Basin, Basin>();
    function group(basin: Basin): Basin {
        while (downstream.has(basin)) {
            const next = downstream.get(basin);
            // Shorten paths when resolving chains of spilling lakes.
            if (downstream.has(next)) downstream.set(basin, downstream.get(next));
            basin = downstream.get(basin);
        }
        return basin;
    }

    for (const basin of Array.from(new Set(basins.values()))) {
        const receiver = basins.get(basin.displaySpillTarget);
        if (!receiver) continue;
        const from = group(basin);
        const to = group(receiver);
        if (from !== to) downstream.set(from, to);
    }

    return edgeOf => {
        if (edgeOf.size < 2) return false;
        let first: Basin | number | undefined;
        for (const anchor of Array.from(edgeOf)) {
            const basin = basins.get(anchor);
            const current = basin ? group(basin) : anchor;
            if (first !== undefined && current !== first) return true;
            first = current;
        }
        return false;
    };
}
