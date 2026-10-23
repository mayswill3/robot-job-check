"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import type { Dataset, Occupation, SlimOccupation, Thresholds } from "@/lib/types";
import { SearchBox } from "./SearchBox";
import { ResultCard } from "./ResultCard";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import styles from "./JobChecker.module.css";

interface Props {
  example: Occupation;
  all: SlimOccupation[];
  thresholds: Thresholds;
  employmentPeriod: string;
  popular: { label: string; soc: string }[];
  selected: Occupation;
  label: string;
  isExample: boolean;
  onSelect: (o: Occupation, label: string) => void;
}

export function JobChecker({ example, all, thresholds, employmentPeriod, popular, selected, label, isExample, onSelect }: Props) {
  const [full, setFull] = useState<Occupation[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState<string | null>(null);
  const started = useRef(false);
  const pendingRef = useRef<{ soc: string; label: string } | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const scrollNext = useRef(false);
  const reduced = useReducedMotion();

  // The full dataset (aliases + tasks, ~90 KB gzipped) loads after first paint;
  // the preloaded example comes with the HTML so the card is never empty.
  const load = useCallback(() => {
    if (started.current) return;
    started.current = true;
    fetch("/data/occupations.json")
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
      .then((d: Dataset) => {
        setFull(d.occupations);
        // A chip tapped before the data arrived: honour it now.
        const p = pendingRef.current;
        if (p) {
          pendingRef.current = null;
          setPending(null);
          const o = d.occupations.find((x) => x.soc === p.soc);
          if (o) {
            scrollNext.current = true;
            onSelect(o, p.label);
          }
        }
      })
      .catch((e: Error) => {
        setError(e.message);
        pendingRef.current = null;
        setPending(null);
      });
  }, [onSelect]);

  useEffect(() => {
    // Wait for an idle moment (or 1.5s) so the fetch and parse stay out of the load burst,
    // unless the reader touches the checker first, which calls load() directly.
    const w = window as Window & { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number; cancelIdleCallback?: (id: number) => void };
    let idleId: number | undefined;
    let timer: ReturnType<typeof setTimeout> | undefined;
    if (w.requestIdleCallback) idleId = w.requestIdleCallback(load, { timeout: 1500 });
    else timer = setTimeout(load, 300);
    return () => {
      if (idleId !== undefined && w.cancelIdleCallback) w.cancelIdleCallback(idleId);
      if (timer) clearTimeout(timer);
    };
  }, [load]);

  // On a phone the card starts below the fold, so a pick would look like nothing happened.
  // Bring the top of the card into view when the pick came from the search or a chip.
  useEffect(() => {
    if (!scrollNext.current) return;
    scrollNext.current = false;
    const el = cardRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    if (r.top < 0 || r.top > window.innerHeight * 0.45) {
      el.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "start" });
    }
  }, [selected, reduced]);

  function pickChip(p: { label: string; soc: string }) {
    const o = full?.find((x) => x.soc === p.soc) ?? (p.soc === example.soc ? example : null);
    if (o) {
      scrollNext.current = true;
      onSelect(o, p.label);
    } else {
      pendingRef.current = { soc: p.soc, label: p.label };
      setPending(p.soc);
      load();
    }
  }

  return (
    <div className={styles.wrap} onPointerEnter={load} onTouchStart={load} onFocus={load}>
      <SearchBox
        items={full}
        onTouch={load}
        onPick={(o, l) => {
          scrollNext.current = true;
          onSelect(o, l);
        }}
      />
      {error ? <p className={styles.error}>Couldn&rsquo;t load the job list ({error}). Refresh to try again.</p> : null}
      <div className={styles.chips} role="group" aria-label="Popular jobs">
        {popular.map((p) => (
          <button
            key={p.soc}
            type="button"
            className={styles.chip}
            aria-pressed={!isExample && selected.soc === p.soc}
            aria-busy={pending === p.soc}
            onClick={() => pickChip(p)}
          >
            {p.label}
            {pending === p.soc ? <span aria-hidden="true">&hellip;</span> : null}
          </button>
        ))}
      </div>
      <div ref={cardRef} className={styles.cardAnchor}>
        <ResultCard occ={selected} label={label} isExample={isExample} all={all} thresholds={thresholds} employmentPeriod={employmentPeriod} />
      </div>
    </div>
  );
}
