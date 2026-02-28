#!/usr/bin/env bash
# Production frontend redeploy script
# Usage: bash frontend/scripts/redeploy_production.sh
# Run from the repository root.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
FRONTEND_DIR="$REPO_ROOT/frontend"
DEPLOY_LOGS_DIR="$FRONTEND_DIR/deployment_logs"
TIMESTAMP="$(date +%Y%m%d_%H%M%S)"
LOG_FILE="$DEPLOY_LOGS_DIR/deploy_${TIMESTAMP}.log"

mkdir -p "$DEPLOY_LOGS_DIR"

echo "=== Production Redeploy: $TIMESTAMP ===" | tee "$LOG_FILE"
echo "Repo root: $REPO_ROOT" | tee -a "$LOG_FILE"

# ── Step 1: Extract canister ID BEFORE building ──────────────────────────────
echo "" | tee -a "$LOG_FILE"
echo "── Step 1: Extracting backend canister ID ──" | tee -a "$LOG_FILE"

CANISTER_IDS_FILE="$REPO_ROOT/canister_ids.json"
BACKEND_CANISTER_ID=""

if [ -f "$CANISTER_IDS_FILE" ]; then
  # Try to extract from canister_ids.json (ic network)
  BACKEND_CANISTER_ID=$(python3 -c "
import json, sys
try:
    data = json.load(open('$CANISTER_IDS_FILE'))
    cid = data.get('backend', {}).get('ic', '') or data.get('backend', {}).get('production', '')
    print(cid)
except Exception as e:
    print('')
" 2>/dev/null || echo "")
fi

# Fallback: try dfx canister id
if [ -z "$BACKEND_CANISTER_ID" ]; then
  echo "canister_ids.json not found or missing ic entry, trying dfx..." | tee -a "$LOG_FILE"
  BACKEND_CANISTER_ID=$(cd "$REPO_ROOT" && dfx canister id backend --network ic 2>/dev/null || echo "")
fi

if [ -z "$BACKEND_CANISTER_ID" ]; then
  echo "WARNING: Could not determine backend canister ID. Frontend will show 'Not configured'." | tee -a "$LOG_FILE"
else
  echo "Backend canister ID: $BACKEND_CANISTER_ID" | tee -a "$LOG_FILE"
fi

# ── Step 2: Write .env file for Vite build ────────────────────────────────────
echo "" | tee -a "$LOG_FILE"
echo "── Step 2: Writing frontend/.env ──" | tee -a "$LOG_FILE"

ENV_FILE="$FRONTEND_DIR/.env"
{
  echo "VITE_CANISTER_ID_BACKEND=$BACKEND_CANISTER_ID"
  echo "VITE_HOST=https://ic0.app"
} > "$ENV_FILE"
echo "Wrote $ENV_FILE" | tee -a "$LOG_FILE"
cat "$ENV_FILE" | tee -a "$LOG_FILE"

# ── Step 3: Capture repository state ─────────────────────────────────────────
echo "" | tee -a "$LOG_FILE"
echo "── Step 3: Repository state ──" | tee -a "$LOG_FILE"
GIT_COMMIT=$(git -C "$REPO_ROOT" rev-parse --short HEAD 2>/dev/null || echo "unknown")
GIT_BRANCH=$(git -C "$REPO_ROOT" rev-parse --abbrev-ref HEAD 2>/dev/null || echo "unknown")
echo "Git commit: $GIT_COMMIT" | tee -a "$LOG_FILE"
echo "Git branch: $GIT_BRANCH" | tee -a "$LOG_FILE"

# ── Step 4: Inject build metadata ────────────────────────────────────────────
echo "" | tee -a "$LOG_FILE"
echo "── Step 4: Injecting build metadata ──" | tee -a "$LOG_FILE"
BUILD_ID="${TIMESTAMP}_${GIT_COMMIT}"
BUILD_TIME="$(date -u +%Y-%m-%dT%H:%M:%SZ)"

# Append build metadata to .env
{
  echo "VITE_BUILD_ID=$BUILD_ID"
  echo "VITE_BUILD_TIME=$BUILD_TIME"
  echo "VITE_GIT_COMMIT=$GIT_COMMIT"
} >> "$ENV_FILE"
echo "Build metadata injected." | tee -a "$LOG_FILE"

# ── Step 5: Build frontend ────────────────────────────────────────────────────
echo "" | tee -a "$LOG_FILE"
echo "── Step 5: Building frontend ──" | tee -a "$LOG_FILE"
cd "$FRONTEND_DIR"
pnpm run build 2>&1 | tee -a "$LOG_FILE"
echo "Frontend build complete." | tee -a "$LOG_FILE"

# ── Step 6: Deploy to IC ──────────────────────────────────────────────────────
echo "" | tee -a "$LOG_FILE"
echo "── Step 6: Deploying frontend canister to IC ──" | tee -a "$LOG_FILE"
cd "$REPO_ROOT"
dfx deploy frontend --network ic --no-wallet 2>&1 | tee -a "$LOG_FILE"
echo "Frontend deployed." | tee -a "$LOG_FILE"

# ── Step 7: Write canister ID summary ────────────────────────────────────────
echo "" | tee -a "$LOG_FILE"
echo "── Step 7: Writing canister ID summary ──" | tee -a "$LOG_FILE"
SUMMARY_FILE="$DEPLOY_LOGS_DIR/canister_ids_${TIMESTAMP}.txt"
{
  echo "Deploy timestamp: $TIMESTAMP"
  echo "Git commit: $GIT_COMMIT"
  echo "Git branch: $GIT_BRANCH"
  echo "Backend canister ID: $BACKEND_CANISTER_ID"
  echo "Clean Rebuild: No"
} > "$SUMMARY_FILE"
echo "Summary written to $SUMMARY_FILE" | tee -a "$LOG_FILE"

# ── Step 8: Restart backend canister ─────────────────────────────────────────
echo "" | tee -a "$LOG_FILE"
echo "── Step 8: Restarting backend canister ──" | tee -a "$LOG_FILE"
if [ -f "$SCRIPT_DIR/restart_backend_canister.sh" ]; then
  bash "$SCRIPT_DIR/restart_backend_canister.sh" 2>&1 | tee -a "$LOG_FILE" || true
else
  echo "restart_backend_canister.sh not found, skipping." | tee -a "$LOG_FILE"
fi

echo "" | tee -a "$LOG_FILE"
echo "=== Redeploy complete: $TIMESTAMP ===" | tee -a "$LOG_FILE"
echo "Log: $LOG_FILE"
echo "Backend canister ID: $BACKEND_CANISTER_ID"
