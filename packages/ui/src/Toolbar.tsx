import React, { useRef, useEffect } from 'react';
import { OrbitField } from '@orbit/core';
import { FilterCondition, FilterPanel } from './FilterPanel';
import { SortCondition, SortPanel } from './SortPanel';
import { GroupPanel } from './GroupPanel';

interface ToolbarProps {
  fields: OrbitField[];
  filters: FilterCondition[];
  sorts: SortCondition[];
  groupBy: string | null;
  onUpdateFilters: (filters: FilterCondition[]) => void;
  onUpdateSorts: (sorts: SortCondition[]) => void;
  onUpdateGroupBy: (fieldId: string | null) => void;
  activePanel: 'filter' | 'sort' | 'group' | null;
  onPanelChange: (panel: 'filter' | 'sort' | 'group' | null) => void;
  onNewRow: () => void;
}

/**
 * Clean Canvas Toolbar for ORBIT Workspace OS.
 * Contains Filter, Sort, Group buttons and their respective dropdown panels.
 */
export function Toolbar({ 
  fields, 
  filters, 
  sorts, 
  groupBy, 
  onUpdateFilters, 
  onUpdateSorts, 
  onUpdateGroupBy,
  activePanel,
  onPanelChange,
  onNewRow
}: ToolbarProps) {
  const toolbarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (toolbarRef.current && !toolbarRef.current.contains(event.target as Node)) {
        onPanelChange(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onPanelChange]);

  const togglePanel = (panel: 'filter' | 'sort' | 'group') => {
    onPanelChange(activePanel === panel ? null : panel);
  };

  return (
    <div ref={toolbarRef} className="flex items-center justify-between px-8 py-3 bg-white font-sans antialiased shrink-0 select-none z-40">
      <div className="flex items-center gap-2">
        {/* Filter Button */}
        <div className="relative">
          <button 
            onClick={() => togglePanel('filter')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-black uppercase tracking-wider border rounded-lg transition-all shadow-sm ${activePanel === 'filter' ? 'bg-primary text-white border-primary shadow-blue-100 ring-4 ring-blue-50/50' : 'bg-white text-zinc-500 border-zinc-200 hover:text-zinc-800 hover:border-zinc-400'}`}
          >
            <span className="material-symbols-outlined text-[18px]">filter_list</span>
            <span>Filter</span>
            {filters.length > 0 && <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-black ${activePanel === 'filter' ? 'bg-white text-primary' : 'bg-primary text-white'}`}>{filters.length}</span>}
          </button>
          
          {activePanel === 'filter' && (
            <div className="absolute left-0 top-full mt-3 z-[100]">
              <FilterPanel 
                fields={fields} 
                filters={filters} 
                onAddFilter={() => onUpdateFilters([...filters, { fieldId: fields[0]?.id || '', operator: 'contains', value: '' }])}
                onUpdateFilter={(idx, f) => onUpdateFilters(filters.map((cf, i) => i === idx ? f : cf))}
                onRemoveFilter={(idx) => onUpdateFilters(filters.filter((_, i) => i !== idx))}
              />
            </div>
          )}
        </div>

        {/* Sort Button */}
        <div className="relative">
          <button 
            onClick={() => togglePanel('sort')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-black uppercase tracking-wider border rounded-lg transition-all shadow-sm ${activePanel === 'sort' ? 'bg-primary text-white border-primary shadow-blue-100 ring-4 ring-blue-50/50' : 'bg-white text-zinc-500 border-zinc-200 hover:text-zinc-800 hover:border-zinc-400'}`}
          >
            <span className="material-symbols-outlined text-[18px]">swap_vert</span>
            <span>Sort</span>
            {sorts.length > 0 && <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-black ${activePanel === 'sort' ? 'bg-white text-primary' : 'bg-primary text-white'}`}>{sorts.length}</span>}
          </button>

          {activePanel === 'sort' && (
            <div className="absolute left-0 top-full mt-3 z-[100]">
              <SortPanel 
                fields={fields} 
                sorts={sorts} 
                onAddSort={() => onUpdateSorts([...sorts, { fieldId: fields[0]?.id || '', direction: 'asc' }])}
                onUpdateSort={(idx, s) => onUpdateSorts(sorts.map((cs, i) => i === idx ? s : cs))}
                onRemoveSort={(idx) => onUpdateSorts(sorts.filter((_, i) => i !== idx))}
              />
            </div>
          )}
        </div>

        {/* Group Button */}
        <div className="relative">
          <button 
            onClick={() => togglePanel('group')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-black uppercase tracking-wider border rounded-lg transition-all shadow-sm ${activePanel === 'group' ? 'bg-primary text-white border-primary shadow-blue-100 ring-4 ring-blue-50/50' : 'bg-white text-zinc-500 border-zinc-200 hover:text-zinc-800 hover:border-zinc-400'}`}
          >
            <span className="material-symbols-outlined text-[18px]">account_tree</span>
            <span>Group</span>
            {groupBy && <span className={`w-1.5 h-1.5 rounded-full ${activePanel === 'group' ? 'bg-white' : 'bg-primary'} animate-pulse`}></span>}
          </button>

          {activePanel === 'group' && (
            <div className="absolute left-0 top-full mt-3 z-[100]">
              <GroupPanel 
                fields={fields} 
                groupBy={groupBy} 
                onGroupBy={(fieldId) => { onUpdateGroupBy(fieldId); onPanelChange(null); }} 
              />
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="w-px h-6 bg-zinc-100" />
        <button 
          onClick={onNewRow}
          className="flex items-center gap-2 px-4 py-2 bg-[#006C49] border border-[#006C49] text-white text-xs font-black uppercase tracking-widest rounded-xl hover:bg-[#005a3d] transition-all shadow-lg shadow-emerald-100 active:scale-95"
        >
          <span className="material-symbols-outlined text-[18px]">add</span>
          <span>New Task</span>
        </button>
      </div>
    </div>
  );
}
