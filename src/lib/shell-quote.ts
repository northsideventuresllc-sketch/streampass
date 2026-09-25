/**
 * POSIX single-argument shell quoting.
 *
 * Wraps `value` in single quotes and escapes any embedded single quote as
 * `'\''` (close the quote, emit a literal escaped quote, reopen the quote).
 * Inside single quotes POSIX shells (sh/bash/dash/zsh) treat every other
 * character — `$`, backticks, `;`, `|`, `&`, `\`, newlines — as completely
 * literal, so this is safe for arbitrary untrusted text as a single shell
 * argument. This is the same technique Python's `shlex.quote` and Node's
 * `shell-quote` package use — do not replace it with a partial escaper that
 * only handles a subset of metacharacters.
 *
 * Only use this when a shell string genuinely cannot be avoided (e.g. a
 * command queued for a remote runner that executes via a shell). Prefer
 * passing untrusted data as structured, non-shell fields wherever possible.
 */
export function quoteShellArg(value: string): string {
  return `'${value.replace(/'/g, `'\\''`)}'`;
}
