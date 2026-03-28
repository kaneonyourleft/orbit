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
    <header className="sticky top-0 w-full z-50 flex items-center justify-between px-4 h-14 bg-white dark:bg-zinc-950 border-b border-zinc-200 dark:border-zinc-800 shadow-sm font-sans text-sm antialiased transition-colors">
      <div className="flex items-center gap-6">
        <div className="text-lg font-semibold text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
          <span className="bg-primary-container text-on-primary-container p-1 rounded-lg">
            <span className="material-symbols-outlined text-base">rocket_launch</span>
          </span>
          ORBIT
        </div>
        <nav className="hidden md:flex items-center gap-4">
          <div className="flex items-center gap-1 text-zinc-500 text-xs">
            <span>Workspaces</span>
            <span className="material-symbols-outlined text-xs">chevron_right</span>
            <span className="text-blue-600 dark:text-blue-400 font-medium">{tableName}</span>
          </div>
        </nav>
      </div>

      <div className="flex-1 max-w-xl px-8">
        <div className="relative flex items-center group">
          <span className="absolute left-3 text-zinc-400 material-symbols-outlined text-lg group-focus-within:text-primary transition-colors">search</span>
          <input 
            className="w-full bg-zinc-100 dark:bg-zinc-900 border-none rounded-lg pl-10 pr-4 py-1.5 text-xs focus:ring-1 focus:ring-primary transition-all outline-none" 
            placeholder="Search or type a command..." 
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
          />
          <div className="absolute right-3 hidden group-focus-within:flex items-center gap-1 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 px-1 rounded shadow-sm text-[10px] text-zinc-400">
            <span>CMD</span><span>K</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1 bg-secondary-container/20 text-on-secondary-container px-2 py-1 rounded-full text-[10px] font-semibold border border-secondary-container/30">
          <span className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse"></span>
          LIVE SYNC
        </div>
        <div className="flex items-center gap-2 pr-4 border-r border-zinc-200 dark:border-zinc-800">
          <button className="p-2 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer active:scale-95 rounded-md">
            <span className="material-symbols-outlined">notifications</span>
          </button>
          <button className="p-2 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer active:scale-95 rounded-md">
            <span className="material-symbols-outlined">help</span>
          </button>
        </div>
        <div className="flex items-center gap-2 ml-2">
          <button className="px-3 py-1.5 text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-md transition-colors">Share</button>
          <button className="px-3 py-1.5 text-xs font-medium bg-primary text-on-primary rounded-md shadow-sm hover:opacity-90 active:scale-95 transition-all">Invite</button>
        </div>
        <div className="w-8 h-8 rounded-full bg-zinc-200 dark:bg-zinc-800 border-2 border-white dark:border-zinc-700 shadow-sm overflow-hidden ml-2">
          <div className="w-full h-full flex items-center justify-center text-zinc-600 dark:text-zinc-400 font-bold text-xs">
            KO
          </div>
        </div>
      </div>
    </header>
  );
}
