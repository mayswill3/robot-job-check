import type { Thresholds, VerdictKey } from "./types";

export interface Verdict {
  key: VerdictKey;
  label: string;
  /** One-line tabloid gloss shown under the label. */
  line: string;
  /** Short symbol so colour is never the only signal. */
  mark: string;
}

export const VERDICTS: Record<VerdictKey, Omit<Verdict, "key">> = {
  safe: { label: "Safe as houses", line: "The robots can't reach you. Yet.", mark: "✓" },
  watch: { label: "Update your CV", line: "Half your week is already on a chatbot's to-do list.", mark: "!" },
  risk: { label: "Robot's got your coat", line: "The machine wants your desk and your lanyard.", mark: "✕" },
};

/**
 * Map a 0-100 exposure score to a verdict. Thresholds come from the dataset
 * (employment-weighted tertiles) so the bands shift with the data, not the code.
 */
export function verdictFor(score: number, thresholds: Thresholds): Verdict {
  if (!Number.isFinite(score)) throw new RangeError(`score must be a finite number, got ${score}`);
  const key: VerdictKey = score >= thresholds.risk ? "risk" : score >= thresholds.watch ? "watch" : "safe";
  return { key, ...VERDICTS[key] };
}

/** Which band a given point on the gauge belongs to; used to colour the arc. */
export function bandAt(score: number, thresholds: Thresholds): VerdictKey {
  return verdictFor(score, thresholds).key;
}
