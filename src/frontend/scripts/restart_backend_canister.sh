#!/usr/bin/env bash
# Backend Canister Restart Script
# This script checks the backend canister status and starts/restarts it on the IC network.
# Usage: 
#   ./frontend/scripts/restart_backend_canister.sh          # Start if stopped
#   ./frontend/scripts/restart_backend_canister.sh restart  # Force restart (stop + start)

set -euo pipefail  # Exit on error, undefined variables, and pipe failures

# Configuration
MODE="${1:-start}"  # Default to "start" mode, or "restart" if provided

# Function to log messages
log() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] $1"
}

# Function to get canister status
get_canister_status() {
    dfx canister --network ic status backend 2>&1 || true
}

# Start script
log "=========================================="
log "Backend Canister Restart Script"
log "=========================================="
log "Mode: ${MODE}"
log ""

# Check if dfx is available
if ! command -v dfx &> /dev/null; then
    log "❌ ERROR: dfx command not found"
    log "Please ensure dfx is installed and in your PATH"
    exit 1
fi

# Get current canister status
log "Checking backend canister status..."
STATUS_OUTPUT=$(get_canister_status)
log "Status output:"
echo "${STATUS_OUTPUT}"
log ""

# Determine if canister is stopped
if echo "${STATUS_OUTPUT}" | grep -q "Status: Stopped"; then
    CANISTER_STOPPED=true
    log "Backend canister is currently STOPPED"
elif echo "${STATUS_OUTPUT}" | grep -q "Status: Running"; then
    CANISTER_STOPPED=false
    log "Backend canister is currently RUNNING"
else
    log "⚠️  WARNING: Could not determine canister status"
    log "Attempting to start anyway..."
    CANISTER_STOPPED=true
fi

log ""

# Execute restart logic based on mode
if [ "${MODE}" = "restart" ]; then
    log "Restart mode: Performing stop + start cycle..."
    
    # Stop the canister
    log "Stopping backend canister..."
    if dfx canister --network ic stop backend 2>&1; then
        log "✅ Backend canister stopped successfully"
    else
        EXIT_CODE=$?
        log "❌ ERROR: Failed to stop backend canister (exit code: ${EXIT_CODE})"
        exit ${EXIT_CODE}
    fi
    
    log ""
    
    # Start the canister
    log "Starting backend canister..."
    if dfx canister --network ic start backend 2>&1; then
        log "✅ Backend canister started successfully"
    else
        EXIT_CODE=$?
        log "❌ ERROR: Failed to start backend canister (exit code: ${EXIT_CODE})"
        exit ${EXIT_CODE}
    fi
    
else
    # Default "start" mode: only start if stopped
    if [ "${CANISTER_STOPPED}" = true ]; then
        log "Starting backend canister..."
        if dfx canister --network ic start backend 2>&1; then
            log "✅ Backend canister started successfully"
        else
            EXIT_CODE=$?
            log "❌ ERROR: Failed to start backend canister (exit code: ${EXIT_CODE})"
            exit ${EXIT_CODE}
        fi
    else
        log "Backend canister is already running - no action needed"
    fi
fi

log ""

# Verify final status
log "Verifying final canister status..."
FINAL_STATUS=$(get_canister_status)
log "Final status output:"
echo "${FINAL_STATUS}"
log ""

if echo "${FINAL_STATUS}" | grep -q "Status: Running"; then
    log "=========================================="
    log "✅ SUCCESS: Backend canister is running"
    log "=========================================="
    exit 0
else
    log "=========================================="
    log "⚠️  WARNING: Backend canister may not be running"
    log "=========================================="
    log "Please check the status manually with:"
    log "  dfx canister --network ic status backend"
    exit 1
fi
