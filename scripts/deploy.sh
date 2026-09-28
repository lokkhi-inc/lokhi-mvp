#!/usr/bin/env bash
# Deploy the working tree to Vercel as a branch preview. Called by `make deploy`.
#
# Vercel attaches the HEAD commit author to a CLI deploy and BLOCKS the build
# when that author has no permission on the project — being logged in as
# yourself is not enough. Two paths:
#
#   author matches your Vercel account -> deploy normally, git metadata intact
#   it does not match                  -> offer a deploy with git metadata
#                                         stripped, which removes the author
#                                         and so skips the check
set -euo pipefail

BRANCH=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo unknown)
SHA=$(git rev-parse --short HEAD 2>/dev/null || echo nogit)
AUTHOR=$(git log -1 --format=%ae 2>/dev/null || echo "")
GITLESS=${GITLESS:-}
ALLOW_MAIN=${ALLOW_MAIN:-}

command -v vercel >/dev/null 2>&1 || {
  printf '\n  vercel CLI is missing. Run: make check\n\n'; exit 1; }
vercel whoami >/dev/null 2>&1 || {
  printf '\n  Not logged in to Vercel. Run: vercel login\n\n'; exit 1; }

if [ "$BRANCH" = main ] && [ -z "$ALLOW_MAIN" ]; then
  printf '\n  Refusing to deploy from main. Previews are for branches.\n'
  printf '  Override: make deploy ALLOW_MAIN=1\n\n'
  exit 1
fi

VMAIL=$(vercel whoami --json 2>/dev/null \
  | python3 -c 'import sys,json;print(json.load(sys.stdin).get("email",""))' 2>/dev/null || echo "")

# One stable URL per branch. Deployments are immutable, so the alias is what
# moves; the deployment it used to point at is reaped below if it was healthy.
SLUG=$(printf '%s' "$BRANCH" | tr '[:upper:]' '[:lower:]' \
  | sed 's/[^a-z0-9]/-/g; s/--*/-/g; s/^-//; s/-$//')
ALIAS="lokkhi-$SLUG.vercel.app"

# Never let a branch alias collide with a production domain.
case "$ALIAS" in
  lokkhi-mvp.vercel.app|lokkhi-mvp-lokkhi.vercel.app|lokkhi-.vercel.app)
    printf '\n  Refusing: branch %s derives alias %s, which collides with a\n' "$BRANCH" "$ALIAS"
    printf '  production domain. Rename the branch.\n\n'
    exit 1 ;;
esac

mode=git
if [ "$AUTHOR" != "$VMAIL" ]; then
  if [ -n "$GITLESS" ]; then
    mode=gitless
  elif { [ -t 0 ] || [ -t 1 ]; } && (exec 3</dev/tty) 2>/dev/null; then
    printf '\n  The HEAD commit author does not match your Vercel account:\n\n'
    printf '    HEAD commit   %s\n' "$AUTHOR"
    printf '    vercel        %s\n\n' "$VMAIL"
    printf '  Vercel will likely BLOCK this deploy ("commit author does not have\n'
    printf '  permission"). Deploying without git metadata removes the author and\n'
    printf '  avoids the check. You lose branch association in the Vercel\n'
    printf '  dashboard; branch and sha are still attached as plain labels.\n\n'
    printf '  Deploy without git metadata? [y/N] '
    read -r ans </dev/tty || ans=n
    case "$ans" in
      [yY]*) mode=gitless ;;
      *) printf '\n  Aborted.\n\n'; exit 1 ;;
    esac
  else
    printf '\n  The HEAD commit author (%s) does not match your Vercel\n' "$AUTHOR"
    printf '  account (%s), so Vercel will likely block this deploy.\n\n' "$VMAIL"
    printf '  Re-run and confirm: make deploy GITLESS=1\n\n'
    exit 1
  fi
fi

dir=.
stage=""
if [ "$mode" = gitless ]; then
  stage=$(mktemp -d)
  trap 'rm -rf "$stage"' EXIT
  rsync -a --exclude .git --exclude .vercel --exclude node_modules ./ "$stage"/
  if [ -f .vercel/project.json ]; then
    mkdir -p "$stage/.vercel"
    cp .vercel/project.json "$stage/.vercel/project.json"
  fi
  dir="$stage"
fi

printf '\n  Deploying %s (%s) as %s [%s]\n' "$BRANCH" "$SHA" "$VMAIL" "$mode"
[ -n "$(git status --porcelain 2>/dev/null | head -1)" ] &&
  printf '  Working tree has uncommitted changes — deploying them as-is.\n'
printf '\n'

# --no-wait: a BLOCKED build never goes ready, and without this the CLI hangs
# on it indefinitely. Poll for the real state instead.
out=$(cd "$dir" && vercel deploy --yes --json --no-wait \
  --meta branch="$BRANCH" --meta sha="$SHA")

read -r id url <<EOF
$(printf '%s' "$out" | python3 -c 'import sys,json;d=json.load(sys.stdin).get("deployment",{});print(d.get("id",""),d.get("url",""))')
EOF

if [ -z "$url" ]; then
  printf '  Deploy returned no URL:\n\n%s\n\n' "$out"; exit 1
fi

state=""
for _ in $(seq 1 40); do
  state=$(vercel api "/v13/deployments/$id" 2>/dev/null \
    | python3 -c 'import sys,json;print(json.load(sys.stdin).get("readyState",""))' 2>/dev/null || echo "")
  case "$state" in READY|BLOCKED|ERROR|CANCELED) break ;; esac
  sleep 3
done

case "$state" in
  READY)
    # What the alias points at right now, before we move it.
    prev=$(vercel api "/v4/aliases/$ALIAS" 2>/dev/null \
      | python3 -c 'import sys,json;print((json.load(sys.stdin).get("deployment") or {}).get("url") or "")' \
      2>/dev/null || echo "")

    if vercel alias set "${url#https://}" "$ALIAS" >/dev/null 2>&1; then
      printf '%s\n' "https://$ALIAS" > .vercel-preview-url
      printf '  Preview:    https://%s\n' "$ALIAS"
      printf '  Deployment: %s\n' "$url"
    else
      printf '%s\n' "$url" > .vercel-preview-url
      printf '  Preview: %s\n' "$url"
      printf '  (could not assign alias %s — name may be taken)\n' "$ALIAS"
      prev=""
    fi

    # Reap the deployment this alias just stopped pointing at, but only if it
    # succeeded. BLOCKED and ERROR builds are kept so they can be inspected.
    if [ -n "$prev" ] && [ "$prev" != "${url#https://}" ]; then
      pstate=$(vercel api "/v13/deployments/$prev" 2>/dev/null \
        | python3 -c 'import sys,json;print(json.load(sys.stdin).get("readyState",""))' 2>/dev/null || echo "")
      if [ "$pstate" = READY ]; then
        vercel remove "$prev" --yes >/dev/null 2>&1 \
          && printf '  Reaped:     %s\n' "$prev" \
          || printf '  (could not remove superseded %s)\n' "$prev"
      else
        printf '  Kept %s (%s) for debugging.\n' "$prev" "${pstate:-unknown}"
      fi
    fi
    printf '\n'
    ;;
  BLOCKED)
    printf '  BLOCKED by Vercel: the commit author does not have permission\n'
    printf '  to create deployments for this project.\n\n'
    printf '  Retry without git metadata: make deploy GITLESS=1\n\n'
    exit 1
    ;;
  *)
    printf '  Deployment ended in state %s: %s\n\n' "${state:-unknown}" "$url"
    exit 1
    ;;
esac
