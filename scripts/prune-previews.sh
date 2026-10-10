#!/usr/bin/env bash
# List preview deployments whose branch no longer exists on origin — typically
# left behind when a PR merges — and delete them after explicit confirmation.
#
#   scripts/prune-previews.sh            list what is stranded (default, safe)
#   scripts/prune-previews.sh --delete   list, then ask before deleting
#
# Listing is the default on purpose: the bare command is the one people guess,
# so it must be the harmless one. Deleting is irreversible and opt-in.
#
# Production deployments are never touched: one of them is live and the others
# are Vercel's instant-rollback targets. Deleting those is a separate, manual
# decision.
set -euo pipefail

cd "$(dirname "$0")/.."
DO_DELETE=${1:-}

# Runs locally against your `vercel login`, and in CI against a token with an
# npx-resolved binary. VERCEL_BIN/VERCEL_TOKEN/VERCEL_PROJECT_ID cover the
# CI case; everything falls back to the local setup when they are unset.
VERCEL_BIN=${VERCEL_BIN:-vercel}
vc() {
  if [ -n "${VERCEL_TOKEN:-}" ]; then $VERCEL_BIN "$@" --token="$VERCEL_TOKEN"
  else $VERCEL_BIN "$@"
  fi
}

if [ -z "${VERCEL_TOKEN:-}" ]; then
  command -v vercel >/dev/null 2>&1 || { printf '\n  vercel CLI is missing. Run: make check\n\n'; exit 1; }
  vercel whoami >/dev/null 2>&1   || { printf '\n  Not logged in to Vercel. Run: vercel login\n\n'; exit 1; }
fi

PID=${VERCEL_PROJECT_ID:-$(python3 -c 'import json;print(json.load(open(".vercel/project.json"))["projectId"])' 2>/dev/null || echo "")}
[ -n "$PID" ] || { printf '\n  No project id: set VERCEL_PROJECT_ID or run a deploy first.\n\n'; exit 1; }

git fetch --prune --quiet origin 2>/dev/null || true
LIVE=$(git ls-remote --heads origin 2>/dev/null | awk '{print $2}' | sed 's#refs/heads/##' | tr '\n' ' ')
[ -n "$LIVE" ] || { printf '\n  Could not list remote branches; refusing to guess what is stale.\n\n'; exit 1; }

CANDIDATES=$(vc api "/v6/deployments?projectId=$PID&limit=100" 2>/dev/null | LIVE="$LIVE" python3 -c '
import sys, json, os, time
live = set(os.environ["LIVE"].split())
for d in json.load(sys.stdin).get("deployments", []):
    if (d.get("target") or "preview") == "production":
        continue
    m = d.get("meta") or {}
    br = m.get("branch") or m.get("githubCommitRef") or ""
    if br and br in live:
        continue
    age = int((time.time() * 1000 - d.get("created", 0)) / 86400000)
    print("%s\t%s\t%s\t%sd" % (d.get("url"), d.get("state"), br or "(no branch)", age))
')

if [ -z "$CANDIDATES" ]; then
  printf '\n  No dangling previews. Nothing to clean up.\n\n'
  exit 0
fi

COUNT=$(printf '%s\n' "$CANDIDATES" | wc -l | tr -d ' ')
printf '\n  %s dangling preview deployment(s) — branch no longer on origin:\n\n' "$COUNT"
printf '%s\n' "$CANDIDATES" | while IFS=$'\t' read -r url state br age; do
  printf '    %-10s %-24s %-5s %s\n' "$state" "$br" "$age" "$url"
done
printf '\n'

if [ "$DO_DELETE" != "--delete" ]; then
  printf '  Run `make prune DELETE=1` to review and remove these.\n\n'
  exit 0
fi

if ! { [ -t 0 ] || [ -t 1 ]; } || ! (exec 3</dev/tty) 2>/dev/null; then
  printf '  Not an interactive terminal, so nothing was deleted.\n'
  printf '  Run `make prune` yourself to confirm and remove them.\n\n'
  exit 0
fi

printf '  Delete all %s? This cannot be undone. [y/N] ' "$COUNT"
read -r ans </dev/tty || ans=n
case "$ans" in
  [yY]*) ;;
  *) printf '\n  Nothing deleted.\n\n'; exit 0 ;;
esac

printf '\n'
printf '%s\n' "$CANDIDATES" | while IFS=$'\t' read -r url state br age; do
  if vc remove "$url" --yes >/dev/null 2>&1; then
    printf '    removed  %s\n' "$url"
  else
    printf '    FAILED   %s\n' "$url"
  fi
done
printf '\n'
