# Specification

## Summary
**Goal:** Fix the live backend connection so the app doesn’t get stuck on “Connecting to backend…” and residents reliably load.

**Planned changes:**
- Add a public, unauthenticated `healthCheck` backend method that returns quickly with a stable response shape (message + timestamp) for frontend startup checks.
- Ensure the backend supports the frontend admin/startup initialization call (`actor._initializeAccessControlWithSecret(secret)`) and that initialization failures do not block normal actor creation or resident read flows (fail fast with explicit errors).
- Update frontend startup and resident loading to use explicit timeouts and fail-fast error handling (no infinite loading), showing an error state when connection/queries fail.
- Add a user-visible Retry action that re-runs actor creation and re-fetches residents after a connection or loading failure.
- Make Dashboard resident fetching use the same resilient actor/connection strategy as startup so slow backend readiness results in either a successful load or an explicit retryable error state.

**User-visible outcome:** The app no longer hangs on “Connecting to backend…”. If the backend is down/misconfigured/slow, users see a clear error with a Retry option; when the backend is reachable and permissions allow, the Dashboard loads and displays residents.
