# Data pipeline

Everything the page shows comes out of `python data/pipeline/run.py`. It downloads six
official files, joins them, and writes three JSON files to `public/data/`. Nothing in
those outputs is hand-typed from a source document; the only hand-written inputs are
the four files in `data/curated/`, each of which says what it is for.

```
data/
  pipeline/      one Python module per step, run in order by run.py
  raw/           downloaded sources (git-ignored) + MANIFEST.json (committed: URL, bytes, sha256)
  interim/       CSVs between steps (git-ignored), handy for checking a single join
  curated/       hand-written inputs: slang aliases, task lexicon, bank role mapping, Barclays facts
```

Set up and run:

```bash
python3 -m venv data/.venv && data/.venv/bin/pip install -r data/requirements.txt
data/.venv/bin/python data/pipeline/run.py            # add --force-download to refetch sources
```

## Sources

| Key | File | What we take from it |
|---|---|---|
| `aps_employment` | ONS Annual Population Survey, 4-digit SOC 2020 by sex, UK, **April 2025 to March 2026** (ad hoc 35014) | Employment per unit group, men + women |
| `dfe_aioe` | DfE Unit for Future Skills, *The impact of AI on UK jobs and training*, Annex 1 (Nov 2023) | Felten, Raj and Seamans' **AI Occupational Exposure** (AIOE) per SOC 2010 unit group, "All AI" and "LLM" variants |
| `soc2010_soc2020_map` | ONS SOC 2010 to SOC 2020 relationship tables (July 2021) | Share of each SOC 2010 group's workers landing in each SOC 2020 group, from Census 2011 dual coding |
| `ons_automation` | ONS *Probability of automation in England 2011 and 2017*, Table 9 | Secondary automation probability per SOC 2010 group |
| `soc2020_vol1` | ONS SOC 2020 Volume 1, structure and descriptions (Aug 2026 revision) | Titles, typical tasks, related job titles |
| `soc2020_vol2_index` | ONS SOC 2020 Volume 2, the coding index v14 (Aug 2026) | 32,670 job titles the ONS codes to unit groups, used as search aliases |

Exact URLs, publishers, licences and checksums are in `pipeline/sources.py` and `raw/MANIFEST.json`.
All six are Open Government Licence v3.0.

## Steps

### 0. `download.py`
Fetches each source if missing and writes `raw/MANIFEST.json` with size, SHA-256 and download time.

### 1. `employment.py`: who does what
The ONS discontinued the quarterly EMP04 "Employment by occupation" table in 2018, and it was
on SOC 2010 anyway. The current equivalent is an APS ad hoc release on SOC 2020. We read the
"4-digit occupation by Sex" sheet, sum men and women, and keep a flag where the ONS suppressed
a cell for small sample size (43 cells across 412 groups; no group lost both sexes).
Total: 33.29 million in employment, which matches the headline LFS figure for the period.

### 2. `exposure.py`: how exposed each job is
The brief's preferred order was ONS automation probability, then Felten's AIOE, then Eloundou's
GPT scores. Here is why the headline is Felten/AIOE via the DfE:

- **ONS probability of automation** is England-only, built on 2017 data with a pre-LLM method
  (Nedelkoska and Quintini's task approach), and the 4-digit table is on SOC 2010. It measures
  "could a machine do this", with cleaners and drivers at the top. That is the opposite story to
  the one Barclays is telling, so it is kept as a secondary column (`onsAutomation2017`) for
  the methodology, not the verdict.
- **Felten, Raj and Seamans' AIOE** scores occupations by how much the abilities they need
  overlap with what 10 AI applications (language modelling, image recognition and so on) can
  do. The DfE already mapped it from US O*NET to **UK SOC 2010** and published both an
  all-AI and an LLM-only version. That is the only AI-specific index available on a UK code
  frame from a UK government source, which made the join clean and the provenance short.
- **Eloundou et al.** would have needed a US SOC to UK SOC crosswalk of our own, with more
  loss and less defensibility. Their headline figures are used for the count-up stat instead.

Both UK-frame indices are on SOC 2010, so we carry them to SOC 2020 with the ONS relationship
tables. For every SOC 2010 group the ONS reports what share of its Census 2011 workers were
recoded into each SOC 2020 group. We weight each contribution by that share times the group's
sample size (men plus women) and take the weighted mean:

```
weight(2010 -> 2020) = census_base_2010 x share_to_2020
score(2020)          = sum(weight x score_2010) / sum(weight)
```

Each occupation records how it was mapped (`mapping.type`): 235 one-to-one (including the 4 unscored groups), 99 split (one 2010
group divided into several 2020 groups, which therefore share a score), 78 merged (several 2010
groups blended). `mapping.coverage` is the share of inflow weight that carried a score.

**Mapping losses** (`interim/mapping_losses.csv`): the DfE file covers 365 of 369 SOC 2010
groups. The four without scores (1116 elected officers, 1171 officers in armed forces, 1255
waste disposal managers, 3311 NCOs and other ranks) map one-to-one onto SOC 2020 groups
1112, 1161, 1254 and 3311, so **4 of 412 SOC 2020 groups are unscored** (about 118,000
workers, 0.4% of employment). They are listed in `meta.unscored` and the search tells the
reader why. Two further groups (1257, 3312) have 98% to 99% coverage because a sliver of their
inflow came from an unscored group.

### 3. `tasks_aliases.py`: what the job involves, and what people call it
- **Tasks** come from the ONS's own SOC 2020 Volume 1 descriptions (so no O*NET crosswalk is
  needed). Where a group lists more than four tasks we keep the two most and two least exposed
  by the rule below, in ONS order, so the breakdown shows contrast. 1,640 of 2,649 tasks kept.
- **Aliases** are, in order: the curated slang list (162 entries such as "brickie", "sparky",
  "cabbie", "postie", "dinner lady"), the ONS "related job titles", then up to 10 unqualified,
  unambiguous titles from the coding index. A title the ONS codes to more than one group (such
  as "cleaner", which goes 16 ways) is dropped from the index pass; the curated list then gives
  it one home and marks it `priority` so it wins ties in search. 5,256 aliases in total.
- **Per-task exposure is derived, not sourced.** No published index scores individual UK tasks.
  Each task sentence is matched against `curated/task_exposure_lexicon.json`, a regex lexicon
  modelled on the Eloundou rubric: positive weights for drafting, record keeping, analysis and
  scripted communication; negative weights for lifting, driving, cleaning, trades, hands-on
  care and live performance. The signal is clipped to [-1, 1] and the task exposure is the
  occupation score plus 25 times the signal, clipped to [1, 99]. Every task carries
  `derivation: "keyword-rule"` and the page labels them "Estimated".

### 4. `build.py`: the published JSON
- `score` = min-max rescaling of AIOE (All AI) to 0 to 100 across SOC 2020 groups. Min-max
  keeps the shape of the distribution; a percentile rank would make the beeswarm uniform and
  hide that most office jobs cluster near the top. `scoreLlm` is the same for the LLM variant.
- `rank` = 1 for the most exposed of the 408 scored groups.
- `verdict` bands are **employment-weighted tertiles**: each band holds about a third of UK
  workers (10.9m / 11.0m / 11.2m). Thresholds are published in `meta.thresholds` and read by
  the front end, not hard-coded. Current cut points: below 50.4 "Safe as houses", 50.4 to
  86.2 "Update your CV", 86.2 and above "Robot's got your coat".
- `public/data/bank-roles.json`: 20 bank roles, each tied to a SOC 2020 group through the job
  title the ONS coding index lists under it (for example "Bank teller" is coded 4123). Scores
  and employment are copied from the main dataset so the bank chart shares one methodology.
- `public/data/barclays-facts.json`: every Barclays number and quote with its source URL,
  plus the timeline and the three context statistics used for the count-up.

### 5. `validate.py`
Asserts unique codes, 0 to 100 scores with both ends present, contiguous ranks, tasks and
aliases on every row, a plausible employment total, every fact carrying an `http` source,
and that "nurse", "brickie", "sparky", "bank clerk" and "call centre" all resolve.

## Caveats worth repeating on the page
- Exposure is not job loss. AIOE measures overlap between a job's abilities and AI
  capabilities; it says nothing about whether employers will cut, retrain or hire.
- The DfE scores date from 2023 and the underlying Felten ability matrix from 2021.
- APS estimates are survey based; small occupations have wide confidence intervals.
- Split SOC 2020 groups inherit their parent's score (e.g. the seven nursing groups
  created in SOC 2020 share two SOC 2010 parents).
