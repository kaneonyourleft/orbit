"use client";
import "./globals.css";
import { useState, useRef, useEffect, useCallback, DragEvent, KeyboardEvent } from "react";
import dynamic from "next/dynamic";
import { usePages, TreeNode } from "../lib/usePages";

const DynamicEditor = dynamic(() => import("../components/Editor"), {
  ssr: false,
  loading: () => (
    <div style={{ padding: 60, textAlign: "center" }}>
      <div style={{ width: 200, height: 12, borderRadius: 6, background: "linear-gradient(90deg, rgba(128,128,128,0.08) 0%, rgba(128,128,128,0.18) 50%, rgba(128,128,128,0.08) 100%)", backgroundSize: "400px 12px", animation: "shimmer 1.5s infinite" }} />
    </div>
  ),
});

import SpreadsheetTable from "../components/SpreadsheetTable";

/* ── Helpers ── */
const uid=()=>Math.random().toString(36).slice(2,10);
function findNode(ns:TreeNode[],id:string):TreeNode|null{for(const n of ns){if(n.id===id)return n;const f=findNode(n.children,id);if(f)return f;}return null;}
function findParentId(ns:TreeNode[],tid:string,pid:string|null=null):string|null{for(const n of ns){if(n.id===tid)return pid;const f=findParentId(n.children,tid,n.id);if(f!==null)return f;}return null;}
function removeLocal(ns:TreeNode[],id:string):TreeNode[]{return ns.filter(n=>n.id!==id).map(n=>({...n,children:removeLocal(n.children,id)}));}
function insertLocal(ns:TreeNode[],pid:string|null,child:TreeNode):TreeNode[]{if(!pid)return[...ns,child];return ns.map(n=>n.id===pid&&n.type==="folder"?{...n,children:[...n.children,child],collapsed:false}:{...n,children:insertLocal(n.children,pid,child)});}
function isDesc(ns:TreeNode[],aid:string,tid:string):boolean{const n=findNode(ns,aid);if(!n)return false;if(n.children.some(c=>c.id===tid))return true;return n.children.some(c=>isDesc([c],c.id,tid));}
function collectPages(ns:TreeNode[]):TreeNode[]{let r:TreeNode[]=[];for(const n of ns){if(n.type==="page")r.push(n);r=r.concat(collectPages(n.children));}return r;}
function getBreadcrumb(ns:TreeNode[],id:string):string[]{const pid=findParentId(ns,id);if(!pid)return[findNode(ns,id)?.name||""];const parent=findNode(ns,pid);return[...getBreadcrumb(ns,pid),findNode(ns,id)?.name||""];}

/* ── Themes ── */
const THEMES:Record<string,{n:string;bg:string;sb:string;rb:string;tx:string;tx2:string;ac:string;bd:string;hv:string;card:string}> = {
  dark:{n:"다크",bg:"#1e1e1e",sb:"#252526",rb:"#1c1c1c",tx:"#e0e0e0",tx2:"#888",ac:"#569cd6",bd:"rgba(255,255,255,0.06)",hv:"rgba(255,255,255,0.05)",card:"rgba(255,255,255,0.04)"},
  obsidian:{n:"옵시디언",bg:"#1a1a1a",sb:"#202020",rb:"#181818",tx:"#dcddde",tx2:"#777",ac:"#7f6df2",bd:"rgba(255,255,255,0.06)",hv:"rgba(255,255,255,0.04)",card:"rgba(255,255,255,0.03)"},
  navy:{n:"네이비",bg:"#1a1a2e",sb:"#16213e",rb:"#12192e",tx:"#c9d1d9",tx2:"#7788aa",ac:"#4fc3f7",bd:"rgba(255,255,255,0.06)",hv:"rgba(255,255,255,0.04)",card:"rgba(255,255,255,0.03)"},
  forest:{n:"포레스트",bg:"#1b2d1b",sb:"#142814",rb:"#0f200f",tx:"#b8d8b8",tx2:"#6a8a6a",ac:"#66bb6a",bd:"rgba(255,255,255,0.06)",hv:"rgba(255,255,255,0.04)",card:"rgba(255,255,255,0.03)"},
  light:{n:"라이트",bg:"#ffffff",sb:"#f8f8f8",rb:"#f0f0f0",tx:"#37352f",tx2:"#999",ac:"#2383e2",bd:"rgba(0,0,0,0.06)",hv:"rgba(0,0,0,0.03)",card:"rgba(0,0,0,0.02)"},
};

const PALETTE_PRESETS: {name:string;colors:{bg:string;sb:string;rb:string;tx:string;tx2:string;ac:string;bd:string;hv:string;card:string}}[] = [
  {name:"미드나잇 퍼플",colors:{bg:"#13111a",sb:"#1a1726",rb:"#110f1a",tx:"#e2dff0",tx2:"#8880a8",ac:"#a78bfa",bd:"rgba(167,139,250,0.12)",hv:"rgba(167,139,250,0.06)",card:"rgba(167,139,250,0.04)"}},
  {name:"선셋 오렌지",colors:{bg:"#1a1210",sb:"#201714",rb:"#170f0d",tx:"#f0e0d8",tx2:"#a87860",ac:"#fb923c",bd:"rgba(251,146,60,0.12)",hv:"rgba(251,146,60,0.06)",card:"rgba(251,146,60,0.04)"}},
  {name:"오션 블루",colors:{bg:"#0c1222",sb:"#101828",rb:"#0a0f1c",tx:"#d0e0f0",tx2:"#6888a8",ac:"#38bdf8",bd:"rgba(56,189,248,0.12)",hv:"rgba(56,189,248,0.06)",card:"rgba(56,189,248,0.04)"}},
  {name:"체리 블로썸",colors:{bg:"#1a1018",sb:"#201520",rb:"#160d14",tx:"#f0dce8",tx2:"#a87898",ac:"#f472b6",bd:"rgba(244,114,182,0.12)",hv:"rgba(244,114,182,0.06)",card:"rgba(244,114,182,0.04)"}},
  {name:"민트 그린",colors:{bg:"#0d1a16",sb:"#112018",rb:"#0a1612",tx:"#d0f0e0",tx2:"#68a888",ac:"#34d399",bd:"rgba(52,211,153,0.12)",hv:"rgba(52,211,153,0.06)",card:"rgba(52,211,153,0.04)"}},
  {name:"골드 럭셔리",colors:{bg:"#1a1810",sb:"#201e14",rb:"#16140d",tx:"#f0e8d0",tx2:"#a89868",ac:"#fbbf24",bd:"rgba(251,191,36,0.12)",hv:"rgba(251,191,36,0.06)",card:"rgba(251,191,36,0.04)"}},
  {name:"로즈 골드",colors:{bg:"#1a1214",sb:"#201618",rb:"#170f10",tx:"#f0dce0",tx2:"#a87880",ac:"#fb7185",bd:"rgba(251,113,133,0.12)",hv:"rgba(251,113,133,0.06)",card:"rgba(251,113,133,0.04)"}},
  {name:"사이버펑크",colors:{bg:"#0a0a14",sb:"#10101c",rb:"#08080f",tx:"#e0f0f0",tx2:"#68a8a8",ac:"#22d3ee",bd:"rgba(34,211,238,0.12)",hv:"rgba(34,211,238,0.06)",card:"rgba(34,211,238,0.04)"}},
  {name:"크림 화이트",colors:{bg:"#faf8f5",sb:"#f0ede8",rb:"#e8e4de",tx:"#37352f",tx2:"#9b9a97",ac:"#d97706",bd:"rgba(0,0,0,0.06)",hv:"rgba(0,0,0,0.03)",card:"rgba(0,0,0,0.02)"}},
  {name:"노르딕 화이트",colors:{bg:"#f5f7fa",sb:"#ebeef3",rb:"#e0e4ea",tx:"#2e3440",tx2:"#7b8394",ac:"#5e81ac",bd:"rgba(0,0,0,0.06)",hv:"rgba(0,0,0,0.03)",card:"rgba(0,0,0,0.02)"}},
];

/* ── SVG Icons ── */
const Icons = {
  files:(c:string)=><svg width="18" height="18" fill="none" stroke={c} strokeWidth="1.5" viewBox="0 0 24 24"><path d="M3 7V17C3 18.1 3.9 19 5 19H19C20.1 19 21 18.1 21 17V9C21 7.9 20.1 7 19 7H13L11 5H5C3.9 5 3 5.9 3 7Z"/></svg>,
  search:(c:string)=><svg width="18" height="18" fill="none" stroke={c} strokeWidth="1.5" viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><path d="M21 21L16.65 16.65"/></svg>,
  bookmark:(c:string)=><svg width="18" height="18" fill="none" stroke={c} strokeWidth="1.5" viewBox="0 0 24 24"><path d="M5 5C5 3.9 5.9 3 7 3H17C18.1 3 19 3.9 19 5V21L12 17.5L5 21V5Z"/></svg>,
  settings:(c:string)=><svg width="18" height="18" fill="none" stroke={c} strokeWidth="1.5" viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>,
  recent:(c:string)=><svg width="18" height="18" fill="none" stroke={c} strokeWidth="1.5" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/></svg>,
  trash:(c:string)=><svg width="18" height="18" fill="none" stroke={c} strokeWidth="1.5" viewBox="0 0 24 24"><path d="M3 6h18M8 6V4h8v2M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/></svg>,
  folder:(c:string)=><svg width="14" height="14" fill="none" stroke={c} strokeWidth="1.5" viewBox="0 0 24 24"><path d="M3 7V17C3 18.1 3.9 19 5 19H19C20.1 19 21 18.1 21 17V9C21 7.9 20.1 7 19 7H13L11 5H5C3.9 5 3 5.9 3 7Z"/></svg>,
  page:(c:string)=><svg width="14" height="14" fill="none" stroke={c} strokeWidth="1.5" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>,
  chevron:(c:string)=><svg width="10" height="10" fill="none" stroke={c} strokeWidth="2" viewBox="0 0 24 24"><path d="M9 18l6-6-6-6"/></svg>,
  plus:(c:string)=><svg width="14" height="14" fill="none" stroke={c} strokeWidth="2" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>,
  dots:(c:string)=><svg width="14" height="14" fill={c} viewBox="0 0 24 24"><circle cx="12" cy="6" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="12" cy="18" r="1.5"/></svg>,
  x:(c:string)=><svg width="12" height="12" fill="none" stroke={c} strokeWidth="2" viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12"/></svg>,
  menu:(c:string)=><svg width="18" height="18" fill="none" stroke={c} strokeWidth="1.5" viewBox="0 0 24 24"><path d="M3 12h18M3 6h18M3 18h18"/></svg>,
  focus:(c:string)=><svg width="18" height="18" fill="none" stroke={c} strokeWidth="1.5" viewBox="0 0 24 24"><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/></svg>,
  dup:(c:string)=><svg width="14" height="14" fill="none" stroke={c} strokeWidth="1.5" viewBox="0 0 24 24"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>,
  star:(c:string)=><svg width="14" height="14" fill="none" stroke={c} strokeWidth="1.5" viewBox="0 0 24 24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
  restore:(c:string)=><svg width="14" height="14" fill="none" stroke={c} strokeWidth="1.5" viewBox="0 0 24 24"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>,
};

const RIBBON = [
  {id:"files",icon:Icons.files,label:"파일 탐색기"},
  {id:"search",icon:Icons.search,label:"검색"},
  {id:"bookmark",icon:Icons.bookmark,label:"북마크"},
  {id:"recent",icon:Icons.recent,label:"최근 문서"},
  {id:"trash",icon:Icons.trash,label:"휴지통"},
];

/* ── Context Menu ── */
function CtxMenu({x,y,items,onClose,t}:{x:number;y:number;items:{label:string;icon?:any;danger?:boolean;divider?:boolean;action:()=>void}[];onClose:()=>void;t:any}){
  const ref=useRef<HTMLDivElement>(null);
  useEffect(()=>{const h=(e:any)=>{if(ref.current&&!ref.current.contains(e.target))onClose();};document.addEventListener("mousedown",h);return()=>document.removeEventListener("mousedown",h);},[onClose]);
  return(
    <div ref={ref} className="scale-in" style={{position:"fixed",left:x,top:y,zIndex:9999,background:t.sb,border:`1px solid ${t.bd}`,borderRadius:8,padding:"4px 0",minWidth:180,backdropFilter:"blur(12px)",boxShadow:"0 8px 30px rgba(0,0,0,0.3)"}}>
      {items.map((it,i)=>it.divider?<div key={i} style={{height:1,background:t.bd,margin:"4px 0"}}/>:(
        <div key={i} onClick={()=>{it.action();onClose();}} style={{padding:"6px 12px",fontSize:13,cursor:"pointer",display:"flex",alignItems:"center",gap:8,color:it.danger?"#e55":t.tx,borderRadius:4,margin:"0 4px",transition:"background 0.1s"}}
          onMouseEnter={e=>(e.currentTarget.style.background=t.hv)} onMouseLeave={e=>(e.currentTarget.style.background="transparent")}>
          {it.icon&&<span style={{opacity:0.6}}>{it.icon}</span>}{it.label}
        </div>
      ))}
    </div>
  );
}

/* ── FileNode ── */
function FileNode({node,depth,selectedId,onSelect,onToggle,onCtx,renameId,renameVal,setRenameVal,commitRename,dragSrc,onDragStart,onDragOver,onDrop,t}:any){
  const isF=node.type==="folder";const isSel=node.id===selectedId;const isRename=renameId===node.id;
  const inputRef=useRef<HTMLInputElement>(null);
  useEffect(()=>{if(isRename&&inputRef.current){inputRef.current.focus();inputRef.current.select();}},[isRename]);
  const indent=depth*14+8;
  return(<div>
    <div draggable onDragStart={e=>onDragStart(e,node.id)} onDragOver={e=>onDragOver(e,node.id)} onDrop={e=>onDrop(e,node.id)}
      style={{display:"flex",alignItems:"center",height:30,padding:`0 8px 0 ${indent}px`,cursor:"pointer",borderRadius:6,margin:"0 4px",
        background:isSel?t.hv:"transparent",borderLeft:isSel?`2px solid ${t.ac}`:"2px solid transparent",
        transition:"all 0.1s",opacity:dragSrc===node.id?0.4:1}}
      onClick={()=>{if(isF)onToggle(node.id);else onSelect(node.id);}}
      onContextMenu={e=>{e.preventDefault();onCtx(e,node);}}
      onMouseEnter={e=>{if(!isSel)e.currentTarget.style.background=t.hv;}}
      onMouseLeave={e=>{if(!isSel)e.currentTarget.style.background="transparent";}}>
      {isF&&<span onClick={e=>{e.stopPropagation();onToggle(node.id);}} style={{display:"inline-flex",transform:node.collapsed?"rotate(0deg)":"rotate(90deg)",transition:"transform 0.15s",marginRight:4,opacity:0.4}}>{Icons.chevron(t.tx)}</span>}
      <span style={{marginRight:6,opacity:0.5}}>{isF?Icons.folder(t.tx):Icons.page(t.tx)}</span>
      {isRename?(
        <input ref={inputRef} value={renameVal} onChange={e=>setRenameVal(e.target.value)}
          onBlur={()=>commitRename()} onKeyDown={e=>{if(e.key==="Enter")commitRename();if(e.key==="Escape")commitRename();}}
          onClick={e=>e.stopPropagation()}
          style={{flex:1,background:"transparent",border:`1px solid ${t.ac}`,color:t.tx,fontSize:13,padding:"2px 4px",borderRadius:4,outline:"none",fontFamily:"var(--font-main)"}}/>
      ):(
        <span style={{flex:1,fontSize:13,fontWeight:isF?500:400,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",color:isSel?t.tx:t.tx,opacity:isF?1:0.85}}>{node.name}</span>
      )}
      <span onClick={e=>{e.stopPropagation();onCtx(e as any,node);}} style={{opacity:0,padding:2,borderRadius:4,display:"flex",transition:"opacity 0.1s"}}
        onMouseEnter={e=>{e.currentTarget.style.opacity="0.6";e.currentTarget.style.background=t.hv;}}
        onMouseLeave={e=>{e.currentTarget.style.opacity="0";e.currentTarget.style.background="transparent";}}>
        {Icons.dots(t.tx)}
      </span>
    </div>
    {isF&&!node.collapsed&&<div style={{overflow:"hidden",transition:"max-height 0.2s"}}>{node.children.map((c:TreeNode)=>
      <FileNode key={c.id} node={c} depth={depth+1} selectedId={selectedId} onSelect={onSelect} onToggle={onToggle} onCtx={onCtx}
        renameId={renameId} renameVal={renameVal} setRenameVal={setRenameVal} commitRename={commitRename}
        dragSrc={dragSrc} onDragStart={onDragStart} onDragOver={onDragOver} onDrop={onDrop} t={t}/>
    )}</div>}
  </div>);
}

/* ── Main ── */
export default function Home(){
  const {loading,loadTree,saveNode,deleteNode:dbDelete,loadBookmarks:dbLoadBM,syncBookmarks:dbSyncBM}=usePages();
  const [theme,setTheme]=useState<string>(()=>{if(typeof window!=="undefined"){return localStorage.getItem("orbit-theme")||"obsidian";}return"obsidian";});
  const [activePanel,setActivePanel]=useState<string>("files");
  const [sidebarOpen,setSidebarOpen]=useState(true);
  const [sidebarWidth,setSidebarWidth]=useState(248);
  const [customTheme, setCustomTheme] = useState<{bg:string;sb:string;rb:string;tx:string;tx2:string;ac:string;bd:string;hv:string;card:string}|null>(null);
  const [themeMode, setThemeMode] = useState<"preset"|"palette"|"custom">("preset");
  const [showTable, setShowTable] = useState(false);
  const [focusMode,setFocusMode]=useState(false);
  const [ctxMenu,setCtxMenu]=useState<{x:number;y:number;node:TreeNode}|null>(null);
  const [renameId,setRenameId]=useState<string|null>(null);
  const [renameVal,setRenameVal]=useState("");
  const [dragSrc,setDragSrc]=useState<string|null>(null);
  const [tree,setTree]=useState<TreeNode[]>([]);
  const [selectedId,setSelectedId]=useState<string|null>(null);
  const [bookmarks,setBookmarks]=useState<Set<string>>(new Set());
  const [favorites,setFavorites]=useState<Set<string>>(new Set());
  const [trashedNodes,setTrashedNodes]=useState<TreeNode[]>([]);
  const [recentIds,setRecentIds]=useState<string[]>([]);
  const [searchQ,setSearchQ]=useState("");
  const [pageTitle,setPageTitle]=useState("");
  const [wordCount,setWordCount]=useState(0);
  const sidebarRef=useRef<HTMLDivElement>(null);
  const resizing=useRef(false);

  const baseTheme = THEMES[theme];
  const t = customTheme ? { ...baseTheme, n: "커스텀", ...customTheme } : baseTheme;
  const isDark=theme!=="light";

  useEffect(()=>{if(typeof window!=="undefined")localStorage.setItem("orbit-theme",theme);},[theme]);
  useEffect(()=>{(async()=>{const t=await loadTree();if(t&&t.length>0){setTree(t);setSelectedId(t[0].id);}const b=await dbLoadBM();if(b)setBookmarks(new Set(b));})();}, [loadTree, dbLoadBM]);
  useEffect(()=>{if(selectedId){setRecentIds(prev=>[selectedId,...prev.filter(x=>x!==selectedId)].slice(0,20));const nd=findNode(tree,selectedId);if(nd)setPageTitle(nd.name);}},[selectedId, tree]);

  useEffect(()=>{
    const h=(e:globalThis.KeyboardEvent)=>{
      if((e.ctrlKey||e.metaKey)&&e.key==="n"){e.preventDefault();addNew(null,"page");}
      if((e.ctrlKey||e.metaKey)&&e.key==="p"){e.preventDefault();setActivePanel("search");setSidebarOpen(true);}
      if((e.ctrlKey||e.metaKey)&&e.key==="\\"){e.preventDefault();setSidebarOpen(p=>!p);}
      if((e.ctrlKey||e.metaKey)&&e.shiftKey&&e.key==="F"){e.preventDefault();setFocusMode(p=>!p);}
    };
    window.addEventListener("keydown",h);return()=>window.removeEventListener("keydown",h);
  },[tree]);

  const startResize=useCallback((e:React.MouseEvent)=>{
    e.preventDefault();resizing.current=true;
    const startX=e.clientX;const startW=sidebarWidth;
    const move=(ev:MouseEvent)=>{if(resizing.current){const w=Math.max(180,Math.min(480,startW+(ev.clientX-startX)));setSidebarWidth(w);}};
    const up=()=>{resizing.current=false;document.removeEventListener("mousemove",move);document.removeEventListener("mouseup",up);};
    document.addEventListener("mousemove",move);document.addEventListener("mouseup",up);
  },[sidebarWidth]);

  const toggleCollapse=(id:string)=>{setTree(prev=>{const upd=(ns:TreeNode[]):TreeNode[]=>ns.map(n=>n.id===id?{...n,collapsed:!n.collapsed}:{...n,children:upd(n.children)});return upd(prev);});const nd=findNode(tree,id);if(nd)saveNode({...nd,collapsed:!nd.collapsed});};
  const renameNode=(id:string,name:string)=>{if(!name.trim())return;setTree(prev=>{const upd=(ns:TreeNode[]):TreeNode[]=>ns.map(n=>n.id===id?{...n,name}:{...n,children:upd(n.children)});return upd(prev);});const nd=findNode(tree,id);if(nd)saveNode({...nd,name},findParentId(tree,id));};
  const commitRename=()=>{if(renameId&&renameVal.trim())renameNode(renameId,renameVal);setRenameId(null);};
  const handleDelete=(id:string)=>{const nd=findNode(tree,id);if(nd)setTrashedNodes(p=>[...p,nd]);setTree(prev=>removeLocal(prev,id));if(selectedId===id)setSelectedId(null);dbDelete(id);};
  const restoreNode=(nd:TreeNode)=>{setTree(p=>[...p,nd]);setTrashedNodes(p=>p.filter(n=>n.id!==nd.id));saveNode(nd,null);};
  const duplicateNode=(nd:TreeNode)=>{const dup:TreeNode={...nd,id:uid(),name:nd.name+" (복사)",children:[]};const pid=findParentId(tree,nd.id);setTree(p=>pid?insertLocal(p,pid,dup):[...p,dup]);saveNode(dup,pid);};
  const addNew=(parentId:string|null,type:"folder"|"page")=>{const child:TreeNode={id:uid(),type,name:type==="folder"?"새 폴더":"새 페이지",children:[],content:null};setTree(p=>parentId?insertLocal(p,parentId,child):[...p,child]);saveNode(child,parentId);if(type==="page")setSelectedId(child.id);};
  const toggleBookmark=(id:string)=>{setBookmarks(p=>{const s=new Set(p);s.has(id)?s.delete(id):s.add(id);dbSyncBM(Array.from(s));return s;});};
  const toggleFavorite=(id:string)=>{setFavorites(p=>{const s=new Set(p);s.has(id)?s.delete(id):s.add(id);return s;});};

  const onDragStart=(e:DragEvent,id:string)=>{setDragSrc(id);e.dataTransfer.effectAllowed="move";};
  const onDragOver=(e:DragEvent,id:string)=>{e.preventDefault();e.dataTransfer.dropEffect="move";};
  const onDrop=(e:DragEvent,targetId:string)=>{e.preventDefault();if(!dragSrc||dragSrc===targetId)return;if(isDesc(tree,dragSrc,targetId))return;
    const nd=findNode(tree,dragSrc);if(!nd)return;const targetNd=findNode(tree,targetId);const dropParent=targetNd?.type==="folder"?targetId:findParentId(tree,targetId);
    setTree(p=>{let t=removeLocal(p,dragSrc);return insertLocal(t,dropParent,nd);});saveNode({...nd,parent_id:dropParent},dropParent);setDragSrc(null);};

  const contentTimer=useRef<any>(null);
  const onContentChange=useCallback((content:any)=>{if(!selectedId)return;
    setTree(prev=>prev.map(n=>n.id===selectedId?{...n,content}:n));
    if(contentTimer.current)clearTimeout(contentTimer.current);
    contentTimer.current=setTimeout(()=>{const nd=findNode(tree,selectedId);if(nd)saveNode({...nd,content},findParentId(tree,selectedId));},800);
    try{const txt=JSON.stringify(content);setWordCount(txt.replace(/[^가-힣a-zA-Z0-9\s]/g,"").split(/\s+/).filter(Boolean).length);}catch{setWordCount(0);}
  },[selectedId, tree, saveNode]);

  const onTitleChange=(newTitle:string)=>{setPageTitle(newTitle);renameNode(selectedId!,newTitle);};

  const getCtxItems=(nd:TreeNode)=>[
    {label:"이름 변경",icon:Icons.page(t.tx),action:()=>{setRenameId(nd.id);setRenameVal(nd.name);}},
    {label:favorites.has(nd.id)?"즐겨찾기 해제":"즐겨찾기 추가",icon:Icons.star(t.tx),action:()=>toggleFavorite(nd.id)},
    {label:bookmarks.has(nd.id)?"북마크 해제":"북마크 추가",icon:Icons.bookmark(t.tx),action:()=>toggleBookmark(nd.id)},
    ...(nd.type==="page"?[{label:"복제",icon:Icons.dup(t.tx),action:()=>duplicateNode(nd)}]:[]),
    ...(nd.type==="folder"?[{label:"새 페이지",icon:Icons.page(t.tx),action:()=>addNew(nd.id,"page")},{label:"새 폴더",icon:Icons.folder(t.tx),action:()=>addNew(nd.id,"folder")}]:[]),
    {divider:true,label:"",action:()=>{}},
    {label:"삭제",icon:Icons.trash("#e55"),danger:true,action:()=>handleDelete(nd.id)}
  ];

  const searchResults=searchQ?collectPages(tree).filter(p=>p.name.toLowerCase().includes(searchQ.toLowerCase())):[];
  const favPages=collectPages(tree).filter(p=>favorites.has(p.id));
  const selectedNode=selectedId?findNode(tree,selectedId):null;
  const breadcrumb=selectedId?getBreadcrumb(tree,selectedId):[];

  return(
    <div className={focusMode?"focus-mode":""} style={{display:"flex",height:"100vh",background:t.bg,color:t.tx,fontFamily:"var(--font-main)",transition:"background 0.2s, color 0.2s"}}>
      <div className="ribbon" style={{width:44,background:t.rb,borderRight:`1px solid ${t.bd}`,display:"flex",flexDirection:"column",alignItems:"center",paddingTop:8,gap:2,flexShrink:0}}>
        {RIBBON.map(r=>(<div key={r.id} title={r.label} onClick={()=>{if(activePanel===r.id&&sidebarOpen)setSidebarOpen(false);else{setActivePanel(r.id);setSidebarOpen(true);}}}
            style={{width:34,height:34,display:"flex",alignItems:"center",justifyContent:"center",borderRadius:6,cursor:"pointer",background:activePanel===r.id&&sidebarOpen?t.hv:"transparent",transition:"background 0.15s"}}
            onMouseEnter={e=>{e.currentTarget.style.background=t.hv;}} onMouseLeave={e=>{if(!(activePanel===r.id&&sidebarOpen))e.currentTarget.style.background="transparent";}}>
            {r.icon(activePanel===r.id&&sidebarOpen?t.ac:t.tx2)}
          </div>))}
        <div style={{flex:1}}/>
        <div title="설정" onClick={()=>{setActivePanel("settings");setSidebarOpen(true);}} style={{width:34,height:34,display:"flex",alignItems:"center",justifyContent:"center",borderRadius:6,cursor:"pointer",marginBottom:8}}
          onMouseEnter={e=>{e.currentTarget.style.background=t.hv;}} onMouseLeave={e=>{e.currentTarget.style.background="transparent";}}>{Icons.settings(t.tx2)}</div>
      </div>
      <div ref={sidebarRef} className="sidebar-wrap" style={{width:sidebarOpen?sidebarWidth:0,minWidth:sidebarOpen?sidebarWidth:0,background:t.sb,borderRight:`1px solid ${t.bd}`,overflow:"hidden",display:"flex",flexDirection:"column",position:"relative"}}>
        <div style={{height:40,padding:"0 12px",display:"flex",alignItems:"center",justifyContent:"space-between",borderBottom:`1px solid ${t.bd}`,flexShrink:0}}>
          <span style={{fontSize:12,fontWeight:600,textTransform:"uppercase",letterSpacing:1,color:t.tx2}}>{activePanel==="files"?"파일":activePanel==="search"?"검색":activePanel==="bookmark"?"북마크":activePanel==="recent"?"최근 문서":activePanel==="trash"?"휴지통":"설정"}</span>
        </div>
        {activePanel==="files"&&<div style={{flex:1,overflowY:"auto",padding:"4px 0"}}>
          {favPages.length>0&&<><div style={{padding:"8px 12px 4px",fontSize:11,fontWeight:600,color:t.tx2,letterSpacing:0.5}}>FAVORITES</div>{favPages.map(p=><div key={p.id} onClick={()=>setSelectedId(p.id)} style={{height:28,padding:"0 12px 0 20px",display:"flex",alignItems:"center",gap:6,cursor:"pointer",fontSize:13,borderRadius:6,margin:"0 4px",background:selectedId===p.id?t.hv:"transparent"}} onMouseEnter={e=>{e.currentTarget.style.background=t.hv;}} onMouseLeave={e=>{if(selectedId!==p.id)e.currentTarget.style.background="transparent";}}>{Icons.star(t.ac)}<span style={{overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{p.name}</span></div>)}<div style={{height:1,background:t.bd,margin:"6px 12px"}}/></>}
          <div style={{padding:"8px 12px 4px",fontSize:11,fontWeight:600,color:t.tx2,letterSpacing:0.5,display:"flex",justifyContent:"space-between",alignItems:"center"}}><span>PRIVATE</span><span style={{cursor:"pointer",display:"flex",gap:4}} onClick={()=>addNew(null,"page")}>{Icons.plus(t.tx2)}</span></div>
          {loading && <div style={{padding:12,opacity:0.4,fontSize:12}}>불러오는 중...</div>}
          {tree.map(n=><FileNode key={n.id} node={n} depth={0} selectedId={selectedId} onSelect={setSelectedId} onToggle={toggleCollapse} onCtx={(e:any,nd:TreeNode)=>setCtxMenu({x:e.clientX,y:e.clientY,node:nd})} renameId={renameId} renameVal={renameVal} setRenameVal={setRenameVal} commitRename={commitRename} dragSrc={dragSrc} onDragStart={onDragStart} onDragOver={onDragOver} onDrop={onDrop} t={t}/>)}
          <div style={{padding:"8px 12px",display:"flex",gap:8}}><span onClick={()=>addNew(null,"folder")} style={{fontSize:12,cursor:"pointer",color:t.tx2,display:"flex",alignItems:"center",gap:4,borderRadius:4,padding:"4px 8px"}} onMouseEnter={e=>{e.currentTarget.style.background=t.hv;}} onMouseLeave={e=>{e.currentTarget.style.background="transparent";}}>{Icons.folder(t.tx2)} 새 폴더</span></div>
        </div>}
        {activePanel==="search"&&<div style={{flex:1,overflowY:"auto",padding:"8px"}}><input value={searchQ} onChange={e=>setSearchQ(e.target.value)} placeholder="페이지 검색..." autoFocus style={{width:"100%",padding:"8px 10px",fontSize:13,background:t.hv,border:`1px solid ${t.bd}`,borderRadius:6,color:t.tx,outline:"none",fontFamily:"var(--font-main)"}}/><div style={{marginTop:8}}>{searchResults.map(p=><div key={p.id} onClick={()=>{setSelectedId(p.id);}} style={{padding:"6px 10px",fontSize:13,cursor:"pointer",borderRadius:6}} onMouseEnter={e=>{e.currentTarget.style.background=t.hv;}} onMouseLeave={e=>{e.currentTarget.style.background="transparent";}}>{Icons.page(t.tx2)} <span style={{marginLeft:6}}>{p.name}</span></div>)}{searchQ&&searchResults.length===0&&<div style={{padding:12,fontSize:13,color:t.tx2}}>결과 없음</div>}</div></div>}
        {activePanel==="bookmark"&&<div style={{flex:1,overflowY:"auto",padding:"8px"}}>{Array.from(bookmarks).map(id=>{const nd=findNode(tree,id);return nd?<div key={id} onClick={()=>setSelectedId(id)} style={{padding:"6px 10px",fontSize:13,cursor:"pointer",borderRadius:6,display:"flex",alignItems:"center",gap:6}} onMouseEnter={e=>{e.currentTarget.style.background=t.hv;}} onMouseLeave={e=>{e.currentTarget.style.background="transparent";}}>{Icons.bookmark(t.ac)}{nd.name}</div>:null;})}{bookmarks.size===0&&<div style={{padding:16,fontSize:13,color:t.tx2,textAlign:"center"}}>북마크가 없습니다</div>}</div>}
        {activePanel==="recent"&&<div style={{flex:1,overflowY:"auto",padding:"8px"}}>{recentIds.map(id=>{const nd=findNode(tree,id);return nd?<div key={id} onClick={()=>setSelectedId(id)} style={{padding:"6px 10px",fontSize:13,cursor:"pointer",borderRadius:6,display:"flex",alignItems:"center",gap:6}} onMouseEnter={e=>{e.currentTarget.style.background=t.hv;}} onMouseLeave={e=>{e.currentTarget.style.background="transparent";}}>{Icons.recent(t.tx2)}{nd.name}</div>:null;})}{recentIds.length===0&&<div style={{padding:16,fontSize:13,color:t.tx2,textAlign:"center"}}>최근 문서 없음</div>}</div>}
        {activePanel==="trash"&&<div style={{flex:1,overflowY:"auto",padding:"8px"}}>{trashedNodes.map(nd=><div key={nd.id} style={{padding:"6px 10px",fontSize:13,borderRadius:6,display:"flex",alignItems:"center",gap:6,justifyContent:"space-between"}} onMouseEnter={e=>{e.currentTarget.style.background=t.hv;}} onMouseLeave={e=>{e.currentTarget.style.background="transparent";}}><span style={{display:"flex",alignItems:"center",gap:6}}>{Icons.page(t.tx2)}{nd.name}</span><span onClick={()=>restoreNode(nd)} style={{cursor:"pointer",opacity:0.5,display:"flex"}} title="복원">{Icons.restore(t.ac)}</span></div>)}{trashedNodes.length===0&&<div style={{padding:16,fontSize:13,color:t.tx2,textAlign:"center"}}>휴지통이 비어 있습니다</div>}</div>}
        {activePanel==="settings"&&<div style={{flex:1,overflowY:"auto",padding:"16px 12px"}}>
  {/* Theme Mode Tabs */}
  <div style={{display:"flex",gap:4,marginBottom:12,background:t.hv,borderRadius:8,padding:3}}>
    {(["preset","palette","custom"] as const).map(m=>(
      <div key={m} onClick={()=>setThemeMode(m)}
        style={{flex:1,padding:"6px 0",textAlign:"center",fontSize:11,fontWeight:600,borderRadius:6,cursor:"pointer",
          background:themeMode===m?t.ac:"transparent",color:themeMode===m?(theme==="light"||theme==="cream"?"#fff":"#fff"):t.tx2,
          transition:"all 0.15s"}}>
        {m==="preset"?"프리셋":m==="palette"?"팔레트":"커스텀"}
      </div>
    ))}
  </div>

  {/* Preset themes */}
  {themeMode==="preset"&&<>
    <div style={{fontSize:12,fontWeight:600,color:t.tx2,marginBottom:8}}>기본 테마</div>
    <div style={{display:"flex",flexDirection:"column",gap:4}}>
      {Object.entries(THEMES).map(([key,val])=>(
        <div key={key} onClick={()=>{setTheme(key);setCustomTheme(null);}}
          style={{padding:"8px 10px",borderRadius:6,cursor:"pointer",display:"flex",alignItems:"center",gap:10,
            background:theme===key&&!customTheme?t.hv:"transparent",border:theme===key&&!customTheme?`1px solid ${t.ac}`:"1px solid transparent",transition:"all 0.15s"}}
          onMouseEnter={e=>{e.currentTarget.style.background=t.hv;}} onMouseLeave={e=>{if(!(theme===key&&!customTheme))e.currentTarget.style.background="transparent";}}>
          <div style={{width:18,height:18,borderRadius:"50%",background:val.bg,border:`2px solid ${val.ac}`}}/>
          <span style={{fontSize:13}}>{val.n}</span>
        </div>
      ))}
    </div>
  </>}

  {/* Palette presets */}
  {themeMode==="palette"&&<>
    <div style={{fontSize:12,fontWeight:600,color:t.tx2,marginBottom:8}}>추천 색조합</div>
    <div style={{display:"flex",flexDirection:"column",gap:6}}>
      {PALETTE_PRESETS.map((p,i)=>(
        <div key={i} onClick={()=>setCustomTheme(p.colors)}
          style={{padding:"8px 10px",borderRadius:8,cursor:"pointer",display:"flex",alignItems:"center",gap:10,
            border:customTheme&&customTheme.ac===p.colors.ac?`1px solid ${p.colors.ac}`:"1px solid transparent",
            background:customTheme&&customTheme.ac===p.colors.ac?"rgba(255,255,255,0.04)":"transparent",transition:"all 0.15s"}}
          onMouseEnter={e=>{e.currentTarget.style.background="rgba(255,255,255,0.04)";}} onMouseLeave={e=>{if(!(customTheme&&customTheme.ac===p.colors.ac))e.currentTarget.style.background="transparent";}}>
          <div style={{display:"flex",gap:3}}>
            <div style={{width:14,height:14,borderRadius:"50%",background:p.colors.bg,border:"1px solid rgba(255,255,255,0.1)"}}/>
            <div style={{width:14,height:14,borderRadius:"50%",background:p.colors.sb}}/>
            <div style={{width:14,height:14,borderRadius:"50%",background:p.colors.ac}}/>
            <div style={{width:14,height:14,borderRadius:"50%",background:p.colors.tx}}/>
          </div>
          <span style={{fontSize:12,fontWeight:500}}>{p.name}</span>
        </div>
      ))}
    </div>
  </>}

  {/* Custom color picker */}
  {themeMode==="custom"&&<>
    <div style={{fontSize:12,fontWeight:600,color:t.tx2,marginBottom:8}}>영역별 색상 설정</div>
    <div style={{display:"flex",flexDirection:"column",gap:8}}>
      {([
        {key:"bg",label:"배경"},
        {key:"sb",label:"사이드바"},
        {key:"rb",label:"리본"},
        {key:"tx",label:"텍스트"},
        {key:"tx2",label:"보조 텍스트"},
        {key:"ac",label:"강조색"},
        {key:"bd",label:"테두리"},
      ] as {key:string;label:string}[]).map(item=>(
        <div key={item.key} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"4px 0"}}>
          <span style={{fontSize:12,color:t.tx}}>{item.label}</span>
          <div style={{display:"flex",alignItems:"center",gap:6}}>
            <input type="color" value={(customTheme as any)?.[item.key] || (t as any)[item.key] || "#000000"}
              onChange={e=>{
                const prev = customTheme || {bg:t.bg,sb:t.sb,rb:t.rb,tx:t.tx,tx2:t.tx2,ac:t.ac,bd:t.bd,hv:t.hv,card:t.card};
                setCustomTheme({...prev,[item.key]:e.target.value});
              }}
              style={{width:28,height:28,border:"none",borderRadius:6,cursor:"pointer",background:"transparent",padding:0}}/>
            <span style={{fontSize:10,color:t.tx2,fontFamily:"monospace"}}>{(customTheme as any)?.[item.key] || (t as any)[item.key]}</span>
          </div>
        </div>
      ))}
    </div>
    <div onClick={()=>setCustomTheme(null)} style={{marginTop:12,padding:"8px",textAlign:"center",fontSize:12,color:t.tx2,borderRadius:6,cursor:"pointer",border:`1px dashed ${t.bd}`}}
      onMouseEnter={e=>{e.currentTarget.style.background=t.hv;}} onMouseLeave={e=>{e.currentTarget.style.background="transparent";}}>
      기본 테마로 초기화
    </div>
  </>}

  <div style={{height:1,background:t.bd,margin:"16px 0"}}/>
  <div style={{fontSize:12,fontWeight:600,color:t.tx2,marginBottom:8}}>단축키</div>
  <div style={{fontSize:12,color:t.tx2,lineHeight:2}}>
    <div>Ctrl+N — 새 페이지</div>
    <div>Ctrl+P — 검색</div>
    <div>Ctrl+\ — 사이드바 토글</div>
    <div>Ctrl+Shift+F — 포커스 모드</div>
  </div>
  <div style={{height:1,background:t.bd,margin:"16px 0"}}/>
  <div style={{fontSize:12,fontWeight:600,color:t.tx2,marginBottom:8}}>포커스 모드</div>
  <div onClick={()=>setFocusMode(!focusMode)}
    style={{padding:"8px 10px",borderRadius:6,cursor:"pointer",fontSize:13,display:"flex",alignItems:"center",gap:8,background:focusMode?t.hv:"transparent"}}
    onMouseEnter={e=>{e.currentTarget.style.background=t.hv;}} onMouseLeave={e=>{if(!focusMode)e.currentTarget.style.background="transparent";}}>
    {Icons.focus(t.ac)}{focusMode?"포커스 모드 끄기":"포커스 모드 켜기"}
  </div>
</div>}
        <div onMouseDown={startResize} style={{position:"absolute",right:0,top:0,bottom:0,width:3,cursor:"col-resize",zIndex:10}} onMouseEnter={e=>{e.currentTarget.style.background=t.ac;}} onMouseLeave={e=>{e.currentTarget.style.background="transparent";}}/>
      </div>
      <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>
        <div className="top-bar" style={{height:44,borderBottom:`1px solid ${t.bd}`,display:"flex",alignItems:"center",padding:"0 16px",gap:8,flexShrink:0}}>
          {!sidebarOpen&&<span style={{cursor:"pointer",opacity:0.5,display:"flex"}} onClick={()=>setSidebarOpen(true)}>{Icons.menu(t.tx)}</span>}
          {sidebarOpen&&<span style={{cursor:"pointer",opacity:0.5,display:"flex"}} onClick={()=>setSidebarOpen(false)}><svg width="16" height="16" fill="none" stroke={t.tx} strokeWidth="1.5" viewBox="0 0 24 24"><path d="M15 18l-6-6 6-6"/></svg></span>}
          <div style={{flex:1,display:"flex",alignItems:"center",gap:4,fontSize:12,color:t.tx2}}>{breadcrumb.map((b,i)=><span key={i} style={{display:"flex",alignItems:"center",gap:4}}>{i>0&&<span style={{opacity:0.3}}>/</span>}<span>{b}</span></span>)}</div>
          {selectedNode&&<span style={{fontSize:11,color:t.tx2}}>{wordCount} 단어</span>}
        </div>
        <div style={{flex:1,overflow:"auto"}}>
          {selectedNode&&selectedNode.type==="page"?(<div className="fade-in editor-wrap"><div style={{maxWidth:"100%",margin:"0",padding:"32px 48px 0"}}><input value={pageTitle} onChange={e=>onTitleChange(e.target.value)} placeholder="제목 없음" style={{width:"100%",background:"transparent",border:"none",outline:"none",fontSize:32,fontWeight:700,color:t.tx,fontFamily:"var(--font-main)",marginBottom:4}}/></div><DynamicEditor key={selectedId!} initialContent={selectedNode.content} onChange={onContentChange} darkMode={isDark} />
          <div style={{maxWidth:"100%",padding:"0 48px 48px"}}>
            <div onClick={()=>setShowTable(!showTable)}
              style={{display:"inline-flex",alignItems:"center",gap:6,padding:"6px 12px",borderRadius:6,cursor:"pointer",fontSize:12,color:t.tx2,border:`1px dashed ${t.bd}`,marginBottom:showTable?12:0,transition:"all 0.15s"}}
              onMouseEnter={e=>{e.currentTarget.style.background=t.hv;e.currentTarget.style.borderColor=t.ac;e.currentTarget.style.color=t.ac;}}
              onMouseLeave={e=>{e.currentTarget.style.background="transparent";e.currentTarget.style.borderColor=t.bd;e.currentTarget.style.color=t.tx2;}}>
              {showTable?"▾ 테이블 숨기기":"▸ 스프레드시트 테이블 열기"}
            </div>
            {showTable && <SpreadsheetTable darkMode={isDark} accentColor={t.ac} />}
          </div></div>):(<div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",height:"100%",opacity:0.3}}><div style={{fontSize:48,marginBottom:16}}>🌑</div><div style={{fontSize:14}}>사이드바에서 페이지를 선택하거나</div><div style={{fontSize:14,marginTop:4}}>Ctrl+N으로 새 페이지를 만드세요</div></div>)}
        </div>
      </div>
      {ctxMenu&&<CtxMenu x={ctxMenu.x} y={ctxMenu.y} items={getCtxItems(ctxMenu.node)} onClose={()=>setCtxMenu(null)} t={t}/>}
    </div>
  );
}
