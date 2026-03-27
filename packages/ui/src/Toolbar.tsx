import React, { useState, useRef, useEffect } from 'react';
import { OrbitField } from '@orbit/core';
import { FilterCondition, FilterPanel } from './FilterPanel';
import { SortCondition, SortPanel } from './SortPanel';
import { GroupPanel } from './GroupPanel';

interface ToolbarProps {
  fields: OrbitField[];
  filters: FilterCondition[];
  sorts: SortCondition[];
  groupBy: string | null;
  searchQuery: string;
  onUpdateFilters: (filters: FilterCondition[]) => void;
  onUpdateSorts: (sorts: SortCondition[]) => void;
  onUpdateGroupBy: (fieldId: string | null) => void;
  onUpdateSearch: (query: string) => void;
}

export function Toolbar({ 
  fields, 
  filters, 
  sorts, 
  groupBy, 
  searchQuery, 
  onUpdateFilters, 
  onUpdateSorts, 
  onUpdateGroupBy, 
  onUpdateSearch 
}: ToolbarProps) {
  const [activePanel, setActivePanel] = useState<'filter' | 'sort' | 'group' | null>(null);
  const toolbarRef = useRef<HTMLDivElement>(null);

  // Close panels when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (toolbarRef.current && !toolbarRef.current.contains(event.target as Node)) {
        setActivePanel(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const togglePanel = (panel: 'filter' | 'sort' | 'group') => {
    setActivePanel(activePanel === panel ? null : panel);
  };

  return (
    <div ref={toolbarRef} className="flex flex-col space-y-4 mb-6 relative">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-1 border border-zinc-800/50 bg-black/20 p-1.5 rounded-xl backdrop-blur-md relative h-9">
          <button 
            onClick={() => togglePanel('filter')}
            className={`px-3 py-1 text-xs font-semibold rounded-lg flex items-center space-x-2 transition-all h-6
              ${activePanel === 'filter' || filters.length > 0 ? 'bg-blue-600/10 text-blue-400' : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50'}
            `}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-filter"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>
            <span className="leading-none">Filter</span>
            {filters.length > 0 && (
              <span className="w-4 h-4 bg-blue-600 rounded-full text-[9px] font-bold text-white flex items-center justify-center animate-in zoom-in-50 duration-300">
                {filters.length}
              </span>
            )}
          </button>

          <button 
            onClick={() => togglePanel('sort')}
            className={`px-3 py-1 text-xs font-semibold rounded-lg flex items-center space-x-2 transition-all h-6
               ${activePanel === 'sort' || sorts.length > 0 ? 'bg-blue-600/10 text-blue-400' : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50'}
            `}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-arrow-up-down"><path d="m21 16-4 4-4-4"/><path d="M17 20V4"/><path d="m3 8 4-4 4 4"/><path d="M7 4v16"/></svg>
            <span className="leading-none">Sort</span>
          </button>

          <button 
            onClick={() => togglePanel('group')}
            className={`px-3 py-1 text-xs font-semibold rounded-lg flex items-center space-x-2 transition-all h-6
               ${activePanel === 'group' || groupBy ? 'bg-blue-600/10 text-blue-400' : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50'}
            `}
          >
             <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-layers-2"><path d="m16.02 12 5.02-2.833a2 2 0 0 0 0-3.334l-8-4.667a2 2 0 0 0-2 0l-8 4.667a2 2 0 0 0 0 3.334L11.98 12"/><path d="M16 16.02 21.02 13.187a2 2 0 0 0 0-3.334l-1.02-.594M8 16.02 2.98 13.187a2 2 0 0 1 0-3.334l1.02-.594"/><path d="m16.02 20.04 5.02-2.833a2 2 0 0 0 0-3.334l-1.02-.594M8 20.04 2.98 17.207a2 2 0 0 1 0-3.334l1.02-.594"/><path d="m11.98 20.12 8.04-4.54a2 2 0 0 0 0-3.334l-8.04 4.54a2 2 0 0 1-2 0l-8.04-4.54a2 2 0 0 0 0 3.334l8.04 4.54a2 2 0 0 0 2 0Z"/></svg>
            <span className="leading-none">Group</span>
          </button>

          <div className="w-px h-4 bg-zinc-800 mx-1" />

          <div className="relative flex items-center h-6">
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="absolute left-2.5 text-zinc-600"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
            <input 
              type="text"
              value={searchQuery}
              onChange={(e) => onUpdateSearch(e.target.value)}
              placeholder="Search data..."
              className="bg-zinc-900 border border-zinc-800 rounded-lg text-[11px] h-full pl-7 pr-3 outline-none focus:border-blue-500/50 transition-all w-48 text-zinc-300"
            />
          </div>

          {activePanel === 'filter' && (
            <FilterPanel 
              fields={fields} 
              filters={filters} 
              onAddFilter={() => onUpdateFilters([...filters, { fieldId: fields[0]?.id || '', operator: 'contains', value: '' }])}
              onUpdateFilter={(idx, f) => onUpdateFilters(filters.map((cf, i) => i === idx ? f : cf))}
              onRemoveFilter={(idx) => onUpdateFilters(filters.filter((_, i) => i !== idx))}
            />
          )}

          {activePanel === 'sort' && (
            <SortPanel 
              fields={fields} 
              sorts={sorts} 
              onAddSort={() => onUpdateSorts([...sorts, { fieldId: fields[0]?.id || '', direction: 'asc' }])}
              onUpdateSort={(idx, s) => onUpdateSorts(sorts.map((cs, i) => i === idx ? s : cs))}
              onRemoveSort={(idx) => onUpdateSorts(sorts.filter((_, i) => i !== idx))}
            />
          )}

          {activePanel === 'group' && (
            <GroupPanel 
              fields={fields} 
              groupBy={groupBy} 
              onGroupBy={onUpdateGroupBy} 
            />
          )}
        </div>
      </div>
    </div>
  );
}
