'use client'

import React, { useState, useCallback } from 'react'
import grapesjs, { Editor } from 'grapesjs'
import GjsEditor from '@grapesjs/react'
import 'grapesjs/dist/css/grapes.min.css'
import presetWebpage from 'grapesjs-preset-webpage'
import blocksBasic from 'grapesjs-blocks-basic'
import pluginForms from 'grapesjs-plugin-forms'
import blocksTable from 'grapesjs-blocks-table'
import { createClient } from '@/lib/supabase'
import { useMemo } from 'react'

export default function OrbitBuilder() {
  const supabase = useMemo(() => createClient(), [])
  const [editor, setEditor] = useState<Editor | null>(null)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  // ── 데이터 불러오기 ──
  const loadPage = useCallback(async (editor: Editor) => {
    try {
      const { data, error } = await supabase
        .from('pages')
        .select('project_data')
        .eq('id', 'default')
        .maybeSingle()

      if (error) throw error;

      if (data?.project_data) {
        const projectData = typeof data.project_data === 'string' 
          ? JSON.parse(data.project_data) 
          : data.project_data;
          
        editor.loadProjectData(projectData)
      } else {
        const block = editor.BlockManager.get('orbit-notion-full-layout');
        if (block) {
          editor.setComponents(block.get('content') || '');
        }
      }
    } catch (err) {
      console.error('Builder Load Error:', err)
      const block = editor.BlockManager.get('orbit-notion-full-layout');
      if (block) {
        editor.setComponents(block.get('content') || '');
      }
    }
  }, [supabase])

  const onEditorReady = useCallback((editor: Editor) => {
    setEditor(editor)

    // ── 💾 저장 버튼 및 커맨드 등록 ──
    editor.Panels.addButton('options', {
      id: 'save-to-supabase-btn',
      className: 'fa fa-save custom-save-btn',
      command: 'save-to-supabase',
      attributes: { title: '💾 저장 (Supabase에 현재 상태 저장)' }
    })

    editor.Commands.add('save-to-supabase', {
      run: async (editor) => {
        try {
          console.log('Builder: Starting Save Process...')
          const payload = {
            id: 'default',
            html: editor.getHtml(),
            css: editor.getCss(),
            project_data: editor.getProjectData(),
            updated_at: new Date().toISOString(),
          };

          const { data, error } = await supabase
            .from('pages')
            .upsert(payload, { onConflict: 'id' })
            .select()

          if (error) throw error;

          console.log('Builder: 저장 완료 - 성공 데이터:', data)
          setToast({ message: '페이지 저장 완료', type: 'success' })
          setTimeout(() => setToast(null), 2500)
        } catch (err: any) {
          console.error('Builder: 저장 실패 - 에러 발생:', err)
          setToast({ message: `저장 실패: ${err.message || '알 수 없는 오류'}`, type: 'error' })
          setTimeout(() => setToast(null), 4000)
        }
      }
    })

    // ── Orbit 커스텀 블록 (Widgets & Layouts) ──

    // 1. KPI 카드
    editor.BlockManager.add('orbit-kpi-card', {
      label: 'KPI Card',
      category: 'Orbit Widgets',
      content: `
        <div style="background:#fff; border:1px solid #e4e4e7; border-radius:16px; padding:24px; min-width:200px; box-shadow:0 1px 3px rgba(0,0,0,0.06); font-family:sans-serif;">
          <p style="font-size:12px; color:#71717a; margin:0 0 8px 0; font-weight:700; text-transform:uppercase; letter-spacing:0.05em;">Total Production</p>
          <h2 style="font-size:32px; font-weight:900; color:#18181b; margin:0 0 4px 0; letter-spacing:-0.01em;">1,247</h2>
          <p style="font-size:13px; color:#10b981; margin:0; font-weight:600;">↑ 12.5% from last week</p>
        </div>
      `,
      attributes: { class: 'fa fa-chart-bar' },
    })

    // 2. 상태 보드
    editor.BlockManager.add('orbit-status-board', {
      label: 'Status Board',
      category: 'Orbit Widgets',
      content: `
        <div style="background:#fff; border:1px solid #e4e4e7; border-radius:16px; padding:24px; font-family:sans-serif;">
          <h3 style="font-size:14px; font-weight:800; color:#18181b; margin:0 0 16px 0; text-transform:uppercase; letter-spacing:0.02em;">Production Status</h3>
          <div style="display:flex; gap:8px; flex-wrap:wrap;">
            <span style="padding:6px 14px; border-radius:99px; font-size:12px; font-weight:700; background:#dbeafe; color:#1d4ed8; border:1px solid #bfdbfe;">Planned: 5</span>
            <span style="padding:6px 14px; border-radius:99px; font-size:12px; font-weight:700; background:#fef3c7; color:#b45309; border:1px solid #fde68a;">In Progress: 3</span>
            <span style="padding:6px 14px; border-radius:99px; font-size:12px; font-weight:700; background:#dcfce7; color:#15803d; border:1px solid #bbf7d0;">Completed: 12</span>
            <span style="padding:6px 14px; border-radius:99px; font-size:12px; font-weight:700; background:#fee2e2; color:#dc2626; border:1px solid #fecaca;">Stuck: 1</span>
          </div>
        </div>
      `,
      attributes: { class: 'fa fa-th-large' },
    })

    // 3. ESC 생산 현황
    editor.BlockManager.add('orbit-esc-production', {
      label: 'ESC Production',
      category: 'Orbit Widgets',
      content: `
        <div style="background:linear-gradient(135deg, #001B3E, #0058BE); border-radius:20px; padding:28px; color:#fff; min-width:280px; font-family:sans-serif; box-shadow:0 20px 25px -5px rgba(0, 88, 190, 0.1);">
          <div style="display:flex; align-items:center; gap:12px; margin-bottom:16px;">
            <div style="width:44px; height:44px; background:rgba(255,255,255,0.15); border:1px solid rgba(255,255,255,0.2); border-radius:14px; display:flex; align-items:center; justify-content:center; font-size:20px;">⚡</div>
            <span style="font-size:13px; font-weight:800; opacity:0.9; text-transform:uppercase; tracking:0.1em;">Ceramic ESC Line</span>
          </div>
          <h2 style="font-size:32px; font-weight:900; margin:0 0 8px 0; letter-spacing:-0.02em;">856 units</h2>
          <p style="font-size:12px; opacity:0.7; margin:0; font-weight:600;">Daily target: 1,000 | Yield: 85.6%</p>
          <div style="margin-top:20px; background:rgba(255,255,255,0.15); border-radius:99px; height:10px; overflow:hidden; border:1px solid rgba(255,255,255,0.1);">
            <div style="width:85.6%; height:100%; background:linear-gradient(90deg, #38bdf8, #22d3ee); border-radius:99px;"></div>
          </div>
        </div>
      `,
      attributes: { class: 'fa fa-bolt' },
    })

    // 7. 노션 사이드바
    editor.BlockManager.add('orbit-notion-sidebar', {
      label: '노션 사이드바',
      category: 'Orbit Layouts',
      content: `
        <style>
          .notion-sidebar {
            width: 240px;
            height: 100vh;
            background: #fbfbfa;
            border-right: 1px solid rgba(0,0,0,0.05);
            display: flex;
            flex-direction: column;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif;
            color: #37352f;
          }
          .notion-sidebar-header {
            padding: 12px 14px;
            display: flex;
            align-items: center;
            gap: 8px;
            cursor: pointer;
            transition: background 0.1s ease;
          }
          .notion-sidebar-header:hover { background: rgba(0,0,0,0.04); }
          .notion-sidebar-avatar {
            width: 20px;
            height: 20px;
            background: #3b82f6;
            border-radius: 3px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 11px;
            font-weight: 700;
          }
          .notion-sidebar-name { font-size: 14px; font-weight: 600; flex: 1; }
          .notion-menu-section { margin-top: 12px; }
          .notion-menu-item {
            padding: 4px 14px;
            display: flex;
            align-items: center;
            gap: 10px;
            font-size: 14px;
            cursor: pointer;
            transition: background 0.1s ease;
            color: rgba(55, 53, 47, 0.65);
          }
          .notion-menu-item:hover { background: rgba(0,0,0,0.04); }
          .notion-menu-item.active { color: #37352f; font-weight: 500; }
          .notion-menu-icon { font-size: 16px; width: 20px; text-align: center; }
          .notion-section-title {
            padding: 20px 14px 4px;
            font-size: 11px;
            font-weight: 700;
            color: rgba(55, 53, 47, 0.5);
            text-transform: uppercase;
            letter-spacing: 0.05em;
          }
          .notion-teamspace-item {
            padding: 4px 14px;
            display: flex;
            align-items: center;
            gap: 10px;
            font-size: 14px;
            cursor: pointer;
          }
          .notion-teamspace-item:hover { background: rgba(0,0,0,0.04); }
          .notion-teamspace-icon {
            width: 18px;
            height: 18px;
            background: #e4e4e7;
            border-radius: 3px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 10px;
            font-weight: 700;
          }
        </style>
        <aside class="notion-sidebar">
          <div class="notion-sidebar-header">
            <div class="notion-sidebar-avatar">O</div>
            <div class="notion-sidebar-name">Orbit Workspace</div>
          </div>
          <div class="notion-menu-section">
            <div class="notion-menu-item">🔍 검색</div>
            <a href="/dashboard" class="notion-menu-item active" style="text-decoration: none; color: inherit;">🏠 홈</a>
            <div class="notion-menu-item">📅 캘린더</div>
          </div>
          <div class="notion-section-title">팀스페이스</div>
          <div class="notion-teamspace-item"><div class="notion-teamspace-icon" style="background:#fee2e2; color:#dc2626;">E</div> Engineering</div>
          <div class="notion-teamspace-item"><div class="notion-teamspace-icon" style="background:#dcfce7; color:#15803d;">D</div> Design</div>
          <div class="notion-teamspace-item"><div class="notion-teamspace-icon" style="background:#dbeafe; color:#1d4ed8;">S</div> Sales</div>
        </aside>
      `,
      attributes: { class: 'fa fa-columns' },
    })

    // 8. 노션 워크스페이스 (풀 레이아웃)
    editor.BlockManager.add('orbit-notion-full-layout', {
      label: '노션 워크스페이스',
      category: 'Orbit Layouts',
      content: `
        <style>
          .orbit-notion-layout { display: flex; width: 100%; height: 100vh; background: white; font-family: sans-serif; }
          .notion-main { flex: 1; display: flex; flex-direction: column; overflow: hidden; }
          .notion-top { height: 45px; padding: 0 16px; display: flex; align-items: center; font-size: 14px; color: rgba(55,53,47,0.65); }
          .notion-content { flex: 1; overflow-y: auto; padding: 40px 0; display: flex; flex-direction: column; align-items: center; }
          .notion-inner { width: 100%; max-width: 900px; padding: 0 96px; }
          .notion-h1 { font-size: 40px; font-weight: 700; color: #37352f; margin-bottom: 24px; }
          .notion-card-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 16px; margin-top: 32px; }
          .notion-card { border: 1px solid rgba(0,0,0,0.08); border-radius: 8px; padding: 16px; cursor: pointer; }
          .notion-card:hover { background: rgba(0,0,0,0.02); }
        </style>
        <div class="orbit-notion-layout">
          <div class="notion-main">
            <div class="notion-top">Teamspaces / Product Management / 🚀 Roadmap</div>
            <div class="notion-content">
              <div class="notion-inner">
                <h1 class="notion-h1">🚀 2026 Q1 Roadmap</h1>
                <p>Welcome to your new workspace. Start by adding a block from the manager.</p>
                <div class="notion-card-grid">
                  <div class="notion-card"><strong>Project Alpha</strong><p>In progress...</p></div>
                  <div class="notion-card"><strong>Project Beta</strong><p>Planning...</p></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      `,
      attributes: { class: 'fa fa-desktop' },
    })

    // 9. 애니메이션 상단바
    editor.BlockManager.add('orbit-topnav-animated', {
      label: '상단바 (애니메이션)',
      category: 'Orbit Layouts',
      content: `
        <style>
          .orbit-topnav { display: flex; align-items: center; justify-content: space-between; padding: 0 24px; height: 56px; background: rgba(255,255,255,0.8); backdrop-filter: blur(10px); border-bottom: 1px solid #e4e4e7; }
          .tn-search { padding: 7px 16px; background: #f4f4f5; border-radius: 10px; font-size: 13px; color: #a1a1aa; min-width: 240px; }
          .tn-btn { padding: 7px 16px; background: #3b82f6; color: #fff; font-size: 13px; font-weight: 600; border-radius: 8px; border: none; }
        </style>
        <header class="orbit-topnav">
          <div style="font-size:13px; color:#18181b; font-weight:700;">🚀 Orbit Workspace</div>
          <div class="tn-search">🔍 Search...</div>
          <button class="tn-btn">Invite</button>
        </header>
      `,
      attributes: { class: 'fa fa-window-maximize' },
    })

    loadPage(editor)

  }, [supabase, loadPage])

  return (
    <div className="w-full h-screen bg-white">
      <GjsEditor
        grapesjs={grapesjs}
        grapesjsCss="https://unpkg.com/grapesjs/dist/css/grapes.min.css"
        options={{
          height: '100%',
          storageManager: false,
          plugins: [blocksBasic, presetWebpage, pluginForms, blocksTable],
          pluginsOpts: {
            [blocksBasic as never]: { flexGrid: true },
          },
          canvas: {
            styles: [
              'https://unpkg.com/grapesjs-preset-webpage/dist/grapesjs-preset-webpage.min.css',
              'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;900&display=swap',
            ],
          },
          i18n: {
            locale: 'ko',
            messages: {
              ko: {
                styleManager: {
                  empty: '요소를 선택하면 스타일을 수정할 수 있습니다',
                  sectors: { general: '일반', layout: '레이아웃', typography: '글꼴', decorations: '꾸미기' },
                },
                blockManager: {
                  categories: { 'Orbit Widgets': '오빗 위젯', 'Orbit Layouts': '오빗 레이아웃' },
                }
              }
            }
          }
        }}
        onEditor={onEditorReady}
      />

      {toast && (
        <div className={`fixed bottom-12 left-1/2 -translate-x-1/2 px-6 py-3 rounded-full shadow-xl z-[9999] flex items-center gap-3 ${toast.type === 'success' ? 'bg-zinc-900 text-white' : 'bg-red-600 text-white'}`}>
          <span>{toast.type === 'success' ? '✓' : '✕'}</span>
          <span className="font-bold text-[13px]">{toast.message}</span>
        </div>
      )}
    </div>
  )
}
