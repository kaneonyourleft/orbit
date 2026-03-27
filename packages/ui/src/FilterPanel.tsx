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

export function FilterPanel({ fields, filters, onAddFilter, onUpdateFilter, onRemoveFilter }: FilterPanelProps) {
  const operators = ['is', 'is not', 'contains', 'is empty', 'is not empty'];

  return (
    <div className="absolute top-12 left-0 w-80 bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl p-4 z-50 animate-in fade-in zoom-in-95 duration-200">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-500">Filters</h3>
        <button 
          onClick={onAddFilter}
          className="text-[10px] font-bold text-blue-500 hover:text-blue-400 uppercase tracking-tight"
        >
          + Add Filter
        </button>
      </div>

      <div className="space-y-3 max-h-64 overflow-y-auto scrollbar-hide">
        {filters.length === 0 && (
          <p className="text-[11px] text-zinc-600 italic">No filters applied to this view.</p>
        )}
        {filters.map((filter, index) => (
          <div key={index} className="flex flex-col space-y-2 p-2 bg-zinc-800/30 rounded-lg border border-zinc-800/50">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono text-zinc-700">Filter {index + 1}</span>
              <button 
                onClick={() => onRemoveFilter(index)} 
                className="text-zinc-600 hover:text-red-500"
                title="Remove Filter"
                aria-label="Remove Filter"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
              </button>
            </div>
            <select 
              value={filter.fieldId}
              onChange={(e) => onUpdateFilter(index, { ...filter, fieldId: e.target.value })}
              className="w-full bg-zinc-800 text-xs text-zinc-300 border border-zinc-700 rounded p-1.5 outline-none focus:border-blue-500 transition-colors"
              title="Select Field to Filter"
            >
              <option value="">Select Field</option>
              {fields.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
            </select>
            <select 
              value={filter.operator}
              onChange={(e) => onUpdateFilter(index, { ...filter, operator: e.target.value as any })}
              className="w-full bg-zinc-800 text-xs text-zinc-300 border border-zinc-700 rounded p-1.5 outline-none focus:border-blue-500 transition-colors"
              title="Select Filter Operator"
            >
              {operators.map(op => <option key={op} value={op}>{op}</option>)}
            </select>
            {!['is empty', 'is not empty'].includes(filter.operator) && (
              <input 
                type="text"
                value={filter.value}
                placeholder="Value..."
                onChange={(e) => onUpdateFilter(index, { ...filter, value: e.target.value })}
                className="w-full bg-zinc-800 text-xs text-zinc-300 border border-zinc-700 rounded p-1.5 outline-none focus:border-blue-500 transition-colors"
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
