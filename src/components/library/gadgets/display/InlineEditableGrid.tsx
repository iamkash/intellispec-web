/**
 * Generic Inline Editable Grid
 * 
 * A fully metadata-driven, reusable component for bulk editing tabular data.
 * Can be used across the application for any entity type with configurable CRUD operations.
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Table, Input, InputNumber, Select, Button, Space, message, Typography, DatePicker, Switch } from 'antd';
import { PlusOutlined, SaveOutlined, DeleteOutlined, CloseOutlined } from '@ant-design/icons';
import { BaseGadget } from '../base';
import dayjs from 'dayjs';
import type { 
  DataRecord, 
  ColumnDefinition, 
  CrudEndpoints, 
  GridConfig, 
  InlineEditableGridProps 
} from './InlineEditableGrid.types';

const { Text } = Typography;

const InlineEditableGrid: React.FC<InlineEditableGridProps> = ({
  entityId,
  baseUrl,
  endpoints,
  columns,
  config = {},
  onDataChange,
  onError,
  onSuccess,
  refreshTrigger = 0,
  initialData
}) => {
  const [data, setData] = useState<DataRecord[]>(initialData || []);
  const [filteredData, setFilteredData] = useState<DataRecord[]>(initialData || []);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [changedRows, setChangedRows] = useState<Set<string>>(new Set());
  const [dynamicOptions, setDynamicOptions] = useState<Record<string, any[]>>({});
  const [searchFilters, setSearchFilters] = useState<Record<string, string>>({});
  const loadedOptionsRef = useRef<Set<string>>(new Set());
  const initializedRef = useRef<boolean>(false);

  // Default configuration
  const gridConfig: Required<GridConfig> = {
    title: 'Data Grid',
    subtitle: '',
    showInstructions: true,
    instructionsText: '💡 Bulk Edit: All fields are editable. Changed rows are highlighted in yellow. Use "Save All" to commit changes or "Reset Changes" to revert.',
    enableBulkActions: true,
    enableAdd: true,
    enableDelete: true,
    addButtonText: 'Add Record',
    saveAllButtonText: 'Save All',
    resetChangesButtonText: 'Reset Changes',
    newRecordDefaults: {},
    embeddedMode: false,
    parentField: '',
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
    },
    ...config
  };

  // Load dynamic options for select fields
  const loadDynamicOptions = useCallback(async () => {
    const optionsToLoad = columns.filter(col => 
      col.optionsUrl && !loadedOptionsRef.current.has(col.key)
    );
if (optionsToLoad.length === 0) {
      return;
    }
    
    for (const column of optionsToLoad) {
      try {
        // Mark as loading to prevent duplicate requests
        loadedOptionsRef.current.add(column.key);
const response = await BaseGadget.makeAuthenticatedFetch(column.optionsUrl!);
if (response.ok) {
          const options = await response.json();
let processedOptions = Array.isArray(options) ? options : options.data || [];
          
          // Transform raw data into {value, label} format if needed
          if (processedOptions.length > 0 && processedOptions[0] && typeof processedOptions[0] === 'object' && !processedOptions[0].hasOwnProperty('label')) {
            processedOptions = processedOptions.map((item: any) => {
              const valueField = column.optionsValueField || column.optionValue || 'value';
              const labelField = column.optionsLabelField || column.optionLabel || 'label';
              
              let label = item[labelField] || item.name || item.label || item.title || String(item[valueField]);
              
              // Handle template strings like "{manufacturer} - {product} ({product_code})"
              if (typeof labelField === 'string' && labelField.includes('{') && labelField.includes('}')) {
                label = labelField.replace(/\{(\w+)\}/g, (match, fieldName) => {
                  return item[fieldName] || match;
                });
              }
              
              return {
                value: item[valueField] || item.id || item.value,
                label: label
              };
            });
          }
setDynamicOptions(prev => ({
            ...prev,
            [column.key]: processedOptions
          }));
        } else {
          console.error(`Failed to load options for ${column.key}: ${response.status}`);
          // Remove from loaded set if failed
          loadedOptionsRef.current.delete(column.key);
        }
      } catch (error) {
        console.error(`Failed to load options for ${column.key}:`, error);
        // Remove from loaded set if failed
        loadedOptionsRef.current.delete(column.key);
      }
    }
  }, [columns]); // Only depend on columns

  // Filter data based on search criteria
  const applyFilters = useCallback(() => {
if (Object.keys(searchFilters).length === 0 || Object.values(searchFilters).every(v => !v.trim())) {
      setFilteredData(data);
      return;
    }

    const filtered = data.filter(record => {
      return Object.entries(searchFilters).every(([columnKey, searchValue]) => {
        if (!searchValue.trim()) return true;
        
        const recordValue = record[columnKey];
        if (recordValue === null || recordValue === undefined) return false;
        
        // Convert to string and perform case-insensitive search
        const valueStr = String(recordValue).toLowerCase();
        const searchStr = searchValue.toLowerCase().trim();
        
        return valueStr.includes(searchStr);
      });
    });
setFilteredData(filtered);
  }, [data, searchFilters]);

  // Apply filters when data or search filters change
  useEffect(() => {
    applyFilters();
  }, [applyFilters]);

  // Handle search filter changes
  const handleSearchChange = useCallback((columnKey: string, value: string) => {
setSearchFilters(prev => ({
      ...prev,
      [columnKey]: value
    }));
  }, []);

  // Clear all search filters
  const clearAllFilters = useCallback(() => {
    setSearchFilters({});
  }, []);

  // Load data from API
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      if (initialData || gridConfig.embeddedMode) {
const dataToUse = initialData || [];
        setData(dataToUse);
        onDataChange?.(dataToUse);
      } else {
        const readUrl = `${baseUrl}${endpoints.read}${entityId ? `/${entityId}` : ''}`;
const response = await BaseGadget.makeAuthenticatedFetch(readUrl);
if (response.ok) {
          const result = await response.json();
const records = Array.isArray(result) ? result : result.data || [];
setData(records);
          onDataChange?.(records);
        } else {
          const errorMsg = `Failed to load data: ${response.status} ${response.statusText}`;
          onError?.(errorMsg);
          console.error(errorMsg);
        }
      }
    } catch (error) {
      const errorMsg = `Error loading data: ${error}`;
      onError?.(errorMsg);
      console.error(errorMsg);
    } finally {
      setLoading(false);
    }
  }, [entityId, baseUrl, endpoints.read, initialData, gridConfig.embeddedMode, onDataChange, onError]);

  // Load data and options on mount
  useEffect(() => {
    if (initializedRef.current) {
return;
    }
initializedRef.current = true;
    
    loadData();
    loadDynamicOptions();
  }, [loadData, loadDynamicOptions]);

  // Refresh when trigger changes
  useEffect(() => {
    if (refreshTrigger > 0) {
      loadData();
    }
  }, [refreshTrigger, loadData]);

  // Handle field changes
  const handleFieldChange = useCallback((recordId: string, field: string, value: any) => {
    setData(prevData => {
      const newData = [...prevData];
      const index = newData.findIndex(item => item._id === recordId);
      
      if (index > -1) {
        if (newData[index][field] !== value) {
          newData[index] = { ...newData[index], [field]: value };
          return newData;
        }
      }
      return prevData;
    });

    // Update changed rows separately to avoid triggering unnecessary re-renders
    setChangedRows(prev => {
      if (!prev.has(recordId)) {
        return new Set([...Array.from(prev), recordId]);
      }
      return prev;
    });
  }, []);

  // Save all changes
  const saveAllChanges = useCallback(async () => {
    if (changedRows.size === 0) {
      message.info('No changes to save');
      return;
    }

    // In embedded mode, just update the data and notify parent
    if (gridConfig.embeddedMode) {
      const updatedData = [...data];
      setChangedRows(new Set());
      onDataChange?.(updatedData);
      message.success('Changes saved locally');
      return;
    }

    setSaving(true);
    const errors: string[] = [];
    const savedRows: string[] = [];
    const updatedData = [...data];

    try {
      for (const rowId of Array.from(changedRows)) {
        const rowIndex = data.findIndex(item => item._id === rowId);
        const rowData = data[rowIndex];
        if (!rowData) continue;

        // Extract column data and include required metadata fields
        const recordData: any = {};
        columns.filter(col => col.editable !== false).forEach(col => {
          recordData[col.dataIndex] = rowData[col.dataIndex];
        });
        
        // Include type field if it exists (required for document API)
        if (rowData.type) {
          recordData.type = rowData.type;
        }

        try {
          if (rowData._isNew) {
            // Handle new record creation
            const createUrl = entityId 
              ? `${baseUrl}${endpoints.create}/${entityId}`
              : `${baseUrl}${endpoints.create}`;
console.log('🔵 Record data being sent:', recordData);
const response = await BaseGadget.makeAuthenticatedFetch(createUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(recordData)
            });

            if (response.ok) {
              const createdRecord = await response.json();
// Replace the temporary record with the real one
              updatedData[rowIndex] = {
                ...createdRecord,
                _id: createdRecord._id || createdRecord.id
              };
              
              savedRows.push(rowId);
            } else {
              const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
              errors.push(`Failed to create record: ${errorData.error || errorData.message || 'Unknown error'}`);
            }
          } else {
            // Handle existing record update
            const updateUrl = `${baseUrl}${endpoints.update}/${rowId}`;
            const response = await BaseGadget.makeAuthenticatedFetch(updateUrl, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(recordData)
            });

            if (response.ok) {
              const updatedRecord = await response.json();
              // Update the record with server response if available
              if (updatedRecord && typeof updatedRecord === 'object') {
                updatedData[rowIndex] = { ...updatedData[rowIndex], ...updatedRecord };
              }
              savedRows.push(rowId);
            } else {
              const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
              errors.push(`Failed to update record: ${errorData.error || errorData.message || 'Unknown error'}`);
            }
          }
        } catch (error) {
          errors.push(`Error saving record: ${error}`);
        }
      }

      if (savedRows.length > 0) {
        // Update the data with saved records
        setData(updatedData);
        setChangedRows(new Set(Array.from(changedRows).filter(id => !savedRows.includes(id))));
        const successMsg = `Successfully saved ${savedRows.length} record(s)`;
        message.success(successMsg);
        onSuccess?.(successMsg);
        onDataChange?.(updatedData);
      }

      if (errors.length > 0) {
        const errorMsg = `${errors.length} error(s): ${errors.join(', ')}`;
        message.error(errorMsg);
        onError?.(errorMsg);
      }
    } finally {
      setSaving(false);
    }
  }, [changedRows, data, columns, baseUrl, endpoints.create, endpoints.update, entityId, gridConfig.embeddedMode, onDataChange, onSuccess, onError]);

  // Reset changes
  const resetChanges = useCallback(() => {
    loadData();
    setChangedRows(new Set());
    message.info('All changes reset');
  }, [loadData]);

  // Delete record
  const handleDelete = useCallback(async (recordId: string) => {
    const recordToDelete = data.find(item => item._id === recordId);
    
    // Check if this is a system module that cannot be deleted/archived
    if (recordToDelete?.isSystemModule || recordToDelete?.key === 'system') {
      message.error('System Admin module cannot be deleted or archived');
      return;
    }

    try {
      // For modules, use soft delete (archive) instead of hard delete
      const isModuleEndpoint = endpoints.delete.includes('/modules');
      
      if (isModuleEndpoint) {
        // Use archive endpoint for soft delete
        const archiveUrl = `${baseUrl}${endpoints.delete}/${recordId}/archive`;
        const response = await BaseGadget.makeAuthenticatedFetch(archiveUrl, {
          method: 'POST'
        });

        if (response.ok) {
          // Update the record status to 'hidden' instead of removing it
          setData(prevData => {
            const newData = prevData.map(item => 
              item._id === recordId 
                ? { ...item, status: 'hidden' }
                : item
            );
            onDataChange?.(newData);
            return newData;
          });

          const successMsg = 'Module archived successfully';
          message.success(successMsg);
          onSuccess?.(successMsg);
        } else {
          const errorMsg = 'Failed to archive module';
          message.error(errorMsg);
          onError?.(errorMsg);
        }
      } else {
        // Standard hard delete for other entities
        // Optimistic update
        setData(prevData => {
          const newData = prevData.filter(item => item._id !== recordId);
          onDataChange?.(newData);
          return newData;
        });

        setChangedRows(prev => {
          const newSet = new Set(Array.from(prev));
          newSet.delete(recordId);
          return newSet;
        });

        const deleteUrl = `${baseUrl}${endpoints.delete}/${recordId}`;
        const response = await BaseGadget.makeAuthenticatedFetch(deleteUrl, {
          method: 'DELETE'
        });

        if (response.ok) {
          const successMsg = 'Record deleted successfully';
          message.success(successMsg);
          onSuccess?.(successMsg);
        } else {
          const errorMsg = 'Failed to delete record';
          message.error(errorMsg);
          onError?.(errorMsg);
          loadData(); // Rollback
        }
      }
    } catch (error) {
      const errorMsg = `Delete error: ${error}`;
      message.error(errorMsg);
      onError?.(errorMsg);
      if (!endpoints.delete.includes('/modules')) {
        loadData(); // Rollback for hard delete
      }
    }
  }, [baseUrl, endpoints.delete, data, onDataChange, onSuccess, onError, loadData]);

  // Add new record
  const handleAdd = useCallback(() => {
console.log('🔵 gridConfig.newRecordDefaults:', gridConfig.newRecordDefaults);
    
    // Generate a temporary ID for the new record
    const tempId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const newRecord: DataRecord = {
      _id: tempId,
      ...gridConfig.newRecordDefaults,
      // Set default values based on column types
      ...columns.reduce((defaults, col) => {
        if (col.editable !== false && !defaults[col.dataIndex]) {
          switch (col.type) {
            case 'text':
            case 'email':
            case 'password':
              defaults[col.dataIndex] = '';
              break;
            case 'number':
              defaults[col.dataIndex] = 0;
              break;
            case 'boolean':
              defaults[col.dataIndex] = false;
              break;
            case 'date':
              defaults[col.dataIndex] = new Date().toISOString().split('T')[0];
              break;
            case 'select':
              defaults[col.dataIndex] = col.options?.[0]?.value || '';
              break;
            default:
              defaults[col.dataIndex] = '';
          }
        }
        return defaults;
      }, {} as any),
      // Mark as new record for save handling
      _isNew: true
    };
// Add to local state
    const newData = [...data, newRecord];
    setData(newData);
    onDataChange?.(newData);

    // Mark as changed so it appears in the "Save All" batch
    setChangedRows(prev => new Set([...Array.from(prev), tempId]));

    message.info('New record added. Click "Save All" to save changes.');
  }, [data, columns, gridConfig.newRecordDefaults, onDataChange]);

  // Editable cell component
  const EditableCell: React.FC<{
    column: ColumnDefinition;
    record: DataRecord;
  }> = React.memo(({ column, record }) => {
    const value = record[column.dataIndex];
    const recordId = record._id!;
    const dataIndex = column.dataIndex;
    
    // Local state for input value to prevent focus loss
    const [localValue, setLocalValue] = React.useState(value ?? '');
    const timeoutRef = React.useRef<NodeJS.Timeout | null>(null);
    
    // Update local value when record value changes (from external updates)
    React.useEffect(() => {
      setLocalValue(value);
    }, [value]);
    
    const handleChange = useCallback((newValue: any) => {
      // Update local state immediately for responsive UI
      setLocalValue(newValue);
      
      // Debounce the actual data update to prevent focus loss
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      
      timeoutRef.current = setTimeout(() => {
        handleFieldChange(recordId, dataIndex, newValue);
      }, 300); // 300ms debounce
    }, [recordId, dataIndex, handleFieldChange]);
    
    const handleBlur = useCallback(() => {
      // Commit immediately on blur
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      handleFieldChange(recordId, dataIndex, localValue);
    }, [recordId, dataIndex, localValue, handleFieldChange]);

    const isChanged = changedRows.has(recordId);
    
    const commonStyle = React.useMemo(() => ({
      width: '100%',
      borderColor: isChanged ? 'hsl(var(--warning))' : 'hsl(var(--border))',
      backgroundColor: isChanged ? 'hsl(var(--warning) / 0.05)' : 'transparent'
    }), [isChanged]);

    // Get options for select fields
    const options = column.options || dynamicOptions[column.key] || [];

    switch (column.type) {
      case 'number':
        return (
          <InputNumber
            key={`${recordId}-${dataIndex}`}
            value={localValue}
            onChange={handleChange}
            onBlur={handleBlur}
            style={commonStyle}
            placeholder={column.placeholder}
            size="small"
            min={column.validation?.min}
            max={column.validation?.max}
          />
        );
        
      case 'select':
        return (
          <Select
            key={`${recordId}-${dataIndex}`}
            value={value}
            onChange={handleChange}
            style={commonStyle}
            size="small"
            placeholder={column.placeholder}
          >
            {options.map((option: any) => (
              <Select.Option key={option.value} value={option.value}>
                <span style={{ color: option.color || 'inherit' }}>
                  {option.label}
                </span>
              </Select.Option>
            ))}
          </Select>
        );
        
      case 'boolean':
        return (
          <Switch
            key={`${recordId}-${dataIndex}`}
            checked={value}
            onChange={handleChange}
            size="small"
          />
        );
        
      case 'date':
        return (
          <DatePicker
            key={`${recordId}-${dataIndex}`}
            value={value ? dayjs(value) : null}
            onChange={(date) => handleChange(date?.toDate())}
            style={commonStyle}
            size="small"
            placeholder={column.placeholder}
          />
        );
        
      case 'email':
        return (
          <Input
            key={`${recordId}-${dataIndex}`}
            type="email"
            value={localValue}
            onChange={(e) => handleChange(e.target.value)}
            onBlur={handleBlur}
            style={commonStyle}
            placeholder={column.placeholder}
            size="small"
          />
        );
        
      case 'password':
        return (
          <Input.Password
            key={`${recordId}-${dataIndex}`}
            value={localValue}
            onChange={(e) => handleChange(e.target.value)}
            onBlur={handleBlur}
            style={commonStyle}
            placeholder={column.placeholder}
            size="small"
          />
        );
        
      default: // text
        return (
          <Input
            key={`${recordId}-${dataIndex}`}
            value={localValue}
            onChange={(e) => handleChange(e.target.value)}
            onBlur={handleBlur}
            style={commonStyle}
            placeholder={column.placeholder}
            size="small"
          />
        );
    }
  }, (prevProps, nextProps) => {
    // Only re-render if the value for this specific field has changed
    const prevValue = prevProps.record[prevProps.column.dataIndex];
    const nextValue = nextProps.record[nextProps.column.dataIndex];
    const prevId = prevProps.record._id;
    const nextId = nextProps.record._id;
    const prevDataIndex = prevProps.column.dataIndex;
    const nextDataIndex = nextProps.column.dataIndex;
    
    return (
      prevId === nextId &&
      prevDataIndex === nextDataIndex &&
      prevValue === nextValue
    );
  });

  // Add display name for debugging
  EditableCell.displayName = 'EditableCell';

  // Build table columns (memoized to prevent re-creation)
  const tableColumns = React.useMemo(() => {
    const cols = columns.map(column => ({
      ...column,
      title: (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <div style={{ fontWeight: 600, fontSize: '12px' }}>
            {column.title}
          </div>
          {column.editable !== false && (
            <Input
              placeholder={`Search...`}
              value={searchFilters[column.dataIndex] || ''}
              onChange={(e) => {
                e.stopPropagation();
                handleSearchChange(column.dataIndex, e.target.value);
              }}
              onClick={(e) => e.stopPropagation()}
              onFocus={(e) => e.stopPropagation()}
              style={{ 
                fontSize: '11px',
                height: '24px'
              }}
              size="small"
              allowClear
            />
          )}
        </div>
      ),
      render: column.editable === false && column.render 
        ? (typeof column.render === 'function' 
            ? column.render 
            : (_: any, record: DataRecord) => {
                const value = record[column.dataIndex];
                // Handle string render types
                if (column.render === 'date' && value) {
                  return dayjs(value).format('YYYY-MM-DD HH:mm');
                }
                return value;
              })
        : (_: any, record: DataRecord) => (
            column.editable === false ? (
              typeof column.render === 'function' 
                ? column.render(record[column.dataIndex], record) 
                : record[column.dataIndex]
            ) : (
              <EditableCell column={column} record={record} />
            )
          )
    }));

    // Add actions column if delete is enabled
    if (gridConfig.enableDelete) {
      cols.push({
        key: 'actions',
        title: (
          <div style={{ fontWeight: 600, fontSize: '12px' }}>
            Actions
          </div>
        ),
        dataIndex: 'actions',
        width: '5%',
        editable: false,
        type: 'text' as const,
        render: (_: any, record: DataRecord) => (
          <Button
            type="link"
            size="small"
            icon={<DeleteOutlined />}
            onClick={() => handleDelete(record._id!)}
            style={{ 
              padding: '4px 8px', 
              color: 'hsl(var(--destructive))' 
            }}
          />
        )
      });
    }

    return cols;
  }, [columns, gridConfig.enableDelete, handleDelete, searchFilters, handleSearchChange]);

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ 
        padding: '16px', 
        borderBottom: '1px solid hsl(var(--border))',
        backgroundColor: 'hsl(var(--background))'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div>
              <Text strong style={{ fontSize: '16px', color: 'hsl(var(--foreground))' }}>
                {gridConfig.title}
              </Text>
              {gridConfig.subtitle && (
                <Text type="secondary" style={{ marginLeft: '8px', fontSize: '12px' }}>
                  {gridConfig.subtitle}
                </Text>
              )}
              <Text type="secondary" style={{ marginLeft: '8px', fontSize: '12px' }}>
                ({data.length} items)
              </Text>
            </div>
            
            {changedRows.size > 0 && (
              <div style={{
                padding: '4px 8px',
                backgroundColor: 'hsl(var(--warning) / 0.1)',
                border: '1px solid hsl(var(--warning))',
                borderRadius: '4px',
                fontSize: '12px',
                color: 'hsl(var(--warning-foreground))'
              }}>
                {changedRows.size} unsaved change(s)
              </div>
            )}
          </div>
          
          {/* Search Status and Clear All */}
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '8px',
            marginTop: '4px'
          }}>
            <Text style={{ fontSize: '11px', color: 'hsl(var(--muted-foreground))' }}>
              Showing {filteredData.length} of {data.length} records
            </Text>
            {Object.values(searchFilters).some(v => v.trim()) && (
              <Button 
                size="small" 
                type="link" 
                onClick={clearAllFilters}
                style={{ fontSize: '11px', padding: '0 4px' }}
              >
                Clear All Filters
              </Button>
            )}
          </div>
          
          <Space>
            {gridConfig.enableAdd && (
              <Button
                icon={<PlusOutlined />}
                onClick={handleAdd}
                style={{ borderRadius: '6px' }}
              >
                {gridConfig.addButtonText}
              </Button>
            )}
            
            {gridConfig.enableBulkActions && changedRows.size > 0 && (
              <>
                <Button
                  type="default"
                  icon={<CloseOutlined />}
                  onClick={resetChanges}
                  style={{ borderRadius: '6px' }}
                >
                  {gridConfig.resetChangesButtonText}
                </Button>
                <Button
                  type="primary"
                  icon={<SaveOutlined />}
                  onClick={saveAllChanges}
                  loading={saving}
                  style={{ borderRadius: '6px' }}
                >
                  {gridConfig.saveAllButtonText} ({changedRows.size})
                </Button>
              </>
            )}
          </Space>
        </div>
        
        {/* Instructions */}
        {gridConfig.showInstructions && (
          <div style={{ 
            marginTop: '12px', 
            fontSize: '12px', 
            color: 'hsl(var(--muted-foreground))',
            backgroundColor: 'hsl(var(--muted) / 0.1)',
            padding: '8px 12px',
            borderRadius: '4px',
            border: '1px solid hsl(var(--border))'
          }}>
            {gridConfig.instructionsText}
          </div>
        )}
      </div>

      {/* Table */}
      <div style={{ flex: 1, overflow: 'auto' }}>
        <style>
          {`
            .row-changed {
              background-color: hsl(48, 96%, 89%) !important;
            }
            .row-changed:hover {
              background-color: hsl(48, 96%, 84%) !important;
            }
            .row-normal:hover {
              background-color: hsl(var(--muted) / 0.05);
            }
          `}
        </style>
        <Table
          bordered={gridConfig.styling.bordered}
          dataSource={filteredData}
          columns={tableColumns}
          rowClassName={(record) => 
            changedRows.has(record._id!) ? 'row-changed' : 'row-normal'
          }
          pagination={gridConfig.pagination.showTotal ? {
            pageSize: gridConfig.pagination.pageSize,
            showSizeChanger: gridConfig.pagination.showSizeChanger,
            showQuickJumper: gridConfig.pagination.showQuickJumper,
            showTotal: (total, range) => `${range![0]}-${range![1]} of ${total} items`,
          } : false}
          loading={loading}
          rowKey="_id"
          size={gridConfig.styling.size}
          scroll={gridConfig.styling.scroll}
          style={{
            backgroundColor: 'hsl(var(--background))',
            border: '1px solid hsl(var(--border))'
          }}
        />
        
        {/* Row styling */}
        <style dangerouslySetInnerHTML={{
          __html: `
            .row-changed {
              background-color: hsl(var(--warning) / 0.05) !important;
            }
            .row-changed:hover {
              background-color: hsl(var(--warning) / 0.1) !important;
            }
            .row-normal:hover {
              background-color: hsl(var(--muted) / 0.1) !important;
            }
          `
        }} />
      </div>
    </div>
  );
};

export default InlineEditableGrid;

// Re-export types for convenience
export type { 
  DataRecord, 
  ColumnDefinition, 
  CrudEndpoints, 
  GridConfig, 
  InlineEditableGridProps 
} from './InlineEditableGrid.types';
