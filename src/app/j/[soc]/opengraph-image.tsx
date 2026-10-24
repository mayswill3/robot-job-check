import { CARD_SIZE, CARD_TYPE, shareCard } from "@/lib/og/card";
import { cardJobFor, jobParams } from "@/lib/og/job";

export const alt = "My AI exposure result";
export const size = CARD_SIZE;
export const contentType = CARD_TYPE;
export const dynamicParams = false;

export function generateStaticParams() {
  return jobParams();
}

export default async function Image({ params }: { params: Promise<{ soc: string }> }) {
  const { soc } = await params;
  return shareCard(cardJobFor(soc) ?? undefined);
}
