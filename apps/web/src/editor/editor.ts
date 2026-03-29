import { Doc, Schema, DocCollection } from '@blocksuite/store';
import { AffineSchemas } from '@blocksuite/blocks';

export async function initEditor() {
  // Web Components가 브라우저 컨텍스트에서 안전하게 등록되도록 동적 임포트를 사용합니다.
  const { AffineEditorContainer } = await import('@blocksuite/presets');
  
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
  
  // 문서 링크 클릭 시 처리를 위한 리스너 추가
  editor.slots.docLinkClicked.on(({ docId }: { docId: string }) => {
    const target = collection.getDoc(docId) as Doc;
    if (target) {
      editor.doc = target;
    }
  });
  
  return { editor, collection };
}

// NOTE: 에디터 속성을 직접 수정하는 대신 헬퍼 함수를 사용하여 린트 오류를 방지합니다.
export function switchDoc(editor: any, doc: Doc) {
  editor.doc = doc;
}
