/**
 * Type definitions for InlineEditableGrid
 * 
 * Exported types for use across the application when implementing
 * custom configurations for the generic grid component.
 */

import React from 'react';

// Generic data record interface
export interface DataRecord {
  [key: string]: any;
  _id?: string;
}

// Column definition interface
export interface ColumnDefinition {
  key: string;
  title: string;
  dataIndex: string;
  width?: string | number;
  editable?: boolean;
  required?: boolean;
  type: 'text' | 'number' | 'select' | 'date' | 'boolean' | 'email' | 'password';
  placeholder?: string;
  options?: Array<{ value: any; label: string; color?: string }>;
  optionsUrl?: string; // For dynamic options
  optionsValueField?: string; // Field name for option value
  optionsLabelField?: string; // Field name for option label (supports templates)
  optionValue?: string; // Legacy field name for option value
  optionLabel?: string; // Legacy field name for option label
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
    message?: string;
  };
  render?: ((value: any, record: DataRecord) => React.ReactNode) | string;
}

// CRUD endpoint configuration
export interface CrudEndpoints {
  read: string;    // GET {baseUrl}/{readEndpoint}/{entityId}
  create: string;  // POST {baseUrl}/{createEndpoint}
  update: string;  // PUT {baseUrl}/{updateEndpoint}/{recordId}
  delete: string;  // DELETE {baseUrl}/{deleteEndpoint}/{recordId}
}

// Grid configuration interface
export interface GridConfig {
  title?: string;
  subtitle?: string;
  showInstructions?: boolean;
  instructionsText?: string;
  enableBulkActions?: boolean;
  enableAdd?: boolean;
  enableDelete?: boolean;
  addButtonText?: string;
  saveAllButtonText?: string;
  resetChangesButtonText?: string;
  newRecordDefaults?: Partial<DataRecord>;
  embeddedMode?: boolean; // When true, operates as embedded widget in forms
  parentField?: string; // Field name in parent form to update
  pagination?: {
    pageSize?: number;
    showSizeChanger?: boolean;
    showQuickJumper?: boolean;
    showTotal?: boolean;
  };
  styling?: {
    size?: 'small' | 'middle' | 'large';
    bordered?: boolean;
    striped?: boolean;
    scroll?: { x?: number; y?: number };
  };
}

// Main component props
export interface InlineEditableGridProps {
  // Data source
  entityId?: string; // For read operations (e.g., listTypeId)
  baseUrl: string;
  endpoints: CrudEndpoints;
  
  // Configuration
  columns: ColumnDefinition[];
  config?: GridConfig;
  
  // Callbacks
  onDataChange?: (data: DataRecord[]) => void;
  onError?: (error: string) => void;
  onSuccess?: (message: string) => void;
  
  // External triggers
  refreshTrigger?: number;
  
  // Initial data (optional)
  initialData?: DataRecord[];
}

