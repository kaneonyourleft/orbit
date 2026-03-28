import React from 'react';
import { OrbitField } from '@orbit/core';

export interface FilterCondition {
  fieldId: string;
  operator: 'is' | 'is not' | 'contains' | 'is empty' | 'is not empty';
  value: string;
}

interface FilterPanelProps {
  fields: OrbitField[];
  filters: FilterCondition[];
  onAddFilter: () => void;
  onUpdateFilter: (index: number, filter: FilterCondition) => void;
  onRemoveFilter: (index: number) => void;
}

/**
 * Filter Panel for ORBIT Workspace OS.
 * Clean white theme dropdown for data refinement.
 */
export function FilterPanel({ fields, filters, onAddFilter, onUpdateFilter, onRemoveFilter }: FilterPanelProps) {
  const operators = ['is', 'is not', 'contains', 'is empty', 'is not empty'];

  return (
    <div className="w-80 bg-white border border-zinc-200 rounded-xl shadow-2xl p-5 z-[100] animate-in fade-in slide-in-from-top-2 duration-200 font-sans antialiased select-none">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-zinc-400 text-lg">filter_list</span>
          <h3 className="text-[11px] font-black uppercase tracking-[0.15em] text-zinc-400 leading-none">Filters</h3>
        </div>
        <button 
          onClick={onAddFilter}
          className="text-[10px] font-black text-primary hover:text-blue-700 uppercase tracking-widest bg-blue-50 px-2 py-1 rounded transition-colors active:scale-95"
        >
          + Add Filter
        </button>
      </div>

      <div className="space-y-4 max-h-[400px] overflow-y-auto hide-scrollbar pr-1">
        {filters.length === 0 && (
          <div className="flex flex-col items-center justify-center py-8 text-center bg-zinc-50 rounded-lg border border-dashed border-zinc-200">
             <span className="material-symbols-outlined text-zinc-300 text-3xl mb-2">filter_alt_off</span>
             <p className="text-[11px] text-zinc-400 font-bold uppercase tracking-widest">No Active Filters</p>
          </div>
        )}
        {filters.map((filter, index) => (
          <div key={index} className="flex flex-col space-y-3 p-3 bg-white rounded-xl border border-zinc-100 shadow-sm transition-all hover:border-zinc-200">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black text-zinc-300 uppercase tracking-tighter">Rule {index + 1}</span>
              <button 
                onClick={() => onRemoveFilter(index)} 
                className="p-1 text-zinc-300 hover:text-red-500 hover:bg-red-50 rounded transition-all"
                title="Remove Filter"
              >
                <span className="material-symbols-outlined text-base">close</span>
              </button>
            </div>
            
            <div className="flex flex-col gap-2">
              <select 
                value={filter.fieldId}
                onChange={(e) => onUpdateFilter(index, { ...filter, fieldId: e.target.value })}
                className="w-full bg-zinc-50 text-xs font-bold text-zinc-600 border border-zinc-200 rounded-lg p-2 outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all cursor-pointer shadow-sm appearance-none"
                title="Select Field"
              >
                <option value="">Select Field</option>
                {fields.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
              </select>

              <select 
                value={filter.operator}
                onChange={(e) => onUpdateFilter(index, { ...filter, operator: e.target.value as any })}
                className="w-full bg-zinc-50 text-xs font-bold text-zinc-600 border border-zinc-200 rounded-lg p-2 outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all cursor-pointer shadow-sm appearance-none"
                title="Select Operator"
              >
                {operators.map(op => <option key={op} value={op}>{op}</option>)}
              </select>

              {!['is empty', 'is not empty'].includes(filter.operator) && (
                <input 
                  type="text"
                  value={filter.value}
                  placeholder="Enter value..."
                  onChange={(e) => onUpdateFilter(index, { ...filter, value: e.target.value })}
                  className="w-full bg-white text-xs font-medium text-zinc-800 border border-zinc-200 rounded-lg p-2 outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all shadow-sm placeholder:text-zinc-300"
                />
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
