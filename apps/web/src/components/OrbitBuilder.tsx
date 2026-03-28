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

export default function OrbitBuilder() {
  const supabase = createClient()
  const [editor, setEditor] = useState<Editor | null>(null)
  const [showToast, setShowToast] = useState(false)

  // Use editor state to log readiness or other side effects
  if (editor) {
    // console.log('Orbit Engine: Builder Ready')
  }

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
      run: (editor) => {
        editor.store();
        setShowToast(true);
        setTimeout(() => setShowToast(false), 2000);
      }
    })

    // ── Orbit 커스텀 블록 (Widgets & Layouts) ──

    // 1. KPI 카드 (Orbit Widgets)
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

    // 2. 상태 보드 (Orbit Widgets)
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

    // 3. 세라믹 ESC 생산 현황 (Orbit Widgets)
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

    // 7. Notion 스타일 사이드바 (개인화 & 팀스페이스)
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
            <div class="notion-menu-item">
              <span class="notion-menu-icon">🔍</span> 검색
            </div>
            <div class="notion-menu-item">
              <span class="notion-menu-icon">🏠</span> 홈
            </div>
            <div class="notion-menu-item active">
              <span class="notion-menu-icon">📅</span> 캘린더
            </div>
          </div>
          
          <div class="notion-section-title">팀스페이스</div>
          <div class="notion-teamspace-item">
            <div class="notion-teamspace-icon" style="background: #fee2e2; color: #dc2626;">E</div>
            <span>Engineering</span>
          </div>
          <div class="notion-teamspace-item">
            <div class="notion-teamspace-icon" style="background: #dcfce7; color: #15803d;">D</div>
            <span>Design</span>
          </div>
          <div class="notion-teamspace-item">
            <div class="notion-teamspace-icon" style="background: #dbeafe; color: #1d4ed8;">S</div>
            <span>Sales & Marketing</span>
          </div>
          
          <div class="notion-section-title">Private</div>
          <div class="notion-menu-item">
            <span class="notion-menu-icon">📄</span> 개인 메모
          </div>
        </aside>
      `,
      attributes: { class: 'fa fa-columns' },
    })

    // 8. Notion 스타일 전체 워크스페이스 레이아웃 (사이드바 + 콘텐츠 일체형)
    editor.BlockManager.add('orbit-notion-full-layout', {
      label: '노션 워크스페이스',
      category: 'Orbit Layouts',
      content: `
        <style>
          .orbit-notion-layout {
            display: flex;
            width: 100%;
            height: 100vh;
            background: white;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif;
          }
          .notion-main-content {
            flex: 1;
            display: flex;
            flex-direction: column;
            overflow: hidden;
          }
          .notion-top-bar {
            height: 45px;
            padding: 0 16px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            font-size: 14px;
            color: rgba(55, 53, 47, 0.65);
          }
          .notion-breadcrumb { display: flex; align-items: center; gap: 8px; }
          .notion-breadcrumb span:last-child { color: #37352f; font-weight: 500; }
          
          .notion-page-container {
            flex: 1;
            overflow-y: auto;
            padding: 24px 0 80px;
            display: flex;
            flex-direction: column;
            align-items: center;
          }
          .notion-page-content {
            width: 100%;
            max-width: 900px;
            padding: 0 96px;
          }
          .notion-page-title {
            font-size: 40px;
            font-weight: 700;
            color: #37352f;
            margin-bottom: 24px;
            outline: none;
          }
          .notion-block {
            min-height: 24px;
            display: flex;
            align-items: center;
            font-size: 16px;
            margin-bottom: 8px;
            color: #37352f;
          }
          .notion-card-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
            gap: 16px;
            margin-top: 32px;
          }
          .notion-simple-card {
            border: 1px solid rgba(0,0,0,0.08);
            border-radius: 8px;
            padding: 16px;
            transition: background 0.1s ease;
            cursor: pointer;
          }
          .notion-simple-card:hover { background: rgba(0,0,0,0.02); }
        </style>
        <div class="orbit-notion-layout">
          <!-- Notion Sidebar Internal (For drag-and-drop combined layout) -->
          <aside class="notion-sidebar">
            <div class="notion-sidebar-header">
              <div class="notion-sidebar-avatar" style="background: #18181b;">O</div>
              <div class="notion-sidebar-name">Orbit OS</div>
            </div>
            <div class="notion-menu-section">
              <div class="notion-menu-item">🔍 검색</div>
              <div class="notion-menu-item">🏠 홈</div>
              <div class="notion-menu-item">📥 알림함</div>
            </div>
            <div class="notion-section-title">팀스페이스</div>
            <div class="notion-teamspace-item"><div class="notion-teamspace-icon">G</div> General</div>
            <div class="notion-teamspace-item"><div class="notion-teamspace-icon" style="background:#e0f2fe; color:#0369a1;">P</div> Product Management</div>
            <div class="notion-teamspace-item"><div class="notion-teamspace-icon" style="background:#fef3c7; color:#b45309;">M</div> Marketing</div>
          </aside>

          <!-- Main Content -->
          <div class="notion-main-content">
            <div class="notion-top-bar">
              <div class="notion-breadcrumb">
                <span>Teamspaces</span> / <span>Product Management</span> / <span>🚀 Roadmap</span>
              </div>
            </div>
            <div class="notion-page-container">
              <div class="notion-page-content">
                <h1 class="notion-page-title">🚀 2026 Q1 Product Roadmap</h1>
                <div class="notion-block">이곳에 주요 프로젝트 일정과 목표를 정리합니다.</div>
                
                <div class="notion-card-grid">
                  <div class="notion-simple-card">
                    <div style="font-size:11px; color:#1d4ed8; font-weight:700; margin-bottom:8px; text-transform:uppercase;">In Development</div>
                    <div style="font-weight:600; margin-bottom:4px; font-size:15px;">Orbit Workspace OS UI</div>
                    <div style="font-size:13px; color:rgba(55,53,47,0.6);">Finalizing the sidebar-focused workspace navigation.</div>
                  </div>
                  <div class="notion-simple-card">
                    <div style="font-size:11px; color:#c2410c; font-weight:700; margin-bottom:8px; text-transform:uppercase;">Planning</div>
                    <div style="font-weight:600; margin-bottom:4px; font-size:15px;">Supabase Realtime Sync</div>
                    <div style="font-size:13px; color:rgba(55,53,47,0.6);">Implementing multi-user collaboration features.</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      `,
      attributes: { class: 'fa fa-desktop' },
    })

    // 8. 애니메이션 탑 네비게이션
    editor.BlockManager.add('orbit-topnav-animated', {
      label: '상단바 (애니메이션)',
      category: 'Orbit Layouts',
      content: `
        <style>
          @keyframes navSlideDown {
            from { transform: translateY(-100%); opacity: 0; }
            to { transform: translateY(0); opacity: 1; }
          }
          @keyframes navFadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          .orbit-topnav {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 0 24px;
            height: 56px;
            background: rgba(255,255,255,0.85);
            backdrop-filter: blur(12px);
            border-bottom: 1px solid #e4e4e7;
            font-family: 'Inter', sans-serif;
            animation: navSlideDown 0.4s cubic-bezier(0.16, 1, 0.3, 1);
          }
          .orbit-topnav .tn-left {
            display: flex;
            align-items: center;
            gap: 12px;
            animation: navFadeIn 0.5s ease 0.2s both;
          }
          .orbit-topnav .tn-breadcrumb {
            font-size: 13px;
            color: #71717a;
          }
          .orbit-topnav .tn-breadcrumb strong {
            color: #18181b;
            font-weight: 700;
          }
          .orbit-topnav .tn-search {
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 7px 16px;
            background: #f4f4f5;
            border-radius: 10px;
            font-size: 13px;
            color: #a1a1aa;
            min-width: 240px;
            animation: navFadeIn 0.5s ease 0.3s both;
          }
          .orbit-topnav .tn-right {
            display: flex;
            align-items: center;
            gap: 8px;
            animation: navFadeIn 0.5s ease 0.4s both;
          }
          .orbit-topnav .tn-badge {
            padding: 4px 10px;
            background: #dcfce7;
            color: #15803d;
            font-size: 11px;
            font-weight: 700;
            border-radius: 99px;
          }
          .orbit-topnav .tn-btn {
            padding: 7px 16px;
            background: #3b82f6;
            color: #fff;
            font-size: 13px;
            font-weight: 600;
            border-radius: 8px;
            border: none;
            cursor: pointer;
          }
          .orbit-topnav .tn-avatar {
            width: 32px;
            height: 32px;
            border-radius: 50%;
            background: linear-gradient(135deg, #6366f1, #8b5cf6);
            display: flex;
            align-items: center;
            justify-content: center;
            color: #fff;
            font-size: 12px;
            font-weight: 700;
          }
        </style>
        <header class="orbit-topnav">
          <div class="tn-left">
            <div class="tn-breadcrumb">🚀 Workspace OS &nbsp;›&nbsp; <strong>MASTER</strong></div>
          </div>
          <div class="tn-search">🔍 검색 또는 명령어 입력...</div>
          <div class="tn-right">
            <span class="tn-badge">● 실시간</span>
            <button class="tn-btn">초대</button>
            <div class="tn-avatar">K</div>
          </div>
        </header>
      `,
      attributes: { class: 'fa fa-window-maximize' },
    })

    // ── 저장 로직 (Supabase 연동) ──
    editor.on('storage:store', async (data: Record<string, unknown>) => {
      try {
        const { error } = await supabase.from('pages').upsert({
          id: 'default',
          html: editor.getHtml(),
          css: editor.getCss(),
          project_data: JSON.stringify(data),
          updated_at: new Date().toISOString(),
        })
        if (error) throw error;
        console.log('Builder: Project saved to Supabase (Remote Storage Active)')
      } catch (err) {
        console.error('Builder Save Error:', err)
      }
    })

  }, [supabase])

  // ── 데이터 불러오기 ──
  const loadPage = useCallback(async (editor: Editor) => {
    try {
      const { data } = await supabase
        .from('pages')
        .select('project_data')
        .eq('id', 'default')
        .single()

      if (data?.project_data) {
        editor.loadProjectData(JSON.parse(data.project_data))
      } else {
        // 첫 방문 또는 데이터 부재 시 기본 노션 레이아웃 자동 적용
        const block = editor.BlockManager.get('orbit-notion-full-layout');
        if (block) {
          editor.setComponents(block.get('content') || '');
        }
      }
    } catch {
      // First time use or error - auto insert default layout
      const block = editor.BlockManager.get('orbit-notion-full-layout');
      if (block) {
        editor.setComponents(block.get('content') || '');
      }
    }
  }, [supabase])

  return (
    <div className="w-full h-screen bg-white">
      <GjsEditor
        grapesjs={grapesjs}
        grapesjsCss="https://unpkg.com/grapesjs/dist/css/grapes.min.css"
        options={{
          height: '100%',
          storageManager: {
            type: 'remote',
            autosave: true,
            autoload: false,
            stepsBeforeSave: 3,
          },
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
          deviceManager: {
            devices: [
              { name: 'Desktop', width: '' },
              { name: 'Tablet', width: '768px', widthMedia: '992px' },
              { name: 'Mobile', width: '375px', widthMedia: '480px' },
            ],
          },
          i18n: {
            locale: 'ko',
            messages: {
              ko: {
                styleManager: {
                  empty: '요소를 선택하면 스타일을 수정할 수 있습니다',
                  layer: '레이어',
                  fileButton: '이미지',
                  sectors: {
                    general: '일반',
                    layout: '레이아웃',
                    typography: '글꼴',
                    decorations: '꾸미기',
                    extra: '추가',
                    flex: '플렉스',
                    dimension: '크기',
                  },
                  properties: {
                    'font-family': '글꼴',
                    'font-size': '글자 크기',
                    'font-weight': '글자 굵기',
                    'letter-spacing': '자간',
                    'line-height': '줄 높이',
                    'text-align': '정렬',
                    'text-decoration': '밑줄',
                    'color': '글자색',
                    'background-color': '배경색',
                    'background': '배경',
                    'border': '테두리',
                    'border-radius': '모서리 둥글기',
                    'box-shadow': '그림자',
                    'opacity': '투명도',
                    'width': '너비',
                    'height': '높이',
                    'max-width': '최대 너비',
                    'min-height': '최소 높이',
                    'margin': '바깥 여백',
                    'padding': '안쪽 여백',
                    'display': '표시 방식',
                    'position': '위치',
                    'top': '위',
                    'right': '오른쪽',
                    'bottom': '아래',
                    'left': '왼쪽',
                    'overflow': '넘침',
                    'float': '띄우기',
                  },
                },
                traitManager: {
                  empty: '요소를 선택하면 속성을 수정할 수 있습니다',
                  label: '속성',
                  traits: {
                    labels: {
                      id: 'ID',
                      alt: '대체 텍스트',
                      title: '제목',
                      href: '링크 주소',
                      target: '열기 방식',
                    },
                    attributes: {
                      id: '요소 ID',
                      alt: '이미지 설명',
                      title: '툴팁 텍스트',
                      href: 'URL 입력',
                    },
                    options: {
                      target: {
                        false: '현재 창',
                        _blank: '새 창',
                      },
                    },
                  },
                },
                blockManager: {
                  labels: {
                    'column1': '1단',
                    'column2': '2단',
                    'column3': '3단',
                    'column3-7': '3:7 비율',
                    'text': '텍스트',
                    'link': '링크',
                    'image': '이미지',
                    'video': '비디오',
                    'map': '지도',
                    'link-block': '링크 블록',
                    'quote': '인용문',
                    'text-basic': '기본 텍스트',
                    'form': '폼',
                    'input': '입력칸',
                    'textarea': '텍스트 영역',
                    'select': '선택 상자',
                    'button': '버튼',
                    'label': '라벨',
                    'checkbox': '체크박스',
                    'radio': '라디오 버튼',
                    'table': '테이블',
                    'orbit-kpi-card': 'KPI 카드',
                    'orbit-status-board': '상태 보드',
                    'orbit-esc-production': 'ESC 생산현황',
                    'orbit-hero': '히어로 섹션',
                    'orbit-navbar': '네비게이션',
                    'orbit-dashboard-grid': '대시보드 그리드',
                    'orbit-notion-sidebar': '노션 사이드바',
                    'orbit-notion-full-layout': '노션 워크스페이스',
                  },
                  categories: {
                    'Basic': '기본 블록',
                    'Extra': '추가 블록',
                    'Forms': '입력 폼',
                    'Orbit Widgets': '오빗 위젯',
                    'Orbit Layouts': '오빗 레이아웃',
                  },
                },
                deviceManager: {
                  device: '기기',
                  devices: {
                    desktop: '데스크톱',
                    tablet: '태블릿',
                    mobileLandscape: '모바일 가로',
                    mobilePortrait: '모바일 세로',
                  },
                },
                panels: {
                  buttons: {
                    titles: {
                      preview: '미리보기',
                      fullscreen: '전체화면',
                      'sw-visibility': '요소 표시',
                      'export-template': '코드 보기',
                      'open-sm': '스타일',
                      'open-tm': '속성',
                      'open-layers': '레이어',
                      'open-blocks': '블록',
                      'undo': '되돌리기',
                      'redo': '다시하기',
                      'canvas-clear': '전체 삭제',
                      'gjs-open-import-webpage': '가져오기',
                    },
                  },
                },
                selectorManager: {
                  label: '클래스',
                  selected: '선택됨',
                  emptyState: '- 상태 -',
                  states: {
                    hover: '마우스 올림',
                    active: '클릭 중',
                    'nth-of-type(2n)': '짝수 번째',
                  },
                },
                domComponents: {
                  names: {
                    '': '박스',
                    wrapper: '본문',
                    text: '텍스트',
                    comment: '주석',
                    image: '이미지',
                    video: '비디오',
                    label: '라벨',
                    link: '링크',
                    map: '지도',
                    tfoot: '표 하단',
                    tbody: '표 본문',
                    thead: '표 머리',
                    table: '테이블',
                    row: '행',
                    cell: '셀',
                    section: '섹션',
                    body: '본문',
                  },
                },
              },
            },
          },
        }}
        onEditor={(editor) => {
          onEditorReady(editor)
          loadPage(editor)
        }}
      />

      {/* 💾 저장 완료 토스트 UI */}
      {showToast && (
        <div className="fixed bottom-12 left-1/2 -translate-x-1/2 bg-zinc-900/90 backdrop-blur-md border border-zinc-700/50 text-white px-6 py-3 rounded-full shadow-[0_20px_50px_rgba(0,0,0,0.3)] z-[9999] flex items-center gap-3 transition-all duration-300 animate-in fade-in slide-in-from-bottom-4">
          <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-[10px] font-black">
            ✓
          </div>
          <span className="font-bold text-[13px] tracking-tight text-white/90">페이지 저장 완료</span>
        </div>
      )}
    </div>
  )
}
