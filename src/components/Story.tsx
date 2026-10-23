"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import type {
  BankRole,
  BarclaysFacts,
  Fact,
  Occupation,
  SlimOccupation,
  Thresholds,
  TimelineItem,
} from "@/lib/types";
import { Section } from "./Section";
import { Lede, Opening, PullQuote } from "./Prose";
import { formatPeople } from "@/lib/format";
import { JobChecker } from "./JobChecker";
import { Timeline } from "./Timeline";
import { BankRoles } from "./BankRoles";
import { TopBottom } from "./TopBottom";
import dynamic from "next/dynamic";

const Beeswarm = dynamic(() => import("./Beeswarm").then((m) => m.Beeswarm), {
  ssr: false,
  loading: () => <div style={{ minHeight: 360 }} aria-busy="true" />,
});
import { CountUp } from "./CountUp";
import { Poll } from "./Poll";
import { useInView } from "@/hooks/useInView";

interface Props {
  example: Occupation;
  all: SlimOccupation[];
  thresholds: Thresholds;
  employmentPeriod: string;
  totalEmployment: number;
  popular: { label: string; soc: string }[];
  bankRoles: BankRole[];
  timeline: TimelineItem[];
  taskStat: Fact;
  toolStat: Fact;
  ukStat: Fact;
  facts: BarclaysFacts;
}

interface Selection {
  occ: Occupation;
  /** The reader's own word for it, or the ONS title. */
  label: string;
  /** False until the reader has picked something: the card shows the preloaded example. */
  picked: boolean;
}

/** Client shell that owns one piece of state: the reader's job. Every chart reacts to it. */
export function Story({
  example,
  all,
  thresholds,
  employmentPeriod,
  popular,
  bankRoles,
  timeline,
  taskStat,
  toolStat,
  ukStat,
  facts,
}: Props) {
  const [sel, setSel] = useState<Selection>({ occ: example, label: "Bank clerk", picked: false });
  const selected = sel.occ;
  const cache = useRef<Record<string, Occupation>>({ [example.soc]: example });

  const onSelect = useCallback((o: Occupation, label: string) => {
    setSel({ occ: o, label, picked: true });
    cache.current[o.soc] = o;
    // Keep the job in the URL so a shared link or a refresh lands on the same result.
    try {
      const url = new URL(window.location.href);
      url.searchParams.set("job", o.soc);
      window.history.replaceState(null, "", url);
    } catch {}
  }, []);

  const fetchOcc = useCallback(async (soc: string): Promise<Occupation | null> => {
    if (cache.current[soc]) return cache.current[soc];
    try {
      const d = (await (await fetch("/data/occupations.json")).json()) as { occupations: Occupation[] };
      for (const o of d.occupations) cache.current[o.soc] = o;
      return d.occupations.find((x) => x.soc === soc) ?? null;
    } catch {
      return null;
    }
  }, []);

  // "Make this my job" on the beeswarm: select it, then go back up to the card so the
  // reader sees the verdict. Tapping a dot on its own only shows the tooltip.
  const pickSoc = useCallback(
    async (soc: string) => {
      const o = await fetchOcc(soc);
      if (!o) return;
      onSelect(o, o.title);
      document.getElementById("checker")?.scrollIntoView({ behavior: "smooth", block: "start" });
    },
    [fetchOcc, onSelect],
  );

  // Deep link: /?job=2237 opens on that job, scrolled to the card.
  useEffect(() => {
    const soc = new URLSearchParams(window.location.search).get("job");
    if (!soc || !/^\d{4}$/.test(soc)) return;
    let cancelled = false;
    fetchOcc(soc).then((o) => {
      if (!o || cancelled) return;
      setSel({ occ: o, label: o.title, picked: true });
      document.getElementById("checker")?.scrollIntoView({ block: "start" });
    });
    return () => {
      cancelled = true;
    };
  }, [fetchOcc]);

  const { ref: swarmRef, inView: swarmInView } = useInView<HTMLDivElement>(
    "600px 0px 600px 0px",
  );
  const slimSelected: SlimOccupation =
    all.find((o) => o.soc === selected.soc) ?? selected;
  const supportShare = facts.facts.find(
    (f) => f.key === "support_functions_share",
  );
  const cuts = facts.facts.find((f) => f.key === "job_cuts");
  /** Display string for a Barclays fact, by key. Every figure in the copy comes through here or from the dataset. */
  const f = (key: string) => facts.facts.find((x) => x.key === key)?.display ?? "";
  const bySoc = (soc: string) => all.find((o) => o.soc === soc);
  const sc = (soc: string) => Math.round(bySoc(soc)?.score ?? 0);
  const emp = (soc: string) => formatPeople(bySoc(soc)?.employment);
  const workers = formatPeople(all.reduce((n, o) => n + (o.employment ?? 0), 0));
  const bankSafe = bankRoles.filter((r) => r.verdict === "safe").length;
  const bankLowest = bankRoles.reduce((a, b) => (a.score <= b.score ? a : b));
  const ceo = facts.facts.find((x) => x.key === "ceo_roles_quote");
  const icing = f("ceo_quote").replace(/^"AI is |\."$/g, "");

  return (
    <>
      <Opening>
        <Lede>
          FIVE THOUSAND Barclays workers will be out of a job by New Year, and
          the bank&rsquo;s boss says years of spending on technology are the
          reason.
        </Lede>
        <p>
          The cuts wipe out one in 20 of the bank&rsquo;s{" "}
          {f("headcount").replace("c.", "")} staff worldwide. They were
          announced on the same day Barclays reported a {f("q3_profit")}{" "}
          quarterly profit, up 12 per cent on last year.
        </p>
        <p>
          Six in ten of the jobs going are in what the bank calls support
          functions. That includes software developers, the people who build
          the technology.
        </p>
        <p>
          Chief executive C.S. Venkatakrishnan, known as Venkat, insists AI is
          &ldquo;{icing}&rdquo;. But if a bank can shed thousands of desk jobs
          while profits rise, what does that mean for yours?
        </p>
        <p>
          We scored all {all.length} jobs in Britain on how much of the work AI
          can already do. Find yours.
        </p>
      </Opening>

      <Section
        id="checker"
        kicker="Job checker"
        title="Check your job"
        intro={
          <p>
            Type what you do. Slang works: &ldquo;brickie&rdquo;,
            &ldquo;sparky&rdquo; and &ldquo;dinner lady&rdquo; all land.
          </p>
        }
        outro={
          <>
            <p>
              <strong>How to read it.</strong> Zero means AI can do none of what
              you do. A hundred means it overlaps with nearly all of it. We split
              Britain&rsquo;s {workers} workers into three equal groups: the
              safest third, the middle third and the most exposed third.
            </p>
            <p>
              Exposed does not mean extinct. Accountants score {sc("2421")} and
              nobody expects them to vanish. It means a big chunk of the day job
              could soon be done by, or with, a machine.
            </p>
          </>
        }
      >
        <JobChecker
          example={example}
          all={all}
          thresholds={thresholds}
          employmentPeriod={employmentPeriod}
          popular={popular}
          selected={selected}
          label={sel.label}
          isExample={!sel.picked}
          onSelect={onSelect}
        />
      </Section>

      <Section
        id="barclays"
        kicker="The story so far"
        title="What Barclays said"
        tone="tint"
        intro={
          <p>
            Nobody at Barclays woke up on results day and decided to sack{" "}
            {cuts?.display} people. The bank promised investors £2bn of savings
            back in February 2024. The first {f("already_cut")} roles went
            quietly in the first half of this year. Then came the results call.
          </p>
        }
        outro={
          <>
            <PullQuote cite={ceo?.source ?? "Barclays results call"}>
              {ceo?.display.replace(/^"|"$/g, "")}
            </PullQuote>
            <p>
              That is how Venkat described the jobs going. In plain English:
              the back office. He said the cuts were the result of
              &ldquo;investments which we&rsquo;ve made in technology over a
              number of years&rdquo;.
            </p>
          </>
        }
      >
        <Timeline items={timeline} />
      </Section>

      <div className="two-up">
        <Section
          id="bank-jobs"
          kicker="Inside the bank"
          title="Which bank jobs are in the firing line?"
          intro={
            <p>
              So who inside a bank should be worried? {supportShare?.display} of
              the cuts are in support jobs, Barclays says. We took ten jobs you
              would find at any high street bank and scored each one the same
              way as every other job in Britain.
            </p>
          }
          outro={
            <p>
              {bankSafe === 0
                ? "Not one of the ten is in the safe third."
                : `Only ${bankSafe} of the ten are in the safe third.`}{" "}
              Branch managers, mortgage advisers and the developers Barclays
              named score {sc("1131")}, {sc("2422")} and {sc("2134")}. Cashiers
              and call handlers sit just under the red line. Even the{" "}
              {bankLowest.role.replace(/ \(.*\)$/, "").toLowerCase()} on the
              door scores {Math.round(bankLowest.score)}.
            </p>
          }
        >
          <BankRoles roles={bankRoles} selected={slimSelected} />
        </Section>

        <Section
          id="league"
          kicker="League table"
          title="Britain's most and least exposed jobs"
          tone="tint"
          intro={
            <p>
              Pull back and the country splits in two. The most exposed jobs
              have a degree and a desk: consultants, accountants,
              psychologists, solicitors. The safest get their hands dirty:
              roofers, groundworkers, plasterers, cleaners. Flip the toggle to
              see where yours sits.
            </p>
          }
          outro={
            <p>
              The old fear was robots on the factory floor. This machine reads,
              writes and does sums, so the pecking order flips. A sports player
              scores {sc("3431")}. A management consultant scores {sc("2431")}.
            </p>
          }
        >
          <TopBottom all={all} selected={slimSelected} />
        </Section>
      </div>

      <Section
        id="everyone"
        kicker="The big picture"
        title={<>Every job in Britain, one dot each</>}
        intro={
          <p>
            All {all.length} jobs, one dot each. Further right, more exposed.
            Bigger dot, more people do it. Yours is ringed. Tap any dot to see
            the job.
          </p>
        }
        outro={
          <p>
            Watch the big dots on the right. Software developers ({emp("2134")}),
            financial managers ({emp("1131")}) and book-keepers and payroll
            clerks ({emp("4122")}) are among the largest jobs in the most
            exposed third. On the left, the two biggest safe jobs are care
            workers and shop assistants, {emp("6135")} and {emp("7111")} people.
          </p>
        }
      >
        <div ref={swarmRef} style={{ minHeight: 360 }}>
          {swarmInView ? (
            <Beeswarm
              all={all}
              selected={slimSelected}
              thresholds={thresholds}
              onPick={pickSoc}
            />
          ) : null}
        </div>
      </Section>

      <div className="two-up">
        <Section
          id="already"
          kicker="Right now"
          title="What the robots can already do"
          tone="tint"
          intro={
            <p>
              The Government says {ukStat.display} of UK workers are in jobs with
              tasks AI could do or help with. That does not mean {ukStat.display}{" "}
              of jobs disappear. It means the machine takes a slice of the work.
              How big a slice? Researchers went through every task in the US
              economy and asked how many a chatbot could do faster, at the same
              quality.
            </p>
          }
          outro={
            <p>
              Put another way: the chatbot on its own is the icing. The software
              built around it is the cake.
            </p>
          }
        >
          <CountUp
            value={taskStat.value ?? 0}
            caption="of all work tasks could already be done faster by a chatbot alone, at the same quality."
            source={toolStat.source}
            sourceUrl={toolStat.source_url}
          />
        </Section>

        <Section
          id="poll"
          kicker="Your call"
          title="Have your say"
          intro={
            <p>
              Barclays says AI is the icing, not the cake. You have seen the
              numbers. What do you reckon?
            </p>
          }
        >
          <Poll />
        </Section>
      </div>

      <Section
        id="next"
        kicker="What happens next"
        title="The rest go by Christmas"
        intro={
          <>
            <p>
              The remainder of the {cuts?.display} roles go before the year is
              out, with {f("savings_2027")} of savings pencilled in for 2027.
            </p>
            <p>
              One thing is certain. The scores on this page measure what AI can
              do today. The number next to your job will not stay still.
            </p>
            <p>
              <a href="#checker">Check it again</a>, and send it to the mate who
              reckons they are safe.
            </p>
          </>
        }
      >
        <></>
      </Section>
    </>
  );
}
