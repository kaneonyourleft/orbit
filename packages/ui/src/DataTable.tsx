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

function StatusSelect({ value, onSave, options }: { value: any; onSave: (v: string) => void; options: string[] }) {
  const [open, setOpen] = React.useState(false);
  const s = String(value || '').toLowerCase();
  const style = s.includes('progress') ? 'bg-blue-50 text-[#0058BE] border-blue-100'
    : s.includes('planned') ? 'bg-zinc-50 text-zinc-500 border-zinc-200'
    : s.includes('stuck') ? 'bg-red-50 text-red-700 border-red-100'
    : (s.includes('completed') || s.includes('done')) ? 'bg-[#AFEFCB]/30 text-[#006C49] border-[#AFEFCB]/50'
    : 'bg-zinc-50 text-zinc-400 border-zinc-100';

  if (open) return (
    <select autoFocus className="bg-white border border-[#0058BE] rounded px-2 py-1 text-xs font-bold outline-none" value={value || ''}
      onChange={(e) => { onSave(e.target.value); setOpen(false); }} onBlur={() => setOpen(false)} title="Status">
      <option value="">Unset</option>
      {options.map(o => <option key={o} value={o}>{o}</option>)}
    </select>
  );

  return (
    <button onClick={() => setOpen(true)} className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border cursor-pointer hover:opacity-80 transition-opacity ${style}`}>
      {value || 'Unset'}
    </button>
  );
}

function PrioritySelect({ value, onSave, options }: { value: any; onSave: (v: string) => void; options: string[] }) {
  const [open, setOpen] = React.useState(false);
  const p = String(value || '').toLowerCase();
  const style = p.includes('critical') ? 'bg-red-50 text-red-700 border-red-100'
    : p.includes('high') ? 'bg-amber-100 text-amber-800 border-amber-200'
    : (p.includes('mid') || p.includes('medium')) ? 'bg-zinc-100 text-zinc-600 border-zinc-200'
    : p.includes('low') ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
    : 'bg-zinc-50 text-zinc-400 border-zinc-100';

  if (open) return (
    <select autoFocus className="bg-white border border-[#0058BE] rounded px-2 py-1 text-xs font-bold outline-none" value={value || ''}
      onChange={(e) => { onSave(e.target.value); setOpen(false); }} onBlur={() => setOpen(false)} title="Priority">
      <option value="">Unset</option>
      {options.map(o => <option key={o} value={o}>{o}</option>)}
    </select>
  );

  return (
    <button onClick={() => setOpen(true)} className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border cursor-pointer hover:opacity-80 transition-opacity ${style}`}>
      {value || 'Unset'}
    </button>
  );
}

export function DataTable({
  fields,
  rows,
  onUpdateCell,
  onAddRow,
  onDeleteRow,
  onAddField,
  onRenameField,
  groupByFieldId,
  renderers = {}
}: DataTableProps) {
  const [editingFieldId, setEditingFieldId] = React.useState<string | null>(null);
  const [tempFieldName, setTempFieldName] = React.useState('');
  const [collapsedGroups, setCollapsedGroups] = React.useState<Record<string, boolean>>({});

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

  const toggleGroup = (group: string) => {
    setCollapsedGroups(prev => ({ ...prev, [group]: !prev[group] }));
  };

  const handleFieldDoubleClick = (field: OrbitField) => {
    setEditingFieldId(field.id);
    setTempFieldName(field.name);
  };

  const handleFieldBlur = (fieldId: string) => {
    if (tempFieldName.trim() && tempFieldName !== fields.find(f => f.id === fieldId)?.name) {
      onRenameField(fieldId, tempFieldName);
    }
    setEditingFieldId(null);
  };

  const renderRow = (row: Record<string, any>, rowIndex: number) => {
    const doneField = fields.find(f => f.type === 'checkbox');
    const isChecked = doneField ? (row[doneField.id] === true || row[doneField.id] === 'true') : false;
    const isCompleted = isChecked;

    return (
      <tr key={row.id || rowIndex} className={`border-b border-zinc-100 hover:bg-zinc-50/50 transition-colors group ${isCompleted ? 'opacity-50' : ''}`}>
        <td className="w-10 px-3 py-2.5">
          <input type="checkbox" className="rounded text-[#0058BE] focus:ring-[#0058BE] w-4 h-4 border-zinc-300 cursor-pointer"
            checked={isChecked} onChange={() => { if (doneField) onUpdateCell(row.id, doneField.id, !isChecked); }}
            aria-label="Toggle completion" />
        </td>
        {fields.map((field) => {
          const val = row[field.id];
          const fname = field.name.toLowerCase();

          if (field.type === 'checkbox') return (
            <td key={field.id} className="px-3 py-2.5 text-sm text-zinc-500">
              {isChecked ? <span className="text-[#006C49] font-bold text-xs">Done</span> : <span className="text-zinc-300 text-xs">—</span>}
            </td>
          );

          if (fname === 'status') return (
            <td key={field.id} className="px-3 py-2.5">
              <StatusSelect value={val} onSave={(v) => onUpdateCell(row.id, field.id, v)}
                options={['Planned', 'In Progress', 'Stuck', 'Completed', 'Done']} />
            </td>
          );

          if (fname === 'priority') return (
            <td key={field.id} className="px-3 py-2.5">
              <PrioritySelect value={val} onSave={(v) => onUpdateCell(row.id, field.id, v)}
                options={['Critical', 'High', 'Mid', 'Low']} />
            </td>
          );

          if (fname === 'owner') return (
            <td key={field.id} className="px-3 py-2.5">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-zinc-100 border border-zinc-200 flex items-center justify-center text-[10px] font-bold text-zinc-500 shrink-0">
                  {String(val || '?').charAt(0).toUpperCase()}
                </div>
                <span className="text-xs font-medium text-zinc-600 truncate">{val || 'Unassigned'}</span>
              </div>
            </td>
          );

          if (field.type === 'date') return (
            <td key={field.id} className="px-3 py-2.5 text-sm">
              {val ? (
                <div className="flex flex-col">
                  <span className={`text-xs ${isOverdue(val) ? 'text-red-600 font-bold' : 'text-zinc-600'}`}>
                    {new Date(val).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                  {isOverdue(val) && <span className="text-[9px] font-black text-red-500 uppercase">OVERDUE</span>}
                </div>
              ) : <span className="text-zinc-300 text-xs">—</span>}
            </td>
          );

          if (fname.includes('name')) return (
            <td key={field.id} className="px-3 py-2.5">
              <span className={isChecked ? 'line-through decoration-zinc-400 decoration-2' : ''}>
                <EditableCell value={val} type={field.type} field={field} renderers={renderers}
                  onSave={(v) => onUpdateCell(row.id, field.id, v)} />
              </span>
            </td>
          );

          return (
            <td key={field.id} className="px-3 py-2.5 text-sm text-zinc-600">
              <EditableCell value={val} type={field.type} field={field} renderers={renderers}
                onSave={(v) => onUpdateCell(row.id, field.id, v)} />
            </td>
          );
        })}
        <td className="w-8 px-2 py-2.5">
          <button onClick={() => onDeleteRow(row.id)} className="opacity-0 group-hover:opacity-100 p-1 text-zinc-300 hover:text-red-500 hover:bg-red-50 rounded transition-all" title="Delete">
            <span className="material-symbols-outlined text-[16px]">delete</span>
          </button>
        </td>
      </tr>
    );
  };

  return (
    <div className="flex-1 overflow-auto hide-scrollbar pb-32 bg-white rounded-xl border border-zinc-200/50 shadow-sm">
      <table className="w-full border-collapse text-left">
        <thead className="sticky top-0 bg-white/95 backdrop-blur-sm z-10 border-b border-zinc-200">
          <tr>
            <th className="w-10 px-3 py-3 border-b border-zinc-100">
              <input type="checkbox" className="rounded text-[#0058BE] focus:ring-[#0058BE] w-4 h-4 border-zinc-300" aria-label="Select all" />
            </th>
            {fields.map((field) => (
              <th key={field.id} className="px-3 py-4 text-[11px] font-black text-zinc-400 uppercase tracking-[0.15em] border-b border-zinc-100 group/header relative select-none"
                onDoubleClick={() => handleFieldDoubleClick(field)}>
                <div className="flex items-center gap-2">
                  {editingFieldId === field.id ? (
                    <input autoFocus className="bg-zinc-50 border border-[#0058BE] px-2 py-1 rounded-md outline-none w-full text-zinc-800"
                      value={tempFieldName} onChange={(e) => setTempFieldName(e.target.value)}
                      onBlur={() => handleFieldBlur(field.id)} onKeyDown={(e) => e.key === 'Enter' && handleFieldBlur(field.id)} />
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-xs text-zinc-300">{getFieldIcon(field.type)}</span>
                      <span>{field.name}</span>
                    </>
                  )}
                </div>
              </th>
            ))}
            <th className="w-10 px-2 py-4 border-b border-zinc-100 cursor-pointer hover:bg-zinc-50 text-center" onClick={onAddField} title="Add Field">
              <span className="material-symbols-outlined text-zinc-300 hover:text-[#0058BE] transition-colors">add</span>
            </th>
          </tr>
        </thead>
        <tbody className="text-sm">
          {groupedData ? (
            Object.entries(groupedData).map(([groupValue, groupRows]) => (
              <React.Fragment key={groupValue}>
                <tr className="bg-white group/header border-b border-zinc-100 cursor-pointer select-none" onClick={() => toggleGroup(groupValue)}>
                  <td className="px-3 py-2 bg-white" colSpan={fields.length + 2}>
                    <div className="flex items-center gap-2">
                      <span className={`material-symbols-outlined text-lg text-zinc-300 transition-transform ${collapsedGroups[groupValue] ? '-rotate-90' : 'rotate-0'}`}>
                        keyboard_arrow_down
                      </span>
                      <span className="text-[11px] font-black uppercase tracking-widest text-[#0058BE]">{groupValue}</span>
                      <span className="text-[10px] bg-zinc-100 text-zinc-500 px-2 py-0.5 rounded-full font-bold">{groupRows.length}</span>
                      <div className="flex-1 h-[1px] bg-zinc-100 mx-2"></div>
                      <button onClick={(e) => { e.stopPropagation(); onAddRow(groupValue); }} className="opacity-0 group-hover/header:opacity-100 p-1 hover:bg-zinc-100 rounded text-zinc-400 hover:text-[#0058BE] transition-all" title="Add row">
                         <span className="material-symbols-outlined text-sm">add</span>
                      </button>
                    </div>
                  </td>
                </tr>
                {!collapsedGroups[groupValue] && groupRows.map((row, idx) => renderRow(row, idx))}
              </React.Fragment>
            ))
          ) : (
            rows.map((row, rowIndex) => renderRow(row, rowIndex))
          )}
          <tr onClick={() => onAddRow()} className="hover:bg-zinc-50 cursor-pointer group border-b border-zinc-50">
            <td colSpan={fields.length + 2} className="px-8 py-4 text-zinc-300 text-xs font-bold uppercase tracking-widest">
              <div className="flex items-center gap-2 group-hover:text-[#0058BE] transition-colors">
                <span className="material-symbols-outlined text-sm">add</span>
                <span>New Task</span>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

function getFieldIcon(type: string) {
  switch (type) {
    case 'text': return 'notes';
    case 'number': return '123';
    case 'select': return 'list';
    case 'status': return 'potted_plant';
    case 'date': return 'calendar_month';
    case 'checkbox': return 'check_box';
    case 'owner': return 'account_circle';
    default: return 'widgets';
  }
}

function isOverdue(dateStr: any) {
  if (!dateStr || typeof dateStr !== 'string') return false;
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return false;
  return date < new Date() && date.toLocaleDateString() !== new Date().toLocaleDateString();
}
