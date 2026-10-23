import "server-only";
import type { BankRole, BarclaysFacts, Dataset, Occupation, SlimOccupation } from "./types";
import occupationsJson from "../../public/data/occupations.json";
import bankRolesJson from "../../public/data/bank-roles.json";
import factsJson from "../../public/data/barclays-facts.json";

export const dataset = occupationsJson as unknown as Dataset;
export const bankRoles = (bankRolesJson as { roles: BankRole[] }).roles;
export const facts = factsJson as unknown as BarclaysFacts;

export const EXAMPLE_SOC = "4123"; // Bank and post office clerks: the job in the story

export function slim(o: Occupation): SlimOccupation {
  return { soc: o.soc, title: o.title, score: o.score, rank: o.rank, verdict: o.verdict, employment: o.employment };
}

export function getExample(): Occupation {
  const o = dataset.occupations.find((x) => x.soc === EXAMPLE_SOC);
  if (!o) throw new Error(`example occupation ${EXAMPLE_SOC} missing from dataset`);
  return o;
}

export function fact(key: string) {
  const f = facts.facts.find((x) => x.key === key) ?? facts.context_stats.find((x) => x.key === key);
  if (!f) throw new Error(`fact ${key} missing`);
  return f;
}
