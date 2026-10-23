import type { TimelineItem } from "@/lib/types";
import { formatDate } from "@/lib/format";
import styles from "./Timeline.module.css";

export function Timeline({ items }: { items: TimelineItem[] }) {
  return (
    <ol className={styles.list}>
      {items.map((it, i) => (
        <li key={i} className={styles.item}>
          <time dateTime={it.date} className={styles.date}>
            {it.date.endsWith("-12-31") ? it.date.slice(0, 4) : formatDate(it.date)}
          </time>
          <p className={styles.text}>{it.label}</p>
        </li>
      ))}
    </ol>
  );
}
