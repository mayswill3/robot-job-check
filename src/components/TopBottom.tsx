"use client";
import { useState } from "react";
import type { SlimOccupation } from "@/lib/types";
import { topList, type ListMode } from "@/lib/ranking";
import { formatPeople } from "@/lib/format";
import { RankList } from "./RankList";
import { ShowMore } from "./ShowMore";
import styles from "./TopBottom.module.css";

const SHORT = 5;
const FULL = 10;

function ordinal(n: number): string {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return `${n}${s[(v - 20) % 10] ?? s[v] ?? s[0]}`;
}

export function TopBottom({ all, selected, selectedLabel }: { all: SlimOccupation[]; selected: SlimOccupation; selectedLabel?: string }) {
  const [mode, setMode] = useState<ListMode>("risk");
  const [open, setOpen] = useState(false);
  const full = topList(all, mode, FULL, selected.soc);
  // Five rows make the point; the rest are a tap away. The reader's row is always kept.
  const rows = open ? full : full.filter((r) => r.position <= SHORT || r.isReader);
  const inserted = rows.find((r) => r.inserted);
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
      <RankList
        key={mode}
        ariaLabel={mode === "risk" ? "Most exposed jobs in Britain" : "Safest jobs in Britain"}
        rows={rows.map((r) => ({
          id: r.occ.soc,
          position: r.position,
          label: r.isReader && selectedLabel ? selectedLabel : r.occ.title,
          sub: `${formatPeople(r.occ.employment)} people`,
          value: r.occ.score,
          verdict: r.occ.verdict,
          highlight: r.isReader,
          inserted: r.inserted || (!open && r.isReader && r.position > SHORT),
        }))}
      />
      {!open ? <ShowMore onClick={() => setOpen(true)}>Show all ten</ShowMore> : null}
      {inserted ? (
        <p className={styles.note}>
          Your job is the {ordinal(inserted.position)} {mode === "risk" ? "most exposed" : "safest"} of {all.length}, so we&rsquo;ve slotted it
          in.
        </p>
      ) : null}
    </div>
  );
}
