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
}

/**
 * Clean Canvas Toolbar Panels for ORBIT Workspace OS.
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
  onPanelChange
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

  return (
    <div ref={toolbarRef} className="relative">
      {activePanel === 'filter' && (
        <div className="absolute right-0 top-0 mt-2 z-50">
          <FilterPanel 
            fields={fields} 
            filters={filters} 
            onAddFilter={() => onUpdateFilters([...filters, { fieldId: fields[0]?.id || '', operator: 'contains', value: '' }])}
            onUpdateFilter={(idx, f) => onUpdateFilters(filters.map((cf, i) => i === idx ? f : cf))}
            onRemoveFilter={(idx) => onUpdateFilters(filters.filter((_, i) => i !== idx))}
          />
        </div>
      )}

      {activePanel === 'sort' && (
        <div className="absolute right-0 top-0 mt-2 z-50">
          <SortPanel 
            fields={fields} 
            sorts={sorts} 
            onAddSort={() => onUpdateSorts([...sorts, { fieldId: fields[0]?.id || '', direction: 'asc' }])}
            onUpdateSort={(idx, s) => onUpdateSorts(sorts.map((cs, i) => i === idx ? s : cs))}
            onRemoveSort={(idx) => onUpdateSorts(sorts.filter((_, i) => i !== idx))}
          />
        </div>
      )}

      {activePanel === 'group' && (
        <div className="absolute left-0 top-0 mt-2 z-50">
          <GroupPanel 
            fields={fields} 
            groupBy={groupBy} 
            onGroupBy={onUpdateGroupBy} 
          />
        </div>
      )}
    </div>
  );
}
