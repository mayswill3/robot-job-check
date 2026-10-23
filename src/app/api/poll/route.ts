import { Redis } from "@upstash/redis";
import { NextResponse } from "next/server";

/**
 * Reader poll: "Would you trust a robot with your money?"
 * Counts live in one Redis hash on Upstash (Vercel Marketplace). One vote per
 * reader per day, keyed on a salted hash of the IP so no raw address is stored.
 */
const POLL_OPTIONS = ["yes", "no", "small"] as const;
type PollOption = (typeof POLL_OPTIONS)[number];
const KEY = "robot-job-check:poll:v1";
const VOTE_TTL_SECONDS = 60 * 60 * 24;

type Counts = Record<PollOption, number>;

function client(): Redis | null {
  const url = process.env.UPSTASH_REDIS_REST_URL ?? process.env.KV_REST_API_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN ?? process.env.KV_REST_API_TOKEN;
  if (!url || !token) return null;
  return new Redis({ url, token });
}

async function counts(redis: Redis): Promise<Counts> {
  const raw = (await redis.hgetall<Record<string, number | string>>(KEY)) ?? {};
  return Object.fromEntries(POLL_OPTIONS.map((o) => [o, Number(raw[o] ?? 0)])) as Counts;
}

async function voterKey(req: Request): Promise<string> {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "unknown";
  const salt = process.env.POLL_SALT ?? "robot-job-check";
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(`${salt}:${ip}`));
  const hex = Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
  return `${KEY}:voter:${hex.slice(0, 32)}`;
}

const noStore = { "Cache-Control": "no-store" };

export async function GET() {
  const redis = client();
  if (!redis) return NextResponse.json({ error: "poll_unconfigured" }, { status: 503, headers: noStore });
  try {
    return NextResponse.json({ counts: await counts(redis) }, { headers: noStore });
  } catch {
    return NextResponse.json({ error: "poll_unavailable" }, { status: 503, headers: noStore });
  }
}

export async function POST(req: Request) {
  const redis = client();
  if (!redis) return NextResponse.json({ error: "poll_unconfigured" }, { status: 503, headers: noStore });
  let option: unknown;
  try {
    option = ((await req.json()) as { option?: unknown }).option;
  } catch {
    return NextResponse.json({ error: "bad_json" }, { status: 400, headers: noStore });
  }
  if (typeof option !== "string" || !(POLL_OPTIONS as readonly string[]).includes(option)) {
    return NextResponse.json({ error: "bad_option" }, { status: 400, headers: noStore });
  }
  try {
    const fresh = await redis.set(await voterKey(req), option, { nx: true, ex: VOTE_TTL_SECONDS });
    if (fresh === "OK") await redis.hincrby(KEY, option, 1);
    return NextResponse.json({ counts: await counts(redis), accepted: fresh === "OK" }, { headers: noStore });
  } catch {
    return NextResponse.json({ error: "poll_unavailable" }, { status: 503, headers: noStore });
  }
}
