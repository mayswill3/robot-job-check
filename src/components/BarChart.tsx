"use client";
import { scaleLinear } from "d3-scale";
import type { VerdictKey } from "@/lib/types";
import { useInView } from "@/hooks/useInView";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import styles from "./BarChart.module.css";

export interface BarDatum {
  id: string;
  label: string;
  sub?: string;
  value: number;
  verdict: VerdictKey;
  highlight?: boolean;
  prefix?: string;
  inserted?: boolean;
}

interface Props {
  data: BarDatum[];
  max?: number;
  ariaLabel: string;
  valueSuffix?: string;
  /** Put the sub label after the name instead of under the bar (saves a line per row). */
  subInline?: boolean;
  /** One line per row on wide screens: name, bar, score. Sub label goes inline. */
  compact?: boolean;
}

/** Horizontal bars as an HTML/CSS chart with a d3 linear scale: accessible as a list, animates in on scroll. */
export function BarChart({ data, max = 100, ariaLabel, valueSuffix = "", subInline = false, compact = false }: Props) {
  const inline = subInline || compact;
  const { ref, inView } = useInView<HTMLOListElement>();
  const reduced = useReducedMotion();
  const x = scaleLinear().domain([0, max]).range([0, 100]);
  return (
    <ol ref={ref} className={`${styles.list} ${compact ? styles.compact : ""}`} aria-label={ariaLabel}>
      {data.map((d, i) => (
        <li key={d.id} className={`${styles.row} ${d.highlight ? styles.highlight : ""} ${d.inserted ? styles.inserted : ""}`}>
          <div className={styles.labelRow}>
            <span className={styles.label}>
              {d.prefix ? <span className={styles.prefix}>{d.prefix}</span> : null}
              {d.label}
              {d.highlight ? <span className={styles.you}> ← you</span> : null}
              {inline && d.sub ? <span className={styles.subInline}> {d.sub}</span> : null}
            </span>
            <span className={`num ${styles.value} ${styles[`ink_${d.verdict}`]}`}>
              {Math.round(d.value)}
              {valueSuffix}
            </span>
          </div>
          <div className={styles.track} aria-hidden="true">
            <div
              className={`${styles.bar} ${styles[d.verdict]}`}
              style={{
                width: inView ? `${x(d.value)}%` : "0%",
                transitionDelay: reduced ? "0ms" : `${Math.min(i, 12) * 40}ms`,
              }}
            />
          </div>
          {d.sub && !inline ? <span className={styles.sub}>{d.sub}</span> : null}
        </li>
      ))}
    </ol>
  );
}
