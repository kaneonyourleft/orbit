import React, { useState } from 'react';
import { OrbitField } from '@orbit/core';

interface CalendarViewProps {
  fields: OrbitField[];
  rows: Record<string, any>[];
  onUpdateCell: (rowId: string, fieldId: string, value: any) => void;
}

/**
 * Monthly calendar view for time-based data.
 * Plots rows on their respective dates.
 */
export function CalendarView({ fields, rows, onUpdateCell }: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date(2026, 2, 28)); // Starting March 2026 as per user requirement or today
  const dateField = fields.find(f => f.type === 'date');

  if (!dateField) {
    return (
      <div className="w-full aspect-video flex flex-col items-center justify-center bg-zinc-900/40 rounded-3xl border border-zinc-800/50 space-y-4">
        <div className="w-16 h-16 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-600">
          <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-calendar-x"><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M3 10h18"/><path d="M8 2v4"/><path d="M16 2v4"/><path d="m9 14 6 6"/><path d="m15 14-6 6"/></svg>
        </div>
        <p className="text-zinc-500 font-medium">Add a Date field to use Calendar view</p>
      </div>
    );
  }

  const daysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

  const prevMonth = (e: React.MouseEvent) => {
    e.preventDefault();
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };
  const nextMonth = (e: React.MouseEvent) => {
    e.preventDefault();
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const numDays = daysInMonth(year, month);
  const startOffset = firstDayOfMonth(year, month);

  const monthName = currentDate.toLocaleString('default', { month: 'long' });
  const today = new Date();

  return (
    <div className="w-full bg-zinc-900/10 border border-zinc-800/50 rounded-3xl overflow-hidden shadow-2xl backdrop-blur-sm">
      <div className="flex items-center justify-between p-6 border-b border-zinc-800/50 bg-zinc-900/40">
        <h2 className="text-2xl font-bold tracking-tight text-white">{monthName} {year}</h2>
        <div className="flex items-center space-x-2">
          <button 
            onClick={prevMonth}
            className="p-2.5 rounded-xl border border-zinc-800 hover:bg-zinc-800 hover:text-white transition-all text-zinc-500"
            title="Previous Month"
            aria-label="Previous Month"
          >
           <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
          </button>
          <button 
            onClick={nextMonth}
            className="p-2.5 rounded-xl border border-zinc-800 hover:bg-zinc-800 hover:text-white transition-all text-zinc-500"
            title="Next Month"
            aria-label="Next Month"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 border-b border-zinc-800/30">
        {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map(day => (
          <div key={day} className="py-3 text-center text-[10px] font-bold tracking-widest text-zinc-600 font-mono border-r border-zinc-800 last:border-0">{day}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 h-[600px] overflow-y-auto scrollbar-hide">
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

          return (
            <div 
              key={i} 
              className={`
                min-h-[100px] p-2 border-r border-b border-zinc-800/40 last:border-r-0 transition-colors
                ${!isCurrentMonth ? 'bg-zinc-950/20' : 'bg-transparent'}
                ${isToday ? 'relative' : ''}
              `}
            >
              <div className="flex items-center justify-between mb-2">
                <span className={`
                  text-xs font-mono font-bold
                  ${!isCurrentMonth ? 'text-zinc-800' : isToday ? 'text-blue-400' : 'text-zinc-600'}
                `}>
                  {isCurrentMonth ? dayNum : ''}
                </span>
                {isToday && (
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(37,99,235,0.8)]" />
                )}
              </div>
              
              <div className="space-y-1 overflow-hidden">
                {dayRows.map(row => (
                  <div 
                    key={row.id} 
                    className="px-2 py-1 text-[10px] bg-zinc-800/80 border border-zinc-700/50 rounded-lg text-zinc-300 truncate font-medium hover:border-zinc-500 transition-colors shadow-lg shadow-black/20"
                    title={row[fields[0].id]}
                  >
                    {row[fields[0].id] || 'Untitled'}
                  </div>
                ))}
              </div>

              {isToday && (
                 <div className="absolute inset-0 border-2 border-blue-600/30 pointer-events-none rounded-[1px]" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
