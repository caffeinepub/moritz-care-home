# Specification

## Summary
**Goal:** Make startup resilient to backend actor creation/profile load failures (including stopped canister), add a public backend health check, and ensure startup error diagnostics and recovery actions are accurate and actionable.

**Planned changes:**
- Ensure backend actor creation and startup loading always either completes or transitions to the existing StartupErrorScreen within the configured startup timeout (no indefinite “Connecting to backend...”).
- Update the Retry Connection action to clear relevant React Query caches and re-run actor creation, health check, and profile loading without requiring a page refresh.
- Improve backend diagnostics shown on StartupErrorScreen to reliably display the targeted canister ID, network, and host (using `window.__ENV__` when available, otherwise clearly labeled safe fallbacks; no secrets displayed).
- Add an unauthenticated backend `healthCheck()` method compatible with the existing frontend `performHealthCheck()` expectations (returns an object with `message` and optional `timestamp`).
- Fix startup gating so that after successful actor creation, a missing caller profile reliably routes to/renders Profile Setup, and non-fatal access-control initialization issues do not block Profile Setup or the main app.
- Improve frontend error normalization and StartupErrorScreen messaging to explicitly detect and surface “backend canister is stopped” failures and show the targeted canister ID; ensure retries do not re-enter infinite loading.

**User-visible outcome:** The app no longer gets stuck on “Connecting to backend...”; if the backend is unreachable or stopped, users see a clear StartupErrorScreen with accurate diagnostics and a working Retry Connection (including a health check). If the backend is reachable but the user has no profile, the app reliably proceeds to Profile Setup.
