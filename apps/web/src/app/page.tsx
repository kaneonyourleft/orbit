"use client";

import React, { useEffect } from 'react';
import { Sidebar, DataTable } from '@orbit/ui';
import { OrbitField, useWorkspaceStore } from '@orbit/core';

const MOCK_WORKSPACES = [
  { id: '1', name: 'Product Management' },
  { id: '2', name: 'Engineering Roadmap' },
  { id: '3', name: 'Marketing Campaign' },
];

const MOCK_FIELDS: OrbitField[] = [
  { id: 'task', name: 'Task Name', type: 'text', order: 1 },
  { id: 'status', name: 'Status', type: 'select', order: 2, options: { choices: [{ label: 'To Do', color: 'gray' }, { label: 'In Progress', color: 'blue' }, { label: 'Done', color: 'green' }] } },
  { id: 'priority', name: 'Priority', type: 'select', order: 3 },
  { id: 'owner', name: 'Owner', type: 'text', order: 4 },
  { id: 'complete', name: 'Done', type: 'checkbox', order: 5 },
];

const INITIAL_ROWS = [
  { id: 'r1', task: 'Bootstrap Monorepo', status: 'Done', priority: 'High', owner: 'Kane', complete: true },
  { id: 'r2', task: 'Design Data Schema', status: 'In Progress', priority: 'Medium', owner: 'Kane', complete: false },
  { id: 'r3', task: 'Implement Interactive Table', status: 'To Do', priority: 'High', owner: 'Kane', complete: false },
  { id: 'r4', task: 'Setup Auth System', status: 'To Do', priority: 'Low', owner: '', complete: false },
];

/**
 * Main landing page for ORBIT - Work OS
 */
export default function Home() {
  const { currentTable, setCurrentTable, setWorkspaces, workspaces, updateCell, addRow } = useWorkspaceStore();

  useEffect(() => {
    setWorkspaces(MOCK_WORKSPACES);
    setCurrentTable({
      id: 't1',
      name: 'Product Roadmap 2026',
      fields: MOCK_FIELDS,
      rows: INITIAL_ROWS
    });
  }, [setWorkspaces, setCurrentTable]);

  if (!currentTable) return (
    <div className="w-full h-screen bg-zinc-950 flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
    </div>
  );

  return (
    <div className="flex w-full h-screen bg-zinc-950 font-sans text-zinc-100 selection:bg-blue-500/30 overflow-hidden">
      <Sidebar workspaces={workspaces} />

      <main className="flex-1 flex flex-col overflow-hidden bg-zinc-950">
        <header className="h-14 border-b border-zinc-900 bg-zinc-950/50 backdrop-blur-xl flex items-center px-6 sticky top-0 z-10 shrink-0 justify-between">
          <h2 className="text-sm font-medium text-zinc-400 font-mono tracking-tighter">
            WORKSPACE <span className="text-zinc-700 mx-2">/</span> PRODUCT MANAGEMENT
          </h2>
          <div className="flex items-center space-x-4">
            <span className="text-[10px] bg-zinc-800 text-zinc-500 px-2 py-0.5 rounded-full font-mono uppercase">Live Sync Active</span>
          </div>
        </header>

        <section className="flex-1 p-8 max-w-7xl w-full mx-auto space-y-8 overflow-auto scrollbar-hide">
          <div className="flex items-end justify-between">
            <div className="space-y-1">
              <h1 className="text-4xl font-bold tracking-tight text-white mb-2">{currentTable.name}</h1>
              <p className="text-sm text-zinc-500 leading-relaxed max-w-2xl">
                Real-time collaborative board for steering the next generation of business intelligence.
              </p>
            </div>
            <div className="flex space-x-3 mb-1">
              <button className="px-4 py-2 border border-zinc-800 hover:bg-zinc-900 text-zinc-400 rounded-lg text-sm font-medium transition-all duration-200">
                Filters
              </button>
              <button 
                onClick={addRow}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-semibold transition-all duration-200 shadow-xl shadow-blue-500/10 active:scale-95"
              >
                + New Item
              </button>
            </div>
          </div>

          {/* Quick Analytics Dashboard */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="p-6 rounded-2xl bg-zinc-900/50 border border-zinc-800/50 backdrop-blur-sm space-y-2">
              <p className="text-xs font-medium text-zinc-500 uppercase tracking-widest text-[10px]">Total Tasks</p>
              <p className="text-3xl font-bold text-white">{currentTable.rows.length}</p>
            </div>
            <div className="p-6 rounded-2xl bg-emerald-500/5 border border-emerald-500/10 backdrop-blur-sm space-y-2">
              <p className="text-xs font-medium text-emerald-500/60 uppercase tracking-widest text-[10px]">Completed</p>
              <p className="text-3xl font-bold text-emerald-400">
                {currentTable.rows.filter(r => r.complete).length}
              </p>
            </div>
            <div className="p-6 rounded-2xl bg-zinc-900/50 border border-zinc-800/50 backdrop-blur-sm col-span-2 overflow-hidden relative group">
              <div className="absolute inset-0 opacity-20 group-hover:opacity-40 transition-opacity duration-500">
                  <img src="/orbit_dashboard_chart_mockup.png" alt="Analytics" className="w-full h-full object-cover" />
              </div>
              <div className="relative z-10">
                <p className="text-xs font-medium text-zinc-500 uppercase tracking-widest text-[10px]">Productivity Curve</p>
                <p className="text-3xl font-bold text-blue-400">+12.5% <span className="text-sm font-medium text-zinc-600 ml-1">this week</span></p>
              </div>
            </div>
          </div>

          <DataTable 
            fields={currentTable.fields} 
            rows={currentTable.rows} 
            onUpdateCell={updateCell}
            onAddRow={addRow}
          />
          
          <div className="pt-4 flex items-center justify-between text-xs text-zinc-600 border-t border-zinc-800/50">
            <p>Monorepo Monolithic Data Engine / v0.1.0-alpha</p>
            <p className="font-mono">Synced @ {new Date().toLocaleTimeString()}</p>
          </div>
        </section>
      </main>
    </div>
  );
}

