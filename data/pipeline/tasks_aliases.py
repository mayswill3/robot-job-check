"""Step 3: titles, typical tasks, search aliases and derived per-task exposure.

Tasks and related job titles come from ONS SOC 2020 Volume 1 (UK source, same code
frame as everything else, so no O*NET crosswalk is needed). Aliases are the job
titles the ONS coding index (Volume 2) assigns to each unit group, topped up with a
hand-curated slang list (curated/slang_aliases.json).

Per-task exposure is NOT in any source. It is derived with the keyword lexicon in
curated/task_exposure_lexicon.json and labelled as such.
"""
import json
import re

import pandas as pd

from paths import CURATED, INTERIM, RAW

MAX_INDEX_ALIASES = 10
MAX_TASKS = 4


def split_tilde(s):
    if not isinstance(s, str) or s.strip() in ("", "<blank>", "nan"):
        return []
    return [p.strip().rstrip(";.").strip() for p in s.split("~") if p.strip()]


def read_vol1():
    v = pd.read_excel(RAW / "soc2020_vol1.xlsx", sheet_name="SOC2020 descriptions")
    v.columns = [str(c).replace("\n", " ").strip() for c in v.columns]
    u = v[v["SOC2020 Unit Group"].astype(str).str.fullmatch(r"\d{4}")].copy()
    u["soc2020"] = u["SOC2020 Unit Group"].astype(str)
    u["title"] = u["SOC2020 Group Title"].str.strip()
    u["description"] = u["Group Description"].astype(str).str.strip()
    u["tasks"] = u["Tasks"].apply(split_tilde)
    u["related_titles"] = u["Related Job Titles"].apply(split_tilde)
    u["major_group"] = u["soc2020"].str[0]
    return u[["soc2020", "title", "description", "tasks", "related_titles", "major_group"]]


def read_index_aliases(titles):
    i = pd.read_excel(RAW / "soc2020_vol2_index.xlsx", sheet_name="SOC2020 coding index")
    i = i[i["SOC_2020"].astype(str).str.fullmatch(r"\d{4}")].copy()
    i["soc2020"] = i["SOC_2020"].astype(str)
    i["alias"] = i["INDEXOCC_-_natural_word_order"].astype(str).str.strip()
    # unqualified titles only: no 'ADD' qualifier, no industry qualifier, no cross reference
    plain = i[i["ADD"].isna() & i["IND"].isna() & i["SEE"].isna()]
    # a title that the ONS codes to more than one unit group is ambiguous, skip it
    counts = plain.groupby(plain["alias"].str.lower())["soc2020"].nunique()
    unambiguous = set(counts[counts == 1].index)
    plain = plain[plain["alias"].str.lower().isin(unambiguous)]
    plain = plain[~plain["alias"].str.contains(r"\d|n\.e\.c|\(", regex=True)]
    out = {}
    for code, grp in plain.groupby("soc2020"):
        seen, picks = set(), []
        title_l = titles.get(code, "").lower()
        for a in sorted(grp["alias"].unique(), key=lambda s: (len(s), s)):
            k = a.lower()
            if k in seen or k == title_l or len(a) < 3:
                continue
            seen.add(k)
            picks.append(a)
            if len(picks) >= MAX_INDEX_ALIASES:
                break
        out[code] = picks
    return out


def load_lexicon():
    lex = json.loads((CURATED / "task_exposure_lexicon.json").read_text())
    return [(re.compile(p["pattern"], re.I), p["weight"], p["why"]) for p in lex["patterns"]]


def task_signal(task, lexicon):
    s = 0.0
    for rx, w, _ in lexicon:
        if rx.search(task):
            s += w
    return max(-1.0, min(1.0, s))


def pick_tasks(tasks, lexicon):
    """Keep ONS order, but when there are more than MAX_TASKS choose the ones with the
    widest spread of signal (2 most exposed, 2 least) so the breakdown shows contrast."""
    scored = [(t, task_signal(t, lexicon)) for t in tasks if 15 <= len(t) <= 220]
    if len(scored) <= MAX_TASKS:
        chosen = scored
    else:
        by = sorted(scored, key=lambda x: x[1])
        chosen = by[:2] + by[-2:]
        order = {t: n for n, (t, _) in enumerate(scored)}
        chosen = sorted(chosen, key=lambda x: order[x[0]])
    return chosen


def main():
    vol1 = read_vol1()
    titles = dict(zip(vol1["soc2020"], vol1["title"]))
    index_aliases = read_index_aliases(titles)

    slang = json.loads((CURATED / "slang_aliases.json").read_text())["aliases"]
    curated = {}
    for s in slang:
        code = s["soc2020"]
        assert code in titles, f"slang alias {s['alias']!r}: SOC {code} not in SOC 2020"
        assert s["expect"].lower() in titles[code].lower(), f"slang alias {s['alias']!r}: expected {s['expect']!r} in {titles[code]!r}"
        curated.setdefault(code, []).append({"alias": s["alias"], "priority": bool(s.get("priority"))})

    lexicon = load_lexicon()
    rows = []
    for r in vol1.itertuples(index=False):
        aliases, seen = [], {r.title.lower()}
        for c in curated.get(r.soc2020, []):
            if c["alias"].lower() not in seen:
                seen.add(c["alias"].lower())
                aliases.append(c)
        for a in r.related_titles + index_aliases.get(r.soc2020, []):
            if a.lower() not in seen:
                seen.add(a.lower())
                aliases.append({"alias": a, "priority": False})
        tasks = [{"task": t[0].capitalize() if t[0][0].islower() else t, "signal": round(t[1], 2)} for t in pick_tasks(r.tasks, lexicon)]
        rows.append({
            "soc2020": r.soc2020,
            "title": r.title,
            "major_group": r.major_group,
            "description": r.description,
            "aliases": json.dumps(aliases),
            "tasks": json.dumps(tasks),
            "n_tasks_source": len(r.tasks),
        })
    df = pd.DataFrame(rows)
    df.to_csv(INTERIM / "tasks_aliases_soc2020.csv", index=False)
    n_alias = sum(len(json.loads(a)) for a in df["aliases"])
    print(f"tasks/aliases: {len(df)} unit groups, {n_alias} aliases ({len(slang)} curated), "
          f"{sum(len(json.loads(t)) for t in df['tasks'])} tasks kept of {df['n_tasks_source'].sum()} in Vol 1")


if __name__ == "__main__":
    main()
