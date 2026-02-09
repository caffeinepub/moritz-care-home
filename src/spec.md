# Specification

## Summary
**Goal:** Ensure all report print views use a consistent fixed-width, desktop-style layout when printing from any device (desktop, mobile, tablet).

**Planned changes:**
- Update the global print stylesheet in `frontend/src/index.css` under `@media print` to force `html` and `body` to a fixed desktop-style width (e.g., ~1000px) and center the printed page layout.
- Audit all existing report print views and ensure each printable root container uses a shared printable root class so the global `@media print` rules apply uniformly.
- Remove or avoid responsive breakpoint-dependent layout behavior in print render paths that could collapse reports to a single-column mobile layout during printing.

**User-visible outcome:** Printing the Resident Profile Report, MAR Report, ADL Report (and other existing report print views) from mobile/tablet produces the same multi-column, aligned desktop-style print layout as printing from desktop, without affecting normal on-screen rendering.
