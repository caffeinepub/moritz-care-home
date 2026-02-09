# Specification

## Summary
**Goal:** Ensure the app fails fast during startup when the backend is reachable but slow, showing an actionable error screen instead of waiting on long/infinite loading states.

**Planned changes:**
- Add shorter, configurable startup timeouts (separate from the 45s watchdog) so actor creation and profile loading fail fast when they stall.
- Wrap startup-critical requests (including `getCallerUserProfile` / `useGetCallerUserProfileStartup` and similar) with per-step `withTimeout` so slow/hanging calls transition into the existing error flow quickly.
- Trigger `performHealthCheck` earlier during startup if loading exceeds a short threshold, so the UI can distinguish “backend unreachable” vs “backend reachable but slow” and tailor the error messaging and fallback timing.
- Ensure “Retry Connection” clears any timed-out startup state and re-attempts actor creation and profile loading; “Logout” remains available from the startup error screen.

**User-visible outcome:** When the backend is slow, users see a clear startup error screen within ~10–15 seconds (with Retry Connection and Logout) rather than being stuck on “Connecting to backend...” / “Loading your profile...” until the full 45 seconds elapse.
