'use client';

import React, { useMemo } from 'react';
import { initEditor } from '../editor/editor';
import { EditorContext } from '../editor/context';

export const EditorProvider = ({ children }: { children: React.ReactNode }) => {
  // Use useMemo to ensure initEditor is called only once on client side
  const { editor, collection } = useMemo(() => initEditor(), []);

  return (
    <EditorContext.Provider value={{ editor, collection }}>
      {children}
    </EditorContext.Provider>
  );
};
