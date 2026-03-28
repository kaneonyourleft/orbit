import React, { useState, useEffect, useRef } from 'react';
import { PluginFieldRenderer, OrbitField } from '@orbit/core';

interface EditableCellProps {
  value: any;
  type: string;
  field: OrbitField;
  onSave: (newValue: any) => void;
  renderers?: Record<string, PluginFieldRenderer>;
}

/**
 * A cell that can be edited in-place with a clean white theme.
 */
export function EditableCell({ value, type, field, onSave, renderers = {} }: EditableCellProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [currentValue, setCurrentValue] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setCurrentValue(value);
  }, [value]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isEditing]);

  const handleBlur = () => {
    setIsEditing(false);
    if (currentValue !== value) {
      onSave(currentValue);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      inputRef.current?.blur();
    }
    if (e.key === 'Escape') {
      setCurrentValue(value);
      setIsEditing(false);
    }
  };

  if (type === 'checkbox') {
    return (
      <div 
        onClick={(e) => { e.stopPropagation(); onSave(!value); }}
        className={`w-5 h-5 rounded-md border flex items-center justify-center cursor-pointer transition-all duration-200 shadow-sm ${value ? 'bg-[#0058BE] border-[#0058BE] shadow-blue-100' : 'border-zinc-300 bg-white hover:border-zinc-400'}`}
      >
        {value && <span className="text-[10px] text-white font-black material-symbols-outlined">check</span>}
      </div>
    );
  }

  if (isEditing) {
    return (
      <input
        ref={inputRef}
        aria-label="Edit cell"
        type={type === 'number' ? 'number' : type === 'date' ? 'date' : 'text'}
        className="w-full bg-white border border-[#0058BE] shadow-sm outline-none px-2 py-1 rounded-md text-sm text-zinc-900 ring-2 ring-blue-50"
        value={currentValue ?? ''}
        onChange={(e) => setCurrentValue(type === 'number' ? Number(e.target.value) : e.target.value)}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
      />
    );
  }

  return (
    <div 
      onDoubleClick={() => setIsEditing(true)}
      className="w-full h-full min-h-[1.5rem] flex items-center cursor-text hover:bg-zinc-50/50 rounded px-1 -ml-1 transition-colors group"
    >
      <div className="flex-1 truncate">
         {renderers[type] 
           ? React.createElement(renderers[type], { value, field, onChange: onSave })
           : renderDisplayValue(type, value)
         }
      </div>
    </div>
  );
}

function renderDisplayValue(type: string, value: any) {
  if (value === undefined || value === null || value === '') {
    return <span className="text-zinc-300 text-xs">—</span>;
  }

  switch (type) {
    case 'number':
      return <span className="font-mono text-zinc-800 font-medium tracking-tight bg-zinc-50 px-1.5 py-0.5 rounded border border-zinc-100">{Number(value).toLocaleString()}</span>;
    case 'date':
      return <span className="text-zinc-600 font-medium text-xs">{new Date(value).toLocaleDateString()}</span>;
    default:
      return <span className="text-zinc-800 leading-relaxed">{String(value)}</span>;
  }
}
