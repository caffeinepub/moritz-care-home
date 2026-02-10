# Specification

## Summary
**Goal:** Grant application administrator permissions to the specified Principal ID so it passes backend `#admin` checks and returns `true` from `isCallerAdmin()`.

**Planned changes:**
- Update backend authorization logic to recognize Principal `hrxqg-aty7r-ze5hr-pldpb-ool7h-fy2rn-npy5t-lvtmr-lccbl-bdj53-pae` as an application administrator.
- Ensure the admin grant persists across canister upgrades without resetting or wiping existing authorization state (using conditional migration if persisted/stable state changes are required).

**User-visible outcome:** When authenticated as `hrxqg-aty7r-ze5hr-pldpb-ool7h-fy2rn-npy5t-lvtmr-lccbl-bdj53-pae`, admin-gated actions work without unauthorized errors and the frontend admin check returns `true`.
