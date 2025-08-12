export type BinInput = {
  sku: string; location: string; qty: number; type: string;
  pick: boolean; sell: boolean; transfer?: boolean;
  capMode: 'cuin' | 'units' | 'unknown'; capacity: number; used: number; free: number;
  aisle?: string; shelf?: string; prefix?: string;
};

export type MoveRow = {
  sku: string; from: string; to: string; qty: number;
  reason: 'condense_overstock' | 'consolidate_pick';
  estFillAfter: number; // 0..1
};

export type Result = {
  recommendations: MoveRow[];
  binsAfter: BinInput[]; // for UI to re-render utilization if desired
  kpis: { 
    binsFreed: number; 
    opportunities: number; 
    wastedCuIn?: number; 
    wastedUnits?: number; 
    potentialSavingsCuIn?: number; 
    potentialSavingsUnits?: number; 
    totalSellable: number; 
  };
  mixedLocations: { location: string; skus: string[]; totalQty: number }[];
  audit: { 
    noCapBins: number; 
    capModeCounts: Record<string, number>; 
    reasonCounts: Record<string, number>; 
    note: string; 
  };
};

export function computePlan(bins: BinInput[], opts: { headroomPct: number; preferPickAisles: string[]; preferPickShelves: string[] }): Result {
  // 1) sanitize inputs & build diagnostics
  const sellable = bins.filter(b => b.sell);
  const capModeCounts = sellable.reduce((a, b) => (a[b.capMode] = (a[b.capMode] || 0) + 1, a), {} as Record<string, number>);
  const noCapBins = sellable.filter(b => b.capMode === 'unknown').length;

  // detect mixed locations (FYI only)
  const byLoc = new Map<string, Map<string, number>>();
  for (const b of sellable) {
    const m = byLoc.get(b.location) ?? new Map<string, number>();
    m.set(b.sku, (m.get(b.sku) || 0) + b.qty);
    byLoc.set(b.location, m);
  }
  const mixedLocations = Array.from(byLoc.entries())
    .filter(([_, m]) => m.size > 1)
    .map(([location, m]) => ({ location, skus: [...m.keys()], totalQty: [...m.values()].reduce((a, v) => a + v, 0) }));

  // 2) group by SKU
  const bySku = new Map<string, BinInput[]>();
  for (const b of sellable) {
    const arr = bySku.get(b.sku) ?? [];
    arr.push({ ...b }); // clone for simulation
    bySku.set(b.sku, arr);
  }

  const moves: MoveRow[] = [];
  const headroom = opts.headroomPct;

  const scorePick = (b: BinInput) => {
    let s = b.qty;
    if (b.aisle && opts.preferPickAisles.includes(b.aisle.toUpperCase())) s += 100;
    if (b.shelf && opts.preferPickShelves.includes(b.shelf.toUpperCase())) s += 50;
    return s;
  };

  const canAcceptAll = (src: BinInput, dst: BinInput) => {
    if (dst.capMode === 'unknown') return false;
    const addUsed = dst.capMode === 'cuin' ? src.used : src.qty;
    return (dst.used + addUsed) <= dst.capacity * headroom;
  };

  const applyMove = (src: BinInput, dst: BinInput, reason: MoveRow['reason']) => {
    const addUsed = dst.capMode === 'cuin' ? src.used : src.qty;
    dst.used += addUsed;
    dst.free = Math.max(dst.capacity - dst.used, 0);
    dst.qty += src.qty;
    src.used = 0; src.qty = 0; src.free = src.capacity; // emptied
    const estFillAfter = dst.capacity > 0 ? Math.min(dst.used / dst.capacity, 1) : 0;
    moves.push({ sku: src.sku, from: src.location, to: dst.location, qty: (dst.capMode === 'cuin' ? src.qty /* units unknown here */ : src.qty), reason, estFillAfter });
  };

  for (const [sku, arr] of bySku) {
    const P = arr.filter(b => b.pick);
    const O = arr.filter(b => !b.pick); // overstock or NP/NS but sellable only here

    // Phase 1: condense overstock (empty-only)
    let Os = O.filter(b => b.capMode !== 'unknown' && b.qty > 0);
    while (Os.length > 1) {
      // pick target with max free
      Os.sort((a, b) => (b.free - a.free) || a.location.localeCompare(b.location));
      const target = Os[0];
      // find smallest source that fully fits
      const source = Os.slice(1).filter(s => s.location !== target.location && s.qty > 0 && canAcceptAll(s, target))
        .sort((a, b) => a.qty - b.qty)[0];
      if (!source) break;
      applyMove(source, target, 'condense_overstock');
      Os = O.filter(b => b.capMode !== 'unknown' && b.qty > 0);
    }

    // Phase 2: consolidate pick (empty-only)
    const Ps = P.filter(b => b.capMode !== 'unknown' && b.qty > 0);
    if (Ps.length > 1) {
      Ps.sort((a, b) => (scorePick(b) - scorePick(a)) || a.location.localeCompare(b.location));
      const primary = Ps[0];
      for (const src of Ps.slice(1)) {
        if (src.qty === 0) continue;
        if (canAcceptAll(src, primary)) applyMove(src, primary, 'consolidate_pick');
      }
    }
  }

  // compute KPIs (waste/potential savings are directional; we keep simple)
  const after = Array.from(bySku.values()).flat();
  const sellableAfter = after.filter(b => b.sell);
  const totalSellable = sellable.length;
  const binsFreed = sellable.filter(b => b.qty > 0).length - sellableAfter.filter(b => b.qty > 0).length;
  const opportunities = new Set(moves.map(m => m.sku)).size;

  // Wasted space sums by mode
  const wastedCuIn = sellableAfter.filter(b => b.capMode === 'cuin').reduce((a, b) => a + Math.max(b.capacity - b.used, 0), 0);
  const wastedUnits = sellableAfter.filter(b => b.capMode === 'units').reduce((a, b) => a + Math.max(b.capacity - b.used, 0), 0);

  return {
    recommendations: moves,
    binsAfter: sellableAfter,
    kpis: { binsFreed, opportunities, totalSellable, wastedCuIn: wastedCuIn || undefined, wastedUnits: wastedUnits || undefined },
    mixedLocations,
    audit: { noCapBins, capModeCounts, reasonCounts: moves.reduce((a, m) => (a[m.reason] = (a[m.reason] || 0) + 1, a), {} as Record<string, number>), note: 'Empty-only; prefer A01–A03 & shelves B/C/D for pick.' }
  };
} 