import React from 'react';
import { OrbitField } from '@orbit/core';
import { EditableCell } from './EditableCell';

interface DataTableProps {
  fields: OrbitField[];
  rows: Record<string, any>[];
  onUpdateCell: (rowId: string, fieldId: string, value: any) => void;
  onAddRow: (status?: string) => void;
  onDeleteRow: (rowId: string) => void;
  onAddField: () => void;
  onRenameField: (fieldId: string, newName: string) => void;
  groupByFieldId?: string | null;
  renderers?: Record<string, any>;
}

/* ── Inline Select for Status ── */
function StatusSelect({ value, onSave, options }: { value: any; onSave: (v: string) => void; options: string[] }) {
  const [open, setOpen] = React.useState(false);
  const s = String(value || '').toLowerCase();
  const style = s.includes('progress') ? 'bg-[#DBEAFE] text-[#1D4ED8]'
    : s.includes('planned') ? 'bg-[#F3F4F6] text-[#6B7280]'
    : s.includes('stuck') ? 'bg-[#FEE2E2] text-[#DC2626]'
    : (s.includes('completed') || s.includes('done')) ? 'bg-[#D1FAE5] text-[#059669]'
    : 'bg-[#F3F4F6] text-[#9CA3AF]';

  if (open) return (
    <select autoFocus className="bg-white border border-[#0058BE] rounded-md px-2 py-1 text-[11px] font-semibold outline-none shadow-sm"
      value={value || ''} onChange={(e) => { onSave(e.target.value); setOpen(false); }} onBlur={() => setOpen(false)} title="Status">
      <option value="">Unset</option>
      {options.map(o => <option key={o} value={o}>{o}</option>)}
    </select>
  );
  return (
    <button onClick={() => setOpen(true)} className={`inline-flex px-2.5 py-1 rounded-md text-[11px] font-semibold cursor-pointer hover:opacity-80 transition-all ${style}`}>
      {value || 'Unset'}
    </button>
  );
}

/* ── Inline Select for Priority ── */
function PrioritySelect({ value, onSave, options }: { value: any; onSave: (v: string) => void; options: string[] }) {
  const [open, setOpen] = React.useState(false);
  const p = String(value || '').toLowerCase();
  const style = p.includes('critical') ? 'bg-[#FEE2E2] text-[#DC2626]'
    : p.includes('high') ? 'bg-[#FEF3C7] text-[#D97706]'
    : (p.includes('mid') || p.includes('medium')) ? 'bg-[#F3F4F6] text-[#6B7280]'
    : p.includes('low') ? 'bg-[#D1FAE5] text-[#059669]'
    : 'bg-[#F3F4F6] text-[#9CA3AF]';

  if (open) return (
    <select autoFocus className="bg-white border border-[#0058BE] rounded-md px-2 py-1 text-[11px] font-semibold outline-none shadow-sm"
      value={value || ''} onChange={(e) => { onSave(e.target.value); setOpen(false); }} onBlur={() => setOpen(false)} title="Priority">
      <option value="">Unset</option>
      {options.map(o => <option key={o} value={o}>{o}</option>)}
    </select>
  );
  return (
    <button onClick={() => setOpen(true)} className={`inline-flex px-2.5 py-1 rounded-md text-[11px] font-semibold cursor-pointer hover:opacity-80 transition-all ${style}`}>
      {value || 'Unset'}
    </button>
  );
}

/* ── Group Header Status Color Dot ── */
function groupDotColor(status: string) {
  const s = status.toLowerCase();
  if (s.includes('progress')) return 'bg-[#3B82F6]';
  if (s.includes('planned')) return 'bg-[#9CA3AF]';
  if (s.includes('stuck')) return 'bg-[#EF4444]';
  if (s.includes('completed') || s.includes('done')) return 'bg-[#10B981]';
  return 'bg-[#D1D5DB]';
}

/* ── Main DataTable ── */
export function DataTable({ fields, rows, onUpdateCell, onAddRow, onDeleteRow, onAddField, onRenameField, groupByFieldId, renderers = {} }: DataTableProps) {
  const [editingFieldId, setEditingFieldId] = React.useState<string | null>(null);
  const [tempFieldName, setTempFieldName] = React.useState('');
  const [collapsedGroups, setCollapsedGroups] = React.useState<Record<string, boolean>>({});

  // Filter out checkbox fields from visible columns (checkbox is the left-side row selector)
  const visibleFields = fields.filter(f => f.type !== 'checkbox');

  const groupedData = React.useMemo(() => {
    if (!groupByFieldId) return null;
    const groups: Record<string, typeof rows> = {};
    rows.forEach(row => {
      const val = String(row[groupByFieldId] || 'No Status');
      if (!groups[val]) groups[val] = [];
      groups[val].push(row);
    });
    return groups;
  }, [rows, groupByFieldId]);

  const toggleGroup = (g: string) => setCollapsedGroups(prev => ({ ...prev, [g]: !prev[g] }));

  const handleFieldDoubleClick = (field: OrbitField) => { setEditingFieldId(field.id); setTempFieldName(field.name); };
  const handleFieldBlur = (fieldId: string) => {
    if (tempFieldName.trim() && tempFieldName !== fields.find(f => f.id === fieldId)?.name) onRenameField(fieldId, tempFieldName);
    setEditingFieldId(null);
  };

  const renderRow = (row: Record<string, any>, rowIndex: number) => {
    const doneField = fields.find(f => f.type === 'checkbox');
    const isChecked = doneField ? (row[doneField.id] === true || row[doneField.id] === 'true') : false;

    return (
      <tr key={row.id || rowIndex} className={`border-b border-[#F3F4F6] hover:bg-[#F9FAFB] transition-colors group ${isChecked ? 'opacity-50' : ''}`}>
        <td className="w-10 px-4 py-3">
          <input type="checkbox" className="rounded border-[#D1D5DB] text-[#0058BE] focus:ring-[#0058BE] w-4 h-4 cursor-pointer"
            checked={isChecked} onChange={() => { if (doneField) onUpdateCell(row.id, doneField.id, !isChecked); }} />
        </td>
        {visibleFields.map((field) => {
          const val = row[field.id];
          const fname = field.name.toLowerCase();

          if (fname === 'status') return (
            <td key={field.id} className="px-4 py-3">
              <StatusSelect value={val} onSave={(v) => onUpdateCell(row.id, field.id, v)} options={['Planned', 'In Progress', 'Stuck', 'Completed', 'Done']} />
            </td>
          );
          if (fname === 'priority') return (
            <td key={field.id} className="px-4 py-3">
              <PrioritySelect value={val} onSave={(v) => onUpdateCell(row.id, field.id, v)} options={['Critical', 'High', 'Mid', 'Low']} />
            </td>
          );
          if (fname === 'owner') return (
            <td key={field.id} className="px-4 py-3">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-full bg-[#F3F4F6] border border-[#E5E7EB] flex items-center justify-center text-[10px] font-semibold text-[#6B7280] shrink-0">
                  {String(val || '?').charAt(0).toUpperCase()}
                </div>
                <span className="text-[13px] text-[#374151]">{val || 'Unassigned'}</span>
              </div>
            </td>
          );
          if (field.type === 'date') return (
            <td key={field.id} className="px-4 py-3">
              {val ? (
                <div className="flex flex-col gap-0.5">
                  <span className={`text-[13px] ${isOverdue(val) ? 'text-[#DC2626] font-semibold' : 'text-[#6B7280]'}`}>
                    {new Date(val).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                  {isOverdue(val) && <span className="text-[9px] font-bold text-[#DC2626] uppercase tracking-wide">Overdue</span>}
                </div>
              ) : <span className="text-[#D1D5DB] text-[13px]">—</span>}
            </td>
          );
          if (fname.includes('name')) return (
            <td key={field.id} className="px-4 py-3">
              <span className={isChecked ? 'line-through text-[#9CA3AF]' : 'text-[#111827] font-medium'}>
                <EditableCell value={val} type={field.type} field={field} renderers={renderers} onSave={(v) => onUpdateCell(row.id, field.id, v)} />
              </span>
            </td>
          );
          return (
            <td key={field.id} className="px-4 py-3 text-[13px] text-[#6B7280]">
              <EditableCell value={val} type={field.type} field={field} renderers={renderers} onSave={(v) => onUpdateCell(row.id, field.id, v)} />
            </td>
          );
        })}
        <td className="w-8 px-2 py-3">
          <button onClick={() => onDeleteRow(row.id)} className="opacity-0 group-hover:opacity-100 p-1 text-[#D1D5DB] hover:text-[#EF4444] hover:bg-[#FEE2E2] rounded transition-all">
            <span className="material-symbols-outlined text-[16px]">delete</span>
          </button>
        </td>
      </tr>
    );
  };

  return (
    <div className="overflow-auto hide-scrollbar bg-white rounded-lg border border-[#E5E7EB]">
      <table className="w-full border-collapse text-left">
        <thead className="sticky top-0 bg-white z-10 border-b border-[#E5E7EB]">
          <tr>
            <th className="w-10 px-4 py-3"><input type="checkbox" className="rounded border-[#D1D5DB] text-[#0058BE] w-4 h-4" aria-label="Select all" /></th>
            {visibleFields.map((field) => (
              <th key={field.id} className="px-4 py-3 text-[11px] font-semibold text-[#9CA3AF] uppercase tracking-wider select-none" onDoubleClick={() => handleFieldDoubleClick(field)}>
                {editingFieldId === field.id ? (
                  <input autoFocus className="bg-[#F9FAFB] border border-[#0058BE] px-2 py-1 rounded text-[#111827] outline-none w-full text-xs"
                    value={tempFieldName} onChange={(e) => setTempFieldName(e.target.value)}
                    onBlur={() => handleFieldBlur(field.id)} onKeyDown={(e) => e.key === 'Enter' && handleFieldBlur(field.id)} />
                ) : (
                  <div className="flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[12px] text-[#D1D5DB]">{getFieldIcon(field.type)}</span>
                    {field.name}
                  </div>
                )}
              </th>
            ))}
            <th className="w-10 px-2 py-3 cursor-pointer hover:bg-[#F9FAFB] text-center" onClick={onAddField}>
              <span className="material-symbols-outlined text-[#D1D5DB] hover:text-[#0058BE] text-lg transition-colors">add</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {groupedData ? (
            Object.entries(groupedData).map(([groupValue, groupRows]) => (
              <React.Fragment key={groupValue}>
                <tr className="cursor-pointer select-none hover:bg-[#F9FAFB]" onClick={() => toggleGroup(groupValue)}>
                  <td className="px-4 py-2.5" colSpan={visibleFields.length + 2}>
                    <div className="flex items-center gap-2.5">
                      <span className={`material-symbols-outlined text-base text-[#9CA3AF] transition-transform ${collapsedGroups[groupValue] ? '-rotate-90' : ''}`}>keyboard_arrow_down</span>
                      <span className={`w-2 h-2 rounded-full ${groupDotColor(groupValue)}`} />
                      <span className="text-[13px] font-semibold text-[#374151]">{groupValue}</span>
                      <span className="text-[11px] bg-[#F3F4F6] text-[#6B7280] px-1.5 py-0.5 rounded-full font-medium">{groupRows.length}</span>
                      <button onClick={(e) => { e.stopPropagation(); onAddRow(groupValue); }} className="ml-auto opacity-0 group-hover:opacity-100 text-[#9CA3AF] hover:text-[#0058BE] transition-all">
                        <span className="material-symbols-outlined text-sm">add</span>
                      </button>
                    </div>
                  </td>
                </tr>
                {!collapsedGroups[groupValue] && groupRows.map((row, idx) => renderRow(row, idx))}
              </React.Fragment>
            ))
          ) : rows.map((row, i) => renderRow(row, i))}
          <tr onClick={() => onAddRow()} className="hover:bg-[#F9FAFB] cursor-pointer">
            <td colSpan={visibleFields.length + 2} className="px-4 py-3">
              <div className="flex items-center gap-2 text-[#9CA3AF] hover:text-[#0058BE] transition-colors text-[13px] font-medium">
                <span className="material-symbols-outlined text-sm">add</span>New Task
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

function getFieldIcon(type: string) {
  switch (type) { case 'text': return 'notes'; case 'number': return '123'; case 'select': return 'list'; case 'date': return 'calendar_month'; case 'checkbox': return 'check_box'; default: return 'widgets'; }
}
function isOverdue(d: any) { if (!d || typeof d !== 'string') return false; const dt = new Date(d); return !isNaN(dt.getTime()) && dt < new Date() && dt.toDateString() !== new Date().toDateString(); }
