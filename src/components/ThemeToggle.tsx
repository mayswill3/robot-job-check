"use client";
import { useEffect, useState } from "react";
import styles from "./ThemeToggle.module.css";

type Theme = "light" | "dark" | "auto";

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("auto");
  useEffect(() => {
    // Read after hydration so the server-rendered "Auto" state matches the first client render.
    Promise.resolve().then(() => {
      try {
        const t = localStorage.getItem("theme");
        if (t === "light" || t === "dark") setTheme(t);
      } catch {}
    });
  }, []);
  function apply(next: Theme) {
    setTheme(next);
    const root = document.documentElement;
    if (next === "auto") root.removeAttribute("data-theme");
    else root.setAttribute("data-theme", next);
    try {
      if (next === "auto") localStorage.removeItem("theme");
      else localStorage.setItem("theme", next);
    } catch {}
  }
  return (
    <fieldset className={styles.group}>
      <legend className="sr-only">Colour theme</legend>
      {(["auto", "light", "dark"] as Theme[]).map((t) => (
        <button key={t} type="button" className={styles.btn} aria-pressed={theme === t} onClick={() => apply(t)}>
          {t === "auto" ? "Auto" : t === "light" ? "Light" : "Dark"}
        </button>
      ))}
    </fieldset>
  );
}
