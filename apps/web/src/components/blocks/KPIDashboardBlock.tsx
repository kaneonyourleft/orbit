'use client';
import React, { useState, useEffect } from 'react';
import { createClient } from '../../lib/supabase';

const supabase = createClient();

interface KPICard { id: string; title: string; sourceDbId: string; aggregation: 'count' | 'sum' | 'avg'; filterColumn?: string; filterValue?: string; icon: string; color: string; }
interface Props { blockId: string; pageId: string; }

const DEFAULT_CARDS: KPICard[] = [
  { id: 'k1', title: '생산 목표', sourceDbId: '', aggregation: 'count', icon: '🎯', color: '#f59e0b' },
  { id: 'k2', title: '현재 가동', sourceDbId: '', aggregation: 'count', filterColumn: 'status', filterValue: '진행 중', icon: '⚡', color: '#3b82f6' },
  { id: 'k3', title: '출하 완료', sourceDbId: '', aggregation: 'count', filterColumn: 'status', filterValue: '완료', icon: '📦', color: '#10b981' },
];

/**
 * 🎯 핵심 성과 지표 (KPI) 대시보드 블록
 */
export default function KPIDashboardBlock({ blockId, pageId }: Props) {
  const [cards] = useState<KPICard[]>(DEFAULT_CARDS);
  const [values, setValues] = useState<Record<string, number>>({});
  const [availableDbs, setAvailableDbs] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    supabase.from('orbit_databases').select('id, name').eq('page_id', pageId).then(({ data }) => { if (data) setAvailableDbs(data); });
  }, [pageId]);

  useEffect(() => {
    if (availableDbs.length === 0) return;
    
    // 임시: 첫 번째 DB를 기본 소스로 사용하여 데이터 집계
    const firstDbId = availableDbs[0].id;
    
    cards.forEach(async (card) => {
      const dbId = card.sourceDbId || firstDbId;
      if (!dbId) return;
      
      const { data } = await supabase.from('orbit_rows').select('cells').eq('database_id', dbId);
      if (!data) return;
      
      let filtered = data;
      if (card.filterColumn && card.filterValue) {
        filtered = data.filter((r: any) => r.cells[card.filterColumn!] === card.filterValue);
      }
      setValues(prev => ({ ...prev, [card.id]: filtered.length }));
    });
  }, [cards, availableDbs]);

  return (
    <div className="my-10 grid grid-cols-1 md:grid-cols-3 gap-6" onClickCapture={e => e.stopPropagation()}>
      {cards.map(card => (
        <div key={card.id} className="relative group bg-slate-900/60 backdrop-blur-3xl rounded-[2rem] p-8 border border-white/5 transition-all hover:scale-105 hover:bg-slate-800/80 shadow-2xl">
          <div className="absolute top-0 right-0 w-24 h-24 blur-[60px] rounded-full opacity-20 -mr-12 -mt-12 transition-opacity group-hover:opacity-40" style={{ background: card.color }} />
          
          <div className="flex flex-col gap-4 relative z-10">
            <div className="flex items-center justify-between">
              <div className="w-12 h-12 flex items-center justify-center rounded-2xl bg-white/5 border border-white/5 shadow-inner text-2xl group-hover:scale-110 transition-transform">
                {card.icon}
              </div>
              <div className="text-[10px] font-black uppercase tracking-[0.2em] text-white/20">LIVE</div>
            </div>
            
            <div className="flex flex-col">
              <span className="text-[11px] font-black uppercase tracking-widest text-slate-500 mb-1">{card.title}</span>
              <div className="flex items-baseline gap-2">
                <span className="text-5xl font-black tabular-nums tracking-tighter" style={{ color: card.color }}>
                  {values[card.id] !== undefined ? values[card.id].toLocaleString() : '—'}
                </span>
                <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest ml-1">Units</span>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-white/5 flex items-center gap-2">
               <span className="flex h-1.5 w-1.5 rounded-full bg-slate-700 group-hover:bg-green-500 group-hover:animate-pulse transition-colors" />
               <span className="text-[9px] font-bold text-slate-600 uppercase tracking-widest">Real-time sync active</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
