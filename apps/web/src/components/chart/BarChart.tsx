'use client';
import React from 'react';

interface DataPoint { label: string; value: number; color?: string; }
interface Props { data: DataPoint[]; height?: number; }

/**
 * 📊 고성능 막대 차트 컴포넌트 (ORBIT 전용)
 */
export default function BarChart({ data, height = 200 }: Props) {
  if (data.length === 0) return <div className="text-slate-500 text-xs p-5 italic">데이터가 없습니다</div>;
  const maxVal = Math.max(...data.map(d => d.value), 1);

  return (
    <div style={{ height }} className="flex items-end gap-2 p-4 pb-8 w-full">
      {data.map((d, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-1 group relative">
          {/* 툴팁 */}
          <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none whitespace-nowrap shadow-xl border border-white/5">
            {d.label}: <span className="font-black text-amber-400">{d.value}</span>
          </div>
          
          <span className="text-[10px] font-bold text-slate-500 tabular-nums">{d.value}</span>
          <div 
            className="w-full max-w-[60px] rounded-t-lg transition-all duration-500 ease-out shadow-lg shadow-black/20"
            style={{
              height: `${(d.value / maxVal) * (height - 60)}px`,
              background: d.color || '#7f6df2',
              minHeight: 2,
            }} 
          />
          <span className="text-[9px] font-black text-slate-400 text-center overflow-hidden text-ellipsis whitespace-nowrap w-full mt-1 uppercase tracking-tighter">
            {d.label}
          </span>
        </div>
      ))}
    </div>
  );
}
