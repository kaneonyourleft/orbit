import React from 'react';
import { OrbitField } from '@orbit/core';

interface KanbanBoardProps {
  fields: OrbitField[];
  rows: Record<string, any>[];
  onUpdateCell: (rowId: string, fieldId: string, value: any) => void;
  onAddRow: (status?: string) => void;
}

/**
 * Clean Canvas Kanban Board for ORBIT Workspace OS.
 */
export function KanbanBoard({ fields, rows, onUpdateCell, onAddRow }: KanbanBoardProps) {
  const statusField = fields.find(f => f.name.toLowerCase() === 'status');
  const priorityField = fields.find(f => f.name.toLowerCase() === 'priority');
  const ownerField = fields.find(f => f.name.toLowerCase() === 'owner');
  const dueDateField = fields.find(f => f.type === 'date');

  const defaultStatuses = ['To Do', 'In Progress', 'Done'];
  const statusOptions = statusField?.options as string[] || defaultStatuses;

  const groupedRows = statusOptions.map(status => {
    return {
      status,
      rows: rows.filter(r => r[statusField?.id || ''] === status)
    };
  });

  const getStatusStyles = (status: string) => {
    const s = String(status || '').toLowerCase();
    if (s.includes('progress')) return 'bg-blue-100 text-blue-700';
    if (s.includes('planned')) return 'bg-zinc-100 text-zinc-600';
    if (s.includes('stuck') || s.includes('critical')) return 'bg-red-100 text-red-700';
    if (s.includes('completed') || s.includes('done')) return 'bg-emerald-100 text-emerald-700';
    return 'bg-zinc-100 text-zinc-600';
  };

  const getPriorityStyles = (priority: string) => {
    const p = String(priority || '').toLowerCase();
    if (p.includes('high')) return 'bg-amber-100 text-amber-700 font-bold';
    if (p.includes('low')) return 'bg-emerald-100 text-emerald-700';
    return 'bg-zinc-100 text-zinc-600';
  };

  return (
    <div className="flex space-x-6 h-[calc(100vh-280px)] overflow-x-auto pb-6 scrollbar-hide font-sans">
      {groupedRows.map(({ status, rows: columnRows }) => (
        <div key={status} className="flex flex-col w-80 shrink-0 space-y-4">
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center space-x-2">
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${getStatusStyles(status)}`}>
                {status}
              </span>
              <span className="text-[10px] font-bold text-zinc-400">
                {columnRows.length}
              </span>
            </div>
            <button className="p-1 hover:bg-zinc-100 rounded text-zinc-400 transition-colors">
              <span className="material-symbols-outlined text-[16px]">more_horiz</span>
            </button>
          </div>

          <div className="flex-1 space-y-3 p-2 bg-zinc-100/50 rounded-xl border border-zinc-200/50 overflow-y-auto scrollbar-hide">
            {columnRows.map(row => {
               const statusVal = String(row[statusField?.id || ''] || '').toLowerCase();
               const isStuck = statusVal.includes('stuck') || statusVal.includes('critical');
               const isCompleted = statusVal.includes('completed') || statusVal.includes('done') || row.done === true;
               
               return (
                <div 
                  key={row.id} 
                  className={`p-4 bg-white border border-zinc-200 rounded-lg shadow-sm hover:shadow-md hover:border-[#0058BE]/30 transition-all cursor-pointer group ${isStuck ? 'border-l-4 border-l-red-500' : ''} ${isCompleted ? 'border-l-4 border-l-emerald-500' : ''}`}
                >
                  <div className="space-y-3">
                    <p className={`text-sm font-semibold text-zinc-800 leading-snug group-hover:text-[#0058BE] transition-colors ${isCompleted ? 'opacity-50 line-through' : ''}`}>
                      {row[fields.find(f => f.name.toLowerCase().includes('name'))?.id || fields[0].id] || 'Untitled Task'}
                    </p>

                    <div className="flex flex-wrap gap-2">
                      {priorityField && row[priorityField.id] && (
                        <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-tight ${getPriorityStyles(row[priorityField.id])}`}>
                          {row[priorityField.id]}
                        </span>
                      )}
                      <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-tight ${getStatusStyles(status)}`}>
                        {status}
                      </span>
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-zinc-100">
                      <div className="flex items-center space-x-2">
                        <div className="w-4 h-4 rounded-full bg-zinc-200 flex items-center justify-center text-[8px] font-bold text-zinc-500 overflow-hidden shrink-0">
                          {String(row[ownerField?.id || ''] || 'U').charAt(0).toUpperCase()}
                        </div>
                        <span className="text-[10px] text-zinc-500 font-medium truncate max-w-[80px]">{row[ownerField?.id || ''] || 'Unassigned'}</span>
                      </div>
                      
                      {dueDateField && row[dueDateField.id] && (
                        <div className="flex items-center space-x-1 text-[9px] font-bold text-zinc-400">
                           <span className="material-symbols-outlined text-[12px]">calendar_today</span>
                           <span>{new Date(row[dueDateField.id]).toLocaleDateString()}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
               );
            })}

            <button 
              onClick={() => onAddRow(status)}
              className="w-full py-2.5 rounded-lg border border-dashed border-zinc-300 bg-white/50 text-zinc-400 text-[10px] font-bold uppercase tracking-widest hover:bg-white hover:text-[#0058BE] hover:border-[#0058BE] transition-all flex items-center justify-center space-x-2 active:scale-[0.98]"
            >
              <span className="material-symbols-outlined text-[14px]">add</span>
              <span>Add task</span>
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
