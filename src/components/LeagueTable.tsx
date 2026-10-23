"use client";
import { useMemo, useState } from "react";
import type { SlimOccupation, VerdictKey } from "@/lib/types";
import { VERDICTS } from "@/lib/verdict";
import { formatPeople } from "@/lib/format";
import { normalise } from "@/lib/search";
import styles from "./LeagueTable.module.css";

interface Props {
  all: SlimOccupation[];
  selected: SlimOccupation;
  onPick?: (soc: string) => void;
}

const PAGE = 25;
const BANDS: { key: VerdictKey | "all"; label: string }[] = [
  { key: "all", label: "All" },
  { key: "risk", label: `${VERDICTS.risk.mark} Coat gone` },
  { key: "watch", label: `${VERDICTS.watch.mark} Update CV` },
  { key: "safe", label: `${VERDICTS.safe.mark} Safe` },
];

/**
 * The full league table of every scored job, ranked. Filter by word or band, see the
 * score as a bar, find your own row highlighted, and check any job from here.
 * Doubles as the text alternative to the beeswarm for screen readers.
 */
export function LeagueTable({ all, selected, onPick }: Props) {
  const [q, setQ] = useState("");
  const [band, setBand] = useState<VerdictKey | "all">("all");
  const [shown, setShown] = useState(PAGE);
  const [mine, setMine] = useState(false);

  const rows = useMemo(() => {
    const nq = normalise(q);
    return [...all]
      .sort((a, b) => a.rank - b.rank)
      .filter((o) => (band === "all" || o.verdict === band) && (!nq || normalise(o.title).includes(nq)));
  }, [all, q, band]);

  const visible = rows.slice(0, shown);
  const myIndex = rows.findIndex((o) => o.soc === selected.soc);
  // "Find me" jumps the page window so the reader's row is on screen.
  const list = mine && myIndex >= shown ? rows.slice(0, Math.ceil((myIndex + 1) / PAGE) * PAGE) : visible;

  function reset() {
    setShown(PAGE);
    setMine(false);
  }

  return (
    <div className={styles.wrap}>
      <div className={styles.controls}>
        <label className={styles.filter}>
          <span className="sr-only">Filter the table by job title</span>
          <input
            type="search"
            placeholder="Filter by job title"
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              reset();
            }}
          />
        </label>
        <div className={styles.bands} role="group" aria-label="Show one verdict band">
          {BANDS.map((b) => (
            <button
              key={b.key}
              type="button"
              className={styles.band}
              aria-pressed={band === b.key}
              onClick={() => {
                setBand(b.key);
                reset();
              }}
            >
              {b.label}
            </button>
          ))}
        </div>
        {myIndex >= 0 ? (
          <button
            type="button"
            className={styles.findMe}
            onClick={() => {
              setMine(true);
              setTimeout(() => document.getElementById(`lt-${selected.soc}`)?.scrollIntoView({ block: "center", behavior: "smooth" }), 0);
            }}
          >
            Find my job (no. {myIndex + 1})
          </button>
        ) : null}
      </div>

      <p className={styles.count} aria-live="polite">
        {rows.length === all.length ? `All ${all.length} jobs, most exposed first.` : `${rows.length} of ${all.length} jobs.`}
      </p>

      <table className={styles.table}>
        <thead>
          <tr>
            <th scope="col" className={styles.num}>
              #
            </th>
            <th scope="col">Job</th>
            <th scope="col" className={styles.scoreCol}>
              Score
            </th>
            <th scope="col" className={styles.people}>
              People
            </th>
            {onPick ? (
              <th scope="col">
                <span className="sr-only">Check this job</span>
              </th>
            ) : null}
          </tr>
        </thead>
        <tbody>
          {list.map((o) => {
            const me = o.soc === selected.soc;
            return (
              <tr key={o.soc} id={`lt-${o.soc}`} className={me ? styles.me : undefined}>
                <td className={`num ${styles.num}`}>{o.rank}</td>
                <td className={styles.title}>
                  {o.title}
                  {me ? <span className={styles.you}> ← you</span> : null}
                  <span className="sr-only">, {VERDICTS[o.verdict].label}</span>
                </td>
                <td className={styles.scoreCol}>
                  <span className={styles.bar} aria-hidden="true">
                    <span className={`${styles.fill} ${styles[o.verdict]}`} style={{ width: `${o.score}%` }} />
                  </span>
                  <span className={`num ${styles.score} ${styles[`ink_${o.verdict}`]}`}>{Math.round(o.score)}</span>
                </td>
                <td className={styles.people}>{formatPeople(o.employment)}</td>
                {onPick ? (
                  <td className={styles.action}>
                    {me ? null : (
                      <button type="button" className={styles.check} onClick={() => onPick(o.soc)} aria-label={`Check ${o.title}`}>
                        Check
                      </button>
                    )}
                  </td>
                ) : null}
              </tr>
            );
          })}
        </tbody>
      </table>

      {list.length < rows.length ? (
        <button type="button" className={styles.more} onClick={() => setShown(list.length + PAGE)}>
          Show {Math.min(PAGE, rows.length - list.length)} more of {rows.length - list.length}
        </button>
      ) : null}
      {rows.length === 0 ? <p className={styles.empty}>Nothing matches. Try a shorter word.</p> : null}
    </div>
  );
}
