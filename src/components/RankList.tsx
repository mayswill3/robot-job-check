"use client";
import type { VerdictKey } from "@/lib/types";
import styles from "./RankList.module.css";

export interface RankRow {
  id: string;
  position: number;
  label: string;
  sub?: string;
  value: number;
  verdict: VerdictKey;
  highlight?: boolean;
  inserted?: boolean;
}

/** One line per job: rank, name, headcount, score chip. For lists where the scores
 *  are all near the top or bottom and a bar would say nothing. */
export function RankList({ rows, ariaLabel }: { rows: RankRow[]; ariaLabel: string }) {
  return (
    <ol className={styles.list} aria-label={ariaLabel}>
      {rows.map((r) => (
        <li key={r.id} className={`${styles.row} ${r.highlight ? styles.highlight : ""} ${r.inserted ? styles.inserted : ""}`}>
          <span className={`num ${styles.pos}`}>{r.position}</span>
          <span className={styles.name}>
            {r.label}
            {r.highlight ? <span className={styles.you}> ← you</span> : null}
            {r.sub ? <span className={styles.sub}> {r.sub}</span> : null}
          </span>
          <span className={`num ${styles.chip} ${styles[r.verdict]}`}>{Math.round(r.value)}</span>
        </li>
      ))}
    </ol>
  );
}
