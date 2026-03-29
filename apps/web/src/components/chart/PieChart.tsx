'use client';
import React from 'react';

interface Slice { label: string; value: number; color: string; }
interface Props { data: Slice[]; size?: number; }

export default function PieChart({ data, size = 180 }: Props) {
  const total = data.reduce((s, d) => s + d.value, 0);
  if (total === 0) return <div className="text-slate-500 text-xs p-5 italic">데이터가 없습니다</div>;

  const r = size / 2;
  
  // paths 배열을 생성하면서 각 슬라이스의 각도를 계산합니다 (reduce 사용으로 변수 재할당 회피)
  const { paths } = data.reduce((acc, d, i) => {
    const angle = (d.value / total) * 360;
    const startAngle = acc.currentAngle;
    const endAngle = startAngle + angle;
    
    const startRad = ((startAngle - 90) * Math.PI) / 180;
    const endRad = ((endAngle - 90) * Math.PI) / 180;
    const x1 = r + r * Math.cos(startRad);
    const y1 = r + r * Math.sin(startRad);
    const x2 = r + r * Math.cos(endRad);
    const y2 = r + r * Math.sin(endRad);
    const largeArc = angle > 180 ? 1 : 0;
    
    acc.paths.push({ 
      path: `M ${r} ${r} L ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} Z`, 
      color: d.color, 
      label: d.label, 
      pct: Math.round((d.value / total) * 100),
      value: d.value
    });
    
    acc.currentAngle = endAngle;
    return acc;
  }, { paths: [] as any[], currentAngle: 0 });

  return (
    <div className="flex items-center gap-10 p-6">
      <div className="relative group p-4 bg-slate-800/20 rounded-full border border-white/5 transition-transform hover:scale-105">
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          {paths.map((p, i) => (
            <path 
              key={i} 
              d={p.path} 
              fill={p.color} 
              stroke="#1a1a1e" 
              strokeWidth={2} 
              className="hover:scale-110 origin-center transition-transform hover:opacity-90"
            />
          ))}
        </svg>
      </div>
      <div className="grid grid-cols-1 gap-2">
        {paths.map((p, i) => (
          <div key={i} className="flex items-center gap-3 transition-opacity">
            <div className="w-2.5 h-2.5 rounded-full" style={{ background: p.color, boxShadow: `0 0 10px ${p.color}44` }} />
            <div className="flex items-baseline gap-2">
              <span className="text-sm font-black text-slate-200">{p.label}</span>
              <span className="text-[10px] font-bold text-slate-500 tabular-nums">{p.pct}%</span>
              <span className="text-[9px] font-black text-white/20 bg-white/5 px-1.5 rounded">{p.value}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
