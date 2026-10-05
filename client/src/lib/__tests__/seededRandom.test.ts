import { createSeededRandom, seededRandomRows } from "../seededRandom";

describe("seededRandom", () => {
  it("produces the same sequence for the same seed", () => {
    const a = createSeededRandom(42);
    const b = createSeededRandom(42);
    const seqA = Array.from({ length: 10 }, a);
    const seqB = Array.from({ length: 10 }, b);
    expect(seqA).toEqual(seqB);
  });

  it("produces different sequences for different seeds", () => {
    expect(createSeededRandom(1)()).not.toBe(createSeededRandom(2)());
  });

  it("returns rows of values in [0, 1)", () => {
    const rows = seededRandomRows(20, 6, 7);
    expect(rows).toHaveLength(20);
    for (const row of rows) {
      expect(row).toHaveLength(6);
      for (const value of row) {
        expect(value).toBeGreaterThanOrEqual(0);
        expect(value).toBeLessThan(1);
      }
    }
    expect(new Set(rows.flat()).size).toBeGreaterThan(100);
  });
});
