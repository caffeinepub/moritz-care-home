# Specification

## Summary
**Goal:** Make the Dashboard resident “Discharge” action work reliably, update the UI immediately after success, and clearly handle permissions/errors.

**Planned changes:**
- Fix the Dashboard “Discharge” mutation flow so that, after a successful discharge, the resident status updates to Discharged and the UI reflects it immediately (badge/tab placement) without a page refresh.
- Ensure the resident lists (Active, All, Discharged) are refreshed/invalidated after discharge so the resident appears in the correct tab(s).
- Limit the discharge in-progress/loading state to only the resident being discharged (avoid blocking unrelated resident actions).
- Add user-visible error handling for discharge failures, including a specific English message when the operation is unauthorized/admin-only.
- Update resident card actions so non-admin users cannot attempt admin-only actions (Discharge, Archive), while “View Profile” remains available to all authenticated users.

**User-visible outcome:** Admin users can discharge an active resident and immediately see them move to the Discharged list with the correct status badge; non-admin users won’t see (or can’t use) Discharge/Archive; any discharge errors (including admin-only authorization failures) are clearly shown without breaking the resident lists.
