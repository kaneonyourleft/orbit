"use client";
import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { createClient } from "../lib/supabase";

/* ── Types ── */
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
  height?: number;
}

interface Sheet {
  id: string;
  name: string;
  columns: Column[];
  rows: Row[];
}

interface SpreadsheetProps {
  darkMode?: boolean;
  accentColor?: string;
  pageId?: string;
}

const uid = () => Math.random().toString(36).slice(2, 11);

/* ── Formula Engine ── */
function colIndexToLetter(i: number): string {
  let letter = "";
  while (i >= 0) {
    letter = String.fromCharCode((i % 26) + 65) + letter;
    i = Math.floor(i / 26) - 1;
  }
  return letter;
}

function evaluateFormula(formula: string, rowIdx: number, sheet: Sheet): any {
  if (!formula.startsWith("=")) return formula;
  try {
    const f = formula.slice(1).toUpperCase();
    
    // 1. Resolve cell references (e.g., A1, B2)
    const resolved = f.replace(/([A-Z]+)([0-9]+)/g, (match, colLetter, rowNum) => {
      const cIdx = colLetter.split("").reduce((acc: number, char: string) => acc * 26 + char.charCodeAt(0) - 64, 0) - 1;
      const rIdx = parseInt(rowNum) - 1;
      const colId = sheet.columns[cIdx]?.id;
      const val = sheet.rows[rIdx]?.cells[colId] || 0;
      return isNaN(val) ? `"${val}"` : val;
    });

    // 2. Simple math functions
    if (resolved.startsWith("SUM(")) {
      const range = resolved.match(/SUM\((.+):(.+)\)/); // A1:B10
      if (range) {
         // Range sum not fully implemented yet, but we can do basic SUM(val1, val2)
      }
      const valsMatch = resolved.match(/SUM\((.+)\)/);
      if (valsMatch) {
         const vals = valsMatch[1].split(",").map(v => eval(v));
         return vals.reduce((a, b) => a + (parseFloat(b) || 0), 0);
      }
    }

    // 3. Eval safe subset
    // eslint-disable-next-line no-eval
    return eval(resolved); 
  } catch { return "#REF!"; }
}

/* ── Component ── */
export default function SpreadsheetTable({ darkMode = true, accentColor = "#a78bfa", pageId }: SpreadsheetProps) {
  const [sheets, setSheets] = useState<Sheet[]>([
    {
      id: "sheet-1",
      name: "Sheet 1",
      columns: [
        { id: "col-1", name: "A", type: "text", width: 150 },
        { id: "col-2", name: "B", type: "number", width: 100 },
        { id: "col-3", name: "C", type: "number", width: 100 },
        { id: "col-4", name: "D", type: "formula", width: 120 },
      ],
      rows: Array.from({ length: 20 }, (_, i) => ({
        id: uid(),
        cells: { "col-1": `Item ${i + 1}`, "col-2": (i + 1) * 10, "col-3": 100 }
      }))
    }
  ]);
  const [activeSheetId, setActiveSheetId] = useState("sheet-1");
  const [selection, setSelection] = useState<{ start: { r: number, c: number } | null, end: { r: number, c: number } | null }>({ start: null, end: null });
  const [editCell, setEditCell] = useState<{ r: number, c: number } | null>(null);
  const [editValue, setEditValue] = useState("");
  const [loading, setLoading] = useState(false);
  
  const activeSheet = sheets.find(s => s.id === activeSheetId) || sheets[0];
  const columns = activeSheet.columns;
  const rows = activeSheet.rows;

  const bg = darkMode ? "#13111a" : "#fff";
  const bd = darkMode ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)";
  const tx = darkMode ? "#e2dff0" : "#333";
  const tx2 = darkMode ? "#8880a8" : "#999";
  const ac = accentColor;
  const hv = darkMode ? "rgba(167,139,250,0.06)" : "rgba(167,139,250,0.04)";

  /* ── Supabase Persistence ── */
  useEffect(() => {
    if (!pageId) return;
    const load = async () => {
      setLoading(true);
      const supabase = createClient();
      const { data } = await supabase.from("pages").select("content").eq("id", pageId).single();
      if (data?.content && Array.isArray(data.content)) {
        setSheets(data.content as Sheet[]);
        if (data.content[0]) setActiveSheetId(data.content[0].id);
      }
      setLoading(false);
    };
    load();
  }, [pageId]);

  const saveToSupabase = useCallback(async (newSheets: Sheet[]) => {
    if (!pageId) return;
    const supabase = createClient();
    await supabase.from("pages").update({ content: newSheets as any }).eq("id", pageId);
  }, [pageId]);

  // Debounced save
  useEffect(() => {
    const timer = setTimeout(() => saveToSupabase(sheets), 1000);
    return () => clearTimeout(timer);
  }, [sheets, saveToSupabase]);

  /* ── Helpers ── */
  const isSelected = (r: number, c: number) => {
    if (!selection.start || !selection.end) return false;
    const minR = Math.min(selection.start.r, selection.end.r);
    const maxR = Math.max(selection.start.r, selection.end.r);
    const minC = Math.min(selection.start.c, selection.end.c);
    const maxC = Math.max(selection.start.c, selection.end.c);
    return r >= minR && r <= maxR && c >= minC && c <= maxC;
  };

  const handleMouseDown = (r: number, c: number, e: React.MouseEvent) => {
    if (e.button !== 0) return;
    setSelection({ start: { r, c }, end: { r, c } });
    setEditCell(null);
  };

  const handleMouseEnter = (r: number, c: number) => {
    if (selection.start && !editCell) {
      setSelection(prev => ({ ...prev, end: { r, c } }));
    }
  };

  const handleDoubleClick = (r: number, c: number) => {
    const colId = columns[c].id;
    setEditCell({ r, c });
    setEditValue(rows[r].cells[colId] || "");
  };

  const commitEdit = () => {
    if (!editCell) return;
    const { r, c } = editCell;
    const colId = columns[c].id;
    const newSheets = sheets.map(s => s.id === activeSheetId ? {
      ...s,
      rows: s.rows.map((row, idx) => idx === r ? { ...row, cells: { ...row.cells, [colId]: editValue } } : row)
    } : s);
    setSheets(newSheets);
    setEditCell(null);
  };

  /* ── Clipboard ── */
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (editCell) return;
      
      // Copy
      if ((e.ctrlKey || e.metaKey) && e.key === "c") {
        if (!selection.start || !selection.end) return;
        const minR = Math.min(selection.start.r, selection.end.r);
        const maxR = Math.max(selection.start.r, selection.end.r);
        const minC = Math.min(selection.start.c, selection.end.c);
        const maxC = Math.max(selection.start.c, selection.end.c);
        
        let data = "";
        for (let r = minR; r <= maxR; r++) {
          for (let c = minC; c <= maxC; c++) {
            data += (rows[r].cells[columns[c].id] || "") + (c === maxC ? "" : "\t");
          }
          data += (r === maxR ? "" : "\n");
        }
        navigator.clipboard.writeText(data);
        e.preventDefault();
      }

      // Paste
      if ((e.ctrlKey || e.metaKey) && e.key === "v") {
        if (!selection.start) return;
        navigator.clipboard.readText().then(text => {
          const lines = text.split("\n");
          const rOffset = selection.start!.r;
          const cOffset = selection.start!.c;
          
          const newSheets = sheets.map(s => {
            if (s.id !== activeSheetId) return s;
            const nextRows = [...s.rows];
            lines.forEach((line, i) => {
              const cells = line.split("\t");
              const rIdx = rOffset + i;
              if (rIdx < nextRows.length) {
                cells.forEach((val, j) => {
                  const cIdx = cOffset + j;
                  if (cIdx < s.columns.length) {
                    nextRows[rIdx] = { ...nextRows[rIdx], cells: { ...nextRows[rIdx].cells, [s.columns[cIdx].id]: val } };
                  }
                });
              }
            });
            return { ...s, rows: nextRows };
          });
          setSheets(newSheets);
        });
        e.preventDefault();
      }

      // Delete/Backspace
      if (e.key === "Delete" || e.key === "Backspace") {
        if (!selection.start || !selection.end) return;
        const minR = Math.min(selection.start.r, selection.end.r);
        const maxR = Math.max(selection.start.r, selection.end.r);
        const minC = Math.min(selection.start.c, selection.end.c);
        const maxC = Math.max(selection.start.c, selection.end.c);
        
        const newSheets = sheets.map(s => {
          if (s.id !== activeSheetId) return s;
          const nextRows = s.rows.map((row, r) => {
            if (r >= minR && r <= maxR) {
              const nextCells = { ...row.cells };
              for (let c = minC; c <= maxC; c++) delete nextCells[s.columns[c].id];
              return { ...row, cells: nextCells };
            }
            return row;
          });
          return { ...s, rows: nextRows };
        });
        setSheets(newSheets);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selection, editCell, rows, columns, activeSheetId, sheets]);

  /* ── Table Components ── */
  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", background: bg, overflow: "hidden" }}>
      {/* Spreadsheet Toolbar (Formula Bar) */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", borderBottom: `1px solid ${bd}`, flexShrink: 0 }}>
        <div style={{ background: hv, padding: "4px 10px", borderRadius: 4, fontStyle: "italic", fontSize: 13, color: ac }}>fx</div>
        <input 
          title="수식 입력"
          value={editCell ? editValue : (selection.start ? rows[selection.start.r].cells[columns[selection.start.c].id] || "" : "")}
          onChange={e => { if (editCell) setEditValue(e.target.value); }}
          placeholder="수식이나 값을 입력하세요"
          style={{ flex: 1, background: "transparent", border: "none", outline: "none", color: tx, fontSize: 13 }}
        />
        {loading && <div style={{ fontSize: 11, color: tx2 }}>저장 중...</div>}
      </div>

      {/* Grid */}
      <div style={{ flex: 1, overflow: "auto", position: "relative" }}>
        <table style={{ borderCollapse: "collapse", tableLayout: "fixed", width: "max-content" }}>
          <thead style={{ position: "sticky", top: 0, zIndex: 10 }}>
            <tr>
              <th style={{ width: 40, background: darkMode ? "#1a1726" : "#f0f0f0", border: `1px solid ${bd}`, position: "sticky", left: 0, zIndex: 12 }} />
              {columns.map((col, i) => (
                <th key={col.id} style={{ 
                  width: col.width, height: 32, background: darkMode ? "#1a1726" : "#f0f0f0", 
                  border: `1px solid ${bd}`, fontSize: 11, color: tx2, fontWeight: 600, textAlign: "center", position: "relative" 
                }}>
                  {colIndexToLetter(i)}
                  <div style={{ position: "absolute", right: 0, top: 0, bottom: 0, width: 4, cursor: "col-resize" }} />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, r) => (
              <tr key={row.id}>
                <td style={{ width: 40, height: 26, background: darkMode ? "#1a1726" : "#f0f0f0", border: `1px solid ${bd}`, fontSize: 10, color: tx2, textAlign: "center" }}>{r + 1}</td>
                {columns.map((col, c) => {
                  const isEd = editCell?.r === r && editCell?.c === c;
                  const isSel = isSelected(r, c);
                  const val = row.cells[col.id];
                  const displayVal = String(val || "").startsWith("=") ? evaluateFormula(String(val), r, activeSheet) : val;

                  return (
                    <td 
                      key={col.id}
                      onMouseDown={(e) => handleMouseDown(r, c, e)}
                      onMouseEnter={() => handleMouseEnter(r, c)}
                      onDoubleClick={() => handleDoubleClick(r, c)}
                      style={{ 
                        border: `1px solid ${bd}`, padding: 0, position: "relative",
                        background: isEd ? bg : (isSel ? (darkMode ? "rgba(167,139,250,0.15)" : "rgba(167,139,250,0.2)") : "transparent")
                      }}
                    >
                      {isEd ? (
                        <input 
                          title="셀 수정"
                          autoFocus
                          value={editValue}
                          onChange={e => setEditValue(e.target.value)}
                          onBlur={commitEdit}
                          onKeyDown={e => {
                            if (e.key === "Enter") commitEdit();
                            if (e.key === "Escape") setEditCell(null);
                          }}
                          style={{ 
                            width: "100%", height: "100%", background: "transparent", border: `2px solid ${ac}`,
                            outline: "none", padding: "0 6px", color: tx, fontSize: 13, boxSizing: "border-box"
                          }}
                        />
                      ) : (
                        <div style={{ 
                          padding: "0 6px", fontSize: 13, height: 26, display: "flex", alignItems: "center",
                          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                          color: String(val || "").startsWith("=") ? ac : tx
                        }}>
                          {displayVal}
                        </div>
                      )}
                      {/* Selection border indicator (bottom-right handle) */}
                      {isSel && selection.end?.r === r && selection.end?.c === c && (
                        <div style={{ 
                          position: "absolute", bottom: -3, right: -3, width: 6, height: 6, 
                          background: ac, border: "1px solid #fff", zIndex: 5, cursor: "crosshair"
                        }} />
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Sheet Tabs */}
      <div style={{ height: 34, display: "flex", alignItems: "center", background: darkMode ? "#1a1726" : "#f0f0f0", borderTop: `1px solid ${bd}`, padding: "0 8px" }}>
        {sheets.map(s => (
          <div 
            key={s.id}
            onClick={() => setActiveSheetId(s.id)}
            style={{ 
              padding: "0 16px", height: "100%", display: "flex", alignItems: "center", fontSize: 12, cursor: "pointer",
              background: activeSheetId === s.id ? bg : "transparent",
              borderTop: activeSheetId === s.id ? `2px solid ${ac}` : "2px solid transparent",
              color: activeSheetId === s.id ? tx : tx2, fontWeight: activeSheetId === s.id ? 600 : 400
            }}
          >
            {s.name}
          </div>
        ))}
        <div 
          onClick={() => {
            const nextId = uid();
            const newSheet: Sheet = {
              id: nextId,
              name: `Sheet ${sheets.length + 1}`,
              columns: [...columns],
              rows: Array.from({ length: 50 }, () => ({ id: uid(), cells: {} }))
            };
            setSheets([...sheets, newSheet]);
            setActiveSheetId(nextId);
          }}
          style={{ padding: "0 12px", height: "100%", display: "flex", alignItems: "center", cursor: "pointer", color: tx2, fontSize: 14 }}
        >
          +
        </div>
      </div>
    </div>
  );
}
