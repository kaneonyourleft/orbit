"use client";
import dynamic from "next/dynamic";

const DynamicEditor = dynamic(
  () => import("./Editor").then((mod) => ({ default: mod.default })),
  { 
    ssr: false,
    loading: () => (
      <div style={{ padding: 40, color: "#94a3b8", fontFamily: "system-ui" }}>
        에디터 로딩 중...
      </div>
    ),
  }
);

export { DynamicEditor };
