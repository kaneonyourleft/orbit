"use client";
import React, { useState, useEffect, useCallback, useMemo } from "react";
import { createClient } from "@supabase/supabase-js";
import { Sidebar, DataTable, Toolbar, ViewSwitcher, TopBar, RightPanel, Modal, CalendarView } from "@orbit/ui";
import { useTable } from "@orbit/core";

// ── Supabase ──
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function Home() {
  const [workspaces, setWorkspaces] = useState<any[]>([]);
  const [tables, setTables] = useState<any[]>([]);
  const [activeTableId, setActiveTableId] = useState<string | null>(null);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [viewType, setViewType] = useState<"table" | "board" | "calendar">("table");
  const [groupBy, setGroupBy] = useState<string | null>(null);
  const [favorites, setFavorites] = useState<string[]>([]);

  // 1. 초기 데이터 로드 (Local Favorites)
  useEffect(() => {
    const savedFavs = localStorage.getItem('orbit_favs');
    if (savedFavs) setFavorites(JSON.parse(savedFavs));
  }, []);

  useEffect(() => {
    localStorage.setItem('orbit_favs', JSON.stringify(favorites));
  }, [favorites]);

  const fetchWorkspaces = useCallback(async () => {
    const { data: wsData } = await supabase.from("workspaces").select("*").order("created_at");
    const { data: tData } = await supabase.from("tables").select("*").order("created_at");
    setWorkspaces(wsData || []);
    setTables(tData || []);
    if (!activeTableId && tData && tData.length > 0) setActiveTableId(tData[0].id);
  }, [activeTableId]);

  useEffect(() => { fetchWorkspaces(); }, [fetchWorkspaces]);

  // 2. useTable (Core Hook)
  const { fields, rows, loading, refetch, setRows } = useTable(supabase, activeTableId || "");

  // ── Handlers (Workspace CRUD) ──
  const handleCreateWorkspace = async (name: string) => {
    const { data, error } = await supabase.from("workspaces").insert([{ name }]).select().single();
    if (!error && data) setWorkspaces(prev => [...prev, data]);
  };

  const handleRenameWorkspace = async (id: string, name: string) => {
    const { error } = await supabase.from("workspaces").update({ name }).eq("id", id);
    if (!error) setWorkspaces(prev => prev.map(w => w.id === id ? { ...w, name } : w));
  };

  const handleDeleteWorkspace = async (id: string) => {
    // Cascade delete tables and rows
    const wsTables = tables.filter(t => t.workspace_id === id);
    for (const t of wsTables) await handleDeleteTable(t.id);
    const { error } = await supabase.from("workspaces").delete().eq("id", id);
    if (!error) {
      setWorkspaces(prev => prev.filter(w => w.id !== id));
      if (activeTableId && wsTables.some(t => t.id === activeTableId)) setActiveTableId(null);
    }
  };

  // ── Handlers (Table CRUD) ──
  const handleCreateTable = async (workspaceId: string, name: string) => {
    const { data, error } = await supabase.from("tables").insert([{ workspace_id: workspaceId, name }]).select().single();
    if (error || !data) return;
    
    // 초기 필드 셋업 (Notion-like default fields)
    const initialFields = [
      { table_id: data.id, name: 'Task Name', type: 'text', order: 0 },
      { table_id: data.id, name: 'Status', type: 'select', order: 1, options: { values: ['Planned', 'In Progress', 'Done'] } },
      { table_id: data.id, name: 'Priority', type: 'select', order: 2, options: { values: ['High', 'Mid', 'Low'] } },
      { table_id: data.id, name: 'Owner', type: 'text', order: 3 },
      { table_id: data.id, name: 'Done', type: 'checkbox', order: 4 },
    ];
    await supabase.from("fields").insert(initialFields);
    
    setTables(prev => [...prev, data]);
    setActiveTableId(data.id);
  };

  const handleRenameTable = async (id: string, name: string) => {
    const { error } = await supabase.from("tables").update({ name }).eq("id", id);
    if (!error) setTables(prev => prev.map(t => t.id === id ? { ...t, name } : t));
  };

  const handleDeleteTable = async (id: string) => {
    await supabase.from("rows").delete().eq("table_id", id);
    await supabase.from("fields").delete().eq("table_id", id);
    const { error } = await supabase.from("tables").delete().eq("id", id);
    if (!error) {
      setTables(prev => prev.filter(t => t.id !== id));
      if (activeTableId === id) setActiveTableId(null);
    }
  };

  const handleDuplicateTable = async (id: string) => {
    const original = tables.find(t => t.id === id);
    if (!original) return;
    const { data: copy, error } = await supabase.from("tables").insert([{ workspace_id: original.workspace_id, name: `${original.name} (Copy)` }]).select().single();
    if (error || !copy) return;
    
    const { data: fData } = await supabase.from("fields").select("*").eq("table_id", id);
    if (fData) {
      const newFields = fData.map(f => ({ ...f, id: undefined, table_id: copy.id, created_at: undefined }));
      await supabase.from("fields").insert(newFields);
    }
    setTables(prev => [...prev, copy]);
  };

  // ── Handlers (Table Engine) ──
  const handleUpdateCell = async (rowId: string, fieldId: string, value: any) => {
    const row = rows.find(r => r.id === rowId);
    if (!row) return;
    const updatedData = { ...row.data, [fieldId]: value };
    const { error } = await supabase.from("rows").update({ data: updatedData }).eq("id", rowId);
    if (!error) refetch();
  };

  const handleAddRow = async (defaultData = {}) => {
    if (!activeTableId) return;
    const { error } = await supabase.from("rows").insert([{
      table_id: activeTableId,
      data: defaultData,
      order: rows.length
    }]);
    if (!error) refetch();
  };

  const handleDeleteRow = async (id: string) => {
    await supabase.from("rows").delete().eq("id", id);
    refetch();
  };

  const handleAddField = async () => {
    if (!activeTableId) return;
    await supabase.from("fields").insert([{
      table_id: activeTableId,
      name: "New Field",
      type: "text",
      order: fields.length
    }]);
    refetch();
  };

  // ── Favorites ──
  const handleToggleFavorite = (id: string) => {
    setFavorites(prev => prev.includes(id) ? prev.filter(fid => fid !== id) : [...prev, id]);
  };

  // ── Statistics ──
  const stats = useMemo(() => {
    const total = rows.length;
    let completed = 0;
    const doneField = fields.find(f => f.type === 'checkbox' || f.name.toLowerCase() === 'done');
    if (doneField) {
      completed = rows.filter(r => r.data?.[doneField.id] === true || r.data?.[doneField.id] === 'true').length;
    }
    const progress = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { total, completed, progress };
  }, [rows, fields]);

  // ── Final Render Logic ──
  const activeTable = tables.find(t => t.id === activeTableId);

  return (
    <div className="flex h-screen bg-white overflow-hidden">
      <div className={`${isSidebarCollapsed ? "w-16" : "w-64"} transition-all duration-300 ease-in-out`}>
        <Sidebar
          workspaces={workspaces}
          tables={tables}
          activeTableId={activeTableId}
          favorites={favorites}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          onCreateWorkspace={handleCreateWorkspace}
          onRenameWorkspace={handleRenameWorkspace}
          onDeleteWorkspace={handleDeleteWorkspace}
          onSelectTable={setActiveTableId}
          onCreateTable={handleCreateTable}
          onRenameTable={handleRenameTable}
          onDeleteTable={handleDeleteTable}
          onDuplicateTable={handleDuplicateTable}
          onToggleFavorite={handleToggleFavorite}
        />
      </div>

      <main className="flex-1 flex flex-col min-w-0">
        <TopBar
          title={activeTable?.name || "Welcome to ORBIT"}
          isTableActive={!!activeTableId}
          onOpenSearch={() => {}}
          onOpenSettings={() => {}}
        />

        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="px-6 py-4 flex flex-col gap-4 border-b border-zinc-100">
            <ViewSwitcher activeView={viewType} onChange={setViewType} />
            <Toolbar
              fields={fields}
              onAddRow={() => handleAddRow()}
              onAddField={handleAddField}
              groupBy={groupBy}
              onGroupBy={setGroupBy}
            />
          </div>

          <div className="flex-1 overflow-auto bg-white">
            {!activeTableId ? (
              <div className="flex flex-col items-center justify-center h-full text-center px-4 animate-in fade-in zoom-in duration-700">
                <div className="w-24 h-24 bg-gradient-to-br from-[#0058BE] to-[#00A3FF] rounded-[2rem] flex items-center justify-center shadow-2xl mb-8 -rotate-6 scale-110">
                  <span className="material-symbols-outlined text-white text-[48px]">rocket_launch</span>
                </div>
                <h2 className="text-3xl font-black text-zinc-900 mb-4 tracking-tighter">Your Workspace is Empty</h2>
                <p className="text-zinc-500 max-w-md text-lg leading-relaxed mb-10 font-medium">
                  Create a workspace and add your first table to start organizing your projects.
                </p>
                <div className="flex gap-4">
                  <button onClick={() => handleCreateWorkspace("New Workspace")}
                    className="px-8 py-3.5 bg-[#0058BE] text-white rounded-2xl font-bold hover:scale-105 active:scale-95 transition-all shadow-xl shadow-blue-500/20">
                    Create Workspace
                  </button>
                </div>
              </div>
            ) : viewType === "calendar" ? (
              <CalendarView fields={fields} rows={rows} />
            ) : (
              <DataTable
                fields={fields}
                rows={rows.map(r => ({ ...r.data, id: r.id }))}
                onUpdateCell={handleUpdateCell}
                onAddRow={handleAddRow}
                onDeleteRow={handleDeleteRow}
                onAddField={handleAddField}
                onRenameField={() => {}} // CRUD implemented in follow-up
                onDeleteField={() => {}}
                groupByFieldId={groupBy}
              />
            )}
          </div>
        </div>
      </main>

      <RightPanel
        title="Project Insights"
        stats={stats}
        activeTableId={activeTableId || undefined}
        onOpenPlugin={() => {}}
      />
    </div>
  );
}
