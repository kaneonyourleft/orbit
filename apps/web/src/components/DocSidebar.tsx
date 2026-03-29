'use client';
import { useState } from 'react';
import '../styles/orbit.css';

const DocSidebar = () => {
  const [docs] = useState<{ id: string; title: string }[]>([
    { id: '1', title: '시작하기' },
    { id: '2', title: '프로젝트 로드맵' },
  ]);
  const [activeDocId, setActiveDocId] = useState<string | null>('1');

  const createNewDoc = () => {
    console.log('New Document triggered');
    // TODO: BlockNote 연동 및 Supabase 저장 로직 추가 예정
  };

  const handleDocSwitch = (id: string) => {
    setActiveDocId(id);
  };

  return (
    <div className="orbit-sidebar shadow-xl">
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
      
      <div className="orbit-section-header">즐겨찾기</div>
      
      {docs.map(doc => (
        <div 
          key={doc.id} 
          onClick={() => handleDocSwitch(doc.id)}
          className={`orbit-doc-item flex items-center gap-2 ${activeDocId === doc.id ? 'active' : ''}`}
        >
          <span className="text-xs opacity-50">📄</span>
          {doc.title}
        </div>
      ))}
      
      <div className="orbit-user-footer">
        <div className="orbit-user-avatar">K</div>
        <span className="orbit-user-name">Kane Administrator</span>
      </div>
    </div>
  );
};

export default DocSidebar;
