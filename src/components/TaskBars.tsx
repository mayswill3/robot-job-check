import type { Task, Thresholds } from "@/lib/types";
import { verdictFor } from "@/lib/verdict";
import styles from "./TaskBars.module.css";

export function TaskBars({ tasks, thresholds }: { tasks: Task[]; thresholds: Thresholds }) {
  return (
    <ol className={styles.list}>
      {tasks.map((t) => {
        const v = verdictFor(t.exposure, thresholds);
        return (
          <li key={t.task} className={styles.row}>
            <span className={styles.task}>{t.task}</span>
            <span className={styles.barWrap} aria-hidden="true">
              <span className={`${styles.bar} ${styles[v.key]}`} style={{ width: `${t.exposure}%` }} />
            </span>
            <span className={`num ${styles.val} ${styles[`ink_${v.key}`]}`}>
              {t.exposure}
              <span className="sr-only"> out of 100, {v.label}</span>
            </span>
          </li>
        );
      })}
    </ol>
  );
}
