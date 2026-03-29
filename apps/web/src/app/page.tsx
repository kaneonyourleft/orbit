"use client";
import { DynamicEditor } from "../components/DynamicEditor";

export default function Home() {
  return (
    <div className="orbit-home-layout">
      <div className="orbit-main-sidebar">
        <div className="orbit-brand-large">
          ORBIT
        </div>
        <div className="orbit-sidebar-footer-text">
          Phase 1 - Block Editor
        </div>
      </div>
      <div className="orbit-editor-viewport">
        <div className="orbit-editor-wrapper">
          <DynamicEditor />
        </div>
      </div>
    </div>
  );
}
