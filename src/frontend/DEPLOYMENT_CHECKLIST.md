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

### Option 2: Using the Redeploy Script (Recommended)
The redeploy script automates the deployment process, injects build metadata, captures repository state, and logs full output for diagnosis.

1. **Make the script executable (first time only):**
   ```bash
   chmod +x frontend/scripts/redeploy_production.sh
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

## Deployment Artifacts
After running the deployment scripts, you'll find the following files in `frontend/deployment_logs/`:

- **`deploy_[timestamp].log`**: Complete deployment log with all stdout/stderr
- **`canister_ids_[timestamp].txt`**: Summary file containing:
  - Frontend canister ID
  - Backend canister ID
  - Injected build metadata (version, git commit, build timestamp)
  - **Repository state (git commit, branch, tag, describe)** - use this to verify rollback version
  - Clean rebuild indicator (for clean_redeploy_production.sh)
  - Cleaned paths list (for clean_redeploy_production.sh)

These files are essential for:
- **Documenting the exact version deployed (critical for rollbacks)**
- Verifying successful deployment
- Troubleshooting deployment failures
- Cross-checking diagnostics indicator values
- Maintaining deployment history
- Confirming build metadata was properly injected

## Post-Deployment Smoke Tests

Execute the following tests to verify a successful deployment:

### Test 1: Login Page Load
- [ ] Navigate to the production URL
- [ ] Verify the Login page loads successfully
- [ ] Confirm the Moritz Care Home logo is displayed correctly
- [ ] Verify the login button is visible and functional
- [ ] Check that no application data is visible before authentication

### Test 2: Internet Identity Authentication
- [ ] Click the "Login" button
- [ ] Verify Internet Identity authentication flow initiates
- [ ] Complete authentication with a test identity
- [ ] Confirm successful redirect back to the application
- [ ] Verify no authentication errors in the browser console

### Test 3: Dashboard Settles (Critical)
- [ ] After successful login, verify the Dashboard route (/) loads
- [ ] **Confirm the Dashboard reaches a settled state within 10 seconds**
  - ✅ Expected: Dashboard displays resident list or empty state
  - ❌ Failure: Stuck on "Connecting to backend..." for more than 10 seconds
  - If stuck, this indicates a startup issue:
    - Check browser console for errors
    - Try the Retry button if available
    - **If issue persists, use Option 3 (Clean Rebuild + Redeploy)**
- [ ] Verify the resident list is displayed (or an explicit empty state if no residents exist)
- [ ] **Check that no JavaScript errors appear in the browser console**
- [ ] **Verify loading states resolve properly (no infinite spinners)**

### Test 4: Diagnostics Indicator Verification (Critical)
This test confirms that build metadata was properly injected during deployment and verifies the deployed version.

- [ ] Locate the diagnostics indicator in the Dashboard header (top-right area)
- [ ] **Verify it displays a non-unknown frontend build identifier**
  - ✅ Expected: `v[timestamp]-[commit]` (e.g., `v20260210_143022-abc1234`)
  - ❌ Failure: `vdev-unknown`, `Unknown`, or `Missing build metadata`
  - If you see a failure state, build metadata was not injected—check deployment logs
- [ ] **Verify it displays a backend canister ID** (not "Not connected" or "Unknown")
  - ✅ Expected: Shortened canister ID (e.g., `abc12345...xyz89`)
  - ❌ Failure: "Not connected" or "Unknown"
- [ ] **Cross-check the backend canister ID** against the deployment artifacts:
  ```bash
  cat frontend/deployment_logs/canister_ids_[latest_timestamp].txt
  ```
  - The canister ID shown in the diagnostics indicator should match the "Backend Canister ID" in the file
  - If they don't match, the frontend may be connecting to the wrong backend
- [ ] **For rollbacks: Verify the git commit in the deployment artifacts matches the target version**
  ```bash
  # Check the repository state section in the canister IDs file
  grep "Git Commit" frontend/deployment_logs/canister_ids_[latest_timestamp].txt
  ```
  - Confirm the commit hash matches the version you intended to deploy (e.g., Version 85)

### Test 5: Hard Refresh & Cache Clear (Critical for Rollbacks)
- [ ] Perform a hard refresh of the production app
  - Windows/Linux: Ctrl+Shift+R
  - Mac: Cmd+Shift+R
- [ ] If issues persist, clear browser cache for the app's domain:
  - Open browser DevTools (F12)
  - Go to Application/Storage tab
  - Clear site data for the icp0.io domain
  - Reload the page
- [ ] **Verify the app continues to function normally after cache clear**
- [ ] **Verify diagnostics indicator still shows correct build identifier and canister ID**

### Test 6: Basic Functionality
- [ ] Verify the "Add Resident" button is visible (admin users only)
- [ ] Test navigation between tabs (All Residents, Active, Discharged)
- [ ] Verify resident cards display correctly with all information
- [ ] Test clicking on a resident card to view the profile page
- [ ] Verify the profile page loads and displays resident information
- [ ] Test the logout button and confirm successful logout

## Troubleshooting

### Issue: "Connecting to backend..." Hangs
**Symptoms:**
- Dashboard stuck on "Connecting to backend..." for more than 10 seconds
- No error messages in console
- Diagnostics indicator may show old/stale canister IDs

**Solution:**
1. Use **Option 3: Clean Rebuild + Redeploy**
2. After deployment, perform a hard refresh (Ctrl+Shift+R / Cmd+Shift+R)
3. If still stuck, clear browser cache for the app's domain
4. Verify diagnostics indicator shows the new build identifier
5. Cross-check backend canister ID against latest deployment artifacts

### Issue: Diagnostics Indicator Shows "Unknown" or "Missing build metadata"
**Symptoms:**
- Diagnostics indicator displays "vdev-unknown" or "Unknown"
- Build identifier is not in the expected format

**Solution:**
1. Check deployment logs: `frontend/deployment_logs/deploy_[timestamp].log`
2. Verify build metadata was injected (look for VITE_BUILD_VERSION, VITE_GIT_COMMIT, VITE_BUILD_TIMESTAMP)
3. If metadata was not injected, re-run deployment using Option 2 or Option 3
4. Ensure you're using the deployment scripts (not manual `dfx deploy`)

### Issue: Backend Canister ID Mismatch
**Symptoms:**
- Diagnostics indicator shows a different backend canister ID than expected
- App may fail to load data or show authorization errors

**Solution:**
1. Check the latest deployment artifacts: `frontend/deployment_logs/canister_ids_[timestamp].txt`
2. Compare the "Backend Canister ID" in the file with the diagnostics indicator
3. If they don't match, the frontend may be connecting to the wrong backend
4. Re-run deployment using Option 3 (Clean Rebuild + Redeploy)
5. Verify the backend canister is running: `dfx canister --network ic status backend`

### Issue: Rollback Version Verification Failed
**Symptoms:**
- After rollback, the app doesn't behave as expected for the target version
- Git commit in deployment artifacts doesn't match the intended version

**Solution:**
1. Verify you checked out the correct git commit/tag before deployment:
   ```bash
   git log -1
   git describe --always
   ```
2. Check the deployment artifacts to confirm the repository state:
   ```bash
   grep "Repository State" -A 5 frontend/deployment_logs/canister_ids_[timestamp].txt
   ```
3. If the commit doesn't match, check out the correct version and re-run Option 3
4. Document the correct git ref/commit for future rollbacks

## Post-Deployment Checklist
- [ ] All smoke tests passed
- [ ] Diagnostics indicator shows correct build identifier and backend canister ID
- [ ] **For rollbacks: Git commit in deployment artifacts matches target version**
- [ ] No console errors or warnings
- [ ] Hard refresh performed and app still functions correctly
- [ ] Deployment artifacts saved and reviewed
- [ ] Team notified of successful deployment
- [ ] **For rollbacks: Document the reason for rollback and the version deployed**
