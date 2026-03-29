/* ── ORBIT Spreadsheet Formula Engine (VBA-like) ── */

export type CellValue = string | number | boolean | null | undefined;

export interface Column {
  id: string;
  name: string;
  type: "text"|"number"|"date"|"select"|"checkbox"|"formula"|"url"|"percent";
  width: number;
  options?: string[];
  formula?: string;
}

export interface Row {
  id: string;
  cells: Record<string, CellValue>;
}

export function evalFormula(f: string, row: Row, allRows: Row[], cols: Column[]): CellValue {
  try {
    const expr = f.startsWith("=") ? f.slice(1).trim() : f.trim();
    const getCol = (name: string) => cols.find(c => c.name.toLowerCase() === name.toLowerCase());
    const getVal = (name: string) => { const c = getCol(name); return c ? row.cells[c.id] : undefined; };
    const getAllVals = (name: string) => { const c = getCol(name); return c ? allRows.map(r => r.cells[c.id]) : []; };

    // Aggregate functions
    const aggFns: [string, (v: number[]) => number][] = [
      ["SUM", v => v.reduce((a, b) => a + b, 0)],
      ["AVERAGE", v => v.length ? v.reduce((a, b) => a + b, 0) / v.length : 0],
      ["COUNT", v => v.length],
      ["MAX", v => Math.max(...v)],
      ["MIN", v => Math.min(...v)],
      ["MEDIAN", v => { const s = [...v].sort((a, b) => a - b); const m = Math.floor(s.length / 2); return s.length % 2 ? s[m] : (s[m-1]+s[m])/2; }],
    ];
    for (const [fn, reducer] of aggFns) {
      const re = new RegExp(`^${fn}\\(([^)]+)\\)$`, "i");
      const m = expr.match(re);
      if (m) { const nums = getAllVals(m[1].trim()).map(v => parseFloat(String(v || 0))).filter(v => !isNaN(v)); return Math.round(reducer(nums) * 100) / 100; }
    }

    // SUMIF(condCol, condVal, sumCol)
    const sumifM = expr.match(/^SUMIF\((\w+)\s*,\s*"?([^",]+)"?\s*,\s*(\w+)\)$/i);
    if (sumifM) { const cc = getCol(sumififM[1]); const sc = getCol(sumififM[3]); if (cc && sc) return allRows.filter(r => String(r.cells[cc.id] || "") === sumififM[2]).reduce((a, r) => a + (parseFloat(String(r.cells[sc.id] || 0)) || 0), 0); }

    // COUNTIF(col, val)
    const countifM = expr.match(/^COUNTIF\((\w+)\s*,\s*"?([^",]+)"?\)$/i);
    if (countifM) { const cc = getCol(countifM[1]); if (cc) return allRows.filter(r => String(r.cells[cc.id] || "") === countifM[2]).length; }

    // IF(cond, trueVal, falseVal)
    const ifM = expr.match(/^IF\((.+?)\s*,\s*(.+?)\s*,\s*(.+?)\)$/i);
    if (ifM) {
      const comp = ifM[1].trim().match(/(\w+)\s*(>=|<=|!=|==|>|<)\s*(.+)/);
      if (comp) {
        const cv = parseFloat(String(getVal(comp[1]) || 0)) || 0;
        const rv = parseFloat(comp[3]) || 0;
        let result = false;
        if (comp[2]===">" ) result = cv > rv; else if (comp[2]==="<" ) result = cv < rv;
        else if (comp[2]===">=") result = cv >= rv; else if (comp[2]==="<=") result = cv <= rv;
        else if (comp[2]==="==") result = cv === rv; else if (comp[2]==="!=") result = cv !== rv;
        return result ? ifM[2].replace(/"/g,"") : ifM[3].replace(/"/g,"");
      }
    }

    // CONCAT(col1, col2, ...)
    const concatM = expr.match(/^CONCAT\((.+)\)$/i);
    if (concatM) return concatM[1].split(",").map(s => { const c = getCol(s.trim()); return c ? String(row.cells[c.id] || "") : s.trim().replace(/"/g,""); }).join("");

    // ROUND(expr, decimals)
    const roundM = expr.match(/^ROUND\((.+?)\s*,\s*(\d+)\)$/i);
    if (roundM) { const inner = evalFormula("=" + roundM[1], row, allRows, cols); const d = parseInt(roundM[2]); return Math.round(parseFloat(String(inner || 0)) * Math.pow(10, d)) / Math.pow(10, d); }

    // Basic Arithmetic (+, -, *, /)
    const ops: [string, RegExp][] = [["+", /\+/], ["-", /-(?! )/], ["*", /\*/], ["/", /\//]];
    for (const [op, re] of ops) {
      if (expr.includes(op)) {
        const pts = expr.split(re);
        if (pts.length === 2) {
          const l = evalFormula("=" + pts[0].trim(), row, allRows, cols);
          const r = evalFormula("=" + pts[1].trim(), row, allRows, cols);
          const ln = parseFloat(String(l || 0)), rn = parseFloat(String(r || 0));
          if (op === "+") return ln + rn; if (op === "-") return ln - rn; if (op === "*") return ln * rn; if (op === "/") return rn !== 0 ? ln / rn : 0;
        }
      }
    }

    const c = getCol(expr); return c ? row.cells[c.id] : expr.replace(/"/g,"");
  } catch { return "#ERROR!"; }
}
