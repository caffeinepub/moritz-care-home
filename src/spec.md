# Specification

## Summary
**Goal:** Make all modal dialog overlays and dialog panels render with a fully opaque, solid white background so the underlying page is never visible when a dialog is open.

**Planned changes:**
- Add global CSS overrides to force all Radix/shadcn Dialog overlays to be solid white with no transparency and no backdrop blur.
- Audit existing dialog usages (outside `frontend/src/components/ui`) and remove/replace any translucent/opacity Tailwind classes on dialog overlay/content containers to ensure fully opaque white panels.

**User-visible outcome:** Opening any modal (e.g., Add/Edit Resident, Medication, MAR, ADL, Daily Vitals, Weight) shows a pure solid white full-screen overlay and a solid white dialog panel, with no blur and no visibility of the page behind.
