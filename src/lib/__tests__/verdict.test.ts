import { verdictFor } from "../verdict";

const thresholds = { watch: 50.4, risk: 86.2 };

describe("verdictFor", () => {
  it("puts low scores in Safe as houses", () => {
    expect(verdictFor(0, thresholds).label).toBe("Safe as houses");
    expect(verdictFor(50.3, thresholds).key).toBe("safe");
  });
  it("treats the lower threshold as inclusive", () => {
    expect(verdictFor(50.4, thresholds).key).toBe("watch");
    expect(verdictFor(86.1, thresholds).label).toBe("Update your CV");
  });
  it("treats the upper threshold as inclusive", () => {
    expect(verdictFor(86.2, thresholds).key).toBe("risk");
    expect(verdictFor(100, thresholds).label).toBe("Robot's got your coat");
  });
  it("reads thresholds from the data rather than hard-coding them", () => {
    expect(verdictFor(60, { watch: 70, risk: 90 }).key).toBe("safe");
  });
  it("rejects non-finite scores", () => {
    expect(() => verdictFor(NaN, thresholds)).toThrow(RangeError);
  });
  it("gives every verdict a non-colour mark", () => {
    for (const s of [10, 60, 95]) expect(verdictFor(s, thresholds).mark).toMatch(/\S/);
  });
});
