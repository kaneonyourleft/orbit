'use client';
import React, { useState } from 'react';
import type { DBColumn, DBFilter } from './types';

interface Props {
  columns: DBColumn[];
  filters: DBFilter[];
  onUpdate: (filters: DBFilter[]) => void;
}

const OPERATORS: Record<string, string> = {
  eq: '=', neq: '≠', contains: '포함', gt: '>', lt: '<', isEmpty: '비어있음', isNotEmpty: '값 있음'
};

export default function FilterBar({ columns, filters, onUpdate }: Props) {
  const [open, setOpen] = useState(false);

  const addFilter = () => {
    if (columns.length === 0) return;
    onUpdate([...filters, { columnId: columns[0].id, operator: 'contains', value: '' }]);
  };

  return (
    <div className="py-2">
      <button
        onClick={() => setOpen(!open)}
        className={`px-3 py-1 text-xs rounded border border-white/10 transition-colors ${filters.length > 0 ? 'bg-indigo-500/15 text-indigo-400 border-indigo-500/30' : 'text-slate-500 hover:text-slate-300'}`}
      >
        🔍 필터{filters.length > 0 ? ` (${filters.length})` : ''}
      </button>

      {open && (
        <div className="mt-2 p-3 bg-slate-900 rounded-lg border border-white/5 space-y-2 shadow-2xl animate-in fade-in slide-in-from-top-2">
          {filters.map((f, i) => (
            <div key={i} className="flex gap-2 items-center">
              <select 
                title="필터 컬럼 선택"
                value={f.columnId} 
                onChange={e => onUpdate(filters.map((x, idx) => idx === i ? { ...x, columnId: e.target.value } : x))}
                className="text-xs px-2 py-1 bg-slate-800 text-slate-300 rounded border border-white/5 outline-none"
              >
                {columns.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <select 
                title="필터 연산자 선택"
                value={f.operator} 
                onChange={e => onUpdate(filters.map((x, idx) => idx === i ? { ...x, operator: e.target.value as DBFilter['operator'] } : x))}
                className="text-xs px-2 py-1 bg-slate-800 text-slate-300 rounded border border-white/5 outline-none"
              >
                {Object.entries(OPERATORS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
              {!['isEmpty', 'isNotEmpty'].includes(f.operator) && (
                <input 
                  value={f.value} 
                  onChange={e => onUpdate(filters.map((x, idx) => idx === i ? { ...x, value: e.target.value } : x))}
                  placeholder="값" 
                  className="text-xs px-2 py-1 bg-slate-800 text-slate-300 rounded border border-white/5 outline-none w-24" 
                />
              )}
              <button 
                onClick={() => onUpdate(filters.filter((_, idx) => idx !== i))}
                className="text-rose-500 hover:text-rose-400 p-1"
              >
                ✕
              </button>
            </div>
          ))}
          <button onClick={addFilter} className="text-[11px] font-bold text-indigo-400 hover:text-indigo-300">+ 새 필터 규칙 추가</button>
        </div>
      )}
    </div>
  );
}
