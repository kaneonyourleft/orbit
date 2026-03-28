import React from 'react';
import { OrbitField } from '@orbit/core';

export interface SortCondition {
  fieldId: string;
  direction: 'asc' | 'desc';
}

interface SortPanelProps {
  fields: OrbitField[];
  sorts: SortCondition[];
  onAddSort: () => void;
  onUpdateSort: (index: number, sort: SortCondition) => void;
  onRemoveSort: (index: number) => void;
}

/**
 * Sort Panel for ORBIT Workspace OS.
 * Clean white theme dropdown for data ordering.
 */
export function SortPanel({ fields, sorts, onAddSort, onUpdateSort, onRemoveSort }: SortPanelProps) {
  return (
    <div className="w-80 bg-white border border-zinc-200 rounded-xl shadow-2xl p-5 z-[100] animate-in fade-in slide-in-from-top-2 duration-200 font-sans antialiased select-none">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-zinc-400 text-lg font-bold">swap_vert</span>
          <h3 className="text-[11px] font-black uppercase tracking-[0.15em] text-zinc-400 leading-none">Sorting</h3>
        </div>
        <button 
          onClick={onAddSort}
          className="text-[10px] font-black text-primary hover:text-blue-700 uppercase tracking-widest bg-blue-50 px-2 py-1 rounded transition-colors active:scale-95"
        >
          + Add Sort
        </button>
      </div>

      <div className="space-y-4 max-h-[400px] overflow-y-auto hide-scrollbar pr-1">
         {sorts.length === 0 && (
          <div className="flex flex-col items-center justify-center py-8 text-center bg-zinc-50 rounded-lg border border-dashed border-zinc-200">
             <span className="material-symbols-outlined text-zinc-300 text-3xl mb-2">sort_by_alpha</span>
             <p className="text-[11px] text-zinc-400 font-bold uppercase tracking-widest">No Sort Rules</p>
          </div>
        )}
        {sorts.map((sort, index) => (
          <div key={index} className="flex flex-col space-y-3 p-3 bg-white rounded-xl border border-zinc-100 shadow-sm transition-all hover:border-zinc-200">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black text-zinc-300 uppercase tracking-tighter">Level {index + 1}</span>
              <button 
                onClick={() => onRemoveSort(index)} 
                className="p-1 text-zinc-300 hover:text-red-500 hover:bg-red-50 rounded transition-all"
                title="Remove Sort"
              >
                <span className="material-symbols-outlined text-base">close</span>
              </button>
            </div>
            
            <div className="flex gap-2">
              <select 
                value={sort.fieldId}
                onChange={(e) => onUpdateSort(index, { ...sort, fieldId: e.target.value })}
                className="flex-[2] bg-zinc-50 text-xs font-bold text-zinc-600 border border-zinc-200 rounded-lg p-2 outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all cursor-pointer shadow-sm appearance-none"
                title="Select Field"
              >
                <option value="">Select Field</option>
                {fields.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
              </select>

              <select 
                value={sort.direction}
                onChange={(e) => onUpdateSort(index, { ...sort, direction: e.target.value as any })}
                className="flex-1 bg-zinc-50 text-xs font-bold text-zinc-600 border border-zinc-200 rounded-lg p-2 outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all cursor-pointer shadow-sm appearance-none text-center"
                title="Select Direction"
              >
                <option value="asc">Asc</option>
                <option value="desc">Desc</option>
              </select>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
