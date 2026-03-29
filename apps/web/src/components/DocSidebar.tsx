'use client';
import { useEffect, useState } from 'react';
import { Doc } from '@blocksuite/store';
import { useEditor } from '../editor/context';
import '../styles/orbit.css';

const DocSidebar = () => {
  const context = useEditor();
  const [docs, setDocs] = useState<Doc[]>([]);
  const [activeDocId, setActiveDocId] = useState<string | null>(null);

  useEffect(() => {
    if (!context || !context.collection || !context.editor) return;
    
    const { collection, editor } = context;
    const updateDocs = () => {
      const allDocs = [...collection.docs.values()].map(blocks => blocks.getDoc());
      setDocs(allDocs);
      setActiveDocId(editor.doc?.id || null);
    };

    updateDocs();
    const disposable = [
      collection.slots.docUpdated.on(updateDocs)
    ];
    
    return () => disposable.forEach(d => d.dispose());
  }, [context]);

  if (!context) return null;
  const { collection, setDoc } = context;

  const createNewDoc = () => {
    const newDoc = collection.createDoc();
    newDoc.load(() => {
      const pageBlockId = newDoc.addBlock('affine:page', {});
      newDoc.addBlock('affine:surface', {}, pageBlockId);
      const noteId = newDoc.addBlock('affine:note', {}, pageBlockId);
      newDoc.addBlock('affine:paragraph', {}, noteId);
    });
    setDoc(newDoc);
    setActiveDocId(newDoc.id);
  };

  const handleDocSwitch = (doc: Doc) => {
    setDoc(doc);
    setActiveDocId(doc.id);
  };

  return (
    <div className="orbit-sidebar">
      <div className="orbit-brand">
        <div className="orbit-logo">O</div>
        <div>
          <div className="orbit-brand-name">ORBIT</div>
          <div className="orbit-brand-title">WORKSPACE OS</div>
        </div>
      </div>
      
      <button onClick={createNewDoc} className="orbit-btn-new">
        + 새 문서
      </button>
      
      <div className="orbit-section-header">문서 목록</div>
      
      {docs.map(doc => (
        <div 
          key={doc.id} 
          onClick={() => handleDocSwitch(doc)}
          className={`orbit-doc-item ${activeDocId === doc.id ? 'active' : ''}`}
        >
          {doc.meta?.title || '제목 없음'}
        </div>
      ))}
      
      <div className="orbit-user-footer">
        <div className="orbit-user-avatar">K</div>
        <span className="orbit-user-name">Kane</span>
      </div>
    </div>
  );
};

export default DocSidebar;
