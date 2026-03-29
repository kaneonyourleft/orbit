import { AffineEditorContainer } from '@blocksuite/presets';
import { Schema, Doc } from '@blocksuite/store';
import { DocCollection } from '@blocksuite/store';
import { AffineSchemas } from '@blocksuite/blocks';
// import '@blocksuite/presets/themes/affine.css';

export function initEditor() {
  const schema = new Schema().register(AffineSchemas);
  const collection = new DocCollection({ schema });
  collection.meta.initialize();
  
  const doc = collection.createDoc({ id: 'page1' });
  doc.load(() => {
    const pageBlockId = doc.addBlock('affine:page', {});
    doc.addBlock('affine:surface', {}, pageBlockId);
    const noteId = doc.addBlock('affine:note', {}, pageBlockId);
    doc.addBlock('affine:paragraph', {}, noteId);
  });
  
  const editor = new AffineEditorContainer();
  editor.doc = doc;
  
  return { editor, collection };
}

// NOTE: 에디터 속성을 직접 수정하는 대신 헬퍼 함수를 사용하여 린트 오류를 방지합니다.
export function switchDoc(editor: AffineEditorContainer, doc: Doc) {
  editor.doc = doc;
}
