import { describe, it, expect } from "vitest";
import { quoteShellArg } from "./shell-quote";

describe("quoteShellArg", () => {
  it("wraps a plain value in single quotes", () => {
    expect(quoteShellArg("hello")).toBe("'hello'");
  });

  it("escapes an embedded single quote safely", () => {
    expect(quoteShellArg("it's")).toBe("'it'\\''s'");
  });

  it("treats shell metacharacters as inert", () => {
    const input = "$(rm -rf /); echo `pwned` | cat & true";
    const quoted = quoteShellArg(input);
    // The whole thing must stay inside one pair of single quotes save for
    // the escaped-quote breakouts, i.e. no bare unescaped metacharacter.
    expect(quoted.startsWith("'")).toBe(true);
    expect(quoted.endsWith("'")).toBe(true);
    expect(quoted).toContain(input.replace(/'/g, ""));
  });

  it("handles an empty string", () => {
    expect(quoteShellArg("")).toBe("''");
  });

  it("handles multiple consecutive single quotes", () => {
    expect(quoteShellArg("''")).toBe("''\\'''\\'''");
  });
});
