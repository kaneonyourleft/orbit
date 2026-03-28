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
 * Highly refined for white theme and card visualization.
 */
export function KanbanBoard({ fields, rows, onUpdateCell, onAddRow }: KanbanBoardProps) {
  const statusField = fields.find(f => f.name.toLowerCase() === 'status');
  const priorityField = fields.find(f => f.name.toLowerCase() === 'priority');
  const ownerField = fields.find(f => f.name.toLowerCase() === 'owner');
  const dueDateField = fields.find(f => f.type === 'date');

  // statusField.options can be { values: [...] } or an array
  const statusOptions: string[] = (statusField?.options as any)?.values 
    || (Array.isArray(statusField?.options) ? statusField.options : null)
    || ['In Progress', 'Planned', 'Stuck', 'Completed'];

  const groupedRows = statusOptions.map(status => {
    const statusRows = rows.filter(r => {
      const rowStatus = String(r[statusField?.id || ''] || '').trim();
      // Map empty values to the first status option
      if (!rowStatus) return status === statusOptions[0];
      return rowStatus.toLowerCase() === status.toLowerCase();
    });
    return {
      status,
      rows: statusRows
    };
  });

  const getStatusBadgeStyle = (status: string) => {
    const s = String(status || '').toLowerCase();
    if (s.includes('progress')) return 'bg-blue-50 text-primary border-blue-100';
    if (s.includes('planned')) return 'bg-zinc-50 text-zinc-500 border-zinc-200';
    if (s.includes('stuck') || s.includes('critical')) return 'bg-red-50 text-red-700 border-red-100';
    if (s.includes('completed') || s.includes('done')) return 'bg-[#AFEFCB]/30 text-[#006C49] border-[#AFEFCB]/50';
    return 'bg-zinc-50 text-zinc-400 border-zinc-100';
  };

  const getPriorityBadgeStyle = (priority: string) => {
    const p = String(priority || '').toLowerCase();
    if (p.includes('critical')) return 'bg-red-100 text-red-800 border-red-200';
    if (p.includes('high')) return 'bg-amber-100 text-amber-800 border-amber-200';
    if (p.includes('low')) return 'bg-emerald-100 text-emerald-800 border-emerald-200';
    return 'bg-zinc-100 text-zinc-600 border-zinc-200';
  };

  return (
    <div className="flex space-x-8 px-8 h-[calc(100vh-280px)] overflow-x-auto pb-12 hide-scrollbar font-sans antialiased">
      {groupedRows.map(({ status, rows: columnRows }) => (
        <div key={status} className="flex flex-col w-80 shrink-0 space-y-5">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center space-x-3">
              <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase tracking-widest border shadow-sm ${getStatusBadgeStyle(status)}`}>
                {status}
              </span>
              <span className="text-[11px] font-black text-zinc-300 bg-zinc-50 border border-zinc-100 px-2 py-0.5 rounded-full min-w-[20px] text-center">
                {columnRows.length}
              </span>
            </div>
            <button className="p-1.5 hover:bg-zinc-100 rounded-lg text-zinc-300 hover:text-zinc-600 transition-all">
              <span className="material-symbols-outlined text-[18px]">more_horiz</span>
            </button>
          </div>

          <div className="flex-1 space-y-4 p-3 bg-zinc-50/50 rounded-2xl border border-zinc-200/50 overflow-y-auto hide-scrollbar transition-all hover:bg-zinc-50/80 shadow-inner">
            {columnRows.map(row => {
               const statusVal = String(row[statusField?.id || ''] || '').toLowerCase();
               const isStuck = statusVal.includes('stuck') || statusVal.includes('critical');
               const isCompleted = statusVal.includes('completed') || statusVal.includes('done') || row.done === true;
               
               return (
                <div 
                  key={row.id} 
                  className={`p-4 bg-white border border-zinc-200 rounded-xl shadow-sm hover:shadow-md hover:border-primary/30 transition-all cursor-grab active:cursor-grabbing group ring-inset ${isStuck ? 'border-l-4 border-l-red-500' : ''} ${isCompleted ? 'border-l-4 border-l-[#006C49] opacity-70' : ''}`}
                >
                  <div className="space-y-4">
                    <p className={`text-sm font-bold text-zinc-800 leading-tight group-hover:text-primary transition-colors ${isCompleted ? 'line-through decoration-zinc-300' : ''}`}>
                      {row[fields.find(f => f.name.toLowerCase().includes('name'))?.id || fields[0].id] || 'Untitled Task'}
                    </p>

                    <div className="flex flex-wrap gap-2">
                       {priorityField && row[priorityField.id] && (
                        <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest border ${getPriorityBadgeStyle(row[priorityField.id])}`}>
                          {row[priorityField.id]}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-zinc-50">
                      <div className="flex items-center space-x-2">
                        <div className="w-6 h-6 rounded-full bg-zinc-100 border border-zinc-200 flex items-center justify-center text-[10px] font-black text-zinc-400 overflow-hidden shrink-0 shadow-sm">
                          {String(row[ownerField?.id || ''] || '?').charAt(0).toUpperCase()}
                        </div>
                        <span className="text-[11px] text-zinc-500 font-bold truncate max-w-[100px] hover:text-zinc-800 transition-colors cursor-default">{row[ownerField?.id || ''] || 'No Owner'}</span>
                      </div>
                      
                      {dueDateField && row[dueDateField.id] && (
                        <div className="flex items-center space-x-1.5 text-[10px] font-bold text-zinc-400 group-hover:text-zinc-600 transition-colors">
                           <span className="material-symbols-outlined text-[14px]">calendar_today</span>
                           <span>{new Date(row[dueDateField.id]).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
               );
            })}

            <button 
              onClick={() => onAddRow(status)}
              className="w-full py-3.5 rounded-xl border-2 border-dashed border-zinc-200 bg-white/40 text-zinc-400 text-[10px] font-black uppercase tracking-[0.2em] hover:bg-white hover:text-primary hover:border-primary/30 hover:shadow-sm transition-all flex items-center justify-center space-x-2 active:scale-[0.98] select-none"
            >
              <span className="material-symbols-outlined text-[18px]">add</span>
              <span>Create New</span>
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
