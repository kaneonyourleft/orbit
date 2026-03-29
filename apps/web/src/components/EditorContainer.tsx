'use client';
import { useEffect, useRef } from 'react';
import { useEditor } from '../editor/context';
import '../styles/orbit.css';

const EditorContainer = () => {
  const context = useEditor();
  const editorContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (context && editorContainerRef.current && context.editor) {
      editorContainerRef.current.innerHTML = '';
      editorContainerRef.current.appendChild(context.editor);
    }
  }, [context]);

  if (!context) return null;

  return <div ref={editorContainerRef} className="orbit-editor-container" />;
};

export default EditorContainer;
