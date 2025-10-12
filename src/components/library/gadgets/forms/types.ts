import React from 'react';

/**
 * Base interface for all gadget options
 */
export interface BaseGadgetOption {
  /** Unique identifier */
  id: string;
  /** Display title */
  title: string;
  /** Option type (section, group, or field type) */
  type: string;
  /** Size/width (using 12-column grid) */
  size: number;
  /** Icon name or React component */
  icon?: string | React.ReactNode;
}

/**
 * Section option interface
 */
export interface SectionOption extends BaseGadgetOption {
  type: 'section';
  /** Section description */
  description?: string;
  /** Section order */
  order?: number;
  /** Whether section is disabled */
  disabled?: boolean;
  /** URL to load section metadata from (for dynamic loading) */
  sectionOptionsUrl?: string;
}

/**
 * Group option interface
 */
export interface GroupOption extends BaseGadgetOption {
  type: 'group';
  /** Parent section ID */
  sectionId: string;
  /** Group description */
  description?: string;
  /** Group order within section */
  order?: number;
  /** Whether group is collapsible */
  collapsible?: boolean;
  /** Whether group is initially collapsed */
  defaultCollapsed?: boolean;
  /** Whether group is disabled */
  disabled?: boolean;
  /** Field to watch for conditional rendering */
  watchField?: string;
  /** Value that triggers showing this group */
  showWhen?: any;
  /** Whether to show the group when condition is met (default: true) */
  showOnMatch?: boolean;
}

/**
 * Conditional field configuration
 */
export interface ConditionalConfig {
  /** Field to watch for changes */
  watchField: string;
  /** Value that triggers showing this field */
  showWhen: any;
  /** Whether to show the field when condition is met (default: true) */
  showOnMatch?: boolean;
}

/**
 * Field option interface
 */
export interface FieldOption extends BaseGadgetOption {
  /** Parent section ID */
  sectionId: string;
  /** Parent group ID */
  groupId: string;
  /** Field label */
  label: string;
  /** Field placeholder */
  placeholder?: string;
  /** Field description/help text */
  description?: string;
  /** Field validation rules */
  required?: boolean;
  /** Field default value */
  defaultValue?: any;
  /** Field options (for select, radio, etc.) */
  options?: Array<{ label: string; value: any; [key: string]: any }>;
  /** URL to fetch options from */
  optionsDatasourceUrl?: string;
  /** JSON path to options in the fetched data */
  optionsPath?: string;
  /** Field disabled state */
  disabled?: boolean;
  /** Field read-only state */
  readOnly?: boolean;
  /** Custom field props */
  props?: Record<string, any>;
  /** Field validation function */
  validator?: (value: any) => { isValid: boolean; message?: string };
  /** Field transformation function */
  transform?: (value: any) => any;
  /** Custom render function */
  render?: (props: any) => React.ReactNode;
  /** Field to watch for conditional rendering */
  watchField?: string;
  /** Value that triggers showing this field */
  showWhen?: any;
  /** Whether to show the field when condition is met (default: true) */
  showOnMatch?: boolean;
  /** Additional field-specific properties */
  [key: string]: any;
}

/**
 * Union type for all gadget options
 */
export type GadgetOption = SectionOption | GroupOption | FieldOption;

/**
 * Form Section Configuration Interface
 * Defines sections that appear as left menu items
 */
export interface FormSection {
  /** Section identifier */
  id: string;
  /** Section title */
  title: string;
  /** Section icon (antd icon name or React component) */
  icon?: React.ReactNode;
  /** Section description */
  description?: string;
  /** Section order */
  order?: number;
  /** Section size/width */
  size?: number;
  /** Whether section is disabled */
  disabled?: boolean;
  /** Field to watch for conditional rendering */
  watchField?: string;
  /** Value that triggers showing this section */
  showWhen?: any;
  /** Whether to show the section when condition is met (default: true) */
  showOnMatch?: boolean;
  /** URL to load section metadata from (for dynamic loading) */
  sectionOptionsUrl?: string;
}

/**
 * Form Group Configuration Interface
 * Defines groups within sections that appear as cards
 */
export interface FormGroup {
  /** Group identifier */
  id: string;
  /** Group title */
  title: string;
  /** Group icon (antd icon name or React component) */
  icon?: React.ReactNode;
  /** Group description */
  description?: string;
  /** Group order within section */
  order?: number;
  /** Group width span (out of 12 columns) */
  span?: number;
  /** Group size/width */
  size?: number;
  /** Whether group is collapsible */
  collapsible?: boolean;
  /** Whether group is initially collapsed */
  defaultCollapsed?: boolean;
  /** Whether group is disabled */
  disabled?: boolean;
  /** Parent section ID (for API 510 format) */
  sectionId?: string;
  /** Field to watch for conditional rendering */
  watchField?: string;
  /** Value that triggers showing this group */
  showWhen?: any;
  /** Whether to show the group when condition is met (default: true) */
  showOnMatch?: boolean;
}

/**
 * Document Form Configuration Interface
 * Defines all configuration options for the document form gadget
 */
export interface DocumentFormConfig {
  /** URL to fetch metadata/schema from */
  dataUrl: string;
  /** JSON path to the data object */
  dataPath?: string;
  /** Form title */
  title?: string;
  /** Form description */
  description?: string;
  /** Form layout mode (default: 'vertical') */
  layout?: 'horizontal' | 'vertical' | 'inline';
  /** Form size (default: 'middle') */
  size?: 'small' | 'middle' | 'large';
  /** Enable form validation (default: true) */
  enableValidation?: boolean;
  /** Enable auto-save (default: false) */
  autoSave?: boolean;
  /** Auto-save interval in milliseconds (default: 30000) */
  autoSaveInterval?: number;
  /** Show save button (default: true) */
  showSaveButton?: boolean;
  /** Show reset button (default: true) */
  showResetButton?: boolean;
  /** Show clear button (default: false) */
  showClearButton?: boolean;
  /** Show cancel button (default: false) */
  showCancelButton?: boolean;
  /** Header action buttons configuration */
  headerActions?: {
    showClose?: boolean;
    showMaximize?: boolean;
    showMinimize?: boolean;
  };
  /** Cancel action configuration */
  onCancel?: {
    action?: 'navigate' | 'close';
    target?: string;
  };
  /** Full height mode */
  fullHeight?: boolean;
  /** Fit content mode */
  fitContent?: boolean;
  /** Flat array of gadget options (sections, groups, fields) */
  gadgetOptions?: GadgetOption[];
  /** Custom field configurations (legacy support) */
  fieldConfigs?: Record<string, FieldConfig>;
  /** Form sections configuration (legacy support) */
  sections?: Record<string, FormSection>;
  /** Form groups configuration (legacy support) */
  groups?: Record<string, FormGroup>;
  /** Section to groups mapping (legacy support) */
  sectionGroups?: Record<string, string[]>;
  /** Group to fields mapping (legacy support) */
  groupFields?: Record<string, string[]>;
  /** Fields to exclude from form */
  excludeFields?: string[];
  /** Fields to include (if specified, only these will be shown) */
  includeFields?: string[];
  /** Custom field order */
  fieldOrder?: string[];
  /** Read-only mode */
  readOnly?: boolean;
  /** Submit endpoint */
  submitUrl?: string;
  /** Submit method */
  submitMethod?: 'POST' | 'PUT' | 'PATCH';
  /** Success callback */
  onSuccess?: (data: any) => void;
  /** Error callback */
  onError?: (error: Error) => void;
  /** Change callback */
  onChange?: (data: any) => void;
  /** ID for edit mode */
  id?: string;
}

/**
 * Field Configuration Interface
 * Defines configuration for individual form fields
 */
export interface FieldConfig {
  /** Field widget type */
  type?: string;
  /** Field label */
  label?: string;
  /** Field placeholder */
  placeholder?: string;
  /** Field description/help text */
  description?: string;
  /** Field validation rules */
  required?: boolean;
  /** Field default value */
  defaultValue?: any;
  /** Field options (for select, radio, etc.) */
  options?: Array<{ label: string; value: any; [key: string]: any }>;
  /** URL to fetch options from */
  optionsUrl?: string;
  /** URL to fetch options from (new format) */
  optionsDatasourceUrl?: string;
  /** JSON path to options in the fetched data */
  optionsPath?: string;
  /** Field size */
  size?: 'small' | 'middle' | 'large' | number;
  /** Field width span (out of 12 columns) */
  span?: number;
  /** Section this field belongs to */
  section?: string;
  /** Group this field belongs to */
  group?: string;
  /** Section ID this field belongs to (for API 510 format) */
  sectionId?: string;
  /** Group ID this field belongs to (for API 510 format) */
  groupId?: string;
  /** Field disabled state */
  disabled?: boolean;
  /** Field read-only state */
  readOnly?: boolean;
  /** Custom field props */
  props?: Record<string, any>;
  /** Field validation function */
  validator?: (value: any) => { isValid: boolean; message?: string };
  /** Field transformation function */
  transform?: (value: any) => any;
  /** Custom render function */
  render?: (props: any) => React.ReactNode;
  /** Field to watch for conditional rendering */
  watchField?: string;
  /** Value that triggers showing this field */
  showWhen?: any;
  /** Whether to show the field when condition is met (default: true) */
  showOnMatch?: boolean;
  /** Formula for calculated fields */
  formula?: string;
  /** Whether this field is calculated (auto-updates based on formula) */
  calculated?: boolean;
  /** Auto-refresh calculated field when form data changes */
  autoRefresh?: boolean;
  /** Whether field should be disabled when pre-populated from URL parameters */
  disableWhenPrePopulated?: boolean;
  /** Field type to use when pre-populated (e.g., 'text' instead of 'select') */
  prePopulatedFieldType?: string;
  /** Label to show when field is pre-populated */
  prePopulatedLabel?: string;
  /** Field name in formData that contains the display value for pre-populated fields */
  prePopulatedDisplayField?: string;
  /** Configuration for fetching display names for pre-populated fields */
  fetchDisplayName?: {
    /** URL template to fetch display data (use {id} placeholder) */
    url: string;
    /** Field name in the response that contains the display value */
    displayField?: string;
    /** Field name in formData to store the display value */
    storeAs?: string;
  };
  
  // Dependent dropdown configuration
  /** Field ID that this field depends on for its options */
  dependsOn?: string;
  /** URL template for dependent options with {parentValue} placeholder */
  dependentOptionsUrl?: string;
  /** Reference list type name for dependent options */
  referenceListType?: string;
  /** Field name to use as value in options (for reference lists) */
  optionsValueField?: string;
  /** Field name to use as label in options (for reference lists) */
  optionsLabelField?: string;
  /** Query parameter name to filter options by parent value */
  filterBy?: string;
  
  /** Additional field-specific properties */
  [key: string]: any;
}

/**
 * Form Data Interface
 * Structure for form data state
 */
export interface FormData {
  [key: string]: any;
}

/**
 * Form Validation Result Interface
 */
export interface FormValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
  warnings: Record<string, string>;
}

/**
 * Extended Gadget State for Document Form
 */
export interface DocumentFormGadgetState {
  // Base GadgetState properties
  data: any;
  loading: boolean;
  error: string | null;
  lastFetch: number | null;
  
  // Document Form specific properties
  formData: FormData;
  originalData: FormData;
  metadata: any;
  fieldConfigs: Record<string, FieldConfig>;
  validationResult: FormValidationResult;
  isSubmitting: boolean;
  isDirty: boolean;
  lastSaved: Date | null;
  autoSaveStatus: 'idle' | 'saving' | 'saved' | 'error';
  /** Dynamic options loaded for fields */
  dynamicOptions: Record<string, Array<{ label: string; value: any; [key: string]: any }>>;
  /** Loading state for dynamic options */
  optionsLoading: Record<string, boolean>;
  /** Error state for dynamic options */
  optionsErrors: Record<string, string>;
  /** Form sections configuration */
  sections: Record<string, FormSection>;
  /** Form groups configuration */
  groups: Record<string, FormGroup>;
  /** Section to groups mapping */
  sectionGroups: Record<string, string[]>;
  /** Group to fields mapping */
  groupFields: Record<string, string[]>;
  /** Currently active section */
  activeSection: string | null;
  /** Collapsed state of groups */
  collapsedGroups: Record<string, boolean>;
}

/**
 * Wizard Configuration Interface
 * Defines wizard-specific configuration options
 */
export interface WizardConfig {
  /** Whether to show the stepper component */
  showStepper?: boolean;
  /** Whether to show progress bar */
  showProgress?: boolean;
  /** Whether to allow navigation between steps */
  allowStepNavigation?: boolean;
  /** Whether to validate on step change */
  validateOnStepChange?: boolean;
  /** Stepper size */
  stepperSize?: 'small' | 'default' | 'large';
}

/**
 * Wizard State Interface
 * Defines wizard-specific state properties
 */
export interface WizardState {
  /** Current step index */
  currentStep: number;
  /** Array of wizard steps */
  steps: WizardStep[];
  /** Set of completed step indices */
  completedSteps: Set<number>;
  /** Data for each step */
  stepData: Record<string, any>;
  /** Validation results for each step */
  stepValidation: Record<string, FormValidationResult>;
  /** Navigation history */
  navigationHistory: number[];
  /** Whether form is dirty */
  isDirty: boolean;
  /** Auto-save status */
  autoSaveStatus: 'idle' | 'saving' | 'saved' | 'error';
  /** Last saved timestamp */
  lastSaved: Date | null;
}

/**
 * Wizard Step Interface
 * Defines a single wizard step
 */
export interface WizardStep {
  /** Step identifier */
  id: string;
  /** Step title */
  title: string;
  /** Step description */
  description?: string;
  /** Step icon */
  icon?: string;
  /** Step order */
  order: number;
  /** Fields in this step */
  fields: Record<string, FieldConfig>;
}

/**
 * Extended Document Form Config with Wizard Support
 */
export interface ExtendedDocumentFormConfig extends DocumentFormConfig {
  /** Form mode - form or wizard */
  mode?: 'form' | 'wizard';
  /** Wizard-specific configuration */
  wizard?: WizardConfig;
  /** Whether to show stepper */
  showStepper?: boolean;
  /** Whether to show progress */
  showProgress?: boolean;
  /** Whether to allow step navigation */
  allowStepNavigation?: boolean;
  /** Whether to validate on step change */
  validateOnStepChange?: boolean;
  /** Stepper size */
  stepperSize?: string;
}

/**
 * Extended Document Form State with Wizard Support
 */
export interface ExtendedDocumentFormGadgetState extends DocumentFormGadgetState {
  /** Wizard-specific state */
  wizard?: WizardState;
  /** Current step index */
  currentStep?: number;
  /** Array of wizard steps */
  steps?: WizardStep[];
  /** Set of completed step indices */
  completedSteps?: Set<number>;
  /** Data for each step */
  stepData?: Record<string, any>;
  /** Validation results for each step */
  stepValidation?: Record<string, FormValidationResult>;
  /** Navigation history */
  navigationHistory?: number[];
} 