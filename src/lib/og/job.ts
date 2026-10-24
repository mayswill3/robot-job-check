import "server-only";
import { dataset, slim } from "@/lib/data";
import { verdictFor } from "@/lib/verdict";
import { rankContext } from "@/lib/ranking";
import { displayLabel, formatPeople } from "@/lib/format";
import type { CardJob } from "./card";

/** One static page and share card per scored occupation. */
export function jobParams() {
  return dataset.occupations.map((o) => ({ soc: o.soc }));
}

export function occupationFor(soc: string) {
  return dataset.occupations.find((o) => o.soc === soc) ?? null;
}

export function cardJobFor(soc: string): CardJob | null {
  const o = occupationFor(soc);
  if (!o) return null;
  const v = verdictFor(o.score, dataset.meta.thresholds);
  const ctx = rankContext(o, dataset.occupations.map(slim));
  return {
    label: displayLabel(o),
    score: o.score,
    verdictKey: v.key,
    verdictLabel: v.label,
    moreExposedThanPct: ctx.moreExposedThanPct,
    people: formatPeople(o.employment),
  };
}
