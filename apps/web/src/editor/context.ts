import { Doc, DocCollection } from '@blocksuite/store';
import { createContext, useContext } from 'react';

export const EditorContext = createContext<{
  editor: any; // AffineEditorContainer is dynamically imported in initEditor to avoid SSR issues
  collection: DocCollection;
  setDoc: (doc: Doc) => void;
} | null>(null);

export function useEditor() {
  return useContext(EditorContext);
}
