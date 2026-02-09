# Specification

## Summary
**Goal:** Ensure the Dashboard’s existing resident discharge and archive (soft deletion) actions are correctly enabled and usable.

**Planned changes:**
- Wire up/fix Dashboard UI interactions to reliably call the existing `useDischargeResident` and `useArchiveResident` actions for the selected resident.
- Ensure user-facing messaging/labels for these actions are in English and reflect the existing soft-archive behavior (no hard delete).

**User-visible outcome:** From the Dashboard, a user can discharge a resident or archive (soft-delete) a resident using the existing actions.
