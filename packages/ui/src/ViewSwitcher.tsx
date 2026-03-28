import React from 'react';

export type ViewType = 'Table' | 'Kanban' | 'Calendar';

interface ViewSwitcherProps {
  activeView: ViewType | string;
  onViewChange: (view: any) => void;
  extraViews?: { id: string, label: string }[];
}

/**
 * Clean Canvas View Switcher for ORBIT Workspace OS.
 * Horizontal text tabs with material icons for switching between views.
 */
export function ViewSwitcher({ 
  activeView, 
  onViewChange, 
  extraViews = [],
}: ViewSwitcherProps) {
  const views = [
    { id: 'Table', label: 'Table', icon: 'table_chart' },
    { id: 'Kanban', label: 'Kanban', icon: 'view_kanban' },
    { id: 'Calendar', label: 'Calendar', icon: 'calendar_today' },
    ...extraViews.map(v => ({ id: v.id, label: v.label, icon: 'extension' }))
  ];

  return (
    <div className="flex items-center border-b border-zinc-100 bg-white px-8 font-sans shrink-0 gap-1 select-none antialiased">
      {views.map((view) => {
        const isActive = activeView === view.id;
        return (
          <button
            key={view.id}
            onClick={() => onViewChange(view.id)}
            className={`
              flex items-center gap-2.5 px-4 py-3.5 text-[13px] font-bold transition-all relative group
              ${isActive 
                ? 'text-primary' 
                : 'text-zinc-400 hover:text-zinc-600 hover:bg-zinc-50/50'}
            `}
          >
            <span className={`material-symbols-outlined text-[18px] transition-transform ${isActive ? 'scale-110 font-bold' : 'scale-100 group-hover:scale-105 opacity-60'}`}>{view.icon}</span>
            <span className={`tracking-tight ${isActive ? 'font-black' : 'font-bold'}`}>{view.label}</span>
            
            {isActive && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-t-full shadow-[0_-2px_6px_rgba(0,88,190,0.2)]" />
            )}
            
            {!isActive && (
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-0.5 bg-zinc-200 transition-all group-hover:w-full group-hover:bg-zinc-300 rounded-t-full" />
            )}
          </button>
        );
      })}
    </div>
  );
}
