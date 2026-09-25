import { describe, it, expect, vi } from "vitest";
import { checkRateLimit, getClientIp } from "./rate-limit";

describe("checkRateLimit", () => {
  it("allows the first request under the limit", () => {
    const result = checkRateLimit("key-a-" + Math.random(), 3, 60000);
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(2);
  });

  it("blocks once the limit is reached within the window", () => {
    const key = "key-b-" + Math.random();
    checkRateLimit(key, 2, 60000);
    checkRateLimit(key, 2, 60000);
    const third = checkRateLimit(key, 2, 60000);
    expect(third.allowed).toBe(false);
    expect(third.remaining).toBe(0);
    expect(third.retryAfterMs).toBeGreaterThan(0);
  });

  it("resets after the window elapses", () => {
    vi.useFakeTimers();
    try {
      const key = "key-c-" + Math.random();
      checkRateLimit(key, 1, 1000);
      const blocked = checkRateLimit(key, 1, 1000);
      expect(blocked.allowed).toBe(false);
      vi.advanceTimersByTime(1001);
      const afterReset = checkRateLimit(key, 1, 1000);
      expect(afterReset.allowed).toBe(true);
    } finally {
      vi.useRealTimers();
    }
  });

  it("tracks separate keys independently", () => {
    const keyX = "key-x-" + Math.random();
    const keyY = "key-y-" + Math.random();
    checkRateLimit(keyX, 1, 60000);
    const yResult = checkRateLimit(keyY, 1, 60000);
    expect(yResult.allowed).toBe(true);
  });
});

describe("getClientIp", () => {
  it("returns the last entry in x-forwarded-for (the trusted hop)", () => {
    const req = new Request("https://example.com", {
      headers: { "x-forwarded-for": "attacker-spoofed, 10.0.0.1, 203.0.113.5" },
    });
    expect(getClientIp(req)).toBe("203.0.113.5");
  });

  it("falls back to x-real-ip when x-forwarded-for is absent", () => {
    const req = new Request("https://example.com", {
      headers: { "x-real-ip": "198.51.100.9" },
    });
    expect(getClientIp(req)).toBe("198.51.100.9");
  });

  it("returns unknown when no IP headers are present", () => {
    const req = new Request("https://example.com");
    expect(getClientIp(req)).toBe("unknown");
  });

  it("handles a single-entry x-forwarded-for", () => {
    const req = new Request("https://example.com", {
      headers: { "x-forwarded-for": "203.0.113.7" },
    });
    expect(getClientIp(req)).toBe("203.0.113.7");
  });
});
