import React, { useState } from 'react';
import { OrbitField } from '@orbit/core';

interface CalendarViewProps {
  fields: OrbitField[];
  rows: Record<string, any>[];
  onUpdateCell: (rowId: string, fieldId: string, value: any) => void;
}

/**
 * Clean Canvas Calendar View for ORBIT Workspace OS.
 * Highly refined for white theme and Notion-style grid.
 */
export function CalendarView({ fields, rows, onUpdateCell }: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date(2026, 2, 28)); 
  const dateField = fields.find(f => f.type === 'date');

  if (!dateField) {
    return (
      <div className="mx-8 aspect-[16/6] flex flex-col items-center justify-center bg-zinc-50 rounded-2xl border-2 border-dashed border-zinc-200 space-y-4 shadow-inner">
        <div className="w-16 h-16 rounded-2xl bg-white flex items-center justify-center text-zinc-300 shadow-sm border border-zinc-100">
          <span className="material-symbols-outlined text-[40px] font-bold">event_note</span>
        </div>
        <div className="text-center space-y-1">
          <p className="text-zinc-800 font-black text-[15px] tracking-tight">Missing Date Field</p>
          <p className="text-zinc-400 text-xs font-medium">Add a Date field to activate the calendar view.</p>
        </div>
      </div>
    );
  }

  const daysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };
  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const numDays = daysInMonth(year, month);
  const startOffset = firstDayOfMonth(year, month);

  const monthName = currentDate.toLocaleString('default', { month: 'long' });
  const today = new Date();

  const getStatusBadgeStyle = (status: string) => {
    const s = String(status || '').toLowerCase();
    if (s.includes('progress')) return 'bg-blue-50 text-primary border-blue-100/50';
    if (s.includes('planned')) return 'bg-zinc-50 text-zinc-500 border-zinc-200';
    if (s.includes('stuck') || s.includes('critical')) return 'bg-red-50 text-red-700 border-red-100/50';
    if (s.includes('completed') || s.includes('done')) return 'bg-[#AFEFCB]/30 text-[#006C49] border-[#AFEFCB]/50';
    return 'bg-zinc-50 text-zinc-400 border-zinc-100';
  };

  return (
    <div className="mx-8 mb-8 bg-white border border-zinc-200 rounded-2xl overflow-hidden shadow-sm font-sans flex flex-col h-[750px] antialiased transition-all">
      <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 bg-zinc-50/30 shrink-0">
        <div className="flex items-center gap-3">
          <span className="material-symbols-outlined text-primary text-2xl font-black">calendar_month</span>
          <h2 className="text-lg font-black text-zinc-800 tracking-tight leading-none">{monthName} <span className="text-zinc-300 ml-1">{year}</span></h2>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex bg-white border border-zinc-200 rounded-lg p-0.5 shadow-sm">
            <button 
              onClick={prevMonth}
              className="p-1.5 rounded-md hover:bg-zinc-50 text-zinc-400 hover:text-zinc-900 transition-all active:scale-95"
              title="Previous Month"
            >
              <span className="material-symbols-outlined text-[20px]">chevron_left</span>
            </button>
            <button 
              onClick={() => setCurrentDate(new Date())}
              className="px-4 py-1 text-xs font-black text-zinc-500 border-x border-zinc-100 hover:text-primary hover:bg-zinc-50 transition-all select-none uppercase tracking-widest"
            >
              Today
            </button>
            <button 
              onClick={nextMonth}
              className="p-1.5 rounded-md hover:bg-zinc-50 text-zinc-400 hover:text-zinc-900 transition-all active:scale-95"
              title="Next Month"
            >
              <span className="material-symbols-outlined text-[20px]">chevron_right</span>
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-7 border-b border-zinc-100 bg-white shrink-0 shadow-sm z-10">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, i) => (
          <div key={day} className={`py-3 text-center text-[10px] font-black tracking-[0.2em] uppercase ${i === 0 || i === 6 ? 'text-zinc-300' : 'text-zinc-400'}`}>{day}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 flex-1 overflow-y-auto hide-scrollbar">
        {Array.from({ length: 42 }).map((_, i) => {
          const dayNum = i - startOffset + 1;
          const isCurrentMonth = dayNum > 0 && dayNum <= numDays;
          const cellDate = new Date(year, month, dayNum);
          const isToday = today.toDateString() === cellDate.toDateString();

          const dayRows = rows.filter(row => {
            if (!row[dateField.id]) return false;
            const d = new Date(row[dateField.id]);
            return d.getFullYear() === year && d.getMonth() === month && d.getDate() === dayNum;
          });

          const taskNameField = fields.find(f => f.name.toLowerCase().includes('name')) || fields[0];

          return (
            <div 
              key={i} 
              className={`
                min-h-[140px] p-2 border-r border-b border-zinc-100 transition-all duration-200 select-none
                ${!isCurrentMonth ? 'bg-zinc-50/20' : 'bg-white hover:bg-zinc-50/30'}
                ${isToday ? 'bg-blue-50/20 ring-inset ring-2 ring-blue-100/30 ring-offset-0' : ''}
              `}
            >
              <div className="flex items-center justify-between mb-2 px-1">
                <span className={`
                  text-[11px] font-black rounded-lg w-7 h-7 flex items-center justify-center transition-all shadow-sm border
                  ${!isCurrentMonth ? 'text-zinc-200 border-transparent shadow-none' : isToday ? 'bg-primary text-white border-primary shadow-blue-200' : 'bg-white text-zinc-500 border-zinc-100 group-hover:text-zinc-900'}
                `}>
                  {isCurrentMonth ? dayNum : ''}
                </span>
                {isToday && <span className="text-[10px] font-black text-primary uppercase tracking-tighter">TODAY</span>}
              </div>
              
              <div className="space-y-1 overflow-hidden px-1">
                {isCurrentMonth && dayRows.map(row => {
                   const status = String(row.status || row[fields.find(f => f.name.toLowerCase() === 'status')?.id || ''] || '').toLowerCase();
                   return (
                    <div 
                      key={row.id} 
                      className={`px-2 py-1 text-[10px] font-bold rounded-lg border truncate transition-all cursor-pointer hover:shadow-md hover:scale-[1.02] border-transparent shadow-sm ${getStatusBadgeStyle(status)}`}
                      title={String(row[taskNameField.id] || 'Untitled Task')}
                    >
                      {row[taskNameField.id] || 'Untitled Task'}
                    </div>
                   );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
