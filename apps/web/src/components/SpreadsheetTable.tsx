"use client";
import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { createClient } from "../lib/supabase";

/* ── Types ── */
interface Column {
  id: string;
  name: string;
  type: "text"|"number"|"date"|"select"|"checkbox"|"formula"|"url"|"percent";
  width: number;
  options?: string[];
  formula?: string;
}

interface Row {
  id: string;
  cells: Record<string, any>;
}

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
}

const uid = () => Math.random().toString(36).slice(2, 10);

/* ── Formula Engine (VBA-like) ── */
function evalFormula(f: string, row: Row, allRows: Row[], cols: Column[]): any {
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
      if (m) { const nums = getAllVals(m[1].trim()).map(v => parseFloat(v)).filter(v => !isNaN(v)); return Math.round(reducer(nums) * 100) / 100; }
    }

    // SUMIF(condCol, condVal, sumCol)
    const sumifM = expr.match(/^SUMIF\((\w+)\s*,\s*"?([^",]+)"?\s*,\s*(\w+)\)$/i);
    if (sumifM) { const cc = getCol(sumifM[1]); const sc = getCol(sumifM[3]); if (cc && sc) return allRows.filter(r => String(r.cells[cc.id]) === sumifM[2]).reduce((a, r) => a + (parseFloat(r.cells[sc.id]) || 0), 0); }

    // COUNTIF(col, val)
    const countifM = expr.match(/^COUNTIF\((\w+)\s*,\s*"?([^",]+)"?\)$/i);
    if (countifM) { const cc = getCol(countifM[1]); if (cc) return allRows.filter(r => String(r.cells[cc.id]) === countifM[2]).length; }

    // IF(cond, trueVal, falseVal)
    const ifM = expr.match(/^IF\((.+?)\s*,\s*(.+?)\s*,\s*(.+?)\)$/i);
    if (ifM) {
      const comp = ifM[1].trim().match(/(\w+)\s*(>=|<=|!=|==|>|<)\s*(.+)/);
      if (comp) {
        const cv = parseFloat(String(getVal(comp[1]))) || 0;
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
    if (concatM) return concatM[1].split(",").map(s => { const c = getCol(s.trim()); return c ? (row.cells[c.id]||"") : s.trim().replace(/"/g,""); }).join("");

    // ROUND(expr, decimals)
    const roundM = expr.match(/^ROUND\((.+?)\s*,\s*(\d+)\)$/i);
    if (roundM) { const inner = evalFormula("="+roundM[1], row, allRows, cols); const d = parseInt(roundM[2]); return Math.round(parseFloat(inner)*Math.pow(10,d))/Math.pow(10,d); }

    // ABS(col)
    const absM = expr.match(/^ABS\((.+)\)$/i);
    if (absM) return Math.abs(parseFloat(String(getVal(absM[1])))||0);

    // Arithmetic: col1 op col2
    const arithM = expr.match(/^(\w+)\s*([+\-*/])\s*(\w+)$/);
    if (arithM) {
      const v1 = parseFloat(String(getVal(arithM[1])))||0;
      const v2 = parseFloat(String(getVal(arithM[3])))||0;
      if (arithM[2]==="+") return v1+v2; if (arithM[2]==="-") return v1-v2;
      if (arithM[2]==="*") return v1*v2; if (arithM[2]==="/") return v2 ? Math.round(v1/v2*100)/100 : "ERR";
    }

    // Direct column ref
    const ref = getCol(expr);
    if (ref) return row.cells[ref.id]||"";

    // Numeric literal
    if (!isNaN(Number(expr))) return Number(expr);

    return f;
  } catch { return "ERR"; }
}

/* ── Filter ── */
function applyFilters(rows: Row[], filters: FilterRule[], cols: Column[]): Row[] {
  let r = [...rows];
  for (const f of filters) {
    const col = cols.find(c => c.id === f.columnId); if (!col) continue;
    r = r.filter(row => {
      const v = row.cells[col.id]; const fv = f.value;
      switch (f.operator) {
        case "equals": return String(v)===fv;
        case "contains": return String(v||"").toLowerCase().includes(fv.toLowerCase());
        case "gt": return parseFloat(v)>parseFloat(fv);
        case "lt": return parseFloat(v)<parseFloat(fv);
        case "gte": return parseFloat(v)>=parseFloat(fv);
        case "lte": return parseFloat(v)<=parseFloat(fv);
        case "isEmpty": return v==null||v==="";
        case "isNotEmpty": return v!=null&&v!=="";
        case "startsWith": return String(v||"").toLowerCase().startsWith(fv.toLowerCase());
        case "endsWith": return String(v||"").toLowerCase().endsWith(fv.toLowerCase());
        default: return true;
      }
    });
  }
  return r;
}

/* ── Sort ── */
function applySort(rows: Row[], sorts: SortRule[], cols: Column[]): Row[] {
  if (!sorts.length) return rows;
  return [...rows].sort((a, b) => {
    for (const s of sorts) {
      const col = cols.find(c => c.id === s.columnId); if (!col) continue;
      const av = a.cells[col.id]; const bv = b.cells[col.id];
      let diff: number;
      if (col.type==="number"||col.type==="percent") diff=(parseFloat(av)||0)-(parseFloat(bv)||0);
      else if (col.type==="date") diff=new Date(av||0).getTime()-new Date(bv||0).getTime();
      else diff=String(av||"").localeCompare(String(bv||""));
      if (diff!==0) return s.direction==="asc"?diff:-diff;
    }
    return 0;
  });
}

/* ── Component ── */
export default function SpreadsheetTable({ darkMode=true, accentColor="#569cd6", pageId }: Props) {
  const bg = darkMode?"#1a1a1a":"#fff";
  const cellBg = darkMode?"#222":"#fafafa";
  const headerBg = darkMode?"#2a2a2a":"#f5f5f5";
  const tx = darkMode?"#e0e0e0":"#333";
  const tx2 = darkMode?"#777":"#999";
  const bd = darkMode?"rgba(255,255,255,0.06)":"rgba(0,0,0,0.08)";
  const hv = darkMode?"rgba(255,255,255,0.03)":"rgba(0,0,0,0.02)";
  const ac = accentColor;
  const selBg = ac+"15";
  const statusColors: Record<string,string> = {"진행중":"#4fc3f7","완료":"#66bb6a","보류":"#ffa726","취소":"#ef5350"};

  const defaultSheets: Sheet[] = [{
    id:"sheet-1", name:"Sheet 1",
    columns:[
      {id:"A",name:"이름",type:"text",width:160},
      {id:"B",name:"수량",type:"number",width:100},
      {id:"C",name:"단가",type:"number",width:100},
      {id:"D",name:"합계",type:"formula",width:120,formula:"=수량 * 단가"},
      {id:"E",name:"상태",type:"select",width:120,options:["진행중","완료","보류","취소"]},
      {id:"F",name:"날짜",type:"date",width:130},
      {id:"G",name:"확인",type:"checkbox",width:60},
    ],
    rows: Array.from({length:5},(_,i)=>({id:uid(),cells:{A:`항목 ${i+1}`,B:(i+1)*10,C:1000,E:"진행중",F:"2026-03-29",G:false}})),
  }];

  const [sheets, setSheets] = useState<Sheet[]>(defaultSheets);
  const [activeSheet, setActiveSheet] = useState("sheet-1");
  const [editCell, setEditCell] = useState<{rowId:string;colId:string}|null>(null);
  const [editValue, setEditValue] = useState("");
  const [selection, setSelection] = useState<{sr:number;sc:number;er:number;ec:number}|null>(null);
  const [filters, setFilters] = useState<FilterRule[]>([]);
  const [sorts, setSorts] = useState<SortRule[]>([]);
  const [groupByCol, setGroupByCol] = useState<string|null>(null);
  const [showFilter, setShowFilter] = useState(false);
  const [showGroup, setShowGroup] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [calMonth, setCalMonth] = useState(()=>new Date());
  const [colResize, setColResize] = useState<{colId:string;startX:number;startW:number}|null>(null);
  const [showNewCol, setShowNewCol] = useState(false);
  const [editColId, setEditColId] = useState<string|null>(null);
  const [editColName, setEditColName] = useState("");
  const [ctxMenu, setContextMenu] = useState<{x:number;y:number;rowId?:string;colId?:string}|null>(null);
  const [editSheetId, setEditSheetId] = useState<string|null>(null);
  const [editSheetName, setEditSheetName] = useState("");
  const [formulaBarValue, setFormulaBarValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const saveTimer = useRef<any>(null);
  const loaded = useRef(false);

  const sheet = sheets.find(s=>s.id===activeSheet)||sheets[0];
  if (!sheet) return <div style={{padding:20,color:tx2}}>시트 로딩 중...</div>;
  const columns = sheet.columns||[];
  const rows = sheet.rows||[];

  useEffect(()=>{if(editCell&&inputRef.current)inputRef.current.focus();},[editCell]);

  // Column resize
  useEffect(()=>{
    if(!colResize) return;
    const move=(e:MouseEvent)=>{setSheets(p=>p.map(s=>s.id!==activeSheet?s:{...s,columns:s.columns.map(c=>c.id===colResize.colId?{...c,width:Math.max(40,colResize.startW+(e.clientX-colResize.startX))}:c)}));};
    const up=()=>setColResize(null);
    window.addEventListener("mousemove",move); window.addEventListener("mouseup",up);
    return()=>{window.removeEventListener("mousemove",move);window.removeEventListener("mouseup",up);};
  },[colResize,activeSheet]);

  // Close context menu
  useEffect(()=>{const h=()=>setContextMenu(null);window.addEventListener("click",h);return()=>window.removeEventListener("click",h);},[]);

  /* ── Supabase Persistence ── */
  const saveToDb = useCallback(async(data: Sheet[])=>{
    if(!pageId) return;
    try{
      const supabase=createClient();
      const {data:existing}=await supabase.from("pages").select("content").eq("id",pageId).single();
      const prev=existing?.content||{};
      await supabase.from("pages").update({content:{...prev,sheets:data}}).eq("id",pageId);
    }catch(e){console.error("Table save error:",e);}
  },[pageId]);

  const updateSheets = useCallback((updater:(prev:Sheet[])=>Sheet[])=>{
    setSheets(prev=>{
      const next=updater(prev);
      if(saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current=setTimeout(()=>saveToDb(next),1000);
      return next;
    });
  },[saveToDb]);

  // Load
  useEffect(()=>{
    if(!pageId||loaded.current) return;
    loaded.current=true;
    (async()=>{
      try{
        const supabase=createClient();
        const {data}=await supabase.from("pages").select("content").eq("id",pageId).single();
        if(data?.content){
          const raw=data.content as any;
          let s: Sheet[]|null=null;
          if(raw.sheets&&Array.isArray(raw.sheets)&&raw.sheets[0]?.columns) s=raw.sheets;
          else if(Array.isArray(raw)&&raw[0]?.columns) s=raw;
          if(s&&s.length>0){setSheets(s);setActiveSheet(s[0].id);}
        }
      }catch{}
    })();
  },[pageId]);

  // Processed rows
  const processed = useMemo(()=>{
    let r=[...rows];
    if(filters.length) r=applyFilters(r,filters,columns);
    if(sorts.length) r=applySort(r,sorts,columns);
    return r;
  },[rows,filters,sorts,columns]);

  const grouped = useMemo(()=>{
    if(!groupByCol) return null;
    const g:Record<string,Row[]>={};
    for(const r of processed){const k=String(r.cells[groupByCol]||"(빈값)");if(!g[k])g[k]=[];g[k].push(r);}
    return g;
  },[processed,groupByCol]);

  // Cell selection check
  const isSel=(ri:number,ci:number)=>{
    if(!selection) return false;
    const minR=Math.min(selection.sr,selection.er), maxR=Math.max(selection.sr,selection.er);
    const minC=Math.min(selection.sc,selection.ec), maxC=Math.max(selection.sc,selection.ec);
    return ri>=minR&&ri<=maxR&&ci>=minC&&ci<=maxC;
  };

  // Cell ops
  const startEdit=(rowId:string,colId:string)=>{
    const col=columns.find(c=>c.id===colId);
    if(col?.type==="formula"||col?.type==="checkbox") return;
    setEditCell({rowId,colId});
    const val=rows.find(r=>r.id===rowId)?.cells[colId]??"";
    setEditValue(String(val));
    setFormulaBarValue(String(val));
  };

  const commitEdit=()=>{
    if(!editCell) return;
    const col=columns.find(c=>c.id===editCell.colId);
    let val:any=editValue;
    if(col?.type==="number"||col?.type==="percent") val=parseFloat(editValue)||0;
    updateSheets(p=>p.map(s=>s.id!==activeSheet?s:{...s,rows:s.rows.map(r=>r.id===editCell.rowId?{...r,cells:{...r.cells,[editCell.colId]:val}}:r)}));
    setEditCell(null);
  };

  const toggleCheck=(rowId:string,colId:string)=>{
    updateSheets(p=>p.map(s=>s.id!==activeSheet?s:{...s,rows:s.rows.map(r=>r.id===rowId?{...r,cells:{...r.cells,[colId]:!r.cells[colId]}}:r)}));
  };

  const addRow=()=>updateSheets(p=>p.map(s=>s.id!==activeSheet?s:{...s,rows:[...s.rows,{id:uid(),cells:{}}]}));
  const deleteRow=(id:string)=>updateSheets(p=>p.map(s=>s.id!==activeSheet?s:{...s,rows:s.rows.filter(r=>r.id!==id)}));
  const dupRow=(id:string)=>{const r=rows.find(r=>r.id===id);if(r)updateSheets(p=>p.map(s=>s.id!==activeSheet?s:{...s,rows:[...s.rows,{...r,id:uid()}]}));};
  const insertAbove=(id:string)=>{const idx=rows.findIndex(r=>r.id===id);updateSheets(p=>p.map(s=>s.id!==activeSheet?s:{...s,rows:[...s.rows.slice(0,idx),{id:uid(),cells:{}},...s.rows.slice(idx)]}));};
  const insertBelow=(id:string)=>{const idx=rows.findIndex(r=>r.id===id);updateSheets(p=>p.map(s=>s.id!==activeSheet?s:{...s,rows:[...s.rows.slice(0,idx+1),{id:uid(),cells:{}},...s.rows.slice(idx+1)]}));};

  const addCol=(type:Column["type"])=>{
    const col:Column={id:uid(),name:`열${columns.length+1}`,type,width:120};
    if(type==="select") col.options=["옵션1","옵션2","옵션3"];
    if(type==="formula") col.formula="";
    updateSheets(p=>p.map(s=>s.id!==activeSheet?s:{...s,columns:[...s.columns,col]}));
    setShowNewCol(false);
  };
  const deleteCol=(id:string)=>{
    updateSheets(p=>p.map(s=>s.id!==activeSheet?s:{...s,columns:s.columns.filter(c=>c.id!==id),rows:s.rows.map(r=>{const c={...r.cells};delete c[id];return{...r,cells:c};})}));
  };

  // Sheet ops
  const addSheet=()=>{const ns:Sheet={id:uid(),name:`Sheet ${sheets.length+1}`,columns:[{id:uid(),name:"열1",type:"text",width:160}],rows:[{id:uid(),cells:{}}]};updateSheets(p=>[...p,ns]);setActiveSheet(ns.id);};
  const deleteSheet=(id:string)=>{if(sheets.length<=1)return;updateSheets(p=>p.filter(s=>s.id!==id));if(activeSheet===id)setActiveSheet(sheets[0].id===id?sheets[1]?.id:sheets[0].id);};

  // Clipboard
  const copySelection=useCallback(()=>{
    if(!selection) return;
    const minR=Math.min(selection.sr,selection.er),maxR=Math.max(selection.sr,selection.er);
    const minC=Math.min(selection.sc,selection.ec),maxC=Math.max(selection.sc,selection.ec);
    const lines:string[]=[];
    for(let r=minR;r<=maxR;r++){const row=processed[r];if(!row)continue;const vals:string[]=[];for(let c=minC;c<=maxC;c++){const col=columns[c];if(!col)continue;vals.push(String(row.cells[col.id]??""));}lines.push(vals.join("\t"));}
    navigator.clipboard.writeText(lines.join("\n")).catch(()=>{});
  },[selection,processed,columns]);

  const pasteFromClipboard=useCallback(async()=>{
    if(!selection) return;
    try{
      const text=await navigator.clipboard.readText();
      const lines=text.split("\n").map(l=>l.split("\t"));
      const sr=Math.min(selection.sr,selection.er), sc=Math.min(selection.sc,selection.ec);
      updateSheets(p=>p.map(s=>{
        if(s.id!==activeSheet) return s;
        const nr=[...s.rows];
        for(let r=0;r<lines.length;r++){
          const ri=sr+r; if(ri>=nr.length) nr.push({id:uid(),cells:{}});
          for(let c=0;c<lines[r].length;c++){
            const ci=sc+c; if(ci<s.columns.length) nr[ri]={...nr[ri],cells:{...nr[ri].cells,[s.columns[ci].id]:lines[r][c]}};
          }
        }
        return{...s,rows:nr};
      }));
    }catch{}
  },[selection,activeSheet,updateSheets]);

  // Keyboard
  useEffect(()=>{
    const h=(e:KeyboardEvent)=>{
      if((e.ctrlKey||e.metaKey)&&e.key==="c"){copySelection();e.preventDefault();}
      if((e.ctrlKey||e.metaKey)&&e.key==="v"){pasteFromClipboard();e.preventDefault();}
      if(e.key==="Delete"&&selection&&!editCell){
        const minR=Math.min(selection.sr,selection.er),maxR=Math.max(selection.sr,selection.er);
        const minC=Math.min(selection.sc,selection.ec),maxC=Math.max(selection.sc,selection.ec);
        updateSheets(p=>p.map(s=>{
          if(s.id!==activeSheet) return s;
          return{...s,rows:s.rows.map((r,ri)=>{
            if(ri<minR||ri>maxR) return r;
            const c={...r.cells}; for(let ci=minC;ci<=maxC;ci++){const col=s.columns[ci];if(col)delete c[col.id];} return{...r,cells:c};
          })};
        }));
      }
    };
    window.addEventListener("keydown",h);return()=>window.removeEventListener("keydown",h);
  },[copySelection,pasteFromClipboard,selection,editCell,activeSheet,updateSheets]);

  // Calendar
  const calDates=useMemo(()=>{
    const y=calMonth.getFullYear(),m=calMonth.getMonth();
    const fd=new Date(y,m,1).getDay(),dim=new Date(y,m+1,0).getDate();
    const d:(number|null)[]=[];for(let i=0;i<fd;i++)d.push(null);for(let i=1;i<=dim;i++)d.push(i);return d;
  },[calMonth]);
  const dateCols=columns.filter(c=>c.type==="date");
  const getEvents=(day:number)=>{if(!dateCols.length)return[];const ds=`${calMonth.getFullYear()}-${String(calMonth.getMonth()+1).padStart(2,"0")}-${String(day).padStart(2,"0")}`;return rows.filter(r=>dateCols.some(c=>r.cells[c.id]===ds));};

  /* ── Render Cell ── */
  const renderCell=(row:Row,col:Column,ri:number,ci:number)=>{
    const isEditing=editCell?.rowId===row.id&&editCell?.colId===col.id;
    const selected=isSel(ri,ci);
    const base:any={width:col.width,minWidth:col.width,height:32,borderRight:`1px solid ${bd}`,overflow:"hidden",background:selected?selBg:"transparent",position:"relative"};

    if(col.type==="formula"){
      const val=col.formula?evalFormula(col.formula,row,rows,columns):"";
      return <div style={base} onClick={()=>setSelection({sr:ri,sc:ci,er:ri,ec:ci})}><div style={{padding:"6px 8px",fontSize:13,color:ac,fontWeight:500}}>{typeof val==="number"?val.toLocaleString():val}</div></div>;
    }

    if(col.type==="checkbox"){
      return <div style={{...base,display:"flex",alignItems:"center",justifyContent:"center"}} onClick={()=>{toggleCheck(row.id,col.id);setSelection({sr:ri,sc:ci,er:ri,ec:ci});}}>
        <div style={{width:16,height:16,borderRadius:3,border:`1.5px solid ${row.cells[col.id]?ac:tx2}`,background:row.cells[col.id]?ac:"transparent",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",transition:"all 0.15s"}}>
          {row.cells[col.id]&&<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>}
        </div>
      </div>;
    }

    if(col.type==="select"&&!isEditing){
      const val=row.cells[col.id]||"";
      return <div style={base} onClick={()=>{startEdit(row.id,col.id);setSelection({sr:ri,sc:ci,er:ri,ec:ci});}}>
        <div style={{padding:"4px 8px"}}>{val&&<span style={{padding:"2px 8px",borderRadius:10,fontSize:11,fontWeight:600,background:(statusColors[val]||ac)+"22",color:statusColors[val]||ac}}>{val}</span>}</div>
      </div>;
    }

    if(col.type==="percent"&&!isEditing){
      const val=parseFloat(row.cells[col.id])||0;
      return <div style={base} onClick={()=>{startEdit(row.id,col.id);setSelection({sr:ri,sc:ci,er:ri,ec:ci});}}>
        <div style={{padding:"6px 8px",display:"flex",alignItems:"center",gap:6}}>
          <div style={{flex:1,height:6,borderRadius:3,background:bd}}><div style={{width:`${Math.min(100,val)}%`,height:"100%",borderRadius:3,background:ac,transition:"width 0.3s"}}/></div>
          <span style={{fontSize:11,color:tx2,minWidth:32,textAlign:"right"}}>{val}%</span>
        </div>
      </div>;
    }

    if(col.type==="url"&&!isEditing){
      const val=row.cells[col.id]||"";
      return <div style={base} onClick={()=>{startEdit(row.id,col.id);setSelection({sr:ri,sc:ci,er:ri,ec:ci});}}>
        <div style={{padding:"6px 8px",fontSize:13}}>{val&&<a href={val} target="_blank" rel="noopener" style={{color:ac,textDecoration:"none"}} onClick={e=>e.stopPropagation()}>{val}</a>}</div>
      </div>;
    }

    if(isEditing){
      if(col.type==="select"){
        return <div style={base}><select value={editValue} onChange={e=>setEditValue(e.target.value)} onBlur={commitEdit} autoFocus
          style={{width:"100%",height:"100%",background:cellBg,color:tx,border:`1px solid ${ac}`,outline:"none",fontSize:13,padding:"0 6px",fontFamily:"inherit"}}>
          <option value="">선택...</option>{col.options?.map(o=><option key={o} value={o}>{o}</option>)}
        </select></div>;
      }
      return <div style={base}><input ref={inputRef} type={col.type==="date"?"date":"text"} value={editValue}
        onChange={e=>{setEditValue(e.target.value);setFormulaBarValue(e.target.value);}}
        onBlur={commitEdit} onKeyDown={e=>{if(e.key==="Enter")commitEdit();if(e.key==="Escape")setEditCell(null);if(e.key==="Tab"){e.preventDefault();commitEdit();}}}
        style={{width:"100%",height:"100%",background:cellBg,color:tx,border:`1px solid ${ac}`,outline:"none",fontSize:13,padding:"0 8px",fontFamily:"inherit"}}/></div>;
    }

    return <div style={base}
      onClick={()=>setSelection({sr:ri,sc:ci,er:ri,ec:ci})}
      onDoubleClick={()=>startEdit(row.id,col.id)}
      onMouseDown={e=>{if(e.shiftKey&&selection)setSelection({...selection,er:ri,ec:ci});}}
      onContextMenu={e=>{e.preventDefault();setContextMenu({x:e.clientX,y:e.clientY,rowId:row.id,colId:col.id});}}>
      <div style={{padding:"6px 8px",fontSize:13,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
        {col.type==="number"?(parseFloat(row.cells[col.id])||0).toLocaleString():(row.cells[col.id]??"")}
      </div>
    </div>;
  };

  // Render row
  const renderRow=(row:Row,idx:number)=>(
    <div key={row.id} style={{display:"flex",borderBottom:`1px solid ${bd}`,height:32}}
      onMouseEnter={e=>{const rn=e.currentTarget.querySelector('.rn') as HTMLElement;const rd=e.currentTarget.querySelector('.rd') as HTMLElement;if(rn)rn.style.display="none";if(rd)rd.style.display="flex";}}
      onMouseLeave={e=>{const rn=e.currentTarget.querySelector('.rn') as HTMLElement;const rd=e.currentTarget.querySelector('.rd') as HTMLElement;if(rn)rn.style.display="flex";if(rd)rd.style.display="none";}}>
      <div style={{width:36,display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,color:tx2,flexShrink:0,borderRight:`1px solid ${bd}`,position:"relative"}}>
        <span className="rn">{idx+1}</span>
        <span className="rd" onClick={()=>deleteRow(row.id)} style={{display:"none",cursor:"pointer",color:"#e55",fontSize:12,alignItems:"center",justifyContent:"center"}}>✕</span>
      </div>
      {columns.map((col,ci)=>renderCell(row,col,idx,ci))}
    </div>
  );

  return(
    <div style={{background:bg,borderRadius:8,border:`1px solid ${bd}`,overflow:"hidden",fontSize:13,color:tx,fontFamily:"var(--font-main)"}}>

      {/* Formula bar */}
      <div style={{display:"flex",alignItems:"center",gap:8,padding:"6px 10px",borderBottom:`1px solid ${bd}`,background:headerBg}}>
        <div style={{background:ac+"20",padding:"2px 8px",borderRadius:4,fontSize:12,fontWeight:700,color:ac}}>fx</div>
        <input title="수식 입력" value={formulaBarValue} onChange={e=>{setFormulaBarValue(e.target.value);if(editCell)setEditValue(e.target.value);}}
          onKeyDown={e=>{if(e.key==="Enter"&&editCell)commitEdit();}}
          placeholder="셀을 선택하거나 수식을 입력하세요" style={{flex:1,background:"transparent",border:"none",outline:"none",color:tx,fontSize:13,fontFamily:"inherit"}}/>
      </div>

      {/* Toolbar */}
      <div style={{display:"flex",alignItems:"center",gap:4,padding:"6px 8px",borderBottom:`1px solid ${bd}`,flexWrap:"wrap"}}>
        {[{l:"▼ 필터",a:showFilter,c:filters.length,fn:()=>setShowFilter(!showFilter)},
          {l:"≡ 그룹",a:!!groupByCol,c:0,fn:()=>setShowGroup(!showGroup)},
          {l:"↕ 정렬",a:sorts.length>0,c:sorts.length,fn:()=>setSorts(p=>p.length?[]:[{columnId:columns[0]?.id||"",direction:"asc"}])},
          {l:"📅 캘린더",a:showCalendar,c:0,fn:()=>setShowCalendar(!showCalendar)},
        ].map((b,i)=>(
          <button key={i} onClick={b.fn} style={{padding:"3px 8px",fontSize:11,borderRadius:4,border:`1px solid ${b.a?ac:bd}`,background:b.a?ac+"15":"transparent",color:b.a?ac:tx2,cursor:"pointer",fontFamily:"inherit"}}>
            {b.l}{b.c>0?` (${b.c})`:""}
          </button>
        ))}
        <div style={{flex:1}}/>
        <span style={{fontSize:10,color:tx2}}>{processed.length}행 · {columns.length}열</span>
      </div>

      {/* Filter panel */}
      {showFilter&&<div style={{padding:"6px 8px",borderBottom:`1px solid ${bd}`,background:hv}}>
        {filters.map((f,i)=>(<div key={i} style={{display:"flex",gap:4,alignItems:"center",marginBottom:3}}>
          <select title="필터 열" value={f.columnId} onChange={e=>{const nf=[...filters];nf[i]={...f,columnId:e.target.value};setFilters(nf);}} style={{padding:"2px 4px",fontSize:11,background:cellBg,color:tx,border:`1px solid ${bd}`,borderRadius:3,fontFamily:"inherit"}}>
            {columns.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <select title="연산자" value={f.operator} onChange={e=>{const nf=[...filters];nf[i]={...f,operator:e.target.value as any};setFilters(nf);}} style={{padding:"2px 4px",fontSize:11,background:cellBg,color:tx,border:`1px solid ${bd}`,borderRadius:3,fontFamily:"inherit"}}>
            {["contains","equals","gt","lt","gte","lte","isEmpty","isNotEmpty","startsWith","endsWith"].map(o=>(
              <option key={o} value={o}>{{contains:"포함",equals:"같음",gt:">",lt:"<",gte:">=",lte:"<=",isEmpty:"비어있음",isNotEmpty:"비어있지않음",startsWith:"시작",endsWith:"끝"}[o]}</option>
            ))}
          </select>
          <input title="필터 값" value={f.value} onChange={e=>{const nf=[...filters];nf[i]={...f,value:e.target.value};setFilters(nf);}} placeholder="값"
            style={{padding:"2px 4px",fontSize:11,background:cellBg,color:tx,border:`1px solid ${bd}`,borderRadius:3,width:80,fontFamily:"inherit"}}/>
          <span onClick={()=>setFilters(p=>p.filter((_,j)=>j!==i))} style={{cursor:"pointer",color:"#e55",fontSize:12}}>✕</span>
        </div>))}
        <span onClick={()=>setFilters(p=>[...p,{columnId:columns[0]?.id||"",operator:"contains",value:""}])} style={{fontSize:11,color:ac,cursor:"pointer"}}>+ 필터 추가</span>
      </div>}

      {/* Group panel */}
      {showGroup&&<div style={{padding:"6px 8px",borderBottom:`1px solid ${bd}`,background:hv,display:"flex",gap:6,alignItems:"center"}}>
        <span style={{fontSize:11,color:tx2}}>그룹:</span>
        <select title="그룹 기준" value={groupByCol||""} onChange={e=>setGroupByCol(e.target.value||null)} style={{padding:"2px 4px",fontSize:11,background:cellBg,color:tx,border:`1px solid ${bd}`,borderRadius:3,fontFamily:"inherit"}}>
          <option value="">없음</option>{columns.filter(c=>c.type!=="formula"&&c.type!=="checkbox").map(c=><option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>}

      {/* Sort config */}
      {sorts.length>0&&<div style={{padding:"6px 8px",borderBottom:`1px solid ${bd}`,background:hv,display:"flex",gap:6,alignItems:"center"}}>
        <span style={{fontSize:11,color:tx2}}>정렬:</span>
        <select title="정렬 열" value={sorts[0]?.columnId} onChange={e=>setSorts([{...sorts[0],columnId:e.target.value}])} style={{padding:"2px 4px",fontSize:11,background:cellBg,color:tx,border:`1px solid ${bd}`,borderRadius:3,fontFamily:"inherit"}}>
          {columns.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select title="정렬 방향" value={sorts[0]?.direction} onChange={e=>setSorts([{...sorts[0],direction:e.target.value as any}])} style={{padding:"2px 4px",fontSize:11,background:cellBg,color:tx,border:`1px solid ${bd}`,borderRadius:3,fontFamily:"inherit"}}>
          <option value="asc">오름차순</option><option value="desc">내림차순</option>
        </select>
        <span onClick={()=>setSorts([])} style={{cursor:"pointer",color:"#e55",fontSize:11}}>제거</span>
      </div>}

      {/* Calendar */}
      {showCalendar&&<div style={{padding:12,borderBottom:`1px solid ${bd}`}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
          <button onClick={()=>setCalMonth(new Date(calMonth.getFullYear(),calMonth.getMonth()-1,1))} style={{background:"transparent",border:`1px solid ${bd}`,color:tx,padding:"2px 6px",borderRadius:3,cursor:"pointer"}}>◂</button>
          <span style={{fontSize:13,fontWeight:600}}>{calMonth.getFullYear()}년 {calMonth.getMonth()+1}월</span>
          <button onClick={()=>setCalMonth(new Date(calMonth.getFullYear(),calMonth.getMonth()+1,1))} style={{background:"transparent",border:`1px solid ${bd}`,color:tx,padding:"2px 6px",borderRadius:3,cursor:"pointer"}}>▸</button>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:2}}>
          {["일","월","화","수","목","금","토"].map(d=><div key={d} style={{textAlign:"center",fontSize:10,color:tx2,padding:3,fontWeight:600}}>{d}</div>)}
          {calDates.map((day,i)=>(<div key={i} style={{minHeight:48,background:day?cellBg:"transparent",borderRadius:3,padding:3,border:day?`1px solid ${bd}`:"none"}}>
            {day&&<><div style={{fontSize:10,color:tx2}}>{day}</div>{getEvents(day).slice(0,2).map(ev=>(<div key={ev.id} style={{fontSize:9,padding:"1px 3px",borderRadius:2,background:ac+"22",color:ac,marginTop:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{ev.cells[columns[0]?.id]||""}</div>))}</>}
          </div>))}
        </div>
      </div>}

      {/* Table */}
      <div style={{overflowX:"auto"}}>
        {/* Header */}
        <div style={{display:"flex",borderBottom:`2px solid ${bd}`,background:headerBg,position:"sticky",top:0,zIndex:2}}>
          <div style={{width:36,flexShrink:0,borderRight:`1px solid ${bd}`}}/>
          {columns.map(col=>(
            <div key={col.id} style={{width:col.width,minWidth:col.width,padding:"6px 8px",fontSize:11,fontWeight:700,color:tx2,borderRight:`1px solid ${bd}`,display:"flex",alignItems:"center",justifyContent:"space-between",position:"relative",userSelect:"none",textTransform:"uppercase",letterSpacing:0.3}}>
              {editColId===col.id?(
                <input title="열 이름 변경" value={editColName} onChange={e=>setEditColName(e.target.value)} autoFocus
                  onBlur={()=>{updateSheets(p=>p.map(s=>s.id!==activeSheet?s:{...s,columns:s.columns.map(c=>c.id===col.id?{...c,name:editColName}:c)}));setEditColId(null);}}
                  onKeyDown={e=>{if(e.key==="Enter"){updateSheets(p=>p.map(s=>s.id!==activeSheet?s:{...s,columns:s.columns.map(c=>c.id===col.id?{...c,name:editColName}:c)}));setEditColId(null);}}}
                  style={{background:"transparent",border:`1px solid ${ac}`,color:tx,fontSize:11,padding:"1px 4px",borderRadius:3,outline:"none",width:"100%",fontFamily:"inherit"}}/>
              ):(
                <span onDoubleClick={()=>{setEditColId(col.id);setEditColName(col.name);}} style={{cursor:"default",overflow:"hidden",textOverflow:"ellipsis",display:"flex",alignItems:"center",gap:4}}>
                  {col.name}<span style={{fontSize:9,opacity:0.4}}>{{text:"Aa",number:"#",date:"📅",select:"▼",checkbox:"☑",formula:"ƒ",url:"🔗",percent:"%"}[col.type]}</span>
                </span>
              )}
              <span onClick={()=>deleteCol(col.id)} style={{opacity:0,cursor:"pointer",fontSize:9,color:"#e55",transition:"opacity 0.15s"}}
                onMouseEnter={e=>{(e.target as HTMLElement).style.opacity="1";}} onMouseLeave={e=>{(e.target as HTMLElement).style.opacity="0";}}>✕</span>
              <div onMouseDown={e=>{e.preventDefault();setColResize({colId:col.id,startX:e.clientX,startW:col.width});}}
                style={{position:"absolute",right:0,top:0,bottom:0,width:4,cursor:"col-resize"}}
                onMouseEnter={e=>{(e.target as HTMLElement).style.background=ac;}} onMouseLeave={e=>{(e.target as HTMLElement).style.background="transparent";}}/>
            </div>
          ))}
          <div style={{width:36,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",position:"relative"}} onClick={()=>setShowNewCol(!showNewCol)}>
            <span style={{fontSize:14,color:tx2}}>+</span>
            {showNewCol&&(<div style={{position:"absolute",top:"100%",right:0,background:darkMode?"#2a2a2a":"#fff",border:`1px solid ${bd}`,borderRadius:6,padding:"4px 0",zIndex:10,minWidth:130,boxShadow:"0 4px 20px rgba(0,0,0,0.3)"}}>
              {(["text","number","date","select","checkbox","formula","url","percent"] as Column["type"][]).map(type=>(
                <div key={type} onClick={e=>{e.stopPropagation();addCol(type);}} style={{padding:"5px 10px",fontSize:12,cursor:"pointer"}}
                  onMouseEnter={e=>{(e.target as HTMLElement).style.background=hv;}} onMouseLeave={e=>{(e.target as HTMLElement).style.background="transparent";}}>
                  {{text:"Aa 텍스트",number:"# 숫자",date:"📅 날짜",select:"▼ 선택",checkbox:"☑ 체크박스",formula:"ƒ 수식",url:"🔗 URL",percent:"% 진행률"}[type]}
                </div>))}
            </div>)}
          </div>
        </div>

        {/* Body */}
        {grouped?Object.entries(grouped).map(([g,gRows])=>(
          <div key={g}>
            <div style={{padding:"4px 12px",fontSize:11,fontWeight:700,color:ac,background:hv,borderBottom:`1px solid ${bd}`,display:"flex",justifyContent:"space-between"}}>
              <span>{columns.find(c=>c.id===groupByCol)?.name}: {g}</span><span style={{color:tx2,fontWeight:400}}>{gRows.length}개</span>
            </div>
            {gRows.map((r,i)=>renderRow(r,i))}
          </div>
        )):processed.map((r,i)=>renderRow(r,i))}

        {/* Add row */}
        <div onClick={addRow} style={{padding:"6px 12px",cursor:"pointer",color:tx2,fontSize:12,borderBottom:`1px solid ${bd}`}}
          onMouseEnter={e=>{(e.target as HTMLElement).style.background=hv;}} onMouseLeave={e=>{(e.target as HTMLElement).style.background="transparent";}}>+ 새 행</div>

        {/* Summary */}
        <div style={{display:"flex",background:headerBg}}>
          <div style={{width:36,flexShrink:0,padding:"5px 0",textAlign:"center",fontSize:9,color:tx2,borderRight:`1px solid ${bd}`}}>Σ</div>
          {columns.map(col=>(
            <div key={col.id} style={{width:col.width,minWidth:col.width,padding:"5px 8px",fontSize:11,color:ac,fontWeight:600,borderRight:`1px solid ${bd}`}}>
              {(col.type==="number"||col.type==="percent")&&rows.reduce((a,r)=>a+(parseFloat(r.cells[col.id])||0),0).toLocaleString()}
              {col.type==="formula"&&col.formula&&rows.reduce((a,r)=>a+(parseFloat(String(evalFormula(col.formula!,r,rows,columns)))||0),0).toLocaleString()}
              {col.type==="checkbox"&&`${rows.filter(r=>r.cells[col.id]).length}/${rows.length}`}
            </div>
          ))}
        </div>
      </div>

      {/* Sheet tabs */}
      <div style={{display:"flex",alignItems:"center",borderTop:`1px solid ${bd}`,background:headerBg,padding:"0 4px"}}>
        {sheets.map(s=>(
          <div key={s.id} style={{display:"flex",alignItems:"center",gap:4}}>
            <div onClick={()=>setActiveSheet(s.id)} onDoubleClick={()=>{setEditSheetId(s.id);setEditSheetName(s.name);}}
              style={{padding:"6px 12px",fontSize:11,cursor:"pointer",fontWeight:activeSheet===s.id?600:400,color:activeSheet===s.id?ac:tx2,borderBottom:activeSheet===s.id?`2px solid ${ac}`:"2px solid transparent"}}>
              {editSheetId===s.id?(
                <input title="시트 이름" value={editSheetName} onChange={e=>setEditSheetName(e.target.value)} autoFocus
                  onBlur={()=>{updateSheets(p=>p.map(sh=>sh.id===s.id?{...sh,name:editSheetName}:sh));setEditSheetId(null);}}
                  onKeyDown={e=>{if(e.key==="Enter"){updateSheets(p=>p.map(sh=>sh.id===s.id?{...sh,name:editSheetName}:sh));setEditSheetId(null);}}}
                  onClick={e=>e.stopPropagation()} style={{background:"transparent",border:`1px solid ${ac}`,color:tx,fontSize:11,padding:"1px 4px",borderRadius:2,outline:"none",width:60}}/>
              ):s.name}
            </div>
            {sheets.length>1&&<span onClick={()=>deleteSheet(s.id)} style={{fontSize:10,cursor:"pointer",color:tx2,opacity:0.5}}>✕</span>}
          </div>
        ))}
        <div onClick={addSheet} style={{padding:"6px 8px",fontSize:12,cursor:"pointer",color:tx2}}>+</div>
      </div>

      {/* Context menu */}
      {ctxMenu&&(<div style={{position:"fixed",left:ctxMenu.x,top:ctxMenu.y,zIndex:9999,background:darkMode?"#2a2a2a":"#fff",border:`1px solid ${bd}`,borderRadius:6,padding:"4px 0",minWidth:150,boxShadow:"0 4px 20px rgba(0,0,0,0.3)"}}>
        {ctxMenu.rowId&&<>
          <div onClick={()=>{insertAbove(ctxMenu.rowId!);setContextMenu(null);}} style={{padding:"5px 10px",fontSize:12,cursor:"pointer"}} onMouseEnter={e=>{(e.target as HTMLElement).style.background=hv;}} onMouseLeave={e=>{(e.target as HTMLElement).style.background="transparent";}}>↑ 위에 행 삽입</div>
          <div onClick={()=>{insertBelow(ctxMenu.rowId!);setContextMenu(null);}} style={{padding:"5px 10px",fontSize:12,cursor:"pointer"}} onMouseEnter={e=>{(e.target as HTMLElement).style.background=hv;}} onMouseLeave={e=>{(e.target as HTMLElement).style.background="transparent";}}>↓ 아래에 행 삽입</div>
          <div onClick={()=>{dupRow(ctxMenu.rowId!);setContextMenu(null);}} style={{padding:"5px 10px",fontSize:12,cursor:"pointer"}} onMouseEnter={e=>{(e.target as HTMLElement).style.background=hv;}} onMouseLeave={e=>{(e.target as HTMLElement).style.background="transparent";}}>⧉ 행 복제</div>
          <div onClick={()=>{copySelection();setContextMenu(null);}} style={{padding:"5px 10px",fontSize:12,cursor:"pointer"}} onMouseEnter={e=>{(e.target as HTMLElement).style.background=hv;}} onMouseLeave={e=>{(e.target as HTMLElement).style.background="transparent";}}>📋 복사 (Ctrl+C)</div>
          <div onClick={()=>{pasteFromClipboard();setContextMenu(null);}} style={{padding:"5px 10px",fontSize:12,cursor:"pointer"}} onMouseEnter={e=>{(e.target as HTMLElement).style.background=hv;}} onMouseLeave={e=>{(e.target as HTMLElement).style.background="transparent";}}>📄 붙여넣기 (Ctrl+V)</div>
          <div style={{height:1,background:bd,margin:"3px 0"}}/>
          <div onClick={()=>{deleteRow(ctxMenu.rowId!);setContextMenu(null);}} style={{padding:"5px 10px",fontSize:12,cursor:"pointer",color:"#e55"}} onMouseEnter={e=>{(e.target as HTMLElement).style.background=hv;}} onMouseLeave={e=>{(e.target as HTMLElement).style.background="transparent";}}>🗑 행 삭제</div>
        </>}
      </div>)}
    </div>
  );
}
