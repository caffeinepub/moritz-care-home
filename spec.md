# Specification

## Summary
**Goal:** Fix the live app hanging indefinitely on the "Loading profile" screen after connecting to the backend.

**Planned changes:**
- Add a timeout guard (10–15 seconds) in `frontend/src/App.tsx` around the profile-loading phase so the app transitions to an error/retry state instead of hanging forever; source the timeout value from `frontend/src/lib/startupTimings.ts`.
- Update the profile-fetching query in `frontend/src/hooks/useQueries.ts` with an explicit `staleTime`, retry limit (max 2 retries), and a `queryFn` timeout so a slow or unresponsive backend fails fast and surfaces an error state.
- Fix `getUserProfile` in `backend/main.mo` to return a typed `#err(#NotFound)` result for unregistered principals instead of trapping or hanging, enabling the frontend to route to ProfileSetup correctly.
- Add a routing guard in `frontend/src/App.tsx` and `frontend/src/components/ProfileSetup.tsx` to ensure users with an existing profile are always routed to Dashboard and never caught in a circular loading loop.

**User-visible outcome:** The app no longer hangs on "Loading profile" — it either navigates to the Dashboard, routes new users to ProfileSetup, or displays a clear error message with a retry option within a bounded timeout.
