/**
 * Type definitions for Data Import/Export Gadget
 */

export interface DocumentTypeOption {
  value: string;
  label: string;
  description: string;
  icon: string;
  formPath: string;
  updateKey: string;
  exportFilename: string;
  parentEntities: ParentEntityConfig[];
  loadHierarchyFields?: boolean;
  hierarchyLevels?: string[];
}

export interface ParentEntityConfig {
  type: string;
  label: string;
  required: boolean;
  apiEndpoint: string;
  labelField: string;
  valueField: string;
  linkedField: string;
  filterByParent?: string;
}

export interface ColumnMapping {
  excelColumn: string;
  excelColumnIndex: number;
  dbField: string | null;
  sampleValues: any[];
  dataType: 'string' | 'number' | 'date' | 'boolean';
  required: boolean;
  mapped: boolean;
}

export interface AIMapping {
  excelColumn: string;
  dbField: string;
  confidence: number;
  reason: string;
}

export interface FieldDefinition {
  dbField: string;
  label: string;
  required: boolean;
  dataType: 'string' | 'number' | 'date' | 'boolean';
  aliases?: string[];
}

export interface ValidationError {
  row: number;
  column: string;
  error: string;
  value?: any;
  severity?: 'error' | 'warning';
}

export interface ImportResult {
  success: boolean;
  created: number;
  updated: number;
  skipped: number;
  failed: number;
  errors: ValidationError[];
}

export interface ImportSummary {
  total: number;
  created: number;
  updated: number;
  skipped: number;
  failed: number;
  errors: ValidationError[];
  createdIds?: string[];
  duration?: number;
}

export interface ImportConfig {
  documentType: string;
  allowCreate: boolean;
  allowUpdate: boolean;
  skipDuplicates: boolean;
  updateKey: string;
  skipFirstRow: boolean;
  fieldDefinitions?: FieldDefinition[];
}

export interface AIConfig {
  enabled: boolean;
  model: string;
  temperature: number;
  maxTokens: number;
  systemPrompt: string;
  userPromptTemplate: string;
  responseFormat?: { type: string };
}

export interface DataImportExportConfig {
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

export interface StepProps {
  onNext?: () => void;
  onBack?: () => void;
  onComplete?: () => void;
  data?: any;
  onDataChange?: (data: any) => void;
}
