"use client";
import { useState, useEffect, useRef } from "react";
import { Icons } from "./Icons";

interface Message {
  role: "user" | "assistant" | "system";
  content: string;
}

interface AIAssistantProps {
  darkMode?: boolean;
  accentColor?: string;
  contextData?: any; // Spreadsheet or Editor data
  onApplyChanges?: (type: "editor" | "spreadsheet", data: any) => void;
}

export default function AIAssistant({ darkMode, accentColor, contextData, onApplyChanges }: AIAssistantProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: "안녕하세요! ORBIT AI 어시스턴트입니다. 현재 워크스페이스의 데이터를 분석하여 보고서를 작성하거나, 일정을 최적화해 드릴 수 있습니다. 무엇을 도와드릴까요?" }
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const ac = accentColor || "#8b5cf6";
  const bg = darkMode ? "rgba(25, 25, 30, 0.85)" : "rgba(255, 255, 255, 0.85)";
  const tx = darkMode ? "#ececf1" : "#111827";
  const bd = darkMode ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.1)";

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleSend = async () => {
    if (!input.trim()) return;
    const userMsg: Message = { role: "user", content: input };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setIsTyping(true);

    // 지능형 맥락 분석 시뮬레이션 (추후 Gemini/OpenAI API 연동 가능)
    setTimeout(() => {
      let response = "";
      const { pageTitle, rows, columns, type } = contextData || {};
      const rowCount = rows?.length || 0;
      
      // 1. 데이터 분석 요청 처리
      if (input.includes("분석") || input.includes("통계") || input.includes("표")) {
        if (type === "spreadsheet" && rowCount > 0) {
          const numericCols = columns?.filter((c: any) => c.type === "number") || [];
          response = `### 📊 데이터 분석 결과\n\n현재 **'${pageTitle}'** 시트의 **${rowCount}개** 데이터를 분석했습니다.\n\n`;
          if (numericCols.length > 0) {
            response += `- **분석 지표**: ${numericCols.map((c: any) => c.name).join(", ")} 항목 추출 완료.\n`;
            response += `- **인사이트**: 데이터의 분포가 안정적이며, 특정 항목에서 유의미한 상관관계가 발견되었습니다.\n\n이 분석 내용을 기반으로 상세 보고서를 작성해 드릴까요?`;
          } else {
            response += `데이터 행은 존재하지만, 수치형 컬럼이 부족하여 정밀 분석에 제한이 있습니다. 텍스트 기반의 요약을 진행해 드릴까요?`;
          }
        } else {
          response = `현재 열려있는 워크스페이스가 '${type}' 모드이네요. ${rowCount > 0 ? "데이터를 읽어오는 중입니다." : "분석할 데이터가 비어 있습니다."} 내용을 추가해 주시면 바로 분석을 시작하겠습니다!`;
        }
      } 
      // 2. 보고서 및 요약 요청 처리
      else if (input.includes("보고서") || input.includes("요약")) {
        response = `### 📝 ORBIT 지능형 요약\n\n**대상:** ${pageTitle || "현재 페이지"}\n\n1. **현황**: 현재 시스템 빌드 및 UI 고도화 단계에 있습니다.\n2. **데이터**: ${rowCount}개의 실시간 데이터 엔티티 확인.\n3. **제안**: 데이터 시각화 라이브러리 연동을 통해 직관성을 높이는 것을 추천합니다.\n\n해당 요약본을 문서 하단에 **'AI 리포트'** 섹션으로 삽입할까요?`;
      } 
      // 3. 할 일 추출 서비스
      else if (input.includes("할일") || input.includes("투두") || input.includes("정리")) {
        response = `### ✅ 할 일 목록 추출\n\n작성하신 문서와 데이터를 바탕으로 다음 할 일을 찾았습니다:\n\n- [ ] 프로젝트 UI 아코디언 컴포넌트 검증\n- [ ] Supabase 실시간 동기화 안정성 테스트\n- [ ] AI 어시스턴트 실제 API 연동 설정\n\n이 항목들을 **사이드바 투두리스트**에 지금 추가할까요?`;
      }
      else {
        response = `반갑습니다! 현재 **'${pageTitle || "ORBIT"}'** 프로젝트의 맥락을 완벽히 파악하고 있습니다. 저에게 다음과 같은 요청을 하실 수 있습니다:\n\n- "이 표 데이터 분석해줘"\n- "지금까지 내용 요약 보고서 써줘"\n- "이 문서에서 할 일들만 뽑아줘"`;
      }
      
      setMessages(prev => [...prev, { role: "assistant", content: response }]);
      setIsTyping(false);
    }, 1200);
  };

  return (
    <>
      {/* AI Floating Toggle */}
      <div 
        onClick={() => setIsOpen(!isOpen)}
        style={{
          position: "fixed",
          right: 24,
          bottom: 24,
          width: 56,
          height: 56,
          borderRadius: "50%",
          background: `linear-gradient(135deg, ${ac}, ${ac}dd)`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: `0 8px 32px ${ac}40`,
          cursor: "pointer",
          zIndex: 1001,
          transition: "transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
          transform: isOpen ? "rotate(90deg) scale(0.9)" : "rotate(0) scale(1)",
        }}
      >
        <span style={{ fontSize: 24 }}>✨</span>
      </div>

      {/* AI Panel */}
      {isOpen && (
        <div style={{
          position: "fixed",
          right: 24,
          bottom: 96,
          width: 380,
          height: "min(600px, 80vh)",
          background: bg,
          backdropFilter: "blur(20px)",
          borderRadius: 24,
          border: `1px solid ${bd}`,
          boxShadow: "0 20px 60px rgba(0,0,0,0.25)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          zIndex: 1000,
          animation: "slideUp 0.4s ease-out"
        }}>
          {/* Header */}
          <div style={{
            padding: "20px 24px",
            borderBottom: `1px solid ${bd}`,
            display: "flex",
            alignItems: "center",
            gap: 12,
            background: `linear-gradient(to right, ${ac}15, transparent)`
          }}>
            <div style={{ width: 36, height: 36, borderRadius: 12, background: ac, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: `0 4px 12px ${ac}30` }}>
              <span style={{ fontSize: 18 }}>✨</span>
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: tx }}>ORBIT AI</h3>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#10b981", animation: "pulse 2s infinite" }} />
                <span style={{ fontSize: 11, color: darkMode ? "#9ca3af" : "#6b7280" }}>현재 맥락 분석 중 (Context Active)</span>
              </div>
            </div>
          </div>

          {/* Messages Area */}
          <div 
            ref={scrollRef}
            style={{ 
              flex: 1, 
              overflowY: "auto", 
              padding: "20px 24px",
              display: "flex",
              flexDirection: "column",
              gap: 16,
              scrollbarWidth: "none"
            }}
          >
            {messages.map((m, i) => (
              <div key={i} style={{
                alignSelf: m.role === "user" ? "flex-end" : "flex-start",
                maxWidth: "85%",
                display: "flex",
                flexDirection: "column",
                gap: 4
              }}>
                <div style={{
                  padding: "12px 16px",
                  borderRadius: m.role === "user" ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
                  background: m.role === "user" ? ac : (darkMode ? "rgba(255,255,255,0.05)" : "#f3f4f6"),
                  color: m.role === "user" ? "#fff" : tx,
                  fontSize: 13,
                  lineHeight: 1.5,
                  boxShadow: m.role === "user" ? `0 4px 12px ${ac}25` : "none"
                }}>
                  {m.content}
                </div>
                {m.role === "assistant" && m.content.includes("삽입할까요?") && (
                  <button 
                    onClick={() => onApplyChanges?.("editor", m.content)}
                    style={{
                      marginTop: 8,
                      padding: "6px 12px",
                      borderRadius: 8,
                      background: `${ac}20`,
                      border: `1px solid ${ac}40`,
                      color: ac,
                      fontSize: 11,
                      fontWeight: 600,
                      cursor: "pointer",
                      alignSelf: "flex-start",
                      transition: "all 0.2s"
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = `${ac}40`}
                    onMouseLeave={e => e.currentTarget.style.background = `${ac}20`}
                  >
                    ✨ 문서에 바로 삽입하기
                  </button>
                )}
                <span style={{ fontSize: 10, color: darkMode ? "#4b5563" : "#9ca3af", alignSelf: m.role === "user" ? "flex-end" : "flex-start" }}>
                  {m.role === "user" ? "You" : "ORBIT AI"}
                </span>
              </div>
            ))}
            {isTyping && (
              <div style={{ display: "flex", gap: 4, padding: "12px 16px", background: darkMode ? "rgba(255,255,255,0.05)" : "#f3f4f6", borderRadius: "16px 16px 16px 4px", width: "fit-content" }}>
                <div className="dot" style={{ width: 4, height: 4, borderRadius: "50%", background: ac, animation: "bounce 1.4s infinite" }} />
                <div className="dot" style={{ width: 4, height: 4, borderRadius: "50%", background: ac, animation: "bounce 1.4s infinite 0.2s" }} />
                <div className="dot" style={{ width: 4, height: 4, borderRadius: "50%", background: ac, animation: "bounce 1.4s infinite 0.4s" }} />
              </div>
            )}
          </div>

          {/* Input Area */}
          <div style={{ padding: "16px 20px", borderTop: `1px solid ${bd}`, marginBottom: 8 }}>
            <div style={{ 
              display: "flex", 
              alignItems: "center", 
              gap: 8, 
              background: darkMode ? "rgba(255,255,255,0.05)" : "#fff",
              borderRadius: 16,
              padding: "6px 6px 6px 14px",
              border: `1px solid ${bd}`
            }}>
              <input 
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleSend()}
                placeholder="AI에게 무엇이든 물어보세요..."
                style={{ 
                  flex: 1, 
                  background: "transparent", 
                  border: "none", 
                  outline: "none", 
                  color: tx, 
                  fontSize: 13,
                  padding: "8px 0"
                }}
              />
              <button 
                onClick={handleSend}
                style={{ 
                  width: 32, 
                  height: 32, 
                  borderRadius: 12, 
                  background: input.trim() ? ac : (darkMode ? "#2d2d39" : "#e5e7eb"),
                  border: "none", 
                  color: "#fff", 
                  cursor: input.trim() ? "pointer" : "default",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transition: "all 0.2s"
                }}
              >
                <span>↑</span>
              </button>
            </div>
            <div style={{ marginTop: 10, display: "flex", gap: 6, flexWrap: "wrap" }}>
              {["📊 데이터 분석", "📝 요약하기", "✅ 할일 생성"].map(tag => (
                <button 
                  key={tag} 
                  onClick={() => setInput(tag.split(" ")[1])}
                  style={{ 
                    padding: "4px 8px", 
                    borderRadius: 8, 
                    border: `1px solid ${bd}`, 
                    background: "transparent", 
                    color: darkMode ? "#9ca3af" : "#6b7280", 
                    fontSize: 10, 
                    cursor: "pointer",
                    transition: "all 0.2s"
                  }}
                  onMouseEnter={e => (e.currentTarget.style.borderColor = ac)}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = bd)}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          <style jsx>{`
            @keyframes slideUp {
              from { opacity: 0; transform: translateY(20px) scale(0.95); }
              to { opacity: 1; transform: translateY(0) scale(1); }
            }
            @keyframes bounce {
              0%, 80%, 100% { transform: scale(0); }
              40% { transform: scale(1.0); }
            }
            @keyframes pulse {
              0% { opacity: 0.4; transform: scale(1); }
              50% { opacity: 1; transform: scale(1.2); }
              100% { opacity: 0.4; transform: scale(1); }
            }
          `}</style>
        </div>
      )}
    </>
  );
}
