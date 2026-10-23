import type { BarclaysFacts, DatasetMeta } from "@/lib/types";
import { formatInt } from "@/lib/format";
import styles from "./Methodology.module.css";

export function Methodology({ meta, facts }: { meta: DatasetMeta; facts: BarclaysFacts }) {
  const src = meta.sources;
  return (
    <footer id="methodology" className={styles.foot} aria-labelledby="methodology-title">
      <div className="container">
        <span className="kicker">How we did it</span>
        <h2 id="methodology-title" className={styles.title}>
          Methodology and sources
        </h2>

        <h3 className={styles.h3}>The exposure score</h3>
        <p>
          Each job&rsquo;s score comes from the <strong>AI Occupational Exposure</strong> index built by economists Edward Felten, Manav Raj
          and Robert Seamans. It measures how far the abilities a job relies on overlap with what ten AI applications can do, from
          language modelling to image recognition. The Department for Education mapped it to UK occupation codes in November 2023.
          We rescaled it so the most exposed occupation scores 100 and the least scores 0.
        </p>
        <p>
          <strong>Exposure is not job loss.</strong> A high score means AI can already do a lot of what the job involves. Whether an
          employer cuts, retrains or hires is a separate question. Accountants top the table; the big four are not empty.
        </p>

        <h3 className={styles.h3}>The verdicts</h3>
        <p>
          The three bands split British workers into thirds by headcount. Scores below {meta.thresholds.watch} are &ldquo;Safe as houses&rdquo;,
          {" "}{meta.thresholds.watch} to {meta.thresholds.risk} &ldquo;Update your CV&rdquo;, {meta.thresholds.risk} and above &ldquo;Robot&rsquo;s got your coat&rdquo;.
          Roughly {formatInt(Math.round(meta.employmentByVerdict.risk / 1e5) / 10)} million people work in the top band.
        </p>

        <h3 className={styles.h3}>Occupation codes</h3>
        <p>
          Jobs are the {meta.occupations + meta.unscored.length} unit groups of the ONS Standard Occupational Classification 2020. The DfE scores were
          published on the older SOC 2010 codes, so we carried them across with the ONS&rsquo;s own relationship tables, weighting by how many
          workers moved from each old code to each new one ({meta.mappingTypes["one-to-one"]} mapped one-to-one, {meta.mappingTypes.split} split,{" "}
          {meta.mappingTypes.merged} merged). {meta.unscored.length} groups have no score because the DfE never covered their parent codes:{" "}
          {meta.unscored.map((u) => u.title.toLowerCase()).join(", ")}. Together they are {formatInt(Math.round(meta.unscored.reduce((s, u) => s + u.employment, 0) / 1000))},000
          people, under half a percent of the workforce.
        </p>

        <h3 className={styles.h3}>Tasks</h3>
        <p>
          The tasks listed for each job are the ONS&rsquo;s own descriptions. No published index scores individual tasks, so the per-task
          figures marked &ldquo;Estimated&rdquo; are ours: each task sentence is matched against a published keyword rule (drafting, record-keeping and
          analysis score up; lifting, driving, cleaning and hands-on care score down) and nudged from the job&rsquo;s overall score.
        </p>

        <h3 className={styles.h3}>Headcounts</h3>
        <p>
          &ldquo;People doing it&rdquo; is the ONS Annual Population Survey estimate of people whose main job is in that group, {meta.employmentPeriod},
          UK, men and women combined: {formatInt(Math.round(meta.totalEmployment / 1e5) / 10)} million in all. It is a survey, so small occupations carry wide margins.
        </p>

        <h3 className={styles.h3}>Barclays</h3>
        <ul className={styles.list}>
          {facts.facts.map((f) => (
            <li key={f.key}>
              <strong>{f.label}: {f.display}.</strong> &ldquo;{f.quote}&rdquo;{" "}
              <a href={f.source_url} target="_blank" rel="noopener noreferrer">
                {f.source}
              </a>
            </li>
          ))}
        </ul>

        <h3 className={styles.h3}>Context figures</h3>
        <ul className={styles.list}>
          {facts.context_stats.map((f) => (
            <li key={f.key}>
              <strong>{f.display}:</strong> {f.label}. &ldquo;{f.quote}&rdquo;{" "}
              <a href={f.source_url} target="_blank" rel="noopener noreferrer">
                {f.source}
              </a>
            </li>
          ))}
        </ul>

        <h3 className={styles.h3}>Datasets</h3>
        <ul className={styles.list}>
          {Object.entries(src).map(([k, s]) => (
            <li key={k}>
              <a href={s.landing} target="_blank" rel="noopener noreferrer">
                {s.title}
              </a>
              , {s.publisher}. {s.used_for}. {s.licence}.
            </li>
          ))}
        </ul>

        <p className={styles.small}>
          Felten, E., Raj, M. and Seamans, R. (2021) &ldquo;Occupational, industry, and geographic exposure to artificial intelligence&rdquo;, Strategic
          Management Journal. Data generated {meta.generated}. Code, data pipeline and full method on GitHub. Poll counts are a live tally
          stored without personal data.
        </p>
      </div>
    </footer>
  );
}
