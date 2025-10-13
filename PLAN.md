# plans.md — Exec Plan for Login Experience Elevation

## Goal / End state

- Deliver a “world-class” login experience that showcases intelliSPEC’s industrial intelligence platform while keeping authentication friction-free.
- Blend brand storytelling, modular feature highlights, and enterprise credibility into the login surface using existing theme tokens.
- Ensure the redesigned page remains accessible, responsive, and extensible through metadata-driven configuration.

## Context & background

- Current login metadata and layout are utilitarian; they lack the product narrative requested (“Industrial Intelligence Platform… Beyond CMMS/EAM”).
- `LoginShell` already supports theme variations but does not expose a branded hero panel or value proposition slots.
- Design tokens and theme utilities exist; we must lean on them instead of bespoke palettes.
- Enhancements must fit within the metadata contract so tenants can customize content without code changes.

## Milestones & sub-tasks

1. **Content architecture**
   - Extend `LoginMetadata` with hero/value proposition fields and validate them via Zod schema.
   - Refresh default metadata to tell the industrial intelligence story (headlines, highlights, CTA microcopy).
2. **Layout & structure**
   - Introduce a split layout with a hero surface that pairs storytelling with credibility stats.
   - Preserve existing centered layout behaviour for tenants that do not supply hero data.
3. **Visual polish**
   - Apply theme-driven gradients, glass panels, and iconography for the hero experience.
   - Verify responsiveness, contrast, and focus states remain compliant.

## Progress & status

- [x] `LoginMetadata` schema extended with hero/value props
- [x] LoginShell renders hero/value props when provided
- [x] CSS updated for split layout + hero styling
- [x] Default metadata refreshed with industrial intelligence messaging
- [x] Motion styling aligned with modern industrial theme
- [x] Split layout spacing tuned to avoid vertical scroll on standard displays
- [x] Hero + background refinements for enterprise polish
- [x] Login card footprint minimized without sacrificing readability
- [x] Viewport fit verified at 1366×768 with no vertical scroll after second compaction

## Surprises & discoveries

- None yet; update as the implementation proceeds.

## Decision log

| Decision | Reasoning | Alternatives considered | Chosen option |
| -------- | --------- | ----------------------- | ------------- |
| Leverage metadata for hero/value props | Keeps tenant-driven customization without code changes | Hard-code marketing copy into component | Extend metadata contract |
| Implement split layout via existing theme flag | Minimizes breaking changes | Build separate hero component | Reuse LoginShell layout options |

## Risks & mitigation

- **Risk:** Split layout could degrade on small screens.  
  **Mitigation:** Ensure responsive fallbacks collapse hero content under form.
- **Risk:** Additional metadata fields might break consumers.  
  **Mitigation:** Keep new fields optional with safe defaults and validation.
- **Risk:** Visual enhancements might reduce contrast or accessibility.  
  **Mitigation:** Use theme tokens, test with light/dark modes, and respect WCAG contrast.

## Done criteria & verification

- Login renders hero storytelling and stats by default while remaining fully functional.
- Component passes TypeScript checking and unit build (no console errors).
- Manual smoke test confirms form submission path unaffected.
- PLAN.md progress boxes marked complete and surprises/risks updated if needed.

## Future enhancements (out of scope now)

- Support tenant-specific background media via CDN-hosted imagery.
- Introduce localized copy variants for international deployments.
