import React, { useMemo } from 'react';
import { Card, Tag, Button, Input, Select, Switch, Divider, Modal, Form, InputNumber, Space, message } from 'antd';
import { CopyOutlined, SortAscendingOutlined, FileTextOutlined, BulbOutlined, DownOutlined, RightOutlined, CheckCircleOutlined, BranchesOutlined, PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import { useReactTable, ColumnDef, getCoreRowModel, flexRender } from '@tanstack/react-table';

export interface RecommendationItem {
  id: string;
  label: string;
  priority?: 'high' | 'medium' | 'low';
  category?: string;
  tags?: string[];
  riskScore?: number;
  riskText?: string;
  timeEstimateMinutes?: number;
  steps?: string[];
  rationale?: string;
  justification?: string;
}

export interface RecommendationsListProps {
  items: RecommendationItem[];
  selectedIds: string[];
  onToggle: (id: string, selected: boolean) => void;
  onEdit?: (updated: any) => void;
  onAdd?: (item: any) => void;
  compact?: boolean;
  onCompactChange?: (value: boolean) => void;
  search?: string;
  onSearchChange?: (value: string) => void;
  sortMode?: 'natural' | 'priority' | 'label' | 'category';
  onSortModeChange?: (mode: 'natural' | 'priority' | 'label' | 'category') => void;
  onCopySelection?: (selected: RecommendationItem[]) => void;
}

export const RecommendationsList: React.FC<RecommendationsListProps> = React.memo(({
  items,
  selectedIds,
  onToggle,
  compact,
  onCompactChange,
  search,
  onSearchChange,
  sortMode = 'natural',
  onSortModeChange,
  onCopySelection,
  onEdit,
  onAdd
}) => {
  const filtered = useMemo(() => {
    const weight = (p?: string) => (p === 'high' ? 0 : p === 'medium' ? 1 : 2);
    let base = [...items];
    if (sortMode === 'priority') base.sort((a, b) => weight(a.priority) - weight(b.priority));
    if (sortMode === 'label') base.sort((a, b) => (a.label || '').localeCompare(b.label || ''));
    if (sortMode === 'category') base.sort((a, b) => (a.category || '').localeCompare(b.category || '') || (a.label || '').localeCompare(b.label || ''));
    const q = (search || '').trim().toLowerCase();
    if (!q) return base;
    return base.filter(s => `${s.label}\n${s.rationale || ''}\n${s.justification || ''}`.toLowerCase().includes(q));
  }, [items, sortMode, search]);

  const [groupBy, setGroupBy] = React.useState<'none' | 'category'>('none');
  const groups = useMemo(() => {
    if (groupBy === 'category') {
      const map = new Map<string, RecommendationItem[]>();
      for (const it of filtered) {
        const key = it.category || 'Uncategorized';
        if (!map.has(key)) map.set(key, []);
        map.get(key)!.push(it);
      }
      return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]));
    }
    return [['All', filtered]] as Array<[string, RecommendationItem[]]>;
  }, [filtered, groupBy]);

  // Accordion collapsed by default
  const [expanded, setExpanded] = React.useState<Set<string>>(() => new Set());
  const isExpanded = (id: string) => expanded.has(id);
  const toggleExpanded = (id: string) => setExpanded(prev => { const next = new Set(prev); if (next.has(id)) next.delete(id); else next.add(id); return next; });

  // Edit/Add modals
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<any | null>(null);
  const [form] = Form.useForm();
  // Editable rows for steps/actions/resources
  type StringRow = { id: string; value: string };
  const [stepsRows, setStepsRows] = React.useState<StringRow[]>([]);
  const [actionsRows, setActionsRows] = React.useState<StringRow[]>([]);
  const [resourcesRows, setResourcesRows] = React.useState<ResourceRow[]>([]);
  const [personnelRows, setPersonnelRows] = React.useState<PersonnelRow[]>([]);

  const openEdit = (item: any) => { setEditing(item); setIsModalOpen(true); form.setFieldsValue({
    label: item.label,
    priority: item.priority || 'medium',
    category: item.category,
    summary: item.summary,
    rationale: item.rationale,
    justification: item.justification,
    riskScore: item.riskScore,
    riskText: item.riskText,
    tags: (item.tags || []).join(', '),
    personnel: Array.isArray(item.personnel) ? item.personnel.map((p: any) => [p.role, p.name, p.notes || ''].join(' | ')).join('\n') : ''
  });
  setStepsRows((item.steps || []).map((v: string, i: number) => ({ id: String(i), value: v })));
  setActionsRows((item.actions || []).map((v: string, i: number) => ({ id: String(i), value: v })));
  setResourcesRows(Array.isArray(item.resources) ? item.resources : []);
  setPersonnelRows(Array.isArray(item.personnel) ? item.personnel : []);
  };
  const openAdd = () => { setEditing(null); setIsModalOpen(true); form.resetFields(); setStepsRows([]); setActionsRows([]); setResourcesRows([]); setPersonnelRows([]); };
  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      const parseLines = (text?: string) => (text || '').split(/\n+/).map(s => s.trim()).filter(Boolean);
      const parseList = (text?: string) => parseLines(text);
      const parsePersonnel = (text?: string) => parseLines(text).map((line, i) => {
        const [role, name, notes] = line.split('|').map(s => s?.trim() || '');
        return { id: String(i), role, name, notes: notes || undefined };
      });
      const updated = {
        ...(editing || { id: `new-${Date.now()}` }),
        label: values.label?.trim() || 'Untitled',
        priority: values.priority || 'medium',
        category: values.category?.trim() || undefined,
        summary: values.summary?.trim() || undefined,
        rationale: values.rationale?.trim() || undefined,
        justification: values.justification?.trim() || undefined,
        riskScore: typeof values.riskScore === 'number' ? values.riskScore : undefined,
        riskText: values.riskText?.trim() || undefined,
        tags: parseList(values.tags),
        steps: stepsRows.map(r => r.value).filter(Boolean),
        actions: actionsRows.map(r => r.value).filter(Boolean),
        resources: resourcesRows,
        personnel: personnelRows
      };
      if (editing) { onEdit?.(updated); message.success('Recommendation updated'); }
      else { onAdd?.(updated); message.success('Recommendation added'); }
      setIsModalOpen(false); setEditing(null);
    } catch {}
  };

  return (
    <>
      <div className="analysis-toolbar" role="toolbar" aria-label="Analysis controls">
        <div className="toolbar-actions">
          <Input allowClear size="middle" placeholder="Search recommendations" value={search} onChange={(e) => onSearchChange?.(e.target.value)} />
          <Select value={sortMode} onChange={(v: 'natural'|'priority'|'label'|'category') => onSortModeChange?.(v)} options={[{ label: 'Sort: Natural', value: 'natural' }, { label: 'Sort: Priority', value: 'priority' }, { label: 'Sort: A–Z', value: 'label' }, { label: 'Sort: Category', value: 'category' }]} style={{ width: 150 }} suffixIcon={<SortAscendingOutlined />} />
          <Select value={groupBy} onChange={(v: 'none'|'category') => setGroupBy(v)} options={[{ label: 'Group: None', value: 'none' }, { label: 'Group: Category', value: 'category' }]} style={{ width: 160 }} />
          <Switch checked={!!compact} onChange={onCompactChange} aria-label="Compact view" />
          <span className="toolbar-label">Compact</span>
          <Button icon={<CopyOutlined />} onClick={() => {
            const selected = filtered.filter(x => selectedIds.includes(x.id));
            onCopySelection?.(selected);
          }}>Copy Summary</Button>
          <Button type="primary" onClick={openAdd}>Add Recommendation</Button>
        </div>
      </div>
      <Divider style={{ margin: '8px 0' }} />
      {groups.map(([groupName, groupItems]) => (
        <React.Fragment key={groupName}>
          {groupBy !== 'none' && (<div style={{ fontWeight: 600, color: 'hsl(var(--foreground))', margin: '8px 0' }}>{groupName}</div>)}
          <div className="suggestion-grid">
        {groupItems.map((s, idx) => (
          <Card key={s.id} size="small" className={`rec-card rec-card--${s.priority || 'medium'} ${compact ? 'rec-card--compact' : ''}`} role="group" aria-label={`Recommendation ${s.label}`}>
            <div className="rec-card__header" role="button" aria-expanded={isExpanded(s.id)} onClick={() => toggleExpanded(s.id)} style={{ cursor: 'pointer', display: 'grid', gridTemplateColumns: '1fr auto', gap: 8, alignItems: 'center' }}>
              {/* Left: Title (primary), with a checkbox that does not toggle accordion */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                <input className="rec-checkbox" type="checkbox" checked={selectedIds.includes(s.id)} onClick={(e) => e.stopPropagation()} onChange={(e) => onToggle(s.id, e.target.checked)} />
                <div className="rec-card__title" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.label}</div>
              </div>
              {/* Right: Category | Priority | Risk + chevron */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ width: 200, textAlign: 'right', color: 'hsl(var(--muted-foreground))' }}>{s.category || '\u2014'}</span>
                <span style={{ color: 'hsl(var(--muted-foreground))' }}>|</span>
                {(() => {
                  const p = (s.priority || 'medium').toLowerCase();
                  const color = p === 'high' ? 'hsl(var(--destructive))' : p === 'medium' ? 'hsl(var(--warning))' : 'hsl(var(--success))';
                  const bg = p === 'high' ? 'hsl(var(--destructive) / 0.12)' : p === 'medium' ? 'hsl(var(--warning) / 0.12)' : 'hsl(var(--success) / 0.12)';
                  return <Tag style={{ color, borderColor: color, background: bg }}>{`Priority: ${s.priority || 'medium'}`}</Tag>;
                })()}
                {(() => {
                  const raw = (s as any).riskScore ?? (s as any).risk?.score ?? (s as any).risk_score;
                  const toNum = (v: any): number | undefined => {
                    if (Number.isFinite(v)) return v as number;
                    const n = Number(v);
                    if (Number.isFinite(n)) return n;
                    const m = String(v ?? '').match(/\d+(?:\.\d+)?/);
                    return m ? Number(m[0]) : undefined;
                  };
                  const score = toNum(raw);
                  if (!Number.isFinite(score)) return null;
                  const clamped = Math.max(0, Math.min(100, score as number));
                  const color = clamped >= 67 ? 'hsl(var(--destructive))' : clamped >= 34 ? 'hsl(var(--warning))' : 'hsl(var(--success))';
                  const bg = clamped >= 67 ? 'hsl(var(--destructive) / 0.12)' : clamped >= 34 ? 'hsl(var(--warning) / 0.12)' : 'hsl(var(--success) / 0.12)';
                  return (
                    <Tag style={{ color, borderColor: color, background: bg }}>{`Risk: ${clamped}%`}</Tag>
                  );
                })()}
                <Button size="small" type="text" onClick={(e) => { e.stopPropagation(); openEdit(s as any); }}>Edit</Button>
                <span aria-hidden style={{ color: 'hsl(var(--muted-foreground))', display: 'inline-flex', alignItems: 'center' }}>
                  {isExpanded(s.id) ? <DownOutlined /> : <RightOutlined />}
                </span>
              </div>
            </div>
            {isExpanded(s.id) && (
            <div className="rec-card__body">
              {(s.tags && s.tags.length > 0) || Number.isFinite(s.timeEstimateMinutes) ? (
                <div className="rec-meta-row">
                  {Array.from(new Set((s.tags || []).slice(0, 3))).map(t => <span key={t} className="chip" title="Tag">{t}</span>)}
                  {Number.isFinite(s.timeEstimateMinutes) && (<span className="chip" title="Estimated time">~{s.timeEstimateMinutes} min</span>)}
                </div>
              ) : null}
              <div className="rec-mini-grid">
                { (s as any).summary && (
                  <div className="mini-card">
                    <div className="mini-card__header"><FileTextOutlined /> <span>Summary</span></div>
                    <div className="mini-card__content rec-card__text--clamp">{(s as any).summary}</div>
                  </div>
                )}
                {s.rationale && (
                  <div className="mini-card mini-card--rationale">
                    <div className="mini-card__header"><BulbOutlined /> <span>Rationale</span></div>
                    <div className="mini-card__content rec-card__text--clamp">{s.rationale}</div>
                  </div>
                )}
                {s.justification && (
                  <div className="mini-card mini-card--justification">
                    <div className="mini-card__header"><FileTextOutlined /> <span>Justification</span></div>
                    <div className="mini-card__content rec-card__text--clamp">{s.justification}</div>
                  </div>
                )}
                {(s.steps && s.steps.length > 0) && (
                  <div className="mini-card mini-card--steps">
                    <div className="mini-card__header"><FileTextOutlined /> <span>Steps</span></div>
                    <ol className="mini-steps">
                      {s.steps.slice(0, 3).map((st, i) => <li key={i}>{st}</li>)}
                    </ol>
                  </div>
                )}
                {Array.isArray((s as any).actions) && (s as any).actions.length > 0 && (
                  <div className="mini-card mini-card--steps">
                    <div className="mini-card__header"><FileTextOutlined /> <span>Actions</span></div>
                    <ol className="mini-steps">
                      {(s as any).actions.slice(0, 3).map((st: string, i: number) => <li key={i}>{st}</li>)}
                    </ol>
                  </div>
                )}
                {Array.isArray((s as any).resources) && (s as any).resources.length > 0 && (
                  <div className="mini-card">
                    <div className="mini-card__header"><FileTextOutlined /> <span>Resources</span></div>
                    <div className="mini-card__content">
                      <ResourcesTable data={(s as any).resources} />
                    </div>
                  </div>
                )}
                {Array.isArray((s as any).personnel) && (s as any).personnel.length > 0 && (
                  <div className="mini-card">
                    <div className="mini-card__header"><FileTextOutlined /> <span>Rescue Personnel</span></div>
                    <div className="mini-card__content">
                      <PersonnelTable data={(s as any).personnel} />
                    </div>
                  </div>
                )}
              </div>
              {(s as any).dependencies && (s as any).dependencies.length > 0 && (
                <div className="rec-meta-row" style={{ marginTop: 8 }}>
                  <span className="chip chip--muted" title="Depends on" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                    <BranchesOutlined /> Depends on
                  </span>
                  {((s as any).dependencies as string[]).map(dep => (
                    <span key={dep} className="chip" title="Dependency">{dep}</span>
                  ))}
                </div>
              )}
            </div>
            )}
          </Card>
        ))}
          </div>
        </React.Fragment>
      ))}

      <Modal open={isModalOpen} onCancel={() => { setIsModalOpen(false); setEditing(null); }} onOk={handleSave} title={editing ? 'Edit Recommendation' : 'Add Recommendation'} width={900} okText="Save">
        <Form layout="vertical" form={form}>
          <Space direction="vertical" style={{ width: '100%' }} size="middle">
            <Form.Item name="label" label="Label" rules={[{ required: true, message: 'Label is required' }]}>
              <Input placeholder="Short imperative recommendation" />
            </Form.Item>
            <Space align="start" style={{ width: '100%' }}>
              <Form.Item name="priority" label="Priority" style={{ flex: 1 }}>
                <Select options={[{ value: 'high' }, { value: 'medium' }, { value: 'low' }]} />
              </Form.Item>
              <Form.Item name="category" label="Category" style={{ flex: 2 }}>
                <Input placeholder="Rescue Methods / Equipment & PPE / ..." />
              </Form.Item>
              <Form.Item name="riskScore" label="Risk Score" style={{ width: 160 }}>
                <InputNumber min={0} max={100} style={{ width: '100%' }} />
              </Form.Item>
            </Space>
            <Form.Item name="riskText" label="Risk Text">
              <Input placeholder="Short risk descriptor" />
            </Form.Item>
            <Form.Item name="summary" label="Summary"><Input.TextArea rows={2} /></Form.Item>
            <Form.Item name="rationale" label="Rationale"><Input.TextArea rows={3} /></Form.Item>
            <Form.Item name="justification" label="Justification"><Input.TextArea rows={3} /></Form.Item>
            <Form.Item name="tags" label="Tags (comma separated)"><Input placeholder="high-point, ventilation" /></Form.Item>
            <EditableStringTable title="Steps" rows={stepsRows} setRows={setStepsRows} />
            <EditableStringTable title="Actions" rows={actionsRows} setRows={setActionsRows} />
            <EditableResourceEditor rows={resourcesRows} setRows={setResourcesRows} />
            <EditablePersonnelEditor rows={personnelRows} setRows={setPersonnelRows} />
          </Space>
        </Form>
      </Modal>
    </>
  );
});

// Resources table using TanStack React Table
type ResourceRow = { id: string; name: string; type?: string; quantity?: string | number; notes?: string };
const ResourcesTable: React.FC<{ data: ResourceRow[] }> = ({ data }) => {
  const columns = React.useMemo<ColumnDef<ResourceRow>[]>(() => [
    { accessorKey: 'name', header: 'Name', cell: info => String(info.getValue() || '—') },
    { accessorKey: 'type', header: 'Type', cell: info => String(info.getValue() || '—') },
    { accessorKey: 'quantity', header: 'Quantity', cell: info => String(info.getValue() ?? '—') },
    { accessorKey: 'notes', header: 'Notes', cell: info => String(info.getValue() || '—') }
  ], []);
  const table = useReactTable({ data, columns, getCoreRowModel: getCoreRowModel() });
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          {table.getHeaderGroups().map(hg => (
            <tr key={hg.id}>
              {hg.headers.map(h => (
                <th key={h.id} style={{ textAlign: 'left', padding: '4px 6px' }}>
                  {flexRender(h.column.columnDef.header, h.getContext())}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map(r => (
            <tr key={r.id}>
              {r.getVisibleCells().map(c => (
                <td key={c.id} style={{ padding: '4px 6px' }}>{flexRender(c.column.columnDef.cell, c.getContext())}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

type PersonnelRow = { id: string; role: string; name: string; notes?: string };
const PersonnelTable: React.FC<{ data: PersonnelRow[] }> = ({ data }) => {
  const columns = React.useMemo<ColumnDef<PersonnelRow>[]>(() => [
    { accessorKey: 'role', header: 'Role', cell: info => String(info.getValue() || '—') },
    { accessorKey: 'name', header: 'Name', cell: info => String(info.getValue() || '—') },
    { accessorKey: 'notes', header: 'Notes', cell: info => String(info.getValue() || '—') }
  ], []);
  const table = useReactTable({ data, columns, getCoreRowModel: getCoreRowModel() });
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          {table.getHeaderGroups().map(hg => (
            <tr key={hg.id}>
              {hg.headers.map(h => (
                <th key={h.id} style={{ textAlign: 'left', padding: '4px 6px' }}>
                  {flexRender(h.column.columnDef.header, h.getContext())}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map(r => (
            <tr key={r.id}>
              {r.getVisibleCells().map(c => (
                <td key={c.id} style={{ padding: '4px 6px' }}>{flexRender(c.column.columnDef.cell, c.getContext())}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

RecommendationsList.displayName = 'RecommendationsList';


// Editable controls
type StringRow = { id: string; value: string };
const EditableStringTable: React.FC<{ title: string; rows: StringRow[]; setRows: (r: StringRow[]) => void }> = ({ title, rows, setRows }) => {
  const addRow = () => setRows([ ...rows, { id: `r-${Date.now()}`, value: '' } ]);
  const update = (id: string, value: string) => setRows(rows.map(r => r.id === id ? { ...r, value } : r));
  const remove = (id: string) => setRows(rows.filter(r => r.id !== id));
  return (
    <div>
      <div style={{ fontWeight: 600, marginBottom: 6 }}>{title}</div>
      {rows.map(r => (
        <Space key={r.id} style={{ display: 'flex', marginBottom: 6 }}>
          <Input value={r.value} onChange={(e) => update(r.id, e.target.value)} placeholder={`Enter ${title.toLowerCase()} item`} />
          <Button icon={<DeleteOutlined />} onClick={() => remove(r.id)} aria-label="Remove" />
        </Space>
      ))}
      <Button icon={<PlusOutlined />} onClick={addRow}>Add {title.slice(0, -1)}</Button>
    </div>
  );
};

const EditableResourceEditor: React.FC<{ rows: ResourceRow[]; setRows: (r: ResourceRow[]) => void }> = ({ rows, setRows }) => {
  const addRow = () => setRows([ ...rows, { id: `res-${Date.now()}`, name: '', type: '', quantity: '', notes: '' } ]);
  const update = (id: string, patch: Partial<ResourceRow>) => setRows(rows.map(r => r.id === id ? { ...r, ...patch } : r));
  const remove = (id: string) => setRows(rows.filter(r => r.id !== id));
  return (
    <div>
      <div style={{ fontWeight: 600, marginBottom: 6 }}>Resources</div>
      {rows.map(r => (
        <Space key={r.id} style={{ display: 'flex', marginBottom: 6 }} wrap>
          <Input placeholder="Name" value={r.name} onChange={(e) => update(r.id, { name: e.target.value })} style={{ width: 200 }} />
          <Input placeholder="Type" value={r.type} onChange={(e) => update(r.id, { type: e.target.value })} style={{ width: 140 }} />
          <Input placeholder="Quantity" value={(r.quantity as any) ?? ''} onChange={(e) => update(r.id, { quantity: e.target.value })} style={{ width: 120 }} />
          <Input placeholder="Notes" value={r.notes} onChange={(e) => update(r.id, { notes: e.target.value })} style={{ width: 260 }} />
          <Button icon={<DeleteOutlined />} onClick={() => remove(r.id)} aria-label="Remove" />
        </Space>
      ))}
      <Button icon={<PlusOutlined />} onClick={addRow}>Add Resource</Button>
    </div>
  );
};

const EditablePersonnelEditor: React.FC<{ rows: PersonnelRow[]; setRows: (r: PersonnelRow[]) => void }> = ({ rows, setRows }) => {
  const addRow = () => setRows([ ...rows, { id: `per-${Date.now()}`, role: '', name: '', notes: '' } ]);
  const update = (id: string, patch: Partial<PersonnelRow>) => setRows(rows.map(r => r.id === id ? { ...r, ...patch } : r));
  const remove = (id: string) => setRows(rows.filter(r => r.id !== id));
  return (
    <div>
      <div style={{ fontWeight: 600, marginBottom: 6 }}>Rescue Personnel</div>
      {rows.map(r => (
        <Space key={r.id} style={{ display: 'flex', marginBottom: 6 }} wrap>
          <Input placeholder="Role" value={r.role} onChange={(e) => update(r.id, { role: e.target.value })} style={{ width: 200 }} />
          <Input placeholder="Name" value={r.name} onChange={(e) => update(r.id, { name: e.target.value })} style={{ width: 220 }} />
          <Input placeholder="Notes" value={r.notes} onChange={(e) => update(r.id, { notes: e.target.value })} style={{ width: 260 }} />
          <Button icon={<DeleteOutlined />} onClick={() => remove(r.id)} aria-label="Remove" />
        </Space>
      ))}
      <Button icon={<PlusOutlined />} onClick={addRow}>Add Person</Button>
    </div>
  );
};

