"""Step 4: join everything and write the JSON the page reads.

Exposure score 0-100 is a min-max rescaling of the SOC 2020 AIOE (All AI): the most
exposed occupation scores 100, the least 0, and the shape of the distribution is kept
(a percentile rank would flatten it and make the beeswarm lie). Verdict bands are
employment-weighted tertiles of that score, so each band holds about a third of UK
workers.
"""
import json
from datetime import date

import numpy as np
import pandas as pd

from paths import CURATED, INTERIM, PUBLIC
from sources import SOURCES

VERDICTS = [
    {"key": "safe", "label": "Safe as houses"},
    {"key": "watch", "label": "Update your CV"},
    {"key": "risk", "label": "Robot's got your coat"},
]


def clamp(x, lo, hi):
    return max(lo, min(hi, x))


def main(period):
    emp = pd.read_csv(INTERIM / "employment_soc2020.csv", dtype={"soc2020": str})
    exp = pd.read_csv(INTERIM / "exposure_soc2020.csv", dtype={"soc2020": str, "dominant_soc2010": str})
    ta = pd.read_csv(INTERIM / "tasks_aliases_soc2020.csv", dtype={"soc2020": str, "major_group": str})

    df = ta.merge(exp, on="soc2020", how="left").merge(emp[["soc2020", "employment", "suppressed"]], on="soc2020", how="left")
    scored = df[df["aioe_all"].notna()].copy()
    lo, hi = scored["aioe_all"].min(), scored["aioe_all"].max()
    llo, lhi = scored["aioe_llm"].min(), scored["aioe_llm"].max()
    scored = scored.assign(
        score=((scored["aioe_all"] - lo) / (hi - lo) * 100).round(1),
        score_llm=((scored["aioe_llm"] - llo) / (lhi - llo) * 100).round(1),
    )
    scored = scored.sort_values(["score", "employment"], ascending=[False, False]).reset_index(drop=True)
    scored = scored.assign(rank=np.arange(1, len(scored) + 1))

    # Verdict bands: employment-weighted tertiles, so each band holds roughly a third
    # of UK workers (not a third of job titles, which would over-weight tiny groups).
    asc = scored.sort_values("score")
    cum = asc["employment"].fillna(0).cumsum() / asc["employment"].fillna(0).sum()
    t1 = float(asc.loc[cum >= 1 / 3, "score"].iloc[0])
    t2 = float(asc.loc[cum >= 2 / 3, "score"].iloc[0])
    thresholds = {"watch": t1, "risk": t2, "basis": "employment-weighted tertiles of the exposure score"}

    def verdict(s):
        return "risk" if s >= thresholds["risk"] else ("watch" if s >= thresholds["watch"] else "safe")

    scored = scored.assign(verdict=scored["score"].apply(verdict))

    occupations = []
    for r in scored.itertuples(index=False):
        tasks = []
        for t in json.loads(r.tasks):
            tasks.append({
                "task": t["task"],
                "exposure": int(clamp(round(r.score + 25 * t["signal"]), 1, 99)),
                "derivation": "keyword-rule",
            })
        occupations.append({
            "soc": r.soc2020,
            "title": r.title,
            "major": int(r.major_group),
            "aliases": [a["alias"] for a in json.loads(r.aliases)],
            "priorityAliases": [a["alias"] for a in json.loads(r.aliases) if a["priority"]],
            "score": float(r.score),
            "scoreLlm": float(r.score_llm) if pd.notna(r.score_llm) else None,
            "rank": int(r.rank),
            "verdict": r.verdict,
            "employment": int(round(r.employment)) if pd.notna(r.employment) else None,
            "employmentNote": ("APS cell suppressed for " + r.suppressed) if isinstance(r.suppressed, str) and r.suppressed else None,
            "tasks": tasks,
            "mapping": {
                "type": r.mapping_type,
                "fromSoc2010": r.dominant_soc2010,
                "dominantShare": round(float(r.dominant_share), 3),
                "coverage": round(float(r.aioe_all_coverage), 3),
            },
            "onsAutomation2017": round(float(r.ons_automation_prob), 3) if pd.notna(r.ons_automation_prob) else None,
        })

    unscored = df[df["aioe_all"].isna()][["soc2020", "title", "employment"]].to_dict("records")

    total_emp = int(emp["employment"].sum())
    band_emp = {k: int(scored.loc[scored["verdict"] == k, "employment"].sum()) for k in ("safe", "watch", "risk")}
    meta = {
        "generated": date.today().isoformat(),
        "employmentPeriod": period,
        "occupations": len(occupations),
        "unscored": unscored,
        "totalEmployment": total_emp,
        "employmentByVerdict": band_emp,
        "thresholds": thresholds,
        "verdicts": VERDICTS,
        "scoreScale": {"aioeMin": float(lo), "aioeMax": float(hi), "note": "score = (AIOE - min) / (max - min) * 100 across SOC 2020 unit groups"},
        "mappingTypes": scored["mapping_type"].value_counts().to_dict(),
        "sources": {k: {kk: v[kk] for kk in ("title", "publisher", "landing", "licence", "used_for")} for k, v in SOURCES.items()},
    }

    PUBLIC.mkdir(parents=True, exist_ok=True)
    (PUBLIC / "occupations.json").write_text(json.dumps({"meta": meta, "occupations": occupations}, ensure_ascii=False, separators=(",", ":")) + "\n")

    # bank roles
    bank = json.loads((CURATED / "bank_roles.json").read_text())
    by_soc = {o["soc"]: o for o in occupations}
    roles = []
    for b in bank["roles"]:
        o = by_soc[b["soc2020"]]
        roles.append({**b, "title": o["title"], "score": o["score"], "rank": o["rank"], "verdict": o["verdict"], "employment": o["employment"]})
    roles.sort(key=lambda x: -x["score"])
    (PUBLIC / "bank-roles.json").write_text(json.dumps({"note": bank["_note"], "roles": roles}, ensure_ascii=False, indent=1) + "\n")

    facts = json.loads((CURATED / "barclays_facts.json").read_text())
    for f in facts["facts"] + facts["timeline"] + facts["context_stats"]:
        assert f.get("source_url", "").startswith("http"), f"fact without source URL: {f}"
    (PUBLIC / "barclays-facts.json").write_text(json.dumps(facts, ensure_ascii=False, indent=1) + "\n")

    size = (PUBLIC / "occupations.json").stat().st_size
    print(f"build: {len(occupations)} scored occupations ({len(unscored)} unscored), thresholds {thresholds}, "
          f"total employment {total_emp:,}, occupations.json {size/1024:.0f} KB")
    print(f"  employment by verdict: {band_emp}")


if __name__ == "__main__":
    import sys
    main(sys.argv[1] if len(sys.argv) > 1 else "")
