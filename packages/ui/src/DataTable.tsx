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
    <tr key={row.id || rowIndex} className="hover:bg-zinc-800/20 transition-all group">
      <td className="px-4 py-3 text-center text-zinc-600 font-mono text-[11px] relative">
        <span className="group-hover:opacity-0 transition-opacity">{rowIndex + 1}</span>
        <button
          onClick={() => onDeleteRow(row.id)}
          className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 text-zinc-600 hover:text-red-500 transition-all"
          title="Delete Row"
          aria-label="Delete Row"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-trash-2"><path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" /><line x1="10" x2="10" y1="11" y2="17" /><line x1="14" x2="14" y1="11" y2="17" /></svg>
        </button>
      </td>
      {fields.map((field) => (
        <td
          key={field.id}
          className="px-4 py-3 border-r border-zinc-800/10 last:border-0 relative"
        >
          <EditableCell
            value={row[field.id]}
            type={field.type}
            field={field}
            renderers={renderers}
            onSave={(newValue) => onUpdateCell(row.id, field.id, newValue)}
          />
        </td>
      ))}
      <td className="px-4 py-3"></td>
    </tr>
  );

  return (
    <div className="w-full overflow-hidden border border-zinc-800/50 rounded-2xl bg-zinc-900/20 backdrop-blur-sm shadow-2xl">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left text-sm text-zinc-300 table-fixed">
          <thead>
            <tr className="border-b border-zinc-800/50 bg-zinc-900/40">
              <th className="px-4 py-3 font-semibold text-zinc-600 w-12 text-center uppercase text-[10px] tracking-widest">#</th>
              {fields.map((field) => (
                <th
                  key={field.id}
                  className="px-4 py-3 font-semibold border-r border-zinc-800/20 last:border-0 min-w-[200px] group/header relative"
                  onDoubleClick={() => handleFieldDoubleClick(field)}
                >
                  <div className="flex items-center space-x-2">
                    <span className="text-zinc-500 text-[10px] uppercase font-mono bg-zinc-800 px-1.5 py-0.5 rounded leading-none shrink-0">
                      {getFieldIcon(field.type)}
                    </span>
                    {editingFieldId === field.id ? (
                      <input
                        autoFocus
                        className="bg-zinc-800 text-white px-1 py-0.5 rounded outline-none border border-blue-500 w-full"
                        value={tempFieldName}
                        onChange={(e) => setTempFieldName(e.target.value)}
                        onBlur={() => handleFieldBlur(field.id)}
                        onKeyDown={(e) => handleFieldKeyDown(e, field.id)}
                        title="Edit Field Name"
                        placeholder="Field name"
                      />
                    ) : (
                      <span className="text-zinc-400 truncate flex-1">{field.name}</span>
                    )}
                  </div>
                </th>
              ))}
              <th
                onClick={onAddField}
                title="Add Field"
                className="px-4 py-3 w-12 text-center text-zinc-600 cursor-pointer hover:bg-zinc-800/50 hover:text-blue-400 transition-colors"
                aria-label="Add Field"
              >
                <div className="flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-plus"><path d="M5 12h14" /><path d="M12 5v14" /></svg>
                </div>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/30">
            {groupedData ? (
              Object.entries(groupedData).map(([groupValue, groupRows]) => (
                <React.Fragment key={groupValue}>
                  <tr className="bg-zinc-900/60 group/group-header">
                    <td
                      colSpan={fields.length + 2}
                      className="px-4 py-2 text-[11px] font-bold text-zinc-500 border-y border-zinc-800/50"
                    >
                      <div className="flex items-center space-x-2">
                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-zinc-700 transition-transform group-hover/group-header:translate-x-0.5"><path d="m6 9 6 6 6-6" /></svg>
                        <span className="text-zinc-400 uppercase tracking-tight">{fields.find(f => f.id === groupByFieldId)?.name}:</span>
                        <span className="text-blue-400 px-2 py-0.5 bg-blue-500/10 rounded border border-blue-500/10">{groupValue}</span>
                        <span className="text-zinc-700 font-mono ml-2">{groupRows.length} rows</span>
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
              className="hover:bg-blue-600/5 transition-colors cursor-pointer group"
            >
              <td
                className="px-6 py-3 text-zinc-600 text-xs font-medium group-hover:text-blue-400 transition-colors"
                colSpan={fields.length + 2}
              >
                <div className="flex items-center space-x-2">
                  <span className="text-lg">+</span>
                  <span>Add new row</span>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
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
