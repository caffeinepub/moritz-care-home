# Version 89 Deployment Checklist

## Overview
This document provides a publish-only deployment and smoke-test checklist for Version 89 of the Moritz Care Home application. This deployment does not introduce any new features, UI changes, or code modifications.

## Pre-Deployment Verification
- [ ] Confirm that the build artifacts target Version 89
- [ ] Verify that no code changes have been introduced since Version 89 was reviewed
- [ ] Ensure all backend canisters are stable and healthy
- [ ] Confirm Internet Identity integration is configured correctly

## Deployment Steps
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

## Post-Deployment Smoke Tests

### Test 1: Unauthenticated User Flow
- [ ] Navigate to the production URL
- [ ] Verify the Login page loads successfully
- [ ] Confirm the Moritz Care Home logo is displayed correctly
- [ ] Verify the login button is visible and functional
- [ ] Check that no application data is visible before authentication

### Test 2: Authentication Flow
- [ ] Click the "Login" button
- [ ] Verify Internet Identity authentication flow initiates
- [ ] Complete authentication with a test identity
- [ ] Confirm successful redirect back to the application

### Test 3: Dashboard Access (Authenticated)
- [ ] After successful login, verify the Dashboard route (/) loads without errors
- [ ] Confirm the resident list is displayed (or an explicit empty state if no residents exist)
- [ ] Verify the following UI elements are present:
  - [ ] Header with navigation
  - [ ] Statistics cards (Active Residents, Discharged Residents, Total Rooms)
  - [ ] Tabs for "Active" and "Discharged" residents
  - [ ] Room filter dropdown
  - [ ] Sort dropdown
  - [ ] "Add Resident" button (for admin users)
- [ ] Check that no JavaScript errors appear in the browser console
- [ ] Verify loading states resolve properly (no infinite spinners)

### Test 4: Profile Setup (First-Time Users)
- [ ] For a new user (new Internet Identity), verify the profile setup modal appears
- [ ] Confirm the modal requires: Name, Role, and Employee ID
- [ ] Complete the profile setup
- [ ] Verify the modal closes and the Dashboard loads

### Test 5: Error Handling
- [ ] Verify that any backend errors display appropriate error messages
- [ ] Confirm retry buttons work if queries fail
- [ ] Check that the logout functionality works correctly

### Test 6: Resident Profile (If Residents Exist)
- [ ] Click on a resident card to navigate to their profile
- [ ] Verify the Resident Profile page loads without errors
- [ ] Confirm all sections are visible:
  - [ ] Resident information
  - [ ] Medications table
  - [ ] Print report functionality
- [ ] Test the print functionality
- [ ] Navigate back to the Dashboard

## Critical Constraints
**⚠️ IMPORTANT: This is a publish-only deployment.**
- **NO** feature changes are allowed
- **NO** UI/UX modifications are permitted
- **NO** code refactoring should be introduced
- **NO** backend API changes should be made

## Rollback Plan
If any of the smoke tests fail:
1. Document the specific failure(s)
2. Revert to the previous stable version
3. Investigate the issue in a development environment
4. Do not proceed with the deployment until issues are resolved

## Success Criteria
All of the following must be true for a successful deployment:
- ✅ The production app loads successfully through the normal entry point
- ✅ Unauthenticated users reach the Login page without errors
- ✅ Internet Identity authentication completes successfully
- ✅ The Dashboard route (/) loads without errors after login
- ✅ Resident list content displays correctly (or shows an explicit empty/error state)
- ✅ No JavaScript console errors are present
- ✅ No code changes or new features were introduced

## Deployment Sign-Off
- **Deployed by:** _________________
- **Deployment date:** _________________
- **Deployment time:** _________________
- **Frontend canister ID:** _________________
- **Backend canister ID:** _________________
- **All smoke tests passed:** ☐ Yes ☐ No
- **Issues encountered:** _________________

---

**Version:** 89  
**Last Updated:** February 9, 2026  
**Status:** Ready for Production Deployment
