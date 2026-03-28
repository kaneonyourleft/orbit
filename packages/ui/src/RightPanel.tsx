import React from 'react';

interface RightPanelProps {
  totalRows?: number;
  completedRows?: number;
  menuItems?: { label: string; onClick: () => void; icon?: string }[];
}

/**
 * Clean Canvas Right Panel for ORBIT Workspace OS.
 * Notion-style white theme with plugin modules and dynamic menu items.
 */
export function RightPanel({ totalRows = 24, completedRows = 12, menuItems = [] }: RightPanelProps) {
  const utilization = Math.round((completedRows / totalRows) * 100) || 0;
  
  return (
    <aside className="flex flex-col w-full h-full bg-white border-l border-zinc-100 shadow-sm font-sans antialiased overflow-y-auto hide-scrollbar">
      {/* Header */}
      <div className="px-5 py-4 border-b border-zinc-50 flex items-center justify-between bg-zinc-50/20">
        <span className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] select-none">Project Dashboard</span>
        <button className="text-zinc-300 hover:text-zinc-600 transition-colors p-1 hover:bg-zinc-50 rounded">
          <span className="material-symbols-outlined text-[18px]">settings</span>
        </button>
      </div>

      <div className="flex-1 p-5 flex flex-col gap-8 overflow-y-auto hide-scrollbar">
        {/* Row Statistics Module */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 group cursor-pointer">
            <span className="material-symbols-outlined text-primary text-[20px] font-bold">analytics</span>
            <h3 className="text-[13px] font-extrabold text-zinc-800 tracking-tight">Row Statistics</h3>
          </div>
          <div className="bg-zinc-50 border border-zinc-100 rounded-xl p-4 space-y-4 shadow-sm group hover:border-blue-100 transition-all">
            <div className="space-y-2">
              <div className="flex justify-between items-end">
                <span className="text-[11px] font-black text-zinc-400 uppercase tracking-tighter">Utilization</span>
                <span className="text-xs font-black text-primary leading-none">{utilization}%</span>
              </div>
              <div className="w-full bg-zinc-200 h-1.5 rounded-full overflow-hidden shadow-inner border border-zinc-300/10">
                <div 
                  className="bg-primary h-full rounded-full transition-all duration-1000 ease-out shadow-[0_0_8px_rgba(0,88,190,0.2)]"
                  style={{ width: `${utilization}%` }}
                ></div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 pt-1">
              <div className="flex flex-col">
                <span className="text-[9px] text-zinc-400 font-black uppercase tracking-widest leading-loose">Open</span>
                <span className="text-lg font-black text-zinc-800 tracking-tighter leading-none">{Math.max(0, totalRows - completedRows)}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[9px] text-zinc-400 font-black uppercase tracking-widest leading-loose">Eff.</span>
                <span className="text-lg font-black text-[#006C49] tracking-tighter leading-none">{utilization}%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Plugin Actions (BUG 4 Fix) */}
        {menuItems.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-[20px] font-bold">apps</span>
              <h3 className="text-[13px] font-extrabold text-zinc-800 tracking-tight">Plugin Actions</h3>
            </div>
            <div className="flex flex-col gap-2">
              {menuItems.map((item, idx) => (
                <button 
                  key={idx} 
                  onClick={item.onClick}
                  className="flex items-center gap-3 w-full p-2.5 bg-white border border-zinc-200 rounded-xl text-xs font-bold text-zinc-600 hover:border-primary/30 hover:text-primary hover:shadow-sm transition-all text-left"
                >
                  <span className="material-symbols-outlined text-zinc-400 group-hover:text-primary">{item.icon || 'play_circle'}</span>
                  <span className="flex-1">{item.label}</span>
                  <span className="material-symbols-outlined text-[16px] opacity-0 group-hover:opacity-100 transition-opacity">chevron_right</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Status Library Module */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 group cursor-pointer">
            <span className="material-symbols-outlined text-primary text-[20px] font-bold">potted_plant</span>
            <h3 className="text-[13px] font-extrabold text-zinc-800 tracking-tight">Status Library</h3>
          </div>
          <div className="flex flex-col gap-1.5">
            {[
              { color: 'bg-[#0058BE]', label: 'In Progress' },
              { color: 'bg-zinc-200', label: 'Planned' },
              { color: 'bg-red-500', label: 'Stuck' },
              { color: 'bg-[#006C49]', label: 'Completed' },
            ].map((status) => (
              <div 
                key={status.label}
                className="flex items-center justify-between p-2.5 hover:bg-zinc-50 rounded-xl group cursor-pointer border border-transparent hover:border-zinc-100 hover:shadow-sm transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${status.color} shadow-sm ring-2 ring-white`}></div>
                  <span className="text-[12px] font-bold text-zinc-600 transition-colors group-hover:text-zinc-900">{status.label}</span>
                </div>
                <button className="material-symbols-outlined text-[16px] text-zinc-200 group-hover:text-zinc-400 hover:text-zinc-600 transition-colors">edit_note</button>
              </div>
            ))}
          </div>
          <button className="w-full py-4 border-2 border-dashed border-zinc-100 rounded-2xl text-[10px] font-black tracking-[0.2em] text-zinc-300 hover:bg-zinc-50 hover:border-primary/20 hover:text-primary transition-all uppercase select-none">
            + New Status
          </button>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="mt-auto p-5 border-t border-zinc-50 bg-zinc-50/20">
        <div className="flex items-center justify-between gap-4">
          <button className="flex-1 flex items-center justify-center gap-2 py-2.5 px-3 bg-white border border-zinc-200 rounded-xl text-[10px] font-black uppercase tracking-widest text-zinc-400 hover:text-zinc-800 hover:shadow-sm transition-all active:scale-95 shadow-sm">
            <span className="material-symbols-outlined text-base font-black">history</span>
            History
          </button>
          <button className="flex-1 flex items-center justify-center gap-2 py-2.5 px-3 bg-white border border-zinc-200 rounded-xl text-[10px] font-black uppercase tracking-widest text-zinc-400 hover:text-primary hover:shadow-sm transition-all active:scale-95 shadow-sm">
            <span className="material-symbols-outlined text-base font-black text-primary">bolt</span>
            Flow
          </button>
        </div>
      </div>
    </aside>
  );
}
