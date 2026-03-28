"use client";

import React, { useMemo, useCallback, useState, useEffect } from 'react';
import {
  Sidebar, DataTable, ViewSwitcher, type ViewType, KanbanBoard,
  CalendarView, Toolbar, type FilterCondition, type SortCondition,
  PluginPanel, TopNavBar, RightPanel
} from '@orbit/ui';
import {
  useWorkspaces, useTable, useRealtimeRows, usePlugins,
  statusColorPlugin, rowCountPlugin, exportCsvPlugin, pluginRegistry
} from '@orbit/core';
import { createClient } from '@/lib/supabase';

const supabase = createClient();

interface RowData extends Record<string, unknown> {
  id: string;
  table_id: string;
  data: Record<string, unknown>;
  order: number;
}

export default function Home() {
  const [activeTableId, setActiveTableId] = useState<string | null>(null);
  const [allTables, setAllTables] = useState<{ id: string; name: string; workspace_id: string }[]>([]);
  const [activeView, setActiveView] = useState<ViewType | string>('Table');
  const [isPluginsOpen, setIsPluginsOpen] = useState(false);
  const [filters, setFilters] = useState<FilterCondition[]>([]);
  const [sorts, setSorts] = useState<SortCondition[]>([]);
  const [groupByFieldId, setGroupByFieldId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activePanel, setActivePanel] = useState<'filter' | 'sort' | 'group' | null>(null);

  const plugins = useMemo(() => [statusColorPlugin, rowCountPlugin, exportCsvPlugin], []);

  const { workspaces, loading: workspacesLoading, error: workspacesError } = useWorkspaces(supabase);

  const fetchTables = useCallback(async () => {
    if (workspaces.length === 0) return;
    const { data } = await supabase.from('tables').select('*');
    if (data) setAllTables(data);
  }, [workspaces]);

  useEffect(() => { fetchTables(); }, [fetchTables]);

  const activeTable = useMemo(() => allTables.find(t => t.id === activeTableId), [allTables, activeTableId]);
  const activeTableName = activeTable?.name || 'Table';

  useEffect(() => {
    if (workspaces.length > 0 && !activeTableId && allTables.length > 0) {
      const firstTable = allTables.find(t => t.workspace_id === workspaces[0].id);
      if (firstTable) setActiveTableId(firstTable.id);
    }
  }, [workspaces, allTables, activeTableId]);

  // Auto-enable grouping by Status when fields load
  const { fields, rows, loading: tableLoading, error: tableError, setRows } = useTable(supabase, activeTableId || '');

  useEffect(() => {
    if (fields.length > 0 && groupByFieldId === null) {
      const statusField = fields.find(f => f.name.toLowerCase() === 'status' && f.type === 'select');
      if (statusField) setGroupByFieldId(statusField.id);
    }
  }, [fields, groupByFieldId]);

  const refreshTable = useCallback(() => {
    const currentId = activeTableId;
    setActiveTableId(null);
    setTimeout(() => setActiveTableId(currentId), 1);
  }, [activeTableId]);

  const { extraViews, fieldRenderers, menuItems } = usePlugins(plugins, {
    supabase,
    currentWorkspace: workspaces[0],
    currentTable: activeTableId ? { id: activeTableId, name: activeTableName } : null,
    fields,
    rows: rows.map(r => ({ id: r.id, ...r.data }))
  });

  const togglePlugin = useCallback((id: string) => {
    if (pluginRegistry.isActive(id)) pluginRegistry.deactivate(id);
    else pluginRegistry.activate(id, {
      supabase, currentWorkspace: workspaces[0],
      currentTable: { id: activeTableId!, name: activeTableName }, fields,
      rows: rows.map(r => ({ id: r.id, ...r.data })),
      addMenuItem: () => {}, registerView: () => {}, registerFieldRenderer: () => {},
      showNotification: (msg: string) => console.log(msg)
    });
    window.dispatchEvent(new CustomEvent('plugin-state-changed'));
  }, [activeTableId, activeTableName, fields, rows, workspaces]);

  const handleRealtimeUpdate = useCallback((payload: { eventType: string; new: Record<string, unknown>; old: Record<string, unknown> }) => {
    const newRow = payload.new as unknown as RowData;
    const oldRow = payload.old as unknown as { id: string };
    if (payload.eventType === 'INSERT') setRows(prev => prev.find(r => r.id === newRow.id) ? prev : [...prev, newRow as any]);
    else if (payload.eventType === 'UPDATE') setRows(prev => prev.map(row => row.id === newRow.id ? newRow as any : row));
    else if (payload.eventType === 'DELETE') setRows(prev => prev.filter(row => row.id !== oldRow.id));
  }, [setRows]);

  useRealtimeRows(supabase, activeTableId || '', handleRealtimeUpdate);

  const processedRows = useMemo(() => {
    let result = rows.map(r => ({ id: r.id, order: r.order, ...r.data }));
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(row => Object.values(row).some(val => typeof val === 'string' && val.toLowerCase().includes(q)));
    }
    if (filters.length > 0) {
      result = result.filter(row => filters.every(f => {
        const val = row[f.fieldId]; const target = f.value.toLowerCase(); const current = String(val || '').toLowerCase();
        switch (f.operator) {
          case 'is': return current === target; case 'is not': return current !== target;
          case 'contains': return current.includes(target); case 'is empty': return !val || val === '';
          case 'is not empty': return !!val && val !== ''; default: return true;
        }
      }));
    }
    if (sorts.length > 0) {
      result.sort((a, b) => {
        for (const sort of sorts) { const vA = a[sort.fieldId], vB = b[sort.fieldId]; if (vA === vB) continue; const m = sort.direction === 'asc' ? 1 : -1; return vA < vB ? -m : m; }
        return 0;
      });
    } else result.sort((a, b) => (a.order || 0) - (b.order || 0));
    return result;
  }, [rows, searchQuery, filters, sorts]);

  const handleUpdateCell = async (rowId: string, fieldId: string, value: unknown) => {
    const currentRow = rows.find(r => r.id === rowId); if (!currentRow) return;
    const newData = { ...currentRow.data, [fieldId]: value };
    setRows(prev => prev.map(r => r.id === rowId ? { ...r, data: newData } : r));
    try { const { error } = await supabase.from('rows').update({ data: newData }).eq('id', rowId); if (error) throw error; }
    catch (err) { console.error('Update failed:', err); }
  };

  const handleAddRow = async (defaultData?: Record<string, unknown>) => {
    if (!activeTableId) return;
    const newOrder = rows.length > 0 ? Math.max(...rows.map(r => r.order)) + 1 : 0;
    const initialData: Record<string, unknown> = { ...defaultData };
    const taskNameField = fields.find(f => f.name.toLowerCase().includes('name'));
    if (taskNameField && !initialData[taskNameField.id]) initialData[taskNameField.id] = `New Task ${newOrder + 1}`;
    const doneField = fields.find(f => f.type === 'checkbox'); if (doneField && initialData[doneField.id] === undefined) initialData[doneField.id] = false;
    try {
      const { data, error } = await supabase.from('rows').insert({ table_id: activeTableId, data: initialData, order: newOrder }).select().single();
      if (error) throw error; if (data) setRows(prev => [...prev, data]);
    } catch (err) { console.error('Insert failed:', err); }
  };

  const handleDeleteRow = async (rowId: string) => {
    setRows(prev => prev.filter(r => r.id !== rowId));
    try { await supabase.from('rows').delete().eq('id', rowId); } catch (err) { console.error('Delete failed:', err); }
  };

  const handleAddField = async () => {
    if (!activeTableId) return;
    try { await supabase.from('fields').insert({ table_id: activeTableId, name: `New Field ${fields.length + 1}`, type: 'text', order: fields.length }); refreshTable(); }
    catch (err) { console.error('Add field failed:', err); }
  };

  const handleRenameField = async (fieldId: string, newName: string) => {
    try { await supabase.from('fields').update({ name: newName }).eq('id', fieldId); refreshTable(); }
    catch (err) { console.error('Rename field failed:', err); }
  };

  const handleDeleteField = useCallback(async (fieldId: string) => {
    const { error } = await supabase.from('fields').delete().eq('id', fieldId);
    if (!error) {
      for (const row of rows) {
        const newData = { ...row.data };
        delete newData[fieldId];
        await supabase.from('rows').update({ data: newData }).eq('id', row.id);
      }
      refreshTable();
    }
  }, [rows, refreshTable]);

  const handleChangeFieldType = useCallback(async (fieldId: string, newType: string) => {
    const { error } = await supabase.from('fields').update({ type: newType }).eq('id', fieldId);
    if (!error) refreshTable();
  }, [refreshTable]);

  const handleReorderField = useCallback(async (fieldId: string, direction: 'left' | 'right') => {
    const sorted = [...fields].sort((a, b) => a.order - b.order);
    const idx = sorted.findIndex(f => f.id === fieldId);
    const swapIdx = direction === 'left' ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= sorted.length) return;
    const a = sorted[idx], b = sorted[swapIdx];
    await Promise.all([
      supabase.from('fields').update({ order: b.order }).eq('id', a.id),
      supabase.from('fields').update({ order: a.order }).eq('id', b.id),
    ]);
    refreshTable();
  }, [fields, refreshTable]);

  const handleDuplicateRow = useCallback(async (rowId: string) => {
    const row = rows.find(r => r.id === rowId);
    if (!row) return;
    const { error } = await supabase.from('rows').insert({
      table_id: activeTableId,
      data: row.data,
      order: rows.length,
    });
    if (!error) refreshTable();
  }, [rows, activeTableId, refreshTable]);

  const handleReorderRow = useCallback(async (rowId: string, direction: 'up' | 'down') => {
    const sorted = [...rows].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    const idx = sorted.findIndex(r => r.id === rowId);
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= sorted.length) return;
    const a = sorted[idx], b = sorted[swapIdx];
    await Promise.all([
      supabase.from('rows').update({ order: b.order ?? swapIdx }).eq('id', a.id),
      supabase.from('rows').update({ order: a.order ?? idx }).eq('id', b.id),
    ]);
    refreshTable();
  }, [rows, refreshTable]);

  const handleCreateWorkspace = async (name: string) => {
    try { await supabase.from('workspaces').insert({ name, slug: name.toLowerCase().replace(/\s+/g, '-') }); refreshTable(); }
    catch (err) { console.error('Create workspace failed:', err); }
  };

  if (workspacesLoading || (activeTableId && tableLoading)) return (
    <div className="w-full h-screen bg-white flex items-center justify-center font-sans">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#0058BE]"></div>
    </div>
  );

  if (workspacesError || tableError) return (
    <div className="w-full h-screen bg-white flex items-center justify-center p-8 text-center font-sans">
      <div className="max-w-md space-y-4">
        <h2 className="text-2xl font-black text-zinc-900">System Offline</h2>
        <p className="text-zinc-500 text-sm">Failed to connect to backend.</p>
        <button onClick={() => window.location.reload()} className="px-6 py-2 bg-zinc-900 text-white rounded-xl text-sm font-bold">Reconnect</button>
      </div>
    </div>
  );

  const completedCount = processedRows.filter((r: Record<string, unknown>) => {
    const df = fields.find(f => f.type === 'checkbox');
    return df && (r[df.id] === true || r[df.id] === 'true');
  }).length;

  return (
    <div className="flex flex-col w-full h-screen bg-white font-sans text-zinc-900 antialiased overflow-hidden">
      <TopNavBar workspaceName={workspaces[0]?.name} tableName={activeTableName} searchQuery={searchQuery} onSearchChange={setSearchQuery} />
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar - flex, not fixed */}
        <div className="w-64 shrink-0">
          <Sidebar workspaces={workspaces} onCreateWorkspace={handleCreateWorkspace} tables={allTables} activeTableId={activeTableId}
            onSelectTable={(tableId) => { setActiveTableId(tableId); setFilters([]); setSorts([]); setGroupByFieldId(null); setActivePanel(null); setActiveView('Table'); }} />
        </div>

        {/* Main Content */}
        <main className="flex-1 bg-white flex flex-col overflow-auto min-w-0">
          <PluginPanel isOpen={isPluginsOpen} onClose={() => setIsPluginsOpen(false)} registry={pluginRegistry} onToggle={togglePlugin} />
          <div className="flex flex-col min-h-full">
            <div className="px-6 pt-6 pb-3 shrink-0 bg-white sticky top-0 z-20 border-b border-zinc-100">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl font-black text-zinc-900 tracking-tight">{activeTableName}</h1>
                  {groupByFieldId && (
                    <span className="text-[10px] font-bold text-zinc-400 bg-zinc-50 border border-zinc-200 px-2 py-0.5 rounded-full">
                      Grouped by: <span className="text-[#0058BE]">{fields.find(f => f.id === groupByFieldId)?.name || 'Status'}</span>
                    </span>
                  )}
                </div>
                <button onClick={() => setIsPluginsOpen(true)} className="flex items-center gap-1.5 px-3 py-1.5 text-zinc-400 hover:text-[#0058BE] hover:bg-zinc-50 rounded-lg text-[11px] font-bold uppercase tracking-wider transition-all">
                  <span className="material-symbols-outlined text-[18px]">extension</span>Plugins
                </button>
              </div>
              <ViewSwitcher activeView={activeView as ViewType} onViewChange={setActiveView} extraViews={extraViews} />
              <Toolbar fields={fields} filters={filters} sorts={sorts} groupBy={groupByFieldId}
                onUpdateFilters={setFilters} onUpdateSorts={setSorts} onUpdateGroupBy={setGroupByFieldId}
                activePanel={activePanel} onPanelChange={setActivePanel} onNewRow={() => handleAddRow()} />
            </div>
            <div className="flex-1 p-6 pt-3">
              {activeTableId && activeView === 'Table' && (
                <DataTable
                  fields={fields}
                  rows={processedRows}
                  onUpdateCell={handleUpdateCell}
                  onAddRow={handleAddRow}
                  onDeleteRow={handleDeleteRow}
                  onAddField={handleAddField}
                  onRenameField={handleRenameField}
                  onDeleteField={handleDeleteField}
                  onChangeFieldType={handleChangeFieldType}
                  onReorderField={handleReorderField}
                  onDuplicateRow={handleDuplicateRow}
                  onReorderRow={handleReorderRow}
                  groupByFieldId={groupByFieldId || undefined}
                  onGroupBy={setGroupByFieldId}
                  renderers={fieldRenderers}
                />
              )}
              {activeTableId && activeView === 'Kanban' && (
                <KanbanBoard
                  fields={fields}
                  rows={processedRows}
                  onUpdateCell={handleUpdateCell}
                  onAddRow={(status?: string) => {
                    const statusField = fields.find(f => f.name.toLowerCase() === 'status');
                    handleAddRow(statusField && status ? { [statusField.id]: status } : {});
                  }}
                />
              )}
              {activeTableId && activeView === 'Calendar' && (
                <CalendarView 
                  fields={fields} 
                  rows={processedRows} 
                  onUpdateCell={handleUpdateCell} 
                />
              )}
            </div>
          </div>
        </main>

        {/* RightPanel - flex, not fixed */}
        <div className="w-72 shrink-0">
          <RightPanel totalRows={processedRows.length} completedRows={completedCount} menuItems={menuItems} />
        </div>
      </div>
    </div>
  );
}
