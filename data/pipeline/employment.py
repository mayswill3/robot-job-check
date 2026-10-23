"""Step 1: UK employment per SOC 2020 unit group.

Source: ONS Annual Population Survey, April 2025 to March 2026, sheet
"4-digit occupation by Sex". We sum men and women in their main job. The APS is a
sample survey, so small cells are suppressed by the ONS; we keep a flag so the
front end can say "too few to estimate" rather than print a zero.
"""
import re

import pandas as pd

from paths import INTERIM, RAW

SHEET = "4-digit occupation by Sex"


def main():
    raw = pd.read_excel(RAW / "aps_soc2020_a25m26.xlsx", sheet_name=SHEET, header=None)
    period = str(raw.iloc[3, 0]).strip()
    rows = []
    for _, r in raw.iterrows():
        label = str(r[1])
        m = re.match(r"^(\d{4})\s+(.+)$", label)
        if not m:
            continue
        male = pd.to_numeric(r[2], errors="coerce")
        female = pd.to_numeric(r[3], errors="coerce")
        suppressed = []
        if pd.isna(male):
            suppressed.append("men")
        if pd.isna(female):
            suppressed.append("women")
        total = float(pd.Series([male, female]).sum(min_count=1)) if suppressed != ["men", "women"] else float("nan")
        rows.append({
            "soc2020": m.group(1),
            "title_aps": m.group(2).strip(),
            "men": male,
            "women": female,
            "employment": total,
            "suppressed": ",".join(suppressed),
        })
    df = pd.DataFrame(rows)
    assert df["soc2020"].is_unique, "duplicate SOC codes in APS sheet"
    df.to_csv(INTERIM / "employment_soc2020.csv", index=False)
    print(f"employment: {len(df)} unit groups, period '{period}', total {df['employment'].sum():,.0f}, suppressed cells: {(df['suppressed'] != '').sum()}")
    return period


if __name__ == "__main__":
    main()
