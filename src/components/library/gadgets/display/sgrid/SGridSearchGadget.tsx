import { DownloadOutlined } from '@ant-design/icons';
import {
  ColumnDef,
  ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable
} from '@tanstack/react-table';
import { Button, Dropdown, Form, Input, message, Modal, Popconfirm, Segmented, Select, Space, Typography } from 'antd';
import React, { useContext, useEffect, useMemo, useRef, useState } from 'react';
import * as XLSX from 'xlsx';
import WorkspaceFilterContext, { WorkspaceFilterContextValue } from '../../../../../contexts/WorkspaceFilterContext';
import { BaseGadgetContainer } from '../../../../ui/workspace/BaseGadgetContainer';
import { DatePickerWidget } from '../../../widgets/input/DatePickerWidget';
import { InputFieldWidget } from '../../../widgets/input/InputFieldWidget';
import { InputNumberWidget } from '../../../widgets/input/InputNumberWidget';
import { BaseGadget, GadgetConfig, GadgetMetadata, GadgetSchema, GadgetType } from '../../base';

const { Text } = Typography;

// Helper function to get nested values from objects
const getNestedValue = (obj: any, path: string): any => {
  try {
    const parts = path.split('.');
    let current = obj;
    for (const part of parts) {
      current = current?.[part];
    }
    return current;
  } catch {
    return undefined;
  }
};

// Stable Column Filter Component to maintain focus
const StableColumnFilter: React.FC<{
  columnId: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  filterRefs: React.MutableRefObject<Record<string, any>>;
  focusedColumn: string | null;
  setFocusedColumn: (columnId: string | null) => void;
}> = React.memo(({ columnId, placeholder, value, onChange, filterRefs, focusedColumn, setFocusedColumn }) => {
  const inputRef = useRef<any>(null);

  // Store ref in the parent refs object
  useEffect(() => {
    if (inputRef.current) {
      filterRefs.current[columnId] = inputRef.current;
    }
  }, [columnId, filterRefs]);

  // Restore focus when this column was previously focused
  useEffect(() => {
    if (focusedColumn === columnId && inputRef.current) {
      inputRef.current.focus();
    }
  }, [focusedColumn, columnId]);

  const handleFocus = () => {
    setFocusedColumn(columnId);
  };

  const handleBlur = () => {
    // Keep track of focused column briefly to allow focus restoration
    setTimeout(() => {
      if (focusedColumn === columnId) {
        setFocusedColumn(null);
      }
    }, 100);
  };

  return (
    <Input
      ref={inputRef}
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onFocus={handleFocus}
      onBlur={handleBlur}
      allowClear={true}
      size="small"
      style={{ fontSize: '11px' }}
    />
  );
});

interface ColumnMeta {
  key: string;
  title: string;
  width?: number;
  type?: 'text' | 'date' | 'status' | 'actions';
  field?: {
    type?: 'text' | 'email' | 'password' | 'select' | 'date' | 'number' | 'textarea';
    options?: string[] | { value: string; label: string }[];
    optionsUrl?: string; // URL to fetch options dynamically
    required?: boolean;
    placeholder?: string;
    validation?: {
      min?: number;
      max?: number;
      pattern?: string;
      message?: string;
    };
  };
  // Status column configuration
  statusConfig?: Record<string, { label: string; color: string }>;
  // Actions column configuration
  actions?: Array<{
    key: string;
    label: string;
    icon?: string;
    type?: 'primary' | 'default' | 'dashed' | 'link' | 'text' | 'danger';
    showWhen?: {
      field: string;
      operator: 'in' | 'not_exists' | 'equals';
      value?: any;
    };
    onClick?: {
      type: 'workspace' | 'action';
      workspace?: string;
      params?: Record<string, any>;
    };
    confirmText?: string;
  }>;
}

interface ToolbarConfig {
  enableCreate?: boolean;
  createButtonText?: string;
  createWorkspace?: string;
  createParams?: Record<string, any>;
  enableBulkDelete?: boolean;
  bulkDeleteText?: string;
  bulkDeleteConfirmText?: string;
  enableExport?: boolean;
  exportFileName?: string;
  exportFormats?: ('excel' | 'csv')[];
}

interface SearchConfig {
  placeholder?: string;
  enableColumnFilters?: boolean;
}

interface ViewFilter {
  key: string;
  label: string;
  filter: Record<string, any>;
}

interface SGridSearchViewProps {
  dataUrl?: string;
  data?: any[];
  columns?: ColumnMeta[];
  title?: string;
  description?: string;
  rowActions?: Array<any>;
  search?: SearchConfig;
  pagination?: Record<string, any> | undefined;
  hideCreateButton?: boolean;
  toolbar?: ToolbarConfig;
  viewFilters?: ViewFilter[];
  onNavigate?: (action: string, payload?: any) => void;
  fieldMappings?: Record<string, string>; // Maps filter IDs to API parameter names
  defaultSort?: { field: string; order: 'asc' | 'desc' }; // Default sorting configuration
  assetTypeWizardMapping?: Record<string, string>; // Maps asset types to wizard workspaces
}

const SGridSearchView: React.FC<SGridSearchViewProps> = ({
  dataUrl,
  data: injectedData,
  columns = [],
  title,
  description,
  rowActions = [],
  search,
  hideCreateButton = false,
  toolbar,
  viewFilters,
  onNavigate,
  fieldMappings,
  defaultSort,
  pagination: paginationConfig,
  assetTypeWizardMapping = {},
}) => {
  const [data, setData] = useState<any[]>(Array.isArray(injectedData) ? injectedData : []);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState('');
  const [activeViewFilter, setActiveViewFilter] = useState<string | null>(
    viewFilters && viewFilters.length > 0 ? viewFilters[0].key : null
  );
  const [serverPagination, setServerPagination] = useState({
    total: 0,
    pages: 0,
    currentPage: 1
  });

  // Initialize sorting with default sort if provided
  const initialSorting = useMemo<SortingState>(() => {
    if (defaultSort) {
      return [{
        id: defaultSort.field,
        desc: defaultSort.order === 'desc'
      }];
    }
    return [];
  }, [defaultSort]);

  const [sorting, setSorting] = useState<SortingState>(initialSorting);
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: paginationConfig?.pageSize || 10,
  });

  // Get workspace filter context
  const filterContext = useContext(WorkspaceFilterContext) as WorkspaceFilterContextValue | undefined;

  // Refs to maintain focus in column filter inputs
  const columnFilterRefs = useRef<Record<string, any>>({});
  const [focusedColumn, setFocusedColumn] = useState<string | null>(null);

  const [isModalVisible, setIsModalVisible] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit' | 'view'>('create');
  const [currentRecord, setCurrentRecord] = useState<any>(null);
  const [form] = Form.useForm();
  const [dynamicOptions, setDynamicOptions] = useState<Record<string, any[]>>({});
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);

  // Reset to first page when filters change
  useEffect(() => {
    setPagination(prev => ({ ...prev, pageIndex: 0 }));
  }, [query, columnFilters]);

  // Sync from injected data if provided by container
  useEffect(() => {
    if (Array.isArray(injectedData)) {
      setData(injectedData);
    }
  }, [injectedData]);

  // Initial load when component mounts
  useEffect(() => {
    if (Array.isArray(injectedData)) return; // data provided by container
    const load = async () => {
      setLoading(true);
      try {
        let items: any[] = [];
        if (dataUrl) {
          // Build URL with filter query parameters and pagination
          const url = new URL(dataUrl, window.location.origin);
          
          // Add dynamic filter from the active view filter
          if (activeViewFilter) {
            const view = viewFilters?.find(vf => vf.key === activeViewFilter);
            if (view?.filter) {
              url.searchParams.set('dynamicFilter', JSON.stringify(view.filter));
            }
          }

          // Add pagination parameters
          url.searchParams.set('page', String(pagination.pageIndex + 1));
          url.searchParams.set('limit', String(pagination.pageSize));
          
          // Add filter parameters
          const filterQuery = filterContext?.getFilterQuery?.() || {};
          Object.entries(filterQuery).forEach(([filterId, value]) => {
            if (value !== undefined && value !== null && value !== '') {
              // Map filter ID to API parameter name using fieldMappings
              const apiParam = fieldMappings?.[filterId] || filterId;
              url.searchParams.set(apiParam, String(value));
            }
          });
          
          const fetchUrl = url.toString();
          console.log('[SGridSearchGadget] Making API call (initial load):', fetchUrl);
          const res = await BaseGadget.makeAuthenticatedFetch(fetchUrl);
          if (!res.ok) {
            throw new Error(`Request failed: ${res.status} ${res.statusText}`);
          }
          const contentType = res.headers.get('content-type') || '';
          if (!contentType.includes('application/json')) {
            const text = await res.text();
            const snippet = text.slice(0, 120).replace(/\n/g, ' ');
            throw new Error(`Expected JSON but received '${contentType}'. Response starts with: ${snippet}`);
          }
          const json = await res.json();
          
          // Handle server-side pagination response
          if (json.data && Array.isArray(json.data)) {
            items = json.data;
            const paginationData = json.pagination || {};
            setServerPagination({
              total: paginationData.total || json.data.length,
              pages: paginationData.totalPages || Math.ceil((paginationData.total || json.data.length) / pagination.pageSize),
              currentPage: paginationData.page || pagination.pageIndex + 1
            });
          } else {
            // Fallback for non-paginated responses
            items = Array.isArray(json) ? json :
                    (Array.isArray(json.items) ? json.items : []);
            setServerPagination({
              total: items.length,
              pages: 1,
              currentPage: 1
            });
          }

          // Optional client-side prefix filtering support via query param
          try {
            const url = new URL(fetchUrl, window.location.origin);
            const prefix = url.searchParams.get('prefix');
            if (prefix) {
              items = items.filter((it: any) => typeof it?.id === 'string' && it.id.startsWith(prefix));
            }
          } catch {
            // ignore URL parse errors
          }
        }
        setData(items);
      } catch (e: any) {
        message.error(e?.message || 'Failed to load');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [dataUrl, injectedData, fieldMappings, pagination.pageIndex, pagination.pageSize, activeViewFilter]); // Include pagination in dependencies

  // Listen to filter changes via refreshTrigger
  useEffect(() => {
    if (Array.isArray(injectedData)) return; // data provided by container
    if (filterContext?.refreshTrigger !== undefined && filterContext.refreshTrigger > 0) {
      console.log('[SGridSearchGadget] Filter changed, triggering reload:', filterContext.refreshTrigger);
      const load = async () => {
        setLoading(true);
        try {
          let items: any[] = [];
          if (dataUrl) {
            // Build URL with filter query parameters and pagination
            const url = new URL(dataUrl, window.location.origin);
            
            // Add dynamic filter from the active view filter
            if (activeViewFilter) {
              const view = viewFilters?.find(vf => vf.key === activeViewFilter);
              if (view?.filter) {
                url.searchParams.set('dynamicFilter', JSON.stringify(view.filter));
              }
            }

            // Add pagination parameters
            url.searchParams.set('page', String(pagination.pageIndex + 1));
            url.searchParams.set('limit', String(pagination.pageSize));
            
            // Add filter parameters
            const filterQuery = filterContext?.getFilterQuery?.() || {};
            Object.entries(filterQuery).forEach(([filterId, value]) => {
              if (value !== undefined && value !== null && value !== '') {
                // Map filter ID to API parameter name using fieldMappings
                const apiParam = fieldMappings?.[filterId] || filterId;
                url.searchParams.set(apiParam, String(value));
              }
            });
            
            const fetchUrl = url.toString();

          console.log('[SGridSearchGadget] Making API call (filter reload):', fetchUrl);
          const res = await BaseGadget.makeAuthenticatedFetch(fetchUrl);
            if (!res.ok) {
              throw new Error(`Request failed: ${res.status} ${res.statusText}`);
            }
            const contentType = res.headers.get('content-type') || '';
            if (!contentType.includes('application/json')) {
              const text = await res.text();
              const snippet = text.slice(0, 120).replace(/\n/g, ' ');
              throw new Error(`Expected JSON but received '${contentType}'. Response starts with: ${snippet}`);
            }
            const json = await res.json();
            
            // Handle server-side pagination response
            if (json.data && Array.isArray(json.data)) {
              items = json.data;
              const paginationData = json.pagination || {};
              setServerPagination({
                total: paginationData.total || json.data.length,
                pages: paginationData.totalPages || Math.ceil((paginationData.total || json.data.length) / pagination.pageSize),
                currentPage: paginationData.page || pagination.pageIndex + 1
              });
            } else {
              // Fallback for non-paginated responses
              items = Array.isArray(json) ? json :
                      (Array.isArray(json.items) ? json.items : []);
              setServerPagination({
                total: items.length,
                pages: 1,
                currentPage: 1
              });
            }

            // Optional client-side prefix filtering support via query param
            try {
              const url = new URL(fetchUrl, window.location.origin);
              const prefix = url.searchParams.get('prefix');
              if (prefix) {
                items = items.filter((it: any) => typeof it?.id === 'string' && it.id.startsWith(prefix));
              }
            } catch {
              // ignore URL parse errors
            }
          }
          setData(items);
        } catch (e: any) {
          message.error(e?.message || 'Failed to load');
        } finally {
          setLoading(false);
        }
      };
      load();
    }
  }, [dataUrl, injectedData, fieldMappings, filterContext?.refreshTrigger, activeViewFilter]);

  // TanStack Table handles filtering automatically - no custom filtered data needed

  // Using TanStack Table's built-in column filtering - no custom handler needed

  const tanCols = useMemo<ColumnDef<any, any>[]>(() => {
    // Add selection column if bulk delete is enabled
    const defs: ColumnDef<any, any>[] = [];
    
    if (toolbar?.enableBulkDelete) {
      defs.push({
        id: 'select',
        header: ({ table }) => (
          <input
            type="checkbox"
            checked={table.getIsAllRowsSelected()}
            onChange={table.getToggleAllRowsSelectedHandler()}
            style={{ cursor: 'pointer' }}
          />
        ),
        cell: ({ row }) => (
          <input
            type="checkbox"
            checked={selectedRows.includes(row.original._id || row.original.id)}
            onChange={(e) => {
              const id = row.original._id || row.original.id;
              if (e.target.checked) {
                setSelectedRows(prev => [...prev, id]);
              } else {
                setSelectedRows(prev => prev.filter(rowId => rowId !== id));
              }
            }}
            style={{ cursor: 'pointer' }}
          />
        ),
        size: 50
      });
    }
    
  // Add data columns
  const dataCols: ColumnDef<any, any>[] = (columns as ColumnMeta[]).map((c) => ({
    id: c.key,
    header: search?.enableColumnFilters ? ({ column }: any) => (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <div style={{ fontWeight: 600, fontSize: '12px' }}>{c.title}</div>
        <StableColumnFilter
          columnId={c.key}
          placeholder={`Filter ${c.title.toLowerCase()}...`}
          value={(column.getFilterValue() as string) || ''}
          onChange={(value) => column.setFilterValue(value)}
          filterRefs={columnFilterRefs}
          focusedColumn={focusedColumn}
          setFocusedColumn={setFocusedColumn}
        />
      </div>
    ) : c.title,
    accessorFn: (row: any) => {
      try {
        const parts = c.key.split('.');
        let cur: any = row;
        for (const p of parts) cur = cur?.[p];
        return cur;
      } catch { return undefined; }
    },
      cell: (ctx: any) => {
        const value = ctx.getValue();
        const record = ctx.row.original;

        // Handle actions column
        if (c.type === 'actions' && c.actions) {
          return (
            <Space>
              {c.actions.map((action: any) => {
                // Check if action should be shown based on showWhen condition
                if (action.showWhen) {
                  const { field, operator, value: expectedValue } = action.showWhen;
                  const fieldValue = getNestedValue(record, field);
                  
                  let shouldShow = false;
                  switch (operator) {
                    case 'in':
                      shouldShow = Array.isArray(expectedValue) && expectedValue.includes(fieldValue);
                      break;
                    case 'not_exists':
                      shouldShow = fieldValue === undefined || fieldValue === null;
                      break;
                    case 'equals':
                      shouldShow = fieldValue === expectedValue;
                      break;
                    default:
                      shouldShow = true;
                  }
                  
                  if (!shouldShow) return null;
                }

                // Get wizard mapping for create action
                let workspace = action.onClick?.workspace;
                if (action.key === 'create_inspection' && workspace === '{wizard_mapping}') {
                  const assetType = record.asset_type;
                  const wizardMapping = assetTypeWizardMapping || {};
                  
                  // Try exact match first
                  let mappedWorkspace = wizardMapping[assetType];
                  
                  // If no exact match, try case-insensitive match
                  if (!mappedWorkspace) {
                    const lowerAssetType = assetType?.toLowerCase();
                    for (const [key, value] of Object.entries(wizardMapping)) {
                      if (key.toLowerCase() === lowerAssetType) {
                        mappedWorkspace = value;
                        break;
                      }
                    }
                  }
                  
                  // If still no match, try partial matching for common patterns
                  if (!mappedWorkspace && assetType) {
                    const lowerAssetType = assetType.toLowerCase();
                    
                    // Heat exchanger patterns
                    if (lowerAssetType.includes('exchanger') || lowerAssetType.includes('boiler') || 
                        lowerAssetType.includes('heater') || lowerAssetType.includes('condenser') ||
                        lowerAssetType.includes('evaporator') || lowerAssetType.includes('cooler')) {
                      mappedWorkspace = 'intelliINSPECT/heat-exchanger-boiler-wizard';
                    }
                    // Pressure vessel patterns
                    else if (lowerAssetType.includes('vessel') || lowerAssetType.includes('tank') || 
                             lowerAssetType.includes('separator') || lowerAssetType.includes('drum') ||
                             lowerAssetType.includes('reactor') || lowerAssetType.includes('column') ||
                             lowerAssetType.includes('tower') || lowerAssetType.includes('scrubber') ||
                             lowerAssetType.includes('absorber')) {
                      mappedWorkspace = 'intelliINSPECT/pressure-vessel-tank-wizard';
                    }
                    // Piping patterns
                    else if (lowerAssetType.includes('pipe') || lowerAssetType.includes('pipeline') ||
                             lowerAssetType.includes('ducting')) {
                      mappedWorkspace = 'intelliINSPECT/pipework-inspection-wizard';
                    }
                    // Rotating equipment patterns
                    else if (lowerAssetType.includes('pump') || lowerAssetType.includes('compressor') ||
                             lowerAssetType.includes('turbine') || lowerAssetType.includes('motor') ||
                             lowerAssetType.includes('fan') || lowerAssetType.includes('blower')) {
                      mappedWorkspace = 'intelliINSPECT/rotating-equipment-wizard';
                    }
                  }
                  
                  workspace = mappedWorkspace || 'intelliINSPECT/pressure-vessel-tank-wizard'; // default fallback
                }

                const buttonProps = {
                  key: action.key,
                  size: 'small' as const,
                  type: action.type === 'danger' ? 'default' as const : (action.type as any),
                  danger: action.type === 'danger',
                  icon: action.icon ? React.createElement(require('@ant-design/icons')[action.icon]) : undefined,
                  onClick: () => {
                    if (action.onClick?.type === 'workspace') {
                      // Handle workspace navigation with parameters
                      const params = action.onClick.params || {};
                      const resolvedParams = Object.keys(params).reduce((acc, key) => {
                        const paramValue = params[key];
                        if (typeof paramValue === 'string' && paramValue.startsWith('{') && paramValue.endsWith('}')) {
                          const fieldName = paramValue.slice(1, -1);
                          acc[key] = getNestedValue(record, fieldName);
                        } else {
                          acc[key] = paramValue;
                        }
                        return acc;
                      }, {} as any);

                      // Navigate to workspace with parameters
                      window.location.href = `/?workspace=${workspace}&${new URLSearchParams(resolvedParams).toString()}`;
                    } else {
                      handleRowAction(action.key, record);
                    }
                  }
                };

                if (action.confirmText) {
                  return (
                    <Popconfirm
                      key={action.key}
                      title={action.confirmText}
                      onConfirm={() => {
                        if (action.onClick?.type === 'workspace') {
                          const params = action.onClick.params || {};
                          const resolvedParams = Object.keys(params).reduce((acc, key) => {
                            const paramValue = params[key];
                            if (typeof paramValue === 'string' && paramValue.startsWith('{') && paramValue.endsWith('}')) {
                              const fieldName = paramValue.slice(1, -1);
                              acc[key] = getNestedValue(record, fieldName);
                            } else {
                              acc[key] = paramValue;
                            }
                            return acc;
                          }, {} as any);
                          window.location.href = `/?workspace=${workspace}&${new URLSearchParams(resolvedParams).toString()}`;
                        } else {
                          handleRowAction(action.key, record);
                        }
                      }}
                    >
                      <Button {...buttonProps}>
                        {action.label || action.key}
                      </Button>
                    </Popconfirm>
                  );
                } else {
                  return (
                    <Button {...buttonProps}>
                      {action.label || action.key}
                    </Button>
                  );
                }
              })}
            </Space>
          );
        }

        // Handle status column
        if (c.type === 'status' && c.statusConfig) {
          const statusConfig = c.statusConfig[value] || { label: value, color: 'default' };
          return (
            <span style={{ 
              color: statusConfig.color === 'gray' ? '#666' : 
                     statusConfig.color === 'blue' ? '#1890ff' :
                     statusConfig.color === 'green' ? '#52c41a' : '#000',
              fontWeight: 500
            }}>
              {statusConfig.label}
            </span>
          );
        }

        // Format date values
        let displayValue = value;
        if (value && (c.key.includes('Date') || c.key.includes('date') || c.key.includes('created') || c.key.includes('updated'))) {
          try {
            const date = new Date(value);
            if (!isNaN(date.getTime())) {
              displayValue = date.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
              });
            }
          } catch (e) {
            // Keep original value if formatting fails
          }
        }

        // Make row clickable for edit if rowActions include edit
        const hasEditAction = rowActions.some(action => action.key === 'edit');
        if (hasEditAction) {
          return (
            <div
              style={{ cursor: 'pointer', width: '100%' }}
              onClick={() => handleRowAction('edit', ctx.row.original)}
            >
              {String(displayValue ?? '')}
            </div>
          );
        }
        return String(displayValue ?? '');
      },
      filterFn: 'includesString'
    }));
    
    defs.push(...dataCols);
    if (rowActions && rowActions.length > 0) {
      defs.push({
        id: 'actions',
        header: 'Actions',
        cell: (ctx: any) => {
          const record = ctx.row.original;
          return (
            <Space>
              {rowActions.map((action: any) => {
                const buttonProps = {
                  key: action.key,
                  size: 'small' as const,
                  type: action.type === 'danger' ? 'default' as const : (action.type as any),
                  danger: action.type === 'danger',
                  onClick: () => handleRowAction(action.key, record)
                };

                if (action.confirmText) {
                  return (
                    <Popconfirm
                      key={action.key}
                      title={action.confirmText}
                      onConfirm={() => handleRowAction(action.key, record)}
                    >
                      <Button {...buttonProps}>
                        {action.label || action.key}
                      </Button>
                    </Popconfirm>
                  );
                } else {
                  return (
                    <Button {...buttonProps}>
                      {action.label || action.key}
                    </Button>
                  );
                }
              })}
            </Space>
          );
        }
      });
    }
    return defs;
  }, [columns, rowActions, toolbar?.enableBulkDelete, search?.enableColumnFilters, selectedRows, columnFilters, StableColumnFilter, columnFilterRefs, focusedColumn, setFocusedColumn]);

  const table = useReactTable({
    data: data,
    columns: tanCols,
    state: {
      sorting,
      columnFilters,
      globalFilter: query,
      pagination
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setQuery,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    globalFilterFn: 'includesString',
    // Server-side pagination configuration
    manualPagination: true,
    pageCount: serverPagination.pages
  });

  // Load dynamic options for select fields
  const loadDynamicOptions = async (col: ColumnMeta) => {
    if (col.field?.optionsUrl && !dynamicOptions[col.key]) {
      try {
        
        const response = await BaseGadget.makeAuthenticatedFetch(col.field.optionsUrl);
        if (response.ok) {
          const options = await response.json();
          
          setDynamicOptions(prev => ({
            ...prev,
            [col.key]: Array.isArray(options) ? options : options.data || []
          }));
        } else {
          console.error(`Failed to load options for ${col.key}: ${response.status} ${response.statusText}`);
        }
      } catch (error) {
        console.error(`Failed to load options for ${col.key}:`, error);
      }
    }
  };

  // Load all dynamic options when modal opens
  const loadAllDynamicOptions = async () => {
    const selectColumns = columns.filter(col => 
      col.field?.type === 'select' && col.field?.optionsUrl
    );
    
    await Promise.all(selectColumns.map(col => loadDynamicOptions(col)));
  };

  // Resolve display values for form fields (convert IDs to display names)
  const resolveDisplayValues = (record: any) => {
    const resolvedRecord = { ...record };
    
    columns.forEach(col => {
      if (col.field?.type === 'select' && col.field?.optionsUrl && dynamicOptions[col.key]) {
        const options = dynamicOptions[col.key];
        const currentValue = record[col.key];
        
        // Find the option that matches the current value
        const matchingOption = options.find((opt: any) => 
          (typeof opt === 'string' ? opt : opt.value) === currentValue
        );
        
        if (matchingOption) {
          // Keep the original value for form submission
          resolvedRecord[col.key] = currentValue;
        }
      }
    });
    
    return resolvedRecord;
  };

  // Generate form fields based on column metadata
  const generateFormFields = () => {
    return columns
      .filter(col => col.key !== '_id' && col.key !== 'actions') // Exclude system fields
      .map(col => {
        const fieldName = col.key;
        const fieldLabel = col.title;
        const fieldConfig = col.field;
        
        // Load dynamic options if needed
        if (fieldConfig?.optionsUrl) {
          loadDynamicOptions(col);
        }
        
        // Determine field type - prioritize metadata, fallback to smart detection
        let fieldType = fieldConfig?.type;
        if (!fieldType) {
          // Smart detection as fallback
          if (fieldName.toLowerCase().includes('email')) fieldType = 'email';
          else if (fieldName.toLowerCase().includes('password')) fieldType = 'password';
          else if (fieldName.toLowerCase().includes('status') || fieldName.toLowerCase().includes('role')) fieldType = 'select';
          else if (fieldName.toLowerCase().includes('date') || fieldName.toLowerCase().includes('time')) fieldType = 'date';
          else fieldType = 'text';
        }
        
        // Generate field component based on type using framework widgets
        let fieldComponent;
        const placeholder = fieldConfig?.placeholder || `Enter ${fieldLabel.toLowerCase()}`;
        
        switch (fieldType) {
          case 'email':
            fieldComponent = (
              <InputFieldWidget
                type="email"
                placeholder={placeholder}
                required={fieldConfig?.required}
                validator={fieldConfig?.validation ? (value: string) => {
                  const { min, max, pattern } = fieldConfig.validation!;
                  if (min && value.length < min) return { isValid: false, message: `Minimum ${min} characters` };
                  if (max && value.length > max) return { isValid: false, message: `Maximum ${max} characters` };
                  if (pattern && !new RegExp(pattern).test(value)) return { isValid: false, message: fieldConfig.validation!.message || 'Invalid format' };
                  return { isValid: true };
                } : undefined}
              />
            );
            break;
          case 'password':
            fieldComponent = (
              <InputFieldWidget
                type="password"
                placeholder={placeholder}
                required={fieldConfig?.required}
                validator={fieldConfig?.validation ? (value: string) => {
                  const { min, max, pattern } = fieldConfig.validation!;
                  if (min && value.length < min) return { isValid: false, message: `Minimum ${min} characters` };
                  if (max && value.length > max) return { isValid: false, message: `Maximum ${max} characters` };
                  if (pattern && !new RegExp(pattern).test(value)) return { isValid: false, message: fieldConfig.validation!.message || 'Invalid format' };
                  return { isValid: true };
                } : undefined}
              />
            );
            break;
          case 'number':
            fieldComponent = (
              <InputNumberWidget
                placeholder={placeholder}
                required={fieldConfig?.required}
                min={fieldConfig?.validation?.min}
                max={fieldConfig?.validation?.max}
              />
            );
            break;
          case 'textarea':
            fieldComponent = (
              <InputFieldWidget
                type="text"
                placeholder={placeholder}
                required={fieldConfig?.required}
                style={{ minHeight: '80px' }}
              />
            );
            break;
          case 'date':
            fieldComponent = (
              <DatePickerWidget
                placeholder={placeholder}
                required={fieldConfig?.required}
                style={{ width: '100%' }}
              />
            );
            break;
          case 'select':
            let options = fieldConfig?.options || [];
            
            // Use dynamic options if available
            if (fieldConfig?.optionsUrl && dynamicOptions[col.key]) {
              options = dynamicOptions[col.key];
            }
            
            // Fallback to smart defaults if no options defined
            if (options.length === 0) {
              if (fieldName.toLowerCase().includes('status')) {
                options = [
                  { value: 'active', label: 'Active' },
                  { value: 'inactive', label: 'Inactive' },
                  { value: 'suspended', label: 'Suspended' },
                  { value: 'pending', label: 'Pending' }
                ];
              } else if (fieldName.toLowerCase().includes('role')) {
                options = [
                  { value: 'admin', label: 'Administrator' },
                  { value: 'user', label: 'User' },
                  { value: 'manager', label: 'Manager' },
                  { value: 'viewer', label: 'Viewer' }
                ];
              }
            }
            
            fieldComponent = (
              <Select
                placeholder={`Select ${fieldLabel.toLowerCase()}`}
                allowClear={true}
                showSearch={true}
                style={{ width: '100%' }}
                loading={Boolean(fieldConfig?.optionsUrl && !dynamicOptions[col.key])}
                filterOption={(input, option) =>
                  String(option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                }
              >
                {options.map((opt: any) => {
                  const value = typeof opt === 'string' ? opt : opt.value;
                  const label = typeof opt === 'string' ? opt : opt.label;
                  return (
                    <Select.Option key={value} value={value}>
                      {label}
                    </Select.Option>
                  );
                })}
              </Select>
            );
            break;
          default:
            fieldComponent = (
              <InputFieldWidget
                type="text"
                placeholder={placeholder}
                required={fieldConfig?.required}
                validator={fieldConfig?.validation ? (value: string) => {
                  const { min, max, pattern } = fieldConfig.validation!;
                  if (min && value.length < min) return { isValid: false, message: `Minimum ${min} characters` };
                  if (max && value.length > max) return { isValid: false, message: `Maximum ${max} characters` };
                  if (pattern && !new RegExp(pattern).test(value)) return { isValid: false, message: fieldConfig.validation!.message || 'Invalid format' };
                  return { isValid: true };
                } : undefined}
              />
            );
        }

        // Build validation rules
        const rules: any[] = [];
        
        // Required validation
        const isRequired = fieldConfig?.required !== undefined 
          ? fieldConfig.required 
          : (fieldName.includes('name') || fieldName.includes('email')); // Smart default
          
        if (isRequired) {
          rules.push({ 
            required: true, 
            message: fieldConfig?.validation?.message || `${fieldLabel} is required` 
          });
        }
        
        // Additional validation rules
        if (fieldConfig?.validation) {
          const { min, max, pattern } = fieldConfig.validation;
          if (min !== undefined) rules.push({ min, message: `Minimum ${min} characters` });
          if (max !== undefined) rules.push({ max, message: `Maximum ${max} characters` });
          if (pattern) rules.push({ pattern: new RegExp(pattern), message: fieldConfig.validation.message || 'Invalid format' });
        }

        return (
          <Form.Item
            key={fieldName}
            name={fieldName}
            label={fieldLabel}
            rules={rules}
          >
            {fieldComponent}
          </Form.Item>
        );
      });
  };

  // Handle create action
  const handleCreate = async () => {
    if (toolbar?.createWorkspace && onNavigate) {
      // Navigate to create workspace
      onNavigate('navigate', {
        workspace: toolbar.createWorkspace,
        params: toolbar.createParams || { mode: 'create' }
      });
    } else {
      // Fallback to modal
      setModalMode('create');
      setCurrentRecord(null);
      form.resetFields();
      setIsModalVisible(true);
      // Load dynamic options when modal opens
      await loadAllDynamicOptions();
    }
  };

  // Export handlers - fetch ALL data from server before exporting
  const handleExportExcel = async () => {
    try {
      message.loading('Fetching all data for export...', 0);
      
      // Fetch all data without pagination
      const exportUrl = new URL(dataUrl || '', window.location.origin);
      exportUrl.searchParams.set('limit', '10000'); // Large limit to get all records
      exportUrl.searchParams.delete('page');
      
      // Add current filters
      if (query) {
        exportUrl.searchParams.set('search', query);
      }
      if (activeViewFilter && viewFilters) {
        const activeFilter = viewFilters.find(f => f.key === activeViewFilter);
        if (activeFilter) {
          exportUrl.searchParams.set('dynamicFilter', JSON.stringify(activeFilter.filter));
        }
      }
      
      // Apply workspace filters if available
      const workspaceFilters = filterContext?.filters || {};
      const mappedFilters: Record<string, any> = {};
      if (fieldMappings) {
        Object.entries(workspaceFilters).forEach(([key, value]) => {
          const mappedKey = fieldMappings[key] || key;
          mappedFilters[mappedKey] = value;
        });
      }
      
      const response = await BaseGadget.makeAuthenticatedFetch(exportUrl.toString());
      const result = await response.json();
      const allData = Array.isArray(result) ? result : (result.data || []);
      
      message.destroy();
      
      const exportData = allData.map((item: any) => {
        const rowData: any = {};
        columns.forEach(col => {
          const value = col.key.includes('.') 
            ? col.key.split('.').reduce((obj, key) => obj?.[key], item)
            : item[col.key];
          rowData[col.title] = value ?? '';
        });
        return rowData;
      });

      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Data');
      
      const fileName = `${toolbar?.exportFileName || 'export'}_${new Date().toISOString().split('T')[0]}.xlsx`;
      XLSX.writeFile(wb, fileName);
      
      message.success(`Exported ${exportData.length} records to Excel`);
    } catch (error) {
      message.destroy();
      console.error('Export error:', error);
      message.error('Failed to export data');
    }
  };

  const handleExportCSV = async () => {
    try {
      message.loading('Fetching all data for export...', 0);
      
      // Fetch all data without pagination
      const exportUrl = new URL(dataUrl || '', window.location.origin);
      exportUrl.searchParams.set('limit', '10000'); // Large limit to get all records
      exportUrl.searchParams.delete('page');
      
      // Add current filters
      if (query) {
        exportUrl.searchParams.set('search', query);
      }
      if (activeViewFilter && viewFilters) {
        const activeFilter = viewFilters.find(f => f.key === activeViewFilter);
        if (activeFilter) {
          exportUrl.searchParams.set('dynamicFilter', JSON.stringify(activeFilter.filter));
        }
      }
      
      // Apply workspace filters if available
      const workspaceFilters = filterContext?.filters || {};
      const mappedFilters: Record<string, any> = {};
      if (fieldMappings) {
        Object.entries(workspaceFilters).forEach(([key, value]) => {
          const mappedKey = fieldMappings[key] || key;
          mappedFilters[mappedKey] = value;
        });
      }
      
      const response = await BaseGadget.makeAuthenticatedFetch(exportUrl.toString());
      const result = await response.json();
      const allData = Array.isArray(result) ? result : (result.data || []);
      
      message.destroy();
      
      const exportData = allData.map((item: any) => {
        const rowData: any = {};
        columns.forEach(col => {
          const value = col.key.includes('.') 
            ? col.key.split('.').reduce((obj, key) => obj?.[key], item)
            : item[col.key];
          rowData[col.title] = value ?? '';
        });
        return rowData;
      });

      const ws = XLSX.utils.json_to_sheet(exportData);
      const csv = XLSX.utils.sheet_to_csv(ws);
      
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `${toolbar?.exportFileName || 'export'}_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      message.success(`Exported ${exportData.length} records to CSV`);
    } catch (error) {
      message.destroy();
      console.error('Export error:', error);
      message.error('Failed to export data');
    }
  };

  // Handle bulk delete
  const handleBulkDelete = async () => {
    if (selectedRows.length === 0) {
      message.warning('Please select rows to delete');
      return;
    }

    try {
      const baseUrl = dataUrl?.split('/').slice(0, -1).join('/') || '';
      const errors: string[] = [];
      
      for (const rowId of selectedRows) {
        try {
          const deleteUrl = `${baseUrl}/${rowId}`;
          const response = await BaseGadget.makeAuthenticatedFetch(deleteUrl, {
            method: 'DELETE'
          });
          
          if (!response.ok) {
            const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
            errors.push(`Failed to delete ${rowId}: ${errorData.error || 'Unknown error'}`);
          }
        } catch (error) {
          errors.push(`Error deleting ${rowId}: ${error}`);
        }
      }

      if (errors.length === 0) {
        // Remove deleted rows from local state
        setData(prev => prev.filter(item => !selectedRows.includes(item._id || item.id)));
        setSelectedRows([]);
        message.success(`Successfully deleted ${selectedRows.length} record(s)`);
      } else {
        message.error(`${errors.length} error(s) occurred: ${errors.join(', ')}`);
        // Reload data to sync with server
        const load = async () => {
          // Reload logic here - simplified for now
          window.location.reload();
        };
        load();
      }
    } catch (error) {
      message.error(`Bulk delete failed: ${error}`);
    }
  };

  // Handle form submission
  const handleFormSubmit = async () => {
    try {
      const values = await form.validateFields();
      const baseUrl = dataUrl?.split('/').slice(0, -1).join('/') || '';
      
      if (modalMode === 'create') {
        const response = await BaseGadget.makeAuthenticatedFetch(baseUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(values)
        });
        
        if (response.ok) {
          const newRecord = await response.json();
          setData(prev => [...prev, newRecord]);
          message.success('Created successfully');
        } else {
          throw new Error('Create failed');
        }
      } else if (modalMode === 'edit') {
        const response = await BaseGadget.makeAuthenticatedFetch(`${baseUrl}/${currentRecord._id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(values)
        });
        
        if (response.ok) {
          const updatedRecord = await response.json();
          setData(prev => prev.map(item => 
            item._id === currentRecord._id ? updatedRecord : item
          ));
          message.success('Updated successfully');
        } else {
          throw new Error('Update failed');
        }
      }
      
      setIsModalVisible(false);
    } catch (error) {
      message.error(`Failed to ${modalMode}`);
    }
  };

  // Get clean modal title from dataUrl
  const getModalTitle = () => {
    if (!dataUrl) return 'Record';
    
    try {
      // Remove query parameters and get the last meaningful part
      const cleanUrl = dataUrl.split('?')[0]; // Remove refresh parameters
      const parts = cleanUrl.split('/');
      const lastPart = parts[parts.length - 1];
      
      // Handle specific known patterns
      if (cleanUrl.includes('/reference-data/options/')) {
        return 'Option';
      }
      if (cleanUrl.includes('/reference-data/list-types')) {
        return 'List Type';
      }
      if (cleanUrl.includes('/admin/tenants')) {
        return 'Tenant';
      }
      if (cleanUrl.includes('/admin/users')) {
        return 'User';
      }
      if (cleanUrl.includes('/admin/roles')) {
        return 'Role';
      }
      
      // If the last part looks like an ID (long alphanumeric), use the second-to-last part
      if (lastPart && lastPart.length > 20 && /^[a-f0-9]+$/.test(lastPart)) {
        const resourceName = parts[parts.length - 2] || 'Record';
        return resourceName.charAt(0).toUpperCase() + resourceName.slice(1);
      }
      
      // Otherwise use the last part and clean it up
      return lastPart ? lastPart.charAt(0).toUpperCase() + lastPart.slice(1) : 'Record';
    } catch {
      return 'Record';
    }
  };

  // Handle row actions
  const handleRowAction = async (action: string, record: any) => {
    const baseUrl = dataUrl?.split('/').slice(0, -1).join('/') || '';
    
    // Find the action configuration
    const actionConfig = rowActions.find(a => a.key === action);

    if (actionConfig?.workspace && onNavigate) {
      // Navigate to workspace with parameters
      const params = { ...actionConfig.params };

      // Substitute parameter placeholders
      Object.keys(params).forEach(key => {
        if (typeof params[key] === 'string') {
          params[key] = params[key].replace(/{(\w+)}/g, (match: string, field: string) => {
            return record[field] || match;
          });
        }
      });

      onNavigate('navigate', {
        workspace: actionConfig.workspace,
        params
      });
      return;
    }

    // Handle conditional workspace mapping based on workspaceId
    if (actionConfig?.conditional && onNavigate) {
      const { conditional } = actionConfig;
      let targetWorkspace = null;

      if (conditional.workspaceMapping) {
        // Check if we have a workspaceId field that directly matches
        if (record.workspaceId && conditional.workspaceMapping[record.workspaceId]) {
          targetWorkspace = conditional.workspaceMapping[record.workspaceId];
        }
        // Fallback to field-based mapping if workspaceId doesn't match
        else if (conditional.field && record[conditional.field] && conditional.workspaceMapping[record[conditional.field]]) {
          targetWorkspace = conditional.workspaceMapping[record[conditional.field]];
        }
        // Fallback to formData field-based mapping
        else if (conditional.field && record.formData && record.formData[conditional.field] && conditional.workspaceMapping[record.formData[conditional.field]]) {
          targetWorkspace = conditional.workspaceMapping[record.formData[conditional.field]];
        }
      }

      if (targetWorkspace) {
        // Add inspection ID as parameter for opening existing document
        const params = { ...actionConfig.params };
        
        // Substitute parameter placeholders (same as regular workspace routing)
        Object.keys(params).forEach(key => {
          if (typeof params[key] === 'string') {
            params[key] = params[key].replace(/{(\w+)}/g, (match: string, field: string) => {
              return record[field] || match;
            });
          }
        });

        onNavigate('navigate', {
          workspace: targetWorkspace,
          params
        });
        return;
      }
    }
    
    switch (action) {
      case 'edit':
        setModalMode('edit');
        setCurrentRecord(record);
        setIsModalVisible(true);
        // Load dynamic options first, then set form values
        loadAllDynamicOptions().then(() => {
          const resolvedValues = resolveDisplayValues(record);
          form.setFieldsValue(resolvedValues);
        });
        break;
      case 'delete':
        try {
          const deleteUrl = `${baseUrl}/${record._id}`;
          
          
          // Optimistically remove from UI first for instant feedback
          setData(prev => prev.filter((item: any) => item._id !== record._id));
          
          const response = await BaseGadget.makeAuthenticatedFetch(deleteUrl, {
            method: 'DELETE'
          });
          
          
          
          if (response.ok) {
            message.success('Deleted successfully');
          } else {
            // If API call failed, restore the record to the grid
            setData(prev => [...prev, record]);
            const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
            console.error('Delete error response:', errorData);
            message.error(`Delete failed: ${errorData.error || 'Unknown error'}`);
          }
        } catch (error) {
          // If API call failed, restore the record to the grid
          setData(prev => [...prev, record]);
          console.error('Delete error:', error);
          message.error(`Failed to delete: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
        break;
      case 'view':
        // Open in modal for viewing
        setModalMode('view');
        setCurrentRecord(record);
        setIsModalVisible(true);
        // Load dynamic options first, then set form values
        loadAllDynamicOptions().then(() => {
          const resolvedValues = resolveDisplayValues(record);
          form.setFieldsValue(resolvedValues);
        });
        break;
      default:
        
    }
  };

  return (
    <BaseGadgetContainer title={title} subtitle={description} loading={loading} noPadding>
      <div style={{ padding: '12px' }}>
        <div style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: search?.enableColumnFilters ? 12 : 0 }}>
            <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flex: 1 }}>
              <div style={{ maxWidth: 300 }}>
                <Input
                  placeholder={search?.placeholder || 'Search...'}
                  value={table.getState().globalFilter || ''}
                  onChange={(e) => table.setGlobalFilter(e.target.value)}
                  allowClear={true}
                />
              </div>
              {viewFilters && viewFilters.length > 0 && (
                <Segmented
                  options={viewFilters.map(vf => ({ label: vf.label, value: vf.key }))}
                  value={activeViewFilter}
                  onChange={(value) => setActiveViewFilter(String(value))}
                />
              )}
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              {(toolbar?.enableCreate || !hideCreateButton) && (
                <Button type="primary" onClick={handleCreate}>
                  {toolbar?.createButtonText || 'Create New'}
                </Button>
              )}
              {toolbar?.enableExport && (
                <Dropdown
                  menu={{
                    items: [
                      ...(toolbar.exportFormats?.includes('excel') ? [{
                        key: 'excel',
                        label: 'Export to Excel',
                        onClick: handleExportExcel
                      }] : []),
                      ...(toolbar.exportFormats?.includes('csv') ? [{
                        key: 'csv',
                        label: 'Export to CSV',
                        onClick: handleExportCSV
                      }] : [])
                    ]
                  }}
                  trigger={['click']}
                >
                  <Button icon={<DownloadOutlined />}>
                    Export
                  </Button>
                </Dropdown>
              )}
              {toolbar?.enableBulkDelete && selectedRows.length > 0 && (
                <Popconfirm
                  title={toolbar.bulkDeleteConfirmText || 'Are you sure you want to delete the selected records?'}
                  onConfirm={handleBulkDelete}
                >
                  <Button type="default" danger>
                    {toolbar.bulkDeleteText || 'Delete Selected'} ({selectedRows.length})
                  </Button>
                </Popconfirm>
              )}
            </div>
          </div>
        </div>
        <div style={{ overflowX: 'auto', border: '1px solid hsl(var(--border))', borderRadius: 6 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
          {table.getHeaderGroups().map((headerGroup: any) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header: any) => (
                    <th key={header.id} style={{ textAlign: 'left', padding: 8, background: 'hsl(var(--muted) / 0.2)', borderBottom: '1px solid hsl(var(--border))' }}>
                      {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody>
              {table.getPaginationRowModel().rows.map((row: any) => (
                <tr key={row.id}>
                  {row.getVisibleCells().map((cell: any) => (
                    <td key={cell.id} style={{ padding: 8, borderBottom: '1px solid hsl(var(--border))' }}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div style={{ marginTop: 8, display: 'flex', gap: 8, alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
            <span style={{ fontSize: 12, color: 'hsl(var(--muted-foreground))' }}>Show:</span>
            <Select
              size="small"
              value={table.getState().pagination.pageSize}
              onChange={(value) => table.setPageSize(Number(value))}
              style={{ width: 60 }}
              options={[
                { value: 5, label: '5' },
                { value: 10, label: '10' },
                { value: 15, label: '15' },
                { value: 25, label: '25' },
                { value: 50, label: '50' }
              ]}
            />
          </div>
          <Button size="small" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>Prev</Button>
          <Button size="small" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>Next</Button>
          <span style={{ fontSize: 12, color: 'hsl(var(--muted-foreground))' }}>
            Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
          </span>
          <span style={{ fontSize: 12, color: 'hsl(var(--muted-foreground))' }}>
            ({serverPagination.total} total records)
          </span>
        </div>

        {/* Dynamic Form Modal */}
        <Modal
          title={`${modalMode.charAt(0).toUpperCase() + modalMode.slice(1)} ${getModalTitle()}`}
          open={isModalVisible}
          onOk={modalMode === 'view' ? () => setIsModalVisible(false) : handleFormSubmit}
          onCancel={() => setIsModalVisible(false)}
          okText={modalMode === 'view' ? 'Close' : modalMode === 'create' ? 'Create' : 'Update'}
          cancelText={modalMode === 'view' ? undefined : 'Cancel'}
          width={600}
        >
          <Form
            form={form}
            layout="vertical"
            disabled={modalMode === 'view'}
          >
            {generateFormFields()}
          </Form>
        </Modal>
      </div>
    </BaseGadgetContainer>
  );
};

export default class SGridSearchGadget extends BaseGadget {
  metadata: GadgetMetadata = {
    id: 'sgrid-search-gadget',
    name: 'Search Grid Gadget',
    description: 'Generic searchable grid for listing items from API or localStorage',
    version: '1.0.0',
    gadgetType: GadgetType.DISPLAY,
    widgetTypes: [],
  };

  schema: GadgetSchema = {
    type: 'object',
    properties: {
      title: { type: 'string' },
      description: { type: 'string' },
      dataUrl: { type: 'string' },
      dataSource: { type: 'string', description: 'localStorage:key* pattern' },
      columns: { type: 'array' },
      rowActions: { type: 'array' },
      viewFilters: { type: 'array' },
      search: {
        type: 'object',
        properties: {
          placeholder: { type: 'string' },
          enableColumnFilters: { type: 'boolean' }
        }
      },
      toolbar: {
        type: 'object',
        properties: {
          enableCreate: { type: 'boolean' },
          createButtonText: { type: 'string' },
          createWorkspace: { type: 'string' },
          createParams: { type: 'object' },
          enableBulkDelete: { type: 'boolean' },
          bulkDeleteText: { type: 'string' },
          bulkDeleteConfirmText: { type: 'string' },
          enableExport: { type: 'boolean' },
          exportFileName: { type: 'string' },
          exportFormats: { type: 'array', items: { type: 'string' } }
        }
      },
      pagination: { type: 'object' },
      hideCreateButton: { type: 'boolean' },
      fieldMappings: {
        type: 'object',
        description: 'Maps filter IDs to API parameter names'
      },
      defaultSort: {
        type: 'object',
        properties: {
          field: { type: 'string' },
          order: { type: 'string', enum: ['asc', 'desc'] }
        },
        description: 'Default sorting configuration for the grid'
      }
    },
    required: [],
    widgetSchemas: {}
  };

  validate(config: GadgetConfig) { return { isValid: true, errors: [] }; }
  getRequiredWidgets(): string[] { return []; }
  getWidgetLayout(): Record<string, any> { return { type: 'grid', columns: 1 }; }
  processDataFlow(data: any): any { return data; }

  renderBody(props: any): React.ReactNode {
    // Extract config from the new props structure and spread it for compatibility
    const { config, context, ...otherProps } = props;
    
    // SGridSearchView expects props directly, so spread config properties
    return <SGridSearchView 
      {...(config || props)} 
      context={context} 
      assetTypeWizardMapping={config?.assetTypeWizardMapping || {}}
      {...otherProps} 
    />;
  }
}


