# Specification

## Summary
**Goal:** Fix the Dashboard/Resident pages getting stuck on “Connecting to backend…” and avoid showing an empty residents view while backend actor initialization and queries are still in progress.

**Planned changes:**
- Update Dashboard/Resident data-fetching to use the resilient actor pattern (timeouts + best-effort admin initialization only when a non-empty token exists), avoiding reliance on the immutable `useActor` initialization path.
- Adjust Dashboard UI states so it shows a clear loading indicator while resident/admin queries are pending/not yet enabled, shows an explicit error state with a recovery action (e.g., retry) on failures/timeouts, and only shows “no residents” after a successful fetch.
- Ensure the backend provides an anonymous `healthCheck()` public query method (message + timestamp) so frontend startup diagnostics can reliably detect backend reachability.

**User-visible outcome:** After login, the Dashboard no longer flashes an empty resident list or hangs indefinitely on “Connecting to backend…”. Users see an appropriate loading state while data is fetching, and a clear recoverable error message if the backend is unreachable or initialization fails.
