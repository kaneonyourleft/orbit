"use client";
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Modal } from './Modal';

interface SidebarProps {
  workspaces: { id: string; name: string }[];
  tables?: { id: string; name: string; workspace_id: string }[];
  activeTableId?: string | null;
  favorites?: string[];
  isCollapsed?: boolean;
  onCreateWorkspace: (name: string) => void;
  onRenameWorkspace?: (id: string, name: string) => void;
  onDeleteWorkspace?: (id: string) => void;
  onSelectTable?: (id: string) => void;
  onCreateTable?: (workspaceId: string, name: string) => void;
  onRenameTable?: (tableId: string, name: string) => void;
  onDeleteTable?: (tableId: string) => void;
  onDuplicateTable?: (tableId: string) => void;
  onToggleFavorite?: (tableId: string) => void;
  onToggleCollapse?: () => void;
}

/* ── 인라인 편집 ── */
function InlineEdit({ value, onSave, onCancel, placeholder }: {
  value: string; onSave: (v: string) => void; onCancel: () => void; placeholder?: string;
}) {
  const [val, setVal] = useState(value);
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => { ref.current?.focus(); ref.current?.select(); }, []);
  return (
    <input ref={ref} value={val} onChange={e => setVal(e.target.value)}
      placeholder={placeholder || 'Enter name...'}
      onBlur={() => { if (val.trim() && val !== value) onSave(val.trim()); else onCancel(); }}
      onKeyDown={e => {
        if (e.key === 'Enter' && val.trim()) onSave(val.trim());
        if (e.key === 'Escape') onCancel();
      }}
      className="w-full bg-white text-[12px] font-semibold text-zinc-800 px-2 py-1 border border-[#0058BE] rounded-md outline-none ring-2 ring-blue-50" />
  );
}

/* ── 컨텍스트 메뉴 ── */
function CtxMenu({ items, anchorEl, onClose }: {
  items: { label: string; icon: string; danger?: boolean; onClick: () => void }[];
  anchorEl: HTMLElement | null;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  useEffect(() => {
    if (ref.current && anchorEl) {
      const rect = anchorEl.getBoundingClientRect();
      ref.current.style.top = `${rect.bottom + 4}px`;
      ref.current.style.left = `${rect.left}px`;
    }
  }, [anchorEl]);

  return (
    <div ref={ref}
      className="fixed z-[200] w-48 bg-white border border-zinc-200 rounded-xl shadow-2xl py-1.5 text-sm animate-in fade-in duration-150">
      {items.map((item, i) => (
        <button key={i} onClick={() => { item.onClick(); onClose(); }}
          className={`w-full text-left px-3 py-2 flex items-center gap-2.5 transition-colors ${
            item.danger ? 'text-red-600 hover:bg-red-50' : 'text-zinc-700 hover:bg-zinc-50'
          }`}>
          <span className="material-symbols-outlined text-[16px]">{item.icon}</span>
          {item.label}
        </button>
      ))}
    </div>
  );
}

/* ══ MAIN SIDEBAR ══ */
export function Sidebar({
  workspaces, tables = [], activeTableId = null, favorites = [], isCollapsed = false,
  onCreateWorkspace, onRenameWorkspace, onDeleteWorkspace,
  onSelectTable = () => {}, onCreateTable, onRenameTable, onDeleteTable, onDuplicateTable,
  onToggleFavorite, onToggleCollapse,
}: SidebarProps) {
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [wsModalOpen, setWsModalOpen] = useState(false);
  const [newWsName, setNewWsName] = useState('');
  const [ctxMenu, setCtxMenu] = useState<{ items: any[]; anchorEl: HTMLElement | null } | null>(null);
  const [editingWsId, setEditingWsId] = useState<string | null>(null);
  const [editingTableId, setEditingTableId] = useState<string | null>(null);
  const [creatingTableInWs, setCreatingTableInWs] = useState<string | null>(null);
  const [favCollapsed, setFavCollapsed] = useState(false);

  useEffect(() => {
    if (workspaces.length > 0 && expandedFolders.size === 0) {
      setExpandedFolders(new Set([workspaces[0].id]));
    }
  }, [workspaces]);

  const toggleFolder = (wsId: string) => {
    setExpandedFolders(prev => {
      const next = new Set(prev);
      next.has(wsId) ? next.delete(wsId) : next.add(wsId);
      return next;
    });
  };

  const handleWsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newWsName.trim()) { onCreateWorkspace(newWsName.trim()); setNewWsName(''); setWsModalOpen(false); }
  };

  const openWsMenu = (e: React.MouseEvent, ws: { id: string; name: string }) => {
    e.stopPropagation();
    const items = [
      ...(onRenameWorkspace ? [{ label: 'Rename', icon: 'edit', onClick: () => setEditingWsId(ws.id) }] : []),
      ...(onCreateTable ? [{ label: 'New Table', icon: 'add_circle', onClick: () => { setCreatingTableInWs(ws.id); setExpandedFolders(prev => new Set(prev).add(ws.id)); } }] : []),
      ...(onDeleteWorkspace ? [{ label: 'Delete', icon: 'delete', danger: true, onClick: () => { if (window.confirm(`Delete "${ws.name}"?`)) onDeleteWorkspace(ws.id); } }] : []),
    ];
    if (items.length > 0) setCtxMenu({ items, anchorEl: e.currentTarget as HTMLElement });
  };

  const openTableMenu = (e: React.MouseEvent, table: { id: string; name: string }) => {
    e.stopPropagation();
    const isFav = favorites.includes(table.id);
    const items = [
      ...(onRenameTable ? [{ label: 'Rename', icon: 'edit', onClick: () => setEditingTableId(table.id) }] : []),
      ...(onDuplicateTable ? [{ label: 'Duplicate', icon: 'content_copy', onClick: () => onDuplicateTable(table.id) }] : []),
      ...(onToggleFavorite ? [{ label: isFav ? 'Unfavorite' : 'Favorite', icon: isFav ? 'star' : 'star_outline', onClick: () => onToggleFavorite(table.id) }] : []),
      ...(onDeleteTable ? [{ label: 'Delete', icon: 'delete', danger: true, onClick: () => { if (window.confirm(`Delete "${table.name}"?`)) onDeleteTable(table.id); } }] : []),
    ];
    if (items.length > 0) setCtxMenu({ items, anchorEl: e.currentTarget as HTMLElement });
  };

  // ── Collapsed 모드 ──
  if (isCollapsed) {
    return (
      <aside className="flex flex-col w-full h-full items-center py-4 gap-3 bg-zinc-50 border-r border-zinc-200">
        <button onClick={onToggleCollapse} title="Expand"
          className="w-9 h-9 rounded-lg bg-white border border-zinc-200 shadow-sm flex items-center justify-center text-zinc-400 hover:text-[#0058BE] transition-all">
          <span className="material-symbols-outlined text-[18px]">chevron_right</span>
        </button>
        <div className="w-8 h-8 rounded-lg bg-[#D6E3FF] flex items-center justify-center shadow-sm border border-blue-100">
          <span className="material-symbols-outlined text-[#001B3E] text-lg">rocket_launch</span>
        </div>
      </aside>
    );
  }

  const favTables = tables.filter(t => favorites.includes(t.id));

  return (
    <aside className="flex flex-col w-full h-full bg-zinc-50 border-r border-zinc-200 font-sans antialiased overflow-hidden select-none">
      {/* 헤더 */}
      <div className="p-4 pb-2">
        <div className="flex items-center gap-3 px-1 p-1.5 rounded-lg hover:bg-zinc-100/50 transition-colors cursor-pointer group">
          <div className="w-8 h-8 rounded-lg bg-[#D6E3FF] flex items-center justify-center shadow-sm border border-blue-100 group-active:scale-95 transition-transform">
            <span className="material-symbols-outlined text-[#001B3E] text-xl">rocket_launch</span>
          </div>
          <div className="flex flex-col flex-1 min-w-0">
            <span className="text-[13px] font-bold text-zinc-800 tracking-tight truncate">{workspaces[0]?.name || 'ORBIT'}</span>
            <span className="text-[9px] text-zinc-400 uppercase tracking-widest font-extrabold">Workspace OS</span>
          </div>
          <span className="material-symbols-outlined text-lg text-zinc-300 group-hover:text-zinc-500 transition-colors ml-auto">unfold_more</span>
        </div>
      </div>

      {/* 퀵 네비 */}
      <nav className="px-4 flex flex-col gap-0.5 pb-2">
        {[
          { icon: 'home', label: 'Home' },
          { icon: 'dashboard_customize', label: 'PAGE BUILDER', href: '/builder' },
          { icon: 'check_circle', label: 'My Tasks' },
          { icon: 'inbox', label: 'Inbox' },
        ].map(item => (
          item.href ? (
            <a key={item.label} href={item.href}
              className="flex items-center gap-3 px-3 py-2 text-zinc-500 hover:text-[#0058BE] hover:bg-white hover:shadow-sm border border-transparent hover:border-zinc-200 rounded-lg text-xs font-bold uppercase tracking-wider transition-all w-full text-left">
              <span className="material-symbols-outlined text-xl">{item.icon}</span>
              <span>{item.label}</span>
            </a>
          ) : (
            <button key={item.label}
              className="flex items-center gap-3 px-3 py-2 text-zinc-500 hover:text-zinc-900 hover:bg-white hover:shadow-sm border border-transparent hover:border-zinc-200 rounded-lg text-xs font-bold uppercase tracking-wider transition-all w-full text-left">
              <span className="material-symbols-outlined text-xl">{item.icon}</span>
              <span>{item.label}</span>
            </button>
          )
        ))}
      </nav>

      {/* 스크롤 영역 */}
      <div className="flex-1 overflow-y-auto hide-scrollbar px-4 pb-4">
        {/* Favorites */}
        {favTables.length > 0 && (
          <div className="mb-3">
            <button onClick={() => setFavCollapsed(!favCollapsed)}
              className="flex items-center justify-between w-full px-3 py-2 text-[10px] font-extrabold text-zinc-400 uppercase tracking-widest">
              <div className="flex items-center gap-1">
                <span className={`material-symbols-outlined text-[12px] transition-transform ${favCollapsed ? '-rotate-90' : ''}`}>expand_more</span>
                <span>Favorites</span>
              </div>
              <span className="text-[9px] text-zinc-300 bg-zinc-100 px-1.5 py-0.5 rounded-full">{favTables.length}</span>
            </button>
            {!favCollapsed && favTables.map(table => (
              <button key={table.id} onClick={() => onSelectTable(table.id)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-[12px] transition-all group/fav border w-full text-left ${
                  activeTableId === table.id ? 'text-[#0058BE] font-bold bg-[#0058BE]/5 border-[#0058BE]/10' : 'text-zinc-500 hover:text-zinc-700 hover:bg-white border-transparent'
                }`}>
                <span className="material-symbols-outlined text-amber-400 text-[14px]">star</span>
                <span className="flex-1 truncate">{table.name}</span>
              </button>
            ))}
          </div>
        )}

        {/* Workspaces */}
        <div>
          <div className="flex items-center justify-between px-3 py-2 text-[10px] font-extrabold text-zinc-400 uppercase tracking-widest mb-1">
            <span>Workspaces</span>
            <button onClick={() => setWsModalOpen(true)} title="Add Workspace"
              className="p-1 hover:bg-white border border-transparent hover:border-zinc-200 rounded text-zinc-300 hover:text-[#0058BE] transition-all">
              <span className="material-symbols-outlined text-sm">add</span>
            </button>
          </div>

          {workspaces.length === 0 && (
            <div className="flex flex-col items-center py-8 text-center">
              <span className="material-symbols-outlined text-zinc-200 text-[32px] mb-2">folder_off</span>
              <p className="text-[11px] text-zinc-400 font-bold">No workspaces yet</p>
              <button onClick={() => setWsModalOpen(true)}
                className="mt-3 text-[11px] font-bold text-[#0058BE] hover:underline">+ Create one</button>
            </div>
          )}

          <div className="space-y-1">
            {workspaces.map(ws => {
              const isExpanded = expandedFolders.has(ws.id);
              const wsTables = tables.filter(t => t.workspace_id === ws.id);
              return (
                <div key={ws.id}>
                  <div className={`flex items-center gap-1.5 px-2 py-2 rounded-lg transition-all cursor-pointer group/ws ${
                    isExpanded ? 'text-[#0058BE] bg-white shadow-sm border border-zinc-200' : 'text-zinc-500 hover:bg-white border border-transparent'
                  }`} onClick={() => toggleFolder(ws.id)}>
                    <span className={`material-symbols-outlined text-sm transition-transform shrink-0 ${isExpanded ? '' : '-rotate-90 text-zinc-300'}`}>keyboard_arrow_down</span>
                    <span className={`material-symbols-outlined text-base shrink-0 ${isExpanded ? 'text-[#0058BE]' : 'text-zinc-300'}`}>{isExpanded ? 'folder_open' : 'folder'}</span>
                    {editingWsId === ws.id ? (
                      <div className="flex-1 min-w-0" onClick={e => e.stopPropagation()}>
                        <InlineEdit value={ws.name} onSave={name => { onRenameWorkspace?.(ws.id, name); setEditingWsId(null); }} onCancel={() => setEditingWsId(null)} />
                      </div>
                    ) : (
                      <span className={`flex-1 text-[12px] truncate ${isExpanded ? 'font-bold' : 'font-semibold'}`}>{ws.name}</span>
                    )}
                    {onCreateTable && (
                      <button onClick={e => { e.stopPropagation(); setCreatingTableInWs(ws.id); setExpandedFolders(prev => new Set(prev).add(ws.id)); }}
                        title="Add table" className="opacity-0 group-hover/ws:opacity-100 text-zinc-300 hover:text-[#0058BE] transition-all shrink-0 p-0.5 rounded hover:bg-zinc-50">
                        <span className="material-symbols-outlined text-[16px]">add</span>
                      </button>
                    )}
                    <button onClick={e => openWsMenu(e, ws)} title="Options"
                      className="opacity-0 group-hover/ws:opacity-100 text-zinc-300 hover:text-zinc-600 transition-all shrink-0 p-0.5 rounded hover:bg-zinc-50">
                      <span className="material-symbols-outlined text-[16px]">more_horiz</span>
                    </button>
                  </div>

                  {isExpanded && (
                    <div className="pl-5 mt-1 flex flex-col gap-0.5 border-l-2 border-[#0058BE]/10 ml-5">
                      {wsTables.map(table => (
                        <div key={table.id} onClick={() => onSelectTable(table.id)}
                          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[12px] transition-all group/tbl border cursor-pointer ${
                            activeTableId === table.id ? 'text-[#0058BE] font-bold bg-[#0058BE]/5 border-[#0058BE]/10' : 'text-zinc-400 hover:text-zinc-700 hover:bg-white border-transparent'
                          }`}>
                          <span className="material-symbols-outlined text-base shrink-0">table_rows</span>
                          {editingTableId === table.id ? (
                            <div className="flex-1 min-w-0" onClick={e => e.stopPropagation()}>
                              <InlineEdit value={table.name} onSave={name => { onRenameTable?.(table.id, name); setEditingTableId(null); }} onCancel={() => setEditingTableId(null)} />
                            </div>
                          ) : (
                            <span className="flex-1 truncate text-left">{table.name}</span>
                          )}
                          {onToggleFavorite && (
                            <span onClick={e => { e.stopPropagation(); onToggleFavorite(table.id); }}
                              className={`material-symbols-outlined text-[14px] shrink-0 cursor-pointer transition-all ${
                                favorites.includes(table.id) ? 'text-amber-400 opacity-100' : 'opacity-0 group-hover/tbl:opacity-100 text-zinc-300 hover:text-amber-400'
                              }`}>{favorites.includes(table.id) ? 'star' : 'star_outline'}</span>
                          )}
                          <button onClick={e => { e.stopPropagation(); openTableMenu(e, table); }}
                            className="opacity-0 group-hover/tbl:opacity-100 text-zinc-300 hover:text-zinc-600 transition-all shrink-0 p-0.5 rounded hover:bg-zinc-50">
                            <span className="material-symbols-outlined text-[14px]">more_horiz</span>
                          </button>
                        </div>
                      ))}
                      {creatingTableInWs === ws.id && (
                        <div className="px-2.5 py-1">
                          <InlineEdit value="" placeholder="Table name..." onSave={name => { onCreateTable?.(ws.id, name); setCreatingTableInWs(null); }} onCancel={() => setCreatingTableInWs(null)} />
                        </div>
                      )}
                      {onCreateTable && creatingTableInWs !== ws.id && (
                        <button onClick={() => setCreatingTableInWs(ws.id)}
                          className="flex items-center gap-2 px-2.5 py-2 text-[11px] font-semibold text-zinc-400 hover:text-primary rounded-lg hover:bg-white border border-transparent hover:border-zinc-200 hover:shadow-sm transition-all w-full text-left">
                          <span className="material-symbols-outlined text-[14px]">add</span>
                          <span>New Table</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 pt-2 border-t border-zinc-100 flex flex-col gap-0.5">
        <button className="flex items-center gap-3 px-3 py-2 text-zinc-400 hover:text-zinc-700 hover:bg-white rounded-lg text-[11px] font-bold uppercase tracking-wider transition-all w-full text-left">
          <span className="material-symbols-outlined text-lg">settings</span><span>Settings</span>
        </button>
        {onToggleCollapse && (
          <button onClick={onToggleCollapse}
            className="flex items-center gap-3 px-3 py-2 text-zinc-300 hover:text-zinc-600 hover:bg-white rounded-lg text-[11px] font-bold uppercase tracking-wider transition-all w-full text-left">
            <span className="material-symbols-outlined text-lg">left_panel_close</span><span>Collapse</span>
          </button>
        )}
      </div>

      {ctxMenu && <CtxMenu items={ctxMenu.items} anchorEl={ctxMenu.anchorEl} onClose={() => setCtxMenu(null)} />}

      <Modal isOpen={wsModalOpen} onClose={() => setWsModalOpen(false)} title="Create Workspace">
        <form onSubmit={handleWsSubmit} className="space-y-4">
          <div>
            <label htmlFor="sidebar-ws-name" className="block text-xs font-semibold text-zinc-400 uppercase mb-2">Workspace Name</label>
            <input id="sidebar-ws-name" autoFocus value={newWsName} onChange={e => setNewWsName(e.target.value)}
              className="w-full bg-white text-zinc-800 text-sm px-3 py-2 rounded-lg border border-zinc-200 focus:border-[#0058BE] outline-none placeholder:text-zinc-300"
              placeholder="e.g. Design Team, Q1 Roadmap..." />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setWsModalOpen(false)} className="px-4 py-2 text-sm font-semibold text-zinc-500">Cancel</button>
            <button type="submit" disabled={!newWsName.trim()} className="px-4 py-2 bg-[#0058BE] text-white text-sm font-semibold rounded-lg disabled:opacity-50">Create</button>
          </div>
        </form>
      </Modal>
    </aside>
  );
}
