# Specification

## Summary
**Goal:** Restore missing backend authorization modules so the Motoko canister compiles and starts successfully.

**Planned changes:**
- Recreate `backend/authorization/access-control.mo` with a non-trapping `initState()` and the permission-checking functions used by `backend/main.mo` (including `hasPermission(state, caller, role)` and `isAdmin(state, caller)`), supporting the `#admin` and `#user` role tags referenced in `backend/main.mo`.
- Recreate `backend/authorization/MixinAuthorization.mo` so `backend/main.mo` can compile with `include MixinAuthorization(accessControlState);`, ensuring the mixin accepts the access control state from `AccessControl.initState()` and does not trap during actor initialization.

**User-visible outcome:** The canister deploys and reaches Running state again (no startup/initialization trap related to missing authorization modules), with existing authorization calls continuing to work.
