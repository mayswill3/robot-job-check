"""Step 5: sanity checks on the published JSON. Fails loudly rather than shipping bad data."""
import json

from paths import PUBLIC


def main():
    d = json.loads((PUBLIC / "occupations.json").read_text())
    occ = d["occupations"]
    meta = d["meta"]
    socs = [o["soc"] for o in occ]
    assert len(socs) == len(set(socs)), "duplicate SOC codes"
    assert 380 <= len(occ) <= 412, f"unexpected occupation count {len(occ)}"
    assert all(0 <= o["score"] <= 100 for o in occ), "score out of range"
    assert min(o["score"] for o in occ) == 0 and max(o["score"] for o in occ) == 100, "min-max scaling broken"
    assert sorted(o["rank"] for o in occ) == list(range(1, len(occ) + 1)), "ranks not 1..n"
    assert all(o["tasks"] for o in occ), "occupation with no tasks"
    assert all(1 <= t["exposure"] <= 99 for o in occ for t in o["tasks"]), "task exposure out of range"
    assert all(len(o["aliases"]) >= 1 for o in occ), "occupation with no aliases"
    missing_emp = [o["soc"] for o in occ if o["employment"] is None]
    assert len(missing_emp) <= 20, f"too many occupations without employment: {missing_emp}"
    assert 30_000_000 <= meta["totalEmployment"] <= 36_000_000, f"total employment implausible: {meta['totalEmployment']:,}"
    for name in ("nurse", "brickie", "sparky", "bank clerk", "call centre"):
        hits = [o for o in occ if name in [a.lower() for a in o["aliases"]]]
        assert hits, f"alias {name!r} not resolvable"
    bank = json.loads((PUBLIC / "bank-roles.json").read_text())
    assert len(bank["roles"]) >= 10
    facts = json.loads((PUBLIC / "barclays-facts.json").read_text())
    assert all(f["source_url"].startswith("http") for f in facts["facts"])
    print(f"validate: OK ({len(occ)} occupations, {len(missing_emp)} without employment, {len(bank['roles'])} bank roles, {len(facts['facts'])} Barclays facts)")


if __name__ == "__main__":
    main()
