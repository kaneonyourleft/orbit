"use client";
import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import dynamic from "next/dynamic";
import { usePages } from "../lib/usePages";
import { THEMES, PALETTE_PRESETS, type ThemeConfig } from "../lib/themes";
import { Icons } from "../components/Icons";
import { 
  uid, findNode, findParentId, removeLocal, insertLocal, 
  isDesc, collectPages, getBreadcrumb, type TreeNode 
} from "../lib/treeUtils";

const Editor = dynamic(() => import("../components/Editor"), { ssr: false });
const SpreadsheetTable = dynamic(() => import("../components/SpreadsheetTable"), { ssr: false });

type PanelType = "files" | "search" | "bookmark" | "recent" | "trash" | "settings";
interface ColorItem { key: string; label: string; icon: string; }

const RIBBON = [
  { id: "files", label: "파일", icon: Icons.page },
  { id: "search", label: "검색", icon: Icons.search },
  { id: "bookmark", label: "북마크", icon: Icons.bookmark },
  { id: "recent", label: "최근 문서", icon: Icons.recent },
  { id: "trash", label: "휴지통", icon: Icons.trash },
];

/* ── FileNode ── */
function FileNode({node,depth,selectedId,onSelect,onToggle,onCtx,renameId,renameVal,setRenameVal,commitRename,dragSrc,onDragStart,onDragOver,onDrop,t}: {node:TreeNode;depth:number;selectedId:string|null;onSelect:(id:string)=>void;onToggle:(id:string)=>void;onCtx:(e:React.MouseEvent,n:TreeNode)=>void;renameId:string|null;renameVal:string;setRenameVal:(v:string)=>void;commitRename:()=>void;dragSrc:string|null;onDragStart:(e:React.DragEvent,id:string)=>void;onDragOver:(e:React.DragEvent,id:string)=>void;onDrop:(e:React.DragEvent,id:string)=>void;t:ThemeConfig}){
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
      <span onClick={e => { e.stopPropagation(); onCtx(e as React.MouseEvent, node); }} style={{ opacity: 0, padding: 2, borderRadius: 4, display: "flex", transition: "opacity 0.1s" }}
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
  const [activePanel, setActivePanel] = useState<PanelType>("files");
  const [settingsTab, setSettingsTab] = useState<"theme"|"shortcuts"|"general">("theme");
  const [savedCustomThemes, setSavedCustomThemes] = useState<{name:string;colors:ThemeConfig}[]>(()=>{
    if(typeof window!=="undefined"){const s=localStorage.getItem("orbit-custom-themes");if(s)try{return JSON.parse(s);}catch{}}return[];
  });
  const [theme, setTheme] = useState<string>(() => {
    if (typeof window !== "undefined") { return localStorage.getItem("orbit-theme") || "obsidian"; }
    return "obsidian";
  });
  const [customThemeName, setCustomThemeName] = useState("");

  useEffect(()=>{if(typeof window!=="undefined")localStorage.setItem("orbit-custom-themes",JSON.stringify(savedCustomThemes));},[savedCustomThemes]);
  useEffect(()=>{if(typeof window!=="undefined")localStorage.setItem("orbit-theme",theme);},[theme]);
  const [sidebarOpen,setSidebarOpen]=useState(true);
  const [sidebarWidth,setSidebarWidth]=useState(248);
  const [customTheme, setCustomTheme] = useState<ThemeConfig|null>(null);
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
  const contentTimer=useRef<NodeJS.Timeout|null>(null);

  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const baseTheme = THEMES[theme];
  const t = customTheme ? { ...baseTheme, n: "커스텀", ...customTheme } : baseTheme;
  const isDark=theme!=="light";

  useEffect(()=>{
    if(typeof window!=="undefined") localStorage.setItem("orbit-theme",theme);
    (async()=>{
      try{
        const {createClient}=await import("../lib/supabase");
        const supabase=createClient();
        await supabase.from("pages").upsert({id:"__user_settings__",type:"page",name:"__settings__",content:{theme,customTheme,savedCustomThemes}},{onConflict:"id"});
      }catch{}
    })();
  },[theme,customTheme,savedCustomThemes]);

  useEffect(()=>{(async()=>{
    const res=await loadTree();
    if(res&&res.length>0){
      const filtered=res.filter(n=>n.id!=="__user_settings__");
      setTree(filtered);
      if(filtered[0])setSelectedId(filtered[0].id);
      const settingsNode=res.find(n=>n.id==="__user_settings__");
      if(settingsNode?.content){
        if(settingsNode.content.theme) setTheme(settingsNode.content.theme);
        if(settingsNode.content.customTheme) setCustomTheme(settingsNode.content.customTheme);
        if(settingsNode.content.savedCustomThemes) setSavedCustomThemes(settingsNode.content.savedCustomThemes);
      }
    }
    const b=await dbLoadBM();if(b)setBookmarks(new Set(b));
  })();}, [loadTree, dbLoadBM]);

  useEffect(()=>{if(selectedId){setRecentIds(prev=>[selectedId,...prev.filter(x=>x!==selectedId)].slice(0,20));const nd=findNode(tree,selectedId);if(nd)setPageTitle(nd.name);}},[selectedId, tree]);

  const addNew = useCallback((parentId: string | null, type: "folder" | "page") => {
    const child: TreeNode = { id: uid(), type, name: type === "folder" ? "새 폴더" : "새 페이지", parent_id: parentId, position: tree.length, collapsed: false, content: { editorContent: null, sheets: [] }, children: [] };
    setTree(p => parentId ? insertLocal(p, parentId, child) : [...p, child]); 
    saveNode(child); 
    if (type === "page") setSelectedId(child.id);
  }, [tree.length, saveNode]);

  useEffect(()=>{
    const h=(e:globalThis.KeyboardEvent)=>{
      if((e.ctrlKey||e.metaKey)&&e.key==="n"){e.preventDefault();addNew(null,"page");}
      if((e.ctrlKey||e.metaKey)&&e.key==="p"){e.preventDefault();setActivePanel("search");setSidebarOpen(true);}
      if((e.ctrlKey||e.metaKey)&&e.key==="\\"){e.preventDefault();setSidebarOpen(p=>!p);}
      if((e.ctrlKey||e.metaKey)&&e.shiftKey&&e.key==="F"){e.preventDefault();setFocusMode(p=>!p);}
    };
    window.addEventListener("keydown",h);return()=>window.removeEventListener("keydown",h);
  },[tree, addNew]);

  const startResize=useCallback((e:React.MouseEvent)=>{
    e.preventDefault();resizing.current=true;
    const startX=e.clientX;const startW=sidebarWidth;
    const move=(ev:MouseEvent)=>{if(resizing.current){const w=Math.max(180,Math.min(480,startW+(ev.clientX-startX)));setSidebarWidth(w);}};
    const up=()=>{resizing.current=false;document.removeEventListener("mousemove",move);document.removeEventListener("mouseup",up);};
    document.addEventListener("mousemove",move);document.addEventListener("mouseup",up);
  },[sidebarWidth]);

  const toggleCollapse=(id:string)=>{setTree(prev=>{const upd=(ns:TreeNode[]):TreeNode[]=>ns.map(n=>n.id===id?{...n,collapsed:!n.collapsed}:{...n,children:upd(n.children)});return upd(prev);});const nd=findNode(tree,id);if(nd)saveNode({...nd,collapsed:!nd.collapsed});};
  const renameNode=(id:string,name:string)=>{if(!name.trim())return;setTree(prev=>{const upd=(ns:TreeNode[]):TreeNode[]=>ns.map(n=>n.id===id?{...n,name}:{...n,children:upd(n.children)});return upd(prev);});const nd=findNode(tree,id);if(nd)saveNode({...nd,name,parent_id:findParentId(tree,id)});};
  const commitRename=()=>{if(renameId&&renameVal.trim())renameNode(renameId,renameVal);setRenameId(null);};
  const handleDelete=(id:string)=>{const nd=findNode(tree,id);if(nd)setTrashedNodes(p=>[...p,nd]);setTree(prev=>removeLocal(prev,id));if(selectedId===id)setSelectedId(null);dbDelete(id);};
  const restoreNode=(nd:TreeNode)=>{setTree(p=>[...p,nd]);setTrashedNodes(p=>p.filter(n=>n.id!==nd.id));saveNode(nd);};
  const duplicateNode=(nd:TreeNode)=>{const pid=findParentId(tree,nd.id);const dup:TreeNode={...nd,id:uid(),name:nd.name+" (복사)",parent_id:pid,children:[]};setTree(p=>pid?insertLocal(p,pid,dup):[...p,dup]);saveNode(dup);};
  const toggleBookmark=(id:string)=>{setBookmarks(p=>{const s=new Set(p);s.has(id)?s.delete(id):s.add(id);dbSyncBM(Array.from(s));return s;});};
  const toggleFavorite=(id:string)=>{setFavorites(p=>{const s=new Set(p);s.has(id)?s.delete(id):s.add(id);return s;});};

  const onDragStart=(e:React.DragEvent,id:string)=>{setDragSrc(id);e.dataTransfer.effectAllowed="move";};
  const onDragOver = (e: React.DragEvent, id: string) => { e.preventDefault(); e.dataTransfer.dropEffect = "move"; };
  const onDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault(); if (!dragSrc || dragSrc === targetId) return; if (isDesc(tree, dragSrc, targetId)) return;
    const nd = findNode(tree, dragSrc); if (!nd) return; const targetNd = findNode(tree, targetId); const dropParent = targetNd?.type === "folder" ? targetId : findParentId(tree, targetId);
    setTree(p => { const t = removeLocal(p, dragSrc); return insertLocal(t, dropParent, nd); }); saveNode({ ...nd, parent_id: dropParent }); setDragSrc(null);
  };

  const onContentChange = useCallback((content: any) => {
    if (!selectedId) return;
    setTree(prev => prev.map(n => n.id === selectedId ? { ...n, content } : n));
    if (contentTimer.current) clearTimeout(contentTimer.current);
    contentTimer.current = setTimeout(() => { const nd = findNode(tree, selectedId); if (nd) saveNode({ ...nd, content: { ...nd.content, editorContent: content }, parent_id: findParentId(tree, selectedId) }); }, 800);
    try { const txt = JSON.stringify(content); setWordCount(txt.replace(/[^가-힣a-zA-Z0-9\s]/g, "").split(/\s+/).filter(Boolean).length); } catch { setWordCount(0); }
  }, [selectedId, tree, saveNode]);

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
      {/* Context Menu */}
      {ctxMenu && (
        <div style={{position:"fixed",top:ctxMenu.y,left:ctxMenu.x,zIndex:10000,background:t.card,border:`1px solid ${t.bd}`,borderRadius:8,padding:4,minWidth:160,boxShadow:"0 10px 30px rgba(0,0,0,0.5)"}}>
          {getCtxItems(ctxMenu.node).map((it,i)=>it.divider?(<div key={i} style={{height:1,background:t.bd,margin:"4px 0"}}/>):(<div key={i} onClick={()=>{it.action();setCtxMenu(null);}} style={{display:"flex",alignItems:"center",gap:10,padding:"8px 10px",fontSize:13,cursor:"pointer",borderRadius:6,color:it.danger?"#e55":t.tx}} onMouseEnter={e=>e.currentTarget.style.background=t.hv} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>{it.icon}<span>{it.label}</span></div>))}
        </div>
      )}

      {/* 모바일 상단 바 */}
      {isMobile && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, height: 48, background: t.sb, borderBottom: `1px solid ${t.bd}`, display: "flex", alignItems: "center", padding: "0 12px", zIndex: 999, gap: 12 }}>
          <button onClick={() => setSidebarOpen(!sidebarOpen)} style={{ background: "none", border: "none", color: t.ac, fontSize: 24, cursor: "pointer" }}>☰</button>
          <span style={{ color: t.tx, fontSize: 15, fontWeight: 600 }}>{selectedNode?.name || "ORBIT"}</span>
        </div>
      )}

      {!isMobile && (
        <div className="ribbon" style={{width:44,background:t.rb,borderRight:`1px solid ${t.bd}`,display:"flex",flexDirection:"column",alignItems:"center",paddingTop:8,gap:2,flexShrink:0}}>
          {RIBBON.map(r=>(<div key={r.id} title={r.label} onClick={()=>{const rid=r.id as PanelType;if(activePanel===rid&&sidebarOpen)setSidebarOpen(false);else{setActivePanel(rid);setSidebarOpen(true);}}}
              style={{width:34,height:34,display:"flex",alignItems:"center",justifyContent:"center",borderRadius:6,cursor:"pointer",background:activePanel===r.id&&sidebarOpen?t.hv:"transparent",transition:"background 0.15s"}}
              onMouseEnter={e=>{e.currentTarget.style.background=t.hv;}} onMouseLeave={e=>{if(!(activePanel===r.id&&sidebarOpen))e.currentTarget.style.background="transparent";}}>
              {r.icon(activePanel===r.id&&sidebarOpen?t.ac:t.tx2)}
            </div>))}
          <div style={{flex:1}}/>
          <div title="설정" onClick={()=>{setActivePanel("settings");setSidebarOpen(true);}} style={{width:34,height:34,display:"flex",alignItems:"center",justifyContent:"center",borderRadius:6,cursor:"pointer",marginBottom:8}}
            onMouseEnter={e=>{e.currentTarget.style.background=t.hv;}} onMouseLeave={e=>{e.currentTarget.style.background="transparent";}}>{Icons.settings(t.tx2)}</div>
        </div>
      )}

      <div ref={sidebarRef} className="sidebar-wrap" style={{
        width: sidebarOpen ? (isMobile ? "85vw" : sidebarWidth) : 0,
        minWidth: sidebarOpen ? (isMobile ? "85vw" : sidebarWidth) : 0,
        position: isMobile ? "fixed" : "relative",
        top: 0, left: isMobile ? (sidebarOpen ? 0 : "-85vw") : undefined,
        bottom: 0, zIndex: isMobile ? 1000 : 1, transition: "all 0.25s ease",
        background: t.sb, borderRight: `1px solid ${t.bd}`, overflow: "hidden", display: "flex", flexDirection: "column",
        boxShadow: isMobile && sidebarOpen ? "4px 0 20px rgba(0,0,0,0.5)" : "none"
      }}>
        {/* 사이드바 상단 */}
        <div style={{ height: 40, padding: "0 12px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: `1px solid ${t.bd}`, flexShrink: 0 }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: t.tx, opacity: 0.6 }}>
            {activePanel === "files" ? "파일" : activePanel === "search" ? "검색" : activePanel === "bookmark" ? "북마크" : activePanel === "recent" ? "최근 문서" : activePanel === "trash" ? "휴지통" : "설정"}
          </span>
          <button onClick={() => setSidebarOpen(false)} style={{ background: "none", border: "none", color: t.tx, fontSize: 22, cursor: "pointer", padding: "4px 8px", borderRadius: 6 }} title="사이드바 닫기">✕</button>
        </div>

        {activePanel==="files"&&<div style={{flex:1,overflowY:"auto",padding: isMobile ? "4px 0 60px" : "4px 0"}}>
          {favPages.length>0&&<><div style={{padding:"8px 12px 4px",fontSize:11,fontWeight:600,color:t.tx2,letterSpacing:0.5}}>FAVORITES</div>{favPages.map(p=><div key={p.id} onClick={()=>setSelectedId(p.id)} style={{height:28,padding:"0 12px 0 20px",display:"flex",alignItems:"center",gap:6,cursor:"pointer",fontSize:13,borderRadius:6,margin:"0 4px",background:selectedId===p.id?t.hv:"transparent"}} onMouseEnter={e=>{e.currentTarget.style.background=t.hv;}} onMouseLeave={e=>{if(selectedId!==p.id)e.currentTarget.style.background="transparent";}}>{Icons.star(t.ac)}<span style={{overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{p.name}</span></div>)}<div style={{height:1,background:t.bd,margin:"6px 12px"}}/></>}
          <div style={{padding:"8px 12px 4px",fontSize:11,fontWeight:600,color:t.tx2,letterSpacing:0.5}}>PRIVATE</div>
          <div style={{padding:"4px 8px 8px",display:"flex",gap:6}}>
            <div onClick={()=>addNew(null,"page")} style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",gap:4,padding:"6px 0",borderRadius:6,cursor:"pointer",fontSize:11,fontWeight:500,color:t.tx2,background:t.hv,border:`1px solid ${t.bd}`}} onMouseEnter={e=>{e.currentTarget.style.borderColor=t.ac;}} onMouseLeave={e=>{e.currentTarget.style.borderColor=t.bd;}}>{Icons.page(t.tx2)} 새 노트</div>
            <div onClick={()=>addNew(null,"folder")} style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",gap:4,padding:"6px 0",borderRadius:6,cursor:"pointer",fontSize:11,fontWeight:500,color:t.tx2,background:t.hv,border:`1px solid ${t.bd}`}} onMouseEnter={e=>{e.currentTarget.style.borderColor=t.ac;}} onMouseLeave={e=>{e.currentTarget.style.borderColor=t.bd;}}>{Icons.folder(t.tx2)} 새 폴더</div>
          </div>
          {loading && <div style={{padding:12,opacity:0.4,fontSize:12}}>불러오는 중...</div>}
          {tree.map(n=><FileNode key={n.id} node={n} depth={0} selectedId={selectedId} onSelect={setSelectedId} onToggle={toggleCollapse} onCtx={(e,nd)=>setCtxMenu({x:e.clientX,y:e.clientY,node:nd})} renameId={renameId} renameVal={renameVal} setRenameVal={setRenameVal} commitRename={commitRename} dragSrc={dragSrc} onDragStart={onDragStart} onDragOver={onDragOver} onDrop={onDrop} t={t}/>)}
        </div>}

        {activePanel==="search"&&<div style={{flex:1,overflowY:"auto",padding:8}}><input title="검색어 입력" value={searchQ} onChange={e=>setSearchQ(e.target.value)} placeholder="검색..." autoFocus style={{width:"100%",padding:"8px 10px",background:t.hv,border:`1px solid ${t.bd}`,borderRadius:6,color:t.tx,outline:"none"}}/><div style={{marginTop:8}}>{searchResults.map(p=><div key={p.id} onClick={()=>setSelectedId(p.id)} style={{padding:"6px 10px",fontSize:13,cursor:"pointer",borderRadius:6}} onMouseEnter={e=>e.currentTarget.style.background=t.hv} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>{Icons.page(t.tx2)} <span style={{marginLeft:6}}>{p.name}</span></div>)}</div></div>}
        {activePanel==="bookmark"&&<div style={{flex:1,overflowY:"auto",padding:8}}>{Array.from(bookmarks).map(id=>{const nd=findNode(tree,id);return nd?<div key={id} onClick={()=>setSelectedId(id)} style={{padding:"6px 10px",fontSize:13,cursor:"pointer",borderRadius:6,display:"flex",alignItems:"center",gap:6}} onMouseEnter={e=>e.currentTarget.style.background=t.hv} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>{Icons.bookmark(t.ac)}{nd.name}</div>:null;})}</div>}
        {activePanel==="recent"&&<div style={{flex:1,overflowY:"auto",padding:8}}>{recentIds.map(id=>{const nd=findNode(tree,id);return nd?<div key={id} onClick={()=>setSelectedId(id)} style={{padding:"6px 10px",fontSize:13,cursor:"pointer",borderRadius:6,display:"flex",alignItems:"center",gap:6}} onMouseEnter={e=>e.currentTarget.style.background=t.hv} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>{Icons.recent(t.tx2)}{nd.name}</div>:null;})}</div>}
        {activePanel==="trash"&&<div style={{flex:1,overflowY:"auto",padding:8}}>{trashedNodes.map(nd=><div key={nd.id} style={{padding:"6px 10px",fontSize:13,display:"flex",justifyContent:"space-between"}} onMouseEnter={e=>e.currentTarget.style.background=t.hv} onMouseLeave={e=>e.currentTarget.style.background="transparent"}><span>{nd.name}</span><button onClick={()=>restoreNode(nd)}>복원</button></div>)}</div>}

        {activePanel==="settings"&&<div style={{flex:1,overflowY:"auto",display:"flex",flexDirection:"column"}}>
          <div style={{display:"flex",borderBottom:`1px solid ${t.bd}`}}>
            {(["theme","shortcuts","general"] as const).map(tab=>(<div key={tab} onClick={()=>setSettingsTab(tab)} style={{flex:1,padding:"10px 0",textAlign:"center",fontSize:12,cursor:"pointer",color:settingsTab===tab?t.ac:t.tx2,borderBottom:settingsTab===tab?`2px solid ${t.ac}`:"2px solid transparent"}}>{tab==="theme"?"테마":tab==="shortcuts"?"단축키":"일반"}</div>))}
          </div>
          <div style={{padding:16}}>
            {settingsTab==="theme"&&<>
              <div style={{display:"flex",gap:4,marginBottom:16,background:t.hv,borderRadius:8,padding:3}}>
                {(["preset","palette","custom"] as const).map(m=>(<div key={m} onClick={()=>setThemeMode(m)} style={{flex:1,padding:"6px 0",textAlign:"center",fontSize:11,borderRadius:6,cursor:"pointer",background:themeMode===m?t.ac:"transparent",color:themeMode===m?"#fff":t.tx2}}>{m==="preset"?"기본":m==="palette"?"추천":"커스텀"}</div>))}
              </div>
              {themeMode==="preset"&&<div style={{display:"flex",flexDirection:"column",gap:4}}>
                {Object.entries(THEMES).map(([key,val])=>(<div key={key} onClick={()=>{setTheme(key);setCustomTheme(null);}} style={{padding:10,borderRadius:8,cursor:"pointer",display:"flex",alignItems:"center",gap:12,background:theme===key?t.hv:"transparent"}}>{val.n}</div>))}
              </div>}
              {themeMode==="custom"&&<>
                {([{key:"bg",label:"배경"},{key:"sb",label:"사이드바"},{key:"ac",label:"강조"} ] as ColorItem[]).map(item=>(
                  <div key={item.key} style={{display:"flex",justifyContent:"space-between",marginBottom:8}}>
                    <span style={{fontSize:12}}>{item.label}</span>
                    <input title={item.label} type="color" value={(customTheme as any)?.[item.key]||(t as any)[item.key]} onChange={e=>setCustomTheme({...t, ...customTheme, [item.key]:e.target.value})} />
                  </div>
                ))}
              </>}
            </>}
          </div>
        </div>}
      </div>

      <div style={{flex:1,display:"flex",flexDirection:"column",position:"relative",overflow:"hidden"}}>
        {!isMobile && sidebarOpen && (<div onMouseDown={startResize} style={{position:"absolute",top:0,left:0,bottom:0,width:4,cursor:"col-resize",zIndex:10,background:resizing.current?t.ac:"transparent"}} onMouseEnter={e=>e.currentTarget.style.background=t.ac} onMouseLeave={e=>{if(!resizing.current)e.currentTarget.style.background="transparent"}}/>)}
        <div style={{height:40,padding:"0 20px",display:"flex",alignItems:"center",justifyContent:"space-between",borderBottom:`1px solid ${t.bd}`,zIndex:5}}>
          <div style={{display:"flex",alignItems:"center",gap:8,fontSize:13,opacity:0.6}}>{breadcrumb.map((n,i)=>(<span key={n.id} style={{display:"flex",alignItems:"center",gap:8}}>{i>0&&Icons.chevron(t.tx2)}<span onClick={()=>setSelectedId(n.id)} style={{cursor:"pointer"}} onMouseEnter={e=>e.currentTarget.style.color=t.ac} onMouseLeave={e=>e.currentTarget.style.color="inherit"}>{n.name}</span></span>))}</div>
          <div style={{display:"flex",gap:12}}>
            <button onClick={() => setShowTable(!showTable)} style={{ background: "none", border: "none", color: showTable ? t.ac : t.tx2, cursor: "pointer" }}>{showTable ? "문서 모드" : "테이블 모드"}</button>
            <button onClick={() => setFocusMode(!focusMode)} style={{ background: "none", border: "none", color: t.tx2, cursor: "pointer" }}>포커스</button>
          </div>
        </div>

        <div style={{flex:1,overflowY:"auto",padding:"40px 0"}}>
          {selectedId ? (
            <div style={{maxWidth:focusMode?800:1000,margin:"0 auto",padding:"0 40px"}}>
              <input title="제목 입력" value={pageTitle} onChange={e=>onTitleChange(e.target.value)} style={{width:"100%",fontSize:40,fontWeight:800,background:"transparent",border:"none",color:t.tx,outline:"none",marginBottom:30}} placeholder="Untitled"/>
              {showTable ? (
                <SpreadsheetTable pageId={selectedId} darkMode={isDark} accentColor={t.ac}/>
              ) : (
                <Editor initialContent={selectedNode?.content?.editorContent} onChange={onContentChange} t={t} isDark={isDark}/>
              )}
            </div>
          ) : (
            <div style={{display:"flex",alignItems:"center",justifyContent:"center",height:"100%",opacity:0.2}}>페이지를 선택하세요</div>
          )}
        </div>
      </div>
    </div>
  );
}
