'use client';
import React, { useEffect, useState } from 'react';
import { EditorContext } from '../editor/context';
import { Doc, DocCollection } from '@blocksuite/store';
import { AffineEditorContainer } from '@blocksuite/presets';

type EditorContextType = {
  editor: AffineEditorContainer;
  collection: DocCollection;
  setDoc: (doc: Doc) => void;
};

export const EditorProvider = ({ children }: { children: React.ReactNode }) => {
  const [ctx, setCtx] = useState<EditorContextType | null>(null);

  useEffect(() => {
    // HTMLElement(AffineEditorContainer)는 브라우저 사이드에서만 안전하게 생성할 수 있으므로,
    // useEffect에서 동적으로 초기화합니다.
    import('../editor/editor').then(({ initEditor, switchDoc }) => {
      const { editor, collection } = initEditor();
      setCtx({ 
        editor, 
        collection,
        setDoc: (doc: Doc) => switchDoc(editor, doc)
      });
    });
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
