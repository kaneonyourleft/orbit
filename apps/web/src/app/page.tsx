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
  const [allTables, setAllTables] = useState<{ id: string; name: string; workspace_id: string }[]>([]);
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
  
  // 1. Load Workspaces & Tables
  const { workspaces, loading: workspacesLoading, error: workspacesError } = useWorkspaces(supabase);
  
  const fetchTables = useCallback(async () => {
    if (workspaces.length === 0) return;
    const { data } = await supabase.from('tables').select('*');
    if (data) setAllTables(data);
  }, [workspaces]);

  useEffect(() => {
    fetchTables();
  }, [fetchTables]);

  const activeTable = useMemo(() => allTables.find(t => t.id === activeTableId), [allTables, activeTableId]);
  const activeTableName = activeTable?.name || 'Table';

  // Automatically select the first table
  useEffect(() => {
    if (workspaces.length > 0 && !activeTableId && allTables.length > 0) {
      const firstTable = allTables.find(t => t.workspace_id === workspaces[0].id);
      if (firstTable) setActiveTableId(firstTable.id);
    }
  }, [workspaces, allTables, activeTableId]);

  const refreshTable = () => {
    const currentId = activeTableId;
    setActiveTableId(null);
    setTimeout(() => setActiveTableId(currentId), 1);
  };

  // 2. Load Table
  const { fields, rows, loading: tableLoading, error: tableError, setRows } = useTable(supabase, activeTableId || '');


  // 3. Plugin System
  const { extraViews, fieldRenderers, menuItems } = usePlugins(plugins, {
    supabase,
    currentWorkspace: workspaces[0],
    currentTable: activeTableId ? { id: activeTableId, name: activeTableName } : null,
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
        currentTable: { id: activeTableId, name: activeTableName },
        fields,
        rows: rows.map(r => ({ id: r.id, ...r.data })),
        addMenuItem: () => {},
        registerView: () => {},
        registerFieldRenderer: () => {},
        showNotification: (msg) => console.log(msg)
      });
    }
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
    // Standardize data from JSONB
    let result = rows.map(r => ({ 
      id: r.id, 
      order: r.order, 
      done: r.data?.done === true, // Ensure done is accessible directly
      ...r.data 
    }));

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
    } else {
      result.sort((a, b) => (a.order || 0) - (b.order || 0));
    }
    return result;
  }, [rows, searchQuery, filters, sorts]);

  // 6. Handlers
  const handleUpdateCell = async (rowId: string, fieldId: string, value: unknown) => {
    const currentRow = rows.find(r => r.id === rowId);
    if (!currentRow) return;
    
    const newData = { ...currentRow.data };
    if (fieldId === 'done') {
      newData.done = value;
    } else {
      newData[fieldId] = value;
    }
    
    // Optimistic Update
    setRows(prev => prev.map(r => r.id === rowId ? { ...r, data: newData } : r));
    
    try {
      const { error } = await supabase
        .from('rows')
        .update({ data: newData })
        .eq('id', rowId);
      
      if (error) throw error;
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
      const { data, error } = await supabase
        .from('rows')
        .insert({ table_id: activeTableId, data: initialData, order: newOrder })
        .select()
        .single();
      
      if (error) throw error;
      if (data) setRows(prev => [...prev, data]);
    } catch (err) { console.error('Insert failed:', err); }
  };

  const handleDeleteRow = async (rowId: string) => {
    setRows(prev => prev.filter(r => r.id !== rowId));
    try { 
      const { error } = await supabase
        .from('rows')
        .delete()
        .eq('id', rowId);
      if (error) throw error;
    } catch (err) { console.error('Delete failed:', err); }
  };

  const handleAddField = async () => {
    if (!activeTableId) return;
    const name = `New Field ${fields.length + 1}`;
    try {
      const { error } = await supabase
        .from('fields')
        .insert({ table_id: activeTableId, name, type: 'text', order: fields.length });
      
      if (error) throw error;
      refreshTable(); 
    } catch (err) { console.error('Add field failed:', err); }
  };

  const handleRenameField = async (fieldId: string, newName: string) => {
    try {
      const { error } = await supabase
        .from('fields')
        .update({ name: newName })
        .eq('id', fieldId);
      
      if (error) throw error;
      refreshTable();
    } catch (err) { console.error('Rename field failed:', err); }
  };

  const handleCreateWorkspace = async (name: string) => {
    const slug = name.toLowerCase().replace(/\s+/g, '-');
    try {
      const { error } = await supabase
        .from('workspaces')
        .insert({ name, slug });
      
      if (error) throw error;
      refreshTable();
    } catch (err) { console.error('Create workspace failed:', err); }
  };

  // 7. Render Loading/Error
  if (workspacesLoading || (activeTableId && tableLoading)) return (
    <div className="w-full h-screen bg-white flex items-center justify-center font-sans">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
    </div>
  );

  if (workspacesError || tableError) return (
    <div className="w-full h-screen bg-white flex items-center justify-center text-red-500 p-8 text-center font-sans antialiased">
      <div className="max-w-md space-y-4">
        <h2 className="text-2xl font-black tracking-tighter">System Offline</h2>
        <p className="text-zinc-500 text-sm font-bold">Failed to establish connection with Supabase backend.</p>
        <button onClick={() => refreshTable()} className="px-6 py-2 bg-zinc-900 text-white rounded-xl text-sm font-black shadow-lg shadow-black/10 transition-all active:scale-95">Reconnect System</button>
      </div>
    </div>
  );

  // BUG 3: Stats Calculation
  const completedCount = processedRows.filter((r: any) => {
    const statusField = fields.find(f => f.name.toLowerCase() === 'status');
    const doneField = fields.find(f => f.type === 'checkbox');
    if (doneField && r[doneField.id] === true) return true;
    if (statusField) return String(r[statusField.id] || '').toLowerCase().includes('complete');
    return false;
  }).length;

  const activeWorkspace = workspaces.length > 0 ? workspaces[0] : null;

  return (
    <div className="flex flex-col w-full h-screen bg-white font-sans text-zinc-900 selection:bg-blue-100 antialiased overflow-hidden">
      {/* Top Navigation */}
      <TopNavBar 
        workspaceName={activeWorkspace?.name} 
        tableName={activeTableName}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />

      <div className="flex flex-1 h-[calc(100vh-56px)] relative overflow-hidden">
        {/* BUG 2: Sidebar fixed - w-64 */}
        <Sidebar 
          workspaces={workspaces} 
          onCreateWorkspace={handleCreateWorkspace}
          tables={allTables}
          activeTableId={activeTableId}
          onSelectTable={(tableId) => {
            setActiveTableId(tableId);
            setFilters([]);
            setSorts([]);
            setGroupByFieldId(null);
            setActivePanel(null);
            setActiveView('Table');
          }}
        />

        {/* BUG 2: Main Area fill with ml-64 and mr-72 OFFSETS */}
        <main className="flex-1 ml-64 mr-72 bg-white flex flex-col overflow-auto relative border-x border-zinc-100 shadow-sm">
          <PluginPanel 
            isOpen={isPluginsOpen} 
            onClose={() => setIsPluginsOpen(false)} 
            registry={pluginRegistry}
            onToggle={togglePlugin}
          />
          
          <div className="flex flex-col min-h-full">
             {/* Dynamic Sub Header */}
             <div className="px-8 pt-10 pb-4 shrink-0 bg-white sticky top-0 z-20 border-b border-zinc-50/50 backdrop-blur-md">
               <div className="flex items-center justify-between mb-6">
                 <div className="flex items-center space-x-4">
                   <h1 className="text-3xl font-black text-zinc-900 tracking-tighter">{activeTableName}</h1>
                   {groupByFieldId && (
                     <div className="flex items-center space-x-2 px-2.5 py-1 bg-blue-50/50 rounded-lg border border-blue-100/50 shadow-sm">
                       <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest leading-none">Grouped by</span>
                       <span className="text-[10px] font-black text-primary uppercase tracking-widest leading-none">
                         {fields.find(f => f.id === groupByFieldId)?.name || 'Status'}
                       </span>
                     </div>
                   )}
                 </div>
                 
                 <div className="flex items-center space-x-3">
                    <button 
                      onClick={() => setIsPluginsOpen(true)} 
                      className="flex items-center gap-2 px-3 py-1.5 text-zinc-400 hover:text-primary transition-all hover:bg-zinc-50 rounded-lg border border-transparent hover:border-zinc-200"
                      title="Plugin Management"
                    >
                      <span className="material-symbols-outlined text-[20px]">extension</span>
                      <span className="text-[11px] font-black uppercase tracking-widest">Extensions</span>
                    </button>
                 </div>
               </div>

               <ViewSwitcher 
                 activeView={activeView as any} 
                 onViewChange={setActiveView} 
                 extraViews={extraViews}
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
                 onNewRow={() => handleAddRow()}
               />
             </div>

             {/* View Container */}
             <div className="flex-1 p-8 pt-4">
               <div className="max-w-[1400px] mx-auto animate-in fade-in slide-in-from-bottom-2 duration-700">
                 {activeTableId && activeView === 'Table' && (
                    <DataTable 
                      fields={fields} 
                      rows={processedRows} 
                      onUpdateCell={handleUpdateCell}
                      onAddRow={(status) => handleAddRow(status)}
                      onDeleteRow={handleDeleteRow}
                      onAddField={handleAddField}
                      onRenameField={handleRenameField}
                      groupByFieldId={groupByFieldId}
                      renderers={fieldRenderers}
                    />
                 )}
                 {activeTableId && activeView === 'Kanban' && (
                    <KanbanBoard 
                      fields={fields}
                      rows={processedRows}
                      onUpdateCell={handleUpdateCell}
                      onAddRow={(status) => handleAddRow(status)}
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
          </div>
        </main>

        {/* BUG 2: RightPanel fixed right - MUST be outside Sidebar or main flow */}
        <RightPanel 
          totalRows={processedRows.length} 
          completedRows={completedCount}
          menuItems={menuItems}
        />
      </div>
    </div>
  );
}
