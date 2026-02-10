# Version 89 Deployment Checklist

## Overview
This document provides a publish-only deployment and smoke-test checklist for Version 89 of the Moritz Care Home application. This deployment does not introduce any new features, UI changes, or code modifications.

## Pre-Deployment Verification
- [ ] Confirm that the build artifacts target Version 89
- [ ] Verify that no code changes have been introduced since Version 89 was reviewed
- [ ] Ensure all backend canisters are stable and healthy
- [ ] Confirm Internet Identity integration is configured correctly

## Deployment Steps

### Option 1: Manual Deployment
1. **Build the frontend:**
   ```bash
   cd frontend
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

### Option 2: Using the Retry Script (Recommended)
The retry script automates the deployment process and captures full output for diagnosis.

1. **Make the script executable (first time only):**
   ```bash
   chmod +x frontend/scripts/deploy_version_89_publish_only_retry.sh
   ```

2. **Run the deployment retry script:**
   ```bash
   ./frontend/scripts/deploy_version_89_publish_only_retry.sh
   ```

3. **Review the output:**
   - The script will create timestamped log files in `frontend/deployment_logs/`
   - On success: Canister IDs are saved to `canister_ids_[timestamp].txt`
   - On failure: Full stdout/stderr is captured in `deploy_v89_retry_[timestamp].log`
   - **Script uses `set -o pipefail`** to ensure piped commands (e.g., `npm run build | tee`) fail correctly when the underlying command fails

4. **If deployment fails:**
   - Review the complete log file for error details
   - The failing command and full error output will be preserved
   - Use the log file for diagnosis and troubleshooting
   - The script will exit with a non-zero code and stop immediately on failure

## Post-Deployment Smoke Tests

After a successful deployment, execute the comprehensive smoke test checklist documented in `frontend/SMOKE_TEST_VERSION_89.md`.

### Quick Smoke Test Summary
The following tests must pass for a successful deployment:

#### Test 1: Unauthenticated User Flow
- [ ] Navigate to the production URL
- [ ] Verify the Login page loads successfully
- [ ] Confirm the Moritz Care Home logo is displayed correctly
- [ ] Verify the login button is visible and functional
- [ ] Check that no application data is visible before authentication

#### Test 2: Authentication Flow
- [ ] Click the "Login" button
- [ ] Verify Internet Identity authentication flow initiates
- [ ] Complete authentication with a test identity
- [ ] Confirm successful redirect back to the application

#### Test 3: Dashboard Access (Authenticated)
- [ ] After successful login, verify the Dashboard route (/) loads without errors
- [ ] **Confirm the Dashboard reaches a settled state (not stuck on "Connecting to backend...")**
- [ ] Verify the resident list is displayed (or an explicit empty state if no residents exist)
- [ ] Verify the following UI elements are present:
  - [ ] Header with navigation
  - [ ] Statistics cards (Active Residents, Discharged Residents, Total Rooms)
  - [ ] Tabs for "Active" and "Discharged" residents
  - [ ] Room filter dropdown
  - [ ] Sort dropdown
  - [ ] "Add Resident" button (for admin users)
- [ ] **Check that no JavaScript errors appear in the browser console**
- [ ] **Verify loading states resolve properly (no infinite spinners)**

#### Test 4: Profile Setup (First-Time Users)
- [ ] For a new user (new Internet Identity), verify the profile setup modal appears
- [ ] Confirm the modal requires: Name and Employee ID
- [ ] Complete the profile setup
- [ ] Verify the modal closes and the Dashboard loads

#### Test 5: Console Error Check (Critical)
- [ ] **Explicitly check the browser console for JavaScript errors during the entire flow**
- [ ] Document any errors found with full details
- [ ] Verify no React errors, network errors, or API failures

#### Test 6: Diagnostics Indicator Verification
- [ ] Locate the diagnostics indicator in the Dashboard header
- [ ] Verify it displays a frontend build identifier (not "Unknown")
- [ ] Verify it displays a backend canister ID (not "Not connected")
- [ ] Cross-check the backend canister ID against the deployment artifacts in `frontend/deployment_logs/canister_ids_[timestamp].txt`

#### Test 7: Logout Functionality
- [ ] Verify the logout button is accessible
- [ ] Click logout and confirm successful logout
- [ ] Verify redirect to Login page
- [ ] Confirm no application data remains visible

### Detailed Smoke Test Documentation
For step-by-step instructions and detailed acceptance criteria for each test, refer to:
**`frontend/SMOKE_TEST_VERSION_89.md`**

## Critical Constraints
**⚠️ IMPORTANT: This is a publish-only deployment.**
- **NO** feature changes are allowed
- **NO** UI/UX modifications are permitted
- **NO** code refactoring should be introduced
- **NO** backend API changes should be made

## Rollback Plan
If any of the smoke tests fail:
1. Document the specific failure(s) with full error details
2. Review the deployment log file (if using the retry script)
3. Capture the timestamped canister IDs file path for reference
4. Revert to the previous stable version
5. Investigate the issue in a development environment
6. Do not proceed with the deployment until issues are resolved

## Success Criteria
All of the following must be true for a successful deployment:
- ✅ The production app loads successfully through the normal entry point
- ✅ Unauthenticated users reach the Login page without errors
- ✅ Login button is functional (not disabled or hidden)
- ✅ Internet Identity authentication completes successfully
- ✅ Application redirects back after authentication
- ✅ The Dashboard route (/) loads without errors after login
- ✅ **Dashboard does not show infinite loading spinners or remain stuck on "Connecting to backend..."**
- ✅ Resident list content displays correctly (or shows an explicit empty/error state)
- ✅ **No JavaScript console errors are present during the entire flow**
- ✅ **Diagnostics indicator shows valid frontend build identifier and backend canister ID**
- ✅ No code changes or new features were introduced

## Deployment Sign-Off
- **Deployed by:** _________________
- **Deployment date:** _________________
- **Deployment time:** _________________
- **Frontend canister ID:** _________________
- **Backend canister ID:** _________________
- **Deployment method:** ☐ Manual ☐ Retry Script
- **Deployment log file:** _________________ (if using retry script)
- **Canister IDs file:** _________________ (if using retry script)
- **In-app diagnostics indicator values:**
  - Frontend build identifier: _________________
  - Backend canister ID: _________________
- **All smoke tests passed:** ☐ Yes ☐ No
- **Issues encountered:** _________________

---

**Version:** 89  
**Last Updated:** February 10, 2026  
**Status:** Ready for Production Deployment
