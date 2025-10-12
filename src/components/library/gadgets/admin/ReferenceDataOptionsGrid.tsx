/**
 * Reference Data Options Grid
 * 
 * Specific implementation of InlineEditableGrid for reference data options.
 * This demonstrates how to use the generic grid with metadata configuration.
 */

import React from 'react';
import InlineEditableGrid, { type ColumnDefinition, type GridConfig, type CrudEndpoints } from '../display/InlineEditableGrid';

interface ReferenceDataOptionsGridProps {
  listTypeId: string;
  refreshTrigger?: number;
  onDataChange?: (data: any[]) => void;
}

const ReferenceDataOptionsGrid: React.FC<ReferenceDataOptionsGridProps> = ({
  listTypeId,
  refreshTrigger = 0,
  onDataChange
}) => {
  // Column definitions for reference data options
  const columns: ColumnDefinition[] = [
    {
      key: 'label',
      title: 'Label *',
      dataIndex: 'label',
      width: '25%',
      editable: true,
      required: true,
      type: 'text',
      placeholder: 'Enter label',
      validation: {
        min: 1,
        max: 100,
        message: 'Label must be between 1-100 characters'
      }
    },
    {
      key: 'value',
      title: 'Value *',
      dataIndex: 'value',
      width: '20%',
      editable: true,
      required: true,
      type: 'text',
      placeholder: 'Enter value',
      validation: {
        min: 1,
        max: 50,
        pattern: '^[a-zA-Z0-9_-]+$',
        message: 'Value must contain only letters, numbers, hyphens, and underscores'
      }
    },
    {
      key: 'description',
      title: 'Description',
      dataIndex: 'description',
      width: '30%',
      editable: true,
      required: false,
      type: 'text',
      placeholder: 'Enter description',
      validation: {
        max: 200,
        message: 'Description cannot exceed 200 characters'
      }
    },
    {
      key: 'sortOrder',
      title: 'Sort #',
      dataIndex: 'sortOrder',
      width: '10%',
      editable: true,
      required: false,
      type: 'number',
      placeholder: '#',
      validation: {
        min: 0,
        max: 9999,
        message: 'Sort order must be between 0-9999'
      }
    },
    {
      key: 'isActive',
      title: 'Status',
      dataIndex: 'isActive',
      width: '10%',
      editable: true,
      required: false,
      type: 'select',
      options: [
        { value: true, label: '✓ Active', color: 'green' },
        { value: false, label: '✗ Inactive', color: 'red' }
      ]
    }
  ];

  // CRUD endpoints configuration
  const endpoints: CrudEndpoints = {
    read: '/api/reference-data/options',      // GET /api/reference-data/options/{listTypeId}
    create: '/api/reference-data/options',    // POST /api/reference-data/options/{listTypeId}
    update: '/api/reference-data/options',    // PUT /api/reference-data/options/{optionId}
    delete: '/api/reference-data/options'     // DELETE /api/reference-data/options/{optionId}
  };

  // Grid configuration
  const config: GridConfig = {
    title: 'Options (Bulk Edit Mode)',
    subtitle: '',
    showInstructions: true,
    instructionsText: '💡 Bulk Edit: All fields are editable. Changed rows are highlighted in yellow. Use "Save All" to commit changes or "Reset Changes" to revert.',
    enableBulkActions: true,
    enableAdd: true,
    enableDelete: true,
    addButtonText: 'Add Option',
    saveAllButtonText: 'Save All',
    resetChangesButtonText: 'Reset Changes',
    newRecordDefaults: {
      label: 'New Option',
      value: `new_option_${Date.now()}`,
      description: '',
      sortOrder: 0,
      isActive: true
    },
    pagination: {
      pageSize: 10,
      showSizeChanger: true,
      showQuickJumper: true,
      showTotal: true
    },
    styling: {
      size: 'small',
      bordered: true,
      striped: false,
      scroll: { y: 400 }
    }
  };

  return (
    <InlineEditableGrid
      entityId={listTypeId}
      baseUrl=""
      endpoints={endpoints}
      columns={columns}
      config={config}
      refreshTrigger={refreshTrigger}
      onDataChange={onDataChange}
    />
  );
};

export default ReferenceDataOptionsGrid;
