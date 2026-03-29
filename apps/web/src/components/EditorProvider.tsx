'use client';
import React, { useMemo } from 'react';
import { initEditor, switchDoc } from '../editor/editor';
import { EditorContext } from '../editor/context';
import { Doc } from '@blocksuite/store';

export const EditorProvider = ({ children }: { children: React.ReactNode }) => {
  // 컴포넌트 생명주기 동안 단 한 번만 에디터를 초기화합니다.
  const editorData = useMemo(() => initEditor(), []);
  
  const setDoc = (doc: Doc) => {
    switchDoc(editorData.editor, doc);
  };

  return (
    <EditorContext.Provider value={{ ...editorData, setDoc }}>
      {children}
    </EditorContext.Provider>
  );
};
