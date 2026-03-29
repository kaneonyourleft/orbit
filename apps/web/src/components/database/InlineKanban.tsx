'use client';
import React from 'react';
import type { DBColumn, DBRow } from './types';

interface Props {
  columns: DBColumn[];
  rows: DBRow[];
  groupByColumnId: string;
  onUpdateCell: (rowId: string, columnId: string, value: any) => void;
  onAddRow: (cells?: Record<string, any>) => void;
}

export default function InlineKanban({ columns, rows, groupByColumnId, onUpdateCell, onAddRow }: Props) {
  const groupCol = columns.find(c => c.id === groupByColumnId);
  const titleCol = columns.find(c => c.type === 'text') || columns[0];
  
  if (!groupCol || !groupCol.options) {
    return (
      <div className="p-8 text-center text-slate-500 bg-slate-900/50 rounded-2xl border border-white/5 space-y-4">
        <p className="text-xl opacity-30">▤</p>
        <p className="text-xs font-bold font-mono tracking-widest text-indigo-400">데이터 소스에 '선택' 타입 컬럼이 필요합니다.</p>
        <p className="text-[10px] opacity-40">그룹화할 기준 컬럼을 '선택' 타입으로 생성해 주세요.</p>
      </div>
    );
  }

  const groups: Record<string, DBRow[]> = {};
  for (const opt of groupCol.options) groups[opt] = [];
  groups['미지정'] = [];
  
  for (const row of rows) {
    const val = row.cells[groupByColumnId] || '';
    if (groups[val]) groups[val].push(row);
    else groups['미지정'].push(row);
  }

  const statusColors: Record<string, string> = {
    '할 일': '#64748b', '진행 중': '#3b82f6', '완료': '#10b981', '대기': '#94a3b8',
    'TODO': '#64748b', 'PROGRESS': '#3b82f6', 'DONE': '#10b981', 'WAIT': '#94a3b8',
  };

  return (
    <div className="flex gap-4 overflow-x-auto pb-6 -mx-2 px-2 snap-x h-full min-h-[400px]">
      {Object.entries(groups).map(([group, groupRows]) => (
        <div key={group} 
             className="min-w-[280px] w-[300px] flex-shrink-0 flex flex-col snap-start rounded-[1.5rem] bg-slate-900/50 border border-white/5 p-4 shadow-2xl backdrop-blur-md"
             onDragOver={e => e.preventDefault()}
             onDrop={e => {
                const data = JSON.parse(e.dataTransfer.getData('text/plain'));
                if (data.rowId) onUpdateCell(data.rowId, groupByColumnId, group === '미지정' ? '' : group);
             }}>
          
          <div className="flex items-center gap-2 px-2 py-3 mb-4 group cursor-default">
            <div className="w-2.5 h-2.5 rounded-full shadow-[0_0_10px_rgba(0,0,0,0.5)]" 
                 style={{ backgroundColor: statusColors[group] || '#7f6df2' }} />
            <span className="text-xs font-black tracking-widest text-slate-300 uppercase">{group}</span>
            <span className="ml-auto text-[10px] font-black w-5 h-5 flex items-center justify-center bg-white/5 text-slate-500 rounded-full group-hover:bg-indigo-500 group-hover:text-white transition-all">
              {groupRows.length}
            </span>
          </div>
          
          <div className="space-y-3 flex-1 overflow-y-auto pr-1 custom-scrollbar">
            {groupRows.map(row => (
              <div 
                key={row.id}
                draggable
                onDragStart={e => e.dataTransfer.setData('text/plain', JSON.stringify({ rowId: row.id }))}
                className="group relative p-4 bg-slate-900/80 rounded-2xl border border-white/[0.03] hover:border-indigo-500/50 hover:bg-indigo-500/[0.02] shadow-sm hover:shadow-indigo-500/10 transition-all cursor-grab active:cursor-grabbing font-bold"
              >
                <div className="text-sm text-slate-100 mb-2 mr-6 leading-relaxed truncate">{row.cells[titleCol.id] || '(제목 없음)'}</div>
                
                <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-white/[0.02]">
                   {columns.filter(c => c.type === 'progress').map(c => {
                     const pct = Number(row.cells[c.id]) || 0;
                     return (
                        <div key={c.id} className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                           <div className="h-full bg-indigo-500/60 transition-all duration-1000" style={{ width: `${pct}%` }} />
                        </div>
                     )
                   })}
                   <span className="text-[9px] font-black text-slate-600 uppercase tracking-tighter tabular-nums truncate">
                      {row.id.split('-')[0]} • #{row.sort_order}
                   </span>
                </div>
              </div>
            ))}
          </div>

          <button 
            onClick={() => onAddRow({ [groupByColumnId]: group === '미지정' ? '' : group })}
            className="w-full mt-4 py-3 text-[10px] font-black tracking-[0.2em] text-slate-600 hover:text-white hover:bg-white/5 rounded-xl border border-dashed border-white/5 transition-all text-center"
          >
            + QUICK ADD
          </button>
        </div>
      ))}
    </div>
  );
}
