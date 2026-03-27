import React from 'react';
import { OrbitPlugin, PluginRegistry } from '@orbit/core';

interface PluginPanelProps {
  isOpen: boolean;
  onClose: () => void;
  registry: PluginRegistry;
  onToggle: (id: string) => void;
}

/**
 * Slide-out panel for plugin management.
 */
export function PluginPanel({ isOpen, onClose, registry, onToggle }: PluginPanelProps) {
  const plugins = registry.getAll();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 w-80 bg-zinc-950 border-l border-zinc-800 shadow-2xl z-[100] animate-in slide-in-from-right duration-300">
      <div className="p-6 h-full flex flex-col">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-3">
             <div className="p-2 bg-blue-500/10 rounded-xl">
               <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-blue-400"><path d="M7 11 V7 a5 5 0 0 1 10 0 v4"/><rect width="18" height="12" x="3" y="11" rx="2"/></svg>
             </div>
             <h3 className="text-lg font-bold text-white tracking-tight">Plugins</h3>
          </div>
          <button 
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-zinc-900 text-zinc-500 hover:text-white transition-all"
            title="Close Panel"
            aria-label="Close"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto space-y-4 scrollbar-hide pr-2">
          {plugins.length === 0 ? (
            <div className="py-20 text-center space-y-4">
               <div className="mx-auto w-12 h-12 rounded-2xl bg-zinc-900 flex items-center justify-center text-zinc-700">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></svg>
               </div>
               <p className="text-xs text-zinc-600 font-medium">No plugins discovered.</p>
            </div>
          ) : (
            plugins.map((plugin) => (
              <div 
                key={plugin.id} 
                className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 hover:bg-zinc-800/50 transition-all group"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="space-y-1">
                    <h4 className="text-sm font-bold text-zinc-100">{plugin.name}</h4>
                    <p className="text-[10px] text-zinc-500 font-mono">v{plugin.version}</p>
                  </div>
                  <button 
                    onClick={() => onToggle(plugin.id)}
                    className={`w-10 h-5 p-1 rounded-full transition-all relative ${registry.isActive(plugin.id) ? 'bg-blue-600' : 'bg-zinc-800'}`}
                    title={registry.isActive(plugin.id) ? 'Deactivate Plugin' : 'Activate Plugin'}
                  >
                    <div className={`w-3 h-3 bg-white rounded-full transition-all ${registry.isActive(plugin.id) ? 'translate-x-5' : 'translate-x-0'}`} />
                  </button>
                </div>
                <p className="text-xs text-zinc-500 leading-relaxed">{plugin.description}</p>
              </div>
            ))
          )}
        </div>

        <div className="mt-8 pt-6 border-t border-zinc-900 space-y-4">
          <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-600/10 to-indigo-600/10 border border-blue-500/10 space-y-3">
             <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">Developer Mode</p>
             <p className="text-xs text-zinc-400">Load a local plugin via developer workspace tools coming soon.</p>
          </div>
          <p className="text-[10px] text-zinc-700 text-center font-mono">ORBIT Extension Runtime v4.0</p>
        </div>
      </div>
    </div>
  );
}
