"use client";
import { useEffect, useState } from "react";
import { useInView } from "@/hooks/useInView";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import styles from "./CountUp.module.css";

interface Props {
  value: number;
  suffix?: string;
  caption: string;
  source: string;
  sourceUrl: string;
  quote: string;
}

export function CountUp({ value, suffix = "%", caption, source, sourceUrl, quote }: Props) {
  const { ref, inView } = useInView<HTMLDivElement>();
  const reduced = useReducedMotion();
  const [n, setN] = useState(0);
  useEffect(() => {
    if (!inView || reduced) return;
    const start = performance.now();
    const dur = 1400;
    let raf = 0;
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / dur);
      const eased = 1 - Math.pow(1 - p, 3);
      setN(Math.round(value * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, reduced, value]);
  const shown = reduced ? value : n;
  return (
    <div ref={ref} className={styles.wrap}>
      <p className={`num ${styles.big}`}>
        <span className="sr-only">
          {value}
          {suffix}
        </span>
        <span aria-hidden="true">
          {shown}
          {suffix}
        </span>
      </p>
      <p className={styles.caption}>{caption}</p>
      <blockquote className={styles.quote}>
        <p>&ldquo;{quote}&rdquo;</p>
        <cite>
          <a href={sourceUrl} target="_blank" rel="noopener noreferrer">
            {source}
          </a>
        </cite>
      </blockquote>
    </div>
  );
}
