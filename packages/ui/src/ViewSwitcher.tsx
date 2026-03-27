import React from 'react';

export type ViewType = 'Table' | 'Kanban' | 'Calendar';

interface ViewSwitcherProps {
  activeView: ViewType;
  onViewChange: (view: ViewType) => void;
}

/**
 * Tab bar for switching between different database views.
 */
export function ViewSwitcher({ activeView, onViewChange, extraViews = [] }: ViewSwitcherProps & { extraViews?: { id: string, label: string }[] }) {
  const views: (ViewType | string)[] = ['Table', 'Kanban', 'Calendar', ...extraViews.map(v => v.id)];

  return (
    <div className="flex items-center space-x-1 border-b border-zinc-800/50 mb-6">
      {views.map((view) => {
        const label = extraViews.find(ev => ev.id === view)?.label || view;
        return (
          <button
            key={view}
            onClick={() => onViewChange(view as any)}
            className={`
              px-4 py-2 text-sm font-medium transition-all relative
              ${activeView === view 
                ? 'text-blue-400' 
                : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/30'}
            `}
          >
            {label}
            {activeView === view && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 shadow-[0_0_8px_rgba(37,99,235,0.5)]" />
            )}
          </button>
        );
      })}
    </div>
  );
}
