#!/usr/bin/env bash
# Production Frontend Redeploy Script
# This script rebuilds and redeploys the current frontend to production (IC network).
# Usage: ./frontend/scripts/redeploy_production.sh

set -euo pipefail  # Exit on error, undefined variables, and pipe failures

# Configuration
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
LOG_DIR="frontend/deployment_logs"
LOG_FILE="${LOG_DIR}/deploy_${TIMESTAMP}.log"
CANISTER_IDS_FILE="${LOG_DIR}/canister_ids_${TIMESTAMP}.txt"

# Create log directory if it doesn't exist
mkdir -p "${LOG_DIR}"

# Function to log messages
log() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] $1" | tee -a "${LOG_FILE}"
}

# Function to capture command output
run_command() {
    local cmd="$1"
    log "Executing: ${cmd}"
    if eval "${cmd}" 2>&1 | tee -a "${LOG_FILE}"; then
        log "✅ Command succeeded: ${cmd}"
        return 0
    else
        local exit_code=$?
        log "❌ Command failed with exit code ${exit_code}: ${cmd}"
        return ${exit_code}
    fi
}

# Start deployment
log "=========================================="
log "Production Frontend Redeploy"
log "=========================================="
log "Log file: ${LOG_FILE}"
log "Canister IDs file: ${CANISTER_IDS_FILE}"
log ""

# Capture repository state
log "Capturing repository state..."
GIT_COMMIT=$(git rev-parse HEAD 2>/dev/null || echo "unknown")
GIT_BRANCH=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "unknown")
GIT_TAG=$(git describe --tags --exact-match 2>/dev/null || echo "")
GIT_DESCRIBE=$(git describe --always --dirty 2>/dev/null || echo "unknown")

log "Repository state:"
log "  Git commit: ${GIT_COMMIT}"
log "  Git branch: ${GIT_BRANCH}"
log "  Git tag: ${GIT_TAG:-none}"
log "  Git describe: ${GIT_DESCRIBE}"
log ""

# Step 1: Inject build metadata and build frontend
log "Step 1: Injecting build metadata and building frontend..."

# Generate build metadata
BUILD_VERSION="${TIMESTAMP}"
BUILD_TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

log "Build metadata:"
log "  VITE_BUILD_VERSION=${BUILD_VERSION}"
log "  VITE_GIT_COMMIT=${GIT_COMMIT}"
log "  VITE_BUILD_TIMESTAMP=${BUILD_TIMESTAMP}"

# Export environment variables for the build
export VITE_BUILD_VERSION="${BUILD_VERSION}"
export VITE_GIT_COMMIT="${GIT_COMMIT}"
export VITE_BUILD_TIMESTAMP="${BUILD_TIMESTAMP}"

if run_command "cd frontend && npm run build"; then
    log "Frontend build completed successfully with injected metadata"
else
    log "❌ DEPLOYMENT FAILED: Frontend build failed"
    log "Check the log file for details: ${LOG_FILE}"
    exit 1
fi

# Step 2: Deploy to IC network
log ""
log "Step 2: Deploying to Internet Computer network..."
if run_command "dfx deploy --network ic"; then
    log "Deployment to IC network completed successfully"
else
    log "❌ DEPLOYMENT FAILED: dfx deploy failed"
    log "Check the log file for details: ${LOG_FILE}"
    exit 1
fi

# Step 3: Extract and verify canister IDs
log ""
log "Step 3: Extracting and verifying canister IDs..."

FRONTEND_ID=""
BACKEND_ID=""
EXTRACTION_FAILED=false

# Extract frontend canister ID
if FRONTEND_ID=$(dfx canister --network ic id frontend 2>/dev/null); then
    log "Frontend Canister ID: ${FRONTEND_ID}"
else
    log "❌ ERROR: Could not retrieve frontend canister ID"
    EXTRACTION_FAILED=true
fi

# Extract backend canister ID
if BACKEND_ID=$(dfx canister --network ic id backend 2>/dev/null); then
    log "Backend Canister ID: ${BACKEND_ID}"
else
    log "❌ ERROR: Could not retrieve backend canister ID"
    EXTRACTION_FAILED=true
fi

# Fail if either canister ID could not be retrieved
if [ "$EXTRACTION_FAILED" = true ]; then
    log "❌ DEPLOYMENT FAILED: Could not retrieve all canister IDs"
    log "This indicates a deployment issue. Check the log file: ${LOG_FILE}"
    exit 1
fi

# Write canister IDs to file with repository state
{
    echo "=========================================="
    echo "Deployed Canister IDs"
    echo "Timestamp: $(date +'%Y-%m-%d %H:%M:%S')"
    echo "=========================================="
    echo ""
    echo "Frontend Canister ID: ${FRONTEND_ID}"
    echo "Backend Canister ID: ${BACKEND_ID}"
    echo ""
    echo "Build Metadata:"
    echo "  Version: ${BUILD_VERSION}"
    echo "  Git Commit: ${GIT_COMMIT}"
    echo "  Build Time: ${BUILD_TIMESTAMP}"
    echo ""
    echo "Repository State:"
    echo "  Git Commit (full): ${GIT_COMMIT}"
    echo "  Git Branch: ${GIT_BRANCH}"
    if [ -n "${GIT_TAG}" ]; then
        echo "  Git Tag: ${GIT_TAG}"
    fi
    echo "  Git Describe: ${GIT_DESCRIBE}"
    echo ""
    echo "Deployment Type: Standard Redeploy"
    echo ""
    echo "=========================================="
} | tee "${CANISTER_IDS_FILE}"

log "Canister IDs successfully written to: ${CANISTER_IDS_FILE}"

# Step 4: Start/restart backend canister
log ""
log "Step 4: Starting backend canister if stopped..."

# Check if restart script exists
RESTART_SCRIPT="frontend/scripts/restart_backend_canister.sh"
if [ -f "${RESTART_SCRIPT}" ]; then
    log "Executing backend canister restart script..."
    if bash "${RESTART_SCRIPT}" 2>&1 | tee -a "${LOG_FILE}"; then
        log "✅ Backend canister start/restart completed successfully"
    else
        EXIT_CODE=$?
        log "⚠️  WARNING: Backend canister start/restart failed (exit code: ${EXIT_CODE})"
        log "The deployment completed, but the backend canister may be stopped."
        log "You may need to manually start it with:"
        log "  dfx canister --network ic start backend"
        log "Or run the restart script manually:"
        log "  ./frontend/scripts/restart_backend_canister.sh"
    fi
else
    log "⚠️  WARNING: Restart script not found at ${RESTART_SCRIPT}"
    log "Attempting to start backend canister directly..."
    if dfx canister --network ic start backend 2>&1 | tee -a "${LOG_FILE}"; then
        log "✅ Backend canister started successfully"
    else
        log "⚠️  WARNING: Could not start backend canister"
        log "You may need to start it manually with:"
        log "  dfx canister --network ic start backend"
    fi
fi

# Success summary
log ""
log "=========================================="
log "✅ DEPLOYMENT SUCCESSFUL"
log "=========================================="
log "Full deployment log: ${LOG_FILE}"
log "Canister IDs saved to: ${CANISTER_IDS_FILE}"
log ""
log "Repository state used for deployment:"
log "  - Git commit: ${GIT_COMMIT}"
log "  - Git branch: ${GIT_BRANCH}"
if [ -n "${GIT_TAG}" ]; then
    log "  - Git tag: ${GIT_TAG}"
fi
log "  - Git describe: ${GIT_DESCRIBE}"
log ""
log "Build metadata injected:"
log "  - Frontend build identifier: v${BUILD_VERSION}-${GIT_COMMIT:0:7}"
log "  - Build timestamp: ${BUILD_TIMESTAMP}"
log ""
log "Next steps:"
log "1. Review the canister IDs in: ${CANISTER_IDS_FILE}"
log "2. Run post-deployment smoke tests (see frontend/DEPLOYMENT_CHECKLIST.md)"
log "3. Verify diagnostics indicator shows: v${BUILD_VERSION}-${GIT_COMMIT:0:7}"
log "4. Verify backend canister ID matches: ${BACKEND_ID}"
log "5. Verify backend canister is running with: dfx canister --network ic status backend"
log ""

exit 0
