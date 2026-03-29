import { AffineEditorContainer } from '@blocksuite/presets';
import { Doc, DocCollection } from '@blocksuite/store';
import { createContext, useContext } from 'react';

export const EditorContext = createContext<{
  editor: AffineEditorContainer;
  collection: DocCollection;
  setDoc: (doc: Doc) => void;
} | null>(null);

export function useEditor() {
  return useContext(EditorContext);
}
