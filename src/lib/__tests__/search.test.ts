import { buildIndex, editDistance, isNotAJob, normalise, search } from "../search";
import type { Searchable } from "../search";

const items: Searchable[] = [
  { soc: "5313", title: "Bricklayers", aliases: ["brickie", "bricklayer", "Block setter"], priorityAliases: ["bricklayer"], employment: 50000 },
  { soc: "2237", title: "Other registered nursing professionals", aliases: ["nurse", "staff nurse", "Ward manager", "RGN"], priorityAliases: ["nurse"], employment: 334000 },
  { soc: "6133", title: "Dental nurses", aliases: ["Dental nurse"], priorityAliases: [], employment: 40000 },
  { soc: "6131", title: "Nursing auxiliaries and assistants", aliases: ["Healthcare assistant", "Nursing assistant"], priorityAliases: [], employment: 337000 },
  { soc: "4123", title: "Bank and post office clerks", aliases: ["bank clerk", "bank teller", "Cashier (banking)"], priorityAliases: ["bank clerk"], employment: 66000 },
  { soc: "5241", title: "Electricians and electrical fitters", aliases: ["sparky", "electrician"], priorityAliases: ["electrician"], employment: 194000 },
  { soc: "2134", title: "Programmers and software development professionals", aliases: ["developer", "software engineer", "coder"], priorityAliases: ["developer"], employment: 543000 },
  { soc: "2314", title: "Nursery education teaching professionals", aliases: ["Nursery teacher"], priorityAliases: [], employment: 60000 },
];
const index = buildIndex(items);
const top = (q: string) => search(index, q)[0]?.item.soc;

describe("normalise", () => {
  it("lower-cases, strips punctuation and accents", () => {
    expect(normalise("  Café & Bar-staff! ")).toBe("cafe and bar staff");
  });
});

describe("editDistance", () => {
  it("counts substitutions, insertions and transpositions", () => {
    expect(editDistance("nurse", "nurse")).toBe(0);
    expect(editDistance("nusre", "nurse")).toBe(1);
    expect(editDistance("nurs", "nurse")).toBe(1);
    expect(editDistance("plumer", "plumber")).toBe(1);
  });
  it("bails out early beyond the cap", () => {
    expect(editDistance("abcdef", "xyz", 2)).toBeGreaterThan(2);
  });
});

describe("search", () => {
  it("finds a job through slang", () => {
    expect(top("brickie")).toBe("5313");
    expect(top("sparky")).toBe("5241");
  });
  it("puts the priority alias first when several jobs share a word", () => {
    expect(top("nurse")).toBe("2237");
    expect(search(index, "nurse").map((h) => h.item.soc)).toContain("6133");
  });
  it("ranks a whole-word match above a longer word that merely starts with the query", () => {
    const socs = search(index, "nurse").map((h) => h.item.soc);
    expect(socs.indexOf("6133")).toBeLessThan(socs.indexOf("2314"));
  });
  it("knows when the reader typed a situation rather than a job", () => {
    expect(isNotAJob("student")).toBe(true);
    expect(isNotAJob("stay at home mum")).toBe(true);
    expect(isNotAJob("nurse")).toBe(false);
  });
  it("matches a prefix while typing", () => {
    expect(top("bank cl")).toBe("4123");
    expect(top("electr")).toBe("5241");
  });
  it("matches words inside a long title", () => {
    expect(top("software")).toBe("2134");
  });
  it("forgives a typo", () => {
    expect(top("nusre")).toBe("2237");
    expect(top("bricklayr")).toBe("5313");
  });
  it("reports what it matched on", () => {
    expect(search(index, "brickie")[0].via).toBe("brickie");
  });
  it("returns nothing for one character or junk", () => {
    expect(search(index, "n")).toEqual([]);
    expect(search(index, "zzzzqqq")).toEqual([]);
  });
  it("respects the limit", () => {
    expect(search(index, "nurs", 2)).toHaveLength(2);
  });
});
