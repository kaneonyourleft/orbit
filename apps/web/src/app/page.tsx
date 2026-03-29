"use client";
import { useState, useRef, useEffect, useCallback, DragEvent } from "react";
import dynamic from "next/dynamic";

const DynamicEditor = dynamic(() => import("../components/Editor"), {
  ssr: false,
  loading: () => <div style={{ padding: 40, color: "#555" }}>로딩 중...</div>,
});

// ─── Types ──────────────────────────────────────────
interface TreeNode {
  id: string;
  type: "folder" | "page";
  name: string;
  children: TreeNode[];
  content?: any;
  collapsed?: boolean;
}

// ─── Helpers ────────────────────────────────────────
const uid = () => Math.random().toString(36).slice(2, 10);

function findNode(nodes: TreeNode[], id: string): TreeNode | null {
  for (const n of nodes) {
    if (n.id === id) return n;
    const f = findNode(n.children, id);
    if (f) return f;
  }
  return null;
}

function findParentId(nodes: TreeNode[], targetId: string, parentId: string | null = null): string | null {
  for (const n of nodes) {
    if (n.id === targetId) return parentId;
    const f = findParentId(n.children, targetId, n.id);
    if (f !== null) return f;
  }
  return null;
}

function removeNode(nodes: TreeNode[], id: string): TreeNode[] {
  return nodes.filter((n) => n.id !== id).map((n) => ({ ...n, children: removeNode(n.children, id) }));
}

function insertNode(nodes: TreeNode[], parentId: string | null, child: TreeNode): TreeNode[] {
  if (parentId === null) return [...nodes, child];
  return nodes.map((n) => {
    if (n.id === parentId && n.type === "folder")
      return { ...n, children: [...n.children, child], collapsed: false };
    return { ...n, children: insertNode(n.children, parentId, child) };
  });
}

function isDescendant(nodes: TreeNode[], ancestorId: string, targetId: string): boolean {
  const node = findNode(nodes, ancestorId);
  if (!node) return false;
  for (const c of node.children) {
    if (c.id === targetId) return true;
    if (isDescendant([c], c.id, targetId)) return true;
  }
  return false;
}

// ─── Theme ──────────────────────────────────────────
const THEMES: Record<string, { n: string; bg: string; sb: string; rb: string; tx: string; ac: string; bd: string; hover: string }> = {
  dark:     { n: "다크",    bg: "#1e1e1e", sb: "#252526", rb: "#1e1e1e", tx: "#ccc", ac: "#569cd6", bd: "#333",    hover: "rgba(255,255,255,0.06)" },
  obsidian: { n: "옵시디언", bg: "#1a1a1a", sb: "#202020", rb: "#181818", tx: "#dcddde", ac: "#7f6df2", bd: "#2e2e2e", hover: "rgba(255,255,255,0.05)" },
  navy:     { n: "네이비",  bg: "#1a1a2e", sb: "#16213e", rb: "#12192e", tx: "#c9d1d9", ac: "#4fc3f7", bd: "#2a2a4a", hover: "rgba(255,255,255,0.05)" },
  forest:   { n: "포레스트", bg: "#1b2d1b", sb: "#142814", rb: "#0f200f", tx: "#b8d8b8", ac: "#66bb6a", bd: "#2a3d2a", hover: "rgba(255,255,255,0.05)" },
  light:    { n: "라이트",  bg: "#fff",    sb: "#f6f6f6", rb: "#eee",    tx: "#333",    ac: "#1976d2", bd: "#e0e0e0", hover: "rgba(0,0,0,0.04)" },
};

// ─── Context Menu ───────────────────────────────────
function CtxMenu({ x, y, items, onClose }: {
  x: number; y: number; items: { label: string; danger?: boolean; onClick: () => void }[]; onClose: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) onClose(); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [onClose]);

  return (
    <div style={{
      position: "fixed", left: x, top: y, zIndex: 9999,
      background: "#2a2a2a", border: "1px solid #444", borderRadius: 6,
      padding: "4px 0", minWidth: 160, boxShadow: "0 4px 20px rgba(0,0,0,0.5)",
    }} ref={ref}>
      {items.map((item, i) => (
        <div key={i} onClick={() => { item.onClick(); onClose(); }} style={{
          padding: "7px 14px", fontSize: 12, cursor: "pointer",
          color: item.danger ? "#e55" : "#ddd",
        }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.08)")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
        >{item.label}</div>
      ))}
    </div>
  );
}

// ─── File Tree Node ─────────────────────────────────
function FileNode({
  node, depth, selectedId, dragOverId, onSelect, onToggle, onContextMenu, onDragStart, onDragOver, onDrop,
  theme,
}: {
  node: TreeNode; depth: number; selectedId: string | null; dragOverId: string | null;
  onSelect: (id: string) => void; onToggle: (id: string) => void;
  onContextMenu: (e: React.MouseEvent, id: string, type: "folder" | "page") => void;
  onDragStart: (id: string) => void; onDragOver: (e: DragEvent, id: string) => void; onDrop: (e: DragEvent, id: string) => void;
  theme: typeof THEMES.dark;
}) {
  const [hovered, setHovered] = useState(false);
  const isFolder = node.type === "folder";
  const isSelected = node.id === selectedId;
  const isDragOver = node.id === dragOverId && isFolder;

  return (
    <div>
      <div
        draggable
        onDragStart={(e) => { e.dataTransfer.effectAllowed = "move"; onDragStart(node.id); }}
        onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); onDragOver(e, node.id); }}
        onDrop={(e) => { e.preventDefault(); e.stopPropagation(); onDrop(e, node.id); }}
        onClick={() => isFolder ? onToggle(node.id) : onSelect(node.id)}
        onContextMenu={(e) => { e.preventDefault(); onContextMenu(e, node.id, node.type); }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          display: "flex", alignItems: "center",
          padding: `2px 6px 2px ${depth * 18 + 6}px`,
          cursor: "pointer", borderRadius: 4, fontSize: 13, lineHeight: "26px",
          background: isDragOver ? "rgba(127,109,242,0.15)" : isSelected ? theme.hover : hovered ? "rgba(255,255,255,0.02)" : "transparent",
          border: isDragOver ? "1px dashed rgba(127,109,242,0.4)" : "1px solid transparent",
          marginBottom: 1,
        }}
      >
        <span style={{ width: 18, fontSize: 10, opacity: 0.5, flexShrink: 0, textAlign: "center" }}>
          {isFolder ? (node.collapsed ? "▸" : "▾") : ""}
        </span>
        <span style={{ width: 16, fontSize: 12, opacity: 0.45, flexShrink: 0, textAlign: "center" }}>
          {isFolder ? (node.collapsed ? "📁" : "📂") : "📄"}
        </span>
        <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginLeft: 6,
          fontWeight: isFolder ? 500 : 400, opacity: isFolder ? 1 : 0.85 }}>
          {node.name}
        </span>
      </div>
      {isFolder && !node.collapsed && node.children.map((c) => (
        <FileNode key={c.id} node={c} depth={depth + 1} selectedId={selectedId} dragOverId={dragOverId}
          onSelect={onSelect} onToggle={onToggle} onContextMenu={onContextMenu}
          onDragStart={onDragStart} onDragOver={onDragOver} onDrop={onDrop} theme={theme} />
      ))}
    </div>
  );
}

// ─── Ribbon Icons ───────────────────────────────────
const RIBBON_ITEMS = [
  { id: "files",     icon: "📄", label: "파일 탐색기" },
  { id: "search",    icon: "🔍", label: "검색" },
  { id: "bookmarks", icon: "🔖", label: "북마크" },
  { id: "settings",  icon: "⚙",  label: "설정" },
];

// ═══════════════════════════════════════════════════════
export default function Home() {
  const [theme, setTheme] = useState("obsidian");
  const [activePanel, setActivePanel] = useState("files");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [ctxMenu, setCtxMenu] = useState<{ x: number; y: number; nodeId: string; nodeType: "folder" | "page" } | null>(null);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renamingVal, setRenamingVal] = useState("");
  const [dragSourceId, setDragSourceId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const [bookmarks, setBookmarks] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const renameRef = useRef<HTMLInputElement>(null);

  const [tree, setTree] = useState<TreeNode[]>([
    { id: "f1", type: "folder", name: "프로젝트", collapsed: false, children: [
      { id: "p1", type: "page", name: "시작하기", children: [] },
      { id: "f2", type: "folder", name: "디자인", collapsed: true, children: [
        { id: "p2", type: "page", name: "와이어프레임", children: [] },
      ]},
    ]},
    { id: "f3", type: "folder", name: "메모", collapsed: false, children: [
      { id: "p3", type: "page", name: "아이디어", children: [] },
    ]},
    { id: "p4", type: "page", name: "빠른 메모", children: [] },
  ]);
  const [selectedId, setSelectedId] = useState<string | null>("p1");

  const t = THEMES[theme];

  useEffect(() => {
    if (renamingId && renameRef.current) renameRef.current.focus();
  }, [renamingId]);

  // ── Tree Ops ──
  const toggleCollapse = (id: string) => {
    const up = (ns: TreeNode[]): TreeNode[] => ns.map((n) => n.id === id ? { ...n, collapsed: !n.collapsed } : { ...n, children: up(n.children) });
    setTree(up(tree));
  };

  const renameNode = (id: string, name: string) => {
    if (!name.trim()) return;
    const up = (ns: TreeNode[]): TreeNode[] => ns.map((n) => n.id === id ? { ...n, name: name.trim() } : { ...n, children: up(n.children) });
    setTree(up(tree));
    setRenamingId(null);
  };

  const deleteNode = (id: string) => {
    if (!confirm("정말 삭제하시겠습니까?")) return;
    setTree(removeNode(tree, id));
    if (selectedId === id) setSelectedId(null);
    setBookmarks((b) => b.filter((x) => x !== id));
  };

  const addNew = (parentId: string | null, type: "folder" | "page") => {
    const child: TreeNode = { id: uid(), type, name: type === "folder" ? "새 폴더" : "새 페이지", children: [] };
    if (parentId) setTree(insertNode(tree, parentId, child));
    else setTree([...tree, child]);
    setRenamingId(child.id);
    setRenamingVal(child.name);
  };

  // ── Drag & Drop ──
  const handleDragOver = useCallback((_e: DragEvent, targetId: string) => {
    setDragOverId(targetId);
  }, []);

  const handleDrop = useCallback((_e: DragEvent, targetId: string) => {
    if (!dragSourceId || dragSourceId === targetId) { setDragOverId(null); return; }
    const targetNode = findNode(tree, targetId);
    if (!targetNode) { setDragOverId(null); return; }
    if (isDescendant(tree, dragSourceId, targetId)) { setDragOverId(null); return; }

    const sourceNode = findNode(tree, dragSourceId);
    if (!sourceNode) { setDragOverId(null); return; }

    const dropTarget = targetNode.type === "folder" ? targetId : findParentId(tree, targetId);
    const sourceParent = findParentId(tree, dragSourceId);
    if (dropTarget === sourceParent) { setDragOverId(null); return; }

    const cleaned = removeNode(tree, dragSourceId);
    const result = insertNode(cleaned, dropTarget, { ...sourceNode });
    setTree(result);
    setDragOverId(null);
    setDragSourceId(null);
  }, [dragSourceId, tree]);

  // ── Context Menu ──
  const handleCtx = (e: React.MouseEvent, id: string, type: "folder" | "page") => {
    e.preventDefault();
    setCtxMenu({ x: e.clientX, y: e.clientY, nodeId: id, nodeType: type });
  };

  const ctxItems = ctxMenu ? [
    { label: "이름 변경", onClick: () => { setRenamingId(ctxMenu.nodeId); setRenamingVal(findNode(tree, ctxMenu.nodeId)?.name || ""); } },
    ...(ctxMenu.nodeType === "folder" ? [
      { label: "새 페이지", onClick: () => addNew(ctxMenu.nodeId, "page") },
      { label: "새 폴더", onClick: () => addNew(ctxMenu.nodeId, "folder") },
    ] : []),
    { label: bookmarks.includes(ctxMenu.nodeId) ? "북마크 해제" : "북마크 추가",
      onClick: () => setBookmarks((b) => b.includes(ctxMenu.nodeId) ? b.filter((x) => x !== ctxMenu.nodeId) : [...b, ctxMenu.nodeId]) },
    { label: "삭제", danger: true, onClick: () => deleteNode(ctxMenu.nodeId) },
  ] : [];

  // ── Search ──
  const collectPages = (nodes: TreeNode[]): TreeNode[] => {
    let result: TreeNode[] = [];
    for (const n of nodes) {
      if (n.type === "page") result.push(n);
      result = [...result, ...collectPages(n.children)];
    }
    return result;
  };
  const searchResults = searchQuery
    ? collectPages(tree).filter((p) => p.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : [];

  // ── Inline Rename ──
  const renderName = (node: TreeNode, depth: number) => {
    if (renamingId === node.id) {
      return (
        <div style={{ padding: `2px 6px 2px ${depth * 18 + 40}px` }}>
          <input ref={renameRef} value={renamingVal}
            onChange={(e) => setRenamingVal(e.target.value)}
            onBlur={() => renameNode(node.id, renamingVal)}
            onKeyDown={(e) => { if (e.key === "Enter") renameNode(node.id, renamingVal); if (e.key === "Escape") setRenamingId(null); }}
            style={{
              width: "100%", background: "rgba(255,255,255,0.08)", border: "1px solid rgba(127,109,242,0.4)",
              color: t.tx, fontSize: 13, padding: "2px 6px", borderRadius: 4, outline: "none",
            }}
          />
        </div>
      );
    }
    return null;
  };

  // ── Render ──
  return (
    <div style={{ display: "flex", height: "100vh", background: t.bg, color: t.tx, fontFamily: "'Inter','Segoe UI',sans-serif", fontSize: 14 }}>
      {ctxMenu && <CtxMenu x={ctxMenu.x} y={ctxMenu.y} items={ctxItems} onClose={() => setCtxMenu(null)} />}

      {/* ── Ribbon ── */}
      <div style={{
        width: 44, background: t.rb, borderRight: `1px solid ${t.bd}`,
        display: "flex", flexDirection: "column", alignItems: "center", paddingTop: 8, gap: 2, flexShrink: 0,
      }}>
        {RIBBON_ITEMS.map((r) => (
          <div key={r.id} title={r.label}
            onClick={() => { if (activePanel === r.id && sidebarOpen) setSidebarOpen(false); else { setActivePanel(r.id); setSidebarOpen(true); } }}
            style={{
              width: 34, height: 34, display: "flex", alignItems: "center", justifyContent: "center",
              borderRadius: 6, cursor: "pointer", fontSize: 16,
              background: activePanel === r.id && sidebarOpen ? t.hover : "transparent",
              opacity: activePanel === r.id && sidebarOpen ? 1 : 0.5,
            }}
            onMouseEnter={(e) => { if (!(activePanel === r.id && sidebarOpen)) e.currentTarget.style.opacity = "0.8"; }}
            onMouseLeave={(e) => { if (!(activePanel === r.id && sidebarOpen)) e.currentTarget.style.opacity = "0.5"; }}
          >{r.icon}</div>
        ))}
      </div>

      {/* ── Sidebar ── */}
      <div style={{
        width: sidebarOpen ? 240 : 0, minWidth: sidebarOpen ? 240 : 0,
        background: t.sb, borderRight: sidebarOpen ? `1px solid ${t.bd}` : "none",
        overflow: "hidden", transition: "width 0.15s, min-width 0.15s",
        display: "flex", flexDirection: "column",
      }}>
        {/* Panel header */}
        <div style={{ padding: "10px 12px 6px", fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1.5, opacity: 0.4 }}>
          {RIBBON_ITEMS.find((r) => r.id === activePanel)?.label}
        </div>

        {/* ── Files Panel ── */}
        {activePanel === "files" && (
          <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
            <div style={{ flex: 1, overflowY: "auto", padding: "2px 4px" }}
              onDragOver={(e) => { e.preventDefault(); setDragOverId(null); }}
              onDrop={(e) => {
                e.preventDefault();
                if (dragSourceId) {
                  const src = findNode(tree, dragSourceId);
                  if (src) {
                    const cleaned = removeNode(tree, dragSourceId);
                    setTree([...cleaned, { ...src }]);
                  }
                }
                setDragOverId(null); setDragSourceId(null);
              }}
            >
              {tree.map((node) => (
                <div key={node.id}>
                  {renamingId === node.id ? renderName(node, 0) : (
                    <FileNode node={node} depth={0} selectedId={selectedId} dragOverId={dragOverId}
                      onSelect={setSelectedId} onToggle={toggleCollapse} onContextMenu={handleCtx}
                      onDragStart={setDragSourceId} onDragOver={handleDragOver} onDrop={handleDrop} theme={t} />
                  )}
                </div>
              ))}
            </div>
            <div style={{ padding: "6px 10px", borderTop: `1px solid ${t.bd}`, display: "flex", gap: 10, fontSize: 12 }}>
              <span style={{ cursor: "pointer", opacity: 0.5 }} onClick={() => addNew(null, "page")}>+ 페이지</span>
              <span style={{ cursor: "pointer", opacity: 0.5 }} onClick={() => addNew(null, "folder")}>+ 폴더</span>
            </div>
          </div>
        )}

        {/* ── Search Panel ── */}
        {activePanel === "search" && (
          <div style={{ flex: 1, padding: "4px 10px", display: "flex", flexDirection: "column" }}>
            <input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="검색..."
              style={{
                width: "100%", padding: "6px 10px", background: "rgba(255,255,255,0.06)",
                border: `1px solid ${t.bd}`, borderRadius: 4, color: t.tx, fontSize: 13, outline: "none", marginBottom: 8,
              }}
            />
            <div style={{ flex: 1, overflowY: "auto" }}>
              {searchResults.map((p) => (
                <div key={p.id} onClick={() => { setSelectedId(p.id); setActivePanel("files"); }}
                  style={{ padding: "6px 8px", cursor: "pointer", borderRadius: 4, fontSize: 13 }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = t.hover)}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                >📄 {p.name}</div>
              ))}
              {searchQuery && searchResults.length === 0 && (
                <div style={{ opacity: 0.4, fontSize: 12, padding: 8 }}>결과 없음</div>
              )}
            </div>
          </div>
        )}

        {/* ── Bookmarks Panel ── */}
        {activePanel === "bookmarks" && (
          <div style={{ flex: 1, padding: "4px 10px", overflowY: "auto" }}>
            {bookmarks.length === 0 && <div style={{ opacity: 0.4, fontSize: 12, padding: 8 }}>북마크가 없습니다</div>}
            {bookmarks.map((bId) => {
              const node = findNode(tree, bId);
              if (!node) return null;
              return (
                <div key={bId} onClick={() => { setSelectedId(bId); setActivePanel("files"); }}
                  style={{ padding: "6px 8px", cursor: "pointer", borderRadius: 4, fontSize: 13, display: "flex", alignItems: "center", gap: 6 }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = t.hover)}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                >
                  <span>📄</span><span>{node.name}</span>
                </div>
              );
            })}
          </div>
        )}

        {/* ── Settings Panel ── */}
        {activePanel === "settings" && (
          <div style={{ flex: 1, padding: "8px 12px" }}>
            <div style={{ fontSize: 12, opacity: 0.5, marginBottom: 10 }}>테마</div>
            {Object.entries(THEMES).map(([key, val]) => (
              <div key={key} onClick={() => setTheme(key)}
                style={{
                  display: "flex", alignItems: "center", gap: 10, padding: "7px 8px",
                  cursor: "pointer", borderRadius: 6, fontSize: 13, marginBottom: 2,
                  background: theme === key ? t.hover : "transparent",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = t.hover)}
                onMouseLeave={(e) => (e.currentTarget.style.background = theme === key ? t.hover : "transparent")}
              >
                <div style={{ width: 16, height: 16, borderRadius: "50%", background: val.bg, border: `1px solid ${val.bd}`, flexShrink: 0 }} />
                <span>{val.n}</span>
                {theme === key && <span style={{ marginLeft: "auto", opacity: 0.5, fontSize: 11 }}>✓</span>}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Main Area ── */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {/* Top bar */}
        <div style={{ height: 36, borderBottom: `1px solid ${t.bd}`, display: "flex", alignItems: "center", padding: "0 14px", gap: 8 }}>
          <span style={{ fontSize: 13, opacity: 0.6 }}>
            {selectedId ? findNode(tree, selectedId)?.name ?? "ORBIT" : "페이지를 선택하세요"}
          </span>
        </div>
        {/* Editor */}
        <div style={{ flex: 1, overflow: "auto" }}>
          {selectedId && findNode(tree, selectedId)?.type === "page" ? (
            <DynamicEditor key={selectedId} />
          ) : (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", opacity: 0.25, fontSize: 14 }}>
              페이지를 선택하거나 새로 만드세요
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
