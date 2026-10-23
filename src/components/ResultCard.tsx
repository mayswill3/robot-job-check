"use client";
import { useState } from "react";
import type { Occupation, SlimOccupation, Thresholds } from "@/lib/types";
import { verdictFor } from "@/lib/verdict";
import { rankContext } from "@/lib/ranking";
import { formatPeople, shareLine } from "@/lib/format";
import { Gauge } from "./Gauge";
import { TaskBars } from "./TaskBars";
import styles from "./ResultCard.module.css";

interface Props {
  occ: Occupation;
  all: SlimOccupation[];
  thresholds: Thresholds;
  employmentPeriod: string;
}

export function ResultCard({ occ, all, thresholds, employmentPeriod }: Props) {
  const v = verdictFor(occ.score, thresholds);
  const ctx = rankContext(occ, all);
  const [copied, setCopied] = useState<"idle" | "done" | "fail">("idle");

  async function copy() {
    const url = typeof window !== "undefined" ? window.location.origin + window.location.pathname : "";
    const text = shareLine(occ.title, occ.score, v.label, ctx.moreExposedThanPct, url);
    try {
      await navigator.clipboard.writeText(text);
      setCopied("done");
    } catch {
      setCopied("fail");
    }
    setTimeout(() => setCopied("idle"), 2500);
  }

  return (
    <article className={`${styles.card} ${styles[`tone_${v.key}`]}`} aria-live="polite" aria-atomic="true">
      <p className={styles.eyebrow}>Your job: <strong>{occ.title}</strong></p>
      <div className={styles.gaugeRow}>
        <Gauge score={occ.score} thresholds={thresholds} verdict={v.key} />
      </div>
      <h3 className={`${styles.verdict} ${styles[`ink_${v.key}`]}`}>
        <span aria-hidden="true">{v.mark} </span>
        {v.label}
      </h3>
      <p className={styles.line}>{v.line}</p>

      <dl className={styles.stats}>
        <div>
          <dt>Rank</dt>
          <dd>
            <span className="num">{ctx.rank}</span>
            <span className={styles.small}> of {ctx.total} jobs</span>
          </dd>
        </div>
        <div>
          <dt>More exposed than</dt>
          <dd>
            <span className="num">{ctx.moreExposedThanPct}%</span>
            <span className={styles.small}> of UK jobs</span>
          </dd>
        </div>
        <div>
          <dt>People doing it</dt>
          <dd>
            <span className="num">{formatPeople(occ.employment)}</span>
            <span className={styles.small}> in the UK</span>
          </dd>
        </div>
      </dl>

      <h4 className={styles.sub}>
        What the robot could take on <span className={styles.estimated}>Estimated</span>
      </h4>
      <TaskBars tasks={occ.tasks} thresholds={thresholds} />
      <p className={styles.foot}>
        Tasks from the ONS job description. Per-task scores are our estimate from the wording, anchored on the job&rsquo;s overall
        exposure. Employment: ONS Annual Population Survey, {employmentPeriod}.
        {occ.mapping.type !== "one-to-one" ? ` Exposure score inherited through a ${occ.mapping.type} SOC code mapping.` : ""}
      </p>

      <div className={styles.shareRow}>
        <button type="button" className={styles.share} onClick={copy}>
          {copied === "done" ? "Copied!" : copied === "fail" ? "Couldn't copy" : "Copy my result"}
        </button>
        <span className={styles.shareText} aria-live="polite">
          {copied === "done" ? "Paste it in the group chat." : `“${v.label}” · ${Math.round(occ.score)}/100`}
        </span>
      </div>
    </article>
  );
}
