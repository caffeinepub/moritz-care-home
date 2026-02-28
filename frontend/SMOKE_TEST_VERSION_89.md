# Version 89 Post-Deployment Smoke Test Checklist

## Overview
This document provides a comprehensive smoke test checklist to be executed after a successful Version 89 deployment. These tests verify that the core functionality of the Moritz Care Home application is working correctly in the production environment.

## Prerequisites
- Version 89 has been successfully deployed to the Internet Computer network
- You have the production URL for the deployed application
- You have access to a test Internet Identity for authentication
- You have a browser with developer tools available (for console error checking)
- You have the timestamped canister IDs file from deployment (located in `frontend/deployment_logs/canister_ids_[timestamp].txt`)

---

## Test Execution Instructions

### Before Starting
1. Open the browser's developer console (F12 or right-click → Inspect → Console tab)
2. Clear any existing console messages
3. Keep the console open throughout all tests to monitor for JavaScript errors
4. Have the deployment artifacts ready for reference:
   - Deployment log file: `frontend/deployment_logs/deploy_v89_retry_[timestamp].log`
   - Canister IDs file: `frontend/deployment_logs/canister_ids_[timestamp].txt`

---

## Test 1: Unauthenticated Access to Login Page

**Objective:** Verify that unauthenticated users can reach the Login page and that the login button is functional.

### Steps:
1. [ ] Open a new incognito/private browser window
2. [ ] Navigate to the production URL
3. [ ] Verify the Login page loads successfully (no blank screen, no error screen)
4. [ ] Confirm the Moritz Care Home logo is displayed correctly
5. [ ] Verify the login button is visible and enabled
6. [ ] Confirm no application data (residents, dashboard, etc.) is visible
7. [ ] Check the browser console for JavaScript errors

### Expected Results:
- ✅ Login page loads without errors
- ✅ Logo displays correctly
- ✅ Login button is visible and clickable
- ✅ No application data is accessible
- ✅ No JavaScript console errors

### If Test Fails:
- Document the specific failure (screenshot recommended)
- Check the browser console for error messages
- Verify the production URL is correct
- Check network tab for failed requests

---

## Test 2: Internet Identity Authentication Flow

**Objective:** Verify that Internet Identity login completes successfully and redirects back to the application.

### Steps:
1. [ ] Click the "Login" button on the Login page
2. [ ] Verify the Internet Identity authentication window/dialog opens
3. [ ] Complete authentication with a test identity (create new or use existing)
4. [ ] Verify the authentication completes without errors
5. [ ] Confirm the application redirects back successfully after authentication
6. [ ] Check the browser console for JavaScript errors during the authentication flow

### Expected Results:
- ✅ Internet Identity dialog opens correctly
- ✅ Authentication completes successfully
- ✅ Application redirects back after authentication
- ✅ No JavaScript console errors during authentication

### If Test Fails:
- Document the specific failure point in the authentication flow
- Check if Internet Identity integration is configured correctly
- Verify the redirect URL is set properly
- Check for CORS or network errors in the console

---

## Test 3: Dashboard Route Load (Post-Authentication)

**Objective:** Verify that the Dashboard route (/) loads without errors and does not show infinite loading spinners or remain stuck on "Connecting to backend...".

### Steps:
1. [ ] After successful login, verify you are on the Dashboard route (/)
2. [ ] **Observe the Dashboard for 10 seconds to ensure it reaches a settled state**
3. [ ] **Verify the Dashboard is NOT stuck on "Connecting to backend..." message**
4. [ ] Confirm the Dashboard loads completely (no infinite loading spinners)
5. [ ] Verify the following UI elements are present:
   - [ ] Header with navigation and user info
   - [ ] Statistics cards (Active Residents, Discharged Residents, Total Rooms)
   - [ ] Tabs for "Active" and "Discharged" residents
   - [ ] Room filter dropdown
   - [ ] Sort dropdown
   - [ ] "Add Resident" button (visible for admin users)
6. [ ] Verify the resident list displays correctly:
   - [ ] If residents exist: resident cards are displayed
   - [ ] If no residents exist: an appropriate empty state message is shown
7. [ ] Check the browser console for JavaScript errors
8. [ ] Verify no loading spinners remain visible after the page loads

### Expected Results:
- ✅ Dashboard route (/) loads successfully
- ✅ **Dashboard reaches a settled state within 10 seconds (not stuck on "Connecting to backend...")**
- ✅ All UI elements are present and visible
- ✅ Resident list displays correctly (or shows empty state)
- ✅ No infinite loading spinners
- ✅ No JavaScript console errors

### If Test Fails:
- **If stuck on "Connecting to backend...":**
  - Document the exact time observed (e.g., "stuck for 30+ seconds")
  - Capture a screenshot of the stuck state
  - Check the browser console for errors (copy full error messages)
  - Check the network tab for failed API calls or pending requests
  - Document the deployment log file path: `frontend/deployment_logs/deploy_v89_retry_[timestamp].log`
  - Document the canister IDs file path: `frontend/deployment_logs/canister_ids_[timestamp].txt`
- Document which UI elements are missing or broken
- Check if loading states are resolving properly
- Verify backend connectivity (check network tab for failed API calls)
- Check for React Query errors in the console

---

## Test 4: Profile Setup for First-Time Users (If Applicable)

**Objective:** Verify that new users are prompted to set up their profile and can complete the setup successfully.

### Steps:
1. [ ] Log in with a new Internet Identity (one that has never been used with this app)
2. [ ] Verify the profile setup modal appears automatically
3. [ ] Confirm the modal requires the following fields:
   - [ ] Name (text input)
   - [ ] Employee ID (text input)
4. [ ] Fill in all required fields with test data
5. [ ] Click the "Save" or "Submit" button
6. [ ] Verify the modal closes after successful submission
7. [ ] Confirm the Dashboard loads after profile setup
8. [ ] Check the browser console for JavaScript errors

### Expected Results:
- ✅ Profile setup modal appears for new users
- ✅ All required fields are present
- ✅ Profile can be saved successfully
- ✅ Modal closes and Dashboard loads after setup
- ✅ No JavaScript console errors

### If Test Fails:
- Document the specific failure in the profile setup flow
- Check if the profile setup mutation is working correctly
- Verify backend profile endpoints are accessible
- Check for validation errors or API errors in the console

---

## Test 5: Console Error Check (Critical)

**Objective:** Explicitly verify that no JavaScript console errors are present during the entire smoke test flow.

### Steps:
1. [ ] Review the browser console for any errors logged during Tests 1-4
2. [ ] Document any errors found (copy the full error message and stack trace)
3. [ ] Categorize errors by severity:
   - **Critical:** Errors that break functionality
   - **Warning:** Non-breaking issues that should be addressed
   - **Info:** Informational messages (not errors)

### Expected Results:
- ✅ No JavaScript errors in the console
- ✅ No React errors or warnings
- ✅ No network errors (failed API calls)

### If Errors Are Found:
- Document each error with full details
- Determine if errors are blocking functionality
- If critical errors exist, consider rolling back the deployment
- Include the deployment log file path and canister IDs file path in the error report

---

## Test 6: Diagnostics Indicator Verification

**Objective:** Verify that the in-app diagnostics indicator displays the expected frontend build identifier and backend canister ID, and that they match the deployment artifacts.

### Steps:
1. [ ] Locate the diagnostics indicator in the Dashboard header (typically a small info icon or badge)
2. [ ] Hover over or click the diagnostics indicator to view details
3. [ ] Verify the following information is displayed:
   - [ ] Frontend build identifier (should not be "Unknown" or empty)
   - [ ] Backend canister ID (should not be "Not connected" or empty)
4. [ ] Open the canister IDs file from deployment: `frontend/deployment_logs/canister_ids_[timestamp].txt`
5. [ ] Cross-check the backend canister ID shown in the diagnostics indicator against the backend canister ID in the deployment artifacts
6. [ ] Verify they match exactly

### Expected Results:
- ✅ Diagnostics indicator is visible and accessible
- ✅ Frontend build identifier is displayed (not "Unknown")
- ✅ Backend canister ID is displayed (not "Not connected")
- ✅ Backend canister ID matches the ID recorded in the deployment artifacts

### If Test Fails:
- Document what values are shown in the diagnostics indicator
- If backend canister ID shows "Not connected", this indicates a backend connectivity issue
- If values don't match deployment artifacts, document the discrepancy
- Check the deployment log file for any deployment errors
- Verify the correct backend canister was deployed

---

## Test 7: Logout Functionality

**Objective:** Verify that users can log out successfully and are returned to the Login page.

### Steps:
1. [ ] Locate the logout button (typically in the header or user menu)
2. [ ] Click the logout button
3. [ ] Verify the application logs out successfully
4. [ ] Confirm you are redirected to the Login page
5. [ ] Verify no application data remains visible after logout
6. [ ] Check the browser console for JavaScript errors

### Expected Results:
- ✅ Logout button is accessible
- ✅ Logout completes successfully
- ✅ User is redirected to Login page
- ✅ No application data remains visible
- ✅ No JavaScript console errors

### If Test Fails:
- Document the specific failure in the logout flow
- Check if the logout action is clearing authentication state
- Verify the redirect to Login page is working

---

## Summary and Sign-Off

### Test Results Summary
- **Test 1 (Unauthenticated Access):** ☐ Pass ☐ Fail
- **Test 2 (Internet Identity Auth):** ☐ Pass ☐ Fail
- **Test 3 (Dashboard Load):** ☐ Pass ☐ Fail
- **Test 4 (Profile Setup):** ☐ Pass ☐ Fail ☐ N/A
- **Test 5 (Console Error Check):** ☐ Pass ☐ Fail
- **Test 6 (Diagnostics Indicator):** ☐ Pass ☐ Fail
- **Test 7 (Logout Functionality):** ☐ Pass ☐ Fail

### Overall Result
- **All tests passed:** ☐ Yes ☐ No
- **Critical issues found:** ☐ Yes ☐ No

### Issues Encountered
_Document any issues, errors, or unexpected behavior:_

**If Dashboard was stuck on "Connecting to backend...":**
- Time observed stuck: _________________
- Console errors (copy full messages): _________________
- Network tab failures: _________________
- Deployment log file: `frontend/deployment_logs/deploy_v89_retry_[timestamp].log`
- Canister IDs file: `frontend/deployment_logs/canister_ids_[timestamp].txt`

---

### Tester Sign-Off
- **Tested by:** _________________
- **Test date:** _________________
- **Test time:** _________________
- **Browser used:** _________________
- **Production URL:** _________________
- **Deployment artifacts referenced:**
  - Log file: _________________
  - Canister IDs file: _________________

---

## Rollback Decision
If any critical issues are found during smoke testing:
1. Document all failures in detail (include deployment log and canister IDs file paths)
2. Initiate rollback to the previous stable version
3. Investigate issues in a development environment
4. Do not proceed with the deployment until all issues are resolved

---

**Version:** 89  
**Last Updated:** February 10, 2026  
**Status:** Ready for Post-Deployment Testing
