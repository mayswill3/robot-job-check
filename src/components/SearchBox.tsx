"use client";
import { useId, useMemo, useRef, useState } from "react";
import { buildIndex, search, type SearchHit, type Searchable } from "@/lib/search";
import styles from "./SearchBox.module.css";

interface Props<T extends Searchable> {
  items: T[] | null;
  onPick: (item: T) => void;
  placeholder?: string;
}

/** WAI-ARIA combobox: typed input, listbox of suggestions, arrow keys + Enter, Escape closes. */
export function SearchBox<T extends Searchable>({ items, onPick, placeholder = "e.g. nurse, brickie, call centre" }: Props<T>) {
  const id = useId();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [touched, setTouched] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  // Normalising 5,000 aliases costs a few frames; do it on first focus, not on page load.
  const index = useMemo(() => (items && touched ? buildIndex(items) : null), [items, touched]);
  const hits: SearchHit<T>[] = useMemo(() => (index && q.trim().length >= 2 ? search(index, q, 8) : []), [index, q]);

  function pick(h: SearchHit<T>) {
    onPick(h.item);
    setQ("");
    setOpen(false);
    inputRef.current?.blur();
  }

  const listId = `${id}-list`;
  const showList = open && q.trim().length >= 2;

  return (
    <div className={styles.wrap}>
      <label htmlFor={`${id}-input`} className={styles.label}>
        What do you do for a living?
      </label>
      <div className={styles.field}>
        <input
          ref={inputRef}
          id={`${id}-input`}
          className={styles.input}
          type="text"
          role="combobox"
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          enterKeyHint="search"
          placeholder={placeholder}
          value={q}
          aria-expanded={showList}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={showList && hits[active] ? `${id}-opt-${hits[active].item.soc}` : undefined}
          onChange={(e) => {
            setTouched(true);
            setQ(e.target.value);
            setActive(0);
            setOpen(true);
          }}
          onFocus={() => {
            setTouched(true);
            setOpen(true);
          }}
          onBlur={() => setTimeout(() => setOpen(false), 120)}
          onKeyDown={(e) => {
            if (!showList) return;
            if (e.key === "ArrowDown") {
              e.preventDefault();
              setActive((a) => Math.min(hits.length - 1, a + 1));
            } else if (e.key === "ArrowUp") {
              e.preventDefault();
              setActive((a) => Math.max(0, a - 1));
            } else if (e.key === "Enter" && hits[active]) {
              e.preventDefault();
              pick(hits[active]);
            } else if (e.key === "Escape") {
              setOpen(false);
            }
          }}
        />
        <span className={styles.icon} aria-hidden="true">
          ⌕
        </span>
      </div>
      <ul id={listId} role="listbox" aria-label="Matching jobs" className={styles.list} hidden={!showList}>
        {!items ? (
          <li className={styles.empty} role="option" aria-selected="false">
            Loading 408 jobs…
          </li>
        ) : hits.length === 0 ? (
          <li className={styles.empty} role="option" aria-selected="false">
            No match. Try another word for it, or a job that&rsquo;s close.
          </li>
        ) : (
          hits.map((h, i) => (
            <li
              key={h.item.soc}
              id={`${id}-opt-${h.item.soc}`}
              role="option"
              aria-selected={i === active}
              className={`${styles.opt} ${i === active ? styles.active : ""}`}
              onMouseDown={(e) => e.preventDefault()}
              onMouseEnter={() => setActive(i)}
              onClick={() => pick(h)}
            >
              <span className={styles.optTitle}>{h.item.title}</span>
              {h.via.toLowerCase() !== h.item.title.toLowerCase() ? <span className={styles.via}>matched &ldquo;{h.via}&rdquo;</span> : null}
            </li>
          ))
        )}
      </ul>
    </div>
  );
}
