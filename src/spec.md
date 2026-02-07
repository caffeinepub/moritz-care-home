# Specification

## Summary
**Goal:** Stop intermittent backend resident-profile data loss by fixing persistence/retrieval logic and ensuring state survives canister upgrades.

**Planned changes:**
- Audit and fix all backend resident persistence and retrieval paths (create/update/delete/query) to prevent unintended removal, partial overwrites, or unreachable records.
- Document clear reproduction steps for the disappearing-residents issue and verify the fix prevents recurrence.
- Implement reliable stable-state handling for canister upgrades (preupgrade/postupgrade) and add a conditional migration (in the designated migration file) if stable layout changes are needed.
- Add an admin-only backend diagnostics query that returns non-sensitive integrity info (resident counts and next-ID counters, optionally a small non-PHI sample such as resident IDs/room numbers) with proper authorization errors for non-admin callers.

**User-visible outcome:** Residents no longer “disappear” after the previously identified triggers (including upgrades), and admins can run a safe diagnostics query to confirm resident counts and ID counters remain consistent.
