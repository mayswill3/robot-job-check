"use client";
import { useState } from "react";
import type { SlimOccupation } from "@/lib/types";
import { topList, type ListMode } from "@/lib/ranking";
import { formatPeople } from "@/lib/format";
import { BarChart } from "./BarChart";
import styles from "./TopBottom.module.css";

function ordinal(n: number): string {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return `${n}${s[(v - 20) % 10] ?? s[v] ?? s[0]}`;
}

export function TopBottom({ all, selected, selectedLabel }: { all: SlimOccupation[]; selected: SlimOccupation; selectedLabel?: string }) {
  const [mode, setMode] = useState<ListMode>("risk");
  const rows = topList(all, mode, 10, selected.soc);
  return (
    <div>
      <div className={styles.toggle} role="group" aria-label="Show most at risk or safest jobs">
        <button type="button" aria-pressed={mode === "risk"} onClick={() => setMode("risk")} className={styles.btn}>
          Most at risk
        </button>
        <button type="button" aria-pressed={mode === "safe"} onClick={() => setMode("safe")} className={styles.btn}>
          Safest
        </button>
      </div>
      <BarChart
        key={mode}
        ariaLabel={mode === "risk" ? "Ten most exposed jobs in Britain" : "Ten safest jobs in Britain"}
        data={rows.map((r) => ({
          id: r.occ.soc,
          label: r.isReader && selectedLabel ? selectedLabel : r.occ.title,
          prefix: `${r.position}.`,
          sub: `${formatPeople(r.occ.employment)} people`,
          value: r.occ.score,
          verdict: r.occ.verdict,
          highlight: r.isReader,
          inserted: r.inserted,
        }))}
      />
      {rows.some((r) => r.inserted) ? (
        <p className={styles.note}>
          Your job is the {ordinal(rows.find((r) => r.inserted)!.position)} {mode === "risk" ? "most exposed" : "safest"} of {all.length}, so
          we&rsquo;ve slotted it in below the top ten.
        </p>
      ) : null}
    </div>
  );
}
