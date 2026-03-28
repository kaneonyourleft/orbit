"use client";
import React, { useState, useEffect, useCallback, useMemo } from "react";
import { createClient } from "@supabase/supabase-js";
import { 
  Sidebar, DataTable, Toolbar, ViewSwitcher, TopNavBar, CalendarView, KanbanBoard,
  FilterCondition, SortCondition, PluginPanel, type ViewType
} from "@orbit/ui";
import { useTable } from "@orbit/core";

// ── Supabase ──
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface Workspace {
  id: string;
  name: string;
}

interface TableMetadata {
  id: string;
  name: string;
  workspace_id: string;
}

export default function Home() {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [allTables, setAllTables] = useState<TableMetadata[]>([]);
  const [activeTableId, setActiveTableId] = useState<string | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeView, setActiveView] = useState<string>("Table");
  const [groupByFieldId, setGroupByFieldId] = useState<string | null>(null);
  const [workspacesLoading, setWorkspacesLoading] = useState(true);

  // Onboarding states
  const [onboardingWsName, setOnboardingWsName] = useState('');
  const [onboardingStep, setOnboardingStep] = useState<'idle' | 'creating'>('idle');
  const [onboardingTableName, setOnboardingTableName] = useState('');

  // Plugin states (Stubs for now)
  const [isPluginsOpen, setIsPluginsOpen] = useState(false);
  const [pluginRegistry, setPluginRegistry] = useState<any[]>([]);
  const [fieldRenderers, setFieldRenderers] = useState<Record<string, any>>({});
  const [extraViews, setExtraViews] = useState<any[]>([]);
  
  // Initialize from localStorage directly to avoid cascading renders
  const [favorites, setFavorites] = useState<string[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('orbit_favs');
      try {
        return saved ? JSON.parse(saved) : [];
      } catch (e) {
        console.error("Failed to parse favorites", e);
        return [];
      }
    }
    return [];
  });
  
  // Search
  const [searchQuery, setSearchQuery] = useState("");

  // Toolbar states
  const [filters, setFilters] = useState<FilterCondition[]>([]);
  const [sorts, setSorts] = useState<SortCondition[]>([]);
  const [activePanel, setActivePanel] = useState<'filter' | 'sort' | 'group' | null>(null);

  // Persistence effect for favorites
  useEffect(() => {
    localStorage.setItem('orbit_favs', JSON.stringify(favorites));
  }, [favorites]);

  const fetchWorkspaces = useCallback(async () => {
    try {
      setWorkspacesLoading(true);
      const { data: wsData } = await supabase.from("workspaces").select("*").order("created_at");
      const { data: tData } = await supabase.from("tables").select("*").order("created_at");
      
      setWorkspaces(wsData || []);
      setAllTables(tData || []);
      
      // Set initial active table if not set
      if (!activeTableId && tData && tData.length > 0) {
        setActiveTableId(tData[0].id);
      }
    } finally {
      setWorkspacesLoading(false);
    }
  }, [activeTableId]);

  useEffect(() => { 
    const init = async () => {
      await fetchWorkspaces();
    };
    init();
  }, [fetchWorkspaces]);

  // 2. useTable (Core Hook)
  const { fields, rows, refetch } = useTable(supabase, activeTableId || "");

  // ── Handlers (Workspace CRUD) ──
  const handleCreateWorkspace = async (name: string) => {
    try {
      const { error } = await supabase.from('workspaces').insert({
        name,
        slug: name.toLowerCase().replace(/\s+/g, '-'),
      });
      if (error) throw error;
      window.location.reload();
    } catch (err) {
      console.error('Create workspace failed:', err);
    }
  };

  const handleRenameWorkspace = async (id: string, name: string) => {
    const { error } = await supabase.from("workspaces").update({ name }).eq("id", id);
    if (!error) setWorkspaces(prev => prev.map(w => w.id === id ? { ...w, name } : w));
  };

  const handleDeleteWorkspace = async (id: string) => {
    const wsTables = allTables.filter(t => t.workspace_id === id);
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
    
    const initialFields = [
      { table_id: data.id, name: 'Task Name', type: 'text', order: 0 },
      { table_id: data.id, name: 'Status', type: 'select', order: 1, options: { values: ['Planned', 'In Progress', 'Done'] } },
      { table_id: data.id, name: 'Priority', type: 'select', order: 2, options: { values: ['High', 'Mid', 'Low'] } },
      { table_id: data.id, name: 'Owner', type: 'text', order: 3 },
      { table_id: data.id, name: 'Done', type: 'checkbox', order: 4 },
    ];
    await supabase.from("fields").insert(initialFields);
    
    setAllTables(prev => [...prev, data]);
    setActiveTableId(data.id);
  };

  const handleRenameTable = async (id: string, name: string) => {
    const { error } = await supabase.from("tables").update({ name }).eq("id", id);
    if (!error) setAllTables(prev => prev.map(t => t.id === id ? { ...t, name } : t));
  };

  const handleDeleteTable = async (id: string) => {
    await supabase.from("rows").delete().eq("table_id", id);
    await supabase.from("fields").delete().eq("table_id", id);
    const { error } = await supabase.from("tables").delete().eq("id", id);
    if (!error) {
      setAllTables(prev => prev.filter(t => t.id !== id));
      if (activeTableId === id) setActiveTableId(null);
    }
  };

  const handleDuplicateTable = async (id: string) => {
    const original = allTables.find(t => t.id === id);
    if (!original) return;
    const { data: copy, error } = await supabase.from("tables").insert([{ workspace_id: original.workspace_id, name: `${original.name} (Copy)` }]).select().single();
    if (error || !copy) return;
    
    const { data: fData } = await supabase.from("fields").select("*").eq("table_id", id);
    if (fData) {
      const newFields = fData.map(f => ({ ...f, id: undefined, table_id: copy.id, created_at: undefined }));
      await supabase.from("fields").insert(newFields);
    }
    setAllTables(prev => [...prev, copy]);
  };

  // ── Handlers (Table Engine) ──
  const handleUpdateCell = async (rowId: string, fieldId: string, value: unknown) => {
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

  const handleRenameField = async (fieldId: string, name: string) => {
    await supabase.from("fields").update({ name }).eq("id", fieldId);
    refetch();
  };

  const handleDeleteField = async (fieldId: string) => {
    await supabase.from("fields").delete().eq("id", fieldId);
    refetch();
  };

  const handleChangeFieldType = async (fieldId: string, type: string) => {
    await supabase.from("fields").update({ type }).eq("id", fieldId);
    refetch();
  };

  const handleReorderField = async (fieldId: string, order: number) => {
    await supabase.from("fields").update({ order }).eq("id", fieldId);
    refetch();
  };

  const handleDuplicateRow = async (id: string) => {
    const original = rows.find(r => r.id === id);
    if (!original) return;
    await supabase.from("rows").insert([{
      table_id: activeTableId,
      data: original.data,
      order: rows.length
    }]);
    refetch();
  };

  const handleReorderRow = async (id: string, order: number) => {
    await supabase.from("rows").update({ order }).eq("id", id);
    refetch();
  };

  // ── Plugins ──
  const togglePlugin = (pluginId: string) => {
    setPluginRegistry(prev => prev.map(p => p.id === pluginId ? { ...p, isEnabled: !p.isEnabled } : p));
  };

  // ── Favorites ──
  const handleToggleFavorite = (id: string) => {
    setFavorites(prev => prev.includes(id) ? prev.filter(fid => fid !== id) : [...prev, id]);
  };

  // ── Final Render Logic ──
  const activeTable = allTables.find(t => t.id === activeTableId);
  const activeTableName = activeTable?.name || "Select a table";

  // ══════════════════════════════════════════════
  // 온보딩 1: 워크스페이스가 없을 때 — 풀스크린, 자체 입력 폼
  // ══════════════════════════════════════════════
  if (!workspacesLoading && workspaces.length === 0) {
    return (
      <div className="w-full h-screen bg-gradient-to-br from-white via-zinc-50 to-blue-50/30 flex items-center justify-center font-sans antialiased relative overflow-hidden">
        {/* 상단 그라데이션 바 */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-blue-400 to-emerald-400" />
        <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full bg-blue-100/20 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 rounded-full bg-emerald-100/20 blur-3xl" />

        <div className="relative z-10 text-center max-w-md px-6">
          <div className="flex items-center justify-center gap-3 mb-8">
            <div className="w-14 h-14 rounded-2xl bg-primary flex items-center justify-center shadow-lg shadow-blue-200">
              <span className="material-symbols-outlined text-white text-[32px]">rocket_launch</span>
            </div>
          </div>
          <h1 className="text-4xl font-black text-zinc-900 tracking-tight leading-tight mb-3">Your Work, Your OS</h1>
          <p className="text-sm text-zinc-500 leading-relaxed max-w-xs mx-auto mb-10">Create a workspace to start organizing projects, tasks, and everything in between.</p>
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              if (!onboardingWsName.trim() || onboardingStep === 'creating') return;
              setOnboardingStep('creating');
              try {
                const { error } = await supabase.from('workspaces').insert({
                  name: onboardingWsName.trim(),
                  slug: onboardingWsName.trim().toLowerCase().replace(/\s+/g, '-'),
                });
                if (error) throw error;
                window.location.reload();
              } catch (err) {
                console.error('Create workspace failed:', err);
                setOnboardingStep('idle');
              }
            }}
            className="max-w-sm mx-auto space-y-4"
          >
            <div className="relative">
              <input autoFocus type="text" value={onboardingWsName} onChange={e => setOnboardingWsName(e.target.value)} placeholder="e.g. Design Team, Q1 Roadmap..." className="w-full px-5 py-4 bg-white border-2 border-zinc-200 rounded-2xl text-sm font-semibold text-zinc-800 placeholder:text-zinc-300 outline-none focus:border-primary focus:ring-4 focus:ring-blue-50 transition-all shadow-sm" />
              {onboardingWsName.trim() && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2"><span className="material-symbols-outlined text-emerald-500 text-[20px] animate-in fade-in">check_circle</span></div>
              )}
            </div>
            <button type="submit" disabled={!onboardingWsName.trim() || onboardingStep === 'creating'} className="w-full flex items-center justify-center gap-2 px-8 py-4 bg-primary hover:bg-blue-700 disabled:bg-zinc-300 text-white text-sm font-bold rounded-2xl shadow-lg shadow-blue-200 disabled:shadow-none transition-all active:scale-[0.98] hover:shadow-xl hover:shadow-blue-200/50">
              {onboardingStep === 'creating' ? (<><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /><span>Creating...</span></>) : (<><span className="material-symbols-outlined text-[20px]">arrow_forward</span><span>Get Started</span></>)}
            </button>
          </form>
          <p className="text-[11px] text-zinc-400 mt-8">Workspaces contain tables, views, and automations — all in one place.</p>
        </div>
      </div>
    );
  }

  // ══════════════════════════════════════════════
  // 온보딩 2: 워크스페이스는 있지만 테이블이 없을 때
  // ══════════════════════════════════════════════
  if (!workspacesLoading && workspaces.length > 0 && allTables.length === 0) {
    return (
      <div className="flex flex-col w-full h-screen bg-white font-sans text-zinc-900 antialiased overflow-hidden">
        <TopNavBar workspaceName={workspaces[0]?.name} tableName="" searchQuery="" onSearchChange={() => {}} />
        <div className="flex flex-1 overflow-hidden">
          <div className={`${sidebarCollapsed ? 'w-16' : 'w-64'} shrink-0 transition-all duration-300`}>
            <Sidebar workspaces={workspaces} tables={[]} activeTableId={null} favorites={favorites} isCollapsed={sidebarCollapsed} onCreateWorkspace={handleCreateWorkspace} onRenameWorkspace={handleRenameWorkspace} onDeleteWorkspace={handleDeleteWorkspace} onSelectTable={() => {}} onCreateTable={handleCreateTable} onRenameTable={handleRenameTable} onDeleteTable={handleDeleteTable} onDuplicateTable={handleDuplicateTable} onToggleFavorite={handleToggleFavorite} onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)} />
          </div>
          <main className="flex-1 flex items-center justify-center bg-gradient-to-br from-white to-zinc-50/50">
            <div className="text-center max-w-sm space-y-6">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-zinc-50 border border-zinc-200 flex items-center justify-center shadow-sm"><span className="material-symbols-outlined text-[40px] text-zinc-300">table_chart</span></div>
              <div className="space-y-2">
                <h2 className="text-xl font-black text-zinc-800 tracking-tight">Create Your First Table</h2>
                <p className="text-sm text-zinc-500">Tables hold your tasks, data, and views.</p>
              </div>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (onboardingTableName.trim()) {
                    handleCreateTable(workspaces[0].id, onboardingTableName.trim());
                    setOnboardingTableName('');
                  }
                }}
                className="space-y-3"
              >
                <input autoFocus type="text" value={onboardingTableName} onChange={e => setOnboardingTableName(e.target.value)} placeholder="e.g. Sprint Board, Bug Tracker..." className="w-full px-4 py-3 bg-white border-2 border-zinc-200 rounded-xl text-sm font-semibold text-zinc-800 placeholder:text-zinc-300 outline-none focus:border-primary focus:ring-4 focus:ring-blue-50 transition-all" />
                <button type="submit" disabled={!onboardingTableName.trim()} className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-primary hover:bg-blue-700 disabled:bg-zinc-300 text-white text-sm font-bold rounded-xl shadow-sm disabled:shadow-none transition-all active:scale-95"><span className="material-symbols-outlined text-[18px]">add</span>Create Table</button>
              </form>
            </div>
          </main>
        </div>
      </div>
    );
  }

  // ══════════════════════════════════════════════
  // 온보딩 3: 테이블은 있지만 아직 선택 안 됐을 때
  // ══════════════════════════════════════════════
  if (!activeTableId && allTables.length > 0) {
    const firstTable = allTables.find(t => t.workspace_id === workspaces[0]?.id) || allTables[0];
    if (firstTable) setActiveTableId(firstTable.id);
  }

  // Final rows preparation
  const processedRows = rows.map(r => ({ ...r.data, id: r.id }));

  return (
    <div className="flex flex-col w-full h-screen bg-white font-sans text-zinc-900 antialiased overflow-hidden">
      <TopNavBar workspaceName={workspaces[0]?.name} tableName={activeTableName} searchQuery={searchQuery} onSearchChange={setSearchQuery} />
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <div className={`${sidebarCollapsed ? 'w-16' : 'w-64'} shrink-0 transition-all duration-300`}>
          <Sidebar
            workspaces={workspaces} tables={allTables} activeTableId={activeTableId}
            favorites={favorites} isCollapsed={sidebarCollapsed}
            onCreateWorkspace={handleCreateWorkspace} onRenameWorkspace={handleRenameWorkspace}
            onDeleteWorkspace={handleDeleteWorkspace}
            onSelectTable={(tableId) => {
              setActiveTableId(tableId);
              setFilters([]); setSorts([]); setGroupByFieldId(null);
              setActivePanel(null); setActiveView('Table');
            }}
            onCreateTable={handleCreateTable} onRenameTable={handleRenameTable}
            onDeleteTable={handleDeleteTable} onDuplicateTable={handleDuplicateTable}
            onToggleFavorite={handleToggleFavorite} onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
          />
        </div>

        {/* Main Content — 전체 너비 사용, RightPanel 없음 */}
        <main className="flex-1 bg-white flex flex-col overflow-auto min-w-0">
          <PluginPanel isOpen={isPluginsOpen} onClose={() => setIsPluginsOpen(false)} registry={pluginRegistry} onToggle={togglePlugin} />
          <div className="flex flex-col min-h-full">
            <div className="px-6 pt-5 pb-2 shrink-0 bg-white sticky top-0 z-20 border-b border-zinc-100">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <h1 className="text-xl font-black text-zinc-900 tracking-tight">{activeTableName}</h1>
                  {groupByFieldId && (
                    <span className="text-[10px] font-bold text-zinc-400 bg-zinc-50 border border-zinc-200 px-2 py-0.5 rounded-full">
                      Grouped by: <span className="text-primary">{fields.find(f => f.id === groupByFieldId)?.name || 'Status'}</span>
                    </span>
                  )}
                </div>
                <button onClick={() => setIsPluginsOpen(true)} className="flex items-center gap-1.5 px-3 py-1.5 text-zinc-400 hover:text-primary hover:bg-zinc-50 rounded-lg text-[11px] font-bold uppercase tracking-wider transition-all">
                  <span className="material-symbols-outlined text-[18px]">extension</span>Plugins
                </button>
              </div>
              <ViewSwitcher activeView={activeView as ViewType} onViewChange={setActiveView} extraViews={extraViews} />
              <Toolbar
                fields={fields} filters={filters} sorts={sorts} groupBy={groupByFieldId}
                onUpdateFilters={setFilters} onUpdateSorts={setSorts} onUpdateGroupBy={setGroupByFieldId}
                activePanel={activePanel} onPanelChange={setActivePanel}
                onNewRow={() => {
                  const statusField = fields.find(f => f.name.toLowerCase() === 'status');
                  handleAddRow(statusField ? { [statusField.id]: 'Planned' } : {});
                }}
              />
            </div>
            <div className="flex-1 p-6 pt-3">
              {activeTableId && activeView === 'Table' && (
                <DataTable
                  fields={fields} rows={processedRows}
                  onUpdateCell={handleUpdateCell} onAddRow={handleAddRow} onDeleteRow={handleDeleteRow}
                  onAddField={handleAddField} onRenameField={handleRenameField} onDeleteField={handleDeleteField}
                  onChangeFieldType={handleChangeFieldType} onReorderField={handleReorderField}
                  onDuplicateRow={handleDuplicateRow} onReorderRow={handleReorderRow}
                  groupByFieldId={groupByFieldId || undefined} onGroupBy={setGroupByFieldId}
                  renderers={fieldRenderers}
                />
              )}
              {activeTableId && activeView === 'Kanban' && (
                <KanbanBoard fields={fields} rows={processedRows} onUpdateCell={handleUpdateCell}
                  onAddRow={(status?: string) => {
                    const statusField = fields.find(f => f.name.toLowerCase() === 'status');
                    handleAddRow(statusField && status ? { [statusField.id]: status } : {});
                  }} />
              )}
              {activeTableId && activeView === 'Calendar' && (
                <CalendarView fields={fields} rows={processedRows} onUpdateCell={handleUpdateCell} />
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
