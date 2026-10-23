"use client";
import { useEffect, useState } from "react";
import type { Dataset, Occupation, SlimOccupation, Thresholds } from "@/lib/types";
import { SearchBox } from "./SearchBox";
import { ResultCard } from "./ResultCard";
import styles from "./JobChecker.module.css";

interface Props {
  example: Occupation;
  all: SlimOccupation[];
  thresholds: Thresholds;
  employmentPeriod: string;
  popular: { label: string; soc: string }[];
  selected: Occupation;
  onSelect: (o: Occupation) => void;
}

export function JobChecker({ example, all, thresholds, employmentPeriod, popular, selected, onSelect }: Props) {
  const [full, setFull] = useState<Occupation[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  // The full dataset (aliases + tasks, ~90 KB gzipped) loads after first paint;
  // the preloaded example comes with the HTML so the card is never empty.
  useEffect(() => {
    let cancelled = false;
    const load = () =>
      fetch("/data/occupations.json")
        .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
        .then((d: Dataset) => {
          if (!cancelled) setFull(d.occupations);
        })
        .catch((e: Error) => !cancelled && setError(e.message));
    // Wait for an idle moment (or 1.5s) so the fetch and parse stay out of the load burst.
    const w = window as Window & { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number; cancelIdleCallback?: (id: number) => void };
    let idleId: number | undefined;
    let timer: ReturnType<typeof setTimeout> | undefined;
    if (w.requestIdleCallback) idleId = w.requestIdleCallback(load, { timeout: 1500 });
    else timer = setTimeout(load, 300);
    return () => {
      cancelled = true;
      if (idleId !== undefined && w.cancelIdleCallback) w.cancelIdleCallback(idleId);
      if (timer) clearTimeout(timer);
    };
  }, []);

  function pickSoc(soc: string) {
    const o = full?.find((x) => x.soc === soc) ?? (soc === example.soc ? example : null);
    if (o) onSelect(o);
  }

  return (
    <div className={styles.wrap}>
      <SearchBox items={full} onPick={onSelect} />
      {error ? <p className={styles.error}>Couldn&rsquo;t load the job list ({error}). Refresh to try again.</p> : null}
      <div className={styles.chips} role="group" aria-label="Popular jobs">
        {popular.map((p) => (
          <button
            key={p.soc}
            type="button"
            className={styles.chip}
            aria-pressed={selected.soc === p.soc}
            disabled={!full && p.soc !== example.soc}
            onClick={() => pickSoc(p.soc)}
          >
            {p.label}
          </button>
        ))}
      </div>
      <ResultCard occ={selected} all={all} thresholds={thresholds} employmentPeriod={employmentPeriod} />
    </div>
  );
}
