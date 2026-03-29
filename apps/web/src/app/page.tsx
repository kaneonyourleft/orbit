"use client";
import { useState } from "react";
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

export default function Home() {
  const [folders, setFolders] = useState<Folder[]>([
    { id: "f1", name: "프로젝트", icon: "📁", isOpen: true },
    { id: "f2", name: "메모", icon: "📁", isOpen: true },
  ]);
  const [pages, setPages] = useState<Page[]>([
    { id: "p1", title: "시작 페이지", icon: "📄", folderId: null, content: [] },
  ]);
  const [currentPageId, setCurrentPageId] = useState("p1");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [search, setSearch] = useState("");

  const currentPage = pages.find((p) => p.id === currentPageId);

  const addFolder = () => {
    const id = "f" + Date.now();
    setFolders((prev) => [...prev, { id, name: "새 폴더", icon: "📁", isOpen: true }]);
  };

  const addPage = (folderId: string | null = null) => {
    const id = "p" + Date.now();
    const newPage: Page = { id, title: "새 페이지", icon: "📄", folderId, content: [] };
    setPages((prev) => [...prev, newPage]);
    setCurrentPageId(id);
  };

  const updatePageTitle = (id: string, title: string) => {
    setPages((prev) => prev.map((p) => (p.id === id ? { ...p, title } : p)));
  };

  const updatePageContent = (id: string, content: any[]) => {
    setPages((prev) => prev.map((p) => (p.id === id ? { ...p, content } : p)));
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

  const rootPages = pages.filter((p) => !p.folderId);
  const filteredPages = search
    ? pages.filter((p) => p.title.toLowerCase().includes(search.toLowerCase()))
    : null;

  return (
    <div style={{ display: "flex", height: "100vh", background: "#0f172a" }}>
      {/* 사이드바 */}
      <div style={{
        width: sidebarOpen ? 260 : 0,
        minWidth: sidebarOpen ? 260 : 0,
        background: "#0f172a",
        borderRight: sidebarOpen ? "1px solid #1e293b" : "none",
        transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
      }}>
        {/* 로고 + 접기 */}
        <div style={{ padding: "16px 16px 8px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontSize: 18, fontWeight: 800, color: "#60a5fa", letterSpacing: 2 }}>ORBIT</span>
          <button onClick={() => setSidebarOpen(false)} style={{ background: "none", border: "none", color: "#475569", cursor: "pointer", fontSize: 14 }}>✕</button>
        </div>

        {/* 검색 */}
        <div style={{ padding: "4px 12px 8px" }}>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="🔍 검색..."
            style={{
              width: "100%", padding: "8px 12px", background: "#1e293b", border: "1px solid #334155",
              borderRadius: 8, color: "#e2e8f0", fontSize: 13, outline: "none",
            }}
          />
        </div>

        {/* 새로 만들기 버튼들 */}
        <div style={{ padding: "4px 12px", display: "flex", gap: 6 }}>
          <button onClick={() => addPage(null)} style={{
            flex: 1, padding: "8px 0", background: "#1e40af", color: "#fff", border: "none",
            borderRadius: 6, cursor: "pointer", fontSize: 12, fontWeight: 600,
          }}>+ 페이지</button>
          <button onClick={addFolder} style={{
            flex: 1, padding: "8px 0", background: "#334155", color: "#cbd5e1", border: "none",
            borderRadius: 6, cursor: "pointer", fontSize: 12, fontWeight: 600,
          }}>+ 폴더</button>
        </div>

        {/* 검색 결과 */}
        {filteredPages && (
          <div style={{ padding: "8px 8px 0" }}>
            <div style={{ fontSize: 11, color: "#64748b", padding: "4px 8px", fontWeight: 600 }}>검색 결과</div>
            {filteredPages.map((page) => (
              <div key={page.id} onClick={() => { setCurrentPageId(page.id); setSearch(""); }}
                style={{ padding: "8px 12px", borderRadius: 6, cursor: "pointer", color: "#94a3b8", fontSize: 13,
                  background: page.id === currentPageId ? "#1e293b" : "transparent" }}>
                {page.icon} {page.title}
              </div>
            ))}
          </div>
        )}

        {/* 폴더 + 페이지 트리 */}
        {!filteredPages && (
          <div style={{ flex: 1, overflowY: "auto", padding: "8px 8px 0" }}>
            {/* 루트 페이지 */}
            {rootPages.map((page) => (
              <div key={page.id} onClick={() => setCurrentPageId(page.id)} style={{
                padding: "8px 12px", borderRadius: 6, cursor: "pointer", display: "flex", alignItems: "center", gap: 8,
                background: page.id === currentPageId ? "#1e293b" : "transparent",
                color: page.id === currentPageId ? "#e2e8f0" : "#94a3b8",
                fontSize: 13, marginBottom: 1, transition: "all 0.15s",
              }}>
                <span>{page.icon}</span>
                <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{page.title}</span>
                <button onClick={(e) => { e.stopPropagation(); deletePage(page.id); }}
                  style={{ background: "none", border: "none", color: "#475569", cursor: "pointer", fontSize: 11, opacity: 0 }}
                  onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
                  onMouseLeave={(e) => (e.currentTarget.style.opacity = "0")}>✕</button>
              </div>
            ))}

            {/* 폴더 */}
            {folders.map((folder) => {
              const folderPages = pages.filter((p) => p.folderId === folder.id);
              return (
                <div key={folder.id} style={{ marginTop: 4 }}>
                  <div onClick={() => toggleFolder(folder.id)} style={{
                    padding: "8px 12px", borderRadius: 6, cursor: "pointer", display: "flex", alignItems: "center", gap: 8,
                    color: "#94a3b8", fontSize: 13, transition: "all 0.15s",
                  }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "#1e293b40")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
                    <span style={{ fontSize: 10, transition: "transform 0.2s", transform: folder.isOpen ? "rotate(90deg)" : "rotate(0deg)" }}>▶</span>
                    <span>{folder.icon}</span>
                    <input value={folder.name} onChange={(e) => renameFolder(folder.id, e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                      style={{ flex: 1, background: "none", border: "none", color: "#94a3b8", fontSize: 13, outline: "none", padding: 0 }} />
                    <button onClick={(e) => { e.stopPropagation(); addPage(folder.id); }}
                      style={{ background: "none", border: "none", color: "#475569", cursor: "pointer", fontSize: 14 }}>+</button>
                    <button onClick={(e) => { e.stopPropagation(); deleteFolder(folder.id); }}
                      style={{ background: "none", border: "none", color: "#475569", cursor: "pointer", fontSize: 11 }}>✕</button>
                  </div>
                  {folder.isOpen && (
                    <div style={{ paddingLeft: 20 }}>
                      {folderPages.map((page) => (
                        <div key={page.id} onClick={() => setCurrentPageId(page.id)} style={{
                          padding: "6px 12px", borderRadius: 6, cursor: "pointer", display: "flex", alignItems: "center", gap: 8,
                          background: page.id === currentPageId ? "#1e293b" : "transparent",
                          color: page.id === currentPageId ? "#e2e8f0" : "#94a3b8",
                          fontSize: 13, marginBottom: 1,
                        }}>
                          <span>{page.icon}</span>
                          <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{page.title}</span>
                          <button onClick={(e) => { e.stopPropagation(); deletePage(page.id); }}
                            style={{ background: "none", border: "none", color: "#475569", cursor: "pointer", fontSize: 11, opacity: 0 }}
                            onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
                            onMouseLeave={(e) => (e.currentTarget.style.opacity = "0")}>✕</button>
                        </div>
                      ))}
                      {folderPages.length === 0 && (
                        <div style={{ padding: "6px 12px", color: "#475569", fontSize: 12, fontStyle: "italic" }}>빈 폴더</div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 메인 영역 */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {/* 상단 바 */}
        <div style={{
          padding: "10px 20px", background: "#ffffff", borderBottom: "1px solid #e5e7eb",
          display: "flex", alignItems: "center", gap: 12,
        }}>
          {!sidebarOpen && (
            <button onClick={() => setSidebarOpen(true)} style={{
              background: "none", border: "1px solid #e2e8f0", borderRadius: 6, padding: "4px 8px",
              cursor: "pointer", fontSize: 14, color: "#64748b",
            }}>☰</button>
          )}
          {currentPage && (
            <>
              <span style={{ fontSize: 22 }}>{currentPage.icon}</span>
              <input
                value={currentPage.title}
                onChange={(e) => updatePageTitle(currentPage.id, e.target.value)}
                style={{ fontSize: 18, fontWeight: 700, border: "none", outline: "none", color: "#1e293b", flex: 1, background: "transparent" }}
              />
            </>
          )}
        </div>

        {/* 에디터 */}
        <div style={{ flex: 1, overflow: "auto", background: "#ffffff" }}>
          {currentPage ? (
            <DynamicEditor
              key={currentPage.id}
              initialContent={currentPage.content}
              onChange={(content) => updatePageContent(currentPage.id, content)}
            />
          ) : (
            <div style={{ padding: 40, color: "#94a3b8", textAlign: "center" }}>페이지를 선택하세요</div>
          )}
        </div>
      </div>
    </div>
  );
}
