#!/usr/bin/env bash
# Post-Deployment Smoke Test Helper
# This interactive script guides operators through the documented smoke tests
# from DEPLOYMENT_CHECKLIST.md and performs local checks on deployment artifacts.
# Usage: ./frontend/scripts/post_deploy_smoke_test_helper.sh

set -euo pipefail

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
LOG_DIR="frontend/deployment_logs"

# Helper functions
print_header() {
    echo ""
    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}========================================${NC}"
    echo ""
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

ask_confirmation() {
    local question="$1"
    local response
    while true; do
        read -p "$(echo -e ${BLUE}${question}${NC} [y/n]: )" response
        case "$response" in
            [Yy]* ) return 0;;
            [Nn]* ) return 1;;
            * ) echo "Please answer yes (y) or no (n).";;
        esac
    done
}

# Start
print_header "Post-Deployment Smoke Test Helper"
echo "This script will guide you through the smoke tests documented in"
echo "frontend/DEPLOYMENT_CHECKLIST.md and verify deployment artifacts."
echo ""

# Step 1: Check for deployment artifacts
print_header "Step 1: Verify Deployment Artifacts"

if [ ! -d "${LOG_DIR}" ]; then
    print_error "Deployment logs directory not found: ${LOG_DIR}"
    print_info "This script expects deployment artifacts from redeploy_production.sh or clean_redeploy_production.sh"
    exit 1
fi

# Find the latest canister IDs file
LATEST_CANISTER_IDS=$(ls -t ${LOG_DIR}/canister_ids_*.txt 2>/dev/null | head -n 1)
LATEST_DEPLOY_LOG=$(ls -t ${LOG_DIR}/deploy_*.log 2>/dev/null | head -n 1)

if [ -z "${LATEST_CANISTER_IDS}" ]; then
    print_error "No canister IDs file found in ${LOG_DIR}"
    print_info "Expected file: canister_ids_[timestamp].txt"
    exit 1
fi

if [ -z "${LATEST_DEPLOY_LOG}" ]; then
    print_warning "No deployment log file found in ${LOG_DIR}"
    print_info "Expected file: deploy_[timestamp].log"
else
    print_success "Found deployment log: ${LATEST_DEPLOY_LOG}"
fi

print_success "Found canister IDs file: ${LATEST_CANISTER_IDS}"
echo ""
echo "Contents:"
cat "${LATEST_CANISTER_IDS}"
echo ""

# Extract canister IDs and metadata
BACKEND_CANISTER_ID=$(grep "Backend Canister ID:" "${LATEST_CANISTER_IDS}" | awk '{print $NF}')
FRONTEND_CANISTER_ID=$(grep "Frontend Canister ID:" "${LATEST_CANISTER_IDS}" | awk '{print $NF}')
BUILD_VERSION=$(grep "Version:" "${LATEST_CANISTER_IDS}" | awk '{print $NF}')
GIT_COMMIT=$(grep "Git Commit:" "${LATEST_CANISTER_IDS}" | head -n 1 | awk '{print $NF}')
GIT_COMMIT_SHORT="${GIT_COMMIT:0:7}"

if [ -z "${BACKEND_CANISTER_ID}" ] || [ -z "${FRONTEND_CANISTER_ID}" ]; then
    print_error "Could not extract canister IDs from ${LATEST_CANISTER_IDS}"
    exit 1
fi

print_info "Backend Canister ID: ${BACKEND_CANISTER_ID}"
print_info "Frontend Canister ID: ${FRONTEND_CANISTER_ID}"
print_info "Expected Build Identifier: v${BUILD_VERSION}-${GIT_COMMIT_SHORT}"
echo ""

# Check if this was a clean rebuild
if grep -q "Clean Rebuild: Yes" "${LATEST_CANISTER_IDS}"; then
    print_info "This was a CLEAN REBUILD deployment"
    CLEANED_PATHS=$(grep "Cleaned Paths:" "${LATEST_CANISTER_IDS}" | cut -d: -f2-)
    print_info "Cleaned paths:${CLEANED_PATHS}"
    echo ""
fi

# Check repository state for rollback verification
if grep -q "Repository State:" "${LATEST_CANISTER_IDS}"; then
    print_info "Repository state captured in deployment artifacts:"
    grep "Repository State:" -A 5 "${LATEST_CANISTER_IDS}" | tail -n 5
    echo ""
fi

# Step 2: Login Page Load Test
print_header "Test 1: Login Page Load"
echo "Navigate to your production URL and verify:"
echo "  - Login page loads successfully"
echo "  - Moritz Care Home logo is displayed correctly"
echo "  - Login button is visible and functional"
echo "  - No application data is visible before authentication"
echo ""

if ask_confirmation "Did the login page load correctly?"; then
    print_success "Login page load test passed"
else
    print_error "Login page load test failed"
    print_info "Check browser console for errors"
    print_info "Review deployment log: ${LATEST_DEPLOY_LOG}"
    exit 1
fi

# Step 3: Internet Identity Authentication Test
print_header "Test 2: Internet Identity Authentication"
echo "Click the Login button and verify:"
echo "  - Internet Identity authentication flow initiates"
echo "  - You can complete authentication with a test identity"
echo "  - Successful redirect back to the application"
echo "  - No authentication errors in browser console"
echo ""

if ask_confirmation "Did Internet Identity authentication work correctly?"; then
    print_success "Internet Identity authentication test passed"
else
    print_error "Internet Identity authentication test failed"
    print_info "Check browser console for errors"
    print_info "Verify Internet Identity integration is configured correctly"
    exit 1
fi

# Step 4: Dashboard Settles Test (Critical)
print_header "Test 3: Dashboard Settles (Critical)"
echo "After successful login, verify the Dashboard:"
echo ""
echo "  ⏱️  CRITICAL: Observe for 10 seconds"
echo "  ✅ Expected: Dashboard displays resident list or empty state within 10 seconds"
echo "  ❌ Failure: Stuck on 'Connecting to backend...' for more than 10 seconds"
echo ""
echo "If stuck on 'Connecting to backend...':"
echo "  1. Check browser console for errors"
echo "  2. Try the Retry button if available"
echo "  3. If issue persists, run: ./frontend/scripts/clean_redeploy_production.sh"
echo ""

if ask_confirmation "Did the Dashboard reach a settled state within 10 seconds?"; then
    print_success "Dashboard settles test passed"
else
    print_error "Dashboard settles test failed - app is stuck on 'Connecting to backend...'"
    print_warning "This indicates a startup issue. Recommended action:"
    print_info "Run: ./frontend/scripts/clean_redeploy_production.sh"
    print_info "Then perform a hard refresh (Ctrl+Shift+R / Cmd+Shift+R)"
    exit 1
fi

echo ""
if ask_confirmation "Are there any JavaScript errors in the browser console?"; then
    print_error "JavaScript errors detected in console"
    print_info "Review console errors and check deployment log: ${LATEST_DEPLOY_LOG}"
    exit 1
else
    print_success "No JavaScript errors in console"
fi

echo ""
if ask_confirmation "Do all loading states resolve properly (no infinite spinners)?"; then
    print_success "Loading states resolve correctly"
else
    print_error "Loading states do not resolve properly"
    print_info "Check for stuck queries or timeout issues"
    exit 1
fi

# Step 5: Diagnostics Indicator Verification (Critical)
print_header "Test 4: Diagnostics Indicator Verification (Critical)"
echo "Locate the diagnostics indicator in the Dashboard header (top-right area)."
echo ""
echo "Expected frontend build identifier: v${BUILD_VERSION}-${GIT_COMMIT_SHORT}"
echo "Expected backend canister ID: ${BACKEND_CANISTER_ID}"
echo ""
echo "Verify the diagnostics indicator shows:"
echo "  1. A non-unknown frontend build identifier (e.g., v20260210_143022-abc1234)"
echo "  2. A backend canister ID (not 'Not connected' or 'Unknown')"
echo ""

if ask_confirmation "Does the diagnostics indicator show a non-unknown frontend build identifier?"; then
    print_success "Frontend build identifier is displayed"
    echo ""
    read -p "$(echo -e ${BLUE}What build identifier is shown?${NC} )" DISPLAYED_BUILD_ID
    
    if [[ "${DISPLAYED_BUILD_ID}" == *"${BUILD_VERSION}"* ]] && [[ "${DISPLAYED_BUILD_ID}" == *"${GIT_COMMIT_SHORT}"* ]]; then
        print_success "Build identifier matches expected value: v${BUILD_VERSION}-${GIT_COMMIT_SHORT}"
    else
        print_warning "Build identifier does not match expected value"
        print_info "Expected: v${BUILD_VERSION}-${GIT_COMMIT_SHORT}"
        print_info "Displayed: ${DISPLAYED_BUILD_ID}"
        print_warning "This may indicate a caching issue or incorrect deployment"
    fi
else
    print_error "Frontend build identifier is unknown or missing"
    print_info "This indicates build metadata was not injected during deployment"
    print_info "Re-run deployment using: ./frontend/scripts/redeploy_production.sh"
    exit 1
fi

echo ""
if ask_confirmation "Does the diagnostics indicator show a backend canister ID?"; then
    print_success "Backend canister ID is displayed"
    echo ""
    read -p "$(echo -e ${BLUE}What backend canister ID is shown (full or shortened)?${NC} )" DISPLAYED_CANISTER_ID
    
    # Check if displayed ID matches (allow for shortened display)
    if [[ "${BACKEND_CANISTER_ID}" == *"${DISPLAYED_CANISTER_ID}"* ]] || [[ "${DISPLAYED_CANISTER_ID}" == *"${BACKEND_CANISTER_ID}"* ]]; then
        print_success "Backend canister ID matches deployment artifacts: ${BACKEND_CANISTER_ID}"
    else
        print_error "Backend canister ID does NOT match deployment artifacts"
        print_info "Expected: ${BACKEND_CANISTER_ID}"
        print_info "Displayed: ${DISPLAYED_CANISTER_ID}"
        print_warning "The frontend may be connecting to the wrong backend"
        print_info "Recommended action: Run ./frontend/scripts/clean_redeploy_production.sh"
        exit 1
    fi
else
    print_error "Backend canister ID is not displayed (shows 'Not connected' or 'Unknown')"
    print_info "This indicates the frontend cannot connect to the backend"
    print_info "Check backend canister status: dfx canister --network ic status backend"
    exit 1
fi

# Step 6: Hard Refresh & Cache Clear Test (Critical for Rollbacks)
print_header "Test 5: Hard Refresh & Cache Clear (Critical)"
echo "Perform a hard refresh of the production app:"
echo "  - Windows/Linux: Ctrl+Shift+R"
echo "  - Mac: Cmd+Shift+R"
echo ""
echo "After hard refresh, verify:"
echo "  - The app continues to function normally"
echo "  - Diagnostics indicator still shows correct build identifier and canister ID"
echo "  - No new errors appear in the console"
echo ""

if ask_confirmation "Did you perform a hard refresh?"; then
    print_success "Hard refresh performed"
else
    print_warning "Hard refresh not performed - this is critical for rollbacks"
    print_info "Please perform a hard refresh and re-run this test"
fi

echo ""
if ask_confirmation "Does the app continue to function normally after hard refresh?"; then
    print_success "App functions correctly after hard refresh"
else
    print_error "App does not function correctly after hard refresh"
    print_info "Try clearing browser cache for the app's domain:"
    print_info "  1. Open browser DevTools (F12)"
    print_info "  2. Go to Application/Storage tab"
    print_info "  3. Clear site data for the icp0.io domain"
    print_info "  4. Reload the page"
    exit 1
fi

# Step 7: Basic Functionality Test
print_header "Test 6: Basic Functionality"
echo "Verify basic app functionality:"
echo "  - 'Add Resident' button is visible (admin users only)"
echo "  - Navigation between tabs works (All Residents, Active, Discharged)"
echo "  - Resident cards display correctly with all information"
echo "  - Clicking on a resident card opens the profile page"
echo "  - Profile page loads and displays resident information"
echo "  - Logout button works and logs out successfully"
echo ""

if ask_confirmation "Does basic app functionality work correctly?"; then
    print_success "Basic functionality test passed"
else
    print_error "Basic functionality test failed"
    print_info "Review browser console for errors"
    print_info "Check deployment log: ${LATEST_DEPLOY_LOG}"
    exit 1
fi

# Final Summary
print_header "✅ All Smoke Tests Passed!"
echo "Deployment verification complete. Summary:"
echo ""
print_success "Login page loads correctly"
print_success "Internet Identity authentication works"
print_success "Dashboard settles within 10 seconds"
print_success "No JavaScript errors in console"
print_success "Diagnostics indicator shows correct build identifier and canister ID"
print_success "Hard refresh does not break the app"
print_success "Basic functionality works correctly"
echo ""
print_info "Deployment artifacts:"
print_info "  - Canister IDs: ${LATEST_CANISTER_IDS}"
if [ -n "${LATEST_DEPLOY_LOG}" ]; then
    print_info "  - Deploy log: ${LATEST_DEPLOY_LOG}"
fi
echo ""
print_info "Backend Canister ID: ${BACKEND_CANISTER_ID}"
print_info "Frontend Build Identifier: v${BUILD_VERSION}-${GIT_COMMIT_SHORT}"
echo ""

# Check if this was a rollback
if grep -q "Repository State:" "${LATEST_CANISTER_IDS}"; then
    print_info "Repository state for this deployment:"
    grep "Git Commit" "${LATEST_CANISTER_IDS}" | head -n 1
    grep "Git Branch" "${LATEST_CANISTER_IDS}"
    if grep -q "Git Tag:" "${LATEST_CANISTER_IDS}"; then
        grep "Git Tag:" "${LATEST_CANISTER_IDS}"
    fi
    echo ""
    print_warning "If this was a rollback, document the reason and version deployed"
fi

print_success "Deployment verified successfully!"
echo ""

exit 0
