import React, { useState } from 'react';
import { OrbitField } from '@orbit/core';

interface CalendarViewProps {
  fields: OrbitField[];
  rows: Record<string, any>[];
  onUpdateCell: (rowId: string, fieldId: string, value: any) => void;
}

/**
 * Clean Canvas Calendar View for ORBIT Workspace OS.
 */
export function CalendarView({ fields, rows, onUpdateCell }: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date(2026, 2, 28)); 
  const dateField = fields.find(f => f.type === 'date');

  if (!dateField) {
    return (
      <div className="w-full aspect-video flex flex-col items-center justify-center bg-white rounded-xl border border-dashed border-zinc-200 space-y-4">
        <div className="w-12 h-12 rounded-full bg-zinc-50 flex items-center justify-center text-zinc-400">
          <span className="material-symbols-outlined text-[32px]">calendar_today</span>
        </div>
        <p className="text-zinc-500 font-medium text-sm">Add a Date field to use Calendar view</p>
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

  const getStatusStyles = (status: string) => {
    const s = String(status || '').toLowerCase();
    if (s.includes('progress')) return 'bg-blue-100 text-blue-700';
    if (s.includes('planned')) return 'bg-zinc-100 text-zinc-600';
    if (s.includes('stuck') || s.includes('critical')) return 'bg-red-100 text-red-700 font-bold';
    if (s.includes('completed') || s.includes('done')) return 'bg-emerald-100 text-emerald-700';
    return 'bg-zinc-100 text-zinc-600';
  };

  return (
    <div className="w-full bg-white border border-zinc-200 rounded-xl overflow-hidden shadow-sm font-sans flex flex-col h-[700px]">
      <div className="flex items-center justify-between p-4 border-b border-zinc-200 bg-[#F7F7F5]/50 shrink-0">
        <h2 className="text-lg font-bold text-zinc-800 tracking-tight">{monthName} {year}</h2>
        <div className="flex items-center space-x-1">
          <button 
            onClick={prevMonth}
            className="p-1.5 rounded-md border border-zinc-200 hover:bg-zinc-100 text-zinc-500 transition-all"
            title="Previous Month"
          >
            <span className="material-symbols-outlined text-[20px]">chevron_left</span>
          </button>
          <button 
            onClick={() => setCurrentDate(new Date())}
            className="px-3 py-1 text-xs font-bold text-zinc-600 hover:bg-zinc-100 border border-zinc-200 rounded-md transition-all"
          >
            Today
          </button>
          <button 
            onClick={nextMonth}
            className="p-1.5 rounded-md border border-zinc-200 hover:bg-zinc-100 text-zinc-500 transition-all"
            title="Next Month"
          >
            <span className="material-symbols-outlined text-[20px]">chevron_right</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 border-b border-zinc-200 bg-[#F7F7F5]/30 shrink-0">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div key={day} className="py-2 text-center text-[10px] font-bold tracking-widest text-zinc-400 uppercase">{day}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 flex-1 overflow-y-auto">
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
                min-h-[120px] p-2 border-r border-b border-zinc-100 transition-colors group
                ${!isCurrentMonth ? 'bg-zinc-50/30' : 'bg-white hover:bg-zinc-50/20'}
                ${isToday ? 'bg-blue-50/10' : ''}
              `}
            >
              <div className="flex items-center justify-between mb-2">
                <span className={`
                  text-[11px] font-bold rounded-full w-6 h-6 flex items-center justify-center transition-colors
                  ${!isCurrentMonth ? 'text-zinc-300' : isToday ? 'bg-[#0058BE] text-white shadow-lg shadow-blue-500/30' : 'text-zinc-500 group-hover:text-zinc-800'}
                `}>
                  {isCurrentMonth ? dayNum : ''}
                </span>
              </div>
              
              <div className="space-y-1 overflow-hidden">
                {isCurrentMonth && dayRows.map(row => {
                   const status = String(row.status || row.data?.status || '').toLowerCase();
                   return (
                    <div 
                      key={row.id} 
                      className={`px-1.5 py-0.5 text-[9px] font-bold rounded border truncate transition-all ${getStatusStyles(status)} border-transparent hover:shadow-sm`}
                      title={String(row[taskNameField.id] || 'Untitled')}
                    >
                      {row[taskNameField.id] || 'Untitled'}
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
