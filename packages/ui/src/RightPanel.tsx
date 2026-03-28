import React, { useEffect, useRef } from 'react';

interface RightPanelProps {
  totalRows?: number;
  completedRows?: number;
}

/**
 * Clean Canvas Right Panel for ORBIT Workspace OS.
 */
export function RightPanel() {
  const progressBarRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (progressBarRef.current) {
      progressBarRef.current.style.width = '84%';
    }
  }, []);

  return (
    <aside className="fixed right-0 top-14 bottom-0 flex flex-col w-72 bg-white dark:bg-zinc-950 border-l border-zinc-200 dark:border-zinc-800 z-40 transition-opacity duration-200 shadow-sm font-sans">
      <div className="px-4 py-4 border-b border-zinc-100 dark:border-zinc-900 flex items-center justify-between">
        <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Plugins</span>
        <button className="text-zinc-400 hover:text-zinc-600 transition-colors">
          <span className="material-symbols-outlined text-sm">settings</span>
        </button>
      </div>

      <div className="p-4 flex flex-col gap-6 overflow-y-auto hide-scrollbar">
        {/* Row Statistics Section */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-base">analytics</span>
            <h3 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">Row Statistics</h3>
          </div>
          <div className="bg-zinc-50 dark:bg-zinc-900 rounded-lg p-4 space-y-4 border border-zinc-100 dark:border-zinc-800">
            <div className="space-y-1">
              <div className="flex justify-between text-xs font-medium">
                <span className="text-zinc-500">Resource Utilization</span>
                <span className="text-zinc-900 dark:text-zinc-100 font-bold">84%</span>
              </div>
              <div className="w-full bg-zinc-200 dark:bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                <div 
                  ref={progressBarRef}
                  className="bg-primary h-full rounded-full transition-all duration-1000 ease-out"
                ></div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col">
                <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-tight">Open Tasks</span>
                <span className="text-lg font-bold text-zinc-800 dark:text-zinc-100">12</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-tight">Efficiency</span>
                <span className="text-lg font-bold text-emerald-600">92%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Status Library Section */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-base">library_books</span>
            <h3 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">Status Library</h3>
          </div>
          <div className="flex flex-col gap-2">
            {[
              { color: 'bg-blue-600', label: 'In Progress' },
              { color: 'bg-zinc-400', label: 'Planned' },
              { color: 'bg-red-600', label: 'Stuck' },
              { color: 'bg-emerald-600', label: 'Completed' },
            ].map((status) => (
              <div 
                key={status.label}
                className="flex items-center justify-between p-2 hover:bg-zinc-50 dark:hover:bg-zinc-900 rounded-md group cursor-pointer border border-transparent hover:border-zinc-200 dark:hover:border-zinc-800 transition-all font-sans"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${status.color}`}></div>
                  <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300">{status.label}</span>
                </div>
                <span className="material-symbols-outlined text-xs text-zinc-300 group-hover:text-zinc-500">settings</span>
              </div>
            ))}
          </div>
          <button className="w-full py-2 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-md text-[11px] font-bold text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-900 hover:text-zinc-500 transition-all">
            + ADD STATUS TYPE
          </button>
        </div>
      </div>

      {/* Footer for Plugin Panel */}
      <div className="mt-auto p-4 border-t border-zinc-100 dark:border-zinc-900 bg-zinc-50/50 dark:bg-zinc-900/50">
        <div className="flex items-center justify-between text-[11px] font-medium text-zinc-500">
          <span className="flex items-center gap-1 hover:text-zinc-800 cursor-pointer transition-colors">
            <span className="material-symbols-outlined text-sm">history</span> History
          </span>
          <span className="flex items-center gap-1 hover:text-zinc-800 cursor-pointer transition-colors">
            <span className="material-symbols-outlined text-sm">bolt</span> Automations
          </span>
        </div>
      </div>
    </aside>
  );
}
  );
}
