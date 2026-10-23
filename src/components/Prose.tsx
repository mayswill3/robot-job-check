import type { ReactNode } from "react";
import styles from "./Prose.module.css";

/** Article body copy. Short tabloid paragraphs, one idea each, 58 characters wide. */
export function Prose({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={`${styles.prose} ${className ?? ""}`}>{children}</div>;
}

/** The opening paragraphs under the hero, before the first interactive. */
export function Opening({ children }: { children: ReactNode }) {
  return (
    <section className={styles.open} aria-label="Introduction">
      <div className="container">
        <Prose>{children}</Prose>
      </div>
    </section>
  );
}

export function Lede({ children }: { children: ReactNode }) {
  return <p className={styles.lede}>{children}</p>;
}

export function PullQuote({ children, cite }: { children: ReactNode; cite: string }) {
  return (
    <figure className={styles.pull}>
      <blockquote>{children}</blockquote>
      <figcaption>{cite}</figcaption>
    </figure>
  );
}
