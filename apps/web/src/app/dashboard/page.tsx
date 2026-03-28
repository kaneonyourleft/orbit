'use client'

import React, { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase'
import Link from 'next/link'

type Teamspace = {
  id: string;
  name: string;
  icon: string;
  color: string;
  description: string;
}

type PageItem = {
  id: string;
  title: string;
  icon?: string;
  teamspace_id?: string;
  parent_id?: string;
}

export default function DashboardPage() {
  const [teamspaces, setTeamspaces] = useState<Teamspace[]>([])
  const [pages, setPages] = useState<PageItem[]>([])
  const [joinedTeamspaceIds, setJoinedTeamspaceIds] = useState<string[]>([])
  const [currentPage, setCurrentPage] = useState<{ id: string; html: string; css: string } | null>(null)
  const [loading, setLoading] = useState(true)
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false)
  const [activeModal, setActiveModal] = useState<'none' | 'teamspace' | 'search'>('none')
  const [searchQuery, setSearchQuery] = useState('')

  const supabase = createClient()

  // ── 데이터 로드 ──
  const fetchData = useCallback(async () => {
    try {
      const [{ data: tsData }, { data: pData }] = await Promise.all([
        supabase.from('teamspaces').select('*'),
        supabase.from('pages').select('id, title, teamspace_id, parent_id')
      ])
      if (tsData) setTeamspaces(tsData)
      if (pData) setPages(pData)
      if (tsData && joinedTeamspaceIds.length === 0) {
        setJoinedTeamspaceIds([tsData[0]?.id, tsData[1]?.id].filter(Boolean))
      }
    } catch (err) {
      console.error('Data Fetch Error:', err)
    } finally {
      setLoading(false)
    }
  }, [supabase, joinedTeamspaceIds.length])

  const loadPage = useCallback(async (id: string) => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('pages')
        .select('*')
        .eq('id', id)
        .maybeSingle()
      if (data) setCurrentPage(data)
    } catch (err) {
      console.error('Page Load Error:', err)
    } finally {
      setLoading(false)
    }
  }, [supabase])

  useEffect(() => {
    fetchData()
    loadPage('default')
  }, [fetchData, loadPage])

  const toggleJoin = (id: string) => {
    setJoinedTeamspaceIds(prev => 
      prev.includes(id) ? prev.filter(tid => tid !== id) : [...prev, id]
    )
  }

  if (loading && !currentPage) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-[#fbfbfa]">
        <div className="animate-pulse w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full" />
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-white font-sans text-[#37352f] overflow-hidden">
      <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0" />

      {/* ── 📱 모바일 상단바 (햄버거 메뉴) ── */}
      <header className="fixed top-0 left-0 right-0 h-14 bg-white/80 backdrop-blur-md border-b z-[60] flex items-center justify-between px-4 lg:hidden">
         <button 
           onClick={() => setIsMobileSidebarOpen(true)}
           className="w-10 h-10 flex items-center justify-center text-xl hover:bg-zinc-100 rounded-lg"
         >
           ☰
         </button>
         <div className="font-bold text-[15px] tracking-tight text-zinc-800">Orbit Dashboard</div>
         <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-[10px] font-bold shadow-lg shadow-blue-200">K</div>
      </header>

      {/* ── 👥 사이드바 엔진 (반응형 래퍼) ── */}
      <aside 
        className={`fixed inset-y-0 left-0 z-[100] bg-[#fbfbfa] border-r border-[#0000000a] transition-all duration-300 lg:relative lg:z-10
          ${isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          ${isSidebarOpen ? 'lg:w-[260px]' : 'lg:w-[68px]'}
        `}
      >
        <div className="flex flex-col h-full overflow-hidden">
          {/* Header */}
          <div className="p-3 mb-2 flex items-center gap-3">
             <div className="w-6 h-6 bg-zinc-900 rounded-md flex items-center justify-center text-white text-[11px] font-black">O</div>
             {isSidebarOpen && <span className="font-bold text-sm truncate animate-in fade-in">Orbit Workspace</span>}
             <button onClick={() => setIsMobileSidebarOpen(false)} className="lg:hidden ml-auto text-xl">✕</button>
          </div>

          {/* Nav Items */}
          <div className="px-2 space-y-1">
             {[
               { id: 'search', label: 'Search', icon: '🔍', action: () => setActiveModal('search') },
               { id: 'teamspaces', label: 'Browse', icon: '👥', action: () => setActiveModal('teamspace') },
               { id: 'settings', label: 'Settings', icon: '⚙️' },
             ].map(item => (
               <div 
                 key={item.id} 
                 onClick={item.action}
                 className="flex items-center gap-3 px-3 py-2 text-sm hover:bg-zinc-200/50 cursor-pointer rounded-lg text-zinc-600 transition-colors"
               >
                 <span className="text-lg">{item.icon}</span>
                 {isSidebarOpen && <span className="animate-in slide-in-from-left-2">{item.label}</span>}
               </div>
             ))}
          </div>

          <div className="mt-8 px-4 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
            {isSidebarOpen ? 'Teamspaces' : '•••'}
          </div>

          <div className="flex-1 overflow-y-auto mt-2 px-2 scrollbar-none">
             {teamspaces.filter(ts => joinedTeamspaceIds.includes(ts.id)).map(ts => (
                <div key={ts.id} className="mb-2">
                   <div className="px-3 py-2 flex items-center gap-3 hover:bg-zinc-100 rounded-lg cursor-pointer group">
                      <span className="text-xl shrink-0" style={{ color: ts.color }}>{ts.icon}</span>
                      {isSidebarOpen && <span className="text-sm font-semibold truncate flex-1">{ts.name}</span>}
                   </div>
                   {isSidebarOpen && (
                     <div className="ml-8 mt-1 space-y-1 border-l border-zinc-100 pl-2">
                        {pages.filter(p => p.teamspace_id === ts.id).map(p => (
                          <div 
                            key={p.id} 
                            onClick={() => { loadPage(p.id); setIsMobileSidebarOpen(false); }}
                            className="text-[13px] py-1 px-2 hover:bg-zinc-50 rounded text-zinc-500 cursor-pointer truncate"
                          >
                            📄 {p.title}
                          </div>
                        ))}
                     </div>
                   )}
                </div>
             ))}
          </div>
        </div>
      </aside>

      {/* ── 메인 콘텐츠 ── */}
      <main className="flex-1 flex flex-col h-full bg-white relative">
        <header className="h-11 hidden lg:flex items-center justify-between px-4 border-b border-zinc-50 sticky top-0 bg-white/80 backdrop-blur-md z-20">
          <div className="flex items-center gap-2 text-[13px]">
             <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-1 hover:bg-zinc-100 rounded text-zinc-400">
                {isSidebarOpen ? '⇽' : '⇾'}
             </button>
             <span className="text-zinc-300">/</span>
             <span className="font-bold text-zinc-800">{pages.find(p => p.id === currentPage?.id)?.title || 'Untitled'}</span>
          </div>
          <div className="flex items-center gap-2">
             <button className="text-[12px] bg-blue-600 text-white px-3 py-1 rounded-full font-bold shadow-lg shadow-blue-100">Share</button>
             <button className="w-8 h-8 hover:bg-zinc-100 rounded-full flex items-center justify-center">⋯</button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto scroll-smooth pt-14 lg:pt-0 pb-20 lg:pb-0">
          <style dangerouslySetInnerHTML={{ __html: `
            ${currentPage?.css || ''}
            
            /* ── Global Responsive Overrides ── */
            .rendered-canvas { width: 100%; max-width: 1200px; margin: 0 auto; padding: 48px 24px; }
            
            /* Desktop (2x2 Grid) */
            @media (min-width: 1024px) {
              .notion-card-grid { display: grid !important; grid-template-columns: repeat(2, 1fr) !important; gap: 24px !important; }
            }
            
            /* Tablet (1x2 Grid) */
            @media (min-width: 768px) and (max-width: 1023px) {
              .notion-card-grid { display: grid !important; grid-template-columns: repeat(2, 1fr) !important; gap: 16px !important; }
              .notion-sidebar { width: 68px !important; }
            }
            
            /* Mobile (1x1 Grid) */
            @media (max-width: 767px) {
              .notion-card-grid { display: block !important; }
              .notion-card-grid > * { margin-bottom: 16px !important; width: 100% !important; }
              .notion-h1 { font-size: 32px !important; margin-bottom: 20px !important; }
              .rendered-canvas { padding: 32px 20px !important; }
            }
          `}} />
          <div className="rendered-canvas animate-in fade-in duration-500" dangerouslySetInnerHTML={{ __html: currentPage?.html || '' }} />
        </div>

        {/* ── 📱 모바일 하단 탭바 ── */}
        <nav className="fixed bottom-0 left-0 right-0 h-16 bg-white/95 backdrop-blur-lg border-t z-50 flex items-center justify-around px-4 lg:hidden">
           <button className="flex flex-col items-center gap-1 text-blue-600">
             <span className="text-xl">🏠</span>
             <span className="text-[10px] font-bold">Home</span>
           </button>
           <button className="flex flex-col items-center gap-1 text-zinc-400">
             <span className="text-xl">🔍</span>
             <span className="text-[10px] font-medium">Search</span>
           </button>
           <button className="flex flex-col items-center gap-1 text-zinc-400">
             <span className="text-xl">📊</span>
             <span className="text-[10px] font-medium">Dashboard</span>
           </button>
           <button className="flex flex-col items-center gap-1 text-zinc-400">
             <span className="text-xl">⚙️</span>
             <span className="text-[10px] font-medium">Settings</span>
           </button>
        </nav>
      </main>

      {/* ── 👥 Teamspace Modal ── */}
      {activeModal === 'teamspace' && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-200">
            <header className="px-6 py-5 border-b flex items-center justify-between bg-zinc-50">
               <h2 className="font-black text-xl tracking-tight">Browse Teamspaces</h2>
               <button onClick={() => setActiveModal('none')} className="w-8 h-8 flex items-center justify-center hover:bg-zinc-200 rounded-full">✕</button>
            </header>
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
               {teamspaces.map(ts => (
                 <div key={ts.id} className="p-5 border-2 rounded-2xl flex items-center justify-between hover:border-blue-500 hover:bg-blue-50/30 transition-all group">
                    <div className="flex items-center gap-5">
                       <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl shadow-lg border-4 border-white" style={{ background: ts.color + '20', color: ts.color }}>
                         {ts.icon}
                       </div>
                       <div>
                         <h3 className="font-black text-[17px] tracking-tight">{ts.name}</h3>
                         <p className="text-sm text-zinc-500 line-clamp-1">{ts.description}</p>
                       </div>
                    </div>
                    <button 
                      onClick={() => toggleJoin(ts.id)}
                      className={`px-6 py-2 rounded-full text-sm font-black transition-all ${joinedTeamspaceIds.includes(ts.id) 
                        ? 'bg-zinc-100 text-zinc-400 border border-zinc-200' 
                        : 'bg-blue-600 text-white shadow-xl shadow-blue-200 hover:scale-105 active:scale-95'}`}
                    >
                       {joinedTeamspaceIds.includes(ts.id) ? 'Joined' : 'Join'}
                    </button>
                 </div>
               ))}
            </div>
          </div>
        </div>
      )}

      {/* ── 🔍 Search Modal ── */}
      {activeModal === 'search' && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-zinc-900/10 backdrop-blur-md animate-in fade-in">
           <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border flex flex-col max-h-[70vh] animate-in slide-in-from-top-4">
              <div className="flex items-center gap-4 p-5 border-b">
                 <span className="text-2xl">🔍</span>
                 <input 
                   autoFocus
                   placeholder="Search anything in Orbit..." 
                   className="flex-1 outline-none text-lg font-medium" 
                   value={searchQuery}
                   onChange={(e) => setSearchQuery(e.target.value)}
                 />
                 <kbd className="hidden sm:block px-2 py-1 bg-zinc-100 border rounded text-[10px] font-bold text-zinc-400 shadow-sm">ESC</kbd>
              </div>
              <div className="overflow-y-auto flex-1 p-3">
                 {pages.filter(p => p.title.toLowerCase().includes(searchQuery.toLowerCase())).map(p => (
                    <div 
                      key={p.id} 
                      onClick={() => { loadPage(p.id); setActiveModal('none'); }}
                      className="p-4 hover:bg-blue-50/50 rounded-xl cursor-pointer flex items-center gap-4 group transition-colors"
                    >
                       <div className="w-10 h-10 bg-zinc-100 rounded-lg flex items-center justify-center group-hover:bg-blue-100 transition-colors">📄</div>
                       <div className="flex-1">
                          <h4 className="font-bold text-[15px]">{p.title}</h4>
                          <p className="text-[11px] text-zinc-400 uppercase font-black tracking-widest">{teamspaces.find(t => t.id === p.teamspace_id)?.name || 'Personal'}</p>
                       </div>
                       <span className="text-[11px] font-bold text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity">Jump to &rarr;</span>
                    </div>
                 ))}
              </div>
           </div>
        </div>
      )}

      {/* ✏️ ✏️ Floating Edit Button ── */}
      <Link 
        href="/builder" 
        className="fixed bottom-24 right-6 w-14 h-14 bg-zinc-900 border-4 border-white shadow-2xl rounded-full flex items-center justify-center hover:scale-110 active:scale-90 transition-all z-[200] lg:bottom-10"
        title="Open Builder"
      >
        <span className="text-2xl text-white">✏️</span>
      </Link>

      {/* Mobile Drawer Overlay */}
      {isMobileSidebarOpen && (
        <div 
          onClick={() => setIsMobileSidebarOpen(false)}
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[90] lg:hidden animate-in fade-in"
        />
      )}
    </div>
  )
}
