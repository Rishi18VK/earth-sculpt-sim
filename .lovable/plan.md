# Security workflow repair and optional Tabletop Mode

## Goals
- Repair the existing security workflow without weakening its checks, using committed lockfile data for dependency review and a validated CycloneDX artifact.
- Add an opt-in Tabletop workspace to the existing terrain editor; leave Freeform as the default and preserve existing terrain and routes.

## Implementation
1. Reproduce and document each CI failure; correct lockfile alignment, dependency scanning, regression guards, SBOM generation/validation, artifact retention, and least-privilege workflow permissions. Run local equivalents and report GitHub-hosted status only if access permits.
2. Add isolated tabletop settings and pure utility functions for square/hex snapping, scale conversion, plateau preview/apply with undo/redo, and print-mesh validation. Add tests for measurable geometry and conversion rules.
3. Integrate an accessible Freeform/Tabletop selector, grid display/snap, scale presets, plateau controls, and modular tile/magnet configuration into existing editor/export surfaces. Keep connector previews configurable and avoid claiming OpenLOCK compatibility without validated specifications.
4. Verify tests, security checks, dependency audit, typecheck/build signals, and desktop/mobile editor flows; update the roadmap and report limitations such as hosted GitHub status and physical print validation.

## Technical details
- Reuse the current R3F terrain and STL exporter; do not add a parallel terrain engine, database migration, or dependency unless the existing stack requires it.
- Keep tabletop preferences separate and default them to Freeform/off, so current projects retain their behavior.
- Use the existing shadcn controls and semantic design tokens for interactive UI.
