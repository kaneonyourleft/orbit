'use client';
import React, { useState } from 'react';
import type { DBColumn, ColumnType } from './types';

interface Props {
  column?: DBColumn;
  onSave: (column: DBColumn) => void;
  onClose: () => void;
}

const TYPES: { value: ColumnType; label: string; icon: string }[] = [
  { value: 'text', label: '텍스트', icon: 'Aa' },
  { value: 'number', label: '숫자', icon: '#' },
  { value: 'select', label: '선택', icon: '▾' },
  { value: 'multiSelect', label: '다중 선택', icon: '☰' },
  { value: 'date', label: '날짜', icon: '📅' },
  { value: 'checkbox', label: '체크박스', icon: '☑' },
  { value: 'url', label: 'URL', icon: '🔗' },
  { value: 'person', label: '담당자', icon: '👤' },
  { value: 'progress', label: '진행률', icon: '▓' },
];

export default function ColumnEditor({ column, onSave, onClose }: Props) {
  const [name, setName] = useState(column?.name || '');
  const [type, setType] = useState<ColumnType>(column?.type || 'text');
  const [options, setOptions] = useState<string[]>(column?.options || []);
  const [newOption, setNewOption] = useState('');

  const handleSave = () => {
    const id = column?.id || `col_${Date.now()}`;
    onSave({ id, name: name || '새 컬럼', type, width: column?.width || 150, options: ['select', 'multiSelect'].includes(type) ? options : undefined });
    onClose();
  };

  return (
    <div className="absolute top-full left-0 z-[100] w-64 p-4 mt-2 bg-slate-900 rounded-[1.25rem] border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)] fade-in">
      <div className="text-[10px] font-black tracking-widest text-slate-500 uppercase mb-3">Property Settings</div>
      <input 
        value={name} 
        onChange={e => setName(e.target.value)} 
        placeholder="속성 이름"
        className="w-full text-sm px-3 py-2 bg-slate-800 text-white rounded-xl border border-white/5 outline-none mb-4 focus:border-indigo-500/50 transition-all font-bold"
        autoFocus 
      />
      
      <div className="text-[10px] font-black tracking-widest text-slate-500 uppercase mb-2">Data Type</div>
      <div className="grid grid-cols-2 gap-1.5 mb-4">
        {TYPES.map(t => (
          <button key={t.value} onClick={() => setType(t.value)}
            className={`flex items-center gap-2 px-2.5 py-1.5 text-xs rounded-lg border transition-all ${type === t.value ? 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30 font-bold' : 'text-slate-400 border-white/5 hover:bg-white/5'}`}>
            <span className="opacity-50">{t.icon}</span> {t.label}
          </button>
        ))}
      </div>

      {['select', 'multiSelect'].includes(type) && (
        <div className="mb-4">
          <div className="text-[10px] font-black tracking-widest text-slate-500 uppercase mb-2">Options</div>
          <div className="space-y-1 mb-2 max-h-32 overflow-y-auto pr-1">
            {options.map((opt, i) => (
              <div key={i} className="flex gap-2 items-center px-2 py-1 bg-white/5 rounded-md group">
                <span className="text-xs text-slate-300 flex-1">{opt}</span>
                <button onClick={() => setOptions(options.filter((_, idx) => idx !== i))}
                  className="hidden group-hover:block text-rose-500">✕</button>
              </div>
            ))}
          </div>
          <input 
            value={newOption} 
            onChange={e => setNewOption(e.target.value)} 
            placeholder="+ 새 옵션"
            onKeyDown={e => { if (e.key === 'Enter' && newOption.trim()) { setOptions([...options, newOption.trim()]); setNewOption(''); } }}
            className="w-full text-[11px] px-2.5 py-1.5 bg-slate-800 text-slate-300 rounded-lg border border-white/5 outline-none" 
          />
        </div>
      )}

      <div className="flex gap-2 pt-2 border-t border-white/5">
        <button onClick={onClose} className="flex-1 px-3 py-1.5 text-xs text-slate-400 font-bold hover:text-white transition-colors">취소</button>
        <button onClick={handleSave} className="flex-1 px-3 py-1.5 text-xs bg-indigo-500 text-white rounded-xl font-black shadow-lg shadow-indigo-500/20">속성 저장</button>
      </div>
    </div>
  );
}
