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

    // AI logic simulation (In actual app, this connects to Gemini/OpenAI API)
    setTimeout(() => {
      let response = "데이터를 분석 중입니다...";
      if (input.includes("표") || input.includes("데이터")) {
        response = "현재 스프레드시트에는 총 " + (contextData?.rows?.length || 0) + "개의 행이 있습니다. 이 중 진행률이 낮은 항목들을 우선순위로 정리해 드릴까요?";
      } else if (input.includes("보고서") || input.includes("요약")) {
        response = `### 📝 워크스페이스 요약 보고서\n\n현재 프로젝트는 **${contextData?.pageTitle || "알 수 없음"}**에 집중하고 있습니다.\n\n- **스프레드시트 데이터**: 총 ${contextData?.rows?.length || 0}개 항목 분석 완료.\n- **주요 사항**: 빌드 안정화 및 UI 개선 진행 중.\n\n이 내용을 현재 문서 하단에 바로 삽입할까요?`;
      } else {
        response = "알겠습니다. 해당 요청을 워크스페이스 맥락에 맞춰 처리하고 있습니다. 추가로 필요한 정보가 있으신가요?";
      }
      setMessages(prev => [...prev, { role: "assistant", content: response }]);
      setIsTyping(false);
    }, 1500);
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
