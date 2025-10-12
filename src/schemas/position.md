# Unified Position System

## Overview

The unified position system consolidates all position-related interfaces across the codebase into a single, flexible system. This eliminates the confusion from having multiple position interfaces (`BasePosition`, `ComponentPosition`, `WidgetPosition`, `GadgetPosition`) scattered across different files.

## Problem Solved

**Before**: Multiple position interfaces in different files:
- `BasePosition` in `schemas/workspace/base.ts`
- `ComponentPosition` in `schemas/workspace.ts`
- `WidgetPosition` in `components/Shell.tsx`
- `GadgetPosition` type alias in `schemas/workspace.ts`

**After**: Single unified system in `schemas/position.ts` with:
- One `Position` interface supporting all use cases
- Utility functions for position handling
- Backward compatibility with all existing formats

## Key Features

### 1. Flexible Position Types
```typescript
// Simple width-only (supports flattened JSON structure)
const simplePosition: FlexiblePosition = 6;

// Full position object
const fullPosition: Position = {
  row: 0,
  col: 0,
  width: 12,
  height: 4,
  minHeight: 200
};
```

### 2. Multiple Layout Systems Support
```typescript
export interface Position {
  // Grid-based positioning (CSS Grid, Bootstrap Grid)
  row?: number;
  col?: number;
  
  // Coordinate-based positioning (absolute/relative)
  x?: number;
  y?: number;
  
  // Sizing
  width: number;
  height?: number;
  minHeight?: number;
  maxHeight?: number;
  
  // Legacy support
  span?: number;
}
```

### 3. Utility Functions
```typescript
// Normalize any position format
const normalized = PositionUtils.normalize(position);

// Extract specific values with fallbacks
const width = PositionUtils.getWidth(position);
const height = PositionUtils.getHeight(position, fallback);
const minHeight = PositionUtils.getMinHeight(position, fallback);

// Convert between coordinate systems
const coords = PositionUtils.gridToCoordinate(gridPosition);
const grid = PositionUtils.coordinateToGrid(coordPosition);

// Validate positions
const result = PositionUtils.validate(position);
```

### 4. Common Presets
```typescript
// Use predefined position configurations
const card = PositionPresets.HALF_WIDTH;     // { width: 6 }
const header = PositionPresets.FULL_WIDTH;   // { width: 12 }
const compact = PositionPresets.COMPACT;     // { width: 12, minHeight: 100 }
```

## Implementation Changes

### 1. Updated Schema Files
- **`schemas/position.ts`**: New unified position system
- **`schemas/workspace.ts`**: Imports and re-exports position types
- **`schemas/workspace/base.ts`**: Imports and re-exports position types
- **`schemas/workspace/gadget.ts`**: Uses new `GadgetPosition` type
- **`schemas/workspace/index.ts`**: Exports position system

### 2. Updated Component Files
- **`components/ui/workspace/GadgetWorkspaceRenderer.tsx`**: Uses `PositionUtils` 
- **`components/Shell.tsx`**: Uses unified `WidgetPosition` type

### 3. Updated JSON Data
- **`public/data/workspaces/equipment/tracking-home.json`**: Flattened position structure

## Usage Examples

### In Components
```typescript
import { Position, PositionUtils } from '../../schemas/position';

// Handle any position format
function renderGadget(position: FlexiblePosition) {
  const width = PositionUtils.getWidth(position);
  const minHeight = PositionUtils.getMinHeight(position);
  
  return (
    <div style={{ gridColumn: `span ${width}`, minHeight }}>
      {/* content */}
    </div>
  );
}
```

### In JSON Configuration
```json
{
  "gadgets": [
    {
      "id": "simple-gadget",
      "position": 6
    },
    {
      "id": "complex-gadget", 
      "position": {
        "width": 8,
        "height": 3,
        "minHeight": 200
      }
    }
  ]
}
```

## Migration Guide

### For Developers
1. **Import**: Use `import { Position, PositionUtils } from '../schemas/position'`
2. **Replace**: Replace old position interfaces with `Position` or `FlexiblePosition`
3. **Utilities**: Use `PositionUtils` methods instead of custom position handling
4. **Validation**: Use `PositionUtils.validate()` for position validation

### For JSON Data
1. **Flatten**: Convert `{ position: { width: 6 } }` to `{ position: 6 }`
2. **Extend**: Add `minHeight`, `maxHeight` as needed
3. **Validate**: Use position validation utilities

## Backward Compatibility

The system maintains full backward compatibility:
- All existing position formats work unchanged
- Legacy type aliases are preserved
- Existing JSON data continues to work
- No breaking changes to existing APIs

## Benefits

1. **Single Source of Truth**: All position logic in one place
2. **Consistent API**: Same utilities across all components
3. **Flexible Formats**: Supports simple numbers or complex objects
4. **Type Safety**: Strong TypeScript typing throughout
5. **Better Maintenance**: Easier to update and extend
6. **Validation**: Built-in position validation
7. **Conversion**: Easy conversion between coordinate systems 