# Specification

## Summary
**Goal:** Fix missing resident profiles after login by ensuring resident data persists correctly in the backend (including across canister upgrades) and improving the Dashboard UX to clearly show load failures vs true empty states.

**Planned changes:**
- Audit and fix backend resident persistence/retrieval so resident lists (all/active/discharged) do not become empty when residents exist, and ensure nested resident update flows don’t partially overwrite/drop unrelated fields.
- Implement reliable stable-state upgrade handling (preupgrade/postupgrade) to preserve residents, user profiles, and next-ID counters across canister upgrades; add a conditional migration only if required by state layout changes.
- Add an admin-only backend diagnostics query that returns non-sensitive aggregate resident counts and ID/counter metadata for production verification.
- Update the Dashboard resident list UI to handle React Query error states: show an explicit “failed to load residents” message with a user-invokable retry, while keeping the existing “No residents found” UI for successful empty lists.

**User-visible outcome:** After logging in, authorized users see the expected resident profiles when they exist; upgrades no longer clear resident data; and if loading residents fails, the Dashboard shows a clear error with a retry option instead of incorrectly implying there are no residents.
