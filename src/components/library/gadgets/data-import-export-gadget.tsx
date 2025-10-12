import React from 'react';
import { BaseGadget, GadgetConfig, GadgetContext, GadgetMetadata, GadgetSchema, GadgetType } from './base';
import { DataImportExportGadget as DataImportExportComponent } from './data-import-export';
import { DataImportExportConfig } from './data-import-export/types';

/**
 * Data Import/Export Gadget Class (Wrapper for Registry)
 */
export class DataImportExportGadget extends BaseGadget {
  metadata: GadgetMetadata = {
    id: 'data-import-export-gadget',
    name: 'Data Import/Export Gadget',
    description: 'Enterprise-grade data import/export with Excel support and column mapping',
    version: '2.0.0',
    author: 'IntelliSpec',
    category: 'data',
    tags: ['import', 'export', 'excel', 'data', 'batch'],
    gadgetType: GadgetType.FORM,
    widgetTypes: [],
  };

  schema: GadgetSchema = {
    type: 'object',
    properties: {
      documentType: { type: 'string' },
      allowImport: { type: 'boolean' },
      allowExport: { type: 'boolean' },
      exportFilename: { type: 'string' },
      documentTypeSelection: { type: 'object' },
      importConfig: { type: 'object' },
      aiConfig: { type: 'object' },
    },
    required: [],
    widgetSchemas: {},
  };

  renderBody(props: any, context?: GadgetContext): React.ReactNode {
    const config = props.config || props;
    const workspaceHeight = (context as any)?.containerHeight || 800;
    
    return <DataImportExportComponent config={config} workspaceHeight={workspaceHeight} />;
  }

  validate(config: GadgetConfig): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    const typedConfig = config as unknown as DataImportExportConfig;
    if (!typedConfig.documentTypeSelection && !typedConfig.documentType) {
        errors.push('Either "documentType" or "documentTypeSelection" must be configured.');
    }
    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  getRequiredWidgets(): string[] {
    return [];
  }

  getWidgetLayout() {
    return {};
  }

  processDataFlow(data: any) {
    return data;
  }
}
