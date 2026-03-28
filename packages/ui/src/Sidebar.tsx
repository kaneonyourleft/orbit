"use client";
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Modal } from './Modal';

// ── Props ──
interface SidebarProps {
  workspaces: { id: string; name: string }[];
  tables?: { id: string; name: string; workspace_id: string }[];
  activeTableId?: string | null;
  favorites?: string[];
  isCollapsed?: boolean;

  // Workspace CRUD
  onCreateWorkspace: (name: string) => void;
  onRenameWorkspace?: (id: string, name: string) => void;
  onDeleteWorkspace?: (id: string) => void;

  // Table CRUD
  onSelectTable?: (id: string) => void;
  onCreateTable?: (workspaceId: string, name: string) => void;
  onRenameTable?: (tableId: string, name: string) => void;
  onDeleteTable?: (tableId: string) => void;
  onDuplicateTable?: (tableId: string) => void;

  // Favorites
  onToggleFavorite?: (tableId: string) => void;

  // Sidebar control
  onToggleCollapse?: () => void;
}

// ── 외부 클릭 감지 훅 ──
function useClickOutside(ref: React.RefObject<HTMLElement | null>, handler: () => void) {
  useEffect(() => {
    const listener = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) handler();
    };
    document.addEventListener('mousedown', listener);
    return () => document.removeEventListener('mousedown', listener);
  }, [ref, handler]);
}

// ── 컨텍스트 메뉴 (공용) ──
function ContextMenu({ items, position, onClose }: {
  items: { label: string; icon: string; danger?: boolean; onClick: () => void }[];
  position: { x: number; y: number };
  onClose: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useClickOutside(ref, onClose);

  return (
    <div ref={ref} style={{ top: position.y, left: position.x }}
      className="fixed z-[200] w-48 bg-white border border-zinc-200 rounded-xl shadow-2xl py-1.5 text-sm animate-in fade-in slide-in-from-top-1 duration-150">
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

// ── 인라인 편집 인풋 ──
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
        if (e.key === 'Enter' && val.trim()) { onSave(val.trim()); }
        if (e.key === 'Escape') onCancel();
      }}
      className="w-full bg-white text-[12px] font-semibold text-zinc-800 px-2 py-1 border border-primary rounded-md outline-none ring-2 ring-blue-50" />
  );
}

// ══════════════════════════════════════════════
// ██  메인 Sidebar 컴포넌트
// ══════════════════════════════════════════════
export function Sidebar({
  workspaces, tables = [], activeTableId = null, favorites = [], isCollapsed = false,
  onCreateWorkspace, onRenameWorkspace, onDeleteWorkspace,
  onSelectTable = () => {}, onCreateTable, onRenameTable, onDeleteTable, onDuplicateTable,
  onToggleFavorite, onToggleCollapse,
}: SidebarProps) {

  // ── 상태 ──
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [wsModalOpen, setWsModalOpen] = useState(false);
  const [newWsName, setNewWsName] = useState('');

  // 컨텍스트 메뉴
  const [ctxMenu, setCtxMenu] = useState<{ items: any[]; position: { x: number; y: number } } | null>(null);

  // 인라인 편집
  const [editingWsId, setEditingWsId] = useState<string | null>(null);
  const [editingTableId, setEditingTableId] = useState<string | null>(null);

  // 인라인 테이블 생성
  const [creatingTableInWs, setCreatingTableInWs] = useState<string | null>(null);

  // Favorites 섹션 접기
  const [favCollapsed, setFavCollapsed] = useState(false);

  // 자동 펼치기: 첫 워크스페이스
  useEffect(() => {
    if (workspaces.length > 0 && expandedFolders.size === 0) {
      setExpandedFolders(new Set([workspaces[0].id]));
    }
  }, [workspaces]);

  // ── 폴더 토글 ──
  const toggleFolder = (wsId: string) => {
    setExpandedFolders(prev => {
      const next = new Set(prev);
      next.has(wsId) ? next.delete(wsId) : next.add(wsId);
      return next;
    });
  };

  // ── 워크스페이스 생성 제출 ──
  const handleWsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newWsName.trim()) {
      onCreateWorkspace(newWsName.trim());
      setNewWsName('');
      setWsModalOpen(false);
    }
  };

  // ── 워크스페이스 컨텍스트 메뉴 ──
  const openWsMenu = (e: React.MouseEvent, ws: { id: string; name: string }) => {
    e.stopPropagation();
    const rect = (e.target as HTMLElement).getBoundingClientRect();
    const items = [
      ...(onRenameWorkspace ? [{ label: 'Rename', icon: 'edit', onClick: () => setEditingWsId(ws.id) }] : []),
      ...(onCreateTable ? [{ label: 'New Table', icon: 'add_circle', onClick: () => { setCreatingTableInWs(ws.id); setExpandedFolders(prev => new Set(prev).add(ws.id)); } }] : []),
      ...(onDeleteWorkspace ? [{ label: 'Delete Workspace', icon: 'delete', danger: true, onClick: () => { if (window.confirm(`Delete "${ws.name}" and all its tables?`)) onDeleteWorkspace(ws.id); } }] : []),
    ];
    if (items.length > 0) setCtxMenu({ items, position: { x: rect.left, y: rect.bottom + 4 } });
  };

  // ── 테이블 컨텍스트 메뉴 ──
  const openTableMenu = (e: React.MouseEvent, table: { id: string; name: string }) => {
    e.stopPropagation();
    const rect = (e.target as HTMLElement).getBoundingClientRect();
    const isFav = favorites.includes(table.id);
    const items = [
      ...(onRenameTable ? [{ label: 'Rename', icon: 'edit', onClick: () => setEditingTableId(table.id) }] : []),
      ...(onDuplicateTable ? [{ label: 'Duplicate', icon: 'content_copy', onClick: () => onDuplicateTable(table.id) }] : []),
      ...(onToggleFavorite ? [{ label: isFav ? 'Remove from Favorites' : 'Add to Favorites', icon: isFav ? 'star' : 'star_outline', onClick: () => onToggleFavorite(table.id) }] : []),
      ...(onDeleteTable ? [{ label: 'Delete Table', icon: 'delete', danger: true, onClick: () => { if (window.confirm(`Delete "${table.name}" and all its data?`)) onDeleteTable(table.id); } }] : []),
    ];
    if (items.length > 0) setCtxMenu({ items, position: { x: rect.left, y: rect.bottom + 4 } });
  };

  // ── Collapsed 모드 ──
  if (isCollapsed) {
    return (
      <aside className="flex flex-col w-full h-full items-center py-4 gap-3 bg-zinc-50 border-r border-zinc-200">
        <button onClick={onToggleCollapse} title="Expand sidebar"
          className="w-9 h-9 rounded-lg bg-white border border-zinc-200 shadow-sm flex items-center justify-center text-zinc-400 hover:text-primary transition-all hover:border-primary/30">
          <span className="material-symbols-outlined text-[18px]">chevron_right</span>
        </button>
        <div className="w-8 h-8 rounded-lg bg-primary-container flex items-center justify-center shadow-sm border border-blue-100">
          <span className="material-symbols-outlined text-on-primary-container text-lg">rocket_launch</span>
        </div>
        <div className="flex-1" />
        <button onClick={onToggleCollapse} title="Expand"
          className="w-9 h-9 rounded-lg flex items-center justify-center text-zinc-300 hover:text-zinc-600 hover:bg-white transition-all">
          <span className="material-symbols-outlined text-lg">menu</span>
        </button>
      </aside>
    );
  }

  // ── 즐겨찾기 테이블 목록 ──
  const favTables = tables.filter(t => favorites.includes(t.id));

  return (
    <aside className="flex flex-col w-full h-full bg-zinc-50 border-r border-zinc-200 font-sans antialiased overflow-hidden select-none">

      {/* ═══ 섹션 1: 워크스페이스 스위처 ═══ */}
      <div className="p-4 pb-0">
        <div className="flex items-center gap-3 px-1 cursor-pointer hover:bg-zinc-100/50 p-1.5 rounded-lg transition-colors group mb-2">
          <div className="w-8 h-8 rounded-lg bg-primary-container flex items-center justify-center shadow-sm shadow-blue-100 border border-blue-100 transition-transform group-active:scale-95">
            <span className="material-symbols-outlined text-on-primary-container text-xl">rocket_launch</span>
          </div>
          <div className="flex flex-col flex-1 min-w-0">
            <span className="text-[13px] font-bold text-zinc-800 tracking-tight leading-tight truncate">
              {workspaces[0]?.name || 'Workspace'}
            </span>
            <span className="text-[9px] text-zinc-400 uppercase tracking-widest font-extrabold leading-tight">Workspace OS</span>
          </div>
          <button className="ml-auto text-zinc-300 group-hover:text-zinc-500 transition-colors shrink-0">
            <span className="material-symbols-outlined text-lg">unfold_more</span>
          </button>
        </div>
      </div>

      {/* ═══ 섹션 2: 퀵 네비게이션 ═══ */}
      <nav className="px-4 flex flex-col gap-0.5 pb-2">
        {[
          { icon: 'home', label: 'Home', id: 'home' },
          { icon: 'check_circle', label: 'My Tasks', id: 'tasks' },
          { icon: 'inbox', label: 'Inbox', id: 'inbox' },
        ].map(item => (
          <button key={item.id}
            className="flex items-center gap-3 px-3 py-2 text-zinc-500 hover:text-zinc-900 hover:bg-white hover:shadow-sm border border-transparent hover:border-zinc-200 rounded-lg text-xs font-bold uppercase tracking-wider transition-all w-full text-left">
            <span className="material-symbols-outlined text-xl">{item.icon}</span>
            <span>{item.label}</span>
          </button>
        ))}
      </nav>

      {/* ═══ 메인 스크롤 영역 ═══ */}
      <div className="flex-1 overflow-y-auto hide-scrollbar px-4 pb-4">

        {/* ═══ 섹션 3: Favorites ═══ */}
        {favTables.length > 0 && (
          <div className="mb-3">
            <button onClick={() => setFavCollapsed(!favCollapsed)}
              className="flex items-center justify-between w-full px-3 py-2 text-[10px] font-extrabold text-zinc-400 uppercase tracking-widest">
              <div className="flex items-center gap-1">
                <span className={`material-symbols-outlined text-[12px] transition-transform ${favCollapsed ? '-rotate-90' : ''}`}>expand_more</span>
                <span>Favorites</span>
              </div>
              <span className="text-[9px] font-bold text-zinc-300 bg-zinc-100 px-1.5 py-0.5 rounded-full">{favTables.length}</span>
            </button>
            {!favCollapsed && (
              <div className="flex flex-col gap-0.5 mt-0.5">
                {favTables.map(table => (
                  <button key={table.id} onClick={() => onSelectTable(table.id)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-[12px] transition-all group/fav border w-full text-left ${
                      activeTableId === table.id
                        ? 'text-primary font-bold bg-primary/5 border-primary/10'
                        : 'text-zinc-500 hover:text-zinc-700 hover:bg-white hover:shadow-sm border-transparent'
                    }`}>
                    <span className="material-symbols-outlined text-amber-400 text-[14px]">star</span>
                    <span className="flex-1 truncate">{table.name}</span>
                    {onToggleFavorite && (
                      <span onClick={(e) => { e.stopPropagation(); onToggleFavorite(table.id); }}
                        className="material-symbols-outlined text-[12px] opacity-0 group-hover/fav:opacity-100 text-zinc-300 hover:text-red-400 transition-all cursor-pointer"
                        title="Remove from favorites">close</span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ═══ 섹션 4: Workspaces & Tables 트리 ═══ */}
        <div>
          <div className="flex items-center justify-between px-3 py-2 text-[10px] font-extrabold text-zinc-400 uppercase tracking-widest mb-1">
            <span>Workspaces</span>
            <button onClick={() => setWsModalOpen(true)} title="Add Workspace"
              className="p-1 hover:bg-white hover:shadow-sm border border-transparent hover:border-zinc-200 rounded transition-all text-zinc-300 hover:text-primary">
              <span className="material-symbols-outlined text-sm">add</span>
            </button>
          </div>

          <div className="space-y-1">
            {workspaces.map(ws => {
              const isExpanded = expandedFolders.has(ws.id);
              const wsTables = tables.filter(t => t.workspace_id === ws.id);
              return (
                <div key={ws.id}>
                  {/* ── 워크스페이스 행 ── */}
                  <div className={`flex items-center gap-1.5 px-2 py-2 rounded-lg transition-all cursor-pointer group/ws ${
                    isExpanded
                      ? 'text-primary bg-white shadow-sm border border-zinc-200'
                      : 'text-zinc-500 hover:bg-white hover:shadow-sm border border-transparent'
                  }`}
                    onClick={() => toggleFolder(ws.id)}>

                    <span className={`material-symbols-outlined text-sm transition-transform duration-200 shrink-0 ${isExpanded ? '' : '-rotate-90 text-zinc-300'}`}>
                      keyboard_arrow_down
                    </span>
                    <span className={`material-symbols-outlined text-base shrink-0 ${isExpanded ? 'text-primary' : 'text-zinc-300'}`}>
                      {isExpanded ? 'folder_open' : 'folder'}
                    </span>

                    {editingWsId === ws.id ? (
                      <div className="flex-1 min-w-0" onClick={e => e.stopPropagation()}>
                        <InlineEdit value={ws.name}
                          onSave={name => { onRenameWorkspace?.(ws.id, name); setEditingWsId(null); }}
                          onCancel={() => setEditingWsId(null)} />
                      </div>
                    ) : (
                      <span className={`flex-1 text-[12px] truncate ${isExpanded ? 'font-bold' : 'font-semibold'}`}>{ws.name}</span>
                    )}

                    {/* + 테이블 추가 (호버 시) */}
                    {onCreateTable && (
                      <button onClick={(e) => { e.stopPropagation(); setCreatingTableInWs(ws.id); setExpandedFolders(prev => new Set(prev).add(ws.id)); }}
                        title="Add table" className="opacity-0 group-hover/ws:opacity-100 text-zinc-300 hover:text-primary transition-all shrink-0 p-0.5 rounded hover:bg-zinc-50">
                        <span className="material-symbols-outlined text-[16px]">add</span>
                      </button>
                    )}

                    {/* ⋯ 메뉴 (호버 시) */}
                    <button onClick={(e) => openWsMenu(e, ws)}
                      title="Workspace options" className="opacity-0 group-hover/ws:opacity-100 text-zinc-300 hover:text-zinc-600 transition-all shrink-0 p-0.5 rounded hover:bg-zinc-50">
                      <span className="material-symbols-outlined text-[16px]">more_horiz</span>
                    </button>
                  </div>

                  {/* ── 테이블 목록 ── */}
                  {isExpanded && (
                    <div className="pl-5 mt-1 flex flex-col gap-0.5 border-l-2 border-primary/10 ml-5">
                      {wsTables.map(table => (
                        <div key={table.id}
                          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[12px] transition-all group/tbl border cursor-pointer ${
                            activeTableId === table.id
                              ? 'text-primary font-bold bg-primary/5 border-primary/10'
                              : 'text-zinc-400 hover:text-zinc-700 hover:bg-white hover:shadow-sm border-transparent'
                          }`}
                          onClick={() => onSelectTable(table.id)}>

                          <span className="material-symbols-outlined text-base shrink-0">table_rows</span>

                          {editingTableId === table.id ? (
                            <div className="flex-1 min-w-0" onClick={e => e.stopPropagation()}>
                              <InlineEdit value={table.name}
                                onSave={name => { onRenameTable?.(table.id, name); setEditingTableId(null); }}
                                onCancel={() => setEditingTableId(null)} />
                            </div>
                          ) : (
                            <span className="flex-1 truncate text-left">{table.name}</span>
                          )}

                          {/* ★ Favorite 토글 */}
                          {onToggleFavorite && (
                            <span onClick={(e) => { e.stopPropagation(); onToggleFavorite(table.id); }}
                              title={favorites.includes(table.id) ? 'Remove favorite' : 'Add favorite'}
                              className={`material-symbols-outlined text-[14px] shrink-0 transition-all cursor-pointer ${
                                favorites.includes(table.id)
                                  ? 'text-amber-400 opacity-100'
                                  : 'opacity-0 group-hover/tbl:opacity-100 text-zinc-300 hover:text-amber-400'
                              }`}>
                              {favorites.includes(table.id) ? 'star' : 'star_outline'}
                            </span>
                          )}

                          {/* ⋯ 테이블 메뉴 */}
                          <button onClick={(e) => { e.stopPropagation(); openTableMenu(e, table); }}
                            title="Table options"
                            className="opacity-0 group-hover/tbl:opacity-100 text-zinc-300 hover:text-zinc-600 transition-all shrink-0 p-0.5 rounded hover:bg-zinc-50">
                            <span className="material-symbols-outlined text-[14px]">more_horiz</span>
                          </button>
                        </div>
                      ))}

                      {/* ── 인라인 테이블 생성 ── */}
                      {creatingTableInWs === ws.id && (
                        <div className="px-2.5 py-1">
                          <InlineEdit value="" placeholder="Table name..."
                            onSave={name => { onCreateTable?.(ws.id, name); setCreatingTableInWs(null); }}
                            onCancel={() => setCreatingTableInWs(null)} />
                        </div>
                      )}

                      {/* + New Table 버튼 (항상 표시) */}
                      {onCreateTable && creatingTableInWs !== ws.id && (
                        <button onClick={() => setCreatingTableInWs(ws.id)}
                          className="flex items-center gap-2 px-2.5 py-1.5 text-[11px] text-zinc-300 hover:text-primary rounded-lg hover:bg-white/60 transition-all w-full text-left">
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

      {/* ═══ 섹션 5: Footer ═══ */}
      <div className="p-4 pt-2 border-t border-zinc-100 flex flex-col gap-0.5">
        <button className="flex items-center gap-3 px-3 py-2 text-zinc-400 hover:text-zinc-700 hover:bg-white hover:shadow-sm rounded-lg text-[11px] font-bold uppercase tracking-wider transition-all w-full text-left">
          <span className="material-symbols-outlined text-lg">settings</span>
          <span className="tracking-widest">Settings</span>
        </button>
        <button className="flex items-center gap-3 px-3 py-2 text-zinc-400 hover:text-zinc-700 hover:bg-white hover:shadow-sm rounded-lg text-[11px] font-bold uppercase tracking-wider transition-all w-full text-left">
          <span className="material-symbols-outlined text-lg">delete_sweep</span>
          <span className="tracking-widest">Trash</span>
        </button>
        {onToggleCollapse && (
          <button onClick={onToggleCollapse}
            className="flex items-center gap-3 px-3 py-2 text-zinc-300 hover:text-zinc-600 hover:bg-white rounded-lg text-[11px] font-bold uppercase tracking-wider transition-all w-full text-left mt-1">
            <span className="material-symbols-outlined text-lg">left_panel_close</span>
            <span className="tracking-widest">Collapse</span>
          </button>
        )}
      </div>

      {/* ═══ 컨텍스트 메뉴 오버레이 ═══ */}
      {ctxMenu && <ContextMenu items={ctxMenu.items} position={ctxMenu.position} onClose={() => setCtxMenu(null)} />}

      {/* ═══ 워크스페이스 생성 모달 ═══ */}
      <Modal isOpen={wsModalOpen} onClose={() => setWsModalOpen(false)} title="Create Workspace">
        <form onSubmit={handleWsSubmit} className="space-y-4">
          <div>
            <label htmlFor="ws-name-input" className="block text-xs font-semibold text-zinc-400 uppercase mb-2">Workspace Name</label>
            <input id="ws-name-input" autoFocus
              className="w-full bg-white text-zinc-800 text-sm px-3 py-2 rounded-lg border border-zinc-200 focus:border-primary outline-none placeholder:text-zinc-300 transition-all"
              placeholder="e.g. Design Team, Q1 Roadmap..."
              value={newWsName} onChange={e => setNewWsName(e.target.value)} />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setWsModalOpen(false)}
              className="px-4 py-2 text-sm font-semibold text-zinc-500 hover:text-zinc-700 transition-colors">Cancel</button>
            <button type="submit" disabled={!newWsName.trim()}
              className="px-4 py-2 bg-primary hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-all disabled:opacity-50">Create</button>
          </div>
        </form>
      </Modal>
    </aside>
  );
}
