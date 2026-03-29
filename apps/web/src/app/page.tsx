"use client";
import { useState, useRef, useEffect } from "react";
import { DynamicEditor } from "../components/DynamicEditor";

interface Page {
  id: string;
  title: string;
  icon: string;
  folderId: string | null;
  content: any[];
}

interface Folder {
  id: string;
  name: string;
  icon: string;
  isOpen: boolean;
}

const PAGE_ICONS = ["📄", "📝", "🚀", "💡", "📊", "🎯", "⚡", "🔧", "📋", "🏭", "✅", "🎨", "📦", "🔬", "📐", "🧪"];
const SIDEBAR_THEMES = [
  { name: "다크", bg: "#0f172a", border: "#1e293b", text: "#94a3b8", active: "#1e293b", accent: "#60a5fa" },
  { name: "네이비", bg: "#0a1628", border: "#162240", text: "#8899b4", active: "#162240", accent: "#5b9cf6" },
  { name: "차콜", bg: "#1a1a2e", border: "#2a2a4a", text: "#9898b8", active: "#2a2a4a", accent: "#a78bfa" },
  { name: "포레스트", bg: "#0d1f1a", border: "#1a3a2f", text: "#7faa96", active: "#1a3a2f", accent: "#34d399" },
  { name: "라이트", bg: "#f8fafc", border: "#e2e8f0", text: "#64748b", active: "#e2e8f0", accent: "#3b82f6" },
];

function ContextMenu({ x, y, items, onClose }: { x: number; y: number; items: { label: string; onClick: () => void }[]; onClose: () => void }) {
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
      position: "fixed", left: x, top: y, background: "#1e293b", border: "1px solid #334155",
      borderRadius: 8, padding: 4, minWidth: 160, zIndex: 9999, boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
    }}>
      {items.map((item, i) => (
        <div key={i} onClick={() => { item.onClick(); onClose(); }}
          style={{ padding: "8px 12px", borderRadius: 6, cursor: "pointer", color: "#e2e8f0", fontSize: 13 }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "#334155")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
          {item.label}
        </div>
      ))}
    </div>
  );
}

function IconPicker({ onSelect, onClose }: { onSelect: (icon: string) => void; onClose: () => void }) {
  return (
    <div style={{
      position: "fixed", top: "50%", left: "50%", transform: "translate(-50%, -50%)",
      background: "#1e293b", border: "1px solid #334155", borderRadius: 12, padding: 16,
      zIndex: 9999, boxShadow: "0 16px 48px rgba(0,0,0,0.5)",
    }}>
      <div style={{ color: "#94a3b8", fontSize: 12, marginBottom: 8, fontWeight: 600 }}>아이콘 선택</div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(8, 1fr)", gap: 4 }}>
        {PAGE_ICONS.map((icon) => (
          <button key={icon} onClick={() => { onSelect(icon); onClose(); }}
            style={{ fontSize: 20, padding: 8, background: "transparent", border: "1px solid #334155",
              borderRadius: 6, cursor: "pointer" }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "#334155")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
            {icon}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function Home() {
  const [folders, setFolders] = useState<Folder[]>([
    { id: "f1", name: "프로젝트", icon: "📁", isOpen: true },
  ]);
  const [pages, setPages] = useState<Page[]>([
    { id: "p1", title: "시작 페이지", icon: "📄", folderId: null, content: [] },
  ]);
  const [currentPageId, setCurrentPageId] = useState("p1");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [search, setSearch] = useState("");
  const [themeIdx, setThemeIdx] = useState(0);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; items: { label: string; onClick: () => void }[] } | null>(null);
  const [iconPicker, setIconPicker] = useState<{ target: string; type: "page" | "folder" } | null>(null);

  const theme = SIDEBAR_THEMES[themeIdx];
  const currentPage = pages.find((p) => p.id === currentPageId);

  const addFolder = () => {
    const id = "f" + Date.now();
    setFolders((prev) => [...prev, { id, name: "새 폴더", icon: "📁", isOpen: true }]);
  };

  const addPage = (folderId: string | null = null) => {
    const id = "p" + Date.now();
    setPages((prev) => [...prev, { id, title: "새 페이지", icon: "📄", folderId, content: [] }]);
    setCurrentPageId(id);
  };

  const updatePage = (id: string, updates: Partial<Page>) => {
    setPages((prev) => prev.map((p) => (p.id === id ? { ...p, ...updates } : p)));
  };

  const deletePage = (id: string) => {
    if (pages.length <= 1) return;
    const remaining = pages.filter((p) => p.id !== id);
    setPages(remaining);
    if (currentPageId === id) setCurrentPageId(remaining[0].id);
  };

  const deleteFolder = (id: string) => {
    setFolders((prev) => prev.filter((f) => f.id !== id));
    setPages((prev) => prev.map((p) => (p.folderId === id ? { ...p, folderId: null } : p)));
  };

  const toggleFolder = (id: string) => {
    setFolders((prev) => prev.map((f) => (f.id === id ? { ...f, isOpen: !f.isOpen } : f)));
  };

  const renameFolder = (id: string, name: string) => {
    setFolders((prev) => prev.map((f) => (f.id === id ? { ...f, name } : f)));
  };

  const movePageToFolder = (pageId: string, folderId: string | null) => {
    setPages((prev) => prev.map((p) => (p.id === pageId ? { ...p, folderId } : p)));
  };

  const showPageMenu = (e: React.MouseEvent, pageId: string) => {
    e.preventDefault();
    e.stopPropagation();
    const page = pages.find((p) => p.id === pageId);
    if (!page) return;
    setContextMenu({
      x: e.clientX, y: e.clientY,
      items: [
        { label: "🔤 이름 변경", onClick: () => {
          const name = prompt("페이지 이름:", page.title);
          if (name) updatePage(pageId, { title: name });
        }},
        { label: "😀 아이콘 변경", onClick: () => setIconPicker({ target: pageId, type: "page" }) },
        ...folders.map((f) => ({
          label: `📁 ${f.name}(으)로 이동`,
          onClick: () => movePageToFolder(pageId, f.id),
        })),
        ...(page.folderId ? [{ label: "📤 폴더에서 꺼내기", onClick: () => movePageToFolder(pageId, null) }] : []),
        { label: "🗑️ 삭제", onClick: () => deletePage(pageId) },
      ],
    });
  };

  const showFolderMenu = (e: React.MouseEvent, folderId: string) => {
    e.preventDefault();
    e.stopPropagation();
    const folder = folders.find((f) => f.id === folderId);
    if (!folder) return;
    setContextMenu({
      x: e.clientX, y: e.clientY,
      items: [
        { label: "🔤 이름 변경", onClick: () => {
          const name = prompt("폴더 이름:", folder.name);
          if (name) renameFolder(folderId, name);
        }},
        { label: "😀 아이콘 변경", onClick: () => setIconPicker({ target: folderId, type: "folder" }) },
        { label: "📄 페이지 추가", onClick: () => addPage(folderId) },
        { label: "🗑️ 삭제", onClick: () => deleteFolder(folderId) },
      ],
    });
  };

  const rootPages = pages.filter((p) => !p.folderId);
  const filteredPages = search ? pages.filter((p) => p.title.toLowerCase().includes(search.toLowerCase())) : null;

  return (
    <div style={{ display: "flex", height: "100vh", background: "#0f172a" }}>
      {contextMenu && <ContextMenu {...contextMenu} onClose={() => setContextMenu(null)} />}
      {iconPicker && (
        <IconPicker
          onSelect={(icon) => {
            if (iconPicker.type === "page") updatePage(iconPicker.target, { icon });
            else setFolders((prev) => prev.map((f) => (f.id === iconPicker.target ? { ...f, icon } : f)));
          }}
          onClose={() => setIconPicker(null)}
        />
      )}

      {/* 사이드바 */}
      <div style={{
        width: sidebarOpen ? 260 : 0, minWidth: sidebarOpen ? 260 : 0,
        background: theme.bg, borderRight: sidebarOpen ? `1px solid ${theme.border}` : "none",
        transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        overflow: "hidden", display: "flex", flexDirection: "column",
      }}>
        <div style={{ padding: "16px 16px 8px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontSize: 18, fontWeight: 800, color: theme.accent, letterSpacing: 2 }}>ORBIT</span>
          <button onClick={() => setSidebarOpen(false)} style={{ background: "none", border: "none", color: theme.text, cursor: "pointer", fontSize: 14 }}>✕</button>
        </div>

        <div style={{ padding: "4px 12px 8px" }}>
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="🔍 검색..."
            style={{ width: "100%", padding: "8px 12px", background: theme.active, border: `1px solid ${theme.border}`,
              borderRadius: 8, color: "#e2e8f0", fontSize: 13, outline: "none" }} />
        </div>

        <div style={{ padding: "4px 12px", display: "flex", gap: 6 }}>
          <button onClick={() => addPage(null)} style={{ flex: 1, padding: "8px 0", background: theme.accent, color: "#fff",
            border: "none", borderRadius: 6, cursor: "pointer", fontSize: 12, fontWeight: 600 }}>+ 페이지</button>
          <button onClick={addFolder} style={{ flex: 1, padding: "8px 0", background: theme.active, color: theme.text,
            border: `1px solid ${theme.border}`, borderRadius: 6, cursor: "pointer", fontSize: 12, fontWeight: 600 }}>+ 폴더</button>
        </div>

        {filteredPages && (
          <div style={{ padding: "8px 8px 0" }}>
            <div style={{ fontSize: 11, color: theme.text, padding: "4px 8px", fontWeight: 600 }}>검색 결과</div>
            {filteredPages.map((page) => (
              <div key={page.id} onClick={() => { setCurrentPageId(page.id); setSearch(""); }}
                style={{ padding: "8px 12px", borderRadius: 6, cursor: "pointer", color: theme.text, fontSize: 13 }}>
                {page.icon} {page.title}
              </div>
            ))}
          </div>
        )}

        {!filteredPages && (
          <div style={{ flex: 1, overflowY: "auto", padding: "8px 8px 0" }}>
            {rootPages.map((page) => (
              <div key={page.id} onClick={() => setCurrentPageId(page.id)} style={{
                padding: "8px 12px", borderRadius: 6, cursor: "pointer", display: "flex", alignItems: "center", gap: 8,
                background: page.id === currentPageId ? theme.active : "transparent",
                color: page.id === currentPageId ? "#e2e8f0" : theme.text,
                fontSize: 13, marginBottom: 1,
              }}>
                <span>{page.icon}</span>
                <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{page.title}</span>
                <button onClick={(e) => showPageMenu(e, page.id)}
                  style={{ background: "none", border: "none", color: theme.text, cursor: "pointer", fontSize: 14, opacity: 0.5, padding: "0 4px" }}
                  onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
                  onMouseLeave={(e) => (e.currentTarget.style.opacity = "0.5")}>⋯</button>
              </div>
            ))}

            {folders.map((folder) => {
              const folderPages = pages.filter((p) => p.folderId === folder.id);
              return (
                <div key={folder.id} style={{ marginTop: 4 }}>
                  <div onClick={() => toggleFolder(folder.id)} style={{
                    padding: "8px 12px", borderRadius: 6, cursor: "pointer", display: "flex", alignItems: "center", gap: 8,
                    color: theme.text, fontSize: 13,
                  }}>
                    <span style={{ fontSize: 10, transition: "transform 0.2s", transform: folder.isOpen ? "rotate(90deg)" : "rotate(0deg)" }}>▶</span>
                    <span>{folder.icon}</span>
                    <span style={{ flex: 1 }}>{folder.name}</span>
                    <button onClick={(e) => { e.stopPropagation(); addPage(folder.id); }}
                      style={{ background: "none", border: "none", color: theme.text, cursor: "pointer", fontSize: 14, opacity: 0.5 }}
                      onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
                      onMouseLeave={(e) => (e.currentTarget.style.opacity = "0.5")}>+</button>
                    <button onClick={(e) => showFolderMenu(e, folder.id)}
                      style={{ background: "none", border: "none", color: theme.text, cursor: "pointer", fontSize: 14, opacity: 0.5 }}
                      onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
                      onMouseLeave={(e) => (e.currentTarget.style.opacity = "0.5")}>⋯</button>
                  </div>
                  {folder.isOpen && (
                    <div style={{ paddingLeft: 24 }}>
                      {folderPages.map((page) => (
                        <div key={page.id} onClick={() => setCurrentPageId(page.id)} style={{
                          padding: "6px 12px", borderRadius: 6, cursor: "pointer", display: "flex", alignItems: "center", gap: 8,
                          background: page.id === currentPageId ? theme.active : "transparent",
                          color: page.id === currentPageId ? "#e2e8f0" : theme.text, fontSize: 13, marginBottom: 1,
                        }}>
                          <span>{page.icon}</span>
                          <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{page.title}</span>
                          <button onClick={(e) => showPageMenu(e, page.id)}
                            style={{ background: "none", border: "none", color: theme.text, cursor: "pointer", fontSize: 14, opacity: 0.5 }}
                            onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
                            onMouseLeave={(e) => (e.currentTarget.style.opacity = "0.5")}>⋯</button>
                        </div>
                      ))}
                      {folderPages.length === 0 && (
                        <div style={{ padding: "6px 12px", color: theme.text, fontSize: 12, fontStyle: "italic", opacity: 0.5 }}>빈 폴더</div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* 색상 팔레트 */}
        <div style={{ padding: "12px 16px", borderTop: `1px solid ${theme.border}` }}>
          <div style={{ fontSize: 11, color: theme.text, marginBottom: 6, fontWeight: 600 }}>테마</div>
          <div style={{ display: "flex", gap: 6 }}>
            {SIDEBAR_THEMES.map((t, i) => (
              <button key={i} onClick={() => setThemeIdx(i)} title={t.name}
                style={{
                  width: 24, height: 24, borderRadius: "50%", background: t.accent, cursor: "pointer",
                  border: i === themeIdx ? "2px solid #fff" : "2px solid transparent",
                  transition: "border 0.2s",
                }} />
            ))}
          </div>
        </div>
      </div>

      {/* 메인 영역 */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <div style={{ padding: "10px 20px", background: "#ffffff", borderBottom: "1px solid #e5e7eb", display: "flex", alignItems: "center", gap: 12 }}>
          {!sidebarOpen && (
            <button onClick={() => setSidebarOpen(true)} style={{
              background: "none", border: "1px solid #e2e8f0", borderRadius: 6, padding: "4px 8px", cursor: "pointer", fontSize: 14, color: "#64748b",
            }}>☰</button>
          )}
          {currentPage && (
            <>
              <span style={{ fontSize: 22, cursor: "pointer" }} onClick={() => setIconPicker({ target: currentPage.id, type: "page" })}>{currentPage.icon}</span>
              <input value={currentPage.title} onChange={(e) => updatePage(currentPage.id, { title: e.target.value })}
                style={{ fontSize: 18, fontWeight: 700, border: "none", outline: "none", color: "#1e293b", flex: 1, background: "transparent" }} />
            </>
          )}
        </div>

        <div style={{ flex: 1, overflow: "auto", background: "#ffffff" }}>
          {currentPage ? (
            <DynamicEditor key={currentPage.id} initialContent={currentPage.content}
              onChange={(content) => updatePage(currentPage.id, { content })} />
          ) : (
            <div style={{ padding: 40, color: "#94a3b8", textAlign: "center" }}>페이지를 선택하세요</div>
          )}
        </div>
      </div>
    </div>
  );
}
