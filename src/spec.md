# Specification

## Summary
**Goal:** Fix baseline user registration so first-time authenticated users can register successfully without an administrator-provisioned token, while preserving any existing admin-token provisioning flow.

**Planned changes:**
- Update backend registration logic to allow tokenless baseline registration for authenticated (non-anonymous) principals and keep the admin-token provisioning path intact.
- Keep the backend registration call idempotent so repeated calls do not fail or unexpectedly change state.
- Improve backend error signaling for registration failures so errors clearly distinguish anonymous/unauthenticated access from other failures and avoid the generic “contact an administrator to provision your account” message for normal first-time users.
- Adjust frontend startup registration/profile bootstrap to stop blocking first-time authenticated users with the provisioning error, while remaining backward compatible with existing token URL parameters.

**User-visible outcome:** After logging in with Internet Identity, a first-time user can proceed into the app and access user-gated features without seeing a provisioning/admin-contact error; if access is anonymous or otherwise unauthorized, the UI shows an accurate error message.
