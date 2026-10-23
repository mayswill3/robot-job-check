"use client";
import type { ReactNode } from "react";
import styles from "./ShowMore.module.css";

/** The small black "show the rest" button under a shortened list. */
export function ShowMore({ onClick, children }: { onClick: () => void; children: ReactNode }) {
  return (
    <button type="button" className={styles.btn} onClick={onClick}>
      {children} <span aria-hidden="true">↓</span>
    </button>
  );
}
