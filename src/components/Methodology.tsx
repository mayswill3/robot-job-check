import type { BarclaysFacts, DatasetMeta } from "@/lib/types";
import { formatInt } from "@/lib/format";
import { ThemeToggle } from "./ThemeToggle";
import styles from "./Methodology.module.css";

export function Methodology({
  meta,
  facts,
}: {
  meta: DatasetMeta;
  facts: BarclaysFacts;
}) {
  const src = meta.sources;
  const unscoredPeople = Math.round(
    meta.unscored.reduce((s, u) => s + u.employment, 0) / 1000,
  );
  return (
    <footer
      id="methodology"
      className={styles.foot}
      aria-labelledby="methodology-title"
    >
      <div className="container">
        <span className="kicker">How we did it</span>
        <h2 id="methodology-title" className={styles.title}>
          Where the numbers come from
        </h2>

        {/* Short version for the reader; the full method and every source one tap away. */}
        <p className={styles.summary}>
          Each job&rsquo;s score is the <strong>AI Occupational Exposure</strong>{" "}
          index (Felten, Raj and Seamans), which measures how much of what a
          job involves overlaps with what AI can do, mapped to UK job codes by
          the Department for Education and rescaled from 0 to 100.{" "}
          <strong>Exposure is not job loss.</strong> Headcounts are the ONS
          Annual Population Survey, {meta.employmentPeriod}. The three verdicts
          split Britain&rsquo;s workers into three equal groups. Barclays
          figures are from its own results and annual report.
        </p>

        <details className={styles.details}>
          <summary>Full method and every source</summary>
          <div className={styles.body}>
          <h3 className={styles.h3}>The score</h3>
          <p>
            The index scores how far the abilities a job relies on overlap with
            what ten AI applications can do. The Department for Education
            published it against SOC 2010 job codes in 2023; we carried it
            across to SOC 2020 with the ONS relationship tables and rescaled it
            so the most exposed job scores 100 and the least 0. A high score
            means AI can do a lot of what the job involves, not that anyone is
            being sacked.
          </p>

          <h3 className={styles.h3}>The verdicts</h3>
          <p>
            The three bands each hold about a third of British workers. Below{" "}
            {meta.thresholds.watch}: Safe as houses. {meta.thresholds.watch} to{" "}
            {meta.thresholds.risk}: Update your CV. {meta.thresholds.risk} and
            above: Robot&rsquo;s got your coat.
          </p>

          <h3 className={styles.h3}>The jobs</h3>
          <p>
            Jobs are the {meta.occupations + meta.unscored.length} groups in the
            ONS Standard Occupational Classification 2020. &ldquo;People doing
            it&rdquo; is the ONS Annual Population Survey,{" "}
            {meta.employmentPeriod}, UK:{" "}
            {formatInt(Math.round(meta.totalEmployment / 1e5) / 10)} million in
            all. The DfE scores were on the older 2010 codes, so we carried them
            across using the ONS&rsquo;s own relationship tables.{" "}
            {meta.unscored.length} groups ({unscoredPeople},000 people) have no
            score because the DfE never covered them:{" "}
            {meta.unscored.map((u) => u.title.toLowerCase()).join(", ")}.
          </p>

          <h3 className={styles.h3}>The tasks</h3>
          <p>
            Tasks are the ONS&rsquo;s own job descriptions. No published index
            scores individual tasks, so the per-task figures are our estimate:
            each task is matched against a keyword rule (drafting,
            record-keeping and analysis score up; lifting, driving, cleaning and
            hands-on care score down) and nudged from the job&rsquo;s overall
            score.
          </p>

          <h3 className={styles.h3}>Barclays</h3>
          <ul className={styles.list}>
            {facts.facts.map((f) => (
              <li key={f.key}>
                {f.label}: <strong>{f.display}</strong>.{" "}
                <a
                  href={f.source_url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {f.source}
                </a>
              </li>
            ))}
          </ul>

          <h3 className={styles.h3}>Other figures</h3>
          <ul className={styles.list}>
            {facts.context_stats.map((f) => (
              <li key={f.key}>
                <strong>{f.display}</strong>: {f.label}.{" "}
                <a
                  href={f.source_url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
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
                , {s.publisher}.
              </li>
            ))}
          </ul>
        </div>
        </details>
        <p className={styles.small}>
          Data generated {meta.generated}. Open Government Licence v3.0. Poll
          counts are a live tally stored without personal data.
        </p>
        <div className={styles.toggle}>
          <ThemeToggle />
        </div>
      </div>
    </footer>
  );
}
