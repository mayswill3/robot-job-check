import type { SlimOccupation } from "./types";

export interface RankContext {
  rank: number;
  total: number;
  /** Share of scored occupations this one is more exposed than, 0-100. */
  moreExposedThanPct: number;
  /** Share of UK workers in jobs less exposed than this one, 0-100. */
  moreExposedThanWorkersPct: number;
}

export function rankContext(occ: SlimOccupation, all: SlimOccupation[]): RankContext {
  const total = all.length;
  const below = all.filter((o) => o.score < occ.score);
  const workersBelow = below.reduce((s, o) => s + (o.employment ?? 0), 0);
  const workersAll = all.reduce((s, o) => s + (o.employment ?? 0), 0);
  return {
    rank: occ.rank,
    total,
    moreExposedThanPct: Math.round((below.length / Math.max(1, total - 1)) * 100),
    moreExposedThanWorkersPct: workersAll ? Math.round((workersBelow / workersAll) * 100) : 0,
  };
}

export type ListMode = "risk" | "safe";

export interface RankedRow {
  occ: SlimOccupation;
  /** Position in the chosen ordering, 1-based (1 = most at risk, or 1 = safest). */
  position: number;
  isReader: boolean;
  /** True when this row was spliced in because the reader's job is outside the top n. */
  inserted: boolean;
}

/**
 * Top n most-exposed or safest jobs, with the reader's own job highlighted. If the
 * reader's job is outside the top n it is appended as an extra row at its true position
 * so the list always answers "where am I?".
 */
export function topList(all: SlimOccupation[], mode: ListMode, n: number, readerSoc?: string | null): RankedRow[] {
  const ordered = [...all].sort((a, b) => (mode === "risk" ? b.score - a.score || a.rank - b.rank : a.score - b.score || b.rank - a.rank));
  const rows: RankedRow[] = ordered.slice(0, n).map((occ, i) => ({ occ, position: i + 1, isReader: occ.soc === readerSoc, inserted: false }));
  if (readerSoc && !rows.some((r) => r.isReader)) {
    const idx = ordered.findIndex((o) => o.soc === readerSoc);
    if (idx >= 0) rows.push({ occ: ordered[idx], position: idx + 1, isReader: true, inserted: true });
  }
  return rows;
}
