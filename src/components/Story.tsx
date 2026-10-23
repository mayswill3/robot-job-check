"use client";
import { useCallback, useState } from "react";
import type { BankRole, BarclaysFacts, Fact, Occupation, SlimOccupation, Thresholds, TimelineItem } from "@/lib/types";
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
export function Story({ example, all, thresholds, employmentPeriod, popular, bankRoles, timeline, taskStat, toolStat, ukStat, facts }: Props) {
  const [selected, setSelected] = useState<Occupation>(example);
  const [cache, setCache] = useState<Record<string, Occupation>>({ [example.soc]: example });

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
        const d = (await (await fetch("/data/occupations.json")).json()) as { occupations: Occupation[] };
        const o = d.occupations.find((x) => x.soc === soc);
        if (o) onSelect(o);
        document.getElementById("checker")?.scrollIntoView({ behavior: "smooth", block: "start" });
      } catch {}
    },
    [cache, onSelect],
  );

  const { ref: swarmRef, inView: swarmInView } = useInView<HTMLDivElement>("600px 0px 600px 0px");
  const slimSelected: SlimOccupation = all.find((o) => o.soc === selected.soc) ?? selected;
  const supportShare = facts.facts.find((f) => f.key === "support_functions_share");
  const cuts = facts.facts.find((f) => f.key === "job_cuts");

  return (
    <>
      <Section id="checker" kicker="Job checker" title="Check your job" intro={<p>Type what you do. We&rsquo;ll match slang and nicknames too.</p>}>
        <JobChecker example={example} all={all} thresholds={thresholds} employmentPeriod={employmentPeriod} popular={popular} selected={selected} onSelect={onSelect} />
      </Section>

      <Section id="barclays" kicker="The story so far" title="What Barclays said" tone="tint" intro={<p>How a £2bn cost drive turned into {cuts?.display} jobs and a chief executive calling AI &ldquo;the icing on the cake&rdquo;.</p>}>
        <Timeline items={timeline} />
      </Section>

      <Section
        id="bank-jobs"
        kicker="Inside the bank"
        title="Which bank jobs are in the firing line?"
        intro={
          <p>
            Barclays says {supportShare?.display} of the cuts fall in support functions, including developers. Here is how twenty typical bank roles score, highest first.
            {bankRoles.some((r) => r.soc2020 === selected.soc) ? " Your job is in this list." : ""}
          </p>
        }
      >
        <BankRoles roles={bankRoles} selected={slimSelected} />
      </Section>

      <Section id="league" kicker="League table" title="Britain's most and least exposed jobs" tone="tint" intro={<p>Flip between the ten jobs with the most to worry about and the ten that can sleep easy. Your job stays highlighted.</p>}>
        <TopBottom all={all} selected={slimSelected} />
      </Section>

      <Section
        id="everyone"
        kicker="The big picture"
        title={<>Every job in Britain, one dot each</>}
        intro={
          <p>
            {all.length} occupations, placed by exposure score. Bigger dots mean more people do the job. Find yours, then tap around: the bank clerks sit a long way to the right of the brickies.
          </p>
        }
      >
        <div ref={swarmRef} style={{ minHeight: 360 }}>
          {swarmInView ? <Beeswarm all={all} selected={slimSelected} thresholds={thresholds} onPick={pickSoc} /> : null}
        </div>
      </Section>

      <Section id="already" kicker="Right now" title="What the robots can already do" tone="tint">
        <CountUp
          value={taskStat.value ?? 0}
          caption="of all work tasks could be done significantly faster by a chatbot alone, at the same quality."
          quote={toolStat.quote}
          source={toolStat.source}
          sourceUrl={toolStat.source_url}
        />
        <p style={{ textAlign: "center", marginTop: 20, fontSize: 15 }}>
          And in Britain, {ukStat.display} of workers are in jobs with tasks AI could do or help with, according to{" "}
          <a href={ukStat.source_url} target="_blank" rel="noopener noreferrer">
            the Government&rsquo;s own January 2026 assessment
          </a>
          , citing the IMF.
        </p>
      </Section>

      <Section id="poll" kicker="Your call" title="Have your say">
        <Poll />
      </Section>
    </>
  );
}
