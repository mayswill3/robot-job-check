/**
 * Job search: exact and fuzzy matching over titles and aliases.
 *
 * Scoring tiers (higher wins):
 *   100 exact alias/title match        ("brickie", "bank clerk")
 *    90 priority alias starts with q   (curated slang gets first dibs)
 *    80 title or alias starts with q
 *    70 a whole word in title/alias starts with q
 *    60 q is a substring
 *    40 fuzzy: every query token is within edit distance 1-2 of a word
 * Ties break on priority flag, then shorter title, then employment (bigger first).
 */
import type { Occupation } from "./types";

export type Searchable = Pick<Occupation, "soc" | "title" | "aliases" | "priorityAliases" | "employment">;

export interface SearchHit<T extends Searchable = Searchable> {
  item: T;
  score: number;
  /** The title or alias that matched, for display ("brickie → Bricklayers"). */
  via: string;
}

export function normalise(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

/** Damerau-Levenshtein (optimal string alignment) distance, capped for speed. */
export function editDistance(a: string, b: string, max = 2): number {
  if (a === b) return 0;
  if (Math.abs(a.length - b.length) > max) return max + 1;
  const prev2: number[] = [];
  let prev = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) {
    const cur = [i];
    let rowMin = i;
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      let v = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + cost);
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) v = Math.min(v, prev2[j - 2] + 1);
      cur.push(v);
      rowMin = Math.min(rowMin, v);
    }
    if (rowMin > max) return max + 1;
    prev2.splice(0, prev2.length, ...prev);
    prev = cur;
  }
  return prev[b.length];
}

interface Indexed<T extends Searchable> {
  item: T;
  terms: { text: string; norm: string; words: string[]; priority: boolean; isTitle: boolean }[];
}

export function buildIndex<T extends Searchable>(items: T[]): Indexed<T>[] {
  return items.map((item) => {
    const pri = new Set(item.priorityAliases.map(normalise));
    const terms = [item.title, ...item.aliases].map((text, i) => {
      const norm = normalise(text);
      return { text, norm, words: norm.split(" "), priority: pri.has(norm), isTitle: i === 0 };
    });
    return { item, terms };
  });
}

function fuzzyWordMatch(qTokens: string[], words: string[]): boolean {
  return qTokens.every((qt) => {
    const max = qt.length <= 4 ? 1 : 2;
    return words.some((w) => w.startsWith(qt) || editDistance(qt, w, max) <= max);
  });
}

export function search<T extends Searchable>(index: Indexed<T>[], query: string, limit = 8): SearchHit<T>[] {
  const q = normalise(query);
  if (q.length < 2) return [];
  const qTokens = q.split(" ");
  const hits: SearchHit<T>[] = [];
  for (const { item, terms } of index) {
    let best = 0;
    let via = item.title;
    let bestPriority = false;
    for (const t of terms) {
      let s = 0;
      if (t.norm === q) s = 100;
      else if (t.priority && t.norm.startsWith(q)) s = 90;
      else if (t.norm.startsWith(q)) s = 80;
      else if (t.words.some((w) => w.startsWith(q)) || (qTokens.length > 1 && qTokens.every((qt) => t.words.some((w) => w.startsWith(qt))))) s = 70;
      else if (t.norm.includes(q)) s = 60;
      else if (q.length >= 4 && fuzzyWordMatch(qTokens, t.words)) s = 40;
      if (t.priority && s > 0) s += 5;
      if (t.isTitle && s > 0) s += 1;
      if (s > best) {
        best = s;
        via = t.text;
        bestPriority = t.priority;
      }
    }
    if (best > 0) hits.push({ item, score: best + (bestPriority ? 0.5 : 0), via });
  }
  hits.sort(
    (a, b) =>
      b.score - a.score ||
      a.item.title.length - b.item.title.length ||
      (b.item.employment ?? 0) - (a.item.employment ?? 0),
  );
  return hits.slice(0, limit);
}
