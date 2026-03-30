'use client';
import React, { useState, useRef } from 'react';
import type { DBColumn, DBRow, DBFilter, DBSort } from './types';
import ColumnEditor from './ColumnEditor';

interface Props {
  columns: DBColumn[];
  rows: DBRow[];
  filters: DBFilter[];
  sorts: DBSort[];
  onUpdateCell: (rowId: string, columnId: string, value: string | number | boolean | null | undefined) => void;
  onAddRow: () => void;
  onDeleteRow: (rowId: string) => void;
  onAddColumn: (col: DBColumn) => void;
  onUpdateColumn: (colId: string, updates: Partial<DBColumn>) => void;
}

function applyFilters(rows: DBRow[], filters: DBFilter[]): DBRow[] {
  return rows.filter(row => {
    return filters.every(f => {
      const val = row.cells[f.columnId];
      const strVal = val == null ? '' : String(val).toLowerCase();
      const fVal = f.value.toLowerCase();
      switch (f.operator) {
        case 'eq': return strVal === fVal;
        case 'neq': return strVal !== fVal;
        case 'contains': return strVal.includes(fVal);
        case 'gt': return Number(val) > Number(f.value);
        case 'lt': return Number(val) < Number(f.value);
        case 'isEmpty': return !val || strVal === '';
        case 'isNotEmpty': return val != null && strVal !== '';
        default: return true;
      }
    });
  });
}

function applySorts(rows: DBRow[], sorts: DBSort[]): DBRow[] {
  if (sorts.length === 0) return rows;
  return [...rows].sort((a, b) => {
    for (const s of sorts) {
      const aVal = a.cells[s.columnId] ?? '';
      const bVal = b.cells[s.columnId] ?? '';
      const cmp = String(aVal).localeCompare(String(bVal), 'ko', { numeric: true });
      if (cmp !== 0) return s.direction === 'asc' ? cmp : -cmp;
    }
    return 0;
  });
}

export default function InlineTable({ columns, rows, filters, sorts, onUpdateCell, onAddRow, onDeleteRow, onAddColumn, onUpdateColumn }: Props) {
  const [editingCell, setEditingCell] = useState<{ rowId: string; colId: string } | null>(null);
  const [addColOpen, setAddColOpen] = useState(false);
  const [editColId, setEditColId] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const processed = applySorts(applyFilters(rows, filters), sorts);

  const renderCell = (row: DBRow, col: DBColumn) => {
    const val = row.cells[col.id];
    const isEditing = editingCell?.rowId === row.id && editingCell?.colId === col.id;

    if (col.type === 'checkbox') {
      return (
        <div 
          className="flex justify-center cursor-pointer p-2 hover:bg-white/5 transition-colors rounded-lg"
          onClick={() => onUpdateCell(row.id, col.id, !val)}
        >
          <span className={`text-xl ${val ? 'text-indigo-500' : 'text-slate-700'}`}>{val ? '☑' : '☐'}</span>
        </div>
      );
    }

    if (col.type === 'select') {
      return (
        <div className="relative group p-1.5 hover:bg-white/5 rounded-lg transition-colors overflow-hidden">
          <select 
            title="상태 선택"
            value={val || ''} 
            onChange={e => onUpdateCell(row.id, col.id, e.target.value)}
            className="w-full text-xs bg-transparent text-slate-300 border-none outline-none cursor-pointer appearance-none font-bold"
          >
            <option value="" className="bg-slate-900 border-none">-</option>
            {(col.options || []).map(o => <option key={o} value={o} className="bg-slate-900 border-none">{o}</option>)}
          </select>
          <span className="hidden group-hover:block absolute right-2 top-1.5 text-[10px] opacity-20 transition-opacity">▼</span>
        </div>
      );
    }

    if (col.type === 'progress') {
      const pct = Math.max(0, Math.min(100, Number(val) || 0));
      return (
        <div className="relative w-full h-4 bg-slate-800 rounded-full overflow-hidden border border-white/5 shadow-inner flex items-center group cursor-text"
             onClick={() => setEditingCell({ rowId: row.id, colId: col.id })}>
          <div 
            className={`h-full transition-all duration-500 rounded-full shadow-lg ${pct >= 100 ? 'bg-emerald-500/80 shadow-emerald-500/20' : 'bg-indigo-500/80 shadow-indigo-500/20'}`}
            style={{ width: `${pct}%` }} 
          />
          {isEditing ? (
             <input title="수치 입력" autoFocus defaultValue={val ?? ''} onBlur={e => { onUpdateCell(row.id, col.id, Number(e.target.value)); setEditingCell(null); }}
                    className="absolute inset-0 bg-slate-900 text-[10px] text-center font-black text-white outline-none" />
          ) : (
            <span className="absolute inset-0 flex items-center justify-center text-[9px] font-black text-white tracking-widest opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-md">
              {pct}%
            </span>
          )}
        </div>
      );
    }

    if (isEditing) {
      return (
        <input 
          ref={inputRef} autoFocus defaultValue={val ?? ''}
          aria-label={`${col.name} 셀 수정`}
          placeholder={`${col.name} 입력`}
          onBlur={e => { onUpdateCell(row.id, col.id, col.type === 'number' ? Number(e.target.value) : e.target.value); setEditingCell(null); }}
          onKeyDown={e => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); if (e.key === 'Escape') setEditingCell(null); }}
          className="w-full text-xs font-bold bg-indigo-500/10 text-white rounded-lg px-2 py-1 outline-none ring-1 ring-indigo-500/50"
          type={col.type === 'number' ? 'number' : col.type === 'date' ? 'date' : 'text'} 
        />
      );
    }

    return (
      <div 
        onClick={() => setEditingCell({ rowId: row.id, colId: col.id })}
        className={`px-2 py-1.5 text-xs font-bold rounded-lg border border-transparent hover:border-white/10 hover:bg-white/5 transition-all truncate group relative ${val ? 'text-slate-200' : 'text-slate-600 italic'}`}
      >
        {col.type === 'date' && val ? new Date(val).toLocaleDateString('ko') : (val ?? '(빈 행)')}
      </div>
    );
  };

  return (
    <div className="overflow-x-auto rounded-[1.25rem] bg-slate-900/50 border border-white/5 backdrop-blur-sm -mx-1 p-1 shadow-inner">
      <table className="w-full border-collapse text-[13px] table-fixed">
        <thead>
          <tr className="bg-slate-900 group">
            {columns.map(col => (
              <th key={col.id} className="relative py-3 px-4 text-left text-[10px] font-black text-slate-500 uppercase tracking-widest group-hover:text-slate-400 transition-colors border-b border-white/5"
                  style={{ width: col.width }}>
                <div onClick={() => setEditColId(editColId === col.id ? null : col.id)} className="cursor-pointer flex items-center gap-1.5 hover:text-indigo-400 transition-colors">
                   {col.name}
                   {editColId === col.id && (
                    <ColumnEditor column={col}
                      onSave={(updated) => { onUpdateColumn(col.id, updated); setEditColId(null); }}
                      onClose={() => setEditColId(null)} />
                  )}
                </div>
              </th>
            ))}
            <th className="relative w-12 py-3 px-4 border-b border-white/5">
              <button onClick={() => setAddColOpen(!addColOpen)}
                className="text-lg text-slate-700 hover:text-indigo-400 font-black transition-colors">+</button>
              {addColOpen && (
                <ColumnEditor onSave={(col) => { onAddColumn(col); setAddColOpen(false); }} onClose={() => setAddColOpen(false)} />
              )}
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/[0.02]">
          {processed.map(row => (
            <tr key={row.id} className="group hover:bg-white/[0.02] transition-colors"
                onContextMenu={e => { e.preventDefault(); if (confirm('이 행을 삭제하시겠습니까?')) onDeleteRow(row.id); }}>
              {columns.map(col => (
                <td key={col.id} className="py-1 px-3 align-middle">{renderCell(row, col)}</td>
              ))}
              <td className="opacity-0 group-hover:opacity-100 transition-opacity text-center">
                <button onClick={()=>onDeleteRow(row.id)} className="text-rose-500/30 hover:text-rose-500 text-[10px] p-1.5 transition-colors">✕</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <button 
        onClick={onAddRow}
        className="w-full py-4 text-[11px] font-black tracking-widest text-slate-600 hover:text-indigo-400 hover:bg-indigo-500/5 transition-all text-center rounded-b-[1.25rem] border-t border-white/5"
      >
        + NEW ENTRY
      </button>
    </div>
  );
}
