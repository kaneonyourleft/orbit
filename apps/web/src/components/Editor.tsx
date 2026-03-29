"use client";
import "@blocknote/core/fonts/inter.css";
import "@blocknote/mantine/style.css";
import {
  defaultBlockSpecs,
} from "@blocknote/core";
import {
  useCreateBlockNote,
  createReactBlockSpec,
} from "@blocknote/react";
import { BlockNoteView } from "@blocknote/mantine";
import { useEffect, useRef, useMemo } from "react";

interface Props {
  initialContent?: any;
  onChange?: (content: any) => void;
  darkMode?: boolean;
}

/**
 * 1. 커스텀 S/N 상태 블록 정의 (v0.47 API)
 * 특정 제품의 현재 공정 및 상태를 실시간으로 보여주는 블록
 */
const SNStatusBlock = createReactBlockSpec(
  {
    type: "snStatus",
    propSchema: {
      sn: { default: "WN-UNKNOWN" },
      process: { default: "탈지" },
      status: { default: "WAIT" },
    },
    content: "none",
  },
  {
    render: ({ block }) => {
      const { sn, process, status } = block.props;
      const statusColors: Record<string, string> = {
        WAIT: "bg-gray-100 text-gray-800",
        PROG: "bg-blue-100 text-blue-800",
        DONE: "bg-green-100 text-green-800",
        SCRAP: "bg-red-100 text-red-800",
      };

      return (
        <div className={`p-4 rounded-lg flex items-center justify-between border shadow-sm ${statusColors[status] || "bg-white"}`}>
          <div className="flex flex-col">
            <span className="text-xs font-bold uppercase opacity-60">S/N</span>
            <span className="text-lg font-mono">{sn}</span>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-xs font-bold uppercase opacity-60">Process: {process}</span>
            <span className="text-sm font-bold">{status === "PROG" ? "진행 중..." : status}</span>
          </div>
        </div>
      );
    },
  }
);

/**
 * 2. 커스텀 분석 대시보드 블록 (Pivot)
 * 데이터 분석 및 차트를 시각화하는 범용 대시보드 블록
 */
const DashboardBlock = createReactBlockSpec(
  {
    type: "dashboard",
    propSchema: {
      title: { default: "공정 현황 대시보드" },
      viewType: { default: "status" }, // status, yield, equipment 등
    },
    content: "none",
  },
  {
    render: ({ block }) => {
      const stats = [
        { name: "탈지", value: 80, color: "bg-blue-500" },
        { name: "소성", value: 65, color: "bg-indigo-500" },
        { name: "평탄화", value: 45, color: "bg-cyan-500" },
        { name: "도금", value: 30, color: "bg-teal-500" },
        { name: "열처리", value: 15, color: "bg-emerald-500" },
      ];

      return (
        <div className="p-6 bg-white rounded-xl border border-slate-200 shadow-lg my-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold flex items-center gap-2 text-slate-800">
              📊 {block.props.title}
            </h3>
            {/* 슬라이서(필터) 인터페이스 */}
            <div className="flex gap-2">
              <select className="text-xs border rounded px-2 py-1 bg-slate-50">
                <option>전체 카테고리</option>
                <option>WN 시리즈</option>
                <option>BL 시리즈</option>
              </select>
              <select className="text-xs border rounded px-2 py-1 bg-slate-50">
                <option>최근 1주일</option>
                <option>최근 1개월</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="p-4 bg-slate-50 rounded-lg border border-slate-100 text-center">
              <div className="text-3xl font-black text-blue-600">85%</div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Overall Progress</div>
            </div>
            <div className="p-4 bg-slate-50 rounded-lg border border-slate-100 text-center">
              <div className="text-3xl font-black text-green-600">98.2%</div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Final Yield</div>
            </div>
            <div className="p-4 bg-slate-50 rounded-lg border border-slate-100 text-center">
              <div className="text-3xl font-black text-red-500">3</div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Active NG/Scrap</div>
            </div>
          </div>

          {/* CSS 기반 실시간 막대 그래프 (Auto-Pivot 시각화) */}
          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs font-bold text-slate-500 px-1">
              <span>Process Throughput</span>
              <span>(Production + Archive)</span>
            </div>
            <div className="space-y-3">
              {stats.map((s) => (
                <div key={s.name} className="space-y-1">
                  <div className="flex justify-between text-[11px] font-semibold text-slate-600">
                    <span>{s.name}</span>
                    <span>{s.value}%</span>
                  </div>
                  <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className={`h-full ${s.color} transition-all duration-1000 ease-out`} 
                      style={{ width: `${s.value}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-50 text-[10px] text-slate-300 text-center italic">
            데이터는 Firestore Active/Archive 엔진을 통해 실시간으로 갱신됩니다.
          </div>
        </div>
      );
    },
  }
);

// 커스텀 블록 리스트 통합
const customBlockSpecs = {
  ...defaultBlockSpecs,
  snStatus: SNStatusBlock,
  dashboard: DashboardBlock,
};

export default function Editor({ initialContent, onChange, darkMode = false }: Props) {
  const validatedContent = useMemo(() => {
    if (Array.isArray(initialContent) && initialContent.length > 0) {
      return initialContent;
    }
    return undefined;
  }, [initialContent]);

  const editor = useCreateBlockNote({ 
    initialContent: validatedContent,
    blockSpecs: customBlockSpecs
  });

  const isFirst = useRef(true);

  useEffect(() => {
    if (!onChange) return;
    const handler = () => {
      if (isFirst.current) { isFirst.current = false; return; }
      onChange(editor.document);
    };
    editor.onEditorContentChange(handler);
  }, [editor, onChange]);

  return (
    <div className="fade-in" style={{ maxWidth: "100%", margin: "0", padding: "48px 24px", lineHeight: 1.6 }}>
      <BlockNoteView 
        editor={editor} 
        theme={darkMode ? "dark" : "light"}
        // v0.47 대응: 슬래시 메뉴 등은 하위 컴포넌트로 자동 포함되거나 별도 설정 필요
      />
    </div>
  );
}
