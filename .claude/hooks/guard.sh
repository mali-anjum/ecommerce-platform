#!/usr/bin/env bash
# Project guardrails for AI agents (Claude Code hooks).
# Exit code 2 blocks the tool call and shows the reason to the agent.
# Kept dependency-light and fast: runs on every matching tool call.

set -u

mode="${1:-}"

if [ "$mode" = "session-start" ]; then
  cat <<'EOF'
[ecommerce-platform guardrails]
Before changing code: load the `ecom-preflight` skill and follow CLAUDE.md.
Before saying a task is done: load the `ecom-verify` skill and report
1) what changed 2) exact commands run + results 3) what is still unverified.
Machine has limited RAM: run jest with --runInBand and one heavy command at a time.
EOF
  exit 0
fi

input="$(cat)"

if ! command -v jq >/dev/null 2>&1; then
  # Fail open rather than blocking all work when jq is missing.
  exit 0
fi

tool="$(printf '%s' "$input" | jq -r '.tool_name // empty')"

block() {
  echo "Blocked by project guardrail (.claude/hooks/guard.sh): $1" >&2
  exit 2
}

# Matches .env, .env.local, .env.production, etc. but not .env.example.
is_secret_path() {
  local p="$1"
  case "$p" in
    *.env.example|*.env.sample) return 1 ;;
  esac
  case "$p" in
    .env|*/.env|.env.*|*/.env.*|*.pem|*.p12|*.pfx|*id_rsa*) return 0 ;;
  esac
  return 1
}

case "$tool" in
  Read|Edit|Write|MultiEdit|NotebookEdit)
    path="$(printf '%s' "$input" | jq -r '.tool_input.file_path // .tool_input.notebook_path // empty')"
    if [ -n "$path" ] && is_secret_path "$path"; then
      block "secret file '$path' must not be read or edited by the agent. Use .env.example to document variables; the user edits real env files."
    fi
    ;;
  Bash)
    cmd="$(printf '%s' "$input" | jq -r '.tool_input.command // empty')"

    # Destructive database operations.
    if printf '%s' "$cmd" | grep -qE 'prisma[[:space:]]+migrate[[:space:]]+reset|prisma:migrate:reset|--force-reset|--accept-data-loss|DROP[[:space:]]+(TABLE|DATABASE|SCHEMA)'; then
      block "destructive database command. Ask the user to run it themselves if it is really intended."
    fi

    # Destructive git operations.
    if printf '%s' "$cmd" | grep -qE 'git[[:space:]]+push[^|;&]*([[:space:]]-f([[:space:]]|$)|--force)|git[[:space:]]+reset[[:space:]]+--hard|git[[:space:]]+clean[[:space:]]+-[a-zA-Z]*f|git[[:space:]]+checkout[[:space:]]+--[[:space:]]+\.|git[[:space:]]+branch[[:space:]]+-D'; then
      block "history-rewriting or work-discarding git command. Ask the user first."
    fi

    # Staging secret files.
    if printf '%s' "$cmd" | grep -qE 'git[[:space:]]+add[^|;&]*\.env' && ! printf '%s' "$cmd" | grep -qE 'git[[:space:]]+add[^|;&]*\.env\.example'; then
      block "staging an env file. Only .env.example may be committed."
    fi

    # Printing secret files into the transcript.
    if printf '%s' "$cmd" | grep -qE '(cat|less|more|head|tail|bat|strings|xxd)[[:space:]][^|;&]*\.env([[:space:]]|$|\.(local|production|development|test))'; then
      block "printing an env file would expose secrets. Check variable names in .env.example or server/src/config instead."
    fi

    # Memory safety: the dev machine has ~7.5 GB RAM and freezes under parallel Jest workers
    # or an uncapped Next.js build.
    if printf '%s' "$cmd" | grep -qE '(^|[;&|(][[:space:]]*|npx[[:space:]]+|[[:space:]]node_modules/\.bin/)jest([[:space:]]|$)|npm[[:space:]]+(run[[:space:]]+)?test([[:space:]]|$)' \
      && ! printf '%s' "$cmd" | grep -qE -- '--runInBand|(^|[[:space:]])-i([[:space:]]|$)|--maxWorkers'; then
      block "run Jest memory-safe: add --runInBand (e.g. 'npx jest --runInBand' or 'npm test -- --runInBand')."
    fi
    cwd="$(printf '%s' "$input" | jq -r '.cwd // empty')"
    if printf '%s' "$cmd" | grep -qE 'next[[:space:]]+build|npm[[:space:]]+run[[:space:]]+build' \
      && { printf '%s' "$cmd" | grep -qE 'client|next[[:space:]]+build' || [[ "$cwd" == */client* ]]; } \
      && ! printf '%s' "$cmd" | grep -q 'max-old-space-size'; then
      block "cap Next.js build memory: prefix with NODE_OPTIONS=--max-old-space-size=3072."
    fi

    # Wiping the filesystem.
    if printf '%s' "$cmd" | grep -qE 'rm[[:space:]]+-[a-zA-Z]*r[a-zA-Z]*f?[[:space:]]+(/|~|\$HOME|\.)([[:space:]]|$)'; then
      block "recursive delete of a root, home, or the whole working directory."
    fi
    ;;
esac

exit 0
