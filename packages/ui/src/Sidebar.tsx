import React from 'react';
import { Modal } from './Modal';

/**
 * Navigation sidebar for ORBIT Application.
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
    <div className="w-64 h-full bg-zinc-900 border-r border-zinc-800 flex flex-col p-4 space-y-6">
      <div className="flex items-center space-x-2">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-500 to-emerald-500 flex items-center justify-center font-bold text-white">
          O
        </div>
        <span className="text-xl font-bold tracking-tight text-zinc-100">ORBIT</span>
      </div>

      <nav className="flex-1 space-y-1">
        <div className="px-2 py-3">
          <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-widest px-2 pb-2">
            Workspaces
          </h3>
          <ul className="space-y-1">
            {workspaces.map((ws) => (
              <li key={ws.id}>
                <a
                  href={`/workspace/${ws.id}`}
                  className="block px-3 py-2 text-sm font-medium text-zinc-300 rounded-md hover:bg-zinc-800 hover:text-white transition-colors"
                >
                  {ws.name}
                </a>
              </li>
            ))}
            <li>
              <button 
                onClick={() => setIsModalOpen(true)}
                className="w-full flex items-center px-3 py-2 text-sm font-medium text-zinc-500 rounded-md hover:bg-zinc-800 hover:text-zinc-300 transition-colors"
                aria-label="Create New Workspace"
              >
                <span className="mr-2 text-lg">+</span>
                Create New
              </button>
            </li>
          </ul>
        </div>
      </nav>

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title="Create Workspace"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="ws-name" className="block text-xs font-medium text-zinc-500 uppercase mb-2">Workspace Name</label>
            <input
              id="ws-name"
              autoFocus
              className="w-full bg-zinc-800 text-white text-sm px-3 py-2.5 rounded-xl border border-zinc-700 focus:border-blue-500 outline-none placeholder:text-zinc-600 transition-all shadow-inner"
              placeholder="e.g. Design Team, Q1 Roadmap..."
              value={newWorkspaceName}
              onChange={(e) => setNewWorkspaceName(e.target.value)}
              onKeyDown={(e) => e.key === 'Escape' && setIsModalOpen(false)}
            />
          </div>
          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={!newWorkspaceName.trim()}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-xl transition-all shadow-xl shadow-blue-500/10 active:scale-95 disabled:opacity-50 disabled:active:scale-100"
            >
              Create Workspace
            </button>
          </div>
        </form>
      </Modal>

      <div className="pt-4 border-t border-zinc-800">
        <button className="flex items-center space-x-3 px-3 py-2 w-full text-zinc-400 hover:text-white transition-colors">
          <div className="w-8 h-8 rounded-full bg-zinc-700 overflow-hidden" />
          <span className="text-sm font-medium">Kane Onyourleft</span>
        </button>
      </div>
    </div>
  );
}
