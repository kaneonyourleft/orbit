import React from 'react';
import { Modal } from './Modal';

/**
 * Clean Canvas Sidebar for ORBIT Workspace OS.
 */
export function Sidebar({ 
  workspaces, 
  onCreateWorkspace,
  tables = [],
  activeTableId = null,
  onSelectTable = () => {}
}: { 
  workspaces: { id: string; name: string }[], 
  onCreateWorkspace: (name: string) => void,
  tables?: { id: string; name: string; workspace_id: string }[],
  activeTableId?: string | null,
  onSelectTable?: (id: string) => void
}) {
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [newWorkspaceName, setNewWorkspaceName] = React.useState('');
  const [expandedFolder, setExpandedFolder] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (workspaces.length > 0 && expandedFolder === null) {
      setExpandedFolder(workspaces[0].name);
    }
  }, [workspaces]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newWorkspaceName.trim()) {
      onCreateWorkspace(newWorkspaceName);
      setNewWorkspaceName('');
      setIsModalOpen(false);
    }
  };

  return (
    <aside className="fixed left-0 top-14 bottom-0 flex flex-col w-64 p-4 gap-2 bg-zinc-50 border-r border-zinc-200 transition-all duration-150 ease-in-out z-40 font-sans antialiased">
      {/* Profile Header */}
      <div className="flex items-center gap-3 mb-6 px-1 cursor-pointer hover:bg-zinc-100/50 p-1.5 rounded-lg transition-colors group">
        <div className="w-8 h-8 rounded-lg bg-primary-container flex items-center justify-center overflow-hidden shadow-sm shadow-blue-100 border border-blue-100 transition-transform group-active:scale-95">
          <span className="material-symbols-outlined text-on-primary-container text-xl font-medium">rocket_launch</span>
        </div>
        <div className="flex flex-col">
          <span className="text-[13px] font-bold text-zinc-800 tracking-tight leading-tight">Acme Corp</span>
          <span className="text-[9px] text-zinc-400 uppercase tracking-widest font-extrabold leading-tight">Enterprise Plan</span>
        </div>
        <button className="ml-auto text-zinc-300 group-hover:text-zinc-500 transition-colors">
          <span className="material-symbols-outlined text-lg">unfold_more</span>
        </button>
      </div>

      <nav className="flex flex-col gap-1 overflow-y-auto hide-scrollbar">
        <a className="flex items-center gap-3 px-3 py-2 text-zinc-500 hover:text-zinc-900 hover:bg-white hover:shadow-sm hover:border-zinc-200 border border-transparent rounded-lg text-xs font-bold uppercase tracking-wider transition-all" href="/">
          <span className="material-symbols-outlined text-xl">home</span>
          <span>Home</span>
        </a>
        <a className="flex items-center gap-3 px-3 py-2 text-zinc-500 hover:text-zinc-900 hover:bg-white hover:shadow-sm hover:border-zinc-200 border border-transparent rounded-lg text-xs font-bold uppercase tracking-wider transition-all" href="/tasks">
          <span className="material-symbols-outlined text-xl">check_circle</span>
          <span>My Tasks</span>
        </a>

        <div className="mt-4">
          <div className="flex items-center justify-between px-3 py-2 text-[10px] font-extrabold text-zinc-400 uppercase tracking-widest mb-1">
            <span>Workspaces</span>
            <button 
              className="p-1 hover:bg-white hover:shadow-sm hover:border-zinc-200 border border-transparent rounded transition-all text-zinc-300 hover:text-primary"
              onClick={() => setIsModalOpen(true)}
              title="Add Workspace"
            >
              <span className="material-symbols-outlined text-sm">add</span>
            </button>
          </div>

          <div className="space-y-1">
            {workspaces.map((ws) => (
              <div key={ws.id} className="space-y-0.5">
                <div 
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all cursor-pointer group select-none ${
                    expandedFolder === ws.name 
                      ? 'text-primary bg-white shadow-sm border border-zinc-200 ring-4 ring-blue-50/50' 
                      : 'text-zinc-500 hover:bg-white hover:shadow-sm border border-transparent'
                  }`}
                  onClick={() => setExpandedFolder(expandedFolder === ws.name ? null : ws.name)}
                >
                  <span className={`material-symbols-outlined text-sm transition-transform duration-200 ${expandedFolder === ws.name ? 'rotate-0' : '-rotate-90 text-zinc-300'}`}>
                    keyboard_arrow_down
                  </span>
                  <span className={`material-symbols-outlined text-lg font-medium ${expandedFolder === ws.name ? 'text-primary' : 'text-zinc-300'}`}>
                    {expandedFolder === ws.name ? 'folder_open' : 'folder'}
                  </span>
                  <span className={`flex-1 text-[12px] ${expandedFolder === ws.name ? 'font-bold' : 'font-semibold'}`}>{ws.name}</span>
                  <button className="material-symbols-outlined text-sm hidden group-hover:block text-zinc-300 hover:text-zinc-500 transition-colors">more_horiz</button>
                </div>

                {expandedFolder === ws.name && (
                  <div className="pl-6 mt-1 flex flex-col gap-0.5 border-l-2 border-primary/10 ml-5">
                    {tables.filter(t => t.workspace_id === ws.id).map(table => (
                      <button 
                        key={table.id}
                        onClick={() => onSelectTable(table.id)}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-[12px] transition-all group border ${
                          activeTableId === table.id 
                            ? 'text-primary font-bold bg-primary/5 border-primary/10' 
                            : 'text-zinc-400 hover:text-zinc-700 hover:bg-white hover:shadow-sm border-transparent'
                        }`}
                      >
                        <span className="material-symbols-outlined text-base">table_rows</span>
                        <span className="flex-1 text-left">{table.name}</span>
                        <span className="material-symbols-outlined text-[10px] hidden group-hover:block opacity-60">edit</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <a className="flex items-center gap-3 px-3 py-2 mt-2 text-zinc-500 hover:text-zinc-900 hover:bg-white hover:shadow-sm rounded-lg text-xs font-bold uppercase tracking-wider transition-all" href="/inbox">
          <span className="material-symbols-outlined text-xl">inbox</span>
          <span>Inbox</span>
        </a>
      </nav>

      <div className="mt-auto pt-4 border-t border-zinc-100 flex flex-col gap-1">
        <a className="flex items-center gap-3 px-3 py-2 text-zinc-400 hover:text-zinc-700 hover:bg-white hover:shadow-sm rounded-lg text-[11px] font-bold uppercase tracking-wider transition-all" href="/settings">
          <span className="material-symbols-outlined text-lg">settings</span>
          <span className="tracking-widest">Settings</span>
        </a>
        <a className="flex items-center gap-3 px-3 py-2 text-zinc-400 hover:text-zinc-700 hover:bg-white hover:shadow-sm rounded-lg text-[11px] font-bold uppercase tracking-wider transition-all" href="/support">
          <span className="material-symbols-outlined text-lg">contact_support</span>
          <span className="tracking-widest">Support</span>
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
