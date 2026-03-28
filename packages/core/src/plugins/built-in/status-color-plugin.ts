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
    const renderer = ({ value }: { value: any }) => {
      const getStyles = (val: string) => {
        const v = val.toLowerCase();
        if (v.includes('planned')) return 'bg-zinc-50 text-zinc-500 border-zinc-200';
        if (v.includes('progress')) return 'bg-blue-50 text-[#0058BE] border-blue-100';
        if (v.includes('done') || v.includes('completed')) return 'bg-[#AFEFCB]/30 text-[#006C49] border-[#AFEFCB]/50';
        if (v.includes('stuck') || v.includes('critical')) return 'bg-red-50 text-red-700 border-red-100';
        if (v.includes('high')) return 'bg-amber-100 text-amber-800 border-amber-200';
        if (v.includes('mid') || v.includes('medium')) return 'bg-zinc-100 text-zinc-600 border-zinc-200';
        if (v.includes('low')) return 'bg-emerald-100 text-emerald-800 border-emerald-200';
        return 'bg-zinc-50 text-zinc-400 border-zinc-100';
      };

      if (!value) return React.createElement('span', { className: 'text-zinc-600 italic text-[11px]' }, 'Unset');

      return React.createElement(
        'span', 
        { className: `px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border shadow-sm ${getStyles(String(value))}` },
        String(value)
      );
    };

    ctx.registerFieldRenderer('select', renderer);
    ctx.registerFieldRenderer('status', renderer);
    ctx.registerFieldRenderer('priority', renderer);
  },
  deactivate: () => {
    // Cleanup handled by registry
  }
};
