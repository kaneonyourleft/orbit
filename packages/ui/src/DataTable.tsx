import React from 'react';
import { OrbitField } from '@orbit/core';
import { EditableCell } from './EditableCell';

interface DataTableProps {
  fields: OrbitField[];
  rows: Record<string, any>[];
  onUpdateCell: (rowId: string, fieldId: string, value: any) => void;
  onAddRow: () => void;
  onDeleteRow: (rowId: string) => void;
  onAddField: () => void;
  onRenameField: (fieldId: string, newName: string) => void;
  groupByFieldId?: string | null;
}

/**
 * Core Data Table component for ORBIT workspace.
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
}: DataTableProps & { groupByFieldId?: string | null, renderers?: Record<string, any> }) {
  const [editingFieldId, setEditingFieldId] = React.useState<string | null>(null);
  const [tempFieldName, setTempFieldName] = React.useState('');

  const groupedData = React.useMemo(() => {
    if (!groupByFieldId) return null;
    const groups: Record<string, typeof rows> = {};
    rows.forEach(row => {
      const val = String(row[groupByFieldId] || 'No value');
      if (!groups[val]) groups[val] = [];
      groups[val].push(row);
    });
    return groups;
  }, [rows, groupByFieldId]);

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

  const handleFieldKeyDown = (e: React.KeyboardEvent, fieldId: string) => {
    if (e.key === 'Enter') {
      handleFieldBlur(fieldId);
    } else if (e.key === 'Escape') {
      setEditingFieldId(null);
    }
  };

  const renderRow = (row: Record<string, any>, rowIndex: number) => (
    <tr key={row.id || rowIndex} className="border-b border-zinc-100 hover:bg-zinc-50/30 transition-colors group">
      <td className="w-12 px-4 py-3">
        <input 
          type="checkbox" 
          className="rounded text-primary w-4 h-4 border-zinc-300 focus:ring-primary"
          checked={row.selected}
          aria-label="Select row"
          title="Select row"
          readOnly
        />
      </td>
      {fields.map((field) => (
        <td
          key={field.id}
          className={`px-4 py-3 ${field.id === 'name' ? 'font-medium text-zinc-700' : ''}`}
        >
          {field.id === 'owner' ? (
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-zinc-200 border border-white overflow-hidden">
                <div className="w-full h-full flex items-center justify-center text-[10px] font-bold text-zinc-500">
                  {String(row[field.id] || '?').charAt(0)}
                </div>
              </div>
              <span className="text-xs font-medium">{row[field.id]}</span>
            </div>
          ) : (
            <EditableCell
              value={row[field.id]}
              type={field.type}
              field={field}
              renderers={renderers}
              onSave={(newValue) => onUpdateCell(row.id, field.id, newValue)}
            />
          )}
        </td>
      ))}
      <td className="w-10 px-2 py-3">
        <button
          onClick={() => onDeleteRow(row.id)}
          className="opacity-0 group-hover:opacity-100 p-1 text-zinc-400 hover:text-red-500 transition-all rounded"
          title="Delete Row"
        >
          <span className="material-symbols-outlined text-sm">delete</span>
        </button>
      </td>
    </tr>
  );

  return (
    <div className="flex-1 overflow-auto hide-scrollbar pb-12 bg-white">
      <table className="w-full border-collapse text-left border-spacing-0">
        <thead className="sticky top-0 bg-white/90 backdrop-blur-md z-10 border-b border-zinc-200">
          <tr>
            <th className="w-12 px-4 py-3 border-b border-zinc-200">
              <input 
                type="checkbox" 
                className="rounded text-primary focus:ring-primary w-4 h-4 border-zinc-300"
                aria-label="Select all rows"
                title="Select all rows"
              />
            </th>
            {fields.map((field) => (
              <th
                key={field.id}
                className="px-4 py-3 text-[11px] font-bold text-zinc-400 uppercase tracking-widest border-b border-zinc-200 group/header relative"
                onDoubleClick={() => handleFieldDoubleClick(field)}
              >
                <div className="flex items-center gap-2">
                  {editingFieldId === field.id ? (
                    <input
                      autoFocus
                      className="bg-zinc-50 border border-primary px-1 py-0.5 rounded outline-none w-full"
                      value={tempFieldName}
                      onChange={(e) => setTempFieldName(e.target.value)}
                      onBlur={() => handleFieldBlur(field.id)}
                      onKeyDown={(e) => handleFieldKeyDown(e, field.id)}
                      placeholder="Enter field name"
                      aria-label="Edit field name"
                      title="Edit field name"
                    />
                  ) : (
                    <>
                      <span>{field.name}</span>
                      <span className="material-symbols-outlined text-xs hidden group-hover/header:block cursor-pointer opacity-40">edit</span>
                    </>
                  )}
                </div>
              </th>
            ))}
            <th 
              className="w-10 px-2 py-3 border-b border-zinc-200 cursor-pointer hover:bg-zinc-50"
              onClick={onAddField}
            >
              <span className="material-symbols-outlined text-sm text-zinc-400">add</span>
            </th>
          </tr>
        </thead>
        <tbody className="text-sm">
          {groupedData ? (
            Object.entries(groupedData).map(([groupValue, groupRows]) => (
              <React.Fragment key={groupValue}>
                <tr className="bg-zinc-50/50 group/header border-y border-zinc-100">
                  <td className="px-4 py-2" colSpan={fields.length + 2}>
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-lg text-zinc-400">keyboard_arrow_down</span>
                      <span className={`text-[11px] font-bold uppercase ${getStatusColorClass(groupValue)}`}>
                        {groupValue}
                      </span>
                      <span className="text-[10px] bg-zinc-200 text-zinc-600 px-1.5 rounded-full font-bold">
                        {groupRows.length}
                      </span>
                    </div>
                  </td>
                </tr>
                {groupRows.map((row, idx) => renderRow(row, idx))}
              </React.Fragment>
            ))
          ) : (
            rows.map((row, rowIndex) => renderRow(row, rowIndex))
          )}
          
          <tr 
            onClick={onAddRow}
            className="hover:bg-zinc-50 cursor-pointer border-b border-zinc-100 group"
          >
            <td colSpan={fields.length + 2} className="px-8 py-3 text-zinc-400 text-xs font-medium">
              <div className="flex items-center gap-2">
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

function getStatusColorClass(status: string) {
  const s = status.toLowerCase();
  if (s.includes('progress')) return 'text-blue-600';
  if (s.includes('planned')) return 'text-zinc-600';
  if (s.includes('stuck')) return 'text-red-600';
  if (s.includes('completed')) return 'text-emerald-600';
  return 'text-zinc-500';
}

function getFieldIcon(type: string) {
  switch (type) {
    case 'text': return 'Txt';
    case 'number': return 'Num';
    case 'select': return 'Sel';
    case 'date': return 'Dat';
    case 'checkbox': return 'Chk';
    default: return '◈';
  }
}
