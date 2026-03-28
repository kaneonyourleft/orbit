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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newWorkspaceName.trim()) {
      onCreateWorkspace(newWorkspaceName);
      setNewWorkspaceName('');
      setIsModalOpen(false);
    }
  };

  return (
    <aside className="w-64 h-full bg-[#F7F7F5] border-r border-zinc-200 flex flex-col font-sans text-zinc-800 shrink-0">
      {/* Top Header */}
      <div className="p-4 flex items-center space-x-2">
        <div className="w-6 h-6 rounded bg-[#0058BE] flex items-center justify-center">
          <span className="material-symbols-outlined text-white text-[16px]">orbit</span>
        </div>
        <span className="font-bold text-sm tracking-tight text-zinc-800">ORBIT</span>
        <span className="text-[10px] text-zinc-400 font-bold bg-zinc-100 px-1.5 py-0.5 rounded ml-1">Workspace OS</span>
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 overflow-y-auto py-2">
        <div className="px-3 space-y-0.5">
          <a href="/" className="flex items-center space-x-2 px-2 py-1.5 rounded-md text-sm font-medium hover:bg-zinc-200/50 text-zinc-700 transition-colors">
            <span className="material-symbols-outlined text-[18px]">home</span>
            <span>Home</span>
          </a>
          <a href="/tasks" className="flex items-center space-x-2 px-2 py-1.5 rounded-md text-sm font-medium hover:bg-zinc-200/50 text-zinc-700 transition-colors">
            <span className="material-symbols-outlined text-[18px]">check_circle</span>
            <span>My Tasks</span>
          </a>
        </div>

        {/* Workspaces Section */}
        <div className="mt-6">
          <div className="px-5 mb-1 flex items-center justify-between group">
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Workspaces</span>
            <button 
              onClick={() => setIsModalOpen(true)}
              className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 hover:bg-zinc-200 rounded"
              title="Add Workspace"
            >
              <span className="material-symbols-outlined text-[14px]">add</span>
            </button>
          </div>
          
          <ul className="space-y-0.5">
            {workspaces.map((ws, idx) => (
              <li key={ws.id}>
                <div className={`group flex flex-col ${idx === 0 ? 'bg-white border-l-2 border-[#0058BE]' : ''}`}>
                  <button className={`flex items-center w-full px-5 py-1.5 text-sm font-medium transition-colors ${idx === 0 ? 'text-[#0058BE]' : 'text-zinc-600 hover:bg-zinc-200/50'}`}>
                    <span className="material-symbols-outlined text-[16px] mr-2">folder</span>
                    <span className="flex-1 text-left truncate">{ws.name}</span>
                    <span className="material-symbols-outlined text-[14px] opacity-0 group-hover:opacity-100">chevron_right</span>
                  </button>
                  
                  {/* Nested Tables - Mocked as per request */}
                  {idx === 0 && (
                    <ul className="pl-9 pr-2 py-1 space-y-0.5 bg-white">
                      <li>
                        <a href="#" className="block px-2 py-1 text-xs text-[#0058BE] bg-blue-50/50 font-medium rounded transition-colors border-l border-[#0058BE]">
                          Product Roadmap 2026
                        </a>
                      </li>
                      <li>
                        <a href="#" className="block px-2 py-1 text-xs text-zinc-500 hover:bg-zinc-100 rounded transition-colors border-l border-transparent">
                          Backlog Refinement
                        </a>
                      </li>
                    </ul>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      </nav>

      {/* Bottom Actions */}
      <div className="p-3 border-t border-zinc-200 bg-white">
        <a href="#" className="flex items-center space-x-2 px-2 py-1.5 rounded-md text-sm font-medium hover:bg-zinc-100 text-zinc-600 transition-colors">
          <span className="material-symbols-outlined text-[18px]">settings</span>
          <span>Settings</span>
        </a>
        <a href="#" className="flex items-center space-x-2 px-2 py-1.5 rounded-md text-sm font-medium hover:bg-zinc-100 text-zinc-600 transition-colors">
          <span className="material-symbols-outlined text-[18px]">help</span>
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
