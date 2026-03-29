'use client';
import React from 'react';
import type { DBView } from './types';

interface Props {
  views: DBView[];
  activeViewId: string;
  onSwitch: (viewId: string) => void;
}

export default function ViewSwitcher({ views, activeViewId, onSwitch }: Props) {
  const icons: Record<string, string> = { table: '☰', kanban: '▤', calendar: '📅', gallery: '▦' };
  
  return (
    <div className="flex gap-2 py-1 border-b border-white/5">
      {views.map(v => (
        <button
          key={v.id}
          onClick={() => onSwitch(v.id)}
          className={`px-3 py-1 text-[13px] rounded transition-all ${v.id === activeViewId ? 'bg-indigo-500/15 text-indigo-400 font-bold' : 'text-slate-500 hover:text-slate-300'}`}
        >
          {icons[v.type] || '☰'} {v.name}
        </button>
      ))}
    </div>
  );
}
