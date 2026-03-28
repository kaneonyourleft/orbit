"use client";

import React, { useMemo, useCallback, useState, useEffect } from 'react';
import { 
  Sidebar, 
  DataTable, 
  ViewSwitcher, 
  type ViewType, 
  KanbanBoard, 
  CalendarView, 
  Toolbar, 
  type FilterCondition, 
  type SortCondition, 
  PluginPanel,
  TopNavBar,
  RightPanel
} from '@orbit/ui';
import { 
  useWorkspaces, 
  useTable, 
  useRealtimeRows, 
  usePlugins, 
  statusColorPlugin, 
  rowCountPlugin, 
  exportCsvPlugin, 
  pluginRegistry 
} from '@orbit/core';
import { createClient } from '@/lib/supabase';

const supabase = createClient();

export default function Home() {
  const [activeTableId, setActiveTableId] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<ViewType | string>('Table');
  const [isPluginsOpen, setIsPluginsOpen] = useState(false);
  
  // Filtering & Sorting
  const [filters, setFilters] = useState<FilterCondition[]>([]);
  const [sorts, setSorts] = useState<SortCondition[]>([]);
  const [groupByFieldId, setGroupByFieldId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Toolbar Panel State
  const [activePanel, setActivePanel] = useState<'filter' | 'sort' | 'group' | null>(null);

  const plugins = useMemo(() => [
    statusColorPlugin,
    rowCountPlugin,
    exportCsvPlugin
  ], []);
  
  // 1. Load Workspaces
  const { workspaces, loading: workspacesLoading, error: workspacesError } = useWorkspaces(supabase);
  
  // Automatically select the first table
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

  // 2. Load Table
  const { fields, rows, loading: tableLoading, error: tableError, setRows } = useTable(supabase, activeTableId || '');

  // 3. Plugin System
  const { extraViews, fieldRenderers, menuItems } = usePlugins(plugins, {
    supabase,
    currentWorkspace: workspaces[0],
    currentTable: fields.length > 0 ? { id: activeTableId, name: 'Product Roadmap 2026' } : null,
    fields,
    rows: rows.map(r => ({ id: r.id, ...r.data }))
  });

  const togglePlugin = useCallback((id: string) => {
    if (pluginRegistry.isActive(id)) {
      pluginRegistry.deactivate(id);
    } else {
      pluginRegistry.activate(id, {
        supabase,
        currentWorkspace: workspaces[0],
        currentTable: { id: activeTableId, name: 'Product Roadmap 2026' },
        fields,
        rows: rows.map(r => ({ id: r.id, ...r.data })),
        addMenuItem: () => {},
        registerView: () => {},
        registerFieldRenderer: () => {},
        showNotification: (msg) => console.log(msg)
      });
    }
    // Force refresh the hook state
    window.dispatchEvent(new CustomEvent('plugin-state-changed'));
  }, [activeTableId, fields, rows, workspaces]);

  // 4. Realtime
  const handleRealtimeUpdate = useCallback((payload: { eventType: string; new: any; old: any }) => {
    if (payload.eventType === 'INSERT') {
      setRows(prev => prev.find(r => r.id === payload.new.id) ? prev : [...prev, payload.new]);
    } else if (payload.eventType === 'UPDATE') {
      setRows(prev => prev.map(row => row.id === payload.new.id ? payload.new : row));
    } else if (payload.eventType === 'DELETE') {
      setRows(prev => prev.filter(row => row.id === payload.old.id));
    }
  }, [setRows]);

  useRealtimeRows(supabase, activeTableId || '', handleRealtimeUpdate);

  // 5. Data Transformation
  const processedRows = useMemo(() => {
    let result = rows.map(r => ({ id: r.id, ...r.data }));

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(row => Object.values(row).some(val => typeof val === 'string' && val.toLowerCase().includes(q)));
    }

    if (filters.length > 0) {
      result = result.filter(row => filters.every(f => {
        const val = row[f.fieldId];
        const target = f.value.toLowerCase();
        const current = String(val || '').toLowerCase();
        switch (f.operator) {
          case 'is': return current === target;
          case 'is not': return current !== target;
          case 'contains': return current.includes(target);
          case 'is empty': return !val || val === '';
          case 'is not empty': return !!val && val !== '';
          default: return true;
        }
      }));
    }

    if (sorts.length > 0) {
      result.sort((a, b) => {
        for (const sort of sorts) {
          const valA = a[sort.fieldId];
          const valB = b[sort.fieldId];
          if (valA === valB) continue;
          const multiplier = sort.direction === 'asc' ? 1 : -1;
          if (valA < valB) return -1 * multiplier;
          if (valA > valB) return 1 * multiplier;
        }
        return 0;
      });
    }
    return result;
  }, [rows, searchQuery, filters, sorts]);

  // 6. Handlers
  const handleUpdateCell = async (rowId: string, fieldId: string, value: unknown) => {
    const currentRow = rows.find(r => r.id === rowId);
    if (!currentRow) return;
    const newData = { ...currentRow.data, [fieldId]: value };
    setRows(prev => prev.map(r => r.id === rowId ? { ...r, data: newData } : r));
    try {
      await fetch(`/api/rows/${rowId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: newData })
      });
    } catch (err) { console.error('Update failed:', err); }
  };

  const handleAddRow = async (status?: string) => {
    if (!activeTableId) return;
    const newOrder = rows.length > 0 ? Math.max(...rows.map(r => r.order)) + 1 : 0;
    const initialData: Record<string, unknown> = {};
    if (status) {
      const statusField = fields.find(f => f.name.toLowerCase() === 'status');
      if (statusField) initialData[statusField.id] = status;
    }
    try {
      const resp = await fetch('/api/rows', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ table_id: activeTableId, data: initialData, order: newOrder })
      });
      const data = await resp.json();
      if (data.id) setRows(prev => [...prev, data]);
    } catch (err) { console.error('Insert failed:', err); }
  };

  const handleDeleteRow = async (rowId: string) => {
    setRows(prev => prev.filter(r => r.id !== rowId));
    try { await fetch(`/api/rows/${rowId}`, { method: 'DELETE' }); } catch (err) { console.error('Delete failed:', err); }
  };

  const handleAddField = async () => {
    if (!activeTableId) return;
    const name = `New Field ${fields.length + 1}`;
    try {
      await fetch('/api/fields', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ table_id: activeTableId, name, type: 'text', order: fields.length })
      });
      window.location.reload(); 
    } catch (err) { console.error('Add field failed:', err); }
  };

  const handleRenameField = async (fieldId: string, newName: string) => {
    try {
      await fetch(`/api/fields/${fieldId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName })
      });
      window.location.reload();
    } catch (err) { console.error('Rename field failed:', err); }
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
    } catch (err) { console.error('Create workspace failed:', err); }
  };

  // 7. Render Loading/Error
  if (workspacesLoading || (activeTableId && tableLoading)) return (
    <div className="w-full h-screen bg-white flex items-center justify-center font-sans">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#0058BE]"></div>
    </div>
  );

  if (workspacesError || tableError) return (
    <div className="w-full h-screen bg-white flex items-center justify-center text-red-500 p-8 text-center font-sans">
      <div className="max-w-md space-y-4">
        <h2 className="text-2xl font-bold tracking-tight">System Offline</h2>
        <p className="text-zinc-500 text-sm">Failed to establish connection with Supabase backend.</p>
        <button onClick={() => window.location.reload()} className="px-6 py-2 bg-zinc-900 text-white rounded-lg text-sm font-bold shadow-lg shadow-black/10">Reconnect System</button>
      </div>
    </div>
  );

  const completedCount = processedRows.filter((r: any) => {
    const statusVal = String(r.status || r.data?.status || '').toLowerCase();
    return statusVal.match(/completed|done/) || r.done === true;
  }).length;

  const activeWorkspace = workspaces.find(w => w.id === workspaces[0].id);

  return (
    <div className="flex flex-col w-full h-screen bg-[#F7F7F5] font-sans text-zinc-900 selection:bg-blue-100 antialiased overflow-hidden">
      {/* Top Navigation */}
      <TopNavBar 
        workspaceName={activeWorkspace?.name} 
        tableName="Product Roadmap 2026"
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />

      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar */}
        <Sidebar 
          workspaces={workspaces} 
          onCreateWorkspace={handleCreateWorkspace}
        />

        {/* Main Content Area */}
        <main className="flex-1 flex flex-col bg-white overflow-hidden relative shadow-[inset_1px_0_0_0_rgba(0,0,0,0.05)]">
          <PluginPanel 
            isOpen={isPluginsOpen} 
            onClose={() => setIsPluginsOpen(false)} 
            registry={pluginRegistry}
            onToggle={togglePlugin}
          />
          
          <div className="flex flex-col h-full overflow-hidden">
             {/* Dynamic Sub Header */}
             <div className="px-8 pt-8 pb-1 shrink-0 bg-white">
               <div className="flex items-center justify-between mb-4">
                 <div className="flex items-center space-x-3">
                   <h1 className="text-3xl font-bold text-zinc-900 tracking-tight">Product Roadmap 2026</h1>
                   {groupByFieldId && (
                     <div className="flex items-center space-x-1.5 px-2 py-1 bg-zinc-50 rounded border border-zinc-200">
                       <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest leading-none">Grouped by:</span>
                       <span className="text-[10px] font-bold text-[#0058BE] uppercase tracking-widest leading-none">Status</span>
                     </div>
                   )}
                 </div>
                 
                 <div className="flex items-center space-x-2">
                    {menuItems.map((item, idx) => (
                      <button 
                        key={idx} 
                        onClick={item.onClick} 
                        className="px-3 py-1.5 text-xs font-bold text-zinc-500 hover:bg-zinc-50 hover:text-zinc-800 border border-zinc-200 rounded-lg transition-all"
                      >
                        {item.label}
                      </button>
                    ))}
                    <button 
                      onClick={() => setIsPluginsOpen(true)} 
                      className="p-1.5 text-zinc-400 hover:text-[#0058BE] transition-colors hover:bg-zinc-50 rounded-lg"
                      title="Plugins"
                    >
                      <span className="material-symbols-outlined text-[22px]">extension</span>
                    </button>
                 </div>
               </div>

               <ViewSwitcher 
                 activeView={activeView as any} 
                 onViewChange={setActiveView} 
                 extraViews={extraViews}
                 onFilterClick={() => setActivePanel(activePanel === 'filter' ? null : 'filter')}
                 onSortClick={() => setActivePanel(activePanel === 'sort' ? null : 'sort')}
                 onNewTaskClick={() => handleAddRow()}
                 filterCount={filters.length}
               />

               <Toolbar 
                 fields={fields}
                 filters={filters}
                 sorts={sorts}
                 groupBy={groupByFieldId}
                 onUpdateFilters={setFilters}
                 onUpdateSorts={setSorts}
                 onUpdateGroupBy={setGroupByFieldId}
                 activePanel={activePanel}
                 onPanelChange={setActivePanel}
               />
             </div>

             {/* View Container */}
             <div className="flex-1 overflow-auto p-8 pt-2 scrollbar-none">
               <div className="max-w-[1400px] mx-auto animate-in fade-in duration-500">
                 {activeView === 'Table' && (
                    <DataTable 
                      fields={fields} 
                      rows={processedRows} 
                      onUpdateCell={handleUpdateCell}
                      onAddRow={() => handleAddRow()}
                      onDeleteRow={handleDeleteRow}
                      onAddField={handleAddField}
                      onRenameField={handleRenameField}
                      groupByFieldId={groupByFieldId}
                      renderers={fieldRenderers}
                    />
                 )}
                 {activeView === 'Kanban' && (
                    <KanbanBoard 
                      fields={fields}
                      rows={processedRows}
                      onUpdateCell={handleUpdateCell}
                      onAddRow={(status) => handleAddRow(status)}
                    />
                 )}
                 {activeView === 'Calendar' && (
                    <CalendarView 
                      fields={fields}
                      rows={processedRows}
                      onUpdateCell={handleUpdateCell}
                    />
                 )}
               </div>
             </div>
          </div>
        </main>

        {/* Right Side Panel */}
        <RightPanel 
          totalRows={rows.length} 
          completedRows={completedCount} 
        />
      </div>
    </div>
  );
}
