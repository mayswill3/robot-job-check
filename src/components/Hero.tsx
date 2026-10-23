import type { Fact } from "@/lib/types";
import styles from "./Hero.module.css";

interface Props {
  cuts: Fact;
  share: Fact;
  headcount: Fact;
  announced: string;
  author: string;
  published: string;
}

export function Hero({ cuts, share, headcount, announced, author, published }: Props) {
  return (
    <header className={styles.hero}>
      <div className="container">
        <div className={styles.topbar}>
          <span className="kicker">Data investigation</span>
        </div>
        <div className={styles.grid}>
          <h1 className={styles.headline}>
            Will a robot
            <br />{" "}
            take <span className={styles.red}>your</span> job?
          </h1>
          <div>
            <p className={styles.standfirst}>
              Barclays says AI will help it axe 5,000 jobs by Christmas. Type in
              what you do and find out if the machines are coming for you next.
            </p>
            <dl className={styles.numbers}>
              <div>
                <dt>{cuts.label}</dt>
                <dd className="num">{cuts.display}</dd>
              </div>
              <div>
                <dt>{share.label}</dt>
                <dd className="num">{share.display}</dd>
              </div>
              <div>
                <dt>{headcount.label}</dt>
                <dd className="num">{headcount.display.replace("c.", "")}</dd>
              </div>
            </dl>
          </div>
        </div>
        <p className={styles.byline}>
          By <strong>{author}</strong>, {published}
        </p>
        <p className={styles.meta}>
          Barclays announced the cuts on {announced} with its third-quarter results.{" "}
          <a href="#methodology">Sources and method</a>
        </p>
      </div>
    </header>
  );
}
