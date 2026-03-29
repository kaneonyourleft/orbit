"use client";
import { useState, useRef, useEffect, useCallback, useMemo } from "react";

interface Column {
  id: string;
  name: string;
  type: "text" | "number" | "date" | "select" | "checkbox" | "formula" | "url";
  width: number;
  options?: string[];
  formula?: string;
}

interface Row {
  id: string;
  cells: Record<string, any>;
  group?: string;
}

interface FilterRule {
  columnId: string;
  operator: "equals" | "contains" | "gt" | "lt" | "gte" | "lte" | "isEmpty" | "isNotEmpty";
  value: string;
}

interface SortRule {
  columnId: string;
  direction: "asc" | "desc";
}

interface SpreadsheetProps {
  darkMode?: boolean;
  accentColor?: string;
}

const uid = () => Math.random().toString(36).slice(2, 10);

// Formula engine (VBA-like)
function evaluateFormula(formula: string, row: Row, allRows: Row[], columns: Column[]): any {
  try {
    const f = formula.startsWith("=") ? formula.slice(1) : formula;
    
    // SUM(col)
    const sumMatch = f.match(/^SUM\((\w+)\)$/i);
    if (sumMatch) {
      const colName = sumMatch[1];
      const col = columns.find(c => c.name === colName);
      if (col) return allRows.reduce((acc, r) => acc + (parseFloat(r.cells[col.id]) || 0), 0);
    }

    // AVERAGE(col)
    const avgMatch = f.match(/^AVERAGE\((\w+)\)$/i);
    if (avgMatch) {
      const colName = avgMatch[1];
      const col = columns.find(c => c.name === colName);
      if (col) {
        const vals = allRows.map(r => parseFloat(r.cells[col.id])).filter(v => !isNaN(v));
        return vals.length ? (vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(2) : 0;
      }
    }

    // COUNT(col)
    const countMatch = f.match(/^COUNT\((\w+)\)$/i);
    if (countMatch) {
      const colName = countMatch[1];
      const col = columns.find(c => c.name === colName);
      if (col) return allRows.filter(r => r.cells[col.id] != null && r.cells[col.id] !== "").length;
    }

    // MAX(col)
    const maxMatch = f.match(/^MAX\((\w+)\)$/i);
    if (maxMatch) {
      const colName = maxMatch[1];
      const col = columns.find(c => c.name === colName);
      if (col) return Math.max(...allRows.map(r => parseFloat(r.cells[col.id]) || 0));
    }

    // MIN(col)
    const minMatch = f.match(/^MIN\((\w+)\)$/i);
    if (minMatch) {
      const colName = minMatch[1];
      const col = columns.find(c => c.name === colName);
      if (col) return Math.min(...allRows.map(r => parseFloat(r.cells[col.id]) || 0));
    }

    // IF(condition, true, false)
    const ifMatch = f.match(/^IF\((.+),(.+),(.+)\)$/i);
    if (ifMatch) {
      const cond = ifMatch[1].trim();
      const trueVal = ifMatch[2].trim();
      const falseVal = ifMatch[3].trim();
      // Simple comparison: colName > value
      const compMatch = cond.match(/(\w+)\s*(>|<|>=|<=|==|!=)\s*(.+)/);
      if (compMatch) {
        const col = columns.find(c => c.name === compMatch[1]);
        if (col) {
          const cellVal = parseFloat(row.cells[col.id]) || 0;
          const compVal = parseFloat(compMatch[3]) || 0;
          const op = compMatch[2];
          let result = false;
          if (op === ">") result = cellVal > compVal;
          else if (op === "<") result = cellVal < compVal;
          else if (op === ">=") result = cellVal >= compVal;
          else if (op === "<=") result = cellVal <= compVal;
          else if (op === "==") result = cellVal === compVal;
          else if (op === "!=") result = cellVal !== compVal;
          return result ? trueVal.replace(/"/g, "") : falseVal.replace(/"/g, "");
        }
      }
    }

    // CONCAT(col1, col2)
    const concatMatch = f.match(/^CONCAT\((.+)\)$/i);
    if (concatMatch) {
      const parts = concatMatch[1].split(",").map(s => s.trim());
      return parts.map(p => {
        const col = columns.find(c => c.name === p);
        return col ? (row.cells[col.id] || "") : p.replace(/"/g, "");
      }).join("");
    }

    // SUMIF(col, condition, sumCol)
    const sumifMatch = f.match(/^SUMIF\((\w+),(.+),(\w+)\)$/i);
    if (sumifMatch) {
      const condCol = columns.find(c => c.name === sumifMatch[1]);
      const condVal = sumifMatch[2].trim().replace(/"/g, "");
      const sumCol = columns.find(c => c.name === sumifMatch[3]);
      if (condCol && sumCol) {
        return allRows.filter(r => String(r.cells[condCol.id]) === condVal)
          .reduce((acc, r) => acc + (parseFloat(r.cells[sumCol.id]) || 0), 0);
      }
    }

    // COUNTIF(col, condition)
    const countifMatch = f.match(/^COUNTIF\((\w+),(.+)\)$/i);
    if (countifMatch) {
      const condCol = columns.find(c => c.name === countifMatch[1]);
      const condVal = countifMatch[2].trim().replace(/"/g, "");
      if (condCol) {
        return allRows.filter(r => String(r.cells[condCol.id]) === condVal).length;
      }
    }

    // Simple arithmetic: col1 + col2, col1 * col2, etc.
    const arithMatch = f.match(/^(\w+)\s*([+\-*/])\s*(\w+)$/);
    if (arithMatch) {
      const col1 = columns.find(c => c.name === arithMatch[1]);
      const col2 = columns.find(c => c.name === arithMatch[3]);
      if (col1 && col2) {
        const v1 = parseFloat(row.cells[col1.id]) || 0;
        const v2 = parseFloat(row.cells[col2.id]) || 0;
        const op = arithMatch[2];
        if (op === "+") return v1 + v2;
        if (op === "-") return v1 - v2;
        if (op === "*") return v1 * v2;
        if (op === "/") return v2 !== 0 ? (v1 / v2).toFixed(2) : "ERR";
      }
    }

    // Direct column reference
    const refCol = columns.find(c => c.name === f);
    if (refCol) return row.cells[refCol.id] || "";

    return formula;
  } catch { return "ERR"; }
}

// Filter engine
function applyFilter(rows: Row[], filter: FilterRule, columns: Column[]): Row[] {
  const col = columns.find(c => c.id === filter.columnId);
  if (!col) return rows;
  return rows.filter(r => {
    const v = r.cells[col.id];
    const fv = filter.value;
    switch (filter.operator) {
      case "equals": return String(v) === fv;
      case "contains": return String(v || "").toLowerCase().includes(fv.toLowerCase());
      case "gt": return parseFloat(v) > parseFloat(fv);
      case "lt": return parseFloat(v) < parseFloat(fv);
      case "gte": return parseFloat(v) >= parseFloat(fv);
      case "lte": return parseFloat(v) <= parseFloat(fv);
      case "isEmpty": return v == null || v === "";
      case "isNotEmpty": return v != null && v !== "";
      default: return true;
    }
  });
}

// Sort engine
function applySort(rows: Row[], sort: SortRule, columns: Column[]): Row[] {
  const col = columns.find(c => c.id === sort.columnId);
  if (!col) return rows;
  return [...rows].sort((a, b) => {
    const av = a.cells[col.id]; const bv = b.cells[col.id];
    if (col.type === "number" || col.type === "formula") {
      const diff = (parseFloat(av) || 0) - (parseFloat(bv) || 0);
      return sort.direction === "asc" ? diff : -diff;
    }
    const diff = String(av || "").localeCompare(String(bv || ""));
    return sort.direction === "asc" ? diff : -diff;
  });
}

export default function SpreadsheetTable({ darkMode = true, accentColor = "#569cd6" }: SpreadsheetProps) {
  const bg = darkMode ? "#1e1e1e" : "#fff";
  const cellBg = darkMode ? "#252526" : "#fafafa";
  const headerBg = darkMode ? "#2d2d2d" : "#f0f0f0";
  const tx = darkMode ? "#e0e0e0" : "#333";
  const tx2 = darkMode ? "#888" : "#999";
  const bd = darkMode ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)";
  const hv = darkMode ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)";
  const ac = accentColor;

  const [columns, setColumns] = useState<Column[]>([
    { id: "col-1", name: "이름", type: "text", width: 160 },
    { id: "col-2", name: "수량", type: "number", width: 100 },
    { id: "col-3", name: "단가", type: "number", width: 100 },
    { id: "col-4", name: "합계", type: "formula", width: 120, formula: "=수량 * 단가" },
    { id: "col-5", name: "상태", type: "select", width: 120, options: ["진행중", "완료", "보류", "취소"] },
    { id: "col-6", name: "날짜", type: "date", width: 130 },
    { id: "col-7", name: "확인", type: "checkbox", width: 60 },
  ]);

  const [rows, setRows] = useState<Row[]>(() => {
    const initial: Row[] = [];
    for (let i = 0; i < 5; i++) {
      initial.push({ id: uid(), cells: { "col-1": `항목 ${i + 1}`, "col-2": (i + 1) * 10, "col-3": 1000, "col-5": "진행중", "col-6": "2026-03-29", "col-7": false } });
    }
    return initial;
  });

  const [editCell, setEditCell] = useState<{ rowId: string; colId: string } | null>(null);
  const [editValue, setEditValue] = useState("");
  const [filters, setFilters] = useState<FilterRule[]>([]);
  const [sorts, setSorts] = useState<SortRule[]>([]);
  const [groupByCol, setGroupByCol] = useState<string | null>(null);
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [showGroupPanel, setShowGroupPanel] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState(() => new Date());
  const [colResize, setColResize] = useState<{ colId: string; startX: number; startW: number } | null>(null);
  const [showNewColMenu, setShowNewColMenu] = useState(false);
  const [editColHeader, setEditColHeader] = useState<string | null>(null);
  const [editColName, setEditColName] = useState("");
  const tableRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { if (editCell && inputRef.current) inputRef.current.focus(); }, [editCell]);

  // Column resize
  useEffect(() => {
    if (!colResize) return;
    const move = (e: MouseEvent) => {
      const diff = e.clientX - colResize.startX;
      setColumns(prev => prev.map(c => c.id === colResize.colId ? { ...c, width: Math.max(50, colResize.startW + diff) } : c));
    };
    const up = () => setColResize(null);
    window.addEventListener("mousemove", move);
    window.addEventListener("mouseup", up);
    return () => { window.removeEventListener("mousemove", move); window.removeEventListener("mouseup", up); };
  }, [colResize]);

  // Process rows: filter → sort → group
  const processedRows = useMemo(() => {
    let result = [...rows];
    for (const f of filters) result = applyFilter(result, f, columns);
    for (const s of sorts) result = applySort(result, s, columns);
    return result;
  }, [rows, filters, sorts, columns]);

  const groupedRows = useMemo(() => {
    if (!groupByCol) return null;
    const groups: Record<string, Row[]> = {};
    for (const r of processedRows) {
      const key = String(r.cells[groupByCol] || "(빈값)");
      if (!groups[key]) groups[key] = [];
      groups[key].push(r);
    }
    return groups;
  }, [processedRows, groupByCol]);

  // Cell edit
  const startEdit = (rowId: string, colId: string) => {
    const col = columns.find(c => c.id === colId);
    if (col?.type === "formula" || col?.type === "checkbox") return;
    const row = rows.find(r => r.id === rowId);
    setEditCell({ rowId, colId });
    setEditValue(row?.cells[colId] ?? "");
  };

  const commitEdit = () => {
    if (!editCell) return;
    const col = columns.find(c => c.id === editCell.colId);
    let val: any = editValue;
    if (col?.type === "number") val = parseFloat(editValue) || 0;
    setRows(prev => prev.map(r => r.id === editCell.rowId ? { ...r, cells: { ...r.cells, [editCell.colId]: val } } : r));
    setEditCell(null);
  };

  const toggleCheckbox = (rowId: string, colId: string) => {
    setRows(prev => prev.map(r => r.id === rowId ? { ...r, cells: { ...r.cells, [colId]: !r.cells[colId] } } : r));
  };

  const addRow = () => {
    setRows(prev => [...prev, { id: uid(), cells: {} }]);
  };

  const deleteRow = (id: string) => {
    setRows(prev => prev.filter(r => r.id !== id));
  };

  const addColumn = (type: Column["type"]) => {
    const col: Column = { id: uid(), name: `열 ${columns.length + 1}`, type, width: 120 };
    if (type === "select") col.options = ["옵션1", "옵션2", "옵션3"];
    setColumns(prev => [...prev, col]);
    setShowNewColMenu(false);
  };

  const deleteColumn = (id: string) => {
    setColumns(prev => prev.filter(c => c.id !== id));
    setRows(prev => prev.map(r => { const cells = { ...r.cells }; delete cells[id]; return { ...r, cells }; }));
  };

  // Render cell
  const renderCell = (row: Row, col: Column) => {
    const isEditing = editCell?.rowId === row.id && editCell?.colId === col.id;

    if (col.type === "formula") {
      const val = col.formula ? evaluateFormula(col.formula, row, rows, columns) : "";
      return <div style={{ padding: "6px 8px", fontSize: 13, color: ac, fontWeight: 500 }}>{val}</div>;
    }

    if (col.type === "checkbox") {
      return (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%" }}
          onClick={() => toggleCheckbox(row.id, col.id)}>
          <div style={{ width: 16, height: 16, borderRadius: 3, border: `1.5px solid ${row.cells[col.id] ? ac : tx2}`,
            background: row.cells[col.id] ? ac : "transparent", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.15s" }}>
            {row.cells[col.id] && <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg>}
          </div>
        </div>
      );
    }

    if (col.type === "select" && !isEditing) {
      const val = row.cells[col.id] || "";
      const colors: Record<string, string> = { "진행중": "#4fc3f7", "완료": "#66bb6a", "보류": "#ffa726", "취소": "#ef5350" };
      return (
        <div onClick={() => startEdit(row.id, col.id)} style={{ padding: "4px 8px", cursor: "pointer" }}>
          {val && <span style={{ padding: "2px 8px", borderRadius: 10, fontSize: 11, fontWeight: 600, background: (colors[val] || ac) + "22", color: colors[val] || ac }}>{val}</span>}
        </div>
      );
    }

    if (isEditing) {
      if (col.type === "select") {
        return (
          <select value={editValue} onChange={e => { setEditValue(e.target.value); }} onBlur={commitEdit} autoFocus
            style={{ width: "100%", height: "100%", background: cellBg, color: tx, border: `1px solid ${ac}`, outline: "none", fontSize: 13, padding: "4px 6px", borderRadius: 0 }}>
            <option value="">선택...</option>
            {col.options?.map(o => <option key={o} value={o}>{o}</option>)}
          </select>
        );
      }
      if (col.type === "date") {
        return <input ref={inputRef} type="date" value={editValue} onChange={e => setEditValue(e.target.value)} onBlur={commitEdit}
          onKeyDown={e => { if (e.key === "Enter") commitEdit(); if (e.key === "Escape") setEditCell(null); }}
          style={{ width: "100%", height: "100%", background: cellBg, color: tx, border: `1px solid ${ac}`, outline: "none", fontSize: 13, padding: "4px 6px" }} />;
      }
      return <input ref={inputRef} value={editValue} onChange={e => setEditValue(e.target.value)} onBlur={commitEdit}
        onKeyDown={e => { if (e.key === "Enter") commitEdit(); if (e.key === "Escape") setEditCell(null); if (e.key === "Tab") { e.preventDefault(); commitEdit(); } }}
        style={{ width: "100%", height: "100%", background: cellBg, color: tx, border: `1px solid ${ac}`, outline: "none", fontSize: 13, padding: "4px 6px" }} />;
    }

    return (
      <div onClick={() => startEdit(row.id, col.id)} style={{ padding: "6px 8px", fontSize: 13, cursor: "text", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
        {row.cells[col.id] ?? ""}
      </div>
    );
  };

  // Calendar view
  const calendarDates = useMemo(() => {
    const year = calendarMonth.getFullYear();
    const month = calendarMonth.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const dates: (number | null)[] = [];
    for (let i = 0; i < firstDay; i++) dates.push(null);
    for (let i = 1; i <= daysInMonth; i++) dates.push(i);
    return dates;
  }, [calendarMonth]);

  const dateColumn = columns.find(c => c.type === "date");
  const getEventsForDate = (day: number) => {
    if (!dateColumn) return [];
    const dateStr = `${calendarMonth.getFullYear()}-${String(calendarMonth.getMonth() + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return rows.filter(r => r.cells[dateColumn.id] === dateStr);
  };

  // Toolbar
  const renderToolbar = () => (
    <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 12px", borderBottom: `1px solid ${bd}`, flexWrap: "wrap" }}>
      <button onClick={() => setShowFilterPanel(!showFilterPanel)}
        style={{ padding: "4px 10px", fontSize: 12, borderRadius: 4, border: `1px solid ${bd}`, background: showFilterPanel ? ac + "22" : "transparent", color: showFilterPanel ? ac : tx2, cursor: "pointer" }}>
        ▼ 필터 {filters.length > 0 && `(${filters.length})`}
      </button>
      <button onClick={() => setShowGroupPanel(!showGroupPanel)}
        style={{ padding: "4px 10px", fontSize: 12, borderRadius: 4, border: `1px solid ${bd}`, background: groupByCol ? ac + "22" : "transparent", color: groupByCol ? ac : tx2, cursor: "pointer" }}>
        ≡ 그룹 {groupByCol && `(${columns.find(c => c.id === groupByCol)?.name})`}
      </button>
      <button onClick={() => { setSorts(prev => prev.length ? [] : [{ columnId: columns[0]?.id || "", direction: "asc" }]); }}
        style={{ padding: "4px 10px", fontSize: 12, borderRadius: 4, border: `1px solid ${bd}`, background: sorts.length ? ac + "22" : "transparent", color: sorts.length ? ac : tx2, cursor: "pointer" }}>
        ↕ 정렬
      </button>
      <button onClick={() => setShowCalendar(!showCalendar)}
        style={{ padding: "4px 10px", fontSize: 12, borderRadius: 4, border: `1px solid ${bd}`, background: showCalendar ? ac + "22" : "transparent", color: showCalendar ? ac : tx2, cursor: "pointer" }}>
        📅 캘린더
      </button>
      <div style={{ flex: 1 }} />
      <span style={{ fontSize: 11, color: tx2 }}>{processedRows.length}개 행 · {columns.length}개 열</span>
    </div>
  );

  // Filter panel
  const renderFilterPanel = () => showFilterPanel && (
    <div style={{ padding: "8px 12px", borderBottom: `1px solid ${bd}`, background: hv }}>
      {filters.map((f, i) => (
        <div key={i} style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: 4 }}>
          <select value={f.columnId} onChange={e => { const nf = [...filters]; nf[i] = { ...f, columnId: e.target.value }; setFilters(nf); }}
            style={{ padding: "3px 6px", fontSize: 12, background: cellBg, color: tx, border: `1px solid ${bd}`, borderRadius: 4 }}>
            {columns.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <select value={f.operator} onChange={e => { const nf = [...filters]; nf[i] = { ...f, operator: e.target.value as any }; setFilters(nf); }}
            style={{ padding: "3px 6px", fontSize: 12, background: cellBg, color: tx, border: `1px solid ${bd}`, borderRadius: 4 }}>
            <option value="contains">포함</option><option value="equals">같음</option><option value="gt">보다 큼</option>
            <option value="lt">보다 작음</option><option value="isEmpty">비어있음</option><option value="isNotEmpty">비어있지 않음</option>
          </select>
          <input value={f.value} onChange={e => { const nf = [...filters]; nf[i] = { ...f, value: e.target.value }; setFilters(nf); }}
            style={{ padding: "3px 6px", fontSize: 12, background: cellBg, color: tx, border: `1px solid ${bd}`, borderRadius: 4, width: 100 }} />
          <span onClick={() => setFilters(prev => prev.filter((_, j) => j !== i))} style={{ cursor: "pointer", color: "#e55", fontSize: 14 }}>✕</span>
        </div>
      ))}
      <span onClick={() => setFilters(prev => [...prev, { columnId: columns[0]?.id || "", operator: "contains", value: "" }])}
        style={{ fontSize: 12, color: ac, cursor: "pointer" }}>+ 필터 추가</span>
    </div>
  );

  // Group panel
  const renderGroupPanel = () => showGroupPanel && (
    <div style={{ padding: "8px 12px", borderBottom: `1px solid ${bd}`, background: hv, display: "flex", gap: 8, alignItems: "center" }}>
      <span style={{ fontSize: 12, color: tx2 }}>그룹 기준:</span>
      <select value={groupByCol || ""} onChange={e => setGroupByCol(e.target.value || null)}
        style={{ padding: "3px 6px", fontSize: 12, background: cellBg, color: tx, border: `1px solid ${bd}`, borderRadius: 4 }}>
        <option value="">없음</option>
        {columns.filter(c => c.type !== "formula" && c.type !== "checkbox").map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
      </select>
    </div>
  );

  // Render row
  const renderRow = (row: Row, idx: number) => (
    <div key={row.id} style={{ display: "flex", borderBottom: `1px solid ${bd}`, minHeight: 34 }}
      onMouseEnter={e => { e.currentTarget.style.background = hv; }} onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}>
      <div style={{ width: 40, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, color: tx2, flexShrink: 0, position: "relative" }}>
        <span className="row-num">{idx + 1}</span>
        <span className="row-del" onClick={() => deleteRow(row.id)}
          style={{ display: "none", position: "absolute", cursor: "pointer", color: "#e55", fontSize: 13 }}>✕</span>
      </div>
      {columns.map(col => (
        <div key={col.id} style={{ width: col.width, minWidth: col.width, borderRight: `1px solid ${bd}`, overflow: "hidden" }}>
          {renderCell(row, col)}
        </div>
      ))}
    </div>
  );

  // Calendar view
  const renderCalendarView = () => showCalendar && (
    <div style={{ padding: 16, borderBottom: `1px solid ${bd}` }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <button onClick={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1, 1))}
          style={{ background: "transparent", border: `1px solid ${bd}`, color: tx, padding: "4px 8px", borderRadius: 4, cursor: "pointer" }}>◂</button>
        <span style={{ fontSize: 14, fontWeight: 600 }}>{calendarMonth.getFullYear()}년 {calendarMonth.getMonth() + 1}월</span>
        <button onClick={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 1))}
          style={{ background: "transparent", border: `1px solid ${bd}`, color: tx, padding: "4px 8px", borderRadius: 4, cursor: "pointer" }}>▸</button>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 2 }}>
        {["일", "월", "화", "수", "목", "금", "토"].map(d => (
          <div key={d} style={{ textAlign: "center", fontSize: 11, color: tx2, padding: 4, fontWeight: 600 }}>{d}</div>
        ))}
        {calendarDates.map((day, i) => (
          <div key={i} style={{ minHeight: 60, background: day ? cellBg : "transparent", borderRadius: 4, padding: 4, border: day ? `1px solid ${bd}` : "none" }}>
            {day && <>
              <div style={{ fontSize: 11, color: tx2, marginBottom: 2 }}>{day}</div>
              {getEventsForDate(day).map(ev => (
                <div key={ev.id} style={{ fontSize: 10, padding: "1px 4px", borderRadius: 3, background: ac + "22", color: ac, marginBottom: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {ev.cells[columns[0]?.id] || "이벤트"}
                </div>
              ))}
            </>}
          </div>
        ))}
      </div>
    </div>
  );

  // Sort panel (inline in toolbar)
  const renderSortConfig = () => sorts.length > 0 && (
    <div style={{ padding: "8px 12px", borderBottom: `1px solid ${bd}`, background: hv, display: "flex", gap: 8, alignItems: "center" }}>
      <span style={{ fontSize: 12, color: tx2 }}>정렬:</span>
      <select value={sorts[0]?.columnId} onChange={e => setSorts([{ ...sorts[0], columnId: e.target.value }])}
        style={{ padding: "3px 6px", fontSize: 12, background: cellBg, color: tx, border: `1px solid ${bd}`, borderRadius: 4 }}>
        {columns.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
      </select>
      <select value={sorts[0]?.direction} onChange={e => setSorts([{ ...sorts[0], direction: e.target.value as any }])}
        style={{ padding: "3px 6px", fontSize: 12, background: cellBg, color: tx, border: `1px solid ${bd}`, borderRadius: 4 }}>
        <option value="asc">오름차순</option><option value="desc">내림차순</option>
      </select>
      <span onClick={() => setSorts([])} style={{ cursor: "pointer", color: "#e55", fontSize: 12 }}>제거</span>
    </div>
  );

  return (
    <div style={{ background: bg, borderRadius: 8, border: `1px solid ${bd}`, overflow: "hidden", fontSize: 13, color: tx }}>
      <style>{`
        .row-del { display: none !important; }
        div:hover > .row-num { display: none !important; }
        div:hover > .row-del { display: flex !important; }
      `}</style>

      {renderToolbar()}
      {renderFilterPanel()}
      {renderGroupPanel()}
      {renderSortConfig()}
      {renderCalendarView()}

      {/* Table */}
      <div ref={tableRef} style={{ overflowX: "auto" }}>
        {/* Header */}
        <div style={{ display: "flex", borderBottom: `2px solid ${bd}`, background: headerBg, position: "sticky", top: 0, zIndex: 2 }}>
          <div style={{ width: 40, flexShrink: 0 }} />
          {columns.map(col => (
            <div key={col.id} style={{ width: col.width, minWidth: col.width, padding: "6px 8px", fontSize: 12, fontWeight: 600, color: tx2, borderRight: `1px solid ${bd}`,
              display: "flex", alignItems: "center", justifyContent: "space-between", position: "relative", userSelect: "none" }}>
              {editColHeader === col.id ? (
                <input value={editColName} onChange={e => setEditColName(e.target.value)} autoFocus
                  onBlur={() => { setColumns(prev => prev.map(c => c.id === col.id ? { ...c, name: editColName } : c)); setEditColHeader(null); }}
                  onKeyDown={e => { if (e.key === "Enter") { setColumns(prev => prev.map(c => c.id === col.id ? { ...c, name: editColName } : c)); setEditColHeader(null); } }}
                  style={{ background: "transparent", border: `1px solid ${ac}`, color: tx, fontSize: 12, padding: "1px 4px", borderRadius: 3, outline: "none", width: "100%" }} />
              ) : (
                <span onDoubleClick={() => { setEditColHeader(col.id); setEditColName(col.name); }} style={{ cursor: "default", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {col.name} {col.type === "formula" && <span style={{ color: ac, fontSize: 10 }}>ƒ</span>}
                </span>
              )}
              <span onClick={() => deleteColumn(col.id)} style={{ opacity: 0, cursor: "pointer", fontSize: 10, color: "#e55", transition: "opacity 0.15s" }}
                onMouseEnter={e => { e.currentTarget.style.opacity = "1"; }} onMouseLeave={e => { e.currentTarget.style.opacity = "0"; }}>✕</span>
              {/* Resize handle */}
              <div onMouseDown={e => { e.preventDefault(); setColResize({ colId: col.id, startX: e.clientX, startW: col.width }); }}
                style={{ position: "absolute", right: 0, top: 0, bottom: 0, width: 4, cursor: "col-resize" }}
                onMouseEnter={e => { e.currentTarget.style.background = ac; }} onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }} />
            </div>
          ))}
          {/* Add column button */}
          <div style={{ width: 40, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", position: "relative" }}
            onClick={() => setShowNewColMenu(!showNewColMenu)}>
            <span style={{ fontSize: 16, color: tx2, fontWeight: 300 }}>+</span>
            {showNewColMenu && (
              <div style={{ position: "absolute", top: "100%", right: 0, background: cellBg, border: `1px solid ${bd}`, borderRadius: 6, padding: "4px 0", zIndex: 10, minWidth: 120, boxShadow: "0 4px 20px rgba(0,0,0,0.3)" }}>
                {(["text", "number", "date", "select", "checkbox", "formula", "url"] as Column["type"][]).map(type => (
                  <div key={type} onClick={(e) => { e.stopPropagation(); addColumn(type); }}
                    style={{ padding: "6px 12px", fontSize: 12, cursor: "pointer" }}
                    onMouseEnter={e => { e.currentTarget.style.background = hv; }} onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}>
                    {{ text: "📝 텍스트", number: "🔢 숫자", date: "📅 날짜", select: "📋 선택", checkbox: "☑ 체크박스", formula: "ƒ 수식", url: "🔗 URL" }[type]}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Rows */}
        {groupedRows ? (
          Object.entries(groupedRows).map(([group, gRows]) => (
            <div key={group}>
              <div style={{ padding: "6px 12px", fontSize: 12, fontWeight: 600, color: ac, background: hv, borderBottom: `1px solid ${bd}` }}>
                {columns.find(c => c.id === groupByCol)?.name}: {group} <span style={{ color: tx2, fontWeight: 400 }}>({gRows.length})</span>
              </div>
              {gRows.map((r, i) => renderRow(r, i))}
            </div>
          ))
        ) : (
          processedRows.map((r, i) => renderRow(r, i))
        )}

        {/* Add row */}
        <div onClick={addRow} style={{ display: "flex", alignItems: "center", padding: "8px 12px", cursor: "pointer", color: tx2, fontSize: 12, borderBottom: `1px solid ${bd}` }}
          onMouseEnter={e => { e.currentTarget.style.background = hv; }} onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}>
          + 새 행 추가
        </div>

        {/* Summary row */}
        <div style={{ display: "flex", background: headerBg, borderTop: `1px solid ${bd}` }}>
          <div style={{ width: 40, flexShrink: 0, padding: "6px 0", textAlign: "center", fontSize: 10, color: tx2 }}>Σ</div>
          {columns.map(col => (
            <div key={col.id} style={{ width: col.width, minWidth: col.width, padding: "6px 8px", fontSize: 11, color: ac, fontWeight: 600, borderRight: `1px solid ${bd}` }}>
              {col.type === "number" && rows.reduce((a, r) => a + (parseFloat(r.cells[col.id]) || 0), 0).toLocaleString()}
              {col.type === "formula" && col.formula && (() => { const total = rows.reduce((a, r) => a + (parseFloat(String(evaluateFormula(col.formula!, r, rows, columns))) || 0), 0); return total.toLocaleString(); })()}
              {col.type === "checkbox" && `${rows.filter(r => r.cells[col.id]).length}/${rows.length}`}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
