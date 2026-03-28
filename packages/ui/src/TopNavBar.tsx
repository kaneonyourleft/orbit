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
    <header className="h-14 border-b border-zinc-200 bg-white flex items-center px-4 sticky top-0 z-30 shrink-0 justify-between shadow-sm font-sans">
      {/* Left: Breadcrumbs */}
      <div className="flex items-center space-x-3 text-sm">
        <div className="flex items-center space-x-2">
          <div className="w-6 h-6 rounded bg-[#0058BE] flex items-center justify-center">
            <span className="material-symbols-outlined text-white text-[16px]">orbit</span>
          </div>
          <span className="font-bold text-zinc-800 text-xs">ORBIT</span>
        </div>
        
        <span className="text-zinc-300">/</span>
        
        <div className="flex items-center space-x-1 text-zinc-500 font-medium">
          <span className="hover:text-zinc-800 cursor-pointer transition-colors text-xs">{workspaceName}</span>
          <span className="material-symbols-outlined text-[14px]">chevron_right</span>
          <span className="text-zinc-800 font-bold text-xs">{tableName}</span>
        </div>
      </div>

      {/* Center: Search */}
      <div className="flex-1 max-w-md px-8">
        <div className="relative group">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-[#0058BE] transition-colors text-[18px]">search</span>
          <input 
            type="text"
            placeholder="Search tasks, docs..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full bg-zinc-100 border border-transparent focus:bg-white focus:border-[#0058BE] focus:ring-4 focus:ring-blue-500/10 rounded-lg py-1.5 pl-10 pr-12 text-sm outline-none transition-all placeholder:text-zinc-400"
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center space-x-0.5">
            <kbd className="px-1.5 py-0.5 bg-white border border-zinc-200 rounded text-[10px] font-bold text-zinc-400">CMD</kbd>
            <kbd className="px-1.5 py-0.5 bg-white border border-zinc-200 rounded text-[10px] font-bold text-zinc-400">K</kbd>
          </div>
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-1.5 px-2 py-1 bg-emerald-50 rounded-full border border-emerald-100">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-tighter">Live Sync</span>
        </div>

        <div className="flex items-center space-x-2 border-r border-zinc-200 pr-4">
          <button className="p-1.5 hover:bg-zinc-100 rounded-lg text-zinc-500 transition-colors relative">
            <span className="material-symbols-outlined text-[20px]">notifications</span>
            <div className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full border-2 border-white" />
          </button>
          <button className="p-1.5 hover:bg-zinc-100 rounded-lg text-zinc-500 transition-colors">
            <span className="material-symbols-outlined text-[20px]">help</span>
          </button>
        </div>

        <div className="flex items-center space-x-2">
          <button className="px-3 py-1.5 text-xs font-bold text-zinc-600 hover:bg-zinc-100 rounded-lg transition-colors border border-zinc-200">Share</button>
          <button className="px-3 py-1.5 text-xs font-bold text-white bg-[#0058BE] hover:bg-blue-700 rounded-lg transition-colors shadow-lg shadow-blue-500/20">Invite</button>
        </div>

        <div className="w-8 h-8 rounded-full bg-zinc-200 border-2 border-white shadow-sm overflow-hidden cursor-pointer hover:border-[#0058BE] transition-all">
          <div className="w-full h-full flex items-center justify-center bg-zinc-300 text-zinc-600 font-bold text-xs uppercase">
            KO
          </div>
        </div>
      </div>
    </header>
  );
}
