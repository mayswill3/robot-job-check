# Will a robot take your job?

**The brief:** take one of the week's best stories out of its traditional layout and turn it into an interactive that
keeps tabloid readers scrolling and playing with the data.

**The story:** on 22 October 2026 Barclays said about 5,000 jobs, roughly 5% of its global workforce, will go by the end of
the year, with AI and technology credited for the savings. The traditional version is a bank's numbers and a chief
executive's quote. This version asks the reader one question first: what do *you* do?

**Live:** https://robot-job-check.vercel.app
**Stack:** Next.js 16 (App Router, TypeScript), CSS Modules, D3 as React components, pandas pipeline, Vercel, Upstash Redis for the poll.

![Hero at 375px](docs/hero.png)

## Why this story

Picking the story was the first editorial decision. The week's front pages were dominated by the war and by energy
bills, both huge and both hard to make personal with public data in a day. Barclays had three things the others did not:

1. **A question every reader asks themselves.** "Will a robot take your job?" is not a story about a bank, it is a
   story about the person holding the phone. That is what makes a tabloid reader stop scrolling.
2. **A villain with a quotable boss.** AI gets the blame in every headline, then the chief executive calls it
   "the icing on the cake, not the cake". That tension is the spine of the piece.
3. **Real data to play with.** The ONS counts how many people do every job in Britain, and a published AI exposure
   index scores every one of those jobs. Join the two and you can answer the reader's question for 408 occupations,
   not just bank clerks.

## Traditional layout versus this

| Traditional article | This interactive |
|---|---|
| Lead: Barclays cuts 5,000 jobs as AI drives savings. | Lead: Will a robot take **your** job? The Barclays numbers sit under the headline as the hook, not the subject. |
| Numbers: 5,000, 5%, £1.1bn, £2.3bn profit. | Numbers: your score out of 100, your rank of 408, how many people do your job. |
| Quote from the chief executive. | The quote is one stop on a four-stop timeline the reader scrolls through after checking their own job, then a pull quote on which roles are going. |
| A list of affected departments. | Ten bank jobs ranked by exposure, with the reader's own job highlighted if it is in the bank. |
| A graphic, if any: a bar chart of cuts by year. | Every job in Britain as one dot, sized by headcount, with the reader's dot pulsing. Tap any dot to swap jobs. |
| Reader reacts in the comments. | Reader votes in a live poll and copies a one-line result to the group chat. |
| Read once. | Search again: nurse, brickie, sparky, the boss. Each search re-lights every chart below it. |

The order of the page is the argument. Hook, then personal, then the story, then the bank, then Britain, then the
reader's say. Every section after the search pays off the search, because the reader's job stays highlighted all the
way down.

It is still an article. There is a byline, a bold lede and short tabloid paragraphs between every chart: one or two
to set the chart up, one or two underneath to say what it shows. Every figure in the copy is read from the same
facts file and dataset as the charts (see `Story.tsx`), so the words cannot drift from the numbers.

## Page, top to bottom

| # | Section | What it does |
|---|---|---|
| 1 | Hero and lede | Headline, standfirst, byline, the three Barclays numbers (5,000 / 5% / c.93,000), then five short opening paragraphs. Not a 100vh hero. |
| 2 | Job checker | Fuzzy search over 408 occupations and 5,256 aliases ("brickie" finds Bricklayers). Popular chips. Preloaded with bank clerks, labelled as an example, so it is never empty. Chips work before the data has loaded. The card keeps the reader's own word ("Nurse") next to the ONS title, scrolls into view on a phone, and the job goes into the URL (`?job=2237`) so a shared link opens on the same result. Result: traffic-light gauge, verdict, rank, "more exposed than X% of jobs", headcount, task breakdown, native share sheet on phones with clipboard fallback. |
| 3 | What Barclays said | Four-stop timeline from the 2024 savings plan to the 2027 target, then a pull quote from the chief executive on which roles go. No links on the page; sources in the footer. |
| 4 | Which bank jobs | Ten bank roles ranked by exposure, compact horizontal bars, five shown then "Show all ten", reader's job always kept visible. |
| 5 | League table | Most at risk vs safest, toggle, one line per job with a score chip (no bars: the top ten all score 97 to 100, so a bar says nothing). Five shown then "Show all ten"; reader's job highlighted or spliced in at its true position. |
| 6 | Every job in Britain | Force-layout beeswarm: x = exposure, area = headcount, reader's dot pulsing and labelled. Dots are hit-tested to the nearest dot so small ones are tappable; a tap shows the job, "Make this my job" re-runs the checker. Below it, the full league table of all 408 jobs: filter by word or band, score bars, "Find my job", and a Check button on every row. The table doubles as the chart's text alternative. |
| 7 | What the robots can already do | Count-up to 15%, the Eloundou et al. share of tasks an LLM alone could do significantly faster, with the 47 to 56% with-tooling figure. |
| 8 | Poll | "Would you trust a robot with your money?" Real counts in Redis, one vote per reader per day. |
| 9 | What happens next | Closing paragraphs: the rest of the cuts, the 2027 target, and a nudge to check again and share. |
| 10 | Where the numbers come from | What the score is and is not, how verdicts are drawn, code mapping, task derivation, every Barclays fact with its primary source, every dataset. Theme toggle lives here. |

## The data

Full detail, including why each source was chosen over the alternatives in the brief, is in
[`data/README.md`](data/README.md). Short version:

- **Who does what:** ONS Annual Population Survey, 4-digit SOC 2020, April 2025 to March 2026. 33.3 million
  people in work across 412 unit groups.
- **How exposed each job is:** Felten, Raj and Seamans' AI Occupational Exposure index, as mapped to UK
  SOC 2010 by the Department for Education (Nov 2023). Carried to SOC 2020 with the ONS relationship
  tables, weighting each old code by how many of its workers landed in each new one. 408 of 412 groups
  scored; the four gaps (elected officials, armed forces officers and other ranks, waste managers) are
  0.4% of employment and are listed on the page.
- **Why not the ONS automation probability** that the brief put first: England only, 2017 data, pre-LLM
  method, cleaners and drivers at the top. It is the wrong lens for a story about desk jobs, so it is kept
  as a secondary column in the JSON and discussed in the methodology, not used for the verdict.
- **Tasks and aliases:** ONS SOC 2020 Volume 1 (tasks, related job titles) and Volume 2 coding index
  (32,670 job titles). Per-task exposure is **derived** by a documented keyword rule and labelled
  "Estimated" everywhere it appears, because no published source scores UK tasks.
- **Score and verdicts:** score is the AIOE min-max rescaled to 0 to 100. Verdict bands are
  employment-weighted tertiles (each band holds a third of UK workers), published in the JSON and read by
  the front end rather than hard-coded.
- **Barclays:** every figure in `public/data/barclays-facts.json` points at a primary source, Barclays' Q3 2026 results
  or its 2025 Annual Report, and that is what the page shows. The same file keeps a `verified_via` URL for each figure
  recording the press coverage it was cross-checked against during the build, so the trail is complete without the
  page linking to other outlets.

Regenerate everything with:

```bash
python3 -m venv data/.venv && data/.venv/bin/pip install -r data/requirements.txt
npm run data
```

## Design decisions

- **Tabloid energy without the masthead.** Oswald for display, system font for body, one red, black
  rules, numbers set huge. No logo, no imitation of any title's branding.
- **Verdicts are three words long** and each comes with a non-colour mark (✓ ! ✕) so the gauge, bars and
  beeswarm never rely on colour alone.
- **The reader's job is the thread.** One piece of state in `Story.tsx` drives the result card, the bank
  bars, the league table and the beeswarm, so scrolling keeps paying off after the search.
- **Less is more on the page.** Each section is a short paragraph or two of copy, the data, then a short
  paragraph on what it shows. Sources, caveats and the theme toggle live in the footer so nothing competes
  with the charts.
- **Honest about estimates.** Per-task scores are labelled "Estimated" with a one-line explanation under
  the chart, and the methodology says plainly that exposure is not job loss.
- **Charts are React components that use D3 for maths only.** `d3-shape` draws the gauge arcs,
  `d3-scale` sizes the bars, `d3-force` lays out the swarm; React owns the DOM. No pasted examples, no
  `select()`.
- **Light and dark from CSS tokens**, following the OS with a three-way override stored in
  `localStorage` and applied before first paint.
- **Performance budget.** The page prerenders to static HTML. The 467 KB occupations file (about 90 KB
  over the wire) loads when the browser is idle; the search index builds on first focus; the beeswarm and
  `d3-force` load only when the reader scrolls near them. Lighthouse mobile (local, simulated throttling):
  performance 99, accessibility 100, best practices 96, SEO 100.
- **Accessibility.** WAI-ARIA combobox for search, `aria-live` on the result, `aria-pressed` toggles,
  visible focus rings, `prefers-reduced-motion` disables the needle sweep, bar sweeps, pulse and count-up.
  The beeswarm has a text summary and a "read as a list" fallback. Works at 375px with no horizontal
  scroll (asserted in the Playwright suite).

## Running it

```bash
npm install
npm run dev            # http://localhost:3000
npm test               # Jest: search matcher, verdict logic, ranking (24 tests)
npm run build && npm run test:e2e   # Playwright mobile smoke test (searches "nurse", checks the verdict)
npm run lint && npm run typecheck
```

The poll needs two environment variables, provisioned by the Upstash integration on Vercel
(`UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`, or the `KV_REST_API_*` pair). Without them the
poll shows "having a lie down" and everything else works.

## Embedding in a CMS

The page is static HTML plus one route handler, so the simplest embed is an iframe of the Vercel URL.
Because the API is the only server dependency, a pure static export is one step away: point
`NEXT_PUBLIC_POLL_API` at the deployed origin, remove `src/app/api`, add `output: "export"` and the
`out/` folder can be dropped into any host.

## Repository layout

```
data/            Python pipeline, curated inputs, data README
public/data/     occupations.json, bank-roles.json, barclays-facts.json (generated)
src/lib/         search, verdict, ranking, formatting + Jest tests
src/components/  one component per section and chart, CSS Modules alongside
src/app/         layout, page, globals.css, api/poll route handler
tests/e2e/       Playwright smoke test
```

## Caveats I would raise in the newsroom

- Exposure measures overlap between a job's abilities and AI capability. It is not a forecast of cuts.
- The DfE scores are from 2023 on 2021 ability data; the field moves faster than official statistics.
- Split SOC groups inherit one parent score (the seven nursing groups share two).
- Per-task numbers are an editorial derivation, clearly marked; they are there to make the breakdown
  legible, not to be quoted.
