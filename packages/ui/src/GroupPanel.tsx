import React from 'react';
import { OrbitField } from '@orbit/core';

interface GroupPanelProps {
  fields: OrbitField[];
  groupBy: string | null;
  onGroupBy: (fieldId: string | null) => void;
}

export function GroupPanel({ fields, groupBy, onGroupBy }: GroupPanelProps) {
  const selectFields = fields.filter(f => f.type === 'select');

  return (
    <div className="absolute top-12 left-44 w-64 bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl p-4 z-50 animate-in fade-in zoom-in-95 duration-200">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-500">Group By</h3>
        {groupBy && (
          <button 
            onClick={() => onGroupBy(null)}
            className="text-[10px] font-bold text-red-500 hover:text-red-400 uppercase tracking-tight"
          >
            Clear
          </button>
        )}
      </div>

      <div className="space-y-1">
        {selectFields.length === 0 && (
          <p className="text-[11px] text-zinc-600 italic">No grouping fields (select/status) available.</p>
        )}
        {selectFields.map((field) => (
          <button
            key={field.id}
            onClick={() => onGroupBy(field.id)}
            className={`
              w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all
              ${groupBy === field.id 
                ? 'bg-blue-600/10 text-blue-400 border border-blue-600/20' 
                : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200 border border-transparent'}
            `}
          >
            <span>{field.name}</span>
            {groupBy === field.id && (
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-blue-500"><path d="M20 6L9 17l-5-5"/></svg>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
