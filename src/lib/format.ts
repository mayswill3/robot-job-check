export function formatPeople(n: number | null | undefined): string {
  if (n == null || !Number.isFinite(n)) return "too few to estimate";
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(n >= 10_000_000 ? 0 : 1)} million`;
  if (n >= 10_000) return `${Math.round(n / 1000)},000`;
  return new Intl.NumberFormat("en-GB").format(Math.round(n / 100) * 100);
}

export function formatInt(n: number): string {
  return new Intl.NumberFormat("en-GB").format(n);
}

export function formatDate(iso: string): string {
  const d = new Date(iso + "T00:00:00Z");
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
}

export function shareLine(title: string, score: number, verdictLabel: string, pct: number, url: string): string {
  return `My job (${title}) scores ${Math.round(score)}/100 for AI exposure. Verdict: ${verdictLabel}. More exposed than ${pct}% of UK jobs. Will a robot take yours? ${url}`;
}
