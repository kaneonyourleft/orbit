import React from 'react';

interface TopNavBarProps {
  workspaceName?: string;
  tableName?: string;
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

/**
 * Clean Canvas Top Navigation Bar for ORBIT Workspace OS.
 */
export function TopNavBar({ 
  workspaceName = 'Workspace', 
  tableName = 'Product Roadmap 2026',
  searchQuery,
  onSearchChange
}: TopNavBarProps) {
  return (
    <header className="sticky top-0 w-full z-50 flex items-center justify-between px-4 h-14 bg-white border-b border-zinc-200 shadow-sm font-sans text-sm antialiased transition-colors">
      <div className="flex items-center gap-6">
        <div className="text-lg font-semibold text-zinc-900 flex items-center gap-2">
          <span className="bg-[#D6E3FF] text-[#001B3E] p-1.5 rounded-lg flex items-center justify-center">
            <span className="material-symbols-outlined text-base">rocket_launch</span>
          </span>
          <span className="tracking-tight">Workspace OS</span>
        </div>
        <nav className="hidden md:flex items-center gap-4">
          <div className="flex items-center gap-1.5 text-zinc-400 text-xs font-medium uppercase tracking-wider">
            <span>Workspaces</span>
            <span className="material-symbols-outlined text-[10px] scale-125">chevron_right</span>
            <span className="text-primary font-bold">{tableName}</span>
          </div>
        </nav>
      </div>

      <div className="flex-1 max-w-xl px-8 ml-auto mr-auto">
        <div className="relative flex items-center group">
          <span className="absolute left-3 text-zinc-400 material-symbols-outlined text-lg group-focus-within:text-primary transition-colors">search</span>
          <input 
            className="w-full bg-zinc-50 border border-zinc-200 rounded-lg pl-10 pr-4 py-1.5 text-xs focus:bg-white focus:ring-1 focus:ring-primary focus:border-primary transition-all outline-none text-zinc-700" 
            placeholder="Search or type a command..." 
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
          />
          <div className="absolute right-3 hidden group-focus-within:flex items-center gap-1 bg-white border border-zinc-200 px-1.5 py-0.5 rounded shadow-sm text-[10px] text-zinc-400 font-bold">
            <span className="text-[9px]">CMD</span><span>K</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5 bg-[#AFEFCB]/30 text-[#002113] px-2.5 py-1 rounded-full text-[10px] font-bold border border-[#AFEFCB]/50 transition-all hover:bg-[#AFEFCB]/40">
          <span className="w-1.5 h-1.5 rounded-full bg-[#006C49] animate-[pulse_1.5s_infinite]"></span>
          LIVE SYNC
        </div>
        <div className="flex items-center gap-1 pr-3 border-r border-zinc-100">
          <button className="p-2 text-zinc-400 hover:text-zinc-600 hover:bg-zinc-50 transition-colors cursor-pointer rounded-md" title="Notifications">
            <span className="material-symbols-outlined text-[22px]">notifications</span>
          </button>
          <button className="p-2 text-zinc-400 hover:text-zinc-600 hover:bg-zinc-50 transition-colors cursor-pointer rounded-md" title="Help">
            <span className="material-symbols-outlined text-[22px]">help</span>
          </button>
        </div>
        <div className="flex items-center gap-2">
          <button className="px-3 py-1.5 text-[13px] font-bold text-zinc-500 hover:text-zinc-800 transition-colors">Share</button>
          <button className="px-3 py-1.5 text-[13px] font-bold bg-primary text-white rounded-lg shadow-sm hover:opacity-90 active:scale-95 transition-all">Invite</button>
        </div>
        <div className="w-8 h-8 rounded-full bg-zinc-100 border border-zinc-200 shadow-sm overflow-hidden ml-1 cursor-pointer hover:border-primary transition-colors">
          <div className="w-full h-full flex items-center justify-center text-zinc-600 font-extrabold text-[11px]">
            KO
          </div>
        </div>
      </div>
    </header>
  );
}
