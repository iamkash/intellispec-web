import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Button, DatePicker, Input, Segmented, Select, Space, Tooltip, Upload, message } from 'antd';
import { UploadOutlined, FileExcelOutlined, DatabaseOutlined, PlusOutlined, FilterOutlined, DownloadOutlined, CloudDownloadOutlined } from '@ant-design/icons';
import type { UploadProps } from 'antd';
import { EditableGridWidget } from './EditableGridWidget';

export type AssetRow = {
  id: string;
  assetTag?: string;
  assetType?: string;
  areaUnit?: string;
  codes?: string;
  cui?: string;
  cuf?: string;
  accessNeeds?: string;
  durationHrs?: number | string;
  assignedTo?: string;
  dueBy?: string;
  status?: string;
};

export interface AssetSelectorWidgetProps {
  value?: AssetRow[];
  onChange?: (rows: AssetRow[]) => void;
  label?: string;
  required?: boolean;
  disabled?: boolean;
  readOnly?: boolean;
  className?: string;
  style?: React.CSSProperties;
  width?: number | string;
}

const DEFAULT_COLUMNS = [
  { key: 'assetTag', title: 'Asset Tag', editable: true },
  { key: 'assetType', title: 'Asset Type', editable: true },
  { key: 'areaUnit', title: 'Area / Unit', editable: true },
  { key: 'codes', title: 'Codes', editable: true },
  { key: 'cui', title: 'CUI', editable: true },
  { key: 'cuf', title: 'CUF', editable: true },
  { key: 'accessNeeds', title: 'Access Needs', editable: true },
  { key: 'durationHrs', title: 'Est. Duration (hrs)', editable: true },
  { key: 'assignedTo', title: 'Assigned To', editable: true },
  { key: 'dueBy', title: 'Due By', editable: true },
  { key: 'status', title: 'Status', editable: true },
];

type SourceType = 'cmms' | 'csv' | 'excel' | 'manual';

export const AssetSelectorWidget: React.FC<AssetSelectorWidgetProps> = ({
  value,
  onChange,
  label,
  required,
  disabled,
  readOnly,
  className,
  style,
  width = '100%'
}) => {
  const [rows, setRows] = useState<AssetRow[]>(Array.isArray(value) ? value : []);
  const [source, setSource] = useState<SourceType>('csv');
  const [cmmsRefType, setCmmsRefType] = useState<'work_order' | 'list'>('work_order');
  const [cmmsRefId, setCmmsRefId] = useState<string>('');
  const [filterDueBy, setFilterDueBy] = useState<string | undefined>();
  const [filterArea, setFilterArea] = useState<string>('');
  const [filterRisk, setFilterRisk] = useState<string | undefined>();
  const [filterCriticality, setFilterCriticality] = useState<string | undefined>();
  const isInternal = useRef(false);

  useEffect(() => {
    setRows(Array.isArray(value) ? value : []);
  }, [value]);

  useEffect(() => {
    if (isInternal.current) {
      onChange?.(rows);
      isInternal.current = false;
    }
  }, [rows, onChange]);

  const columnsMeta = useMemo(() => DEFAULT_COLUMNS, []);

  const parseCsv = useCallback(async (file: File) => {
    const text = await file.text();
    const lines = text.split(/\r?\n/).filter(l => l.trim().length > 0);
    if (lines.length === 0) return [] as AssetRow[];
    const header = lines[0].split(',').map(h => h.trim().toLowerCase());
    const idx = (name: string) => header.findIndex(h => h === name.toLowerCase());
    const mapIdx = {
      assetTag: idx('asset tag'),
      assetType: idx('asset type'),
      areaUnit: idx('area / unit') >= 0 ? idx('area / unit') : idx('area') >= 0 ? idx('area') : idx('unit'),
      codes: idx('codes'),
      cui: idx('cui'),
      cuf: idx('cuf'),
      accessNeeds: idx('access needs'),
      durationHrs: idx('est. duration (hrs)') >= 0 ? idx('est. duration (hrs)') : idx('duration'),
      assignedTo: idx('assigned to'),
      dueBy: idx('due by') >= 0 ? idx('due by') : idx('due'),
      status: idx('status')
    } as Record<string, number>;
    const rowsParsed: AssetRow[] = [];
    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(',');
      if (cols.every(c => !c || c.trim() === '')) continue;
      const row: AssetRow = { id: `r-${Date.now()}-${i}` };
      Object.entries(mapIdx).forEach(([key, index]) => {
        if (index >= 0 && index < cols.length) {
          (row as any)[key] = cols[index]?.trim();
        }
      });
      rowsParsed.push(row);
    }
    return rowsParsed;
  }, []);

  const handleCsvUpload: UploadProps['beforeUpload'] = async (file) => {
    if (disabled || readOnly) return false;
    try {
      const imported = await parseCsv(file);
      isInternal.current = true;
      setRows(prev => [...prev, ...imported]);
      message.success(`Imported ${imported.length} assets from ${file.name}`);
    } catch (e) {
      message.error('Failed to import CSV');
    }
    return false; // prevent auto upload
  };

  const handleFetchFromCmms = useCallback(() => {
    if (!cmmsRefId) {
      message.warning('Enter a Work Order or List ID');
      return;
    }
    // Stub: simulate fetch with filters applied
    const synth: AssetRow[] = [
      { id: `r-${Date.now()}-1`, assetTag: 'TAG-1001', assetType: 'Vessel', areaUnit: filterArea || 'Unit A', codes: 'API510', cui: 'Yes', cuf: 'No', accessNeeds: 'Scaffold', durationHrs: 8, assignedTo: 'Team A', dueBy: filterDueBy, status: 'Planned' },
      { id: `r-${Date.now()}-2`, assetTag: 'TAG-1002', assetType: 'Piping', areaUnit: filterArea || 'Unit B', codes: 'API570', cui: 'No', cuf: 'Yes', accessNeeds: 'Manlift', durationHrs: 5, assignedTo: 'Team B', dueBy: filterDueBy, status: 'Planned' }
    ];
    isInternal.current = true;
    setRows(prev => [...prev, ...synth]);
    message.success('Fetched assets from CMMS');
  }, [cmmsRefId, filterArea, filterDueBy]);

  const addManual = useCallback(() => {
    if (readOnly) return;
    const newRow: AssetRow = { id: `r-${Date.now()}`, status: 'Planned' };
    isInternal.current = true;
    setRows(prev => [ ...prev, newRow ]);
  }, [readOnly]);

  const toolbar = (
    <div style={{ display: 'flex', gap: 8, alignItems: 'center', justifyContent: 'space-between', border: '1px solid hsl(var(--border))', borderBottom: 'none', borderRadius: '8px 8px 0 0', padding: 8, background: 'hsl(var(--card))' }}>
      <Space wrap>
        <Segmented
          value={source}
          onChange={(v) => setSource(v as SourceType)}
          options={[
            { label: 'CSV/Excel', value: 'csv', icon: <FileExcelOutlined /> },
            { label: 'CMMS', value: 'cmms', icon: <DatabaseOutlined /> },
            { label: 'Manual', value: 'manual', icon: <PlusOutlined /> },
          ]}
        />
        {source === 'cmms' && (
          <Space size="small" wrap>
            <Select
              value={cmmsRefType}
              style={{ width: 140 }}
              onChange={(v) => setCmmsRefType(v)}
              options={[
                { label: 'Work Order', value: 'work_order' },
                { label: 'List ID', value: 'list' },
              ]}
            />
            <Input
              style={{ width: 220 }}
              placeholder={cmmsRefType === 'work_order' ? 'Enter Work Order ID' : 'Enter List ID'}
              value={cmmsRefId}
              onChange={(e) => setCmmsRefId(e.target.value)}
            />
            <Tooltip title="Quick Filters">
              <FilterOutlined />
            </Tooltip>
            <DatePicker
              placeholder="Due by"
              onChange={(d, s) => setFilterDueBy(s as string)}
            />
            <Input placeholder="Area / Unit" value={filterArea} onChange={(e) => setFilterArea(e.target.value)} style={{ width: 160 }} />
            <Select
              allowClear
              placeholder="Risk"
              style={{ width: 120 }}
              value={filterRisk}
              onChange={setFilterRisk as any}
              options={[{ label: 'Low', value: 'low' }, { label: 'Medium', value: 'medium' }, { label: 'High', value: 'high' }]}
            />
            <Select
              allowClear
              placeholder="Criticality"
              style={{ width: 140 }}
              value={filterCriticality}
              onChange={setFilterCriticality as any}
              options={[{ label: 'Low', value: 'low' }, { label: 'Medium', value: 'medium' }, { label: 'High', value: 'high' }]}
            />
            <Button type="primary" icon={<CloudDownloadOutlined />} onClick={handleFetchFromCmms}>Fetch</Button>
          </Space>
        )}
        {source === 'csv' && (
          <Upload beforeUpload={handleCsvUpload} showUploadList={false} accept={'.csv'} disabled={disabled || readOnly}>
            <Button icon={<UploadOutlined />}>Import CSV</Button>
          </Upload>
        )}
        {source === 'manual' && (
          <Button icon={<PlusOutlined />} onClick={addManual} disabled={disabled || readOnly}>Add Row</Button>
        )}
      </Space>
      <Space>
        <Button type="text" icon={<DownloadOutlined />}>Template</Button>
      </Space>
    </div>
  );

  return (
    <div className={className} style={{ width, ...style }}>
      {label && (
        <div style={{ fontWeight: 600, marginBottom: 6 }}>
          {label}{required && <span style={{ color: 'hsl(var(--destructive))' }}> *</span>}
        </div>
      )}
      {toolbar}
      <div style={{ marginTop: 8 }}>
        <EditableGridWidget
          rows={rows}
          onChange={(r) => { isInternal.current = true; setRows(r as AssetRow[]); }}
          columnsMeta={columnsMeta as any}
          features={{ enableFiltering: true, enableSorting: true, pageSizeOptions: [5, 10, 20], readOnly: Boolean(readOnly), bordered: false }}
        />
      </div>
    </div>
  );
};

export default AssetSelectorWidget;

