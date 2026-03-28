import React from 'react';
import { PluginRegistry } from '@orbit/core';

interface PluginPanelProps {
  isOpen: boolean;
  onClose: () => void;
  registry: PluginRegistry;
  onToggle: (id: string) => void;
}

/**
 * Slide-out panel for plugin management with a clean white theme.
 */
export function PluginPanel({ isOpen, onClose, registry, onToggle }: PluginPanelProps) {
  const plugins = registry.getAll();

  if (!isOpen) return null;

  return (
    <>
      <div 
        className="fixed inset-0 bg-zinc-900/10 backdrop-blur-sm z-[90] animate-in fade-in duration-300" 
        onClick={onClose}
      />
      <div className="fixed inset-y-0 right-0 w-80 bg-white border-l border-zinc-200 shadow-2xl z-[100] animate-in slide-in-from-right duration-300 font-sans antialiased">
        <div className="p-6 h-full flex flex-col">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 bg-primary/10 rounded-xl shadow-sm border border-primary/10">
                <span className="material-symbols-outlined text-primary text-xl font-black">extension</span>
              </div>
              <h3 className="text-lg font-black text-zinc-800 tracking-tight">Plugins</h3>
            </div>
            <button 
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-zinc-50 text-zinc-300 hover:text-zinc-600 transition-all select-none"
              title="Close Panel"
            >
              <span className="material-symbols-outlined text-xl">close</span>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto space-y-4 hide-scrollbar pr-1">
            {plugins.length === 0 ? (
              <div className="py-20 text-center space-y-4 bg-zinc-50 rounded-2xl border border-dashed border-zinc-200">
                <div className="mx-auto w-12 h-12 rounded-2xl bg-white shadow-sm flex items-center justify-center text-zinc-300 border border-zinc-100">
                  <span className="material-symbols-outlined text-2xl font-bold">search_off</span>
                </div>
                <p className="text-[11px] text-zinc-400 font-bold uppercase tracking-widest leading-loose">No plugins discovered.</p>
              </div>
            ) : (
              plugins.map((plugin) => (
                <div 
                  key={plugin.id} 
                  className="p-5 rounded-2xl bg-white border border-zinc-200 hover:border-primary/20 hover:shadow-md transition-all group relative overflow-hidden"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="space-y-0.5">
                      <h4 className="text-[13px] font-black text-zinc-800 tracking-tight group-hover:text-primary transition-colors">{plugin.name}</h4>
                      <p className="text-[9px] text-zinc-400 font-black uppercase tracking-widest bg-zinc-50 px-1.5 py-0.5 rounded-full inline-block border border-zinc-100">v{plugin.version}</p>
                    </div>
                    <button 
                      onClick={() => onToggle(plugin.id)}
                      className={`w-10 h-6 p-1 rounded-full transition-all relative border ${registry.isActive(plugin.id) ? 'bg-primary border-primary shadow-md shadow-blue-100' : 'bg-zinc-50 border-zinc-200 hover:border-zinc-300'}`}
                      title={registry.isActive(plugin.id) ? 'Deactivate Plugin' : 'Activate Plugin'}
                    >
                      <div className={`w-3.5 h-3.5 bg-white rounded-full transition-all shadow-sm ${registry.isActive(plugin.id) ? 'translate-x-4' : 'translate-x-0'}`} />
                    </button>
                  </div>
                  <p className="text-[11px] text-zinc-500 font-medium leading-relaxed mt-2">{plugin.description}</p>
                </div>
              ))
            )}
          </div>

          <div className="mt-8 pt-6 border-t border-zinc-100 space-y-4">
            <div className="p-5 rounded-2xl bg-zinc-50 border border-zinc-200 shadow-inner group">
              <div className="flex items-center gap-2 mb-2">
                <span className="material-symbols-outlined text-primary text-sm font-black">terminal</span>
                <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em] leading-none">Developer Mode</p>
              </div>
              <p className="text-[11px] text-zinc-400 font-medium leading-relaxed">Load local plugins via developer workspace tools coming soon. Extension system is active.</p>
            </div>
            <p className="text-[9px] text-zinc-300 text-center font-black uppercase tracking-[0.4em] select-none">ORBIT Runtime v4.0</p>
          </div>
        </div>
      </div>
    </>
  );
}
