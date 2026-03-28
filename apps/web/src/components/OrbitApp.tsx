'use client';

import { EditorProvider } from './EditorProvider';
import DocSidebar from './DocSidebar';
import EditorContainer from './EditorContainer';

export default function OrbitApp() {
  return (
    <EditorProvider>
      <div style={{ display: 'flex', minHeight: '100vh' }}>
        <DocSidebar />
        <EditorContainer />
      </div>
    </EditorProvider>
  );
}
