import React from 'react';
import { OrbitField } from '@orbit/core';

interface GroupPanelProps {
  fields: OrbitField[];
  groupBy: string | null;
  onGroupBy: (fieldId: string | null) => void;
}

/**
 * Group Panel for ORBIT Workspace OS.
 * Clean white theme dropdown for data grouping.
 */
export function GroupPanel({ fields, groupBy, onGroupBy }: GroupPanelProps) {
  // We allow grouping by 'select' or 'status' types
  const groupableFields = fields.filter(f => f.type === 'select');

  return (
    <div className="w-72 bg-white border border-zinc-200 rounded-xl shadow-2xl p-5 z-[100] animate-in fade-in slide-in-from-top-2 duration-200 font-sans antialiased select-none">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-zinc-400 text-lg font-bold">account_tree</span>
          <h3 className="text-[11px] font-black uppercase tracking-[0.15em] text-zinc-400 leading-none">Group By</h3>
        </div>
        {groupBy && (
          <button 
            onClick={() => onGroupBy(null)}
            className="text-[10px] font-black text-red-500 hover:text-red-700 uppercase tracking-widest bg-red-50 px-2 py-1 rounded transition-colors active:scale-95"
          >
            Clear
          </button>
        )}
      </div>

      <div className="space-y-1">
        {groupableFields.length === 0 && (
          <div className="flex flex-col items-center justify-center py-8 text-center bg-zinc-50 rounded-lg border border-dashed border-zinc-200">
             <span className="material-symbols-outlined text-zinc-300 text-3xl mb-2">view_array</span>
             <p className="text-[11px] text-zinc-400 font-bold uppercase tracking-widest">No Groupable Fields</p>
          </div>
        )}
        {groupableFields.map((field) => (
          <button
            key={field.id}
            onClick={() => onGroupBy(field.id)}
            className={`
              w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all border
              ${groupBy === field.id 
                ? 'bg-primary text-white border-primary shadow-md shadow-blue-100 ring-4 ring-blue-50' 
                : 'text-zinc-500 hover:bg-zinc-50 hover:text-zinc-800 border-transparent hover:border-zinc-100 hover:shadow-sm'}
            `}
          >
            <span>{field.name}</span>
            {groupBy === field.id && (
              <span className="material-symbols-outlined text-sm font-black">check</span>
            )}
            {groupBy !== field.id && (
               <span className="text-[10px] opacity-20 group-hover:opacity-100 transition-opacity font-bold uppercase tracking-tighter">Apply</span>
            )}
          </button>
        ))}
      </div>
      
      <div className="mt-4 pt-4 border-t border-zinc-50">
        <p className="text-[9px] text-zinc-400 font-bold uppercase tracking-widest text-center leading-relaxed">
          Grouping changes the table layout to section the records by the selected field value.
        </p>
      </div>
    </div>
  );
}
