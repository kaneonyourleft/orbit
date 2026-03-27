import React from 'react';
import { OrbitField } from '@orbit/core';

interface KanbanBoardProps {
  fields: OrbitField[];
  rows: Record<string, any>[];
  onUpdateCell: (rowId: string, fieldId: string, value: any) => void;
  onAddRow: (status?: string) => void;
}

/**
 * Kanban board view for task management.
 * Groups rows by 'Status' select field.
 */
export function KanbanBoard({ fields, rows, onUpdateCell, onAddRow }: KanbanBoardProps) {
  const statusField = fields.find(f => f.name.toLowerCase() === 'status' && f.type === 'select');
  const priorityField = fields.find(f => f.name.toLowerCase() === 'priority' && f.type === 'select');
  const ownerField = fields.find(f => f.name.toLowerCase() === 'owner');
  const dueDateField = fields.find(f => f.type === 'date');

  const defaultStatuses = ['To Do', 'In Progress', 'In Review', 'Done'];
  const statusOptions = statusField?.options as string[] || defaultStatuses;

  const groupedRows = statusOptions.map(status => {
    return {
      status,
      rows: rows.filter(r => r[statusField?.id || 'status'] === status)
    };
  });

  return (
    <div className="flex space-x-6 h-[calc(100vh-280px)] overflow-x-auto pb-4 scrollbar-hide">
      {groupedRows.map(({ status, rows: columnRows }) => (
        <div key={status} className="flex flex-col w-72 shrink-0 space-y-4">
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center space-x-2">
              <h3 className="text-sm font-semibold text-zinc-300">{status}</h3>
              <span className="px-1.5 py-0.5 rounded-full bg-zinc-800 text-[10px] font-bold text-zinc-500 font-mono">
                {columnRows.length}
              </span>
            </div>
          </div>

          <div className="flex-1 space-y-3 p-2 bg-zinc-900/40 rounded-2xl border border-zinc-800/30 overflow-y-auto scrollbar-hide shadow-inner">
            {columnRows.map(row => (
              <div 
                key={row.id} 
                className="p-4 bg-zinc-800/80 border border-zinc-700/50 rounded-xl shadow-lg hover:shadow-blue-500/5 hover:border-zinc-600/50 transition-all cursor-pointer group"
              >
                <div className="space-y-3">
                  <div className="flex justify-between items-start">
                    <p className="text-sm font-bold text-zinc-100 leading-snug group-hover:text-blue-400 transition-colors">
                      {row[fields.find(f => f.name === 'Task Name')?.id || fields[0].id] || 'Untitled Task'}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {priorityField && row[priorityField.id] && (
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${getPriorityStyle(row[priorityField.id])}`}>
                        {row[priorityField.id]}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-zinc-700/50 group-hover:border-zinc-700">
                    <div className="flex items-center space-x-2">
                      <div className="w-5 h-5 rounded-full bg-zinc-700 flex items-center justify-center text-[10px] font-bold text-zinc-400">
                        {row[ownerField?.id || '']?.charAt(0) || 'U'}
                      </div>
                      <span className="text-[10px] text-zinc-500 font-medium">{row[ownerField?.id || ''] || 'Unassigned'}</span>
                    </div>
                    {dueDateField && row[dueDateField.id] && (
                      <span className="text-[10px] text-zinc-600 font-mono italic">
                        {new Date(row[dueDateField.id]).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}

            <button 
              onClick={() => onAddRow(status)}
              className="w-full py-2.5 rounded-xl border border-dashed border-zinc-800 text-zinc-600 text-[10px] font-bold uppercase tracking-widest hover:bg-zinc-800/50 hover:text-zinc-400 hover:border-zinc-700 transition-all flex items-center justify-center space-x-2 active:scale-[0.98]"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
              <span>Add card</span>
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

function getPriorityStyle(priority: string) {
  switch (priority?.toLowerCase()) {
    case 'high': return 'bg-red-500/10 text-red-500 border border-red-500/20';
    case 'medium': return 'bg-blue-500/10 text-blue-500 border border-blue-500/20';
    case 'low': return 'bg-zinc-700/50 text-zinc-500 border border-zinc-700/50';
    default: return 'bg-zinc-800 text-zinc-500 border border-zinc-700';
  }
}
