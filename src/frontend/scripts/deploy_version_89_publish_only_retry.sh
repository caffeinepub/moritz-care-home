#!/usr/bin/env bash
# Version 89 Publish-Only Deployment Retry Script
# 
# ⚠️ NOTICE: This script is historical and specific to Version 89 only.
# For current production deployments, please use:
#   frontend/scripts/redeploy_production.sh
#
# This script is preserved for reference and historical purposes.
#
# Usage: ./frontend/scripts/deploy_version_89_publish_only_retry.sh

set -e          # Exit on error
set -o pipefail # Ensure piped commands fail correctly

# Configuration
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
LOG_DIR="frontend/deployment_logs"
LOG_FILE="${LOG_DIR}/deploy_v89_retry_${TIMESTAMP}.log"
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
log "Version 89 Publish-Only Deployment Retry"
log "=========================================="
log "Log file: ${LOG_FILE}"
log "Canister IDs file: ${CANISTER_IDS_FILE}"
log ""

# Step 1: Build frontend
log "Step 1: Building frontend..."
if run_command "cd frontend && npm run build"; then
    log "Frontend build completed successfully"
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

# Step 3: Extract canister IDs
log ""
log "Step 3: Extracting canister IDs..."
{
    echo "=========================================="
    echo "Deployed Canister IDs - Version 89"
    echo "Timestamp: $(date +'%Y-%m-%d %H:%M:%S')"
    echo "=========================================="
    echo ""
    
    # Extract frontend canister ID
    if dfx canister --network ic id frontend 2>/dev/null; then
        FRONTEND_ID=$(dfx canister --network ic id frontend)
        echo "Frontend Canister ID: ${FRONTEND_ID}"
        log "Frontend Canister ID: ${FRONTEND_ID}"
    else
        echo "Frontend Canister ID: [ERROR - Could not retrieve]"
        log "⚠️ Warning: Could not retrieve frontend canister ID"
    fi
    
    # Extract backend canister ID
    if dfx canister --network ic id backend 2>/dev/null; then
        BACKEND_ID=$(dfx canister --network ic id backend)
        echo "Backend Canister ID: ${BACKEND_ID}"
        log "Backend Canister ID: ${BACKEND_ID}"
    else
        echo "Backend Canister ID: [ERROR - Could not retrieve]"
        log "⚠️ Warning: Could not retrieve backend canister ID"
    fi
    
    echo ""
    echo "=========================================="
} | tee "${CANISTER_IDS_FILE}"

# Success summary
log ""
log "=========================================="
log "✅ DEPLOYMENT SUCCESSFUL"
log "=========================================="
log "Full deployment log: ${LOG_FILE}"
log "Canister IDs saved to: ${CANISTER_IDS_FILE}"
log ""
log "Next steps:"
log "1. Review the canister IDs in: ${CANISTER_IDS_FILE}"
log "2. Run post-deployment smoke tests (see frontend/SMOKE_TEST_VERSION_89.md)"
log "3. Update deployment sign-off in frontend/DEPLOYMENT_VERSION_89.md"
log ""

exit 0
