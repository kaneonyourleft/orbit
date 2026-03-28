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

export function Toolbar({
  fields, filters, sorts, groupBy,
  onUpdateFilters, onUpdateSorts, onUpdateGroupBy,
  activePanel, onPanelChange, onNewRow
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
    <div ref={toolbarRef} className="relative flex items-center justify-between py-2 font-sans antialiased select-none">
      <div className="flex items-center gap-1.5">
        {/* Filter */}
        <div className="relative">
          <button onClick={() => togglePanel('filter')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-bold rounded-lg transition-all ${
              activePanel === 'filter'
                ? 'bg-primary text-white shadow-md shadow-blue-100'
                : filters.length > 0
                  ? 'bg-blue-50 text-primary border border-blue-200'
                  : 'text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700'
            }`}>
            <span className="material-symbols-outlined text-[16px]">filter_list</span>
            <span>Filter</span>
            {filters.length > 0 && (
              <span className={`ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-black ${
                activePanel === 'filter' ? 'bg-white/20 text-white' : 'bg-primary text-white'
              }`}>{filters.length}</span>
            )}
          </button>
          {activePanel === 'filter' && (
            <div className="absolute left-0 top-full mt-2 z-[100]">
              <FilterPanel fields={fields} filters={filters}
                onAddFilter={() => onUpdateFilters([...filters, { fieldId: fields[0]?.id || '', operator: 'contains', value: '' }])}
                onUpdateFilter={(idx, f) => onUpdateFilters(filters.map((cf, i) => i === idx ? f : cf))}
                onRemoveFilter={(idx) => onUpdateFilters(filters.filter((_, i) => i !== idx))} />
            </div>
          )}
        </div>

        {/* Sort */}
        <div className="relative">
          <button onClick={() => togglePanel('sort')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-bold rounded-lg transition-all ${
              activePanel === 'sort'
                ? 'bg-primary text-white shadow-md shadow-blue-100'
                : sorts.length > 0
                  ? 'bg-blue-50 text-primary border border-blue-200'
                  : 'text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700'
            }`}>
            <span className="material-symbols-outlined text-[16px]">swap_vert</span>
            <span>Sort</span>
            {sorts.length > 0 && (
              <span className={`ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-black ${
                activePanel === 'sort' ? 'bg-white/20 text-white' : 'bg-primary text-white'
              }`}>{sorts.length}</span>
            )}
          </button>
          {activePanel === 'sort' && (
            <div className="absolute left-0 top-full mt-2 z-[100]">
              <SortPanel fields={fields} sorts={sorts}
                onAddSort={() => onUpdateSorts([...sorts, { fieldId: fields[0]?.id || '', direction: 'asc' }])}
                onUpdateSort={(idx, s) => onUpdateSorts(sorts.map((cs, i) => i === idx ? s : cs))}
                onRemoveSort={(idx) => onUpdateSorts(sorts.filter((_, i) => i !== idx))} />
            </div>
          )}
        </div>

        {/* Group */}
        <div className="relative">
          <button onClick={() => togglePanel('group')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-bold rounded-lg transition-all ${
              activePanel === 'group'
                ? 'bg-primary text-white shadow-md shadow-blue-100'
                : groupBy
                  ? 'bg-blue-50 text-primary border border-blue-200'
                  : 'text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700'
            }`}>
            <span className="material-symbols-outlined text-[16px]">account_tree</span>
            <span>Group</span>
            {groupBy && !activePanel && (
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse ml-1" />
            )}
          </button>
          {activePanel === 'group' && (
            <div className="absolute left-0 top-full mt-2 z-[100]">
              <GroupPanel fields={fields} groupBy={groupBy}
                onGroupBy={(fieldId) => { onUpdateGroupBy(fieldId); onPanelChange(null); }} />
            </div>
          )}
        </div>

        {/* 구분선 */}
        <div className="w-px h-5 bg-zinc-200 mx-1" />

        {/* New Task */}
        <button onClick={onNewRow}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[12px] font-bold rounded-lg transition-all active:scale-95 shadow-sm">
          <span className="material-symbols-outlined text-[16px]">add</span>
          New Task
        </button>
      </div>
    </div>
  );
}
