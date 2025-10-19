# Project Portfolio Gadget

Metadata-driven dashboard gadget for presenting complex project portfolios as cards, lists, tables, or kanban swim lanes. Configuration is supplied entirely through workspace metadata; no project-specific logic is embedded in the implementation.

## Feature Highlights

- Authenticated data loading via `BaseGadget.makeAuthenticatedFetch`, with graceful handling of `401` responses through `BaseGadget.forceLogout`.
- Search, sort, group, and view-mode controls powered by metadata-driven helpers, allowing users to pivot data without bespoke wiring.
- Local persistence for favorites, recents, view mode, and toolbar state so each user keeps their own layout preferences per workspace.
- Guided walk-through implemented with Driver.js to surface advanced capabilities the first time the gadget runs.
- Context-aware navigation: card clicks call `context.onAction("navigate", ...)`, letting the hosting experience decide how to route.

## Architecture and Runtime Flow

1. `ProjectPortfolioGadget` (`index.tsx`) extends `BaseGadget`, advertises metadata (id, version, capability tags) and a JSON schema that editors can validate against.
2. `renderBody` wraps the display component in an `ErrorBoundary` to shield dashboards from runtime failures.
3. `PortfolioComponent` orchestrates data loading, stateful hooks, and presentation:
   - resolves tenant/user scope from the `GadgetContext`,
   - fetches items through `useDataSource`,
   - applies search (`useSearch`), favorites/recents (`useFavorites`, `useRecents`), sort (`useSort`), group (`useGroupBy`), and view-mode (`useViewMode`) transforms,
   - persists user preferences (`usePreferences`) and boots the guided tour (`useTour`),
   - renders the responsive shell (header, toolbar, body, footer).
4. Presentation delegates to memoized child components in `components/` (cards, list/table views, kanban, toolbar, group header, state renderers).
5. Utility modules (`utils/`) resolve dot-path metadata, format values, and map metadata onto UI-friendly option lists.

```
ProjectPortfolioGadget/
├── index.tsx                     # Gadget class (metadata, schema, validation)
├── PortfolioComponent.tsx        # Stateful orchestrator
├── components/                   # Presentational building blocks
├── hooks/                        # Gadget-specific state utilities
├── utils/                        # Metadata helpers (paths, formatting, icons)
├── constants.ts                  # Shared labels and sizing tokens
├── types.ts                      # Public configuration contract
├── PortfolioGadget.module.css    # CSS modules using design tokens
├── __tests__/                    # Jest coverage for helpers and hooks
└── AUDIT.md                      # Maintenance log (manual)
```

### Key Modules

- **`index.tsx`**
  - Declares gadget metadata (`id`, `category`, `version`, tags).
  - Exposes the JSON schema used by the authoring platform to validate metadata payloads (header, toolbar, card display, features, view modes, labels, data bindings).
  - Performs runtime validation (URL syntax, icon names, `cardDisplay.list` structure) before rendering.
  - Requests a padding-free container so cards span edge-to-edge inside dashboards.

- **`PortfolioComponent.tsx`**
  - Computes a compound storage prefix (`persistKey` plus workspace/user/gadget identifiers) to isolate saved preferences per tenant.
  - Ensures every user action (search, sort, group, view toggle) feeds back into the persistence layer and updates derived UI state.
  - Orchestrates view rendering: grid/list/table honor grouping, while kanban ignores grouping and bins by a status field.
  - Batches expensive derived calculations (`useMemo`, `useCallback`) and keeps the render tree presentational.

- **`components/`**
  - `PortfolioToolbar` exposes search/sort/group controls, view toggles, favorites filter, save/reset actions, and Driver.js entry points. It renders tokens such as `data-tour` used by the guided tour.
  - `PortfolioCard`, `ListView`, `TableView`, and `KanbanView` derive all field values via dot-path resolution. Cards handle missing data gracefully (fallback label, placeholder dash, badge for recent items).
  - `ErrorBoundary`, `LoadingState`, `ErrorState`, and `EmptyState` provide consistent UX across lifecycle states.

- **`hooks/`**
  - `useDataSource` encapsulates authenticated fetch, data-path extraction, and item normalization to the internal `MenuItem` contract.
  - `useSearch`, `useSort`, `useGroupBy`, and `useViewMode` each handle one cross-cutting concern with memoized derivations to avoid recomputation on large result sets.
  - `useFavorites`, `useRecents`, `usePreferences` share a persistence strategy (localStorage safely wrapped in try/catch).
  - `useTour` wires Driver.js to highlight each toolbar control with themed popovers. It stores completion state to avoid re-showing the tour unnecessarily.

- **`utils/`**
  - `pathResolver` supports both literal keys and dotted paths (for APIs that flatten keys).
  - `configHelpers` auto-derive search and sort lists from the provided metadata to keep authoring simple.
  - `formatters` perform locale-aware date formatting based on path name heuristics.
  - `iconHelpers` validate Ant Design icon names and render icon elements safely.

## Configuration Contract

`ProjectPortfolioGadgetConfig` (defined in `types.ts`) is the single source of truth for metadata editors. Core sections:

| Section | Purpose | Notable Fields |
| ------- | ------- | -------------- |
| `dataUrl`, `dataPath` | Declarative data source | URL resolved relative to host; optional dot-path to locate array payload |
| `header` | Top-level title block | `title`, `subtitle`, `icon`, `showCount` |
| `toolbar` | Toggle individual controls | `enableSearch`, `enableSort`, `enableGroupBy`, `enableFavoritesFilter`, placeholders |
| `cardDisplay` | Drives what each card shows | `title`, `subtitle`, `titleIcon`, `tags`, `list[]` (label/path/icon) |
| `features` | Optional behaviors | `enableFavorites`, `enableRecents`, `maxRecents`, `favoriteIcon`, `persistKey` |
| `viewModes` | Layout options | `enabled[]`, `default`, `enableToggle`, `kanbanConfig.statusField`, `kanbanConfig.columnOrder` |
| `labels` | i18n overrides | Override toolbar/group copy (`favoritesLabel`, `recentlyViewedLabel`, `nonFavoritesLabel`, `notRecentlyViewedLabel`, `favoritesFilterLabel`) plus header and error strings; every field falls back to `DEFAULT_LABELS` |
| `navigation` | Card click routing | Configure target workspace, id parameter, optional workspace field override, additional param mappings, and whether to open in a new tab |
| `virtualizeThreshold` | Reserved for future virtualization work | Currently unused – retained for forward compatibility |

Metadata consumers must ensure `cardDisplay.list` entries provide both `label` and `path`; the gadget validates these at runtime and surfaces schema errors early.

## State, Persistence, and Context Boundaries

- **Workspace resolution**: Reads the active workspace from `GadgetContext` (falling back to optional `config.workspaceId`) so host applications can supply their own routing; no reliance on `window.location`.
- **Workspace/User scoping**: `usePreferences` composes `portfolio-prefs-${userId}-${workspaceId}-${gadgetId}` to avoid collisions across tenants or multiple gadget instances.
- **Favorites/Recents**: stored in dedicated keys (default prefix `portfolio`). Sorting and grouping expose synthetic fields (`__favorites`, `__recents`) that plug into the same infrastructure.
- **View Modes**: persisted per user so dashboards reopen in the last-used view.
- **Navigation**: `context.onAction("navigate")` is optional; the gadget guards calls so it degrades gracefully if the host does not supply a handler.
- **Guided Tour**: automatically triggers once per storage key; authors can reset or disable by clearing localStorage.

## Data Shaping and Presentation

- `useDataSource` normalizes remote records into `MenuItem` objects while retaining the full `raw` payload for metadata-driven rendering—no hardcoded labels are injected.
- Search, sort, and grouping reuse the same `resolvePath` helper, ensuring consistent handling of nested or literal keys and missing values.
- Kanban view defers grouping to runtime data; metadata simply specifies the status field and optional column ordering.
- Table view dynamically constructs Ant Design columns based on metadata, adding inline sorters and indicating favorites/recents.

## Error Handling and Resilience

- Network failures surface through `ErrorState`, and `BaseGadget.forceLogout` keeps session handling centralized when a `401` is returned.
- The `ErrorBoundary` prevents broken metadata from taking down the whole dashboard; users can retry rendering without refreshing the page.
- Defensive `try/catch` blocks wrap all localStorage access to support environments where storage is unavailable.

## Performance Considerations

- `React.memo`, `useMemo`, and `useCallback` keep render costs predictable even as card counts grow.
- Search is debounced (`DEBOUNCE_DELAY = 300`) to avoid thrashing expensive filters.
- Sorting and grouping operate on copies of the item array to maintain immutability.
- Virtualization is not yet implemented; the `virtualizeThreshold` schema field remains reserved for a future iteration. Large datasets should consider pagination or server-side slicing until that work lands.

## Styling

- Styles live in `PortfolioGadget.module.css` and rely on shared design tokens (`hsl(var(--...))`) so the gadget adheres to platform branding.
- Kanban badges pull primary palette colors from the CSS variables and remain accessible across light and dark modes.

## Testing

Helper modules and hooks are covered by Jest suites located in `__tests__/`:

- `pathResolver.test.ts`
- `formatters.test.ts`
- `configHelpers.test.ts`
- `iconHelpers.test.ts`
- `hooks.test.tsx`

Run gadget-centric tests:

```bash
npm test ProjectPortfolioGadget
```

## Usage Notes

- Register the gadget with the central registry (`GadgetRegistry.register('project-portfolio-gadget', ProjectPortfolioGadget);` in `RegistryInitializer`).
- Provide metadata in workspace JSON (see `public/data/workspaces/*/projects.json` for a live example).
- Use the `navigation` block to route cards into supporting workspaces (e.g., `intelliSCAFF/project-details`) and pass strongly-typed params like `{ id, projectName }` without embedding logic in the gadget.
- Keep `cardDisplay` fields aligned with your API payload; the gadget renders missing values with the default placeholder (`-`) but accurate metadata gives the best experience.
- For future enhancements (virtualization, analytics), prefer adding capabilities through shared hooks or utilities so the documentation pattern stays intact.
