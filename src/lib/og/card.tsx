import { readFile } from "node:fs/promises";
import path from "node:path";
import { ImageResponse } from "next/og";
import type { VerdictKey } from "@/lib/types";

export const CARD_SIZE = { width: 1200, height: 630 };
export const CARD_TYPE = "image/png";

const COLOUR: Record<VerdictKey, { bg: string; fg: string }> = {
  safe: { bg: "#1e8e4e", fg: "#ffffff" },
  watch: { bg: "#f0b400", fg: "#111111" },
  risk: { bg: "#d6001c", fg: "#ffffff" },
};

export interface CardJob {
  label: string;
  score: number;
  verdictKey: VerdictKey;
  verdictLabel: string;
  moreExposedThanPct: number;
  people: string;
}

// Every card is rendered at build time (static params), so the font is read from disk.
async function oswald(): Promise<ArrayBuffer> {
  let buf: Buffer;
  try {
    buf = await readFile(new URL("./Oswald-Bold.ttf", import.meta.url));
  } catch {
    buf = await readFile(path.join(process.cwd(), "src/lib/og/Oswald-Bold.ttf"));
  }
  return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength) as ArrayBuffer;
}

/**
 * The 1200x630 share card: the generic one for the bare link, or the reader's own
 * result when the link carries a job. Same red, black and Oswald as the page.
 */
export async function shareCard(job?: CardJob) {
  const font = await oswald();
  const c = job ? COLOUR[job.verdictKey] : null;
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          background: "#ffffff",
          color: "#111111",
          fontFamily: "Oswald",
          padding: "44px 64px 40px",
          borderTop: "28px solid #d6001c",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <div style={{ display: "flex", background: "#d6001c", color: "#fff", fontSize: 26, letterSpacing: 2, padding: "6px 14px" }}>
            {job ? "MY RESULT" : "DATA INVESTIGATION"}
          </div>
          {job ? <div style={{ display: "flex", fontSize: 30, color: "#5a5a5a" }}>WILL A ROBOT TAKE YOUR JOB?</div> : null}
        </div>

        {job ? (
          <div style={{ display: "flex", flexDirection: "column", flex: 1, justifyContent: "center" }}>
            <div style={{ display: "flex", flexWrap: "wrap", fontSize: 38, lineHeight: 1.15, color: "#5a5a5a", textTransform: "uppercase", letterSpacing: 1, maxWidth: 1072 }}>
              <span style={{ marginRight: 12 }}>Your job:</span>
              <span style={{ color: "#111" }}>{job.label}</span>
            </div>
            <div style={{ display: "flex", alignItems: "flex-end", gap: 28, marginTop: 8 }}>
              <div style={{ display: "flex", fontSize: 200, lineHeight: 0.9, color: "#d6001c" }}>{String(Math.round(job.score))}</div>
              <div style={{ display: "flex", flexDirection: "column", paddingBottom: 18, maxWidth: 800 }}>
                <div style={{ display: "flex", fontSize: 34, color: "#5a5a5a", letterSpacing: 2 }}>OUT OF 100</div>
                <div
                  style={{
                    display: "flex",
                    background: c!.bg,
                    color: c!.fg,
                    fontSize: 56,
                    lineHeight: 1,
                    padding: "10px 20px 6px",
                    marginTop: 8,
                    textTransform: "uppercase",
                  }}
                >
                  {job.verdictLabel}
                </div>
              </div>
            </div>
            <div style={{ display: "flex", fontSize: 32, marginTop: 20, color: "#111" }}>
              {`More exposed than ${job.moreExposedThanPct}% of UK jobs · ${job.people} people do it`}
            </div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", flex: 1, justifyContent: "center" }}>
            <div style={{ display: "flex", fontSize: 150, lineHeight: 1, letterSpacing: -2, textTransform: "uppercase" }}>
              Will a robot
            </div>
            <div style={{ display: "flex", fontSize: 150, lineHeight: 1, letterSpacing: -2, textTransform: "uppercase" }}>
              <span>take&nbsp;</span>
              <span style={{ color: "#d6001c" }}>your</span>
              <span>&nbsp;job?</span>
            </div>
            <div style={{ display: "flex", fontSize: 34, marginTop: 16, color: "#5a5a5a" }}>
              Barclays is cutting 5,000 jobs. Check yours against 408 UK occupations.
            </div>
          </div>
        )}

        <div style={{ display: "flex", justifyContent: "space-between", borderTop: "6px solid #111", paddingTop: 16, fontSize: 28, color: "#5a5a5a", letterSpacing: 1 }}>
          <div style={{ display: "flex" }}>{job ? "CHECK YOUR OWN JOB" : "TYPE YOUR JOB. SLANG WORKS."}</div>
          <div style={{ display: "flex" }}>robot-job-check.vercel.app</div>
        </div>
      </div>
    ),
    { ...CARD_SIZE, fonts: [{ name: "Oswald", data: font, weight: 700, style: "normal" }] },
  );
}
