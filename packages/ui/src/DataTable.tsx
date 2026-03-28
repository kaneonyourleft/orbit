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

/**
 * Clean Canvas Data Table for ORBIT Workspace OS.
 * Highly refined for white theme and status grouping.
 */
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
    const statusField = fields.find(f => f.name.toLowerCase() === 'status');
    const doneField = fields.find(f => f.type === 'checkbox');
    const isCompleted = (doneField && row[doneField.id] === true) || 
      (statusField && String(row[statusField.id] || '').toLowerCase().includes('completed'));
    
    return (
      <tr 
        key={row.id || rowIndex} 
        className={`border-b border-zinc-100 hover:bg-zinc-50/50 transition-colors group ${isCompleted ? 'opacity-50' : ''}`}
      >
        <td className="w-12 px-4 py-3">
          <input 
            type="checkbox" 
            className="rounded text-primary focus:ring-primary w-4 h-4 border-zinc-300 transition-all cursor-pointer"
            checked={isCompleted}
            onChange={() => {
              if (doneField) onUpdateCell(row.id, doneField.id, !row[doneField.id]);
            }}
            aria-label="Toggle task completion"
            title="Mark as complete"
          />
        </td>
        {fields.map((field) => (
          <td
            key={field.id}
            className={`px-4 py-3 text-sm truncate max-w-[240px] ${field.name.toLowerCase().includes('name') ? 'font-semibold text-zinc-800' : 'text-zinc-600'}`}
          >
            {field.name.toLowerCase() === 'owner' ? (
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-zinc-100 ring-2 ring-white overflow-hidden shadow-sm flex items-center justify-center border border-zinc-200">
                  <span className="text-[10px] font-bold text-zinc-500">{String(row[field.id] || '?').charAt(0).toUpperCase()}</span>
                </div>
                <span className="text-xs font-medium text-zinc-600">{row[field.id] || 'Unassigned'}</span>
              </div>
            ) : field.type === 'date' ? (
               <div className="flex flex-col">
                  <span className={isOverdue(row[field.id]) ? 'text-red-600 font-extrabold' : ''}>{row[field.id]}</span>
                  {isOverdue(row[field.id]) && <span className="text-[9px] font-black text-red-500 tracking-tighter uppercase">OVERDUE</span>}
               </div>
            ) : (
              <span className={isCompleted && field.name.toLowerCase().includes('name') ? 'line-through decoration-zinc-400 decoration-2' : ''}>
                <EditableCell
                  value={row[field.id]}
                  type={field.type}
                  field={field}
                  renderers={renderers}
                  onSave={(newValue) => onUpdateCell(row.id, field.id, newValue)}
                />
              </span>
            )}
          </td>
        ))}
        <td className="w-10 px-2 py-3">
          <button
            onClick={() => onDeleteRow(row.id)}
            className="opacity-0 group-hover:opacity-100 p-1.5 text-zinc-300 hover:text-red-500 hover:bg-red-50 transition-all rounded-lg"
            title="Delete Row"
          >
            <span className="material-symbols-outlined text-[18px]">delete</span>
          </button>
        </td>
      </tr>
    );
  };

  return (
    <div className="flex-1 overflow-auto hide-scrollbar pb-32 bg-white rounded-xl border border-zinc-200/50 shadow-sm ml-8 mr-8">
      <table className="w-full border-collapse text-left">
        <thead className="sticky top-0 bg-white/95 backdrop-blur-sm z-10 border-b border-zinc-200">
          <tr>
            <th className="w-12 px-4 py-3 border-b border-zinc-100">
              <input 
                type="checkbox" 
                className="rounded text-primary focus:ring-primary w-4 h-4 border-zinc-300"
                aria-label="Select all rows"
              />
            </th>
            {fields.map((field) => (
              <th
                key={field.id}
                className="px-4 py-4 text-[11px] font-black text-zinc-400 uppercase tracking-[0.15em] border-b border-zinc-100 group/header relative select-none"
                onDoubleClick={() => handleFieldDoubleClick(field)}
              >
                <div className="flex items-center gap-2">
                  {editingFieldId === field.id ? (
                    <input
                      autoFocus
                      className="bg-zinc-50 border border-primary px-2 py-1 rounded-md outline-none w-full text-zinc-800"
                      value={tempFieldName}
                      onChange={(e) => setTempFieldName(e.target.value)}
                      onBlur={() => handleFieldBlur(field.id)}
                      onKeyDown={(e) => e.key === 'Enter' && handleFieldBlur(field.id)}
                    />
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-xs text-zinc-300">{getFieldIcon(field.type)}</span>
                      <span>{field.name}</span>
                      <span className="material-symbols-outlined text-[14px] hidden group-hover/header:block cursor-pointer opacity-30 hover:opacity-100 ml-auto">more_horiz</span>
                    </>
                  )}
                </div>
              </th>
            ))}
            <th 
              className="w-10 px-2 py-4 border-b border-zinc-100 cursor-pointer hover:bg-zinc-50 text-center"
              onClick={onAddField}
              title="Add Field"
            >
              <span className="material-symbols-outlined text-zinc-300 hover:text-primary transition-colors">add</span>
            </th>
          </tr>
        </thead>
        <tbody className="text-sm">
          {groupedData ? (
            Object.entries(groupedData).map(([groupValue, groupRows]) => (
              <React.Fragment key={groupValue}>
                <tr 
                  className="bg-white group/header border-b border-zinc-100 cursor-pointer select-none"
                  onClick={() => toggleGroup(groupValue)}
                >
                  <td className="px-4 py-2 bg-white" colSpan={fields.length + 2}>
                    <div className="flex items-center gap-2">
                      <span className={`material-symbols-outlined text-lg text-zinc-300 transition-transform ${collapsedGroups[groupValue] ? '-rotate-90' : 'rotate-0'}`}>
                        keyboard_arrow_down
                      </span>
                      <span className={`px-2 py-0.5 rounded text-[11px] font-black uppercase tracking-widest border ${getStatusBadgeStyle(groupValue)}`}>
                        {groupValue}
                      </span>
                      <span className="text-[10px] bg-zinc-100 text-zinc-500 px-2 py-0.5 rounded-full font-bold min-w-[20px] text-center">
                        {groupRows.length}
                      </span>
                      <div className="flex-1 h-[1px] bg-zinc-100 mx-2"></div>
                      <button 
                        onClick={(e) => { e.stopPropagation(); onAddRow(groupValue); }}
                        className="opacity-0 group-hover/header:opacity-100 p-1 hover:bg-zinc-100 rounded text-zinc-400 hover:text-primary transition-all"
                        title="Add row to this group"
                      >
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
          
          <tr 
            onClick={() => onAddRow()}
            className="hover:bg-zinc-50 cursor-pointer group border-b border-zinc-50"
          >
            <td colSpan={fields.length + 2} className="px-8 py-4 text-zinc-300 text-xs font-bold uppercase tracking-widest">
              <div className="flex items-center gap-2 group-hover:text-primary transition-colors">
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

function getStatusBadgeStyle(status: string) {
  const s = String(status || '').toLowerCase();
  if (s.includes('planned')) return 'bg-zinc-50 text-zinc-500 border-zinc-200';
  if (s.includes('progress')) return 'bg-blue-50 text-[#0058BE] border-blue-100';
  if (s.includes('stuck')) return 'bg-red-50 text-red-700 border-red-100';
  if (s.includes('completed') || s.includes('done')) return 'bg-[#AFEFCB]/30 text-[#006C49] border-[#AFEFCB]/50';
  return 'bg-zinc-50 text-zinc-400 border-zinc-100';
}

function getPriorityBadgeStyle(priority: string) {
  const p = String(priority || '').toLowerCase();
  if (p.includes('critical')) return 'bg-red-50 text-red-700 border-red-100';
  if (p.includes('high')) return 'bg-amber-100 text-amber-800 border-amber-200';
  if (p.includes('mid') || p.includes('medium')) return 'bg-zinc-100 text-zinc-600 border-zinc-200';
  if (p.includes('low')) return 'bg-emerald-100 text-emerald-800 border-emerald-200';
  return 'bg-zinc-50 text-zinc-400 border-zinc-100';
}

function isOverdue(dateStr: any) {
  if (!dateStr || typeof dateStr !== 'string') return false;
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return false;
  return date < new Date() && date.toLocaleDateString() !== new Date().toLocaleDateString();
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
