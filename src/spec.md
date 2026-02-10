# Specification

## Summary
**Goal:** Ensure operators can quickly start/restart a stopped backend canister on the IC, and provide clear deployment/runbook and UI guidance when the backend canister is stopped.

**Planned changes:**
- Add `frontend/scripts/restart_backend_canister.sh` to check backend canister status on `--network ic`, start it if stopped, and optionally perform a stop+start in an explicit `restart` mode, with clear English output and non-zero exit codes on failure.
- Update `frontend/scripts/redeploy_production.sh` to run the backend start/restart logic immediately after `dfx deploy --network ic` completes so a stopped backend is brought back online as part of redeploy.
- Update `frontend/DEPLOYMENT_CHECKLIST.md` with a dedicated subsection documenting how to verify backend canister status, and how to start/restart it (preferably via the new script), including the exact `dfx canister --network ic status backend` command.
- Update `StartupErrorScreen` to show an explicit English troubleshooting hint when the health check indicates “Backend canister is stopped”, including the backend canister ID from diagnostics and the exact start/restart command(s) and/or reference to the new restart script.

**User-visible outcome:** Operators can restart a stopped backend canister via a script and see clearer deployment and UI guidance to recover when the backend canister is stopped.
