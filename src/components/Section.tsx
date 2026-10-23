import type { ReactNode } from "react";
import styles from "./Section.module.css";

interface Props {
  id: string;
  kicker: string;
  title: ReactNode;
  intro?: ReactNode;
  children: ReactNode;
  tone?: "plain" | "tint";
}

export function Section({ id, kicker, title, intro, children, tone = "plain" }: Props) {
  return (
    <section id={id} className={`${styles.section} ${tone === "tint" ? styles.tint : ""}`} aria-labelledby={`${id}-title`}>
      <div className="container">
        <span className="kicker">{kicker}</span>
        <h2 id={`${id}-title`} className={styles.title}>
          {title}
        </h2>
        {intro ? <div className={styles.intro}>{intro}</div> : null}
        {children}
      </div>
    </section>
  );
}
