# Specification

## Summary
**Goal:** Fix backend user-profile handling so first-time authenticated users can load a missing profile as `null` and complete Profile Setup without pre-registration.

**Planned changes:**
- Update `getCallerUserProfile` to return Motoko `null` when the authenticated caller has no saved profile, instead of throwing/trapping or returning an error (e.g., "User is not registered").
- Adjust backend authorization/guards so a newly authenticated principal can call `saveCallerUserProfile(profile)` to create their first profile without requiring an admin pre-registration or role assignment.
- Preserve existing single-actor Motoko structure in `backend/main.mo`, adding migration code only if a state/schema upgrade is strictly required.

**User-visible outcome:** A newly authenticated user will no longer hit “User is not registered” on initial profile load, and can proceed through Profile Setup and save their profile successfully.
