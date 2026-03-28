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

  // Use editor state to log readiness or other side effects
  if (editor) {
    // console.log('Orbit Engine: Builder Ready')
  }

  const onEditorReady = useCallback((editor: Editor) => {
    setEditor(editor)

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

    // 7. 애니메이션 사이드바
    editor.BlockManager.add('orbit-sidebar', {
      label: '사이드바',
      category: 'Orbit Layouts',
      content: `
        <style>
          .orbit-sidebar {
            width: 240px;
            height: 100vh;
            background: linear-gradient(180deg, #0f172a 0%, #1e293b 100%);
            color: #fff;
            padding: 0;
            display: flex;
            flex-direction: column;
            font-family: 'Inter', sans-serif;
            transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            overflow: hidden;
            position: relative;
          }
          .orbit-sidebar.collapsed {
            width: 64px;
          }
          .orbit-sidebar .sidebar-header {
            padding: 20px 16px;
            border-bottom: 1px solid rgba(255,255,255,0.08);
            display: flex;
            align-items: center;
            gap: 12px;
          }
          .orbit-sidebar .sidebar-logo {
            width: 36px;
            height: 36px;
            background: linear-gradient(135deg, #3b82f6, #6366f1);
            border-radius: 10px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 18px;
            font-weight: 900;
            flex-shrink: 0;
          }
          .orbit-sidebar .sidebar-title {
            font-size: 14px;
            font-weight: 800;
            letter-spacing: 0.02em;
            white-space: nowrap;
            opacity: 1;
            transition: opacity 0.2s ease;
          }
          .orbit-sidebar .sidebar-subtitle {
            font-size: 10px;
            color: #64748b;
            font-weight: 500;
            white-space: nowrap;
          }
          .orbit-sidebar .sidebar-nav {
            padding: 12px 8px;
            display: flex;
            flex-direction: column;
            gap: 2px;
            flex: 1;
          }
          .orbit-sidebar .nav-section-label {
            font-size: 10px;
            font-weight: 600;
            color: #475569;
            text-transform: uppercase;
            letter-spacing: 0.08em;
            padding: 12px 12px 6px;
            white-space: nowrap;
          }
          .orbit-sidebar .nav-item {
            display: flex;
            align-items: center;
            gap: 10px;
            padding: 9px 12px;
            border-radius: 8px;
            font-size: 13px;
            font-weight: 500;
            color: #94a3b8;
            cursor: pointer;
            transition: all 0.15s ease;
            white-space: nowrap;
            text-decoration: none;
          }
          .orbit-sidebar .nav-item:hover {
            background: rgba(255,255,255,0.06);
            color: #e2e8f0;
          }
          .orbit-sidebar .nav-item.active {
            background: rgba(59,130,246,0.15);
            color: #60a5fa;
          }
          .orbit-sidebar .nav-icon {
            width: 20px;
            height: 20px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 18px;
            flex-shrink: 0;
          }
          .orbit-sidebar .nav-text {
            opacity: 1;
            transition: opacity 0.2s ease;
          }
          .orbit-sidebar .sidebar-footer {
            padding: 12px 8px;
            border-top: 1px solid rgba(255,255,255,0.06);
          }
          .orbit-sidebar .workspace-item {
            display: flex;
            align-items: center;
            gap: 10px;
            padding: 8px 12px;
            border-radius: 8px;
            font-size: 13px;
            color: #cbd5e1;
            cursor: pointer;
            transition: all 0.15s ease;
          }
          .orbit-sidebar .workspace-item:hover {
            background: rgba(255,255,255,0.06);
          }
          .orbit-sidebar .ws-dot {
            width: 8px;
            height: 8px;
            border-radius: 50%;
            flex-shrink: 0;
          }

          @keyframes slideIn {
            from { transform: translateX(-100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
          }
          @keyframes fadeInUp {
            from { transform: translateY(8px); opacity: 0; }
            to { transform: translateY(0); opacity: 1; }
          }
          .orbit-sidebar {
            animation: slideIn 0.4s cubic-bezier(0.16, 1, 0.3, 1);
          }
          .orbit-sidebar .nav-item:nth-child(1) { animation: fadeInUp 0.3s ease 0.1s both; }
          .orbit-sidebar .nav-item:nth-child(2) { animation: fadeInUp 0.3s ease 0.15s both; }
          .orbit-sidebar .nav-item:nth-child(3) { animation: fadeInUp 0.3s ease 0.2s both; }
          .orbit-sidebar .nav-item:nth-child(4) { animation: fadeInUp 0.3s ease 0.25s both; }
          .orbit-sidebar .nav-item:nth-child(5) { animation: fadeInUp 0.3s ease 0.3s both; }
          .orbit-sidebar .workspace-item:nth-child(1) { animation: fadeInUp 0.3s ease 0.35s both; }
          .orbit-sidebar .workspace-item:nth-child(2) { animation: fadeInUp 0.3s ease 0.4s both; }
        </style>
        <aside class="orbit-sidebar">
          <div class="sidebar-header">
            <div class="sidebar-logo">O</div>
            <div>
              <div class="sidebar-title">ORBIT</div>
              <div class="sidebar-subtitle">WORKSPACE OS</div>
            </div>
          </div>

          <nav class="sidebar-nav">
            <a class="nav-item active">
              <span class="nav-icon">🏠</span>
              <span class="nav-text">홈</span>
            </a>
            <a class="nav-item">
              <span class="nav-icon">📋</span>
              <span class="nav-text">내 작업</span>
            </a>
            <a class="nav-item">
              <span class="nav-icon">📥</span>
              <span class="nav-text">알림함</span>
            </a>
            <a class="nav-item">
              <span class="nav-icon">🎨</span>
              <span class="nav-text">페이지 빌더</span>
            </a>

            <div class="nav-section-label">워크스페이스</div>

            <div class="workspace-item">
              <div class="ws-dot" style="background:#3b82f6;"></div>
              <span>생산관리</span>
            </div>
            <div class="workspace-item">
              <div class="ws-dot" style="background:#22c55e;"></div>
              <span>거래처</span>
            </div>
            <div class="workspace-item">
              <div class="ws-dot" style="background:#f59e0b;"></div>
              <span>품질검사</span>
            </div>
          </nav>

          <div class="sidebar-footer">
            <a class="nav-item">
              <span class="nav-icon">⚙️</span>
              <span class="nav-text">설정</span>
            </a>
          </div>
        </aside>
      `,
      attributes: { class: 'fa fa-bars' },
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
      }
    } catch {
      // First time use - start with empty canvas
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
    </div>
  )
}
