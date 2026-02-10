# Specification

## Summary
**Goal:** Roll back the production deployment to the exact repository state of Version 85 and redeploy to the Internet Computer network using a clean rebuild workflow, then verify via smoke tests and diagnostics.

**Planned changes:**
- Check out the git ref/commit corresponding to Version 85 and document the ref/commit hash used for the rollback deployment.
- Perform a clean rebuild + redeploy to production (`dfx deploy --network ic`) using `./frontend/scripts/clean_redeploy_production.sh` (or equivalent clean procedure).
- Generate timestamped deployment artifacts under `frontend/deployment_logs/` including `deploy_[timestamp].log` and `canister_ids_[timestamp].txt` with canister IDs and build metadata.
- Run the post-deployment production smoke tests per `frontend/DEPLOYMENT_CHECKLIST.md` and confirm the app connects to the backend and shows valid diagnostics/build metadata.

**User-visible outcome:** The production app is reverted to Version 85 and functions normally (including authentication and dashboard load), with diagnostics showing valid frontend build identifier and backend canister ID matching the recorded deployment logs.
