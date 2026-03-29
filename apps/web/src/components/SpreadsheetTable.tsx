"use client";
import { useState, useEffect, useCallback, useMemo } from "react";
import { createClient } from "../lib/supabase";
import { evalFormula, type CellValue, type Row, type Column } from "../lib/formula";

/* ── Additional Types ── */
interface Sheet {
  id: string;
  name: string;
  columns: Column[];
  rows: Row[];
}

interface FilterRule {
  columnId: string;
  operator: "equals"|"contains"|"gt"|"lt"|"gte"|"lte"|"isEmpty"|"isNotEmpty"|"startsWith"|"endsWith";
  value: string;
}

interface SortRule {
  columnId: string;
  direction: "asc"|"desc";
}

interface Props {
  darkMode?: boolean;
  accentColor?: string;
  pageId?: string;
  onDataUpdate?: (data: { columns: Column[], rows: Row[] }) => void;
}

const uid = () => Math.random().toString(36).slice(2, 10);

/* ── Filter Logic ── */
function applyFilters(rows: Row[], filters: FilterRule[], cols: Column[]): Row[] {
  let r = [...rows];
  for (const f of filters) {
    const col = cols.find(c => c.id === f.columnId); if (!col) continue;
    r = r.filter(row => {
      const v = row.cells[col.id]; const fv = f.value;
      switch (f.operator) {
        case "equals": return String(v ?? "") === fv;
        case "contains": return String(v || "").toLowerCase().includes(fv.toLowerCase());
        case "gt": return (parseFloat(String(v || 0)) || 0) > (parseFloat(fv) || 0);
        case "lt": return (parseFloat(String(v || 0)) || 0) < (parseFloat(fv) || 0);
        case "gte": return (parseFloat(String(v || 0)) || 0) >= (parseFloat(fv) || 0);
        case "lte": return (parseFloat(String(v || 0)) || 0) <= (parseFloat(fv) || 0);
        case "isEmpty": return v == null || v === "";
        case "isNotEmpty": return v != null && v !== "";
        case "startsWith": return String(v || "").toLowerCase().startsWith(fv.toLowerCase());
        case "endsWith": return String(v || "").toLowerCase().endsWith(fv.toLowerCase());
        default: return true;
      }
    });
  }
  return r;
}

export default function SpreadsheetTable({ darkMode, accentColor, pageId, onDataUpdate }: Props) {
  const bg = darkMode ? "#16161a" : "#fff";
  const tx = darkMode ? "#ececf1" : "#111827";
  const tx2 = darkMode ? "#9ca3af" : "#6b7280";
  const bd = darkMode ? "#26262b" : "#e5e7eb";
  const hv = darkMode ? "#232329" : "#f3f4f6";
  const ac = accentColor || "#8b5cf6";
  const cellBg = darkMode ? "#1c1c21" : "#fff";
  const headerBg = darkMode ? "#19191e" : "#f9fafb";

  const [sheets, setSheets] = useState<Sheet[]>([{ id: uid(), name: "Sheet1", columns: [{ id: uid(), name: "이름", type: "text", width: 150 }], rows: [{ id: uid(), cells: {} }] }]);
  const [activeSheet, setActiveSheet] = useState(sheets[0].id);
  const [loading, setLoading] = useState(true);
  const [sel, setSel] = useState<{ rowId: string, colId: string } | null>(null);
  const [edit, setEdit] = useState<{ rowId: string, colId: string } | null>(null);
  const [showColConfig, setShowColConfig] = useState<string | null>(null); 
  const [editColData, setEditColData] = useState<Column | null>(null);
  const [showNewCol, setShowNewCol] = useState(false);
  const [ctxMenu, setCtxMenu] = useState<{ x: number, y: number, rowId?: string, colId?: string } | null>(null);
  const [showFilter, setShowFilter] = useState(false);
  const [filters, setFilters] = useState<FilterRule[]>([]);
  const [showSort, setShowSort] = useState(false);
  const [sorts, setSorts] = useState<SortRule[]>([]);
  const [showGroup, setShowGroup] = useState(false);
  const [groupByCol, setGroupByCol] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"table" | "timeline" | "calendar">("table");
  const [showCalendar, setShowCalendar] = useState(false);
  const [calMonth] = useState(new Date());
  const [colResize, setColResize] = useState<{ colId: string, startX: number, startW: number } | null>(null);

  const curSheet = sheets.find(s => s.id === activeSheet) || sheets[0];
  const { columns, rows } = curSheet;

  useEffect(() => {
    if (pageId) {
      const supabase = createClient();
      (async () => {
        const { data, error } = await supabase.from("pages").select("content").eq("id", pageId).single();
        if (!error && data?.content?.sheets) { 
          setSheets(data.content.sheets); 
          setActiveSheet(data.content.sheets[0].id); 
          if (onDataUpdate) onDataUpdate({ columns: data.content.sheets[0].columns, rows: data.content.sheets[0].rows });
        }
        setLoading(false);
      })();
    } else {
      setLoading(false);
    }
  }, [pageId]);

  const updateSheets = useCallback((fn: (s: Sheet[]) => Sheet[]) => {
    setSheets(prev => {
      const next = fn(prev);
      const cur = next.find(s => s.id === activeSheet) || next[0];
      if (onDataUpdate) onDataUpdate({ columns: cur.columns, rows: cur.rows });
      if (pageId) {
        const supabase = createClient();
        supabase.from("pages").update({ content: { sheets: next } }).eq("id", pageId).then();
      }
      return next;
    });
  }, [pageId]);

  /* ── Interaction Handlers ── */
  const addRow = useCallback(() => updateSheets(p => p.map(s => s.id !== activeSheet ? s : { ...s, rows: [...s.rows, { id: uid(), cells: {} }] })), [activeSheet, updateSheets]);
  const deleteRow = useCallback((id: string) => updateSheets(p => p.map(s => s.id !== activeSheet ? s : { ...s, rows: s.rows.filter(r => r.id !== id) })), [activeSheet, updateSheets]);
  const addCol = useCallback((type: Column["type"]) => {
    const name = { text: "텍스트", number: "숫자", date: "날짜", select: "선택", checkbox: "체크", formula: "수식", url: "URL", percent: "진행" }[type];
    updateSheets(p => p.map(s => s.id !== activeSheet ? s : { ...s, columns: [...s.columns, { id: uid(), name: `${name} ${s.columns.length + 1}`, type, width: 120 }] }));
    setShowNewCol(false);
  }, [activeSheet, updateSheets]);
  const deleteCol = useCallback((id: string) => updateSheets(p => p.map(s => s.id !== activeSheet ? s : { ...s, columns: s.columns.filter(c => c.id !== id) })), [activeSheet, updateSheets]);
  const updateCell = useCallback((rowId: string, colId: string, value: CellValue) => updateSheets(p => p.map(s => s.id !== activeSheet ? s : { ...s, rows: s.rows.map(r => r.id !== rowId ? r : { ...r, cells: { ...r.cells, [colId]: value } }) })), [activeSheet, updateSheets]);
  const addSheet = useCallback(() => { 
    const id = uid(); 
    updateSheets(p => [...p, { id, name: `Sheet${p.length + 1}`, columns: [{ id: uid(), name: "이름", type: "text", width: 150 }], rows: [{ id: uid(), cells: {} }] }]); 
    setActiveSheet(id); 
  }, [updateSheets]);
  const deleteSheet = useCallback((id: string) => { 
    if (sheets.length <= 1) return; 
    const nextList = sheets.filter(s => s.id !== id);
    updateSheets(() => nextList); 
    setActiveSheet(nextList[0].id); 
  }, [sheets, updateSheets, setActiveSheet]);

  const insertAbove = useCallback((id: string) => updateSheets(p => p.map(s => s.id !== activeSheet ? s : { ...s, rows: s.rows.reduce((acc, r) => r.id === id ? [...acc, { id: uid(), cells: {} }, r] : [...acc, r], [] as Row[]) })), [activeSheet, updateSheets]);
  const insertBelow = useCallback((id: string) => updateSheets(p => p.map(s => s.id !== activeSheet ? s : { ...s, rows: s.rows.reduce((acc, r) => r.id === id ? [...acc, r, { id: uid(), cells: {} }] : [...acc, r], [] as Row[]) })), [activeSheet, updateSheets]);
  const dupRow = useCallback((id: string) => updateSheets(p => p.map(s => s.id !== activeSheet ? s : { ...s, rows: s.rows.reduce((acc, r) => r.id === id ? [...acc, r, { ...r, id: uid() }] : [...acc, r], [] as Row[]) })), [activeSheet, updateSheets]);

  const copySelection = useCallback(() => { if (!sel) return; const row = rows.find(r => r.id === sel.rowId); if (row) navigator.clipboard.writeText(String(row.cells[sel.colId] || "")); }, [sel, rows]);
  const pasteFromClipboard = useCallback(async () => { if (!sel) return; const txt = await navigator.clipboard.readText(); updateCell(sel.rowId, sel.colId, txt); }, [sel, updateCell]);

  /* ── Process Data ── */
  const processed = useMemo(() => {
    let r = applyFilters(rows, filters, columns);
    if (sorts.length > 0) {
      const { columnId, direction } = sorts[0];
      r = [...r].sort((a, b) => {
        const v1 = a.cells[columnId], v2 = b.cells[columnId];
        if (v1 === v2) return 0;
        const res = String(v1 || "") > String(v2 || "") ? 1 : -1;
        return direction === "asc" ? res : -res;
      });
    }
    return r;
  }, [rows, filters, columns, sorts]);

  const grouped = useMemo(() => {
    if (!groupByCol) return null;
    return processed.reduce((acc, r) => {
      const v = String(r.cells[groupByCol] || "Empty");
      if (!acc[v]) acc[v] = [];
      acc[v].push(r);
      return acc;
    }, {} as Record<string, Row[]>);
  }, [processed, groupByCol]);

  const calDates = useMemo(() => {
    const first = new Date(calMonth.getFullYear(), calMonth.getMonth(), 1).getDay();
    const days = new Date(calMonth.getFullYear(), calMonth.getMonth() + 1, 0).getDate();
    return Array.from({ length: 42 }, (_, i) => (i >= first && i < first + days) ? i - first + 1 : null);
  }, [calMonth]);

  /* ── Resize Logic ── */
  useEffect(() => {
    if (!colResize) return;
    const move = (e: MouseEvent) => {
      const w = Math.max(50, colResize.startW + (e.clientX - colResize.startX));
      setSheets(p => p.map(s => s.id !== activeSheet ? s : { ...s, columns: s.columns.map(c => c.id === colResize.colId ? { ...c, width: w } : c) }));
    };
    const up = () => {
      if (pageId) {
        const supabase = createClient();
        supabase.from("pages").update({ content: { sheets: sheets } }).eq("id", pageId).then();
      }
      setColResize(null);
    };
    document.addEventListener("mousemove", move); document.addEventListener("mouseup", up);
    return () => { document.removeEventListener("mousemove", move); document.removeEventListener("mouseup", up); };
  }, [colResize, activeSheet, pageId, sheets]);

  const TYPE_ICONS: Record<string, string> = { text: "Abc", number: "123", date: "📅", select: "▾", checkbox: "☑", formula: "fx", url: "🔗", percent: "📊" };

  const renderCell = (r: Row, col: Column) => {
    const val = r.cells[col.id];
    const isSel = sel?.rowId === r.id && sel?.colId === col.id;
    const isEdit = edit?.rowId === r.id && edit?.colId === col.id;
    const display = col.type === "formula" ? evalFormula(col.formula || "", r, rows, columns) : val;

    const baseStyle: React.CSSProperties = {
      width: col.width,
      minWidth: col.width,
      padding: "6px 10px",
      fontSize: 12,
      borderRight: `1px solid ${bd}`,
      overflow: "hidden",
      textOverflow: "ellipsis",
      whiteSpace: "nowrap",
      cursor: "cell",
      display: "flex",
      alignItems: "center",
      background: isSel ? ac + "10" : "transparent",
      outline: isSel ? `2px solid ${ac}` : "none",
      outlineOffset: -2,
      zIndex: isSel ? 1 : 0,
      transition: "background 0.1s ease",
    };

    if (isEdit) {
      if (col.type === "select") {
        return (
          <div style={baseStyle}>
            <select
              value={String(val ?? "")}
              onChange={(e) => { updateCell(r.id, col.id, e.target.value); setEdit(null); }}
              autoFocus
              onBlur={() => setEdit(null)}
              style={{ width: "100%", background: cellBg, color: tx, border: "none", outline: "none", fontSize: 12 }}
            >
              <option value="">선택...</option>
              {col.options?.map(opt => <option key={opt} value={opt}>{opt}</option>)}
            </select>
          </div>
        );
      }
      if (col.type === "date") {
        return (
          <div style={baseStyle}>
            <input
              type="date"
              value={String(val ?? "")}
              onChange={(e) => updateCell(r.id, col.id, e.target.value)}
              autoFocus
              onBlur={() => setEdit(null)}
              onKeyDown={(e) => e.key === "Enter" && setEdit(null)}
              style={{ width: "100%", background: "transparent", color: tx, border: "none", outline: "none", fontSize: 12 }}
            />
          </div>
        );
      }
      return (
        <div style={baseStyle}>
          <input
            value={String(val ?? "")}
            onChange={(e) => updateCell(r.id, col.id, e.target.value)}
            autoFocus
            onBlur={() => setEdit(null)}
            onKeyDown={(e) => e.key === "Enter" && setEdit(null)}
            style={{ width: "100%", height: "100%", border: "none", outline: "none", background: "transparent", color: tx, fontSize: 12, padding: 0 }}
          />
        </div>
      );
    }

    let content: React.ReactNode = String(display ?? "");
    let extraStyle: React.CSSProperties = { color: tx };

    if (col.type === "formula") {
      extraStyle = { color: ac, fontWeight: 600 };
    } else if (col.type === "checkbox") {
      content = <input type="checkbox" checked={!!val} onChange={e => updateCell(r.id, col.id, e.target.checked)} style={{ cursor: "pointer", width: 14, height: 14, accentColor: ac }} />;
      extraStyle = { justifyContent: "center" };
    } else if (col.type === "select" && val) {
      content = (
        <span style={{ background: ac + "20", color: ac, padding: "2px 8px", borderRadius: 12, fontSize: 10, fontWeight: 600, border: `1px solid ${ac}40` }}>
          {String(val)}
        </span>
      );
    } else if (col.type === "percent") {
      const num = parseFloat(String(val || 0));
      content = (
        <div style={{ width: "100%", height: 6, background: bd, borderRadius: 3, overflow: "hidden", position: "relative" }}>
          <div style={{ width: `${Math.min(100, num)}%`, height: "100%", background: ac, transition: "width 0.3s ease" }} />
        </div>
      );
      extraStyle = { padding: "0 10px" };
    }

    return (
      <div 
        key={col.id} 
        onClick={() => setSel({ rowId: r.id, colId: col.id })} 
        onDoubleClick={() => col.type !== "formula" && setEdit({ rowId: r.id, colId: col.id })}
        style={{ ...baseStyle, ...extraStyle }}
      >
        {content}
      </div>
    );
  };

  const renderRow = (r: Row, i: number) => (
    <div key={r.id} style={{ display: "flex", borderBottom: `1px solid ${bd}`, background: sel?.rowId === r.id ? ac + "05" : "transparent" }}>
      <div 
        onContextMenu={e => { e.preventDefault(); setCtxMenu({ x: e.clientX, y: e.clientY, rowId: r.id }); }} 
        style={{ width: 36, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, color: tx2, borderRight: `1px solid ${bd}`, cursor: "context-menu", background: headerBg }}>
        {i + 1}
      </div>
      {columns.map(col => renderCell(r, col))}
    </div>
  );

  if (loading) return <div style={{ padding: 20, color: tx2 }}>데이터 로딩 중...</div>;

  return (
    <div style={{ background: bg, color: tx, borderRadius: 12, border: `1px solid ${bd}`, overflow: "hidden", display: "flex", flexDirection: "column", fontFamily: "inherit", boxShadow: "0 10px 40px rgba(0,0,0,0.1)" }}>
      {/* Toolbar */}
      <div style={{ 
        padding: "10px 16px", 
        borderBottom: `1px solid ${bd}`, 
        background: darkMode ? "rgba(25, 25, 30, 0.8)" : "rgba(249, 250, 251, 0.8)", 
        backdropFilter: "blur(12px)",
        display: "flex", 
        gap: 12, 
        alignItems: "center", 
        flexWrap: "wrap",
        position: "sticky",
        top: 0,
        zIndex: 10
      }}>
        {/* View Selection */}
        <div style={{ display: "flex", background: bd, borderRadius: 10, padding: 2, marginRight: 8 }}>
          {[
            { id: "table", l: "테이블", i: "📋" },
            { id: "timeline", l: "타임라인", i: "📊" },
            { id: "calendar", l: "캘린더", i: "📅" }
          ].map(v => (
            <button key={v.id} onClick={() => setViewMode(v.id as any)} style={{ 
              padding: "4px 12px", 
              fontSize: 11, 
              borderRadius: 8, 
              border: "none", 
              background: viewMode === v.id ? bg : "transparent",
              color: viewMode === v.id ? ac : tx2,
              cursor: "pointer",
              fontWeight: viewMode === v.id ? 700 : 500,
              transition: "all 0.2s"
            }}>
              {v.i} {v.l}
            </button>
          ))}
        </div>

        {/* Function Buttons */}
        {[
          { l: "행 추가", i: "➕", a: false, c: 0, fn: addRow },
          { l: "필터", i: "🔍", a: showFilter, c: filters.length, fn: () => setShowFilter(!showFilter) },
          { l: "정렬", i: "📊", a: showSort, c: sorts.length, fn: () => setShowSort(!showSort) },
          { l: "그룹화", i: "📂", a: showGroup, c: groupByCol ? 1 : 0, fn: () => setShowGroup(!showGroup) },
          { l: "복사", i: "📋", a: false, c: 0, fn: copySelection },
          { l: "붙여넣기", i: "📥", a: false, c: 0, fn: pasteFromClipboard },
        ].map((b, i) => (
          <button 
            key={i} 
            onClick={b.fn} 
            aria-label={b.l}
            style={{ 
              padding: "5px 12px", 
              fontSize: 12, 
              borderRadius: 8, 
              border: `1px solid ${b.a ? ac : bd}`, 
              background: b.a ? ac : (darkMode ? "#1c1c21" : "#fff"), 
              color: b.a ? "#fff" : (darkMode ? "#9ca3af" : "#4b5563"), 
              cursor: "pointer", 
              fontFamily: "inherit",
              display: "flex",
              alignItems: "center",
              gap: 6,
              boxShadow: b.a ? `0 4px 12px ${ac}40` : "none",
              transition: "all 0.2s ease"
            }}
          >
            <span style={{ fontSize: 14 }}>{b.i}</span>
            <span style={{ fontWeight: 500 }}>{b.l}</span>
            {b.c > 0 && <span style={{ marginLeft: 4, background: b.a ? "#fff" : ac, color: b.a ? ac : "#fff", padding: "0 5px", borderRadius: 10, fontSize: 10, fontWeight: 700 }}>{b.c}</span>}
          </button>
        ))}
        {showGroup && (
          <select 
            aria-label="그룹화 기준 컬럼"
            value={groupByCol || ""} 
            onChange={e => setGroupByCol(e.target.value || null)}
            style={{ padding: "5px 10px", fontSize: 12, borderRadius: 8, border: `1px solid ${bd}`, background: cellBg, color: tx }}
          >
            <option value="">그룹화 안함</option>
            {columns.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        )}
        <div style={{ flex: 1 }} />
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 11, color: tx2 }}>
            <strong style={{ color: ac }}>{processed.length}</strong> 행
          </span>
        </div>
      </div>

      {/* Panels (Filter, Sort, etc.) */}
      {showFilter && <div style={{ padding: "8px 16px", borderBottom: `1px solid ${bd}`, background: hv }}>
        {filters.map((f, i) => (
          <div key={i} style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 6 }}>
            <select aria-label="필터 열" value={f.columnId} onChange={e => { const nf = [...filters]; nf[i] = { ...f, columnId: e.target.value }; setFilters(nf); }} style={{ padding: "4px 8px", fontSize: 11, background: cellBg, color: tx, border: `1px solid ${bd}`, borderRadius: 6 }}>
              {columns.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <select aria-label="연산자" value={f.operator} onChange={e => { const nf = [...filters]; nf[i] = { ...f, operator: e.target.value as FilterRule["operator"] }; setFilters(nf); }} style={{ padding: "4px 8px", fontSize: 11, background: cellBg, color: tx, border: `1px solid ${bd}`, borderRadius: 6 }}>
              {["contains", "equals", "gt", "lt", "isEmpty"].map(o => <option key={o} value={o}>{o}</option>)}
            </select>
            <input aria-label="필터 값" value={f.value} onChange={e => { const nf = [...filters]; nf[i] = { ...f, value: e.target.value }; setFilters(nf); }} placeholder="값 입력..." style={{ padding: "4px 8px", fontSize: 11, background: cellBg, color: tx, border: `1px solid ${bd}`, borderRadius: 6, width: 120 }} />
            <button onClick={() => setFilters(p => p.filter((_, j) => j !== i))} style={{ background: "transparent", border: "none", color: "#ef4444", cursor: "pointer" }}>✕</button>
          </div>
        ))}
        <button onClick={() => setFilters(p => [...p, { columnId: columns[0]?.id || "", operator: "contains", value: "" }])} style={{ fontSize: 11, color: ac, background: "transparent", border: "none", cursor: "pointer" }}>+ 필터 추가</button>
      </div>}

      {showSort && <div style={{ padding: "8px 16px", borderBottom: `1px solid ${bd}`, background: hv, display: "flex", gap: 12, alignItems: "center" }}>
        <span style={{ fontSize: 11, color: tx2 }}>정렬 기준:</span>
        <select value={sorts[0]?.columnId} onChange={e => setSorts([{ columnId: e.target.value, direction: sorts[0]?.direction || "asc" }])} style={{ padding: "4px 8px", fontSize: 11, background: cellBg, color: tx, border: `1px solid ${bd}`, borderRadius: 6 }}>
          {columns.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select value={sorts[0]?.direction} onChange={e => setSorts([{ columnId: sorts[0]?.columnId || columns[0]?.id, direction: e.target.value as any }])} style={{ padding: "4px 8px", fontSize: 11, background: cellBg, color: tx, border: `1px solid ${bd}`, borderRadius: 6 }}>
          <option value="asc">오름차순</option>
          <option value="desc">내림차순</option>
        </select>
        <button onClick={() => setSorts([])} style={{ fontSize: 11, color: "#ef4444", background: "transparent", border: "none", cursor: "pointer" }}>제거</button>
      </div>}

      {/* Main View Area */}
      <div style={{ flex: 1, overflow: "auto", position: "relative" }}>
        {viewMode === "table" ? (
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", borderBottom: `2px solid ${bd}`, background: headerBg, position: "sticky", top: 0, zIndex: 5 }}>
              <div style={{ width: 36, flexShrink: 0, borderRight: `1px solid ${bd}`, background: headerBg }} />
              {columns.map(col => (
                <div key={col.id} style={{ width: col.width, minWidth: col.width, padding: "10px 12px", fontSize: 11, fontWeight: 700, color: tx2, borderRight: `1px solid ${bd}`, display: "flex", alignItems: "center", justifyContent: "space-between", position: "relative" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }} onClick={() => { setEditColData(col); setShowColConfig(col.id); }}>
                    <span style={{ color: ac }}>{TYPE_ICONS[col.type]}</span>
                    {col.name}
                  </div>
                  <div onMouseDown={e => { e.preventDefault(); e.stopPropagation(); setColResize({ colId: col.id, startX: e.clientX, startW: col.width }); }} 
                       style={{ position: "absolute", right: 0, top: 0, bottom: 0, width: 4, cursor: "col-resize", transition: "background 0.2s" }} 
                       onMouseEnter={e => (e.currentTarget.style.background = ac)}
                       onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                  />
                </div>
              ))}
              <div style={{ width: 40, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: ac, fontSize: 18 }} onClick={() => setShowNewCol(true)}>+</div>
            </div>
            {processed.map((r, i) => renderRow(r, i))}
            <div onClick={addRow} style={{ padding: "12px 16px", cursor: "pointer", color: ac, fontSize: 13, borderBottom: `1px solid ${bd}` }}>+ 새 행 추가</div>
          </div>
        ) : viewMode === "timeline" ? (
          <div style={{ padding: 20 }}>
            <div style={{ display: "flex", borderBottom: `1px solid ${bd}`, paddingBottom: 10, marginBottom: 10 }}>
              <div style={{ width: 200, flexShrink: 0, fontWeight: 700, fontSize: 12 }}>업무 리스트</div>
              <div style={{ flex: 1, display: "flex", gap: 2 }}>
                {Array.from({ length: 14 }).map((_, i) => (
                  <div key={i} style={{ width: 40, textAlign: "center", fontSize: 10, color: tx2 }}>{i + 1}일</div>
                ))}
              </div>
            </div>
            {processed.map(r => {
              const dateVal = columns.find(c => c.type === "date") ? r.cells[columns.find(c => c.type === "date")!.id] : null;
              const day = dateVal ? new Date(String(dateVal)).getDate() : 0;
              return (
                <div key={r.id} style={{ display: "flex", alignItems: "center", height: 40, borderBottom: `1px solid ${bd}40` }}>
                  <div style={{ width: 200, flexShrink: 0, fontSize: 12 }}>{String(r.cells[columns[0]?.id] || "제목 없음")}</div>
                  <div style={{ flex: 1, position: "relative", height: 24, background: hv, borderRadius: 4 }}>
                    {day > 0 && day <= 14 && (
                      <div style={{ position: "absolute", left: (day - 1) * 42, width: 80, height: "100%", background: ac, borderRadius: 4, boxShadow: `0 4px 12px ${ac}40` }} />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div style={{ padding: 20 }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 1, background: bd, border: `1px solid ${bd}` }}>
              {["일", "월", "화", "수", "목", "금", "토"].map(d => <div key={d} style={{ background: headerBg, padding: 8, textAlign: "center", fontSize: 11, fontWeight: 700, color: tx2 }}>{d}</div>)}
              {Array.from({ length: 35 }).map((_, i) => {
                const day = i - 2;
                const dailyRows = processed.filter(r => {
                  const dc = columns.find(c => c.type === "date");
                  return dc && new Date(String(r.cells[dc.id])).getDate() === day;
                });
                return (
                  <div key={i} style={{ background: bg, minHeight: 90, padding: 4 }}>
                    <div style={{ fontSize: 10, color: day > 0 && day <= 31 ? tx2 : "transparent", marginBottom: 4 }}>{day > 0 && day <= 31 ? day : ""}</div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                      {dailyRows.map(r => (
                        <div key={r.id} style={{ background: ac + "15", color: ac, fontSize: 9, padding: "2px 4px", borderRadius: 4, whiteSpace: "nowrap", overflow: "hidden" }}>{String(r.cells[columns[0]?.id] || "Event")}</div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Footer Tabs */}
      <div style={{ display: "flex", borderTop: `1px solid ${bd}`, background: headerBg, padding: "0 8px" }}>
        {sheets.map(s => (
          <div key={s.id} onClick={() => setActiveSheet(s.id)} style={{ 
            padding: "8px 16px", 
            fontSize: 12, 
            cursor: "pointer", 
            fontWeight: activeSheet === s.id ? 700 : 500, 
            color: activeSheet === s.id ? ac : tx2, 
            borderBottom: activeSheet === s.id ? `2px solid ${ac}` : "2px solid transparent"
          }}>
            {s.name}
          </div>
        ))}
        <div onClick={addSheet} style={{ padding: "8px 12px", cursor: "pointer", color: tx2 }}>+</div>
      </div>

      {/* Overlays */}
      {showColConfig && editColData && (
        <div style={{ position: "fixed", inset: 0, zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)" }}>
          <div style={{ background: bg, width: 340, borderRadius: 16, padding: 20, display: "flex", flexDirection: "column", gap: 16, border: `1px solid ${bd}` }}>
            <h3 style={{ margin: 0, fontSize: 16 }}>컬럼 설정</h3>
            <input value={editColData.name} onChange={e => setEditColData({...editColData, name: e.target.value})} style={{ padding: "8px 12px", borderRadius: 8, border: `1px solid ${bd}`, background: cellBg, color: tx }} />
            <select value={editColData.type} onChange={e => setEditColData({...editColData, type: e.target.value as any})} style={{ padding: "8px 12px", borderRadius: 8, border: `1px solid ${bd}`, background: cellBg, color: tx }}>
              {["text", "number", "date", "select", "checkbox", "formula", "percent"].map(t => <option key={t} value={t}>{t}</option>)}
            </select>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setShowColConfig(null)} style={{ flex: 1, padding: 10, borderRadius: 8, border: "none" }}>취소</button>
              <button onClick={() => { updateSheets(prev => prev.map(s => s.id === activeSheet ? {...s, columns: s.columns.map(c => c.id === showColConfig ? editColData : c)} : s)); setShowColConfig(null); }} style={{ flex: 1, padding: 10, background: ac, color: "#fff", borderRadius: 8, border: "none" }}>저장</button>
            </div>
          </div>
        </div>
      )}

      {showNewCol && (
        <div style={{ position: "fixed", inset: 0, zIndex: 90 }} onClick={() => setShowNewCol(false)}>
          <div onClick={e => e.stopPropagation()} style={{ position: "absolute", right: 20, top: 100, background: bg, border: `1px solid ${bd}`, borderRadius: 12, padding: 8, width: 160 }}>
            {["text", "number", "date", "select", "checkbox", "formula", "percent"].map(t => (
              <button key={t} onClick={() => addCol(t as any)} style={{ width: "100%", padding: "8px", textAlign: "left", background: "transparent", border: "none", color: tx, cursor: "pointer" }}>{t}</button>
            ))}
          </div>
        </div>
      )}

      {ctxMenu && (
        <div onClick={() => setCtxMenu(null)} style={{ position: "fixed", inset: 0, zIndex: 998 }}>
          <div style={{ position: "fixed", left: ctxMenu.x, top: ctxMenu.y, background: bg, border: `1px solid ${bd}`, borderRadius: 8, padding: 4, minWidth: 120 }}>
            <button onClick={() => { insertAbove(ctxMenu.rowId!); setCtxMenu(null); }} style={{ width: "100%", padding: "8px", textAlign: "left", background: "transparent", border: "none", color: tx, cursor: "pointer" }}>위에 행 삽입</button>
            <button onClick={() => { insertBelow(ctxMenu.rowId!); setCtxMenu(null); }} style={{ width: "100%", padding: "8px", textAlign: "left", background: "transparent", border: "none", color: tx, cursor: "pointer" }}>아래에 행 삽입</button>
            <button onClick={() => { deleteRow(ctxMenu.rowId!); setCtxMenu(null); }} style={{ width: "100%", padding: "8px", textAlign: "left", background: "transparent", border: "none", color: "#ef4444", cursor: "pointer" }}>행 삭제</button>
          </div>
        </div>
      )}
    </div>
  );
}
