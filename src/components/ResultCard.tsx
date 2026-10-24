"use client";
import { useEffect, useState } from "react";
import type { Occupation, SlimOccupation, Thresholds } from "@/lib/types";
import { verdictFor } from "@/lib/verdict";
import { rankContext } from "@/lib/ranking";
import { formatPeople, shareLine } from "@/lib/format";
import { Gauge } from "./Gauge";
import { TaskBars } from "./TaskBars";
import styles from "./ResultCard.module.css";

interface Props {
  occ: Occupation;
  /** What the reader called it ("Nurse"); falls back to the ONS title. */
  label: string;
  /** True until the reader has picked a job: the card is showing the preloaded example. */
  isExample: boolean;
  all: SlimOccupation[];
  thresholds: Thresholds;
  employmentPeriod: string;
}

export function ResultCard({ occ, label, isExample, all, thresholds, employmentPeriod }: Props) {
  const v = verdictFor(occ.score, thresholds);
  const ctx = rankContext(occ, all);
  const [copied, setCopied] = useState<"idle" | "done" | "fail">("idle");
  // navigator.share exists on phones and not in the server render; decide after mount.
  const [canShare, setCanShare] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setCanShare(typeof navigator !== "undefined" && typeof navigator.share === "function"), 0);
    return () => clearTimeout(t);
  }, []);
  const ownName = label.toLowerCase() !== occ.title.toLowerCase();

  async function share() {
    const url =
      typeof window !== "undefined"
        ? `${window.location.origin}/j/${occ.soc}`
        : "";
    const text = shareLine(ownName ? `${label}, or ${occ.title.toLowerCase()} to the ONS` : occ.title, occ.score, v.label, ctx.moreExposedThanPct, url);
    if (canShare) {
      try {
        await navigator.share({ text });
        return;
      } catch (e) {
        if ((e as Error).name === "AbortError") return;
      }
    }
    try {
      await navigator.clipboard.writeText(text);
      setCopied("done");
    } catch {
      setCopied("fail");
    }
    setTimeout(() => setCopied("idle"), 2500);
  }

  return (
    <article className={`${styles.card} ${styles[`tone_${v.key}`]}`}>
      {/* One short line for screen readers on every change, instead of re-reading the whole card. */}
      <p className="sr-only" aria-live="polite" aria-atomic="true">
        {isExample ? "Example: " : ""}
        {label}: {Math.round(occ.score)} out of 100. {v.label}.
      </p>
      <div className={styles.left}>
        <p className={styles.eyebrow}>
          {isExample ? (
            <>
              <span className={styles.exampleTag}>Example</span> {label}. Type your own job above.
            </>
          ) : (
            <>
              Your job: <strong>{label}</strong>
              {ownName ? <span className={styles.ons}> (ONS: {occ.title})</span> : null}
            </>
          )}
        </p>
        <div className={styles.gaugeRow}>
          <Gauge score={occ.score} thresholds={thresholds} verdict={v.key} />
        </div>
        <h3 className={styles.verdict}>
          <span className={`hl ${styles.hl} ${styles[`hl_${v.key}`]}`}>
            <span aria-hidden="true">{v.mark} </span>
            {v.label}
          </span>
        </h3>
        <p className={styles.line}>{v.line}</p>
      </div>

      <div className={styles.right}>
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
          What the robot could take on{" "}
          <span className={styles.estimated}>Estimated</span>
        </h4>
        <TaskBars tasks={occ.tasks} thresholds={thresholds} />
        <p className={styles.foot}>
          Tasks: ONS. Task scores are estimates. Headcount: ONS,{" "}
          {employmentPeriod}.
        </p>

        <div className={styles.shareRow}>
          <button type="button" className={styles.share} onClick={share}>
            {copied === "done" ? "Copied!" : copied === "fail" ? "Couldn't copy" : canShare ? "Share my result" : "Copy my result"}
          </button>
          <span className={styles.shareText} aria-live="polite">
            {copied === "done"
              ? "Paste it in the group chat."
              : `“${v.label}” · ${Math.round(occ.score)}/100`}
          </span>
        </div>
      </div>
    </article>
  );
}
