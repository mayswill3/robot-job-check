import type { Occupation } from "@/lib/types";
import { Hero } from "@/components/Hero";
import { Story } from "@/components/Story";
import { Methodology } from "@/components/Methodology";
import { bankRoles, dataset, fact, facts, getExample, slim } from "@/lib/data";
import { formatDate } from "@/lib/format";

const AUTHOR = "William Mays";
const PUBLISHED = "23 October 2026";

const POPULAR = [
  { label: "Nurse", soc: "2237" },
  { label: "Teacher", soc: "2313" },
  { label: "Bank clerk", soc: "4123" },
  { label: "Call centre", soc: "7211" },
  { label: "Plumber", soc: "5315" },
  { label: "Lorry driver", soc: "8211" },
  { label: "Software developer", soc: "2134" },
  { label: "Hairdresser", soc: "6221" },
  { label: "Solicitor", soc: "2412" },
];

export function Article({ initial }: { initial?: Occupation }) {
  const all = dataset.occupations.map(slim);
  return (
    <main>
      <Hero cuts={fact("job_cuts")} share={fact("share_of_workforce")} headcount={fact("headcount")} announced={formatDate(facts.announcement_date)} author={AUTHOR} published={PUBLISHED} />
      <Story
        example={getExample()}
        initial={initial}
        all={all}
        thresholds={dataset.meta.thresholds}
        employmentPeriod={dataset.meta.employmentPeriod}
        totalEmployment={dataset.meta.totalEmployment}
        popular={POPULAR}
        bankRoles={bankRoles}
        timeline={facts.timeline}
        taskStat={fact("tasks_faster_llm")}
        toolStat={fact("tasks_faster_llm_tools")}
        ukStat={fact("uk_workers_exposed")}
        facts={facts}
      />
      <Methodology meta={dataset.meta} facts={facts} />
    </main>
  );
}
