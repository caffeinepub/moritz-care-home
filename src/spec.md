# Specification

## Summary
**Goal:** Add a combined resident print report that includes resident profile details plus separate Active and Discontinued medication tables, with an optional physician name/signature line section.

**Planned changes:**
- Create/update a combined resident print layout that includes a Resident Information/profile section.
- Split the resident’s medications into two table sections in the print output: “Active Medications” (status = active) and “Discontinued Medications” (status = discontinued), each with an empty-state message when no items exist.
- Add an on-screen checkbox/toggle on the resident screen (before printing) to include/exclude blank underline fields labeled “Physician Name” and “Physician Signature” in the printed report.
- Ensure the combined print report uses the existing shared print root container and print utility classes so the fixed-width print styling applies consistently across devices.

**User-visible outcome:** Staff can print a single resident report showing profile info plus separate active/discontinued medication tables, and optionally include blank physician name/signature lines for manual completion.
