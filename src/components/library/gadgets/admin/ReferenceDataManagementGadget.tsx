/**
 * Reference Data Management Gadget
 * 
 * Main container gadget that manages communication between the list selector
 * and options grid gadgets. Handles the 30%/70% layout split.
 */

import React, { useState } from 'react';
import { Row, Col } from 'antd';
import { BaseGadget, GadgetConfig, GadgetMetadata, GadgetSchema, GadgetType } from '../base';
import ReferenceListSelectorGadget from './ReferenceListSelectorGadget';
import ReferenceOptionsGridGadget from './ReferenceOptionsGridGadget';

interface ReferenceDataManagementProps {
  listTypesConfig?: any;
  optionsConfig?: any;
  aiConfig?: any;
}

const ReferenceDataManagementView: React.FC<ReferenceDataManagementProps> = ({
  listTypesConfig = {},
  optionsConfig = {},
  aiConfig = {}
}) => {
  const [selectedListType, setSelectedListType] = useState<any>(null);

  // Handle list type selection
  const handleListTypeSelection = (listType: any) => {
    setSelectedListType(listType);
  };

  // Default configurations
  const defaultListTypesConfig = {
    dataUrl: '/api/reference-data/list-types',
    searchPlaceholder: 'Search list types...',
    showCategories: true,
    showCreateButton: true,
    createButtonText: 'New List Type',
    ...listTypesConfig
  };

  const defaultOptionsConfig = {
    dataUrl: '/api/reference-data/options',
    showAIGenerate: true,
    aiGenerateButtonText: '🤖 AI Generate Options',
    columns: [
      {
        key: 'label',
        title: 'Label',
        width: 200,
        field: {
          type: 'text',
          required: true,
          placeholder: 'Display name for users',
          validation: { min: 1, max: 100 }
        }
      },
      {
        key: 'value',
        title: 'Value',
        width: 150,
        field: {
          type: 'text',
          required: true,
          placeholder: 'unique_value',
          validation: {
            pattern: '^[a-z0-9_-]+$',
            message: 'Only lowercase letters, numbers, hyphens and underscores allowed'
          }
        }
      },
      {
        key: 'description',
        title: 'Description',
        width: 250,
        field: {
          type: 'textarea',
          required: false,
          placeholder: 'Optional description'
        }
      },
      {
        key: 'sortOrder',
        title: 'Sort Order',
        width: 100,
        field: {
          type: 'number',
          required: false,
          placeholder: '0'
        }
      },
      {
        key: 'isActive',
        title: 'Active',
        width: 80,
        field: {
          type: 'select',
          required: true,
          options: [
            { value: true, label: 'Active' },
            { value: false, label: 'Inactive' }
          ]
        }
      }
    ],
    rowActions: [
      {
        key: 'edit',
        label: 'Edit',
        icon: 'EditOutlined',
        type: 'primary'
      },
      {
        key: 'delete',
        label: 'Delete',
        icon: 'DeleteOutlined',
        type: 'danger'
      },
      {
        key: 'duplicate',
        label: 'Duplicate',
        icon: 'CopyOutlined',
        type: 'default'
      }
    ],
    bulkActions: [
      {
        key: 'activate',
        label: 'Activate Selected',
        icon: 'CheckOutlined',
        type: 'primary'
      },
      {
        key: 'deactivate',
        label: 'Deactivate Selected',
        icon: 'StopOutlined',
        type: 'default'
      },
      {
        key: 'delete',
        label: 'Delete Selected',
        icon: 'DeleteOutlined',
        type: 'danger'
      }
    ],
    search: {
      placeholder: 'Search options by label or value...'
    },
    pagination: {
      pageSize: 20,
      showSizeChanger: true
    },
    ...optionsConfig
  };

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Row style={{ height: '100%' }}>
        {/* Left Panel - List Types (30%) */}
        <Col span={7} style={{ height: '100%', borderRight: '1px solid hsl(var(--border))' }}>
          {(() => {
            const listSelectorGadget = new ReferenceListSelectorGadget();
            return listSelectorGadget.renderBody({
              ...defaultListTypesConfig,
              onSelectionChange: handleListTypeSelection
            });
          })()}
        </Col>

        {/* Right Panel - Options (70%) */}
        <Col span={17} style={{ height: '100%' }}>
          {(() => {
            const optionsGridGadget = new ReferenceOptionsGridGadget();
            return optionsGridGadget.renderBody({
              ...defaultOptionsConfig,
              selectedListType,
              aiConfig
            });
          })()}
        </Col>
      </Row>
    </div>
  );
};

export default class ReferenceDataManagementGadget extends BaseGadget {
  metadata: GadgetMetadata = {
    id: 'reference-data-management-gadget',
    name: 'Reference Data Management',
    description: 'Complete reference data management with list types and options',
    version: '1.0.0',
    gadgetType: GadgetType.LAYOUT,
    widgetTypes: [],
  };

  schema: GadgetSchema = {
    type: 'object',
    properties: {
      listTypesConfig: { type: 'object' },
      optionsConfig: { type: 'object' },
      aiConfig: { type: 'object' }
    },
    required: [],
    widgetSchemas: {}
  };

  validate(config: GadgetConfig) { 
    return { isValid: true, errors: [] }; 
  }
  
  getRequiredWidgets(): string[] { 
    return []; 
  }
  
  getWidgetLayout(): Record<string, any> { 
    return { type: 'layout', height: '100%' }; 
  }
  
  processDataFlow(data: any): any { 
    return data; 
  }

  renderBody(props: any): React.ReactNode {
    return <ReferenceDataManagementView {...props} />;
  }
}
