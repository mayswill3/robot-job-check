"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { forceCollide, forceSimulation, forceX, forceY } from "d3-force";
import { scaleLinear, scaleSqrt } from "d3-scale";
import { max } from "d3-array";
import type { SlimOccupation, Thresholds } from "@/lib/types";
import { VERDICTS } from "@/lib/verdict";
import { formatPeople } from "@/lib/format";
import { useMeasure } from "@/hooks/useMeasure";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import styles from "./Beeswarm.module.css";

interface Node extends SlimOccupation {
  x: number;
  y: number;
  r: number;
}

interface Props {
  all: SlimOccupation[];
  selected: SlimOccupation;
  thresholds: Thresholds;
  onPick?: (soc: string) => void;
}

const M = { top: 28, right: 12, bottom: 34, left: 12 };

/**
 * Every scored occupation as a dot: x = exposure score, area = people doing the job.
 * Positions come from a d3-force simulation run synchronously inside useMemo so the
 * layout is deterministic for a given width and never re-runs on hover.
 */
export function Beeswarm({ all, selected, thresholds, onPick }: Props) {
  const { ref, width } = useMeasure<HTMLDivElement>();
  const reduced = useReducedMotion();
  const [tip, setTip] = useState<Node | null>(null);
  // Dots are laid out on the client only: the force layout depends on the measured
  // width, and 408 SVG circles would bloat the HTML for no first-paint benefit.
  const [mounted, setMounted] = useState(false);
  const [listOpen, setListOpen] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 0);
    return () => clearTimeout(t);
  }, []);
  const height = width < 480 ? 300 : 340;
  const x = useMemo(() => scaleLinear().domain([0, 100]).range([M.left, width - M.right]), [width]);
  const nodes = useMemo(() => {
    if (!mounted) return [] as Node[];
    const maxEmp = max(all, (d) => d.employment ?? 0) ?? 1;
    const r = scaleSqrt().domain([0, maxEmp]).range([1.6, width < 480 ? 13 : 16]);
    const ns: Node[] = all.map((d) => ({ ...d, r: r(d.employment ?? 0), x: x(d.score), y: height / 2 }));
    const sim = forceSimulation(ns)
      .force("x", forceX<Node>((d) => x(d.score)).strength(1))
      .force("y", forceY<Node>(height / 2).strength(0.06))
      .force("collide", forceCollide<Node>((d) => d.r + 0.7).iterations(2))
      .stop();
    for (let i = 0; i < 180; i++) sim.tick();
    return ns;
  }, [all, x, height, width, mounted]);

  const svgRef = useRef<SVGSVGElement>(null);
  // Half the dots are under 8px across, so hit-test the nearest dot to the pointer
  // instead of relying on the circle itself. 408 distance checks per event is cheap.
  const nearest = (e: React.PointerEvent | React.MouseEvent): Node | null => {
    const svg = svgRef.current;
    if (!svg || nodes.length === 0) return null;
    const rect = svg.getBoundingClientRect();
    const px = ((e.clientX - rect.left) / rect.width) * width;
    const py = ((e.clientY - rect.top) / rect.height) * height;
    let best: Node | null = null;
    let bestD = Infinity;
    for (const n of nodes) {
      const d = Math.hypot(n.x - px, n.y - py) - n.r;
      if (d < bestD) {
        bestD = d;
        best = n;
      }
    }
    return bestD <= 14 ? best : null;
  };
  const me = nodes.find((n) => n.soc === selected.soc);
  const show = tip ?? me ?? null;
  const bands = [
    { key: "safe" as const, from: 0, to: thresholds.watch },
    { key: "watch" as const, from: thresholds.watch, to: thresholds.risk },
    { key: "risk" as const, from: thresholds.risk, to: 100 },
  ];
  const summary = `${all.length} occupations plotted by AI exposure score. Your job, ${selected.title}, scores ${Math.round(selected.score)} and is ranked ${selected.rank}.`;

  return (
    <div ref={ref} className={styles.wrap}>
      <svg
        ref={svgRef}
        viewBox={`0 0 ${width} ${height}`}
        width={width}
        height={height}
        className={styles.svg}
        role="img"
        aria-label={summary}
        onPointerMove={(e) => {
          if (e.pointerType === "mouse") setTip(nearest(e));
        }}
        onPointerLeave={(e) => {
          if (e.pointerType === "mouse") setTip(null);
        }}
        onClick={(e) => {
          const n = nearest(e);
          if (n) setTip(n);
        }}
      >
        {bands.map((b) => (
          <g key={b.key}>
            <rect x={x(b.from)} y={M.top - 8} width={x(b.to) - x(b.from)} height={height - M.top - M.bottom + 8} className={styles[`band_${b.key}`]} />
            <text
              x={b.key === "risk" ? x(b.to) - 2 : x(b.from) + 2}
              y={M.top - 12}
              textAnchor={b.key === "risk" ? "end" : "start"}
              className={styles.bandLabel}
            >
              {VERDICTS[b.key].mark} {b.key === "safe" ? "Safe" : b.key === "watch" ? "Update CV" : "Coat gone"}
            </text>
          </g>
        ))}
        {[0, 25, 50, 75, 100].map((t) => (
          <text key={t} x={x(t)} y={height - 12} textAnchor={t === 0 ? "start" : t === 100 ? "end" : "middle"} className={styles.axis}>
            {t}
          </text>
        ))}
        <text x={width / 2} y={height - 0} textAnchor="middle" className={styles.axisTitle}>
          AI exposure score →
        </text>
        <g>
          {nodes.map((n) => (
            <circle
              key={n.soc}
              cx={n.x}
              cy={n.y}
              r={n.r}
              className={`${styles.dot} ${styles[`dot_${n.verdict}`]} ${tip?.soc === n.soc ? styles.hit : ""} ${n.soc === selected.soc ? styles.me : ""}`}
            >
              <title>
                {n.title}: {Math.round(n.score)}/100, {formatPeople(n.employment)} people
              </title>
            </circle>
          ))}
        </g>
        {me ? (
          <g>
            <circle cx={me.x} cy={me.y} r={me.r + 6} className={`${styles.ring} ${reduced ? "" : styles.pulse}`} />
            <circle cx={me.x} cy={me.y} r={me.r + 11} className={styles.ring2} />
          </g>
        ) : null}
        {me ? (
          <g transform={`translate(${me.x},${me.y})`} className={styles.youLabel}>
            <line x1={0} y1={0} x2={0} y2={me.y > height / 2 ? -(me.r + 24) : me.r + 24} className={styles.leader} />
            <text y={me.y > height / 2 ? -(me.r + 28) : me.r + 36} textAnchor={me.x > width * 0.8 ? "end" : me.x < width * 0.2 ? "start" : "middle"}>
              YOU
            </text>
          </g>
        ) : null}
      </svg>
      <div className={styles.tip} aria-live="polite">
        {show ? (
          <>
            <strong>{show.title}</strong> · {Math.round(show.score)}/100 · rank {show.rank} · {formatPeople(show.employment)} people
            {show.soc !== selected.soc && onPick ? (
              <>
                {" "}
                <button type="button" className={styles.tipBtn} onClick={() => onPick(show.soc)}>
                  Make this my job
                </button>
              </>
            ) : null}
          </>
        ) : (
          "Tap a dot to see the job, then make it yours to re-run the checker."
        )}
      </div>
      <details className={styles.details} onToggle={(e) => setListOpen((e.currentTarget as HTMLDetailsElement).open)}>
        <summary>Read this chart as a list</summary>
        {listOpen ? (
          <ol className={styles.textList}>
            {[...all]
              .sort((a, b) => a.rank - b.rank)
              .map((o) => (
                <li key={o.soc}>
                  {o.title}: {Math.round(o.score)}/100, {formatPeople(o.employment)} people
                </li>
              ))}
          </ol>
        ) : null}
      </details>
    </div>
  );
}
