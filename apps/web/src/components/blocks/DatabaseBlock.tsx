'use client';
import React, { useState, useEffect } from 'react';
import { useDatabase } from '../../lib/useDatabase';
import ViewSwitcher from '../database/ViewSwitcher';
import FilterBar from '../database/FilterBar';
import InlineTable from '../database/InlineTable';
import InlineKanban from '../database/InlineKanban';
import InlineCalendar from '../database/InlineCalendar';
import type { DBView } from '../database/types';

interface Props {
  blockId: string;
  pageId: string;
  existingDbId?: string;
}

export default function DatabaseBlock({ blockId, pageId, existingDbId }: Props) {
  const [dbId, setDbId] = useState<string | null>(existingDbId || null);
  const { 
    db, rows, loading, 
    createDatabase, addRow, updateCell, deleteRow, 
    addColumn, updateColumn, deleteColumn, updateView 
  } = useDatabase(dbId);
  const [activeViewId, setActiveViewId] = useState<string>('view_table');
  const [nameEditing, setNameEditing] = useState(false);

  // 초기 DB 자동 생성
  useEffect(() => {
    if (!dbId && pageId && blockId && !loading) {
      createDatabase(pageId, blockId).then(data => {
        if (data) setDbId(data.id);
      });
    }
  }, [dbId, pageId, blockId, createDatabase, loading]);

  if (loading || !db) {
    return (
      <div className="flex items-center gap-4 p-8 bg-slate-900/50 rounded-3xl border border-white/5 animate-pulse">
        <div className="w-10 h-10 rounded-2xl bg-white/5" />
        <div className="flex flex-col gap-2 flex-1">
          <div className="w-32 h-4 rounded bg-white/5" />
          <div className="w-64 h-2 rounded bg-white/5" />
        </div>
      </div>
    );
  }

  const activeView = db.views.find(v => v.id === activeViewId) || db.views[0];

  return (
    <div className="my-10 bg-slate-900/40 rounded-[2.5rem] border border-white/10 shadow-[0_30px_60px_rgba(0,0,0,0.5)] overflow-hidden font-sans group relative transition-all hover:bg-slate-900/60"
         onClick={e => e.stopPropagation()}>
      
      {/* 1. 상단 장식 및 배경 그라데이션 */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent" />
      <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 blur-[50px] rounded-full -mr-16 -mt-16 pointer-events-none" />

      {/* 2. 네비게이션 헤더 */}
      <div className="p-6 pb-2">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 flex items-center justify-center bg-indigo-500/10 text-indigo-400 rounded-2xl border border-indigo-500/20 shadow-lg shadow-indigo-500/5 group-hover:bg-indigo-500 group-hover:text-white transition-all duration-300">
                <span className="text-xl">▤</span>
             </div>
             <div>
                {nameEditing ? (
                  <input autoFocus defaultValue={db.name}
                    onBlur={() => setNameEditing(false)}
                    onKeyDown={e => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }}
                    className="text-lg font-black bg-transparent text-white border-none outline-none focus:ring-0 p-0" />
                ) : (
                  <h4 onClick={() => setNameEditing(true)} 
                      className="text-lg font-black text-slate-100 cursor-pointer hover:text-indigo-400 transition-colors tracking-tight">
                    {db.name}
                  </h4>
                )}
                <p className="text-[10px] font-black tracking-widest text-slate-600 uppercase mt-0.5">{rows.length} Total Records Found</p>
             </div>
          </div>
          <div className="flex -space-x-2">
             {[0,1,2].map(i=>(<div key={i} className="w-6 h-6 rounded-full border-2 border-slate-900 bg-slate-800" />))}
             <div className="w-6 h-6 rounded-full border-2 border-slate-900 bg-indigo-500 flex items-center justify-center text-[8px] font-black text-white">+</div>
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-white/[0.03] pt-4">
           <ViewSwitcher views={db.views} activeViewId={activeViewId} onSwitch={setActiveViewId} />
           <FilterBar columns={db.columns} filters={activeView.filters}
             onUpdate={(filters) => updateView(activeView.id, { filters })} />
        </div>
      </div>

      {/* 3. 메인 콘텐츠 렌더링 영역 */}
      <div className="px-6 pb-6 pt-2">
         <div className="fade-in">
           {activeView.type === 'table' && (
             <InlineTable columns={db.columns} rows={rows} filters={activeView.filters} sorts={activeView.sorts}
               onUpdateCell={updateCell} onAddRow={() => addRow()} onDeleteRow={deleteRow}
               onAddColumn={addColumn} onUpdateColumn={updateColumn} onDeleteColumn={deleteColumn} />
           )}
           {activeView.type === 'kanban' && (
             <InlineKanban columns={db.columns} rows={rows}
               groupByColumnId={activeView.groupByColumn || (db.columns.find(c=>c.type==='select')?.id || '')}
               onUpdateCell={updateCell} onAddRow={(cells) => addRow(cells)} />
           )}
           {activeView.type === 'calendar' && (
             <InlineCalendar columns={db.columns} rows={rows}
               dateColumnId={activeView.dateColumn || (db.columns.find(c=>c.type==='date')?.id || '')}
               onUpdateCell={updateCell} />
           )}
         </div>
      </div>

      {/* 4. 위젯 푸터 (설정/정보 브릿지) */}
      <div className="px-8 py-3 bg-white/[0.02] border-t border-white/5 flex items-center justify-between">
         <span className="text-[10px] font-black text-slate-700 uppercase tracking-widest">Orbit Database Core v1.3</span>
         <div className="flex gap-4">
            <button className="text-[9px] font-black text-slate-600 hover:text-white transition-colors uppercase tracking-[3px]">EXPORT</button>
            <button className="text-[9px] font-black text-slate-600 hover:text-white transition-colors uppercase tracking-[3px]">SYNC</button>
         </div>
      </div>
    </div>
  );
}
