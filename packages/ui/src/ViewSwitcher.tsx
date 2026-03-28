import React from 'react';

export type ViewType = 'Table' | 'Kanban' | 'Calendar';

interface ViewSwitcherProps {
  activeView: ViewType | string;
  onViewChange: (view: any) => void;
  extraViews?: { id: string, label: string }[];
  onFilterClick?: () => void;
  onSortClick?: () => void;
  onNewTaskClick?: () => void;
  filterCount?: number;
}

/**
 * Clean Canvas View Switcher for ORBIT Workspace OS.
 */
export function ViewSwitcher({ 
  activeView, 
  onViewChange, 
  extraViews = [],
  onFilterClick,
  onSortClick,
  onNewTaskClick,
  filterCount = 0
}: ViewSwitcherProps) {
  const views = [
    { id: 'Table', label: 'Table', icon: 'table_rows' },
    { id: 'Kanban', label: 'Kanban', icon: 'dashboard' },
    { id: 'Calendar', label: 'Calendar', icon: 'calendar_month' },
    ...extraViews.map(v => ({ id: v.id, label: v.label, icon: 'extension' }))
  ];

  return (
    <div className="flex items-center justify-between border-b border-zinc-200 bg-white px-4 font-sans shrink-0">
      <div className="flex items-center space-x-1">
        {views.map((view) => (
          <button
            key={view.id}
            onClick={() => onViewChange(view.id)}
            className={`
              flex items-center space-x-2 px-4 py-3 text-sm font-bold transition-all relative
              ${activeView === view.id 
                ? 'text-[#0058BE]' 
                : 'text-zinc-400 hover:text-zinc-600 hover:bg-zinc-50'}
            `}
          >
            <span className="material-symbols-outlined text-[18px]">{view.icon}</span>
            <span>{view.label}</span>
            {activeView === view.id && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#0058BE]" />
            )}
          </button>
        ))}
      </div>

      <div className="flex items-center space-x-2">
        <button 
          onClick={onFilterClick}
          className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-bold text-zinc-500 hover:bg-zinc-100 rounded-lg transition-colors border border-transparent hover:border-zinc-200"
        >
          <span className="material-symbols-outlined text-[18px]">filter_list</span>
          <span>Filter</span>
          {filterCount > 0 && <span className="bg-[#0058BE] text-white px-1.5 rounded-full text-[10px]">{filterCount}</span>}
        </button>
        <button 
          onClick={onSortClick}
          className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-bold text-zinc-500 hover:bg-zinc-100 rounded-lg transition-colors border border-transparent hover:border-zinc-200"
        >
          <span className="material-symbols-outlined text-[18px]">swap_vert</span>
          <span>Sort</span>
        </button>
        <div className="w-px h-4 bg-zinc-200 mx-1" />
        <button 
          onClick={onNewTaskClick}
          className="flex items-center space-x-1.5 px-4 py-1.5 text-xs font-bold text-white bg-zinc-800 hover:bg-zinc-900 rounded-lg transition-all shadow-lg active:scale-95"
        >
          <span className="material-symbols-outlined text-[18px]">add</span>
          <span>New Task</span>
        </button>
      </div>
    </div>
  );
}
