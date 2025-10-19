# Detail Cards Gadget

Simple, read-only card gadget for displaying structured information in card format. Follows the same architectural pattern as ProjectPortfolioGadget with clean separation of concerns.

## Feature Highlights

- **Read-Only Display**: Pure presentational cards with no editing or interaction features
- **Metadata-Driven**: All configuration through workspace JSON - zero hardcoded business logic
- **Authenticated Data**: Uses `BaseGadget.makeAuthenticatedFetch` with automatic placeholder resolution
- **Responsive Grid**: Cards automatically adjust to screen size using CSS Grid
- **Themed Styling**: 100% shadcn/ui design tokens - fully themeable

## Architecture and Runtime Flow

1. `DetailCardsGadget` (`index.tsx`) extends `BaseGadget`, declares metadata and schema for validation
2. `renderBody` wraps `DetailCardsComponent` for data fetching and orchestration
3. `DetailCardsComponent` fetches data, handles states, and renders cards using:
   - `useEffect` for data loading with placeholder resolution
   - Delegates to presentational components for each state (loading, error, empty, cards)
4. Presentation components in `components/`:
   - `DetailCard` - Individual card rendering
   - `LoadingState` - Skeleton cards during fetch
   - `ErrorState` - Error message display
   - `EmptyState` - No data message
5. Utility modules in `utils/`:
   - `formatters.ts` - Value formatting (date, number, text)
   - `iconHelpers.ts` - Icon rendering
   - `pathResolver.ts` - Dot-notation path resolution

## Module Layout

```
DetailCardsGadget/
├── index.tsx                      # Gadget class (metadata, schema, validation)
├── DetailCardsComponent.tsx       # Container/orchestrator (data fetching, state)
├── components/                    # Presentational components
│   ├── DetailCard.tsx            # Individual card rendering
│   ├── LoadingState.tsx          # Loading skeleton
│   ├── ErrorState.tsx            # Error display
│   └── EmptyState.tsx            # Empty data display
├── utils/                         # Pure utility functions
│   ├── formatters.ts             # Value formatting
│   ├── iconHelpers.ts            # Icon rendering
│   └── pathResolver.ts           # Path resolution
├── types.ts                       # TypeScript interfaces
├── constants.ts                   # Default values
├── DetailCardsGadget.module.css   # Shadcn-themed styles
└── README.md                      # This file
```

## Configuration Example

```json
{
  "id": "project-details-cards",
  "type": "detail-cards-gadget",
  "title": "Project Details",
  "position": 24,
  "size": 24,
  "config": {
    "dataUrl": "/api/documents/{id}?type=wizard&domain=scaffolding",
    "dataPath": "data",
    "cardsPerRow": 4,
    "cardMinWidth": "240px",
    "spacing": 12,
    "cards": [
      {
        "id": "project-identity",
        "title": "Project Identity",
        "icon": "ProjectOutlined",
        "fields": [
          {
            "label": "Project Name",
            "path": "summary.project_name",
            "icon": "FileTextOutlined",
            "format": "text"
          }
        ]
      }
    ]
  }
}
```

## Data Flow

1. **Fetch**: GET `/api/documents/{id}` with resolved placeholder
2. **Extract**: Apply `dataPath` to get nested data
3. **Resolve**: For each field, resolve `path` from data
4. **Format**: Apply format (text/date/number/tag)
5. **Render**: Display in card with icons and labels

## Placeholder Resolution

Automatically resolves URL placeholders like `{id}` from:

1. URL query parameters
2. Workspace session cache
3. Global portfolio selection
4. Context params (highest priority)

## Styling

Pure CSS modules using shadcn/ui design tokens:

- `hsl(var(--card))` - Card background
- `hsl(var(--card-foreground))` - Card text
- `hsl(var(--border))` - Borders
- `hsl(var(--primary))` - Icons and accents
- `hsl(var(--muted-foreground))` - Labels
- `var(--radius)` - Border radius

## Performance

- **React.memo**: All components memoized to prevent unnecessary re-renders
- **No complex state**: Simple data fetch, no sorting/filtering/grouping
- **CSS Grid**: Native browser layout, no JavaScript calculations
- **Minimal dependencies**: Only uses Ant Design primitives

## Testing Entry Points

Key functions to test:

- `formatValue()` - Value formatting logic
- `renderIcon()` - Icon rendering
- `resolvePath()` - Path resolution
- `validate()` - Schema validation
