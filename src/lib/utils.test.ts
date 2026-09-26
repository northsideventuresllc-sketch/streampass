import { describe, it, expect } from "vitest";
import { cn, formatCurrency, daysSince, formatRelativeDate } from "./utils";

describe("cn", () => {
  it("merges class names and dedupes tailwind conflicts", () => {
    expect(cn("p-2", "p-4")).toBe("p-4");
  });

  it("drops falsy values", () => {
    expect(cn("a", false, null, undefined, "b")).toBe("a b");
  });
});

describe("formatCurrency", () => {
  it("formats a whole dollar amount as USD", () => {
    expect(formatCurrency(10)).toBe("$10.00");
  });

  it("formats cents correctly", () => {
    expect(formatCurrency(9.5)).toBe("$9.50");
  });

  it("formats zero", () => {
    expect(formatCurrency(0)).toBe("$0.00");
  });
});

describe("daysSince", () => {
  it("returns null for a missing date", () => {
    expect(daysSince(null)).toBeNull();
    expect(daysSince(undefined)).toBeNull();
  });

  it("returns 0 for today", () => {
    expect(daysSince(new Date().toISOString())).toBe(0);
  });

  it("returns the correct day count for a past date", () => {
    const iso = new Date(Date.now() - 5 * 86400000).toISOString();
    expect(daysSince(iso)).toBe(5);
  });
});

describe("formatRelativeDate", () => {
  it("returns Never for a missing date", () => {
    // @ts-expect-error exercising the runtime null-safety path
    expect(formatRelativeDate(null)).toBe("Never");
  });

  it("returns Today for the current date", () => {
    expect(formatRelativeDate(new Date().toISOString())).toBe("Today");
  });

  it("returns Yesterday for one day ago", () => {
    const iso = new Date(Date.now() - 1 * 86400000 - 1000).toISOString();
    expect(formatRelativeDate(iso)).toBe("Yesterday");
  });

  it("returns 'N days ago' for older dates", () => {
    const iso = new Date(Date.now() - 10 * 86400000).toISOString();
    expect(formatRelativeDate(iso)).toBe("10 days ago");
  });
});
