import React from 'react';

/**
 * Navigation sidebar for ORBIT Application.
 */
export function Sidebar({ workspaces }: { workspaces: { id: string; name: string }[] }) {
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
              <button className="w-full flex items-center px-3 py-2 text-sm font-medium text-zinc-500 rounded-md hover:bg-zinc-800 hover:text-zinc-300 transition-colors">
                <span className="mr-2 text-lg">+</span>
                Create New
              </button>
            </li>
          </ul>
        </div>
      </nav>

      <div className="pt-4 border-t border-zinc-800">
        <button className="flex items-center space-x-3 px-3 py-2 w-full text-zinc-400 hover:text-white transition-colors">
          <div className="w-8 h-8 rounded-full bg-zinc-700 overflow-hidden" />
          <span className="text-sm font-medium">Kane Onyourleft</span>
        </button>
      </div>
    </div>
  );
}
