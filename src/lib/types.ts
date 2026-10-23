export type VerdictKey = "safe" | "watch" | "risk";

export interface Task {
  task: string;
  exposure: number;
  derivation: "keyword-rule";
}

export interface Occupation {
  soc: string;
  title: string;
  major: number;
  aliases: string[];
  priorityAliases: string[];
  score: number;
  scoreLlm: number | null;
  rank: number;
  verdict: VerdictKey;
  employment: number | null;
  employmentNote: string | null;
  tasks: Task[];
  mapping: { type: "one-to-one" | "split" | "merged"; fromSoc2010: string; dominantShare: number; coverage: number };
  onsAutomation2017: number | null;
}

/** The light version passed to every chart: no aliases, no tasks. */
export type SlimOccupation = Pick<Occupation, "soc" | "title" | "score" | "rank" | "verdict" | "employment">;

export interface Thresholds {
  watch: number;
  risk: number;
  basis?: string;
}

export interface DatasetMeta {
  generated: string;
  employmentPeriod: string;
  occupations: number;
  unscored: { soc2020: string; title: string; employment: number }[];
  totalEmployment: number;
  employmentByVerdict: Record<VerdictKey, number>;
  thresholds: Thresholds;
  verdicts: { key: VerdictKey; label: string }[];
  scoreScale: { aioeMin: number; aioeMax: number; note: string };
  mappingTypes: Record<string, number>;
  sources: Record<string, { title: string; publisher: string; landing: string; licence: string; used_for: string }>;
}

export interface Dataset {
  meta: DatasetMeta;
  occupations: Occupation[];
}

export interface BankRole {
  role: string;
  soc2020: string;
  index_title: string;
  group: string;
  note: string;
  title: string;
  score: number;
  rank: number;
  verdict: VerdictKey;
  employment: number | null;
}

export interface Fact {
  key: string;
  label: string;
  value: number | null;
  display: string;
  unit?: string;
  quote: string;
  source: string;
  source_url: string;
  range?: [number, number];
  verified_via?: string;
  verified_via_note?: string;
}

export interface TimelineItem {
  date: string;
  label: string;
  source: string;
  source_url: string;
  verified_via?: string;
}

export interface BarclaysFacts {
  company: string;
  announcement_date: string;
  facts: Fact[];
  timeline: TimelineItem[];
  context_stats: Fact[];
}
