"use client";
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import './DataTable.css';

// ── 타입 ──
interface OrbitField {
  id: string; name: string; type: string;
  options?: Record<string, any>; order: number;
}

interface DataTableProps {
  fields: OrbitField[];
  rows: Record<string, any>[];
  onUpdateCell: (rowId: string, fieldId: string, value: any) => void;
  onAddRow: (defaultData?: Record<string, any>) => void;
  onDeleteRow: (rowId: string) => void;
  onAddField: () => void;
  onRenameField: (fieldId: string, newName: string) => void;
  onDeleteField?: (fieldId: string) => void;
  onChangeFieldType?: (fieldId: string, newType: string) => void;
  onReorderField?: (fieldId: string, direction: 'left' | 'right') => void;
  onDuplicateRow?: (rowId: string) => void;
  onReorderRow?: (rowId: string, direction: 'up' | 'down') => void;
  groupByFieldId?: string | null;
  onGroupBy?: (fieldId: string | null) => void;
  renderers?: Record<string, any>;
}

// ── 상태 뱃지 스타일 ──
const STATUS_STYLES: Record<string, string> = {
  'in progress': 'bg-blue-50 text-blue-700 border border-blue-200',
  'planned': 'bg-zinc-100 text-zinc-600 border border-zinc-200',
  'stuck': 'bg-red-50 text-red-700 border border-red-200',
  'completed': 'bg-emerald-50 text-emerald-700 border border-emerald-200',
  'done': 'bg-emerald-50 text-emerald-700 border border-emerald-200',
};
const PRIORITY_STYLES: Record<string, string> = {
  'critical': 'bg-red-50 text-red-700 border border-red-200',
  'high': 'bg-amber-50 text-amber-700 border border-amber-200',
  'mid': 'bg-zinc-100 text-zinc-600 border border-zinc-200',
  'medium': 'bg-zinc-100 text-zinc-600 border border-zinc-200',
  'low': 'bg-emerald-50 text-emerald-700 border border-emerald-200',
};

const STATUS_OPTIONS = ['In Progress', 'Planned', 'Stuck', 'Completed'];
const PRIORITY_OPTIONS = ['Critical', 'High', 'Mid', 'Low'];
const FIELD_TYPES = ['text', 'number', 'select', 'date', 'checkbox', 'link'];

function getFieldIcon(type: string) {
  switch (type) {
    case 'text': return 'title';
    case 'number': return 'tag';
    case 'select': return 'list';
    case 'date': return 'calendar_today';
    case 'checkbox': return 'check_box';
    case 'link': return 'link';
    default: return 'text_fields';
  }
}

// ══════════════════════════════════════
// Portal 드롭다운 래퍼 — 모든 메뉴를 body에 렌더
// ══════════════════════════════════════
function Portal({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  if (!mounted) return null;
  return createPortal(children, document.body);
}

function useClickOutside(ref: React.RefObject<HTMLElement | null>, handler: () => void) {
  useEffect(() => {
    const listener = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) handler();
    };
    document.addEventListener('mousedown', listener);
    return () => document.removeEventListener('mousedown', listener);
  }, [ref, handler]);
}

// ══════════════════════════════════════
// 필드 헤더 메뉴 (fixed + portal)
// ══════════════════════════════════════
function FieldHeaderMenu({ field, anchor, onRename, onDelete, onChangeType, onReorder, onClose }: {
  field: OrbitField;
  anchor: { top: number; left: number };
  onRename: (id: string, name: string) => void;
  onDelete?: (id: string) => void;
  onChangeType?: (id: string, type: string) => void;
  onReorder?: (id: string, dir: 'left' | 'right') => void;
  onClose: () => void;
}) {
  const [view, setView] = useState<'main' | 'rename' | 'type'>('main');
  const [nameVal, setNameVal] = useState(field.name);
  const menuRef = useRef<HTMLDivElement>(null);
  useClickOutside(menuRef, onClose);

  useEffect(() => {
    if (menuRef.current) {
      menuRef.current.style.setProperty('--menu-top', `${anchor.top}px`);
      menuRef.current.style.setProperty('--menu-left', `${anchor.left}px`);
    }
  }, [anchor]);

  return (
    <Portal>
      <div ref={menuRef}
        className="portal-menu w-52 bg-white border border-zinc-200 rounded-xl shadow-2xl z-[300] py-1.5 text-[13px] text-zinc-700">
        {view === 'main' && (
          <>
            <button onClick={() => setView('rename')} className="w-full text-left px-3 py-2 hover:bg-zinc-50 flex items-center gap-2.5">
              <span className="material-symbols-outlined text-[16px] text-zinc-400">edit</span>Rename
            </button>
            <button onClick={() => setView('type')} className="w-full text-left px-3 py-2 hover:bg-zinc-50 flex items-center gap-2.5">
              <span className="material-symbols-outlined text-[16px] text-zinc-400">swap_horiz</span>Change type
              <span className="ml-auto text-[11px] text-zinc-400">{field.type}</span>
            </button>
            {onReorder && (
              <>
                <button onClick={() => { onReorder(field.id, 'left'); onClose(); }} className="w-full text-left px-3 py-2 hover:bg-zinc-50 flex items-center gap-2.5">
                  <span className="material-symbols-outlined text-[16px] text-zinc-400">chevron_left</span>Move left
                </button>
                <button onClick={() => { onReorder(field.id, 'right'); onClose(); }} className="w-full text-left px-3 py-2 hover:bg-zinc-50 flex items-center gap-2.5">
                  <span className="material-symbols-outlined text-[16px] text-zinc-400">chevron_right</span>Move right
                </button>
              </>
            )}
            <div className="border-t border-zinc-100 my-1" />
            {onDelete && (
              <button onClick={() => { onDelete(field.id); onClose(); }} className="w-full text-left px-3 py-2 hover:bg-red-50 text-red-600 flex items-center gap-2.5">
                <span className="material-symbols-outlined text-[16px]">delete</span>Delete field
              </button>
            )}
          </>
        )}
        {view === 'rename' && (
          <div className="px-3 py-2">
            <input autoFocus value={nameVal} onChange={e => setNameVal(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && nameVal.trim()) { onRename(field.id, nameVal.trim()); onClose(); } if (e.key === 'Escape') onClose(); }}
              placeholder="Field name" title="Rename field"
              className="w-full px-2 py-1.5 border border-zinc-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary focus:border-primary" />
            <div className="flex gap-2 mt-2">
              <button onClick={() => setView('main')} className="text-xs text-zinc-500 hover:text-zinc-700">Back</button>
              <button onClick={() => { onRename(field.id, nameVal.trim()); onClose(); }} className="text-xs text-primary font-bold">Save</button>
            </div>
          </div>
        )}
        {view === 'type' && (
          <div className="py-1">
            <button onClick={() => setView('main')} className="w-full text-left px-3 py-1.5 text-xs text-zinc-400 hover:text-zinc-600">← Back</button>
            {FIELD_TYPES.map(t => (
              <button key={t} onClick={() => { onChangeType?.(field.id, t); onClose(); }}
                className={`w-full text-left px-3 py-2 hover:bg-zinc-50 flex items-center gap-2.5 text-[13px] ${t === field.type ? 'bg-primary/5 text-primary font-semibold' : ''}`}>
                <span className="material-symbols-outlined text-[16px]">{getFieldIcon(t)}</span>
                <span className="capitalize">{t}</span>
                {t === field.type && <span className="material-symbols-outlined text-[14px] ml-auto">check</span>}
              </button>
            ))}
          </div>
        )}
      </div>
    </Portal>
  );
}

// ══════════════════════════════════════
// 셀렉트 드롭다운 (fixed + portal)
// ══════════════════════════════════════
function SelectDropdown({ value, options, styles, anchor, onChange, onClose }: {
  value: string; options: string[]; styles: Record<string, string>;
  anchor: { top: number; left: number };
  onChange: (v: string) => void; onClose: () => void;
}) {
  const [customVal, setCustomVal] = useState('');
  const ref = useRef<HTMLDivElement>(null);
  useClickOutside(ref, onClose);

  useEffect(() => {
    if (ref.current) {
      ref.current.style.setProperty('--dropdown-top', `${anchor.top}px`);
      ref.current.style.setProperty('--dropdown-left', `${anchor.left}px`);
    }
  }, [anchor]);

  return (
    <Portal>
      <div ref={ref}
        className="portal-dropdown w-48 bg-white border border-zinc-200 rounded-xl shadow-2xl z-[300] py-1.5">
        {options.map(opt => (
          <button key={opt} onClick={() => { onChange(opt); onClose(); }}
            className={`w-full text-left px-3 py-1.5 text-[13px] hover:bg-zinc-50 flex items-center gap-2 ${opt.toLowerCase() === value?.toLowerCase() ? 'bg-zinc-50 font-medium' : ''}`}>
            <span className={`inline-block px-2 py-0.5 rounded-md text-xs ${styles[opt.toLowerCase()] || 'bg-zinc-100 text-zinc-600'}`}>{opt}</span>
            {opt.toLowerCase() === value?.toLowerCase() && <span className="material-symbols-outlined text-[14px] ml-auto text-emerald-600">check</span>}
          </button>
        ))}
        <div className="border-t border-zinc-100 mt-1 pt-1 px-3 pb-2">
          <input placeholder="Add option..." value={customVal} onChange={e => setCustomVal(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && customVal.trim()) { onChange(customVal.trim()); onClose(); } }}
            title="Add option"
            className="w-full text-xs px-2 py-1 border border-zinc-200 rounded-lg outline-none focus:ring-1 focus:ring-primary" />
        </div>
      </div>
    </Portal>
  );
}

// ══════════════════════════════════════
// 행 컨텍스트 메뉴 (fixed + portal)
// ══════════════════════════════════════
function RowMenu({ rowId, anchor, onDelete, onDuplicate, onReorder, onClose }: {
  rowId: string; anchor: { top: number; left: number };
  onDelete: (id: string) => void;
  onDuplicate?: (id: string) => void;
  onReorder?: (id: string, dir: 'up' | 'down') => void;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useClickOutside(ref, onClose);

  useEffect(() => {
    if (ref.current) {
      ref.current.style.setProperty('--row-top', `${anchor.top}px`);
      ref.current.style.setProperty('--row-left', `${anchor.left}px`);
    }
  }, [anchor]);

  return (
    <Portal>
      <div ref={ref}
        className="portal-row-menu w-40 bg-white border border-zinc-200 rounded-xl shadow-2xl z-[300] py-1 text-[13px]">
        {onDuplicate && (
          <button onClick={() => { onDuplicate(rowId); onClose(); }} className="w-full text-left px-3 py-2 hover:bg-zinc-50 flex items-center gap-2.5 text-zinc-700">
            <span className="material-symbols-outlined text-[16px] text-zinc-400">content_copy</span>Duplicate
          </button>
        )}
        {onReorder && (
          <>
            <button onClick={() => { onReorder(rowId, 'up'); onClose(); }} className="w-full text-left px-3 py-2 hover:bg-zinc-50 flex items-center gap-2.5 text-zinc-700">
              <span className="material-symbols-outlined text-[16px] text-zinc-400">arrow_upward</span>Move up
            </button>
            <button onClick={() => { onReorder(rowId, 'down'); onClose(); }} className="w-full text-left px-3 py-2 hover:bg-zinc-50 flex items-center gap-2.5 text-zinc-700">
              <span className="material-symbols-outlined text-[16px] text-zinc-400">arrow_downward</span>Move down
            </button>
          </>
        )}
        <div className="border-t border-zinc-100 my-1" />
        <button onClick={() => { onDelete(rowId); onClose(); }} className="w-full text-left px-3 py-2 hover:bg-red-50 flex items-center gap-2.5 text-red-600">
          <span className="material-symbols-outlined text-[16px]">delete</span>Delete
        </button>
      </div>
    </Portal>
  );
}

// ══════════════════════════════════════
// 인라인 셀 에디터
// ══════════════════════════════════════
function InlineCell({ field, value, onSave, renderers = {} }: {
  field: OrbitField; value: any; onSave: (v: any) => void; renderers?: Record<string, any>;
}) {
  const [editing, setEditing] = useState(false);
  const [localVal, setLocalVal] = useState(value ?? '');
  const inputRef = useRef<HTMLInputElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const [dropdownAnchor, setDropdownAnchor] = useState({ top: 0, left: 0 });

  useEffect(() => { if (editing && inputRef.current) inputRef.current.focus(); }, [editing]);
  useEffect(() => { setLocalVal(value ?? ''); }, [value]);

  const save = useCallback(() => {
    setEditing(false);
    if (localVal !== value) onSave(field.type === 'number' ? Number(localVal) : localVal);
  }, [localVal, value, onSave, field.type]);

  const openDropdown = () => {
    if (btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      setDropdownAnchor({ top: rect.bottom + 4, left: rect.left });
    }
    setEditing(!editing);
  };

  const isSelectLike = field.type === 'select' || field.name.toLowerCase() === 'status' || field.name.toLowerCase() === 'priority';

  if (renderers[field.type] && !isSelectLike) {
    return React.createElement(renderers[field.type], { value, field, onChange: onSave });
  }

  // Checkbox
  if (field.type === 'checkbox') {
    const checked = value === true || value === 'true';
    return (
      <button onClick={() => onSave(!checked)}
        className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${checked ? 'bg-emerald-500 border-emerald-500' : 'border-zinc-300 hover:border-emerald-400'}`}>
        {checked && <span className="material-symbols-outlined text-white text-[14px]">check</span>}
      </button>
    );
  }

  // Select / Status / Priority
  if (isSelectLike) {
    const isStatus = field.name.toLowerCase() === 'status';
    const isPriority = field.name.toLowerCase() === 'priority';
    const options = isStatus ? STATUS_OPTIONS : isPriority ? PRIORITY_OPTIONS : ((field.options as any)?.values || ['Option A', 'Option B']);
    const styleMap = isStatus ? STATUS_STYLES : isPriority ? PRIORITY_STYLES : {};
    const display = value || '—';
    const badgeStyle = styleMap[display.toLowerCase()] || 'bg-zinc-100 text-zinc-600 border border-zinc-200';

    return (
      <>
        <button ref={btnRef} onClick={openDropdown}
          className={`px-2.5 py-1 rounded-lg text-xs font-medium ${badgeStyle} hover:opacity-80 transition-opacity`}>
          {display}
        </button>
        {editing && (
          <SelectDropdown value={display} options={options} styles={styleMap} anchor={dropdownAnchor}
            onChange={v => { onSave(v); setEditing(false); }} onClose={() => setEditing(false)} />
        )}
      </>
    );
  }

  // Date
  if (field.type === 'date') {
    if (editing) {
      return (
        <input ref={inputRef} type="date" value={localVal}
          onChange={e => setLocalVal(e.target.value)}
          onBlur={save} onKeyDown={e => { if (e.key === 'Enter') save(); if (e.key === 'Escape') setEditing(false); }}
          title="Pick a date"
          className="px-2 py-1 border border-zinc-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary w-36" />
      );
    }
    const isOverdue = value && new Date(value) < new Date(new Date().toDateString());
    return (
      <button onClick={() => setEditing(true)}
        className={`text-sm hover:bg-zinc-50 px-2 py-1 rounded-lg transition-colors ${isOverdue ? 'text-red-600 font-medium' : 'text-zinc-600'}`}>
        {value ? new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
        {isOverdue && <span className="ml-1 text-[10px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded-full font-medium">overdue</span>}
      </button>
    );
  }

  // Link
  if (field.type === 'link') {
    if (editing) {
      return (
        <input ref={inputRef} type="url" value={localVal} placeholder="https://..."
          onChange={e => setLocalVal(e.target.value)}
          onBlur={save} onKeyDown={e => { if (e.key === 'Enter') save(); if (e.key === 'Escape') setEditing(false); }}
          title="Paste a link"
          className="px-2 py-1 border border-zinc-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary w-full" />
      );
    }
    return value ? (
      <div className="flex items-center gap-1">
        <a href={value} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline truncate max-w-[160px]">{value}</a>
        <button onClick={() => setEditing(true)} className="text-zinc-400 hover:text-zinc-600">
          <span className="material-symbols-outlined text-[14px]">edit</span>
        </button>
      </div>
    ) : (
      <button onClick={() => setEditing(true)} className="text-sm text-zinc-400 hover:text-zinc-600">—</button>
    );
  }

  // Owner
  const isOwner = field.name.toLowerCase() === 'owner' && field.type === 'text';
  if (isOwner) {
    if (editing) {
      return (
        <input ref={inputRef} type="text" value={localVal} onChange={e => setLocalVal(e.target.value)}
          onBlur={save} onKeyDown={e => { if (e.key === 'Enter') save(); if (e.key === 'Escape') { setLocalVal(value ?? ''); setEditing(false); } }}
          title="Edit owner"
          className="w-full px-2 py-1 border border-zinc-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary bg-white" />
      );
    }
    const displayName = value || '';
    const initial = displayName ? displayName.charAt(0).toUpperCase() : '?';
    const colors = ['bg-blue-100 text-blue-700', 'bg-emerald-100 text-emerald-700', 'bg-amber-100 text-amber-700', 'bg-purple-100 text-purple-700', 'bg-rose-100 text-rose-700', 'bg-cyan-100 text-cyan-700'];
    const colorIdx = displayName ? displayName.charCodeAt(0) % colors.length : 0;
    return (
      <button onClick={() => setEditing(true)} className="flex items-center gap-2 hover:bg-zinc-50 px-1.5 py-1 rounded-lg transition-colors">
        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black shrink-0 ${colors[colorIdx]}`}>{initial}</div>
        <span className="text-sm text-zinc-700 font-medium truncate max-w-[120px]">{displayName || <span className="text-zinc-400">—</span>}</span>
      </button>
    );
  }

  // Text / Number
  if (editing) {
    return (
      <input ref={inputRef} type={field.type === 'number' ? 'number' : 'text'}
        value={localVal} onChange={e => setLocalVal(e.target.value)}
        onBlur={save} onKeyDown={e => { if (e.key === 'Enter') save(); if (e.key === 'Escape') { setLocalVal(value ?? ''); setEditing(false); } }}
        title="Edit cell"
        className="w-full px-2 py-1 border border-zinc-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary bg-white" />
    );
  }
  return (
    <button onClick={() => setEditing(true)}
      className="text-left w-full text-sm text-zinc-800 hover:bg-zinc-50 px-2 py-1 rounded-lg transition-colors min-h-[28px]">
      {value || <span className="text-zinc-400">—</span>}
    </button>
  );
}

// ══════════════════════════════════════
// 메인 DataTable
// ══════════════════════════════════════
export function DataTable({
  fields, rows, onUpdateCell, onAddRow, onDeleteRow, onAddField,
  onRenameField, onDeleteField, onChangeFieldType, onReorderField,
  onDuplicateRow, onReorderRow, groupByFieldId, onGroupBy, renderers = {}
}: DataTableProps) {
  const [activeFieldMenu, setActiveFieldMenu] = useState<{ id: string; anchor: { top: number; left: number } } | null>(null);
  const [activeRowMenu, setActiveRowMenu] = useState<{ id: string; anchor: { top: number; left: number } } | null>(null);
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());

  const sortedFields = [...fields].sort((a, b) => a.order - b.order);
  const doneField = sortedFields.find(f => f.type === 'checkbox' || f.name.toLowerCase() === 'done');
  const displayFields = sortedFields.filter(f => f.id !== doneField?.id);

  const getCellValue = (row: Record<string, any>, fieldId: string) => row[fieldId] ?? '';

  const groupField = groupByFieldId ? fields.find(f => f.id === groupByFieldId) : null;
  const groups: [string, Record<string, any>[]][] = groupField ? (() => {
    const map: Record<string, Record<string, any>[]> = {};
    rows.forEach(r => {
      const key = String(r[groupField.id] || 'No Value');
      if (!map[key]) map[key] = [];
      map[key].push(r);
    });
    return Object.entries(map);
  })() : [['All', rows]];

  const toggleGroup = (key: string) => {
    setCollapsedGroups(prev => { const next = new Set(prev); next.has(key) ? next.delete(key) : next.add(key); return next; });
  };

  // 빈 상태
  if (rows.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 bg-white border border-dashed border-zinc-200 rounded-2xl">
        <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mb-6 border border-blue-100">
          <span className="material-symbols-outlined text-primary text-[32px]">assignment_add</span>
        </div>
        <h3 className="text-lg font-bold text-zinc-800 mb-2">Start your project</h3>
        <p className="text-sm text-zinc-500 mb-8 max-w-[280px] text-center">Create your first task to get things moving.</p>
        <button onClick={() => onAddRow()}
          className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-xl font-bold text-sm shadow-lg shadow-blue-200 hover:bg-blue-700 active:scale-95 transition-all">
          <span className="material-symbols-outlined text-lg">add</span>Add First Task
        </button>
      </div>
    );
  }

  return (
    <div className="w-full bg-white">
      {/* 필드 헤더 메뉴 (portal) */}
      {activeFieldMenu && (
        <FieldHeaderMenu
          field={fields.find(f => f.id === activeFieldMenu.id)!}
          anchor={activeFieldMenu.anchor}
          onRename={onRenameField} onDelete={onDeleteField}
          onChangeType={onChangeFieldType} onReorder={onReorderField}
          onClose={() => setActiveFieldMenu(null)}
        />
      )}

      {/* 행 메뉴 (portal) */}
      {activeRowMenu && (
        <RowMenu rowId={activeRowMenu.id} anchor={activeRowMenu.anchor}
          onDelete={onDeleteRow} onDuplicate={onDuplicateRow} onReorder={onReorderRow}
          onClose={() => setActiveRowMenu(null)}
        />
      )}

      {groups.map(([groupKey, groupRows]) => (
        <div key={groupKey} className="mb-2">
          {groupField && (
            <button onClick={() => toggleGroup(groupKey)}
              className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-zinc-700 hover:bg-zinc-50 w-full transition-colors rounded-lg group/gh">
              <span className={`material-symbols-outlined text-[16px] text-zinc-400 transition-transform ${collapsedGroups.has(groupKey) ? '-rotate-90' : ''}`}>expand_more</span>
              <span className={`px-2.5 py-0.5 rounded-lg text-xs font-medium ${STATUS_STYLES[groupKey.toLowerCase()] || 'bg-zinc-100 text-zinc-600 border border-zinc-200'}`}>{groupKey}</span>
              <span className="text-xs text-zinc-400">{groupRows.length}</span>
              <button title="Add" onClick={(e) => { e.stopPropagation(); onAddRow({ [groupField.id]: groupKey }); }}
                className="ml-auto opacity-0 group-hover/gh:opacity-100 text-zinc-400 hover:text-emerald-600 transition-all">
                <span className="material-symbols-outlined text-sm">add</span>
              </button>
            </button>
          )}

          {!collapsedGroups.has(groupKey) && (
            <>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b border-zinc-200">
                      {doneField && (
                        <th className="w-10 px-2 py-2.5 text-center">
                          <span className="material-symbols-outlined text-[16px] text-zinc-300">check_box_outline_blank</span>
                        </th>
                      )}
                      <th className="w-8" />
                      {displayFields.map(field => (
                        <th key={field.id} className="px-3 py-2.5 text-left">
                          <button
                            onClick={(e) => {
                              const rect = e.currentTarget.getBoundingClientRect();
                              setActiveFieldMenu(
                                activeFieldMenu?.id === field.id ? null : { id: field.id, anchor: { top: rect.bottom + 4, left: rect.left } }
                              );
                            }}
                            className="flex items-center gap-1.5 text-[11px] font-bold text-zinc-500 uppercase tracking-wider hover:text-zinc-700 transition-colors">
                            <span className="material-symbols-outlined text-[14px]">{getFieldIcon(field.type)}</span>
                            <span className="truncate">{field.name}</span>
                            <span className="material-symbols-outlined text-[12px] text-zinc-300">expand_more</span>
                          </button>
                        </th>
                      ))}
                      <th className="w-10 px-2">
                        <button title="Add field" onClick={onAddField}
                          className="w-7 h-7 rounded-lg border border-dashed border-zinc-300 flex items-center justify-center hover:border-primary hover:text-primary text-zinc-400 transition-all">
                          <span className="material-symbols-outlined text-[16px]">add</span>
                        </button>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100">
                    {groupRows.map((row: Record<string, any>) => {
                      const rowId = row.id;
                      const cellVal = getCellValue(row, doneField?.id || '');
                      const isCompleted = doneField && (cellVal === true || cellVal === 'true');
                      return (
                        <tr key={rowId} className={`hover:bg-zinc-50/50 transition-colors group/row ${isCompleted ? 'opacity-50' : ''}`}>
                          {doneField && (
                            <td className="px-2 py-2 text-center">
                              <InlineCell field={doneField} value={cellVal} onSave={v => onUpdateCell(rowId, doneField.id, v)} />
                            </td>
                          )}
                          <td className="px-1 py-2">
                            <button title="Row actions"
                              onClick={(e) => {
                                const rect = e.currentTarget.getBoundingClientRect();
                                setActiveRowMenu(
                                  activeRowMenu?.id === rowId ? null : { id: rowId, anchor: { top: rect.bottom + 4, left: rect.left } }
                                );
                              }}
                              className="w-6 h-6 rounded flex items-center justify-center opacity-0 group-hover/row:opacity-100 text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 transition-all">
                              <span className="material-symbols-outlined text-[16px]">drag_indicator</span>
                            </button>
                          </td>
                          {displayFields.map((field, fIdx) => {
                            const val = getCellValue(row, field.id);
                            const isName = fIdx === 0 && field.type === 'text';
                            return (
                              <td key={field.id} className="px-3 py-2">
                                {isName ? (
                                  <div className="flex items-center gap-2">
                                    <InlineCell field={field} value={val} renderers={renderers} onSave={v => onUpdateCell(rowId, field.id, v)} />
                                    {isCompleted && <span className="text-[10px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-full font-medium">done</span>}
                                  </div>
                                ) : (
                                  <InlineCell field={field} value={val} renderers={renderers} onSave={v => onUpdateCell(rowId, field.id, v)} />
                                )}
                              </td>
                            );
                          })}
                          <td />
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              {/* New task — overflow 밖 */}
              <button onClick={() => {
                const d: Record<string, any> = {};
                if (groupField) d[groupField.id] = groupKey;
                onAddRow(d);
              }}
                className="flex items-center gap-2 px-6 py-2.5 text-[13px] font-medium text-zinc-400 hover:text-emerald-600 hover:bg-emerald-50/50 w-full transition-colors border-t border-zinc-100">
                <span className="material-symbols-outlined text-[16px]">add</span>New task
              </button>
            </>
          )}
        </div>
      ))}
    </div>
  );
}
