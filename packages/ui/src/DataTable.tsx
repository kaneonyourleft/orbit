"use client";
import React, { useState, useRef, useEffect, useCallback } from 'react';

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
    case 'multi-select': return 'checklist';
    case 'date': return 'calendar_today';
    case 'checkbox': return 'check_box';
    case 'link': return 'link';
    default: return 'text_fields';
  }
}

// ── 필드 헤더 컨텍스트 메뉴 ──
function FieldHeaderMenu({ field, onRename, onDelete, onChangeType, onReorder, onClose }: {
  field: OrbitField;
  onRename: (id: string, name: string) => void;
  onDelete?: (id: string) => void;
  onChangeType?: (id: string, type: string) => void;
  onReorder?: (id: string, dir: 'left' | 'right') => void;
  onClose: () => void;
}) {
  const [view, setView] = useState<'main' | 'rename' | 'type'>('main');
  const [nameVal, setNameVal] = useState(field.name);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  return (
    <div ref={menuRef} className="absolute top-full left-0 mt-1 w-52 bg-white border border-zinc-200 rounded-xl shadow-xl z-50 py-1.5 text-sm text-zinc-700 animate-in fade-in slide-in-from-top-1 duration-150">
      {view === 'main' && (
        <>
          <button onClick={() => setView('rename')} className="w-full text-left px-3 py-2 hover:bg-zinc-50 flex items-center gap-2">
            <span className="material-symbols-outlined text-[16px]">edit</span> Rename
          </button>
          <button onClick={() => setView('type')} className="w-full text-left px-3 py-2 hover:bg-zinc-50 flex items-center gap-2">
            <span className="material-symbols-outlined text-[16px]">swap_horiz</span> Change type
            <span className="ml-auto text-xs text-zinc-400">{field.type}</span>
          </button>
          {onReorder && (
            <>
              <button onClick={() => { onReorder(field.id, 'left'); onClose(); }} className="w-full text-left px-3 py-2 hover:bg-zinc-50 flex items-center gap-2">
                <span className="material-symbols-outlined text-[16px]">chevron_left</span> Move left
              </button>
              <button onClick={() => { onReorder(field.id, 'right'); onClose(); }} className="w-full text-left px-3 py-2 hover:bg-zinc-50 flex items-center gap-2">
                <span className="material-symbols-outlined text-[16px]">chevron_right</span> Move right
              </button>
            </>
          )}
          <div className="border-t border-zinc-100 my-1" />
          {onDelete && (
            <button onClick={() => { onDelete(field.id); onClose(); }} className="w-full text-left px-3 py-2 hover:bg-red-50 text-red-600 flex items-center gap-2">
              <span className="material-symbols-outlined text-[16px]">delete</span> Delete field
            </button>
          )}
        </>
      )}
      {view === 'rename' && (
        <div className="px-3 py-2">
          <input autoFocus value={nameVal} onChange={e => setNameVal(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') { onRename(field.id, nameVal); onClose(); } if (e.key === 'Escape') onClose(); }}
            title="Rename field" placeholder="Enter field name"
            className="w-full px-2 py-1.5 border border-zinc-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none" />
          <div className="flex gap-2 mt-2">
            <button onClick={() => setView('main')} className="text-xs text-zinc-500">Cancel</button>
            <button onClick={() => { onRename(field.id, nameVal); onClose(); }} className="text-xs text-emerald-600 font-semibold">Save</button>
          </div>
        </div>
      )}
      {view === 'type' && (
        <div className="py-1 text-xs">
          <button onClick={() => setView('main')} className="w-full text-left px-3 py-1 text-zinc-400 hover:text-zinc-600">← Back</button>
          {FIELD_TYPES.map(t => (
            <button key={t} onClick={() => { onChangeType?.(field.id, t); onClose(); }}
              className={`w-full text-left px-3 py-2 hover:bg-zinc-50 flex items-center gap-2 ${t === field.type ? 'bg-emerald-50 text-emerald-700 font-medium' : ''}`}>
              <span className="material-symbols-outlined text-[16px]">{getFieldIcon(t)}</span>
              <span className="capitalize">{t}</span>
              {t === field.type && <span className="material-symbols-outlined text-[14px] ml-auto">check</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── 셀렉트 드롭다운 (Status / Priority / 일반 select) ──
function SelectDropdown({ value, options, styles, onChange, onClose }: {
  value: string; options: string[]; styles: Record<string, string>;
  onChange: (v: string) => void; onClose: () => void;
}) {
  const [customVal, setCustomVal] = useState('');
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  return (
    <div ref={ref} className="absolute top-full left-0 mt-1 w-48 bg-white border border-zinc-200 rounded-xl shadow-xl z-50 py-1.5 animate-in fade-in slide-in-from-top-1 duration-150">
      {options.map(opt => (
        <button key={opt} onClick={() => { onChange(opt); onClose(); }}
          className={`w-full text-left px-3 py-1.5 text-sm hover:bg-zinc-50 flex items-center gap-2 ${opt.toLowerCase() === value?.toLowerCase() ? 'bg-zinc-50 font-medium' : ''}`}>
          <span className={`inline-block px-2 py-0.5 rounded-md text-xs ${styles[opt.toLowerCase()] || 'bg-zinc-100 text-zinc-600'}`}>{opt}</span>
          {opt.toLowerCase() === value?.toLowerCase() && <span className="material-symbols-outlined text-[14px] ml-auto text-emerald-600">check</span>}
        </button>
      ))}
      <div className="border-t border-zinc-100 mt-1 pt-1 px-3 pb-2">
        <input placeholder="Add option..." value={customVal} onChange={e => setCustomVal(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && customVal.trim()) { onChange(customVal.trim()); onClose(); } }}
          title="Add select option"
          className="w-full text-xs px-2 py-1 border border-zinc-200 rounded-lg outline-none focus:ring-1 focus:ring-emerald-500" />
      </div>
    </div>
  );
}

// ── 행 컨텍스트 메뉴 ──
function RowMenu({ rowId, onDelete, onDuplicate, onReorder, onClose }: {
  rowId: string;
  onDelete: (id: string) => void;
  onDuplicate?: (id: string) => void;
  onReorder?: (id: string, dir: 'up' | 'down') => void;
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

  return (
    <div ref={ref} className="absolute left-0 top-full mt-1 w-44 bg-white border border-zinc-200 rounded-xl shadow-xl z-50 py-1.5 text-sm">
      {onDuplicate && (
        <button onClick={() => { onDuplicate(rowId); onClose(); }} className="w-full text-left px-3 py-2 hover:bg-zinc-50 flex items-center gap-2">
          <span className="material-symbols-outlined text-[16px]">content_copy</span> Duplicate
        </button>
      )}
      {onReorder && (
        <>
          <button onClick={() => { onReorder(rowId, 'up'); onClose(); }} className="w-full text-left px-3 py-2 hover:bg-zinc-50 flex items-center gap-2">
            <span className="material-symbols-outlined text-[16px]">arrow_upward</span> Move up
          </button>
          <button onClick={() => { onReorder(rowId, 'down'); onClose(); }} className="w-full text-left px-3 py-2 hover:bg-zinc-50 flex items-center gap-2">
            <span className="material-symbols-outlined text-[16px]">arrow_downward</span> Move down
          </button>
        </>
      )}
      <div className="border-t border-zinc-100 my-1" />
      <button onClick={() => { onDelete(rowId); onClose(); }} className="w-full text-left px-3 py-2 hover:bg-red-50 text-red-600 flex items-center gap-2">
        <span className="material-symbols-outlined text-[16px]">delete</span> Delete
      </button>
    </div>
  );
}

// ── 인라인 셀 에디터 ──
function InlineCell({ field, value, onSave, renderers = {} }: {
  field: OrbitField; value: any; onSave: (v: any) => void; renderers?: Record<string, any>;
}) {
  const [editing, setEditing] = useState(false);
  const [localVal, setLocalVal] = useState(value ?? '');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { if (editing && inputRef.current) inputRef.current.focus(); }, [editing]);
  useEffect(() => { setLocalVal(value ?? ''); }, [value]);

  const save = useCallback(() => {
    setEditing(false);
    if (localVal !== value) onSave(field.type === 'number' ? Number(localVal) : localVal);
  }, [localVal, value, onSave, field.type]);

  // Select / Status / Priority 필드 식별
  const isSelectLike = field.type === 'select' || field.name.toLowerCase() === 'status' || field.name.toLowerCase() === 'priority';

  // Plugin Renderer Check - select 계열은 InlineCell 자체 드롭다운 우선
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
      <div className="relative">
        <button onClick={() => setEditing(!editing)}
          className={`px-2.5 py-1 rounded-lg text-xs font-medium ${badgeStyle} hover:opacity-80 transition-opacity`}>
          {display}
        </button>
        {editing && (
          <SelectDropdown value={display} options={options} styles={styleMap}
            onChange={v => { onSave(v); setEditing(false); }} onClose={() => setEditing(false)} />
        )}
      </div>
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
          className="px-2 py-1 border border-zinc-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-emerald-500 w-36" />
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
          className="px-2 py-1 border border-zinc-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-emerald-500 w-full" />
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

  // Owner (text 필드지만 이름이 'owner'인 경우 아바타 표시)
  const isOwner = field.name.toLowerCase() === 'owner' && field.type === 'text';
  if (isOwner) {
    if (editing) {
      return (
        <input ref={inputRef} type="text"
          value={localVal} onChange={e => setLocalVal(e.target.value)}
          onBlur={save} onKeyDown={e => { if (e.key === 'Enter') save(); if (e.key === 'Escape') { setLocalVal(value ?? ''); setEditing(false); } }}
          title="Edit owner"
          className="w-full px-2 py-1 border border-zinc-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white" />
      );
    }
    const displayName = value || '';
    const initial = displayName ? displayName.charAt(0).toUpperCase() : '?';
    const colors = [
      'bg-blue-100 text-blue-700', 'bg-emerald-100 text-emerald-700',
      'bg-amber-100 text-amber-700', 'bg-purple-100 text-purple-700',
      'bg-rose-100 text-rose-700', 'bg-cyan-100 text-cyan-700',
    ];
    const colorIdx = displayName ? displayName.charCodeAt(0) % colors.length : 0;
    return (
      <button onClick={() => setEditing(true)} className="flex items-center gap-2 hover:bg-zinc-50 px-1.5 py-1 rounded-lg transition-colors">
        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black shrink-0 ${colors[colorIdx]}`}>
          {initial}
        </div>
        <span className="text-sm text-zinc-700 font-medium truncate max-w-[120px]">{displayName || <span className="text-zinc-400">—</span>}</span>
      </button>
    );
  }

  // Text / Number (default)
  if (editing) {
    return (
      <input ref={inputRef} type={field.type === 'number' ? 'number' : 'text'}
        value={localVal} onChange={e => setLocalVal(e.target.value)}
        onBlur={save} onKeyDown={e => { if (e.key === 'Enter') save(); if (e.key === 'Escape') { setLocalVal(value ?? ''); setEditing(false); } }}
        title="Edit cell"
        className="w-full px-2 py-1 border border-zinc-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white" />
    );
  }
  return (
    <button onClick={() => setEditing(true)}
      className="text-left w-full text-sm text-zinc-800 hover:bg-zinc-50 px-2 py-1 rounded-lg transition-colors min-h-[28px]">
      {value || <span className="text-zinc-400">—</span>}
    </button>
  );
}

// ── 메인 DataTable ──
export function DataTable({
  fields, rows, onUpdateCell, onAddRow, onDeleteRow, onAddField,
  onRenameField, onDeleteField, onChangeFieldType, onReorderField,
  onDuplicateRow, onReorderRow, groupByFieldId, onGroupBy, renderers = {}
}: DataTableProps) {
  const [activeFieldMenu, setActiveFieldMenu] = useState<string | null>(null);
  const [activeRowMenu, setActiveRowMenu] = useState<string | null>(null);
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());

  const sortedFields = [...fields].sort((a, b) => a.order - b.order);
  const doneField = sortedFields.find(f => f.type === 'checkbox' || f.name.toLowerCase() === 'done');
  const displayFields = sortedFields.filter(f => f.id !== doneField?.id);

  const getCellValue = (row: Record<string, any>, fieldId: string) => {
    return row[fieldId] ?? '';
  };

  // 그룹핑 
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
    setCollapsedGroups(prev => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  };

  if (rows.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 bg-white border border-dashed border-zinc-200 rounded-2xl mx-4 my-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="w-16 h-16 bg-[#F1F5FE] rounded-2xl flex items-center justify-center mb-6 shadow-sm border border-blue-50">
          <span className="material-symbols-outlined text-[#0058BE] text-[32px]">assignment_add</span>
        </div>
        <h3 className="text-lg font-bold text-zinc-800 mb-2">Start your project</h3>
        <p className="text-sm text-zinc-500 mb-8 max-w-[280px] text-center leading-relaxed">
          This table is currently empty. Create your first task to get things moving.
        </p>
        <button onClick={() => onAddRow()} 
          className="flex items-center gap-2 px-6 py-3 bg-[#0058BE] text-white rounded-xl font-bold text-sm shadow-xl shadow-blue-500/20 hover:scale-[1.02] active:scale-95 transition-all">
          <span className="material-symbols-outlined text-lg">add</span>
          Add First Task
        </button>
      </div>
    );
  }

  return (
    <div className="w-full overflow-hidden bg-white">
      {groups.map(([groupKey, groupRows]) => (
        <div key={groupKey} className="mb-2">
          {/* 그룹 헤더 */}
          {groupField && (
            <button onClick={() => toggleGroup(groupKey)}
              className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-zinc-700 hover:bg-zinc-50 w-full transition-colors rounded-lg group/gheader">
              <span className={`material-symbols-outlined text-[16px] text-zinc-400 transition-transform ${collapsedGroups.has(groupKey) ? '-rotate-90' : 'rotate-0'}`}>
                expand_more
              </span>
              <span className={`px-2.5 py-0.5 rounded-lg text-xs font-medium ${STATUS_STYLES[groupKey.toLowerCase()] || 'bg-zinc-100 text-zinc-600 border border-zinc-200'}`}>
                {groupKey}
              </span>
              <span className="text-xs text-zinc-400 font-normal">{groupRows.length}</span>
              <button title="Add task to group" onClick={(e) => { e.stopPropagation(); onAddRow({ [groupField.id]: groupKey }); }}
                className="ml-auto opacity-0 group-hover/gheader:opacity-100 text-zinc-400 hover:text-emerald-600 transition-all">
                <span className="material-symbols-outlined text-sm">add</span>
              </button>
            </button>
          )}

          {!collapsedGroups.has(groupKey) && (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-zinc-200">
                    {/* 체크박스 헤더 */}
                    {doneField && (
                      <th className="w-12 px-3 py-2.5 text-center">
                        <span className="material-symbols-outlined text-[16px] text-zinc-400">check_box_outline_blank</span>
                      </th>
                    )}
                    {/* 행 메뉴 공간 */}
                    <th className="w-8" />
                    {/* 필드 헤더들 */}
                    {displayFields.map(field => (
                      <th key={field.id} className="relative px-3 py-2.5 text-left group/header">
                        <button onClick={() => setActiveFieldMenu(activeFieldMenu === field.id ? null : field.id)}
                          className="flex items-center gap-1.5 text-xs font-semibold text-zinc-500 uppercase tracking-wider hover:text-zinc-700 transition-colors w-full">
                          <span className="material-symbols-outlined text-[14px]">{getFieldIcon(field.type)}</span>
                          <span className="truncate">{field.name}</span>
                          <span className="material-symbols-outlined text-[12px] opacity-0 group-hover/header:opacity-100 ml-auto transition-opacity">expand_more</span>
                        </button>
                        {activeFieldMenu === field.id && (
                          <FieldHeaderMenu field={field}
                            onRename={onRenameField}
                            onDelete={onDeleteField}
                            onChangeType={onChangeFieldType}
                            onReorder={onReorderField}
                            onClose={() => setActiveFieldMenu(null)} />
                        )}
                      </th>
                    ))}
                    {/* 필드 추가 버튼 */}
                    <th className="w-10 px-2 whitespace-nowrap">
                      <button title="Add new field" onClick={onAddField}
                        className="w-7 h-7 rounded-lg border border-dashed border-zinc-300 flex items-center justify-center hover:border-emerald-400 hover:text-emerald-600 text-zinc-400 transition-all">
                        <span className="material-symbols-outlined text-[16px]">add</span>
                      </button>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {groupRows.map((row) => {
                    const rowId = row.id;
                    const cellVal = getCellValue(row, doneField?.id || '');
                    const isCompleted = doneField && (cellVal === true || cellVal === 'true');
                    return (
                      <tr key={rowId} className={`hover:bg-zinc-50/50 transition-colors group/row ${isCompleted ? 'opacity-60' : ''}`}>
                        {/* 체크박스 */}
                        {doneField && (
                          <td className="px-3 py-2.5 text-center">
                            <InlineCell field={doneField} value={cellVal}
                              onSave={v => onUpdateCell(rowId, doneField.id, v)} />
                          </td>
                        )}
                        {/* 행 메뉴 */}
                        <td className="px-1 py-2.5 relative">
                          <button title="Row actions" onClick={() => setActiveRowMenu(activeRowMenu === rowId ? null : rowId)}
                            className="w-6 h-6 rounded flex items-center justify-center opacity-0 group-hover/row:opacity-100 text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 transition-all">
                            <span className="material-symbols-outlined text-[16px]">drag_indicator</span>
                          </button>
                          {activeRowMenu === rowId && (
                            <RowMenu rowId={rowId} onDelete={onDeleteRow}
                              onDuplicate={onDuplicateRow} onReorder={onReorderRow}
                              onClose={() => setActiveRowMenu(null)} />
                          )}
                        </td>
                        {/* 각 필드 셀 */}
                        {displayFields.map((field, fIdx) => {
                          const val = getCellValue(row, field.id);
                          const isName = fIdx === 0 && field.type === 'text';
                          return (
                            <td key={field.id} className="px-3 py-2.5">
                              {isName ? (
                                <div className="flex items-center gap-2">
                                  <InlineCell field={field} value={val} renderers={renderers}
                                    onSave={v => onUpdateCell(rowId, field.id, v)} />
                                  {isCompleted && (
                                    <span className="text-[10px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-full font-medium whitespace-nowrap">done</span>
                                  )}
                                </div>
                              ) : (
                                <InlineCell field={field} value={val} renderers={renderers}
                                  onSave={v => onUpdateCell(rowId, field.id, v)} />
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
              {/* 행 추가 */}
              <button onClick={() => {
                const defaultData: Record<string, any> = {};
                if (groupField) defaultData[groupField.id] = groupKey;
                onAddRow(defaultData);
              }}
                className="flex items-center gap-2 px-6 py-2.5 text-sm text-zinc-400 hover:text-emerald-600 hover:bg-emerald-50/50 w-full transition-colors rounded-b-lg border-t border-zinc-100">
                <span className="material-symbols-outlined text-[16px]">add</span>
                New task
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
