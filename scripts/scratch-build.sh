#!/usr/bin/env bash
# Run the CI checks against a scratch copy of the working tree, so `next build` never touches app/.next
# while the dev server is running (standing rule 4). Env files, .data, node_modules and agent memory DBs are NOT copied.
# Usage (Git Bash):  bash scripts/scratch-build.sh [--no-build]
# No paid calls: GREETHUB_MOCK_AI=1, and OpenRouter/Stripe/session secrets are unset for the run.
set -euo pipefail

REPO="$(cd "$(dirname "$0")/.." && pwd)"
DEST="${SCRATCH_DIR:-${TMPDIR:-/tmp}/greethub-scratch-build}"
BUILD=1
[ "${1:-}" = "--no-build" ] && BUILD=0

echo "[scratch] copying working tree to $DEST"
rm -rf "$DEST"
mkdir -p "$DEST"
( cd "$REPO" && tar --exclude=node_modules --exclude=.next --exclude='.env*' --exclude=.data --exclude='*.db' \
    --exclude='agentdb*' --exclude=.git --exclude=finance --exclude=.claude -cf - app pipeline brand scripts docs ) | tar -xf - -C "$DEST"

export GREETHUB_MOCK_AI=1 NEXT_TELEMETRY_DISABLED=1
unset OPENROUTER_API_KEY STRIPE_SECRET_KEY STRIPE_WEBHOOK_SECRET SESSION_SECRET SUPABASE_SERVICE_ROLE_KEY RESEND_API_KEY || true

# Install both first: pipeline's typecheck resolves zod through app/packages/shared -> app/node_modules,
# and the app's eval:ip runs pipeline's tsx.
( cd "$DEST/pipeline" && npm ci --no-audit --no-fund )
( cd "$DEST/app" && npm ci --no-audit --no-fund )
( cd "$DEST/pipeline" && npm run typecheck && npm test )
( cd "$DEST/app" && npm run lint && npm run typecheck && npm test && npm run eval:ip -- --mock )
if [ "$BUILD" = 1 ]; then
  ( cd "$DEST/app" && npm run build )
fi
echo "[scratch] all checks passed in $DEST"
