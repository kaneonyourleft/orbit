'use client';
import React from 'react';

interface Props {
  chartType: 'bar' | 'pie' | 'line';
  onChangeType: (t: 'bar' | 'pie' | 'line') => void;
  sourceDbId: string;
  onChangeSource: (id: string) => void;
  labelColumn: string;
  onChangeLabelColumn: (col: string) => void;
  valueColumn: string;
  onChangeValueColumn: (col: string) => void;
  availableDbs: { id: string; name: string }[];
  availableColumns: { id: string; name: string }[];
}

/**
 * ⚙ ORBIT 차트 설정 패널
 */
export default function ChartConfig(props: Props) {
  const { 
    chartType, onChangeType, 
    sourceDbId, onChangeSource, 
    labelColumn, onChangeLabelColumn, 
    valueColumn, onChangeValueColumn, 
    availableDbs, availableColumns 
  } = props;

  return (
    <div className="p-5 bg-slate-800/60 rounded-2xl border border-white/5 grid grid-cols-2 gap-6 text-[11px] font-black uppercase tracking-widest text-slate-500 mb-4 shadow-inner">
      <div className="space-y-2">
        <label className="flex items-center gap-2 mb-1">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shadow-[0_0_8px_#f59e0b44]" />
          차트 타입
        </label>
        <div className="flex gap-1.5 p-1 bg-black/20 rounded-lg border border-white/5">
          {(['bar', 'pie', 'line'] as const).map(t => (
            <button 
              key={t} 
              onClick={() => onChangeType(t)}
              className={`flex-1 py-1.5 px-3 font-black rounded-md transition-all ${
                chartType === t 
                  ? 'bg-slate-700 text-white shadow-lg' 
                  : 'text-slate-500 hover:text-white hover:bg-white/5'
              }`}
            >
              {t === 'bar' ? '막대' : t === 'pie' ? '원형' : '선형'}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <label className="flex items-center gap-2 mb-1">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_8px_#3b82f644]" />
          데이터 소스
        </label>
        <select 
          value={sourceDbId} 
          onChange={e => onChangeSource(e.target.value)} 
          className="w-full p-2.5 bg-slate-900/60 text-slate-300 border border-white/10 rounded-lg outline-none cursor-pointer hover:border-white/20 transition-colors uppercase font-mono text-[10px]"
        >
          <option value="">데이터베이스 선택...</option>
          {availableDbs.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
        </select>
      </div>

      <div className="space-y-2">
        <label className="flex items-center gap-2 mb-1">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b98144]" />
          라벨 설정
        </label>
        <select 
          value={labelColumn} 
          onChange={e => onChangeLabelColumn(e.target.value)} 
          className="w-full p-2.5 bg-slate-900/60 text-slate-300 border border-white/10 rounded-lg outline-none cursor-pointer hover:border-white/20 transition-colors uppercase font-mono text-[10px]"
        >
          {availableColumns.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>

      <div className="space-y-2">
        <label className="flex items-center gap-2 mb-1">
          <span className="w-1.5 h-1.5 rounded-full bg-violet-500 shadow-[0_0_8px_#8b5cf644]" />
          값 설정
        </label>
        <select 
          value={valueColumn} 
          onChange={e => onChangeValueColumn(e.target.value)} 
          className="w-full p-2.5 bg-slate-900/60 text-slate-300 border border-white/10 rounded-lg outline-none cursor-pointer hover:border-white/20 transition-colors uppercase font-mono text-[10px]"
        >
          {availableColumns.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          <option value="">(빈 값 - 항목 개수 카운트)</option>
        </select>
      </div>
    </div>
  );
}
