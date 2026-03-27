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

export function SortPanel({ fields, sorts, onAddSort, onUpdateSort, onRemoveSort }: SortPanelProps) {
  return (
    <div className="absolute top-12 left-24 w-72 bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl p-4 z-50 animate-in fade-in zoom-in-95 duration-200">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-500">Sorting</h3>
        <button 
          onClick={onAddSort}
          className="text-[10px] font-bold text-blue-500 hover:text-blue-400 uppercase tracking-tight"
        >
          + Add Sort
        </button>
      </div>

      <div className="space-y-3 max-h-64 overflow-y-auto scrollbar-hide">
         {sorts.length === 0 && (
          <p className="text-[11px] text-zinc-600 italic text-center py-4">No sorting conditions applied.</p>
        )}
        {sorts.map((sort, index) => (
          <div key={index} className="flex flex-col space-y-2 p-2 bg-zinc-800/30 rounded-lg border border-zinc-800/50">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono text-zinc-700">Level {index + 1}</span>
              <button 
                onClick={() => onRemoveSort(index)} 
                className="text-zinc-600 hover:text-red-500"
                title="Remove Sort Condition"
                aria-label="Remove Sort Condition"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
              </button>
            </div>
            <div className="flex space-x-2">
              <select 
                value={sort.fieldId}
                onChange={(e) => onUpdateSort(index, { ...sort, fieldId: e.target.value })}
                className="flex-1 bg-zinc-800 text-xs text-zinc-300 border border-zinc-700 rounded p-1.5 outline-none focus:border-blue-500 transition-colors"
                title="Select Field to Sort"
              >
                <option value="">Select Field</option>
                {fields.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
              </select>
              <select 
                value={sort.direction}
                onChange={(e) => onUpdateSort(index, { ...sort, direction: e.target.value as any })}
                className="w-24 bg-zinc-800 text-xs text-zinc-300 border border-zinc-700 rounded p-1.5 outline-none focus:border-blue-500 transition-colors"
                title="Select Sort Direction"
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
