"use client";
import dynamic from "next/dynamic";

const Editor = dynamic(() => import("./Editor"), {
  ssr: false,
  loading: () => (
    <div style={{ padding: 40, color: "#94a3b8", fontFamily: "system-ui" }}>에디터 로딩 중...</div>
  ),
});

interface DynamicEditorProps {
  initialContent?: any[];
  onChange?: (content: any[]) => void;
}

export function DynamicEditor(props: DynamicEditorProps) {
  return <Editor {...props} />;
}
