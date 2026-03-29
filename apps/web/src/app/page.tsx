"use client";
import { useState, useRef, useEffect } from "react";
import dynamic from "next/dynamic";

const DynamicEditor = dynamic(() => import("../components/Editor"), {
  ssr: false,
  loading: () => <div style={{ padding: 40, color: "#666" }}>에디터 로딩 중...</div>,
});

interface TreeNode {
  id: string;
  type: "folder" | "page";
  name: string;
  children: TreeNode[];
  content?: any;
  collapsed?: boolean;
}

function uid() { return Math.random().toString(36).slice(2, 10); }

function findNode(nodes: TreeNode[], id: string): TreeNode | null {
  for (const n of nodes) {
    if (n.id === id) return n;
    const found = findNode(n.children, id);
    if (found) return found;
  }
  return null;
}

function removeNode(nodes: TreeNode[], id: string): TreeNode[] {
  return nodes.filter((n) => n.id !== id).map((n) => ({ ...n, children: removeNode(n.children, id) }));
}

function addChild(nodes: TreeNode[], parentId: string, child: TreeNode): TreeNode[] {
  return nodes.map((n) => {
    if (n.id === parentId && n.type === "folder") return { ...n, children: [...n.children, child], collapsed: false };
    return { ...n, children: addChild(n.children, parentId, child) };
  });
}

const THEMES: Record<string, { bg: string; sidebar: string; text: string; accent: string; border: string }> = {
  dark:     { bg: "#1e1e1e", sidebar: "#252526", text: "#cccccc", accent: "#569cd6", border: "#333" },
  navy:     { bg: "#1a1a2e", sidebar: "#16213e", text: "#c9d1d9", accent: "#4fc3f7", border: "#2a2a4a" },
  charcoal: { bg: "#2d2d2d", sidebar: "#1a1a1a", text: "#e0e0e0", accent: "#ff7043", border: "#444" },
  forest:   { bg: "#1b2d1b", sidebar: "#142814", text: "#b8d8b8", accent: "#66bb6a", border: "#2a3d2a" },
  light:    { bg: "#ffffff", sidebar: "#f5f5f5", text: "#333333", accent: "#1976d2", border: "#e0e0e0" },
};

// ─── Context Menu ───────────────────────────────────
function ContextMenu({ x, y, items, onClose }: {
  x: number; y: number;
  items: { label: string; onClick: () => void }[];
  onClose: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);

  return (
    <div ref={ref} style={{
      position: "fixed", left: x, top: y, zIndex: 9999,
      background: "#2a2a2a", border: "1px solid #444", borderRadius: 6,
      padding: "4px 0", minWidth: 140, boxShadow: "0 4px 16px rgba(0,0,0,0.4)",
    }}>
      {items.map((item, i) => (
        <div key={i} onClick={() => { item.onClick(); onClose(); }}
          style={{
            padding: "6px 14px", fontSize: 12, cursor: "pointer", color: "#ddd",
            transition: "background 0.1s",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.08)")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
        >
          {item.label}
        </div>
      ))}
    </div>
  );
}

// ─── Sidebar Node ───────────────────────────────────
function SidebarNode({
  node, depth, selectedId, onSelect, onToggle, onRename, onDelete, onAddChild, onContextMenu
}: {
  node: TreeNode; depth: number; selectedId: string | null;
  onSelect: (id: string) => void;
  onToggle: (id: string) => void;
  onRename: (id: string, name: string) => void;
  onDelete: (id: string) => void;
  onAddChild: (parentId: string, type: "folder" | "page") => void;
  onContextMenu: (e: React.MouseEvent, nodeId: string, nodeType: "folder" | "page") => void;
}) {
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState(node.name);
  const [hovered, setHovered] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { if (editing && inputRef.current) inputRef.current.focus(); }, [editing]);

  const isFolder = node.type === "folder";
  const isSelected = node.id === selectedId;

  return (
    <div>
      <div
        style={{
          display: "flex", alignItems: "center",
          padding: `3px 8px 3px ${depth * 16 + 8}px`,
          cursor: "pointer",
          background: isSelected ? "rgba(255,255,255,0.08)" : hovered ? "rgba(255,255,255,0.03)" : "transparent",
          borderRadius: 4, fontSize: 13, lineHeight: "28px",
        }}
        onClick={() => isFolder ? onToggle(node.id) : onSelect(node.id)}
        onDoubleClick={() => { setEditing(true); setEditName(node.name); }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        <span style={{ width: 16, fontSize: 11, opacity: 0.4, flexShrink: 0 }}>
          {isFolder ? (node.collapsed ? "▸" : "▾") : "─"}
        </span>

        {editing ? (
          <input ref={inputRef} value={editName}
            onChange={(e) => setEditName(e.target.value)}
            onBlur={() => { onRename(node.id, editName); setEditing(false); }}
            onKeyDown={(e) => {
              if (e.key === "Enter") { onRename(node.id, editName); setEditing(false); }
              if (e.key === "Escape") setEditing(false);
            }}
            style={{
              background: "transparent", border: "1px solid rgba(255,255,255,0.2)",
              color: "inherit", fontSize: 13, padding: "0 4px", outline: "none",
              width: "100%", borderRadius: 3,
            }}
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginLeft: 4 }}>
            {node.name}
          </span>
        )}

        {hovered && !editing && (
          <span style={{ opacity: 0.3, fontSize: 14, padding: "0 2px", lineHeight: 1 }}
            onClick={(e) => { e.stopPropagation(); onContextMenu(e, node.id, node.type); }}>
            ⋯
          </span>
        )}
      </div>

      {isFolder && !node.collapsed && node.children.map((child) => (
        <SidebarNode key={child.id} node={child} depth={depth + 1}
          selectedId={selectedId} onSelect={onSelect} onToggle={onToggle}
          onRename={onRename} onDelete={onDelete} onAddChild={onAddChild}
          onContextMenu={onContextMenu}
        />
      ))}
    </div>
  );
}

// ─── Main ───────────────────────────────────────────
export default function Home() {
  const [theme, setTheme] = useState("dark");
  const [showSettings, setShowSettings] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [ctxMenu, setCtxMenu] = useState<{ x: number; y: number; nodeId: string; nodeType: "folder" | "page" } | null>(null);
  const [renamingId, setRenamingId] = useState<string | null>(null);

  const [tree, setTree] = useState<TreeNode[]>([
    { id: "folder-1", type: "folder", name: "프로젝트", collapsed: false, children: [
      { id: "page-1", type: "page", name: "시작하기", children: [], content: null },
    ]},
    { id: "page-2", type: "page", name: "메모", children: [], content: null },
  ]);
  const [selectedId, setSelectedId] = useState<string | null>("page-1");

  const t = THEMES[theme];

  const toggleCollapse = (id: string) => {
    const update = (nodes: TreeNode[]): TreeNode[] =>
      nodes.map((n) => n.id === id ? { ...n, collapsed: !n.collapsed } : { ...n, children: update(n.children) });
    setTree(update(tree));
  };

  const renameNode = (id: string, name: string) => {
    const update = (nodes: TreeNode[]): TreeNode[] =>
      nodes.map((n) => n.id === id ? { ...n, name } : { ...n, children: update(n.children) });
    setTree(update(tree));
  };

  const deleteNode = (id: string) => {
    setTree(removeNode(tree, id));
    if (selectedId === id) setSelectedId(null);
  };

  const addChildTo = (parentId: string, type: "folder" | "page") => {
    const child: TreeNode = { id: uid(), type, name: type === "folder" ? "새 폴더" : "새 페이지", children: [], content: null };
    setTree(addChild(tree, parentId, child));
  };

  const addRoot = (type: "folder" | "page") => {
    setTree([...tree, { id: uid(), type, name: type === "folder" ? "새 폴더" : "새 페이지", children: [], content: null }]);
  };

  const handleContextMenu = (e: React.MouseEvent, nodeId: string, nodeType: "folder" | "page") => {
    setCtxMenu({ x: e.clientX, y: e.clientY, nodeId, nodeType });
  };

  const ctxMenuItems = ctxMenu ? [
    { label: "이름 변경", onClick: () => setRenamingId(ctxMenu.nodeId) },
    ...(ctxMenu.nodeType === "folder" ? [
      { label: "새 폴더", onClick: () => addChildTo(ctxMenu.nodeId, "folder") },
      { label: "새 페이지", onClick: () => addChildTo(ctxMenu.nodeId, "page") },
    ] : []),
    { label: "삭제", onClick: () => deleteNode(ctxMenu.nodeId) },
  ] : [];

  return (
    <div style={{ display: "flex", height: "100vh", background: t.bg, color: t.text, fontFamily: "'Inter', sans-serif" }}>
      {ctxMenu && <ContextMenu x={ctxMenu.x} y={ctxMenu.y} items={ctxMenuItems} onClose={() => setCtxMenu(null)} />}

      {/* Sidebar */}
      <div style={{
        width: sidebarOpen ? 240 : 0, minWidth: sidebarOpen ? 240 : 0,
        background: t.sidebar, borderRight: `1px solid ${t.border}`,
        overflow: "hidden", transition: "width 0.2s, min-width 0.2s",
        display: "flex", flexDirection: "column",
      }}>
        <div style={{ padding: "16px 12px 8px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontWeight: 700, fontSize: 15, letterSpacing: 1 }}>ORBIT</span>
          <span style={{ cursor: "pointer", opacity: 0.4, fontSize: 14 }} onClick={() => setShowSettings(!showSettings)}>⚙</span>
        </div>

        {showSettings && (
          <div style={{ padding: "8px 12px 12px", borderBottom: `1px solid ${t.border}` }}>
            <div style={{ fontSize: 11, opacity: 0.5, marginBottom: 6 }}>테마</div>
            <div style={{ display: "flex", gap: 6 }}>
              {Object.keys(THEMES).map((key) => (
                <div key={key} onClick={() => setTheme(key)} style={{
                  width: 20, height: 20, borderRadius: "50%", background: THEMES[key].bg,
                  border: theme === key ? `2px solid ${t.accent}` : `1px solid ${t.border}`, cursor: "pointer",
                }} />
              ))}
            </div>
          </div>
        )}

        <div style={{ flex: 1, overflowY: "auto", padding: "4px" }}>
          {tree.map((node) => (
            <SidebarNode key={node.id} node={node} depth={0}
              selectedId={selectedId} onSelect={setSelectedId} onToggle={toggleCollapse}
              onRename={renameNode} onDelete={deleteNode} onAddChild={addChildTo}
              onContextMenu={handleContextMenu}
            />
          ))}
        </div>

        <div style={{ padding: "8px 12px", borderTop: `1px solid ${t.border}`, display: "flex", gap: 8, fontSize: 12 }}>
          <span style={{ cursor: "pointer", opacity: 0.5 }} onClick={() => addRoot("folder")}>+ 폴더</span>
          <span style={{ cursor: "pointer", opacity: 0.5 }} onClick={() => addRoot("page")}>+ 페이지</span>
        </div>
      </div>

      {/* Main */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <div style={{ height: 40, borderBottom: `1px solid ${t.border}`, display: "flex", alignItems: "center", padding: "0 12px", gap: 8 }}>
          <span style={{ cursor: "pointer", opacity: 0.4 }} onClick={() => setSidebarOpen(!sidebarOpen)}>
            {sidebarOpen ? "◂" : "☰"}
          </span>
          <span style={{ fontSize: 13, opacity: 0.6 }}>
            {selectedId ? findNode(tree, selectedId)?.name ?? "ORBIT" : "페이지를 선택하세요"}
          </span>
        </div>
        <div style={{ flex: 1, overflow: "auto" }}>
          {selectedId && findNode(tree, selectedId)?.type === "page" ? (
            <DynamicEditor key={selectedId} />
          ) : (
            <div style={{ padding: 40, opacity: 0.3, fontSize: 14 }}>← 페이지를 선택하거나 새로 만드세요</div>
          )}
        </div>
      </div>
    </div>
  );
}
