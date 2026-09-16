/**
 * AXON-EVERYWHERE-PROJECT (2026-08-05): the tunnel for cloud -> Mac-mini AXON-local calls.
 * No new infra — reuses nvg_mini_jobs (Supabase queue the Mac mini already polls via
 * nvg-mini-runner.py, proven live for git relay + real generations 2026-08-05, Decision
 * #599 / Learning #3585) as an async request/response bridge to the Ollama server on the
 * mini. Same pattern already shipped in the axon, northside-intelligence, and matchfit repos.
 *
 * Requires NI_BRAIN_SUPABASE_URL / NI_BRAIN_SUPABASE_SERVICE_ROLE_KEY (project
 * kxijunwgbrlfzvgkhklo — NOT streampass's own Supabase project) to be set in this app's
 * env. Returns null when unset, on any failure, or on timeout, so callers fall through to
 * the next tier (Gemini main -> Gemini backup -> Anthropic last) without throwing.
 */

import { quoteShellArg } from "./shell-quote";

const MINI_RELAY_MODEL = "axon-ornith:latest";
const MINI_RELAY_MAX_WAIT_MS = 45_000;
const MINI_RELAY_POLL_MS = 2_500;
const MINI_RELAY_CMD_TIMEOUT_S = 40;
const OLLAMA_GENERATE_URL = "http://localhost:11434/api/generate";

function sbHeaders(supabaseKey: string) {
  return {
    apikey: supabaseKey,
    Authorization: `Bearer ${supabaseKey}`,
    "Content-Type": "application/json",
  };
}

export async function callAxonLocal(system: string, prompt: string): Promise<string | null> {
  const supabaseUrl = process.env.NI_BRAIN_SUPABASE_URL?.trim();
  const supabaseKey = process.env.NI_BRAIN_SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!supabaseUrl || !supabaseKey) return null;

  const fullPrompt = `${system}\n\nUser: ${prompt}\nAssistant:`;
  // think:false is required — axon-ornith is a thinking-capable model (qwen3.5 base) that
  // otherwise puts its entire answer in the `thinking` field and leaves `response` empty,
  // which silently looked like "AXON unreachable" and fell through to Gemini every time.
  // Found + fixed 2026-08-05 during the first live proof run (Learning #3625).
  const ollamaBody = JSON.stringify({ model: MINI_RELAY_MODEL, prompt: fullPrompt, stream: false, think: false });

  // SECURITY (2026-09-14 audit): `ollamaBody` embeds caller-supplied `system`/`prompt`
  // text (ultimately watchlist/show titles from users) with no shell-escaping. This `cmd`
  // is run on the Mac mini by nvg-mini-runner.py via a shell (this is a `kind: "shell"`
  // job) — previously it was interpolated with plain `JSON.stringify()` (which only does
  // JSON string-escaping, not shell-escaping), so a title containing shell metacharacters
  // (backticks, `$(...)`, `;`, `|`, `&`) could break out of the intended curl invocation
  // and run arbitrary commands on the mini. Every interpolated value below MUST go through
  // `quoteShellArg()` (POSIX single-quote escaping) — never reintroduce a raw template
  // interpolation of untrusted content here.
  //
  // `ollamaUrl`/`ollamaBody` are also sent as separate, non-shell payload fields so the
  // runner can be migrated to issue this HTTP request directly (no shell involved at all)
  // instead of parsing `cmd`. Escaping `cmd` closes the injection reachable from this app
  // today; it does not remove the underlying risk pattern of the runner using
  // `subprocess.run(cmd, shell=True)` in general — that only goes away once
  // nvg-mini-runner.py (separate nv-vault repo, not in scope here) stops shelling out.
  const cmd = `curl -s -m ${MINI_RELAY_CMD_TIMEOUT_S} ${quoteShellArg(OLLAMA_GENERATE_URL)} -d ${quoteShellArg(
    ollamaBody,
  )}`;

  let jobId: number | null = null;
  try {
    const insertRes = await fetch(`${supabaseUrl}/rest/v1/nvg_mini_jobs`, {
      method: "POST",
      headers: { ...sbHeaders(supabaseKey), Prefer: "return=representation" },
      body: JSON.stringify({
        kind: "shell",
        title: "streampass-axon-local-relay",
        payload: {
          cmd,
          timeout: MINI_RELAY_CMD_TIMEOUT_S + 5,
          ollamaUrl: OLLAMA_GENERATE_URL,
          ollamaBody,
        },
        status: "queued",
      }),
    });
    if (!insertRes.ok) return null;
    const rows = (await insertRes.json()) as Array<{ id?: number }> | { id?: number };
    jobId = Array.isArray(rows) ? rows[0]?.id ?? null : rows?.id ?? null;
  } catch {
    return null;
  }
  if (!jobId) return null;

  const deadline = Date.now() + MINI_RELAY_MAX_WAIT_MS;
  while (Date.now() < deadline) {
    await new Promise((resolve) => setTimeout(resolve, MINI_RELAY_POLL_MS));
    try {
      const pollRes = await fetch(
        `${supabaseUrl}/rest/v1/nvg_mini_jobs?id=eq.${jobId}&select=status,result,error`,
        { headers: { ...sbHeaders(supabaseKey), Accept: "application/json" } },
      );
      if (!pollRes.ok) continue;
      const rows = (await pollRes.json()) as Array<{ status?: string; result?: { stdout?: string } }>;
      const row = rows?.[0];
      if (!row) continue;

      if (row.status === "failed") return null;
      if (row.status !== "done") continue;

      const stdout = row.result?.stdout;
      if (!stdout) return null;
      try {
        const parsed = JSON.parse(stdout) as { response?: string };
        const text = typeof parsed.response === "string" ? parsed.response.trim() : null;
        return text || null;
      } catch {
        return null;
      }
    } catch {
      // transient poll error — keep trying until deadline
    }
  }
  return null;
}
