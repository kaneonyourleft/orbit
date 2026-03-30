"use client";
import "@blocknote/core/fonts/inter.css";
import "@blocknote/mantine/style.css";
import {
  defaultBlockSpecs,
  filterSuggestionItems,
  Block,
  insertOrUpdateBlock,
} from "@blocknote/core";
import {
  useCreateBlockNote,
  createReactBlockSpec,
  SuggestionMenuController,
  getDefaultReactSlashMenuItems,
} from "@blocknote/react";
import { BlockNoteView } from "@blocknote/mantine";
import React, { useEffect, useRef } from "react";
import DatabaseBlock from "./blocks/DatabaseBlock";
import ChartBlock from "./blocks/ChartBlock";
import KPIDashboardBlock from "./blocks/KPIDashboardBlock";

interface Props {
  pageId: string;
  initialContent?: Block[];
  onChange?: (content: Block[]) => void;
  darkMode?: boolean;
}

/* ── 1. Dashboard Block ── */
const DashboardBlockSpec = createReactBlockSpec(
  {
    type: "dashboard" as const,
    propSchema: {
      title: { default: "실시간 생산 현황" },
    },
    content: "none" as const,
  },
  {
    render: ({ block }) => {
      const data = {
        total: 1250, yield_rate: 98.4, ng: 12,
        processes: [
          { name: "탈지 (Degreasing)", count: 450, color: "#3b82f6" },
          { name: "소성 (Firing)", count: 320, color: "#6366f1" },
          { name: "평탄화 (Flattening)", count: 280, color: "#06b6d4" },
          { name: "도금 (Plating)", count: 180, color: "#14b8a6" },
          { name: "열처리 (Annealing)", count: 20, color: "#10b981" },
        ],
      };
      return (
        <div style={{ padding: 32, background: "linear-gradient(135deg, #0f172a, #1e293b)", color: "#fff", borderRadius: 24, border: "1px solid rgba(255,255,255,0.1)", margin: "16px 0", position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", top: 0, right: 0, width: 200, height: 200, background: "rgba(59,130,246,0.08)", filter: "blur(80px)", borderRadius: "50%" }} />
          <div style={{ position: "relative", zIndex: 1 }}>
            <h3 style={{ fontSize: 24, fontWeight: 900, marginBottom: 4 }}>{block.props.title}</h3>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 24 }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#34d399" }} />
              <span style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: 2 }}>Live</span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16, marginBottom: 24 }}>
              {[
                { label: "Throughput", value: data.total, sub: "Total Units" },
                { label: "Yield", value: `${data.yield_rate}%`, sub: "Quality Rate" },
                { label: "Critical NG", value: data.ng, sub: "Action Required" },
              ].map((s, i) => (
                <div key={i} style={{ padding: 16, background: "rgba(255,255,255,0.04)", borderRadius: 16, border: "1px solid rgba(255,255,255,0.05)" }}>
                  <div style={{ fontSize: 9, fontWeight: 800, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>{s.label}</div>
                  <div style={{ fontSize: 28, fontWeight: 900 }}>{s.value}</div>
                  <div style={{ fontSize: 9, color: "rgba(255,255,255,0.15)", marginTop: 2 }}>{s.sub}</div>
                </div>
              ))}
            </div>
            <div style={{ padding: 24, background: "rgba(0,0,0,0.2)", borderRadius: 20, border: "1px solid rgba(255,255,255,0.04)" }}>
              {data.processes.map((p) => (
                <div key={p.name} style={{ marginBottom: 12 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, fontWeight: 600, marginBottom: 4 }}>
                    <span style={{ color: "rgba(255,255,255,0.6)" }}>{p.name}</span>
                    <span style={{ color: "rgba(255,255,255,0.25)" }}>{p.count} EA</span>
                  </div>
                  <div style={{ height: 6, background: "rgba(255,255,255,0.04)", borderRadius: 3, overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${(p.count / 500) * 100}%`, background: p.color, borderRadius: 3, transition: "width 1s" }} />
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
const PivotTableBlockSpec = createReactBlockSpec(
  {
    type: "pivotTable" as const,
    propSchema: { title: { default: "Performance Metrics" } },
    content: "none" as const,
  },
  {
    render: ({ block }) => {
      const rows = [
        { model: "WN-240-PRO", wait: 45, prog: 12, done: 380, yld: "98.2%" },
        { model: "WN-250-ULTRA", wait: 12, prog: 5, done: 120, yld: "97.5%" },
        { model: "BL-100-ECO", wait: 5, prog: 2, done: 450, yld: "99.1%" },
      ];
      return (
        <div style={{ margin: "16px 0", borderRadius: 16, border: "1px solid rgba(255,255,255,0.08)", overflow: "hidden", background: "#0f172a" }}>
          <div style={{ padding: "12px 20px", background: "rgba(255,255,255,0.03)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
            <span style={{ fontSize: 10, fontWeight: 800, textTransform: "uppercase", letterSpacing: 1, opacity: 0.4 }}>{block.props.title}</span>
          </div>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ fontSize: 10, fontWeight: 800, textTransform: "uppercase", color: "rgba(255,255,255,0.2)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                <th style={{ padding: "10px 20px", textAlign: "left" }}>Model</th>
                <th style={{ padding: "10px 20px", textAlign: "center" }}>Wait</th>
                <th style={{ padding: "10px 20px", textAlign: "center" }}>Prog</th>
                <th style={{ padding: "10px 20px", textAlign: "center" }}>Done</th>
                <th style={{ padding: "10px 20px", textAlign: "right" }}>Rate</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.model} style={{ borderBottom: "1px solid rgba(255,255,255,0.03)" }}>
                  <td style={{ padding: "10px 20px", fontWeight: 700 }}>{r.model}</td>
                  <td style={{ padding: "10px 20px", textAlign: "center", opacity: 0.4 }}>{r.wait}</td>
                  <td style={{ padding: "10px 20px", textAlign: "center", color: "#3b82f6", fontWeight: 700 }}>{r.prog}</td>
                  <td style={{ padding: "10px 20px", textAlign: "center", color: "#34d399", fontWeight: 700 }}>{r.done}</td>
                  <td style={{ padding: "10px 20px", textAlign: "right", fontWeight: 900 }}>{r.yld}</td>
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
const SNStatusBlockSpec = createReactBlockSpec(
  {
    type: "snStatus" as const,
    propSchema: { sn: { default: "WN-24-PRO-L001" }, process: { default: "최종 검사" }, status: { default: "DONE" } },
    content: "none" as const,
  },
  {
    render: ({ block }) => {
      const { sn, process, status } = block.props;
      const color = status === "DONE" ? "#34d399" : status === "PROG" ? "#3b82f6" : status === "SCRAP" ? "#ef4444" : "#64748b";
      return (
        <div style={{ padding: 20, borderRadius: 24, border: `2px solid ${color}30`, display: "flex", alignItems: "center", justifyContent: "space-between", margin: "8px 0", background: `${color}08` }}>
          <div>
            <span style={{ fontSize: 9, fontWeight: 900, textTransform: "uppercase", opacity: 0.3, letterSpacing: "0.2em", display: "block" }}>Registration ID</span>
            <span style={{ fontSize: 18, fontFamily: "monospace", fontWeight: 900, letterSpacing: "-0.05em" }}>{sn}</span>
          </div>
          <div style={{ textAlign: "right" }}>
            <span style={{ fontSize: 9, fontWeight: 900, textTransform: "uppercase", opacity: 0.3, letterSpacing: "0.2em", display: "block", marginBottom: 6 }}>{process}</span>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "4px 14px", borderRadius: 999, border: `1px solid ${color}40`, background: `${color}15` }}>
              <span style={{ width: 7, height: 7, borderRadius: "50%", background: color, display: "inline-block" }} />
              <span style={{ fontSize: 10, fontWeight: 900, fontFamily: "monospace" }}>{status}</span>
            </div>
          </div>
        </div>
      );
    },
  }
);

/* ── 4. Database Block ── */
const DatabaseBlockSpec = createReactBlockSpec(
  {
    type: "database" as const,
    propSchema: { databaseId: { default: "" }, pageId: { default: "" } },
    content: "none" as const,
  },
  {
    render: ({ block }) => {
      return React.createElement(DatabaseBlock, {
        blockId: block.id,
        pageId: block.props.pageId,
        existingDbId: block.props.databaseId,
      });
    },
  }
);

/* ── 5. Chart Block ── */
const ChartBlockSpec = createReactBlockSpec(
  {
    type: "chart" as const,
    propSchema: { pageId: { default: "" } },
    content: "none" as const,
  },
  {
    render: ({ block }) => {
      return React.createElement(ChartBlock, {
        blockId: block.id,
        pageId: block.props.pageId,
      });
    },
  }
);

/* ── 6. KPI Dashboard Block ── */
const KPIDashboardBlockSpec = createReactBlockSpec(
  {
    type: "kpiDashboard" as const,
    propSchema: { pageId: { default: "" } },
    content: "none" as const,
  },
  {
    render: ({ block }) => {
      return React.createElement(KPIDashboardBlock, {
        blockId: block.id,
        pageId: block.props.pageId,
      });
    },
  }
);

/* ── Block Registry ── */
const customBlockSpecs = {
  ...defaultBlockSpecs,
  dashboard: DashboardBlockSpec,
  pivotTable: PivotTableBlockSpec,
  snStatus: SNStatusBlockSpec,
  database: DatabaseBlockSpec,
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
                  onItemClick: () => { insertOrUpdateBlock(editor, { type: "database", props: { pageId } } as any); },
                  aliases: ["db", "table", "kanban", "calendar", "데이터베이스"],
                  group: "Collections",
                  icon: <span style={{ fontSize: 18 }}>▤</span>,
                  subtext: "테이블 · 칸반 · 캘린더 뷰",
                },
                {
                  title: "Chart",
                  onItemClick: () => { insertOrUpdateBlock(editor, { type: "chart", props: { pageId } } as any); },
                  aliases: ["chart", "graph", "차트", "시각화"],
                  group: "Visualization",
                  icon: <span style={{ fontSize: 16 }}>📈</span>,
                  subtext: "막대 · 원형 차트",
                },
                {
                  title: "KPI Dashboard",
                  onItemClick: () => { insertOrUpdateBlock(editor, { type: "kpiDashboard", props: { pageId } } as any); },
                  aliases: ["kpi", "metrics", "대시보드", "현황판"],
                  group: "Visualization",
                  icon: <span style={{ fontSize: 16 }}>🎯</span>,
                  subtext: "KPI 카드 모음",
                },
                {
                  title: "Dashboard",
                  onItemClick: () => { insertOrUpdateBlock(editor, { type: "dashboard" } as any); },
                  aliases: ["production", "stats", "생산현황"],
                  group: "Manufacturing",
                  icon: <span style={{ fontSize: 16 }}>🚀</span>,
                  subtext: "생산 현황 대시보드",
                },
                {
                  title: "Pivot Table",
                  onItemClick: () => { insertOrUpdateBlock(editor, { type: "pivotTable" } as any); },
                  aliases: ["pivot", "report", "피벗"],
                  group: "Manufacturing",
                  icon: <span style={{ fontSize: 16 }}>📊</span>,
                  subtext: "성과 테이블",
                },
                {
                  title: "SN Status",
                  onItemClick: () => { insertOrUpdateBlock(editor, { type: "snStatus" } as any); },
                  aliases: ["sn", "tracking", "추적"],
                  group: "Manufacturing",
                  icon: <span style={{ fontSize: 16 }}>🏷️</span>,
                  subtext: "제품 추적 카드",
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
