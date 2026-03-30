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
import React, { useEffect, useRef } from "react";
import { databaseBlockSpec } from "./blocks/DatabaseBlockSpec";
import ChartBlock from "./blocks/ChartBlock";
import KPIDashboardBlock from "./blocks/KPIDashboardBlock";

interface Props {
  pageId: string;
  initialContent?: Block[];
  onChange?: (content: Block[]) => void;
  darkMode?: boolean;
}

/* ── 1. Dashboard Block ── */
const DashboardBlock = createReactBlockSpec(
  {
    type: "dashboard",
    propSchema: { title: { default: "실시간 생산 현황" }, theme: { default: "ocean" } },
    content: "none",
  },
  {
    render: ({ block }) => {
      const data = {
        total: 1250, yield: 98.4, ng: 12,
        processes: [
          { name: "탈지 (Degreasing)", count: 450, color: "#3b82f6" },
          { name: "소성 (Firing)", count: 320, color: "#6366f1" },
          { name: "평탄화 (Flattening)", count: 280, color: "#06b6d4" },
          { name: "도금 (Plating)", count: 180, color: "#14b8a6" },
          { name: "열처리 (Annealing)", count: 20, color: "#10b981" },
        ],
      };
      return (
        <div className="p-8 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white rounded-[2.5rem] border border-white/10 shadow-2xl my-10 font-sans relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 blur-[100px] rounded-full -mr-32 -mt-32" />
          <div className="relative z-10">
            <div className="flex justify-between items-start mb-12">
              <div>
                <h3 className="text-3xl font-black tracking-tight">{block.props.title}</h3>
                <div className="flex items-center gap-2 mt-2">
                  <span className="flex h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                  <p className="text-white/40 text-[10px] font-bold uppercase tracking-widest">Global Live Intelligence</p>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-6 mb-12">
              {[
                { label: "Throughput", value: data.total, sub: "Total Units" },
                { label: "Yield", value: `${data.yield}%`, sub: "Quality Rate" },
                { label: "Critical NG", value: data.ng, sub: "Action Required" },
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
                    <div className="h-full rounded-full transition-all duration-1000 shadow-lg" style={{ width: `${(p.count / 500) * 100}%`, backgroundColor: p.color }} />
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

/* ── 2. Pivot Table Block ── */
const PivotTableBlock = createReactBlockSpec(
  {
    type: "pivotTable",
    propSchema: { title: { default: "Performance Metrics" } },
    content: "none",
  },
  {
    render: ({ block }) => {
      const rows = [
        { model: "WN-240-PRO", wait: 45, prog: 12, done: 380, yield: "98.2%" },
        { model: "WN-250-ULTRA", wait: 12, prog: 5, done: 120, yield: "97.5%" },
        { model: "BL-100-ECO", wait: 5, prog: 2, done: 450, yield: "99.1%" },
      ];
      return (
        <div className="my-8 rounded-3xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 shadow-xl overflow-hidden">
          <div className="px-6 py-4 bg-slate-50 dark:bg-white/5 border-b border-inherit">
            <span className="text-[10px] font-black uppercase tracking-widest opacity-50">{block.props.title}</span>
          </div>
          <table className="w-full text-left">
            <thead>
              <tr className="text-[10px] font-black uppercase text-slate-400 dark:text-white/20 border-b border-inherit">
                <th className="px-6 py-4">Model</th><th className="px-6 py-4 text-center">Wait</th><th className="px-6 py-4 text-center">Prog</th><th className="px-6 py-4 text-center">Done</th><th className="px-6 py-4 text-right">Rate</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {rows.map((r) => (
                <tr key={r.model} className="border-b border-inherit hover:bg-slate-50/50 dark:hover:bg-white/5 transition-colors">
                  <td className="px-6 py-4 font-bold">{r.model}</td><td className="px-6 py-4 text-center opacity-40">{r.wait}</td><td className="px-6 py-4 text-center text-blue-500 font-bold">{r.prog}</td><td className="px-6 py-4 text-center text-emerald-500 font-bold">{r.done}</td><td className="px-6 py-4 text-right font-black tracking-tight">{r.yield}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    },
  }
);

/* ── 3. SN Status Block ── */
const SNStatusBlock = createReactBlockSpec(
  {
    type: "snStatus",
    propSchema: { sn: { default: "WN-24-PRO-L001" }, process: { default: "최종 검사" }, status: { default: "DONE" } },
    content: "none",
  },
  {
    render: ({ block }) => {
      const { sn, process, status } = block.props;
      const color = status === "DONE" ? "#34d399" : status === "PROG" ? "#3b82f6" : status === "SCRAP" ? "#ef4444" : "#64748b";
      return (
        <div style={{ padding: 20, borderRadius: 24, border: `2px solid ${color}30`, display: "flex", alignItems: "center", justifyContent: "space-between", margin: "8px 0", background: `${color}08` }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <span style={{ fontSize: 9, fontWeight: 900, textTransform: "uppercase", opacity: 0.3, letterSpacing: "0.2em" }}>Registration ID</span>
            <span style={{ fontSize: 18, fontFamily: "monospace", fontWeight: 900, letterSpacing: "-0.05em" }}>{sn}</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6 }}>
            <span style={{ fontSize: 9, fontWeight: 900, textTransform: "uppercase", opacity: 0.3, letterSpacing: "0.2em" }}>{process}</span>
            <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "4px 14px", borderRadius: 999, border: `1px solid ${color}40`, background: `${color}15` }}>
              <span style={{ width: 7, height: 7, borderRadius: "50%", background: color }} />
              <span style={{ fontSize: 10, fontWeight: 900, fontFamily: "monospace" }}>{status}</span>
            </div>
          </div>
        </div>
      );
    },
  }
);

/* ── 4. Chart Block Spec ── */
const ChartBlockSpec = (createReactBlockSpec as any)(
  { type: "chart" as const, propSchema: { pageId: { default: "" } }, content: "none" as const },
  { render: (props: any) => React.createElement(ChartBlock, { blockId: props.block.id, pageId: props.block.props.pageId }) }
);

/* ── 5. KPI Dashboard Block Spec ── */
const KPIDashboardBlockSpec = (createReactBlockSpec as any)(
  { type: "kpiDashboard" as const, propSchema: { pageId: { default: "" } }, content: "none" as const },
  { render: (props: any) => React.createElement(KPIDashboardBlock, { blockId: props.block.id, pageId: props.block.props.pageId }) }
);

/* ── Block Registry ── */
const customBlockSpecs = {
  ...defaultBlockSpecs,
  snStatus: SNStatusBlock,
  dashboard: DashboardBlock,
  pivotTable: PivotTableBlock,
  database: databaseBlockSpec,
  chart: ChartBlockSpec,
  kpiDashboard: KPIDashboardBlockSpec,
};

/* ── Editor Component ── */
export default function Editor({ pageId, initialContent, onChange, darkMode = false }: Props) {
  const editor = useCreateBlockNote({
    initialContent: Array.isArray(initialContent) ? initialContent : undefined,
    blockSpecs: customBlockSpecs,
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
                  aliases: ["db", "table", "kanban", "calendar", "데이터베이스"],
                  group: "Collections",
                  icon: <span className="text-xl">▤</span>,
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
                  aliases: ["kpi", "metrics", "대시보드", "현황판"],
                  group: "Visualization",
                  icon: <span className="text-lg">🎯</span>,
                },
                {
                  title: "Dashboard",
                  onItemClick: () => editor.insertBlocks([{ type: "dashboard" }] as any, editor.getTextCursorPosition().block, "after"),
                  aliases: ["production", "stats", "생산현황"],
                  group: "Manufacturing",
                  icon: <span className="text-lg">🚀</span>,
                },
                {
                  title: "Pivot Table",
                  onItemClick: () => editor.insertBlocks([{ type: "pivotTable" }] as any, editor.getTextCursorPosition().block, "after"),
                  aliases: ["pivot", "report", "피벗"],
                  group: "Manufacturing",
                  icon: <span className="text-lg">📊</span>,
                },
                {
                  title: "SN Status",
                  onItemClick: () => editor.insertBlocks([{ type: "snStatus" }] as any, editor.getTextCursorPosition().block, "after"),
                  aliases: ["sn", "tracking", "추적"],
                  group: "Manufacturing",
                  icon: <span className="text-lg">🏷️</span>,
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
