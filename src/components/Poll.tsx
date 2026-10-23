"use client";
import { useEffect, useState } from "react";
import styles from "./Poll.module.css";

const OPTIONS = [
  { key: "yes", label: "Yes, bring on the robots" },
  { key: "small", label: "Only for the small stuff" },
  { key: "no", label: "Not a chance" },
] as const;
type Key = (typeof OPTIONS)[number]["key"];
type Counts = Record<Key, number>;

const STORAGE = "robot-job-check:poll:v1";
const API = `${process.env.NEXT_PUBLIC_POLL_API ?? ""}/api/poll`;

export function Poll() {
  const [counts, setCounts] = useState<Counts | null>(null);
  const [voted, setVoted] = useState<Key | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "offline" | "ok">("loading");
  const [peek, setPeek] = useState(false);

  useEffect(() => {
    // Read the remembered vote after hydration so server and client HTML match.
    Promise.resolve().then(() => {
      try {
        const v = localStorage.getItem(STORAGE) as Key | null;
        if (v && OPTIONS.some((o) => o.key === v)) setVoted(v);
      } catch {}
    });
    fetch(API)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((d: { counts: Counts }) => {
        setCounts(d.counts);
        setStatus("ok");
      })
      .catch(() => setStatus("offline"));
  }, []);

  async function vote(k: Key) {
    if (voted || status !== "ok") return;
    setVoted(k);
    try {
      localStorage.setItem(STORAGE, k);
    } catch {}
    try {
      const r = await fetch(API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ option: k }) });
      if (r.ok) setCounts(((await r.json()) as { counts: Counts }).counts);
    } catch {
      setStatus("offline");
    }
  }

  const total = counts ? Object.values(counts).reduce((a, b) => a + b, 0) : 0;
  const showResults = (voted !== null || peek) && counts;

  return (
    <div className={styles.wrap}>
      <p className={styles.q}>Would you trust a robot with your money?</p>
      {status === "offline" ? <p className={styles.offline}>The poll is having a lie down. Results aren&rsquo;t available right now.</p> : null}
      <div className={styles.options} role="group" aria-label="Poll options">
        {OPTIONS.map((o) => {
          const n = counts?.[o.key] ?? 0;
          const pct = total ? Math.round((n / total) * 100) : 0;
          return (
            <button
              key={o.key}
              type="button"
              className={`${styles.opt} ${voted === o.key ? styles.mine : ""}`}
              aria-pressed={voted === o.key}
              disabled={voted !== null || status !== "ok"}
              onClick={() => vote(o.key)}
            >
              {showResults ? <span className={styles.fill} style={{ width: `${pct}%` }} aria-hidden="true" /> : null}
              <span className={styles.optLabel}>
                {o.label}
                {voted === o.key ? <span className={styles.tick}> ✓ your vote</span> : null}
              </span>
              {showResults ? <span className={`num ${styles.pct}`}>{pct}%</span> : null}
            </button>
          );
        })}
      </div>
      <p className={styles.foot} aria-live="polite">
        {showResults
          ? `${total.toLocaleString("en-GB")} ${total === 1 ? "vote" : "votes"} so far. Live tally, one vote per reader per day.`
          : status === "ok"
            ? <button type="button" className={styles.peek} onClick={() => setPeek(true)}>Just show me the results</button>
            : status === "loading"
              ? "Loading the tally…"
              : ""}
      </p>
    </div>
  );
}
