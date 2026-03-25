import React from 'react';
import { OrbitField } from '@orbit/core';
import { EditableCell } from './EditableCell';

interface DataTableProps {
  fields: OrbitField[];
  rows: Record<string, any>[];
  onUpdateCell: (rowId: string, fieldId: string, value: any) => void;
  onAddRow: () => void;
}

/**
 * Core Data Table component for ORBIT workspace.
 */
export function DataTable({ fields, rows, onUpdateCell, onAddRow }: DataTableProps) {
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
                  className="px-4 py-3 font-semibold border-r border-zinc-800/20 last:border-0 min-w-[200px]"
                >
                  <div className="flex items-center space-x-2">
                    <span className="text-zinc-500 text-[10px] uppercase font-mono bg-zinc-800 px-1.5 py-0.5 rounded leading-none">
                      {getFieldIcon(field.type)}
                    </span>
                    <span className="text-zinc-400">{field.name}</span>
                  </div>
                </th>
              ))}
              <th className="px-4 py-3 w-12 text-center text-zinc-600 cursor-pointer hover:text-zinc-300 transition-colors">
                <span className="text-lg">+</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/30">
            {rows.map((row, rowIndex) => (
              <tr key={row.id || rowIndex} className="hover:bg-zinc-800/20 transition-all group">
                <td className="px-4 py-3 text-center text-zinc-600 font-mono text-[11px]">
                  {rowIndex + 1}
                </td>
                {fields.map((field) => (
                  <td
                    key={field.id}
                    className="px-4 py-3 border-r border-zinc-800/10 last:border-0 relative"
                  >
                    <EditableCell 
                      value={row[field.id]} 
                      type={field.type} 
                      onSave={(newValue) => onUpdateCell(row.id, field.id, newValue)} 
                    />
                  </td>
                ))}
                <td className="px-4 py-3"></td>
              </tr>
            ))}
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

