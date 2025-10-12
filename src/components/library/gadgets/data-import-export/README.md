# Data Import/Export Gadget - Refactored Architecture

## Folder Structure

```
data-import-export/
├── index.tsx                      # Main component with layout
├── types.ts                       # TypeScript interfaces
├── steps/                         # Step components
│   ├── DocumentTypeSelection.tsx  # Step 1: Select data type
│   ├── FileUploadStep.tsx         # Step 2/3: Upload Excel file
│   ├── ColumnMappingStep.tsx      # TODO: Column mapping with AI
│   ├── ValidationStep.tsx         # TODO: Data validation
│   └── ImportResultsStep.tsx      # TODO: Import summary
├── utils/                         # Utility functions
│   ├── fieldUtils.ts              # Field operations
│   ├── importUtils.ts             # TODO: Import logic
│   └── validationUtils.ts         # TODO: Validation logic
└── styles/                        # Stylesheets
    └── DataImportExport.css       # Professional theme-based styling
```

## Architecture Features

### 1. **Fixed Header + Scrollable Body + Fixed Footer**
- Header contains title and stepper (always visible)
- Body scrolls independently with custom scrollbars
- Footer contains navigation buttons (always visible)
- Auto-calculates height based on workspace

### 2. **Modular Step Components**
Each step is a separate component:
- **DocumentTypeSelection**: Choose between Company, Site, Asset Group, Asset
- **FileUploadStep**: Drag & drop or click to upload Excel
- **ColumnMappingStep** (TODO): AI-powered column mapping
- **ValidationStep** (TODO): Preview and validate data
- **ImportResultsStep** (TODO): Show import results

### 3. **Professional UI/UX**
- Theme-based colors using HSL CSS variables
- Smooth animations and transitions
- State-of-the-art stepper design
- Responsive layout
- Accessible components

### 4. **Type Safety**
All components are fully typed with TypeScript interfaces defined in `types.ts`

## Usage

```tsx
import { DataImportExportGadget } from './data-import-export';

<DataImportExportGadget 
  config={config}
  workspaceHeight={600}
/>
```

## Configuration

The gadget accepts a `DataImportExportConfig` object:

```typescript
interface DataImportExportConfig {
  documentType: string;
  allowImport: boolean;
  allowExport: boolean;
  exportFilename: string;
  documentTypeSelection?: {
    enabled: boolean;
    title: string;
    description: string;
    options: DocumentTypeOption[];
  };
  importConfig?: ImportConfig;
  aiConfig?: AIConfig;
}
```

## Styling

All styles are in `styles/DataImportExport.css` and use theme CSS variables:

- `hsl(var(--primary))` - Primary color
- `hsl(var(--card))` - Card background
- `hsl(var(--border))` - Borders
- `hsl(var(--muted))` - Muted backgrounds
- `hsl(var(--foreground))` - Text color
- `hsl(var(--muted-foreground))` - Secondary text

## Completed Tasks

### DONE - High Priority
1. **ColumnMappingStep**: COMPLETED - AI mapping logic implemented
2. **ValidationStep**: COMPLETED - Validation logic implemented
3. **ImportResultsStep**: COMPLETED - Import results display implemented
4. **Parent Entity Selection**: COMPLETED - ParentEntitySelection component created
5. **Professional Font Sizes**: COMPLETED - ERP-appropriate typography applied

### TODO - Medium Priority
6. **File Processing**: Move Excel processing to utils/importUtils.ts
7. Extract validation logic to utils/validationUtils.ts
8. Add export functionality
9. Add import history
10. Improve error handling
11. Add unit tests

### TODO - Low Priority
12. Add drag & drop to upload zone
13. Add file preview before upload
14. Add undo/redo for imports
15. Add import templates

## Development Guide

### Adding a New Step

1. Create component in `steps/` folder:
```tsx
import React from 'react';

export const MyNewStep: React.FC<MyStepProps> = ({ onNext, onBack }) => {
  return (
    <div className="step-card">
      <div className="step-card-body">
        {/* Your content */}
      </div>
    </div>
  );
};
```

2. Add step to `steps` array in `index.tsx`
3. Add render logic in `renderStepContent()`

### Styling Guidelines

- Use CSS classes from `DataImportExport.css`
- Use theme variables for colors
- Follow the established card structure
- Maintain responsive design
- Add hover states for interactive elements
- Professional font sizes: Headers (18-24px), Body (14px), Small (12px)

## Known Issues

- File processing logic in old component (needs refactoring to utils/)
- Export functionality in old component (needs porting)
- All step components now implemented and functional
- Professional ERP typography applied throughout

## References

- Original component: `../data-import-export-gadget.tsx` (2451 lines - being deprecated)
- BaseGadget: `./base.tsx`
- Theme variables: Project-wide theme system
