import React from 'react';
import { OrbitPlugin, PluginContext } from '../types';

/**
 * Status Color Plugin
 * Custom field renderer for select fields with keyword-based coloring.
 */
export const statusColorPlugin: OrbitPlugin = {
  id: 'status-color-plugin',
  name: 'Status Colors',
  version: '1.0.0',
  description: 'Colorizes status and priority badges automatically.',
  activate: (ctx: PluginContext) => {
    ctx.registerFieldRenderer('select', ({ value }) => {
      const getStyles = (val: string) => {
        const v = val.toLowerCase();
        if (v.includes('done') || v.includes('emerald')) return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
        if (v.includes('progress') || v.includes('amber')) return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
        if (v.includes('high') || v.includes('red')) return 'bg-red-500/10 text-red-500 border-red-500/20';
        if (v.includes('to do') || v.includes('blue')) return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
        return 'bg-zinc-800 text-zinc-400 border-zinc-700';
      };

      if (!value) return React.createElement('span', { className: 'text-zinc-600 italic text-[11px]' }, 'Unset');

      return React.createElement(
        'span', 
        { className: `px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${getStyles(String(value))}` },
        String(value)
      );
    });
  },
  deactivate: () => {
    // Cleanup handled by registry
  }
};
