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
        }}
        onEditor={(editor) => {
          onEditorReady(editor)
          loadPage(editor)
        }}
      />
    </div>
  )
}
