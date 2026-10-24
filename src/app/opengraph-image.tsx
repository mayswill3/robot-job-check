import { CARD_SIZE, CARD_TYPE, shareCard } from "@/lib/og/card";

export const alt = "Will a robot take your job?";
export const size = CARD_SIZE;
export const contentType = CARD_TYPE;

export default function Image() {
  return shareCard();
}
