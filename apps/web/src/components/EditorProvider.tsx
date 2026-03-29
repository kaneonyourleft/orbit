'use client';
import React, { useEffect, useState } from 'react';
import { EditorContext } from '../editor/context';
import { Doc, DocCollection } from '@blocksuite/store';

type EditorContextType = {
  editor: any; // AffineEditorContainer is dynamically imported in initEditor
  collection: DocCollection;
  setDoc: (doc: Doc) => void;
};

export const EditorProvider = ({ children }: { children: React.ReactNode }) => {
  const [ctx, setCtx] = useState<EditorContextType | null>(null);

  useEffect(() => {
    let cancelled = false;
    
    // HTMLElement(AffineEditorContainer)는 브라우저 사이드에서만 안전하게 생성할 수 있으며,
    // Custom Elements가 등록된 후에 생성자를 호출해야 하므로 비동기 initEditor를 사용합니다.
    import('../editor/editor').then(({ initEditor, switchDoc }) => {
      initEditor().then((result) => {
        if (!cancelled) {
          setCtx({
            ...result,
            setDoc: (doc: Doc) => switchDoc(result.editor, doc)
          });
        }
      });
    });
    
    return () => {
      cancelled = true;
    };
  }, []);

  if (!ctx) return (
    <div className="orbit-loading-screen">
      ORBIT 로딩 중...
    </div>
  );

  return (
    <EditorContext.Provider value={ctx}>
      {children}
    </EditorContext.Provider>
  );
};
