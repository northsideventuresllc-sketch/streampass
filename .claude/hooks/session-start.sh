#!/bin/bash
set -euo pipefail

# Only run in Claude Code on the web (remote) sessions.
if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

cd "$CLAUDE_PROJECT_DIR"

# Install dependencies. No local DB/services needed — Stream Pass uses the
# remote Northside Intelligence Brain Supabase project. CI placeholder env
# vars are sufficient for lint/build; real secrets are a separate manual step.
npm install
