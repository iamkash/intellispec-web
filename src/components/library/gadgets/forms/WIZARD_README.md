# Wizard Gadget

A powerful, metadata-driven wizard/stepper form gadget that creates multi-step forms with visual navigation, validation, and progress tracking.

## Features

- **Multi-step Navigation**: Visual stepper with step-by-step progression
- **Progress Tracking**: Real-time progress indicators and completion status
- **Step Validation**: Per-step validation with error handling and display
- **Conditional Steps**: Dynamic step visibility based on form data
- **Auto-save**: Optional automatic saving of form data
- **Responsive Design**: 12-column grid system for responsive layouts
- **All Input Types**: Support for all available input widgets
- **Accessibility**: ARIA-compliant with keyboard navigation
- **TypeScript**: Fully typed with comprehensive interfaces

## Architecture

The wizard gadget follows the same architecture as other gadgets in the framework:

- **WizardGadget**: Main gadget class extending BaseGadget
- **WizardRenderer**: React component for UI rendering
- **wizardTypes**: TypeScript interfaces and types
- **Metadata-driven**: Configuration via JSON metadata

## Configuration

### Basic Configuration

```json
{
  "type": "wizard-gadget",
  "config": {
    "dataUrl": "/api/wizard-data",
    "title": "User Registration Wizard",
    "description": "Complete the registration process step by step",
    "showStepper": true,
    "showProgress": true,
    "allowStepNavigation": true,
    "validateOnStepChange": true,
    "steps": [
      {
        "id": "personal-info",
        "title": "Personal Information",
        "description": "Enter your basic details",
        "icon": "UserOutlined",
        "order": 1,
        "fields": {
          "firstName": {
            "type": "text",
            "label": "First Name",
            "required": true,
            "span": 6
          }
        }
      }
    ]
  }
}
```

### Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `dataUrl` | string | required | URL to fetch/save wizard data |
| `title` | string | - | Wizard title |
| `description` | string | - | Wizard description |
| `showStepper` | boolean | true | Show step navigation |
| `showProgress` | boolean | true | Show progress bar |
| `allowStepNavigation` | boolean | true | Allow clicking on steps |
| `validateOnStepChange` | boolean | true | Validate before step change |
| `autoSave` | boolean | false | Enable auto-save |
| `autoSaveInterval` | number | 30000 | Auto-save interval (ms) |
| `showStepNumbers` | boolean | true | Show step numbers |
| `showStepDescriptions` | boolean | true | Show step descriptions |
| `allowBackNavigation` | boolean | true | Allow going back |
| `readOnly` | boolean | false | Read-only mode |
| `stepperPosition` | string | 'top' | Stepper position (top/left/right) |
| `stepperSize` | string | 'default' | Stepper size (small/default/large) |

### Step Configuration

Each step can be configured with:

```json
{
  "id": "step-id",
  "title": "Step Title",
  "description": "Step description",
  "icon": "IconName",
  "order": 1,
  "disabled": false,
  "fields": {
    "fieldName": {
      "type": "text",
      "label": "Field Label",
      "placeholder": "Placeholder text",
      "required": true,
      "span": 6,
      "defaultValue": "",
      "options": [],
      "validation": {
        "pattern": "^[a-zA-Z]+$",
        "message": "Only letters allowed"
      }
    }
  },
  "validation": {
    "rules": {},
    "messages": {}
  },
  "conditional": "expression",
  "autoSave": false,
  "showProgress": true
}
```

### Field Configuration

Fields support all input widget types with these common options:

| Option | Type | Description |
|--------|------|-------------|
| `type` | string | Widget type (text, email, select, etc.) |
| `label` | string | Field label |
| `placeholder` | string | Placeholder text |
| `description` | string | Field description |
| `required` | boolean | Required field |
| `defaultValue` | any | Default value |
| `span` | number | Grid span (1-12) |
| `disabled` | boolean | Disabled state |
| `readOnly` | boolean | Read-only state |
| `options` | array | Options for select/radio/checkbox |
| `validation` | object | Validation rules |

### Validation

Fields support multiple validation types:

```json
{
  "validation": {
    "required": true,
    "minLength": 3,
    "maxLength": 50,
    "pattern": "^[a-zA-Z]+$",
    "message": "Custom error message"
  }
}
```

## Usage Examples

### Simple Registration Wizard

```json
{
  "steps": [
    {
      "id": "personal",
      "title": "Personal Info",
      "fields": {
        "name": { "type": "text", "required": true, "span": 6 },
        "email": { "type": "email", "required": true, "span": 6 }
      }
    },
    {
      "id": "account",
      "title": "Account Setup",
      "fields": {
        "username": { "type": "text", "required": true, "span": 6 },
        "password": { "type": "password", "required": true, "span": 6 }
      }
    }
  ]
}
```

### Complex Multi-step Form

```json
{
  "steps": [
    {
      "id": "basic-info",
      "title": "Basic Information",
      "icon": "UserOutlined",
      "fields": {
        "firstName": { "type": "text", "required": true, "span": 6 },
        "lastName": { "type": "text", "required": true, "span": 6 },
        "email": { "type": "email", "required": true, "span": 12 },
        "phone": { "type": "phone", "span": 6 },
        "dateOfBirth": { "type": "date", "span": 6 }
      }
    },
    {
      "id": "preferences",
      "title": "Preferences",
      "icon": "SettingOutlined",
      "fields": {
        "theme": {
          "type": "select",
          "options": [
            { "label": "Light", "value": "light" },
            { "label": "Dark", "value": "dark" }
          ],
          "span": 6
        },
        "notifications": { "type": "switch", "span": 6 },
        "interests": { "type": "tags", "span": 12 }
      }
    },
    {
      "id": "verification",
      "title": "Verification",
      "icon": "CheckCircleOutlined",
      "fields": {
        "termsAccepted": { "type": "checkbox", "required": true, "span": 12 },
        "captcha": { "type": "text", "required": true, "span": 6 }
      }
    }
  ]
}
```

## API Reference

### WizardGadget Class

#### Methods

- `initializeWizardData(metadata, steps)`: Initialize wizard data from metadata
- `parseWizardOptions(options)`: Parse flat options into structured format
- `validateStep(stepId, stepData)`: Validate a specific step
- `canNavigateToStep(stepIndex)`: Check if step can be navigated to
- `navigateToStep(stepIndex)`: Navigate to a specific step
- `completeCurrentStep()`: Mark current step as completed
- `getStepProgress()`: Get step completion percentage
- `getWizardProgress()`: Get overall wizard progress

#### State Properties

- `wizardData`: Complete wizard data structure
- `currentStep`: Current active step index
- `completedSteps`: Set of completed step indices
- `stepData`: Data for each step
- `stepValidation`: Validation results for each step
- `isSubmitting`: Submission state
- `isDirty`: Data modification state

### WizardRenderer Component

#### Props

- `gadget`: WizardGadget instance
- `initialProps`: Initial props for the wizard

#### Features

- Visual stepper navigation
- Progress tracking
- Step content rendering
- Navigation buttons
- Error handling
- Auto-save status

## Styling

The wizard uses Ant Design components with custom CSS classes:

```css
.wizard-container {
  /* Main container styles */
}

.wizard-header {
  /* Header section styles */
}

.wizard-progress {
  /* Progress bar styles */
}

.wizard-stepper {
  /* Stepper navigation styles */
}

.wizard-step-card {
  /* Step content card styles */
}

.wizard-step-content {
  /* Step content styles */
}

.wizard-navigation {
  /* Navigation buttons styles */
}

.wizard-auto-save-status {
  /* Auto-save status styles */
}
```

## Accessibility

The wizard gadget includes:

- ARIA labels and descriptions
- Keyboard navigation support
- Screen reader compatibility
- Focus management
- Error announcements
- Progress announcements

## Performance

- Lazy loading of step content
- Memoized calculations
- Optimized re-renders
- Efficient state management
- Debounced auto-save

## Testing

The wizard gadget can be tested using:

```typescript
// Unit tests for gadget methods
describe('WizardGadget', () => {
  it('should validate steps correctly', () => {
    const gadget = new WizardGadget(config);
    const validation = gadget.validateStep('step-id', stepData);
    expect(validation.isValid).toBe(true);
  });
});

// Integration tests for renderer
describe('WizardRenderer', () => {
  it('should render steps correctly', () => {
    const { getByText } = render(<WizardRenderer gadget={gadget} />);
    expect(getByText('Step Title')).toBeInTheDocument();
  });
});
```

## Best Practices

1. **Step Organization**: Group related fields into logical steps
2. **Validation**: Use appropriate validation for each field type
3. **Progress**: Keep steps focused and manageable
4. **Navigation**: Allow users to go back and modify previous steps
5. **Feedback**: Provide clear error messages and progress indicators
6. **Accessibility**: Ensure keyboard navigation and screen reader support
7. **Performance**: Use conditional rendering for complex steps
8. **Data Management**: Implement proper save/load functionality

## Troubleshooting

### Common Issues

1. **Steps not rendering**: Check step configuration and field types
2. **Validation not working**: Verify validation rules and field requirements
3. **Navigation issues**: Ensure step order and completion logic
4. **Data not saving**: Check dataUrl and save implementation
5. **Performance problems**: Optimize step content and use memoization

### Debug Tips

- Enable console logging for debugging
- Check gadget state in React DevTools
- Verify metadata structure
- Test individual steps in isolation
- Monitor network requests for data operations

## Migration

To migrate from DocumentFormGadget to WizardGadget:

1. Convert form sections to wizard steps
2. Update field configurations
3. Implement step validation
4. Update data structure to step-based format
5. Test navigation and completion flow

## Future Enhancements

- Conditional step logic
- Dynamic step generation
- Advanced validation rules
- Step templates
- Multi-language support
- Custom step transitions
- Integration with external services 