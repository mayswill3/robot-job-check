import { rankContext, topList } from "../ranking";
import type { SlimOccupation } from "../types";

const mk = (soc: string, score: number, rank: number, employment = 1000): SlimOccupation => ({
  soc, title: `Job ${soc}`, score, rank, verdict: "watch", employment,
});
const all = [mk("a", 100, 1), mk("b", 80, 2, 5000), mk("c", 60, 3), mk("d", 40, 4), mk("e", 20, 5), mk("f", 0, 6)];

describe("rankContext", () => {
  it("counts how many jobs sit below", () => {
    const ctx = rankContext(all[2], all);
    expect(ctx.rank).toBe(3);
    expect(ctx.total).toBe(6);
    expect(ctx.moreExposedThanPct).toBe(60); // 3 of the other 5
  });
  it("weights the worker share by employment", () => {
    const ctx = rankContext(all[1], all); // below: c,d,e,f = 4000 of 10000
    expect(ctx.moreExposedThanWorkersPct).toBe(40);
  });
});

describe("topList", () => {
  it("returns the n most exposed in order", () => {
    expect(topList(all, "risk", 3).map((r) => r.occ.soc)).toEqual(["a", "b", "c"]);
  });
  it("returns the n safest in order", () => {
    expect(topList(all, "safe", 2).map((r) => r.occ.soc)).toEqual(["f", "e"]);
  });
  it("flags the reader's job when it is inside the list", () => {
    const rows = topList(all, "risk", 3, "b");
    expect(rows).toHaveLength(3);
    expect(rows[1].isReader).toBe(true);
    expect(rows[1].inserted).toBe(false);
  });
  it("appends the reader's job at its true position when outside the list", () => {
    const rows = topList(all, "risk", 3, "e");
    expect(rows).toHaveLength(4);
    expect(rows[3]).toMatchObject({ isReader: true, inserted: true, position: 5 });
  });
  it("positions from the safest end in safe mode", () => {
    const rows = topList(all, "safe", 2, "a");
    expect(rows[2]).toMatchObject({ isReader: true, inserted: true, position: 6 });
  });
});
