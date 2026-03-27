"use client";

import React, { useMemo, useCallback, useState, useEffect } from 'react';
import { Sidebar, DataTable } from '@orbit/ui';
import { useWorkspaces, useTable, useRealtimeRows } from '@orbit/core';
import { createClient } from '@/lib/supabase';

const supabase = createClient();

export default function Home() {
  const [activeTableId, setActiveTableId] = useState<string | null>(null);
  
  // 1. Load Workspaces
  const { workspaces, loading: workspacesLoading, error: workspacesError } = useWorkspaces(supabase);
  
  // Automatically select the first table of the first workspace if none selected
  useEffect(() => {
    async function fetchFirstTable() {
      if (workspaces.length > 0 && !activeTableId) {
        const { data } = await supabase
          .from('tables')
          .select('id')
          .eq('workspace_id', workspaces[0].id)
          .limit(1)
          .single();
        
        if (data) setActiveTableId(data.id);
      }
    }
    fetchFirstTable();
  }, [workspaces, activeTableId]);

  // 2. Load Table (Fields + Rows)
  const { fields, rows, loading: tableLoading, error: tableError, setRows } = useTable(supabase, activeTableId || '');

  // 3. Realtime Sync
  const handleRealtimeUpdate = useCallback((payload: any) => {
    if (payload.eventType === 'INSERT') {
      setRows(prev => {
        if (prev.find(r => r.id === payload.new.id)) return prev;
        return [...prev, payload.new];
      });
    } else if (payload.eventType === 'UPDATE') {
      setRows(prev => prev.map(row => row.id === payload.new.id ? payload.new : row));
    } else if (payload.eventType === 'DELETE') {
      setRows(prev => prev.filter(row => row.id === payload.old.id));
    }
  }, [setRows]);

  useRealtimeRows(supabase, activeTableId || '', handleRealtimeUpdate);

  // 4. Mapped Data for UI
  const mappedRows = useMemo(() => rows.map(r => ({ 
    id: r.id, 
    ...r.data 
  })), [rows]);

  // 5. Handlers
  const handleUpdateCell = async (rowId: string, fieldId: string, value: any) => {
    const currentRow = rows.find(r => r.id === rowId);
    if (!currentRow) return;

    const newData = { ...currentRow.data, [fieldId]: value };

    // Optimistic Update
    setRows(prev => prev.map(r => r.id === rowId ? { ...r, data: newData } : r));

    try {
      await fetch(`/api/rows/${rowId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: newData })
      });
    } catch (err) {
      console.error('Update failed:', err);
    }
  };

  const handleAddRow = async () => {
    if (!activeTableId) return;

    const newOrder = rows.length > 0 ? Math.max(...rows.map(r => r.order)) + 1 : 0;

    try {
      const response = await fetch('/api/rows', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ table_id: activeTableId, data: {}, order: newOrder })
      });
      const data = await response.json();
      if (data.id) setRows(prev => [...prev, data]);
    } catch (err) {
      console.error('Insert failed:', err);
    }
  };

  const handleDeleteRow = async (rowId: string) => {
    // Optimistic Update
    setRows(prev => prev.filter(r => r.id !== rowId));

    try {
      await fetch(`/api/rows/${rowId}`, { method: 'DELETE' });
    } catch (err) {
      console.error('Delete failed:', err);
    }
  };

  const handleAddField = async () => {
    if (!activeTableId) return;

    const newOrder = fields.length > 0 ? Math.max(...fields.map(f => f.order)) + 1 : 0;
    const name = `New Field ${fields.length + 1}`;

    try {
      await fetch('/api/fields', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ table_id: activeTableId, name, type: 'text', order: newOrder })
      });
      // Realtime will handle the update if subscribed to fields (not yet done, but we can refresh)
      window.location.reload(); 
    } catch (err) {
      console.error('Add field failed:', err);
    }
  };

  const handleRenameField = async (fieldId: string, newName: string) => {
    try {
      await fetch(`/api/fields/${fieldId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName })
      });
      window.location.reload();
    } catch (err) {
      console.error('Rename field failed:', err);
    }
  };

  const handleCreateWorkspace = async (name: string) => {
    const slug = name.toLowerCase().replace(/\s+/g, '-');
    try {
      await fetch('/api/workspaces', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, slug })
      });
      window.location.reload();
    } catch (err) {
      console.error('Create workspace failed:', err);
    }
  };

  const isLoading = workspacesLoading || (activeTableId && tableLoading);
  const error = workspacesError || tableError;

  if (isLoading) return (
    <div className="w-full h-screen bg-zinc-950 flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
    </div>
  );

  if (error) return (
    <div className="w-full h-screen bg-zinc-950 flex items-center justify-center text-red-500 p-8 text-center">
      <div className="max-w-md space-y-4">
        <h2 className="text-2xl font-bold">Connection Error</h2>
        <p className="text-zinc-500">{error.message}</p>
        <button onClick={() => window.location.reload()} className="px-4 py-2 bg-zinc-800 rounded-lg text-sm">Retry Connection</button>
      </div>
    </div>
  );

  return (
    <div className="flex w-full h-screen bg-zinc-950 font-sans text-zinc-100 selection:bg-blue-500/30 overflow-hidden">
      <Sidebar 
        workspaces={workspaces} 
        onCreateWorkspace={handleCreateWorkspace}
      />

      <main className="flex-1 flex flex-col overflow-hidden bg-zinc-950">
        <header className="h-14 border-b border-zinc-900 bg-zinc-950/50 backdrop-blur-xl flex items-center px-6 sticky top-0 z-10 shrink-0 justify-between">
          <h2 className="text-sm font-medium text-zinc-400 font-mono tracking-tighter">
            WORKSPACE <span className="text-zinc-700 mx-2">/</span> {workspaces.find(w => w.id === activeTableId)?.name || 'PRODUCT MANAGEMENT'}
          </h2>
          <div className="flex items-center space-x-4">
            <span className="text-[10px] bg-zinc-800 text-zinc-500 px-2 py-0.5 rounded-full font-mono uppercase">Live Sync Active</span>
          </div>
        </header>

        <section className="flex-1 p-8 max-w-7xl w-full mx-auto space-y-8 overflow-auto scrollbar-hide">
          <div className="flex items-end justify-between">
            <div className="space-y-1">
              <h1 className="text-4xl font-bold tracking-tight text-white mb-2">Product Roadmap 2026</h1>
              <p className="text-sm text-zinc-500 leading-relaxed max-w-2xl">
                Real-time collaborative board for steering the next generation of business intelligence.
              </p>
            </div>
            <div className="flex space-x-3 mb-1">
              <button className="px-4 py-2 border border-zinc-800 hover:bg-zinc-900 text-zinc-400 rounded-lg text-sm font-medium transition-all duration-200">
                Filters
              </button>
              <button 
                onClick={handleAddRow}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-semibold transition-all duration-200 shadow-xl shadow-blue-500/10 active:scale-95"
              >
                + New Item
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="p-6 rounded-2xl bg-zinc-900/50 border border-zinc-800/50 backdrop-blur-sm space-y-2">
              <p className="text-xs font-medium text-zinc-500 uppercase tracking-widest text-[10px]">Total Tasks</p>
              <p className="text-3xl font-bold text-white">{rows.length}</p>
            </div>
            <div className="p-6 rounded-2xl bg-emerald-500/5 border border-emerald-500/10 backdrop-blur-sm space-y-2">
              <p className="text-xs font-medium text-emerald-500/60 uppercase tracking-widest text-[10px]">Completed</p>
              <p className="text-3xl font-bold text-emerald-400">
                {mappedRows.filter((r: any) => r['8a007d09-d5b7-4558-87a4-7b99758c77ce'] === true).length}
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
            fields={fields} 
            rows={mappedRows} 
            onUpdateCell={handleUpdateCell}
            onAddRow={handleAddRow}
            onDeleteRow={handleDeleteRow}
            onAddField={handleAddField}
            onRenameField={handleRenameField}
          />
          
          <div className="pt-4 flex items-center justify-between text-xs text-zinc-600 border-t border-zinc-800/50">
            <p>Supabase Realtime Engine / v0.1.0-alpha</p>
            <p className="font-mono">Synced @ {new Date().toLocaleTimeString()}</p>
          </div>
        </section>
      </main>
    </div>
  );
}
