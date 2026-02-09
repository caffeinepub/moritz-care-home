# Specification

## Summary
**Goal:** Allow administrators to discharge or permanently delete residents directly from the Dashboard, with clear UI controls, confirmations, and correct authorization behavior.

**Planned changes:**
- Add clearly labeled Dashboard controls on each resident card for admins to discharge a resident and to permanently delete a resident.
- Add confirmation dialog for permanent delete that explicitly states the action is irreversible.
- Wire the Dashboard controls to existing React Query mutations (`useDischargeResident`, `usePermanentlyDeleteResident`) and ensure lists update immediately after success (no manual refresh).
- Ensure non-admin users cannot perform these actions from the Dashboard; show an English error/toast if an attempt is made.
- Verify and fix (if needed) the generated frontend bindings/integration for `isCallerAdmin`, `dischargeResident`, and `permanentlyDeleteResident` so the Dashboard can both display and execute these actions without runtime errors, while preserving backend authorization rules.

**User-visible outcome:** Admin users can discharge or permanently delete residents from the Dashboard with clear actions and confirmations, and resident lists update immediately; non-admin users are prevented from doing so and see an English error message if attempted.
