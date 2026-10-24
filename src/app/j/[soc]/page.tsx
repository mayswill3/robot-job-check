import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Article } from "@/components/Article";
import { cardJobFor, jobParams, occupationFor } from "@/lib/og/job";

/**
 * /j/2237: the same article, opened on one job, with its own title and share card so a
 * link sent to a mate previews their result. One static page per occupation.
 */
export const dynamicParams = false;

export function generateStaticParams() {
  return jobParams();
}

export async function generateMetadata({ params }: { params: Promise<{ soc: string }> }): Promise<Metadata> {
  const { soc } = await params;
  const job = cardJobFor(soc);
  if (!job) return {};
  const title = `${job.label}: ${Math.round(job.score)} out of 100. ${job.verdictLabel}`;
  const description = `More exposed than ${job.moreExposedThanPct}% of UK jobs. Will a robot take yours? Check it against 408 occupations.`;
  return {
    title,
    description,
    alternates: { canonical: `/j/${soc}` },
    openGraph: { title, description, type: "article", url: `/j/${soc}` },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default async function JobPage({ params }: { params: Promise<{ soc: string }> }) {
  const { soc } = await params;
  const o = occupationFor(soc);
  if (!o) notFound();
  return <Article initial={o} />;
}
