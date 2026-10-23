"use client";
import type { TimelineItem } from "@/lib/types";
import { formatDate } from "@/lib/format";
import { useInView } from "@/hooks/useInView";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import styles from "./Timeline.module.css";

/** The stops land one after another as the list scrolls into view, so the eye follows the dates down. */
export function Timeline({ items }: { items: TimelineItem[] }) {
  const { ref, inView } = useInView<HTMLOListElement>();
  const reduced = useReducedMotion();
  return (
    <ol ref={ref} className={`${styles.list} ${inView || reduced ? styles.shown : ""}`}>
      {items.map((it, i) => (
        <li key={i} className={styles.item} style={{ transitionDelay: reduced ? "0ms" : `${i * 220}ms` }}>
          <time dateTime={it.date} className={styles.date}>
            {it.date.endsWith("-12-31") ? it.date.slice(0, 4) : formatDate(it.date)}
          </time>
          <p className={styles.text}>{it.label}</p>
        </li>
      ))}
    </ol>
  );
}
