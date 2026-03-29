'use client';
import React, { useState, useEffect } from 'react';
import { createClient } from '../../lib/supabase';
import BarChart from '../chart/BarChart';
import PieChart from '../chart/PieChart';
import ChartConfig from '../chart/ChartConfig';

const supabase = createClient();
const CHART_COLORS = ['#7f6df2', '#34d399', '#f59e0b', '#ef4444', '#3b82f6', '#ec4899', '#8b5cf6', '#14b8a6'];

interface Props { blockId: string; pageId: string; }

export default function ChartBlock({ blockId, pageId }: Props) {
  const [configOpen, setConfigOpen] = useState(false);
  const [chartType, setChartType] = useState<'bar' | 'pie' | 'line'>('bar');
  const [sourceDbId, setSourceDbId] = useState('');
  const [labelColumn, setLabelColumn] = useState('');
  const [valueColumn, setValueColumn] = useState('');
  const [availableDbs, setAvailableDbs] = useState<{ id: string; name: string }[]>([]);
  const [columns, setColumns] = useState<{ id: string; name: string }[]>([]);
  const [chartData, setChartData] = useState<{ label: string; value: number; color: string }[]>([]);

  // 1. 페이지 내 사용 가능한 DB 목록 로드
  useEffect(() => {
    supabase.from('orbit_databases').select('id, name').eq('page_id', pageId).then(({ data }) => { if (data) setAvailableDbs(data); });
  }, [pageId]);

  // 2. 소스 DB 변경 시 컬럼 목록 동기화
  useEffect(() => {
    if (!sourceDbId) return;
    supabase.from('orbit_databases').select('columns').eq('id', sourceDbId).single().then(({ data }) => {
      if (data) {
        const cols = typeof data.columns === 'string' ? JSON.parse(data.columns) : (data.columns || []);
        setColumns(cols.map((c: { id: string; name: string }) => ({ id: c.id, name: c.name })));
        if (!labelColumn && cols.length > 0) setLabelColumn(cols[0].id);
        // valueColumn은 옵션 (없으면 카운트)
      }
    });
  }, [sourceDbId, labelColumn]);

  // 3. 데이터 로드 및 시각화용 데이터 가공
  useEffect(() => {
    if (!sourceDbId || !labelColumn) return;
    supabase.from('orbit_rows').select('cells').eq('database_id', sourceDbId).then(({ data }) => {
      if (!data) return;
      
      if (valueColumn) {
        // 특정 수치 기반 차트
        setChartData(data.map((r: any, i: number) => ({
          label: String(r.cells[labelColumn] || `항목${i + 1}`), 
          value: Number(r.cells[valueColumn]) || 0, 
          color: CHART_COLORS[i % CHART_COLORS.length],
        })));
      } else {
        // 개수 카운트 (피벗)
        const counts: Record<string, number> = {};
        data.forEach((r: any) => { 
          const label = String(r.cells[labelColumn] || '(빈 값)'); 
          counts[label] = (counts[label] || 0) + 1; 
        });
        setChartData(Object.entries(counts).map(([label, value], i) => ({ 
          label, value, color: CHART_COLORS[i % CHART_COLORS.length] 
        })));
      }
    });
  }, [sourceDbId, labelColumn, valueColumn]);

  return (
    <div className="my-10 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-[2.5rem] border border-white/10 shadow-2xl overflow-hidden font-sans relative" onClickCapture={e => e.stopPropagation()}>
      <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 blur-[80px] rounded-full pointer-events-none" />
      
      <div className="px-8 py-5 flex items-center justify-between border-b border-white/5 bg-white/2 backdrop-blur-xl">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 flex items-center justify-center bg-amber-500 text-white rounded-2xl shadow-lg font-black text-xl">📈</div>
          <div className="flex flex-col">
            <span className="text-sm font-black text-slate-100 uppercase tracking-tighter">DATA INTELLIGENCE</span>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{chartType} Visualization</span>
          </div>
        </div>
        <button 
          onClick={() => setConfigOpen(!configOpen)} 
          className="p-3 hover:bg-white/5 rounded-2xl transition-all border border-transparent hover:border-white/10 group"
          title="차트 설정"
        >
          <span className="text-xl group-hover:rotate-90 transition-transform inline-block">⚙</span>
        </button>
      </div>

      <div className="p-8">
        {configOpen && (
          <div className="fade-in mb-8 p-1 bg-white/5 rounded-3xl border border-white/5 shadow-inner">
             <ChartConfig 
                chartType={chartType} onChangeType={setChartType} 
                sourceDbId={sourceDbId} onChangeSource={setSourceDbId} 
                labelColumn={labelColumn} onChangeLabelColumn={setLabelColumn} 
                valueColumn={valueColumn} onChangeValueColumn={setValueColumn} 
                availableDbs={availableDbs} availableColumns={columns} 
              />
          </div>
        )}

        <div className="relative min-h-[250px] flex items-center justify-center">
          {chartData.length === 0 ? (
            <div className="flex flex-col items-center gap-4 text-slate-600">
              <span className="text-4xl opacity-20">📊</span>
              <p className="text-sm font-bold uppercase tracking-widest italic">{sourceDbId ? '연산 중...' : '데이터 소스를 대기 중'}</p>
            </div>
          ) : (
            <div className="w-full fade-in">
               {chartType === 'pie' ? <PieChart data={chartData} /> : <BarChart data={chartData} height={280} />}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
