import React, { useEffect, useRef } from 'react';

interface RightPanelProps {
  totalRows?: number;
  completedRows?: number;
}

/**
 * Clean Canvas Right Panel for ORBIT Workspace OS.
 */
export function RightPanel({ totalRows = 24, completedRows = 12 }: RightPanelProps) {
  const utilization = Math.round((completedRows / totalRows) * 100) || 0;
  const progressBarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (progressBarRef.current) {
      progressBarRef.current.style.width = `${utilization}%`;
    }
  }, [utilization]);

  return (
    <aside className="w-72 h-full bg-white border-l border-zinc-200 flex flex-col font-sans shrink-0 overflow-y-auto">
      <div className="p-4 border-b border-zinc-100 flex items-center justify-between">
        <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest flex items-center space-x-2">
          <span className="material-symbols-outlined text-[14px]">extension</span>
          <span>Plugins</span>
        </span>
        <button className="p-1 hover:bg-zinc-100 rounded transition-colors text-zinc-400">
          <span className="material-symbols-outlined text-[16px]">expand_less</span>
        </button>
      </div>

      <div className="p-5 space-y-6 flex-1">
        {/* Row Statistics */}
        <section className="space-y-4">
          <h3 className="text-xs font-bold text-zinc-800 flex items-center space-x-2">
            <span className="material-symbols-outlined text-[16px] text-[#0058BE]">monitoring</span>
            <span>Row Statistics</span>
          </h3>
          
          <div className="space-y-3">
             <div className="space-y-1.5">
               <div className="flex items-center justify-between text-[11px] font-bold">
                 <span className="text-zinc-500">Resource Utilization</span>
                 <span className="text-[#0058BE]">{utilization}%</span>
               </div>
               <div className="w-full h-1.5 bg-zinc-100 rounded-full overflow-hidden">
                 <div 
                   ref={progressBarRef}
                   className="h-full bg-[#0058BE] rounded-full transition-all duration-1000" 
                 />
               </div>
             </div>

             <div className="grid grid-cols-2 gap-3">
               <div className="bg-[#F7F7F5] p-3 rounded-lg border border-zinc-200/50">
                 <span className="text-[10px] font-bold text-zinc-400 uppercase block mb-1">Open</span>
                 <span className="text-xl font-bold text-zinc-800">{totalRows - completedRows}</span>
               </div>
               <div className="bg-[#F7F7F5] p-3 rounded-lg border border-zinc-200/50">
                 <span className="text-[10px] font-bold text-zinc-400 uppercase block mb-1">Efficiency</span>
                 <span className="text-xl font-bold text-emerald-600">92%</span>
               </div>
             </div>
          </div>
        </section>

        {/* Status Library */}
        <section className="space-y-4">
          <h3 className="text-xs font-bold text-zinc-800 flex items-center space-x-2">
            <span className="material-symbols-outlined text-[16px] text-zinc-400 font-bold">palette</span>
            <span>Status Library</span>
          </h3>
          
          <div className="space-y-1">
            {[
              { name: 'In Progress', color: 'bg-blue-500' },
              { name: 'Planned', color: 'bg-zinc-400' },
              { name: 'Stuck', color: 'bg-red-500' },
              { name: 'Completed', color: 'bg-emerald-500' }
            ].map((status, idx) => (
              <div key={idx} className="group flex items-center justify-between px-2 py-1.5 hover:bg-zinc-100 rounded-md cursor-pointer transition-colors">
                <div className="flex items-center space-x-2">
                  <div className={`w-1.5 h-1.5 rounded-full ${status.color}`} />
                  <span className="text-[11px] font-medium text-zinc-700">{status.name}</span>
                </div>
                <button className="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-white rounded text-zinc-400 transition-opacity shadow-sm border border-transparent hover:border-zinc-200">
                  <span className="material-symbols-outlined text-[14px]">settings</span>
                </button>
              </div>
            ))}
            
            <button className="w-full mt-2 border border-dashed border-zinc-200 hover:border-[#0058BE] rounded-md py-2 text-[10px] font-bold text-zinc-400 hover:text-[#0058BE] transition-all flex items-center justify-center space-x-1.5 active:bg-blue-50/20">
              <span className="material-symbols-outlined text-[14px]">add</span>
              <span>ADD STATUS TYPE</span>
            </button>
          </div>
        </section>
      </div>

      {/* Footer Links */}
      <div className="p-4 border-t border-zinc-100 bg-[#F7F7F5]/50">
        <div className="flex items-center justify-between text-[11px] font-bold text-zinc-400 px-2 uppercase tracking-widest">
          <a href="#" className="hover:text-zinc-800 transition-colors flex items-center space-x-1">
            <span className="material-symbols-outlined text-[14px]">history</span>
            <span>History</span>
          </a>
          <a href="#" className="hover:text-zinc-800 transition-colors flex items-center space-x-1">
            <span className="material-symbols-outlined text-[14px]">auto_fix</span>
            <span>Automations</span>
          </a>
        </div>
      </div>
    </aside>
  );
}
