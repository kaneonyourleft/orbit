import React from 'react';
import { Modal } from './Modal';

/**
 * Clean Canvas Sidebar for ORBIT Workspace OS.
 */
export function Sidebar({ 
  workspaces, 
  onCreateWorkspace 
}: { 
  workspaces: { id: string; name: string }[], 
  onCreateWorkspace: (name: string) => void 
}) {
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [newWorkspaceName, setNewWorkspaceName] = React.useState('');
  const [expandedFolder, setExpandedFolder] = React.useState<string | null>('Product Management');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newWorkspaceName.trim()) {
      onCreateWorkspace(newWorkspaceName);
      setNewWorkspaceName('');
      setIsModalOpen(false);
    }
  };

  return (
    <aside className="fixed left-0 top-14 bottom-0 flex flex-col w-64 p-4 gap-2 bg-zinc-50 dark:bg-zinc-900/50 border-r border-zinc-200 dark:border-zinc-800 transition-all duration-150 ease-in-out z-40">
      {/* Profile Header */}
      <div className="flex items-center gap-3 mb-6 px-1">
        <div className="w-8 h-8 rounded-lg bg-primary-container flex items-center justify-center overflow-hidden shadow-sm">
          <span className="material-symbols-outlined text-on-primary-container text-xl">rocket_launch</span>
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-bold text-zinc-800 dark:text-zinc-200">Acme Corp</span>
          <span className="text-[10px] text-zinc-400 uppercase tracking-widest font-bold">Enterprise Plan</span>
        </div>
        <button className="ml-auto text-zinc-400">
          <span className="material-symbols-outlined text-sm">unfold_more</span>
        </button>
      </div>

      <nav className="flex flex-col gap-1 overflow-y-auto hide-scrollbar">
        <a className="flex items-center gap-3 px-3 py-2 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200/50 dark:hover:bg-zinc-800 rounded-md text-xs font-medium uppercase tracking-wider" href="/">
          <span className="material-symbols-outlined text-lg">home</span>
          <span>Home</span>
        </a>
        <a className="flex items-center gap-3 px-3 py-2 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200/50 dark:hover:bg-zinc-800 rounded-md text-xs font-medium uppercase tracking-wider" href="/tasks">
          <span className="material-symbols-outlined text-lg">check_circle</span>
          <span>My Tasks</span>
        </a>

        <div className="mt-4">
          <div className="flex items-center justify-between px-3 py-2 text-xs font-bold text-zinc-400 uppercase tracking-widest mb-1">
            <span>Workspaces</span>
            <span 
              className="material-symbols-outlined text-sm cursor-pointer hover:text-primary transition-colors"
              onClick={() => setIsModalOpen(true)}
            >
              add
            </span>
          </div>

          <div className="space-y-0.5">
            {workspaces.map((ws) => (
              <div key={ws.id} className="space-y-0.5">
                <div 
                  className={`flex items-center gap-2 px-3 py-2 rounded-md transition-all cursor-pointer group ${
                    expandedFolder === ws.name 
                      ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 border-r-2 border-blue-600' 
                      : 'text-zinc-500 hover:bg-zinc-200/50'
                  }`}
                  onClick={() => setExpandedFolder(expandedFolder === ws.name ? null : ws.name)}
                >
                  <span className={`material-symbols-outlined text-sm transition-transform ${expandedFolder === ws.name ? 'rotate-0' : '-rotate-90'}`}>
                    keyboard_arrow_down
                  </span>
                  <span className="material-symbols-outlined text-lg">
                    {expandedFolder === ws.name ? 'folder_open' : 'folder'}
                  </span>
                  <span className="flex-1 text-[11px] font-bold">{ws.name}</span>
                  <span className="material-symbols-outlined text-xs hidden group-hover:block opacity-60">more_horiz</span>
                </div>

                {expandedFolder === ws.name && (
                  <div className="pl-8 flex flex-col gap-0.5">
                    <a className="flex items-center gap-2 px-3 py-1.5 text-blue-600 font-semibold bg-blue-100/50 rounded text-[11px] group" href="#">
                      <span className="material-symbols-outlined text-base">table_chart</span>
                      <span className="flex-1">Product Roadmap 2026</span>
                      <span className="material-symbols-outlined text-[10px] hidden group-hover:block opacity-60">edit</span>
                    </a>
                    <a className="flex items-center gap-2 px-3 py-1.5 text-zinc-500 hover:bg-zinc-200/50 rounded text-[11px] group" href="#">
                      <span className="material-symbols-outlined text-base">table_chart</span>
                      <span className="flex-1">Backlog Refinement</span>
                      <span className="material-symbols-outlined text-[10px] hidden group-hover:block opacity-60 text-zinc-400">delete</span>
                    </a>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <a className="flex items-center gap-3 px-3 py-2 mt-2 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200/50 dark:hover:bg-zinc-800 rounded-md text-xs font-medium uppercase tracking-wider" href="/inbox">
          <span className="material-symbols-outlined text-lg">inbox</span>
          <span>Inbox</span>
        </a>
      </nav>

      <div className="mt-auto pt-4 border-t border-zinc-200 dark:border-zinc-800 flex flex-col gap-1">
        <a className="flex items-center gap-3 px-3 py-2 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200/50 dark:hover:bg-zinc-800 rounded-md text-xs font-medium uppercase tracking-wider" href="/settings">
          <span className="material-symbols-outlined text-lg">settings</span>
          <span>Settings</span>
        </a>
        <a className="flex items-center gap-3 px-3 py-2 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200/50 dark:hover:bg-zinc-800 rounded-md text-xs font-medium uppercase tracking-wider" href="/support">
          <span className="material-symbols-outlined text-lg">contact_support</span>
          <span>Support</span>
        </a>
      </div>

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title="Create Workspace"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="ws-name" className="block text-xs font-semibold text-zinc-400 uppercase mb-2">Workspace Name</label>
            <input
              id="ws-name"
              autoFocus
              className="w-full bg-white text-zinc-800 text-sm px-3 py-2 rounded border border-zinc-200 focus:border-[#0058BE] outline-none placeholder:text-zinc-300 transition-all font-sans"
              placeholder="e.g. Design Team, Q1 Roadmap..."
              value={newWorkspaceName}
              onChange={(e) => setNewWorkspaceName(e.target.value)}
            />
          </div>
          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={!newWorkspaceName.trim()}
              className="px-4 py-2 bg-[#0058BE] hover:bg-blue-700 text-white text-sm font-semibold rounded transition-all disabled:opacity-50"
            >
              Create
            </button>
          </div>
        </form>
      </Modal>
    </aside>
  );
}
