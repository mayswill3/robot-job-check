"""Step 2: AI exposure per SOC 2020 unit group.

Headline index: Felten, Raj and Seamans' AI Occupational Exposure (AIOE), as mapped
to UK SOC 2010 by the Department for Education (Nov 2023, Annex 1, Table 1). The DfE
file is standardised (mean 0, sd 1 across 365 SOC 2010 unit groups) and comes in two
flavours: "All AI" (10 AI applications) and "LLM" (language modelling only).

Secondary index: ONS probability of automation (England, 2017, SOC 2010 4-digit,
Table 9). Pre-dates modern AI, so it is kept for the methodology, not the headline.

Both are on SOC 2010. We carry them to SOC 2020 with the ONS relationship tables,
weighting each SOC 2010 contributor by the Census 2011 dual-coded sample: for every
SOC 2010 group the ONS reports what share of its workers land in each SOC 2020 group.
    weight(2010 -> 2020) = census_base_2010 * share_to_2020  (men + women)
    score(2020)          = sum(weight * score_2010) / sum(weight)
Mapping losses are written to interim/mapping_losses.csv.
"""
import re

import numpy as np
import pandas as pd

from paths import INTERIM, RAW


def read_crosswalk():
    df = pd.read_excel(RAW / "soc2010_to_soc2020.xlsx", sheet_name="soc2010-soc2020-map_Unit")
    df.columns = [c.strip() for c in df.columns]
    df["SOC2010"] = df["SOC2010"].ffill()
    base_cols = [c for c in df.columns if c.endswith("_base_2010")]
    df[base_cols] = df[base_cols].ffill()
    df = df[df["SOC2020"] != "Total sample"].copy()
    df["soc2010"] = df["SOC2010"].str.extract(r"^(\d{4})")
    df["soc2020"] = df["SOC2020"].astype(str).str.extract(r"^(\d{4})")
    df = df.dropna(subset=["soc2010", "soc2020"])
    for sex in ("men", "women"):
        share = df[f"{sex}_census_perc_2020"].fillna(df[f"{sex}_lfs_perc_2020"]).fillna(0)
        base = df[f"{sex}_census_base_2010"].fillna(df[f"{sex}_lfs_base_2010"]).fillna(0)
        df[f"w_{sex}"] = share * base
    df["weight"] = df["w_men"] + df["w_women"]
    return df[["soc2010", "soc2020", "weight"]]


def read_dfe():
    d = pd.read_excel(RAW / "dfe_annex1.xlsx", sheet_name="AIOE by education level", header=2)
    d = d[["SOC", "Description", "All AI", "LLM"]].dropna(subset=["SOC"])
    d["soc2010"] = d["SOC"].astype(int).astype(str)
    return d.rename(columns={"Description": "title_soc2010", "All AI": "aioe_all", "LLM": "aioe_llm"})[
        ["soc2010", "title_soc2010", "aioe_all", "aioe_llm"]
    ]


def read_ons_automation():
    t = pd.read_excel(RAW / "automationreferencetables.xls", sheet_name="Table 9", header=4)
    t = t.rename(columns={"SOC10M code": "soc2010", "Probability of automation": "ons_automation_prob"})
    t = t[pd.to_numeric(t["soc2010"], errors="coerce").notna()]
    t["soc2010"] = t["soc2010"].astype(int).astype(str)
    return t[["soc2010", "ons_automation_prob"]]


def weighted(cw, scores, col):
    m = cw.merge(scores[["soc2010", col]], on="soc2010", how="left")
    m["has"] = m[col].notna()
    g = m.groupby("soc2020")
    out = pd.DataFrame({
        f"{col}": g.apply(lambda x: np.average(x.loc[x.has, col], weights=x.loc[x.has, "weight"]) if x.loc[x.has, "weight"].sum() > 0 else np.nan, include_groups=False),
        f"{col}_coverage": g.apply(lambda x: x.loc[x.has, "weight"].sum() / x["weight"].sum() if x["weight"].sum() > 0 else 0.0, include_groups=False),
    })
    return out


def main():
    cw = read_crosswalk()
    dfe = read_dfe()
    ons = read_ons_automation()

    # provenance of the mapping itself, independent of any score
    prov = cw.groupby("soc2020").apply(
        lambda x: pd.Series({
            "n_soc2010_sources": int((x["weight"] > 0).sum()),
            "dominant_soc2010": x.loc[x["weight"].idxmax(), "soc2010"] if x["weight"].sum() > 0 else None,
            "dominant_share": x["weight"].max() / x["weight"].sum() if x["weight"].sum() > 0 else 0.0,
        }),
        include_groups=False,
    )
    # how much of the dominant 2010 group went elsewhere (split) ?
    out_share = cw.groupby("soc2010")["weight"].transform(lambda w: w / w.sum())
    cw2 = cw.assign(out_share=out_share)
    dom = prov.reset_index().merge(cw2, left_on=["soc2020", "dominant_soc2010"], right_on=["soc2020", "soc2010"], how="left")
    prov["dominant_inflow_share"] = dom.set_index("soc2020")["out_share"]

    def mapping_type(r):
        if r.n_soc2010_sources == 1 and r.dominant_inflow_share >= 0.95:
            return "one-to-one"
        if r.dominant_share >= 0.95 and r.dominant_inflow_share < 0.95:
            return "split"  # a 2010 group was divided into several 2020 groups
        if r.dominant_share < 0.95:
            return "merged"  # several 2010 groups feed this 2020 group
        return "one-to-one"

    prov["mapping_type"] = prov.apply(mapping_type, axis=1)

    res = prov.join(weighted(cw, dfe, "aioe_all")).join(weighted(cw, dfe, "aioe_llm")).join(weighted(cw, ons, "ons_automation_prob"))
    res.index.name = "soc2020"
    res = res.reset_index()
    res.to_csv(INTERIM / "exposure_soc2020.csv", index=False)

    # losses
    losses = []
    for code in sorted(set(cw["soc2010"]) - set(dfe["soc2010"])):
        losses.append({"stage": "dfe_aioe", "code": code, "issue": "SOC 2010 group has no AIOE score in DfE Annex 1"})
    for code in sorted(set(cw["soc2010"]) - set(ons["soc2010"])):
        losses.append({"stage": "ons_automation", "code": code, "issue": "SOC 2010 group has no ONS automation probability"})
    for _, r in res[res["aioe_all_coverage"] < 0.999].iterrows():
        losses.append({"stage": "crosswalk", "code": r.soc2020, "issue": f"only {r.aioe_all_coverage:.0%} of inflow weight carried an AIOE score"})
    pd.DataFrame(losses, columns=["stage", "code", "issue"]).to_csv(INTERIM / "mapping_losses.csv", index=False)

    print(f"exposure: {len(res)} SOC 2020 groups; AIOE present for {res['aioe_all'].notna().sum()}; "
          f"mapping types: {res['mapping_type'].value_counts().to_dict()}; losses logged: {len(losses)}")


if __name__ == "__main__":
    main()
