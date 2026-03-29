'use client';
import { EditorProvider } from './EditorProvider';
import DocSidebar from './DocSidebar';
import EditorContainer from './EditorContainer';
import '../styles/orbit.css';

export default function OrbitApp() {
  return (
    <EditorProvider>
      <div className="orbit-layout">
        <DocSidebar />
        <EditorContainer />
      </div>
    </EditorProvider>
  );
}
