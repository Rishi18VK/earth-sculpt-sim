# Terra Explorer Security Repair & Tabletop Mode

## Goal
Repair the existing security workflow without weakening checks, then add an optional Tabletop Mode while preserving Freeform mode, existing routes, and saved terrain behavior.

## Work
1. **Security workflow:** Fix the package-lock mismatch reproduced by `npm ci --dry-run` (missing Drizzle entries); confirm the security regression guard itself passes; update deterministic lockfile-based CycloneDX generation and validation; retain push, pull-request, manual, audit, and artifact behavior. Review dependency advisories and make only compatible, justified updates.
2. **Tabletop Mode:** Add a separate, locally persisted mode with Freeform as the default. Introduce square/hex grid options at 1-inch and 1.25-inch spacing, visibility and snap controls, and grid-aware supported interactions. Add non-destructive plateau previews/edits with multiple regions and undo/redo. Add physical scale presets and custom scale, modular tile/magnet settings, and ensure those options affect export only when enabled.
3. **Print safety:** Extend export validation for detectable mesh issues and provide warnings before download; do not label exports print-ready without sufficient checks. Do not claim OpenLOCK compatibility until its exact geometry is validated against an authoritative specification.
4. **Verification:** Add focused tests for scale conversion, grid snapping, plateau behavior/undo, and mesh validation; run security checks, dependency audit, SBOM validation, existing tests, typecheck/build, and browser checks for mode switching and mobile layout.

## Technical details
- Reuse current React Three Fiber terrain and binary STL generation; keep Tabletop settings isolated from Freeform state and avoid a database migration.
- Keep optional geometry work out of the default Freeform render path; use semantic design-system controls.
- The workspace has no GitHub API credentials, so the exact remote workflow run and its final status cannot be inspected or triggered here. Local checks will reproduce the relevant failure and validate its repair.
- Physical fit, wall strength, and connector compatibility require slicer/physical print validation; report those limits clearly.