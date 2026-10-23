"use client";
import { arc } from "d3-shape";
import { scaleLinear } from "d3-scale";
import type { Thresholds, VerdictKey } from "@/lib/types";
import { VERDICTS } from "@/lib/verdict";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import styles from "./Gauge.module.css";

interface Props {
  score: number;
  thresholds: Thresholds;
  verdict: VerdictKey;
  width?: number;
}

const BAND_ORDER: VerdictKey[] = ["safe", "watch", "risk"];
// Server (Node) and browser trig can differ in the last bit; round so SSR and client HTML match.
const r2 = (n: number) => Math.round(n * 100) / 100;

/** Traffic-light semicircle with a needle. Built with d3-shape arcs, rendered by React. */
export function Gauge({ score, thresholds, verdict, width = 300 }: Props) {
  const reduced = useReducedMotion();
  const w = width;
  const h = Math.round(w * 0.72);
  const cx = w / 2;
  const cy = h - 64;
  const outer = Math.min(w / 2 - 8, cy - 14);
  const inner = outer * 0.68;
  const angle = scaleLinear().domain([0, 100]).range([-Math.PI / 2, Math.PI / 2]);
  const bands: { key: VerdictKey; from: number; to: number }[] = [
    { key: "safe", from: 0, to: thresholds.watch },
    { key: "watch", from: thresholds.watch, to: thresholds.risk },
    { key: "risk", from: thresholds.risk, to: 100 },
  ];
  const gen = arc<{ from: number; to: number }>()
    .innerRadius(inner)
    .outerRadius(outer)
    .startAngle((d) => angle(d.from))
    .endAngle((d) => angle(d.to))
    .padAngle(0.012);
  const needleDeg = r2((angle(Math.max(0, Math.min(100, score))) * 180) / Math.PI);
  const label = `Exposure score ${Math.round(score)} out of 100: ${VERDICTS[verdict].label}`;

  return (
    <figure className={styles.fig} style={{ maxWidth: w }}>
      <svg viewBox={`0 0 ${w} ${h}`} width="100%" role="img" aria-label={label} className={styles.svg}>
        <g transform={`translate(${cx},${cy})`}>
          {bands.map((b) => (
            <path key={b.key} d={gen(b) ?? undefined} className={styles[`band_${b.key}`]} opacity={b.key === verdict ? 1 : 0.45} />
          ))}
          {BAND_ORDER.map((k) => {
            const b = bands.find((x) => x.key === k)!;
            const mid = angle((b.from + b.to) / 2);
            const r = outer + 12;
            return (
              <text key={k} x={r2(Math.sin(mid) * r)} y={r2(-Math.cos(mid) * r)} textAnchor="middle" className={styles.tick} dominantBaseline="middle">
                {VERDICTS[k].mark}
              </text>
            );
          })}
          <g
            className={styles.needle}
            style={{ transform: `rotate(${needleDeg}deg)`, transition: reduced ? "none" : "transform 900ms cubic-bezier(.2,.8,.2,1)" }}
          >
            <polygon points={`-5,0 5,0 0,${-(outer - 6)}`} />
            <circle r="7" />
          </g>
          <text y={44} textAnchor="middle" className={styles.score}>
            {Math.round(score)}
          </text>
          <text y={60} textAnchor="middle" className={styles.outof}>
            out of 100
          </text>
        </g>
      </svg>
    </figure>
  );
}
