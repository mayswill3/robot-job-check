"use client";
import { useCallback, useState } from "react";
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
  const [selected, setSelected] = useState<Occupation>(example);
  const [cache, setCache] = useState<Record<string, Occupation>>({
    [example.soc]: example,
  });

  const onSelect = useCallback((o: Occupation) => {
    setSelected(o);
    setCache((c) => (c[o.soc] ? c : { ...c, [o.soc]: o }));
  }, []);

  // Picking a dot on the beeswarm only knows the SOC; pull the full record from the
  // lazily loaded dataset via the checker's cache, or fetch it if the reader got there first.
  const pickSoc = useCallback(
    async (soc: string) => {
      if (cache[soc]) return onSelect(cache[soc]);
      try {
        const d = (await (await fetch("/data/occupations.json")).json()) as {
          occupations: Occupation[];
        };
        const o = d.occupations.find((x) => x.soc === soc);
        if (o) onSelect(o);
        document
          .getElementById("checker")
          ?.scrollIntoView({ behavior: "smooth", block: "start" });
      } catch {}
    },
    [cache, onSelect],
  );

  const { ref: swarmRef, inView: swarmInView } = useInView<HTMLDivElement>(
    "600px 0px 600px 0px",
  );
  const slimSelected: SlimOccupation =
    all.find((o) => o.soc === selected.soc) ?? selected;
  const supportShare = facts.facts.find(
    (f) => f.key === "support_functions_share",
  );
  const cuts = facts.facts.find((f) => f.key === "job_cuts");

  return (
    <>
      <Section
        id="checker"
        kicker="Job checker"
        title="Check your job"
        intro={<p>Type what you do. Slang works.</p>}
      >
        <JobChecker
          example={example}
          all={all}
          thresholds={thresholds}
          employmentPeriod={employmentPeriod}
          popular={popular}
          selected={selected}
          onSelect={onSelect}
        />
      </Section>

      <Section
        id="barclays"
        kicker="The story so far"
        title="What Barclays said"
        tone="tint"
        intro={<p>How {cuts?.display} jobs ended up on the line.</p>}
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
              {supportShare?.display} of the cuts are in support jobs, Barclays
              says. Ten bank jobs, scored.
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
              The ten most exposed jobs, the ten safest, and where yours sits.
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
            {all.length} jobs. Further right, more exposed. Bigger dot, more
            people. Tap any dot.
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
              {ukStat.display} of UK workers are in jobs with tasks AI could do
              or help with, says the Government.
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

        <Section id="poll" kicker="Your call" title="Have your say">
          <Poll />
        </Section>
      </div>
    </>
  );
}
