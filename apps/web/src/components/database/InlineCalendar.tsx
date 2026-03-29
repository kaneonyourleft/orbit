'use client';
import React, { useState } from 'react';
import type { DBColumn, DBRow } from './types';

interface Props {
  columns: DBColumn[];
  rows: DBRow[];
  dateColumnId: string;
  onUpdateCell: (rowId: string, columnId: string, value: any) => void;
}

export default function InlineCalendar({ columns, rows, dateColumnId, onUpdateCell }: Props) {
  const [viewDate, setViewDate] = useState(new Date());
  
  if (!dateColumnId || !columns.find(c=>c.id === dateColumnId)) {
     return (
        <div className="p-8 text-center text-slate-500 bg-slate-900/50 rounded-2xl border border-white/5 space-y-4">
           <p className="text-xl opacity-30">📅</p>
           <p className="text-xs font-bold font-mono tracking-widest text-emerald-400">데이터 소스에 '날짜' 타입 컬럼이 필요합니다.</p>
           <p className="text-[10px] opacity-40">기준이 될 날짜 컬럼을 생성해 주세요.</p>
        </div>
     );
  }

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const titleCol = columns.find(c => c.type === 'text') || columns[0];

  const days: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) days.push(null);
  for (let d = 1; d <= daysInMonth; d++) days.push(d);

  const getRowsForDay = (day: number): DBRow[] => {
    const monthStr = String(month + 1).padStart(2, '0');
    const dStr = String(day).padStart(2, '0');
    const dateStr = `${year}-${monthStr}-${dStr}`;
    return rows.filter(r => {
      const cellDate = r.cells[dateColumnId];
      if (!cellDate) return false;
      return String(cellDate).startsWith(dateStr);
    });
  };

  const prevMonth = () => setViewDate(new Date(year, month - 1, 1));
  const nextMonth = () => setViewDate(new Date(year, month + 1, 1));
  const today = new Date();
  const isToday = (d: number) => d === today.getDate() && month === today.getMonth() && year === today.getFullYear();

  return (
    <div className="p-4 bg-slate-900/40 rounded-[2rem] border border-white/5 shadow-2xl backdrop-blur-md fade-in">
      <div className="flex items-center justify-between mb-8 px-4">
        <button onClick={prevMonth} className="w-8 h-8 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 transition-colors text-slate-400 font-black">‹</button>
        <span className="text-xl font-black tracking-tighter text-slate-100">{year}년 {month + 1}월</span>
        <button onClick={nextMonth} className="w-8 h-8 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 transition-colors text-slate-400 font-black">›</button>
      </div>

      <div className="grid grid-cols-7 gap-1.5 auto-rows-[minmax(100px,_1fr)]">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
          <div key={d} className="text-[10px] font-black uppercase text-slate-600 tracking-widest text-center py-2">{d}</div>
        ))}
        {days.map((day, i) => (
          <div key={i} className={`group relative p-2 min-h-[100px] bg-slate-900/80 rounded-2xl border transition-all ${day ? 'border-white/[0.03] hover:border-indigo-500/30' : 'border-transparent opacity-10'} ${day && isToday(day) ? 'ring-2 ring-indigo-500/50 bg-indigo-500/5' : ''}`}>
            {day && (
              <>
                <div className={`text-xs font-black mb-3 ml-1 ${isToday(day) ? 'text-indigo-400' : 'text-slate-500 opacity-60 group-hover:opacity-100 transition-opacity'}`}>
                  {day}
                </div>
                <div className="space-y-1 w-full max-w-[200px]">
                   {getRowsForDay(day).slice(0, 3).map(row => (
                      <div key={row.id} className="text-[10px] font-bold px-2 py-0.5 bg-indigo-500/10 text-indigo-300 rounded-md border border-indigo-500/10 truncate font-mono tracking-tighter shadow-sm">
                        {row.cells[titleCol?.id] || '(제목 없음)'}
                      </div>
                   ))}
                   {getRowsForDay(day).length > 3 && (
                      <div className="text-[9px] font-black text-slate-700 ml-1 mt-1 uppercase tracking-widest">+{getRowsForDay(day).length - 3} MORE</div>
                   )}
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
