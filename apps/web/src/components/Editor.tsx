"use client";
import "@blocknote/core/fonts/inter.css";
import "@blocknote/mantine/style.css";
import {
  defaultBlockSpecs,
  filterSuggestionItems,
  Block,
} from "@blocknote/core";
import {
  useCreateBlockNote,
  createReactBlockSpec,
  SuggestionMenuController,
  getDefaultReactSlashMenuItems,
} from "@blocknote/react";
import { BlockNoteView } from "@blocknote/mantine";
import { useEffect, useRef } from "react";
import { databaseBlockSpec } from "./blocks/DatabaseBlockSpec";
import ChartBlock from './blocks/ChartBlock';
import KPIDashboardBlock from './blocks/KPIDashboardBlock';

interface Props {
  pageId: string;
  initialContent?: Block[];
  onChange?: (content: Block[]) => void;
  darkMode?: boolean;
}

/**
 * 1. 실시간 생산 현황 대시보드 블록
 */
const DashboardBlock = createReactBlockSpec(
  {
    type: "dashboard",
    propSchema: {
      title: { default: "실시간 생산 현황" },
      theme: { default: "ocean" },
    },
    content: "none",
  },
  {
    render: ({ block }) => {
      const data = {
        total: 1250,
        yield: 98.4,
        ng: 12,
        processes: [
          { name: "탈지 (Degreasing)", count: 450, color: "#3b82f6" },
          { name: "소성 (Firing)", count: 320, color: "#6366f1" },
          { name: "평탄화 (Flattening)", count: 280, color: "#06b6d4" },
          { name: "도금 (Plating)", count: 180, color: "#14b8a6" },
          { name: "열처리 (Annealing)", count: 20, color: "#10b981" },
        ]
      };

      return (
        <div className="p-8 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white rounded-[2.5rem] border border-white/10 shadow-2xl my-10 font-sans relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 blur-[100px] rounded-full -mr-32 -mt-32"></div>
          
          <div className="relative z-10">
            <div className="flex justify-between items-start mb-12">
              <div>
                <h3 className="text-3xl font-black tracking-tight">{block.props.title}</h3>
                <div className="flex items-center gap-2 mt-2">
                  <span className="flex h-2 w-2 rounded-full bg-green-500 animate-pulse"></span>
                  <p className="text-white/40 text-[10px] font-bold uppercase tracking-widest">Global Live Intelligence</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-6 mb-12">
              {[
                { label: "Throughput", value: data.total, sub: "Total Units" },
                { label: "Yield", value: `${data.yield}%`, sub: "Quality Rate" },
                { label: "Critical NG", value: data.ng, sub: "Action Required" }
              ].map((stat, i) => (
                <div key={i} className="p-6 bg-white/5 rounded-3xl border border-white/5 backdrop-blur-md">
                  <div className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-1">{stat.label}</div>
                  <div className="text-4xl font-black tabular-nums">{stat.value}</div>
                  <div className="text-[9px] font-bold text-white/20 mt-1">{stat.sub}</div>
                </div>
              ))}
            </div>

            <div className="space-y-6 bg-black/20 p-8 rounded-[2rem] border border-white/5">
              {data.processes.map((p) => (
                <div key={p.name}>
                  <div className="flex justify-between text-[11px] font-bold mb-2">
                    <span className="text-white/70">{p.name}</span>
                    <span className="text-white/30">{p.count} EA</span>
                  </div>
                  <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                    <div 
                      className="h-full rounded-full transition-all duration-1000 shadow-lg"
                      style={{ width: `${(p.count/500)*100}%`, backgroundColor: p.color }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      );
    },
  }
);

const customBlockSpecs = {
  ...defaultBlockSpecs,
  snStatus: SNStatusBlock,
  dashboard: DashboardBlock,
  pivotTable: PivotTableBlock,
  database: databaseBlockSpec,
  chart: ChartBlockSpec,
  kpiDashboard: KPIDashboardBlockSpec,
};

export default function Editor({ pageId, initialContent, onChange, darkMode = false }: Props) {
  const editor = useCreateBlockNote({ 
    initialContent: Array.isArray(initialContent) ? initialContent : undefined,
    blockSpecs: customBlockSpecs
  });

  const isFirst = useRef(true);
  useEffect(() => {
    if (!onChange) return;
    return editor.onEditorContentChange(() => {
      if (isFirst.current) { isFirst.current = false; return; }
      onChange(editor.document);
    });
  }, [editor, onChange]);

  return (
    <div className="fade-in editor-container w-full py-8">
      <BlockNoteView editor={editor} theme={darkMode ? "dark" : "light"} slashMenu={false}>
        <SuggestionMenuController
          triggerCharacter={"/"}
          getItems={async (query) =>
            filterSuggestionItems(
              [
                ...getDefaultReactSlashMenuItems(editor),
                {
                  title: "Inline Database",
                  onItemClick: () => editor.insertBlocks([{ type: "database", props: { pageId } }] as any, editor.getTextCursorPosition().block, "after"),
                  aliases: ["db", "table", "kanban", "calendar"],
                  group: "Collections",
                  icon: <span className="text-xl">▤</span>,
                },
                {
                  title: "Dashboard",
                  onItemClick: () => editor.insertBlocks([{ type: "dashboard" }] as any, editor.getTextCursorPosition().block, "after"),
                  aliases: ["chart", "stats"],
                  group: "Manufacturing",
                  icon: <span className="text-lg">🚀</span>,
                },
                {
                  title: "Pivot Table",
                  onItemClick: () => editor.insertBlocks([{ type: "pivotTable" }] as any, editor.getTextCursorPosition().block, "after"),
                  aliases: ["pivot", "report"],
                  group: "Manufacturing",
                  icon: <span className="text-lg">📊</span>,
                },
                {
                  title: "SN Status",
                  onItemClick: () => editor.insertBlocks([{ type: "snStatus" }] as any, editor.getTextCursorPosition().block, "after"),
                  aliases: ["sn", "tracking"],
                  group: "Manufacturing",
                  icon: <span className="text-lg">🏷️</span>,
                },
                {
                  title: "Chart",
                  onItemClick: () => editor.insertBlocks([{ type: "chart", props: { pageId } }] as any, editor.getTextCursorPosition().block, "after"),
                  aliases: ["chart", "graph", "차트", "시각화"],
                  group: "Visualization",
                  icon: <span className="text-lg">📈</span>,
                },
                {
                  title: "KPI Dashboard",
                  onItemClick: () => editor.insertBlocks([{ type: "kpiDashboard", props: { pageId } }] as any, editor.getTextCursorPosition().block, "after"),
                  aliases: ["kpi", "metrics", "대시보드", "현황"],
                  group: "Visualization",
                  icon: <span className="text-lg">🎯</span>,
                },
              ],
              query
            )
          }
        />
      </BlockNoteView>
    </div>
  );
}
