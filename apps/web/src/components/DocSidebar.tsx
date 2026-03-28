'use client';

import { useEffect, useState } from 'react';
import { Doc } from '@blocksuite/store';
import { useEditor } from '../editor/context';

const DocSidebar = () => {
  const { collection, editor } = useEditor()!;
  const [docs, setDocs] = useState<Doc[]>([]);

  useEffect(() => {
    if (!collection || !editor) return;
    const updateDocs = () => {
      const docs = [...collection.docs.values()].map(blocks => blocks.getDoc());
      setDocs(docs);
    };
    updateDocs();
    const disposable = [
      collection.slots.docUpdated.on(updateDocs),
      editor.slots.docLinkClicked.on(updateDocs),
    ];
    return () => disposable.forEach(d => d.dispose());
  }, [collection, editor]);

  const createNewDoc = () => {
    const newDoc = collection.createDoc();
    newDoc.load(() => {
      const pageBlockId = newDoc.addBlock('affine:page', {});
      newDoc.addBlock('affine:surface', {}, pageBlockId);
      const noteId = newDoc.addBlock('affine:note', {}, pageBlockId);
      newDoc.addBlock('affine:paragraph', {}, noteId);
    });
    editor.doc = newDoc;
    const allDocs = [...collection.docs.values()].map(blocks => blocks.getDoc());
    setDocs(allDocs);
  };

  return (
    <div style={{
      width: 260, minHeight: '100vh', background: 'linear-gradient(180deg, #0f172a, #1e293b)',
      color: '#e2e8f0', padding: '16px 12px', display: 'flex', flexDirection: 'column', gap: 8
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 4px', marginBottom: 8 }}>
        <div style={{
          width: 32, height: 32, borderRadius: 8, background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 16, color: '#fff'
        }}>O</div>
        <div>
          <div style={{ fontWeight: 700, fontSize: 15 }}>ORBIT</div>
          <div style={{ fontSize: 10, color: '#94a3b8' }}>WORKSPACE OS</div>
        </div>
      </div>

      <button onClick={createNewDoc} style={{
        background: 'rgba(59,130,246,0.15)', border: '1px solid rgba(59,130,246,0.3)',
        color: '#60a5fa', borderRadius: 8, padding: '8px 12px', cursor: 'pointer',
        fontSize: 13, fontWeight: 600, marginBottom: 8
      }}>+ 새 문서</button>

      <div style={{ fontSize: 10, color: '#64748b', textTransform: 'uppercase', padding: '4px 8px', letterSpacing: 1 }}>문서 목록</div>

      {docs.map(doc => (
        <div key={doc.id} onClick={() => { editor.doc = doc; setDocs([...docs]); }}
          style={{
            padding: '8px 12px', borderRadius: 6, cursor: 'pointer', fontSize: 13,
            background: editor?.doc === doc ? 'rgba(59,130,246,0.15)' : 'transparent',
            color: editor?.doc === doc ? '#60a5fa' : '#cbd5e1',
            transition: 'all 0.15s ease'
          }}
          onMouseEnter={e => { if (editor?.doc !== doc) (e.target as HTMLElement).style.background = 'rgba(255,255,255,0.06)'; }}
          onMouseLeave={e => { if (editor?.doc !== doc) (e.target as HTMLElement).style.background = 'transparent'; }}
        >
          {doc.meta?.title || '제목 없음'}
        </div>
      ))}

      <div style={{ marginTop: 'auto', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{
          width: 28, height: 28, borderRadius: '50%', background: 'linear-gradient(135deg, #8b5cf6, #3b82f6)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: '#fff'
        }}>K</div>
        <span style={{ fontSize: 12, color: '#94a3b8' }}>Kane</span>
      </div>
    </div>
  );
};

export default DocSidebar;
