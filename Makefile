# macOS ships GNU Make 3.81: no .ONESHELL, so each recipe line is its own
# shell. Multi-step logic uses \ continuations.

.DEFAULT_GOAL := help
.PHONY: help check check-quiet run stop open deploy

PORT   ?= 8080
HOST   ?= 127.0.0.1
BRANCH := $(shell git rev-parse --abbrev-ref HEAD 2>/dev/null || echo unknown)
SHA    := $(shell git rev-parse --short HEAD 2>/dev/null || echo nogit)
DIRTY  := $(shell git status --porcelain 2>/dev/null | head -1)

help: ## Show this help
	@printf '\n  Lokhi — make targets\n\n'
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) \
	  | awk 'BEGIN {FS = ":.*?## "}; {printf "    %-9s %s\n", $$1, $$2}'
	@printf '\n  Branch: %s (%s)   Local: http://$(HOST):$(PORT)\n\n' '$(BRANCH)' '$(SHA)'

# ---------------------------------------------------------------------------
# check
# ---------------------------------------------------------------------------

check: ## Verify local tooling is installed and authenticated
	@fail=0; \
	printf '\n  Lokhi local setup\n\n'; \
	printf '  run    — serve the app locally\n'; \
	if command -v python3 >/dev/null 2>&1; then \
	  printf '    %-18s %s\n' 'python3' 'ok'; \
	else \
	  printf '    %-18s %s\n' 'python3' 'MISSING'; \
	  printf '    %-18s   fix: brew install python\n' ''; \
	  fail=1; \
	fi; \
	printf '\n  deploy — push a branch preview to your Vercel account\n'; \
	if command -v vercel >/dev/null 2>&1; then \
	  printf '    %-18s %s\n' 'vercel cli' 'ok'; \
	  if vercel whoami >/dev/null 2>&1; then \
	    vmail=$$(vercel whoami --json 2>/dev/null | python3 -c 'import sys,json;print(json.load(sys.stdin).get("email",""))' 2>/dev/null); \
	    gitmail=$$(git config user.email); \
	    printf '    %-18s %s (%s)\n' 'vercel auth' 'ok' "$$vmail"; \
	    if [ -n "$$vmail" ] && [ "$$vmail" != "$$gitmail" ]; then \
	      printf '    %-18s %s\n' 'identity' 'MISMATCH'; \
	      printf '    %-18s   git    %s\n' '' "$$gitmail"; \
	      printf '    %-18s   vercel %s\n' '' "$$vmail"; \
	      printf '    %-18s   Vercel attributes deploys by git author email, and\n' ''; \
	      printf '    %-18s   compares as plain text (gmail dots are not ignored).\n' ''; \
	      printf '    %-18s   deploy will ask before falling back to a\n' ''; \
	      printf '    %-18s   git-metadata-free upload.\n' ''; \
	    else \
	      printf '    %-18s %s\n' 'identity' 'git and vercel emails match'; \
	    fi; \
	  else \
	    printf '    %-18s %s\n' 'vercel auth' 'LOGGED OUT'; \
	    printf '    %-18s   fix: vercel login\n' ''; \
	    fail=1; \
	  fi; \
	else \
	  printf '    %-18s %s\n' 'vercel cli' 'MISSING'; \
	  printf '    %-18s   fix: npm install -g vercel   (or: brew install vercel)\n' ''; \
	  printf '    %-18s   then: vercel login\n' ''; \
	  fail=1; \
	fi; \
	printf '\n  pinned versions (.tool-versions)\n'; \
	while read -r tool want; do \
	  case "$$tool" in ''|\#*) continue;; esac; \
	  have=$$("$$tool" --version 2>/dev/null | grep -oE '[0-9]+\.[0-9]+\.[0-9]+' | head -1); \
	  if [ -z "$$have" ]; then \
	    printf '    %-18s %s\n' "$$tool" 'NOT INSTALLED'; \
	    printf '    %-18s   fix: brew install %s\n' '' "$$tool"; \
	    fail=1; \
	  elif [ "$${have%%.*}" != "$${want%%.*}" ]; then \
	    printf '    %-18s %s (pinned %s)  MAJOR MISMATCH\n' "$$tool" "$$have" "$$want"; \
	    printf '    %-18s   fix: brew upgrade %s   (need %s)\n' '' "$$tool" "$$want"; \
	    fail=1; \
	  else \
	    printf '    %-18s %s (pinned %s)\n' "$$tool" "$$have" "$$want"; \
	  fi; \
	done < .tool-versions; \
	printf '\n  optional — PR comments and repo access\n'; \
	if command -v gh >/dev/null 2>&1; then \
	  printf '    %-18s %s\n' 'gh cli' 'ok'; \
	  if gh auth status >/dev/null 2>&1; then \
	    printf '    %-18s %s\n' 'gh auth' 'ok'; \
	  else \
	    printf '    %-18s %s\n' 'gh auth' 'LOGGED OUT'; \
	    printf '    %-18s   fix: gh auth login\n' ''; \
	  fi; \
	else \
	  printf '    %-18s %s\n' 'gh cli' 'MISSING'; \
	  printf '    %-18s   fix: brew install gh && gh auth login\n' ''; \
	fi; \
	printf '\n'; \
	if [ $$fail -ne 0 ]; then \
	  printf '  Not ready yet — run the fix command(s) above, then "make check".\n\n'; \
	else \
	  printf '  All set.\n\n'; \
	fi

# Used by the Claude Code SessionStart hook in .claude/settings.json.
# Prints NOTHING when the setup is healthy, so a good setup costs no context.
# When something is missing, it emits the same report `make check` gives,
# which Claude then relays to the developer. No help text: internal target.
check-quiet:
	@out=$$($(MAKE) --no-print-directory check 2>&1); \
	case "$$out" in \
	  *"Not ready yet"*) \
	    printf 'Lokhi local setup is INCOMPLETE. Tell the developer now and show the\n'; \
	    printf 'fix command(s) below. Do not run the vercel or gh logins yourself:\n'; \
	    printf 'they are interactive and must be run by the developer.\n'; \
	    printf '%s\n' "$$out" ;; \
	esac

# ---------------------------------------------------------------------------
# run
# ---------------------------------------------------------------------------

run: ## Serve the app locally on port 8080 (Ctrl-C to stop)
	@command -v python3 >/dev/null 2>&1 \
	  || { printf 'python3 is missing. Run: make check\n'; exit 1; }
	@if lsof -ti tcp:$(PORT) >/dev/null 2>&1; then \
	  printf '\n  Port $(PORT) is already in use. Run "make stop" first,\n'; \
	  printf '  or pick another: make run PORT=8081\n\n'; \
	  exit 1; \
	fi
	@printf '\n  Lokhi serving on http://$(HOST):$(PORT)\n\n'
	@printf '    onboarding   http://$(HOST):$(PORT)/onboarding.html\n'
	@printf '    main app     http://$(HOST):$(PORT)/index.html\n\n'
	@printf '  Ctrl-C to stop. Service worker needs HTTP, so use these URLs\n'
	@printf '  rather than opening index.html as a file.\n\n'
	@python3 -m http.server $(PORT) --bind $(HOST)

stop: ## Stop a server left running on that port
	@pid=$$(lsof -ti tcp:$(PORT) 2>/dev/null); \
	if [ -n "$$pid" ]; then \
	  kill $$pid && printf 'Stopped pid %s on port $(PORT).\n' "$$pid"; \
	else \
	  printf 'Nothing listening on port $(PORT).\n'; \
	fi

open: ## Open the running app in your browser
	@open 'http://$(HOST):$(PORT)/index.html' 2>/dev/null \
	  || printf 'Could not open a browser. Visit http://$(HOST):$(PORT)/index.html\n'

# ---------------------------------------------------------------------------
# deploy
# ---------------------------------------------------------------------------

deploy: ## Deploy this branch as a preview to YOUR Vercel account
	@ALLOW_MAIN='$(ALLOW_MAIN)' GITLESS='$(GITLESS)' ./scripts/deploy.sh
