import { ColumnDef, flexRender, getCoreRowModel, getFilteredRowModel, getPaginationRowModel, getSortedRowModel, useReactTable } from '@tanstack/react-table';
import { Button, Input, Select, Space } from 'antd';
import React from 'react';

export type EditableGridRow = { id: string; [key: string]: any };
export type EditableGridColumnMeta = { 
  key: string; 
  title: string; 
  editable?: boolean; 
  width?: number;
  type?: 'text' | 'select'; // Add type support
  options?: Array<{ label: string; value: any; [key: string]: any }>; // Static options (can include extra fields)
  optionsUrl?: string; // Dynamic options from API
  labelField?: string; // Field name for label (default: 'label')
  valueField?: string; // Field name for value (default: 'value')
  dependsOn?: string; // Another column key this depends on
  autoPopulate?: Record<string, string>; // Map of target fields to source fields in option object (e.g., { "userName": "name", "userEmail": "email" })
};
export type EditableGridFeatures = {
  enableSorting?: boolean;
  enableFiltering?: boolean;
  enablePagination?: boolean;
  enableSelection?: boolean;
  pageSizeOptions?: number[];
  readOnly?: boolean;
  bordered?: boolean;
};

export interface EditableGridWidgetProps {
  rows: EditableGridRow[];
  onChange: (rows: EditableGridRow[]) => void;
  columnsMeta?: EditableGridColumnMeta[];
  features?: EditableGridFeatures;
  className?: string;
  urlParams?: Record<string, string>; // For replacing {id}, {tenantId}, etc. in optionsUrl
}

/**
 * EditableGridWidget
 * Generic, metadata-driven table with optional inline editing, selection, sorting, filtering and pagination.
 * Styling is theme-token based via classes: meta-table, meta-th, meta-td. Consumers may override in CSS.
 */
export const EditableGridWidget: React.FC<EditableGridWidgetProps> = ({ rows, onChange, columnsMeta, features, className, urlParams }) => {
  const [data, setData] = React.useState<EditableGridRow[]>(rows || []);
  const [globalFilter, setGlobalFilter] = React.useState<string>('');
  const [sorting, setSorting] = React.useState<any>([]);
  const [pagination, setPagination] = React.useState({ pageIndex: 0, pageSize: (features?.pageSizeOptions?.[0] || 5) });
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [rowSelection, setRowSelection] = React.useState<Record<string, boolean>>({});
  const isInternalUpdate = React.useRef<boolean>(false);
  
  // State for managing dynamic options for select columns
  const [columnOptions, setColumnOptions] = React.useState<Record<string, Array<{ label: string; value: any }>>>({});
  const [loadingOptions, setLoadingOptions] = React.useState<Record<string, boolean>>({});

  React.useEffect(() => { setData(rows || []); }, [rows]);
  React.useEffect(() => {
    if (isInternalUpdate.current) {
      onChange?.(data);
      isInternalUpdate.current = false;
    }
  }, [data, onChange]);
  React.useEffect(() => {
    const sz = features?.pageSizeOptions?.[0];
    if (typeof sz === 'number' && Number.isFinite(sz) && sz > 0 && pagination.pageSize !== sz) {
      setPagination(prev => ({ ...prev, pageSize: sz }));
    }
  }, [features]);

  // Fetch options for select columns with optionsUrl
  React.useEffect(() => {
    if (!columnsMeta) return;
    
    console.log('[EditableGridWidget] Fetching options with urlParams:', urlParams);
    
    const fetchOptionsForColumn = async (col: EditableGridColumnMeta) => {
      if (col.type === 'select' && col.optionsUrl) {
        // Skip if already loaded and urlParams haven't changed
        if (columnOptions[col.key] && columnOptions[col.key].length > 0) {
          console.log(`[EditableGridWidget] Options already loaded for ${col.key}:`, columnOptions[col.key].length);
          return;
        }
        
        setLoadingOptions(prev => ({ ...prev, [col.key]: true }));
        try {
          // Replace URL parameters like {id}, {tenantId}, etc.
          let optionsUrl = col.optionsUrl;
          console.log(`[EditableGridWidget] Original URL for ${col.key}:`, optionsUrl);
          
          if (urlParams) {
            Object.entries(urlParams).forEach(([key, value]) => {
              optionsUrl = optionsUrl.replace(new RegExp(`\\{${key}\\}`, 'g'), value);
            });
          }
          
          console.log(`[EditableGridWidget] Resolved URL for ${col.key}:`, optionsUrl);
          
          const url = new URL(optionsUrl, window.location.origin);
          const token = localStorage.getItem('token');
          const response = await fetch(url.toString(), {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              ...(token && { 'Authorization': `Bearer ${token}` })
            }
          });
          
          if (!response.ok) {
            console.warn(`[EditableGridWidget] Failed to fetch options for ${col.key}:`, response.status);
            setColumnOptions(prev => ({ ...prev, [col.key]: [] }));
            return;
          }
          
          const result = await response.json();
          console.log(`[EditableGridWidget] Raw API response for ${col.key}:`, result);
          
          let options: Array<{ label: string; value: any }> = [];
          
          // Handle different response formats
          if (Array.isArray(result)) {
            options = result;
          } else if (result.options && Array.isArray(result.options)) {
            options = result.options;
          } else if (result.data && Array.isArray(result.data)) {
            options = result.data;
          }
          
          console.log(`[EditableGridWidget] Parsed options for ${col.key} (before mapping):`, options);
          
          // Map to {label, value} format if custom fields are specified
          const labelField = col.labelField || 'label';
          const valueField = col.valueField || 'value';
          if (labelField !== 'label' || valueField !== 'value') {
            options = options.map(opt => {
              const optAny = opt as any; // Type assertion for dynamic property access
              return {
                ...opt, // Preserve all other properties for autoPopulate (spread first)
                label: optAny[labelField] || opt.label || String(optAny[valueField] || opt.value || ''),
                value: optAny[valueField] || opt.value
              };
            });
          }
          
          console.log(`[EditableGridWidget] Final options for ${col.key}:`, options);
          setColumnOptions(prev => ({ ...prev, [col.key]: options }));
        } catch (err) {
          console.error(`[EditableGridWidget] Error fetching options for ${col.key}:`, err);
          setColumnOptions(prev => ({ ...prev, [col.key]: [] }));
        } finally {
          setLoadingOptions(prev => ({ ...prev, [col.key]: false }));
        }
      }
    };
    
    columnsMeta.forEach(col => {
      if (col.type === 'select' && col.optionsUrl) {
        fetchOptionsForColumn(col);
      } else if (col.type === 'select' && col.options) {
        // Use static options
        console.log(`[EditableGridWidget] Setting static options for ${col.key}:`, col.options);
        setColumnOptions(prev => ({ ...prev, [col.key]: col.options || [] }));
      }
    });
  }, [columnsMeta, urlParams]);

  const readOnly = Boolean(features?.readOnly);
  const startEdit = (id: string) => setEditingId(id);
  const cancelEdit = () => setEditingId(null);
  const commitEdit = () => setEditingId(null);

  const addRow = () => {
    const newRow: EditableGridRow = { id: `r-${Date.now()}` };
    // Initialize known keys from column meta
    (columnsMeta || []).forEach(cm => { if (!(cm.key in newRow)) (newRow as any)[cm.key] = ''; });
    isInternalUpdate.current = true;
    setData(prev => [...prev, newRow]);
    setEditingId(newRow.id);
  };
  const update = (id: string, patch: Partial<EditableGridRow>) => {
    isInternalUpdate.current = true;
    setData(prev => prev.map(r => r.id === id ? { ...r, ...patch } : r));
  };
  const remove = (id: string) => {
    isInternalUpdate.current = true;
    setData(prev => prev.filter(r => r.id !== id));
  };

  const columnMeta: EditableGridColumnMeta[] = (Array.isArray(columnsMeta) && columnsMeta.length > 0) ? columnsMeta : [];

  const columns = React.useMemo<ColumnDef<EditableGridRow>[]>(() => {
    const selectionCol: ColumnDef<EditableGridRow> | null = (features?.enableSelection === false) ? null : {
      id: '__select__',
      header: ({ table }: any) => (
        <input type="checkbox" aria-label="Select all" checked={table.getIsAllPageRowsSelected()} onChange={table.getToggleAllPageRowsSelectedHandler()} />
      ),
      cell: ({ row }: any) => (
        <input type="checkbox" aria-label="Select row" checked={row.getIsSelected()} onChange={row.getToggleSelectedHandler()} />
      )
    };
    const baseCols = columnMeta.map((cm) => ({
      accessorKey: cm.key,
      header: () => <span>{cm.title}</span>,
      cell: (info: any) => {
        const row = info.row.original; 
        const isEditing = row.id === editingId && cm.editable !== false;
        const value = row[cm.key];
        
        // Read mode - display value
        if (!isEditing) {
          // For select columns, display the label instead of value
          if (cm.type === 'select') {
            const opts = columnOptions[cm.key] || cm.options || [];
            const option = opts.find(o => o.value === value);
            const displayValue = option?.label || value;
            
            // Debug logging
            if (cm.key === 'userId' && value) {
              console.log(`[EditableGridWidget] Displaying ${cm.key}:`, {
                value,
                availableOptions: opts.length,
                foundOption: option,
                displayValue
              });
            }
            
            return (<span style={{ color: displayValue == null || displayValue === '' ? 'hsl(var(--muted-foreground))' : undefined }}>{String(displayValue ?? '—')}</span>);
          }
          return (<span style={{ color: value == null || value === '' ? 'hsl(var(--muted-foreground))' : undefined }}>{String(value ?? '—')}</span>);
        }
        
        // Edit mode - render appropriate input
        if (cm.type === 'select') {
          const opts = columnOptions[cm.key] || cm.options || [];
          const isLoading = loadingOptions[cm.key] || false;
          
          // Debug logging for edit mode
          console.log(`[EditableGridWidget] Rendering select for ${cm.key} in edit mode:`, {
            optionsCount: opts.length,
            isLoading,
            currentValue: value,
            options: opts.slice(0, 3) // Show first 3 for debugging
          });
          
          // Handler with auto-population support
          const handleSelectChange = (v: any) => {
            const updates: Partial<EditableGridRow> = { [cm.key]: v };
            
            // Auto-populate related fields if configured
            if (cm.autoPopulate) {
              const selectedOption = opts.find(o => o.value === v);
              if (selectedOption) {
                const optionAny = selectedOption as any; // Type assertion for dynamic property access
                Object.entries(cm.autoPopulate).forEach(([targetField, sourceField]) => {
                  updates[targetField] = optionAny[sourceField] || '';
                });
              }
            }
            
            update(row.id, updates);
          };
          
          return (
            <Select
              size="small"
              value={value || undefined} // Ensure empty string becomes undefined for placeholder to show
              onChange={handleSelectChange}
              placeholder={`Select ${cm.title}`}
              style={{ width: '100%' }}
              loading={isLoading}
              showSearch
              allowClear // Allow clearing the selection
              filterOption={(input, option) =>
                (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
              }
              options={opts}
            />
          );
        }
        
        // Default: text input
        return (
          <Input 
            size="small" 
            value={value} 
            onChange={(e) => update(row.id, { [cm.key]: e.target.value })} 
            placeholder={cm.title} 
            style={{ width: '100%' }} 
          />
        );
      }
    } as ColumnDef<EditableGridRow>));
    const actionsCol: ColumnDef<EditableGridRow> = {
      id: '__rowActions__', header: '', cell: (info: any) => {
        const row = info.row.original; const isEditing = row.id === editingId;
        if (readOnly) return null;
        return isEditing ? (
          <Space>
            <Button type="primary" size="small" onClick={commitEdit}>Save</Button>
            <Button size="small" onClick={cancelEdit}>Cancel</Button>
          </Space>
        ) : (
          <Space>
            <Button size="small" onClick={() => startEdit(row.id)}>Edit</Button>
            <Button danger size="small" onClick={() => remove(row.id)}>Delete</Button>
          </Space>
        );
      }
    };
    const cols = readOnly ? baseCols : [...baseCols, actionsCol];
    return selectionCol ? [selectionCol, ...cols] : cols;
  }, [columnMeta, editingId, readOnly, features?.enableSelection]);

  const table = useReactTable({
    data: data,
    columns,
    state: { sorting, globalFilter, pagination, rowSelection },
    onSortingChange: features?.enableSorting === false ? undefined : setSorting,
    onGlobalFilterChange: features?.enableFiltering === false ? undefined : (setGlobalFilter as any),
    onPaginationChange: features?.enablePagination === false ? undefined : (setPagination as any),
    enableRowSelection: features?.enableSelection === false ? false : true,
    onRowSelectionChange: setRowSelection as any,
    getRowId: (row: any) => row.id,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel()
  });

  const tableContainerStyle: React.CSSProperties = {
    overflowX: 'auto',
    border: features?.bordered === false ? 'none' : '1px solid hsl(var(--border))',
    borderTop: 'none',
    borderRadius: 8,
    background: 'hsl(var(--card))'
  };
  const tableStyle: React.CSSProperties = {
    width: '100%',
    borderCollapse: 'separate',
    borderSpacing: 0
  };
  const thStyle = (w?: number): React.CSSProperties => ({
    position: 'sticky',
    top: 0,
    background: 'hsl(var(--muted))',
    color: 'hsl(var(--muted-foreground))',
    textAlign: 'left',
    padding: '8px 12px',
    borderBottom: '1px solid hsl(var(--border))',
    whiteSpace: 'normal',
    wordBreak: 'break-word'
  });
  const tdStyle: React.CSSProperties = {
    padding: '6px 12px',
    borderTop: '1px solid hsl(var(--border))',
    verticalAlign: 'middle',
    whiteSpace: 'normal',
    wordBreak: 'break-word'
  };

  return (
    <div className={className} style={{ display: 'grid', gap: 8 }}>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', justifyContent: 'space-between', borderBottom: features?.bordered === false ? 'none' : '1px solid hsl(var(--border))', paddingBottom: 4 }}>
        {features?.enableFiltering !== false && (
          <Input size="small" bordered={false} placeholder="Filter" allowClear value={globalFilter} onChange={(e) => setGlobalFilter(e.target.value)} style={{ maxWidth: 300 }} />
        )}
        <Space>
          {features?.enablePagination !== false && (
            <Select size="small" value={pagination.pageSize} onChange={(v) => setPagination(p => ({ ...p, pageSize: v as number }))} style={{ width: 120 }}
                    options={(features?.pageSizeOptions || [5,10,20,50]).map(n => ({ label: `Rows: ${n}`, value: n }))} />
          )}
          {!readOnly && (
            <>
              <Button size="small" onClick={addRow}>Add</Button>
              <Button size="small" onClick={() => { const one = table.getSelectedRowModel().rows[0]; if (one) startEdit(one.original.id); }} disabled={table.getSelectedRowModel().rows.length !== 1}>Edit</Button>
              <Button size="small" danger onClick={() => { const ids = new Set(table.getSelectedRowModel().rows.map(r => r.original.id)); isInternalUpdate.current = true; setData(prev => prev.filter(r => !ids.has(r.id))); setRowSelection({}); }}>Delete</Button>
            </>
          )}
        </Space>
      </div>
      <div style={tableContainerStyle}>
        <table style={tableStyle}>
          <thead>
            {table.getHeaderGroups().map(hg => (
              <tr key={hg.id}>
                {hg.headers.map(h => (
                  <th key={h.id} className="meta-th" style={{ ...thStyle((h as any).getSize?.() as any), cursor: (features?.enableSorting !== false && h.column.getCanSort()) ? 'pointer' : 'default' }} onClick={features?.enableSorting === false ? undefined : h.column.getToggleSortingHandler()}>
                    {flexRender(h.column.columnDef.header, h.getContext())}
                    {{ asc: ' \u2191', desc: ' \u2193' }[h.column.getIsSorted() as string] || ''}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map((r, idx) => (
              <tr key={r.id} style={{ background: idx % 2 === 1 ? 'hsl(var(--muted) / 0.25)' : undefined }}>
                {r.getVisibleCells().map(c => (
                  <td key={c.id} className="meta-td" style={tdStyle}>{flexRender(c.column.columnDef.cell, c.getContext())}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {features?.enablePagination !== false && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ color: 'hsl(var(--muted-foreground))' }}>
            Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount() || 1}
          </div>
          <Space>
            <Button size="small" onClick={() => table.setPageIndex(0)} disabled={!table.getCanPreviousPage()}>{'<<'}</Button>
            <Button size="small" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>{'<'}</Button>
            <Button size="small" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>{'>'}</Button>
            <Button size="small" onClick={() => table.setPageIndex(table.getPageCount() - 1)} disabled={!table.getCanNextPage()}>{'>>'}</Button>
          </Space>
        </div>
      )}
    </div>
  );
};

export default EditableGridWidget;


