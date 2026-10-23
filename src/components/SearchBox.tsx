"use client";
import { useId, useMemo, useRef, useState } from "react";
import { buildIndex, isNotAJob, search, type SearchHit, type Searchable } from "@/lib/search";
import styles from "./SearchBox.module.css";

interface Props<T extends Searchable> {
  items: T[] | null;
  /** `label` is the word the reader typed or picked, capitalised, so the card can show it next to the ONS title. */
  onPick: (item: T, label: string) => void;
  /** Called on first interaction so the dataset can start loading before the reader finishes typing. */
  onTouch?: () => void;
  placeholder?: string;
}

const cap = (s: string) => (s ? s[0].toUpperCase() + s.slice(1) : s);

/** WAI-ARIA combobox: typed input, listbox of suggestions, arrow keys + Enter, Escape closes. */
export function SearchBox<T extends Searchable>({ items, onPick, onTouch, placeholder = "e.g. nurse, brickie, call centre" }: Props<T>) {
  const id = useId();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [touched, setTouched] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  // Normalising 5,000 aliases costs a few frames; do it on first focus, not on page load.
  const index = useMemo(() => (items && touched ? buildIndex(items) : null), [items, touched]);
  const trimmed = q.trim();
  const hits: SearchHit<T>[] = useMemo(() => (index && trimmed.length >= 2 ? search(index, trimmed, 8) : []), [index, trimmed]);
  const notAJob = trimmed.length >= 3 && isNotAJob(trimmed);

  function touch() {
    setTouched(true);
    onTouch?.();
  }

  function pick(h: SearchHit<T>) {
    // Keep the reader's own word: "nurse" stays "Nurse", not "Other registered nursing professionals".
    const label = cap(h.via);
    onPick(h.item, label);
    setQ(label);
    setOpen(false);
    inputRef.current?.blur();
  }

  const listId = `${id}-list`;
  const showList = open && trimmed.length >= 1;

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
            touch();
            setQ(e.target.value);
            setActive(0);
            setOpen(true);
          }}
          onFocus={(e) => {
            touch();
            setOpen(true);
            // A picked job sits in the box; select it so typing replaces it.
            if (e.target.value) e.target.select();
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
        {trimmed.length < 2 ? (
          <li className={styles.empty} role="option" aria-selected="false">
            Keep typing&hellip;
          </li>
        ) : !items ? (
          <li className={styles.empty} role="option" aria-selected="false">
            Loading 408 jobs&hellip;
          </li>
        ) : notAJob ? (
          <li className={styles.empty} role="option" aria-selected="false">
            Not working right now? Check the job you had, the one you want, or one of the popular jobs below.
          </li>
        ) : hits.length === 0 ? (
          <li className={styles.empty} role="option" aria-selected="false">
            No match for &ldquo;{trimmed}&rdquo;. Try another word for it, the closest job you can think of, or one of
            the popular jobs below.
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
