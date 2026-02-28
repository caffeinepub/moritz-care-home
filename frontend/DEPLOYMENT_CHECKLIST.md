# Production Deployment Checklist

## Overview
This document provides a comprehensive deployment checklist for the Moritz Care Home application. Use this for all production deployments, including rollbacks to previous versions, to ensure reliability and proper verification.

## Pre-Deployment Verification
- [ ] Confirm all code changes have been reviewed and approved
- [ ] **For rollbacks: Verify you have checked out the exact git commit/tag for the target version (e.g., Version 85)**
- [ ] Verify backend canisters are stable and healthy
- [ ] Ensure Internet Identity integration is configured correctly
- [ ] Check that no breaking changes were introduced
- [ ] Review recent error logs and resolve any critical issues

## Deployment Steps

### Option 1: Manual Deployment
1. **Inject build metadata and build the frontend:**
   ```bash
   cd frontend
   export VITE_BUILD_VERSION="$(date +%Y%m%d_%H%M%S)"
   export VITE_GIT_COMMIT="$(git rev-parse HEAD 2>/dev/null || echo unknown)"
   export VITE_BUILD_TIMESTAMP="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
   npm run build
   ```

2. **Deploy to production:**
   ```bash
   dfx deploy --network ic
   ```

3. **Verify deployment:**
   - Check that the deployment completes without errors
   - Note the canister IDs for frontend and backend
   - Confirm the production URL is accessible

4. **Start backend canister if stopped:**
   ```bash
   # Check backend canister status
   dfx canister --network ic status backend
   
   # If stopped, start it
   dfx canister --network ic start backend
   ```

### Option 2: Using the Redeploy Script (Recommended)
The redeploy script automates the deployment process, injects build metadata, captures repository state, logs full output for diagnosis, and automatically starts the backend canister if stopped.

1. **Make the script executable (first time only):**
   ```bash
   chmod +x frontend/scripts/redeploy_production.sh
   chmod +x frontend/scripts/restart_backend_canister.sh
   ```

2. **Run the deployment script:**
   ```bash
   ./frontend/scripts/redeploy_production.sh
   ```

3. **Review the output:**
   - The script will create timestamped log files in `frontend/deployment_logs/`
   - On success: Canister IDs, build metadata, and repository state are saved to `canister_ids_[timestamp].txt`
   - On failure: Full stdout/stderr is captured in `deploy_[timestamp].log`
   - **Script uses `set -euo pipefail`** to ensure piped commands fail correctly
   - **Build metadata is automatically injected** (VITE_BUILD_VERSION, VITE_GIT_COMMIT, VITE_BUILD_TIMESTAMP)
   - **Repository state is captured** (git commit, branch, tag, describe output)
   - **Backend canister is automatically started** if it was stopped

4. **If deployment fails:**
   - Review the complete log file for error details: `frontend/deployment_logs/deploy_[timestamp].log`
   - The failing command and full error output will be preserved
   - Use the log file for diagnosis and troubleshooting
   - The script will exit with a non-zero code and stop immediately on failure
   - If canister IDs cannot be retrieved, the script will fail with an explicit error

### Option 3: Clean Rebuild + Redeploy (Troubleshooting & Rollbacks)
Use this option when:
- Production hangs on "Connecting to backend..." after a deploy
- You suspect cached build artifacts are causing issues
- **Performing a rollback to a previous version (e.g., Version 85)**
- After major backend changes or canister ID changes

1. **For rollbacks: Check out the target version first:**
   ```bash
   # Example: Rollback to Version 85
   git checkout <version-85-commit-or-tag>
   # Verify you're on the correct commit
   git log -1
   ```

2. **Make the script executable (first time only):**
   ```bash
   chmod +x frontend/scripts/clean_redeploy_production.sh
   ```

3. **Run the clean rebuild + deployment script:**
   ```bash
   ./frontend/scripts/clean_redeploy_production.sh
   ```

4. **What this script does:**
   - **Captures repository state** (git commit, branch, tag, describe) for rollback documentation
   - **Removes all prior build output** (`frontend/dist`)
   - **Clears Vite build caches** (`frontend/node_modules/.vite`, `frontend/.vite`)
   - **Logs all cleaned paths** for verification
   - **Performs a completely fresh build** with injected metadata
   - **Deploys to production** using `dfx deploy --network ic`
   - **Writes timestamped deployment artifacts** with "Clean Rebuild: Yes" indicator

5. **When to use this option:**
   - Production app hangs on "Connecting to backend..." for more than 10 seconds
   - Diagnostics indicator shows old/stale canister IDs
   - Suspected cached build artifacts causing issues
   - **Performing a rollback to a previous version**
   - When standard redeploy (Option 2) doesn't resolve connection issues

6. **After clean rebuild:**
   - **Hard refresh the live app** (Ctrl+Shift+R on Windows/Linux, Cmd+Shift+R on Mac)
   - **Clear browser cache** for the app's icp0.io domain if hard refresh doesn't work
   - Verify diagnostics indicator shows the new build identifier
   - Cross-check backend canister ID against deployment artifacts
   - **For rollbacks: Verify the git commit in canister_ids_[timestamp].txt matches the target version**

## Backend Canister Management

### Checking Backend Canister Status
After any deployment, verify the backend canister is running:

