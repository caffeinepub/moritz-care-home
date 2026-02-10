# Specification

## Summary
**Goal:** Restore admin-only resident lifecycle actions (Discharge, Archive, Delete) in the production Dashboard and make production/compatibility issues clearly diagnosable in-app.

**Planned changes:**
- Ensure the production build renders admin-only Resident actions (Discharge, Archive, Delete) on the Dashboard for authenticated administrators, matching Version 105 behavior.
- Make admin-permission gating explicit in the Dashboard UI with clear loading/error states; when the admin check fails (including missing backend methods), show an explanatory banner and a one-click Retry.
- Add a lightweight in-app diagnostics indicator showing the current frontend build identifier/version and the backend canister ID the frontend is connected to.
- Verify and align production backend interface compatibility so required methods exist (isCallerAdmin, dischargeResident, permanentlyDeleteResident) and frontend declarations match the deployed backend candid.

**User-visible outcome:** Admin users in production can Discharge and permanently Delete residents directly from resident cards (with immediate list updates), and the UI clearly indicates whether actions are unavailable due to non-admin status, loading, or a compatibility/error state—plus shows the running frontend version and connected backend canister ID.
