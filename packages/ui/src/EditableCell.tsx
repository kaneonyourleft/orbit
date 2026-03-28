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
        className={`w-5 h-5 rounded-md border flex items-center justify-center cursor-pointer transition-all duration-200 shadow-sm ${value ? 'bg-primary border-primary shadow-blue-100' : 'border-zinc-300 bg-white hover:border-zinc-400'}`}
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
        className="w-full bg-white border border-primary shadow-sm outline-none px-2 py-1 rounded-md text-sm text-zinc-900 ring-2 ring-blue-50"
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
      className="w-full h-full min-h-[1.5rem] flex items-center group cursor-text transition-colors hover:bg-zinc-50/50 rounded px-1 -ml-1"
    >
      <div className="flex-1 truncate">
         {renderers[type] 
           ? React.createElement(renderers[type], { value, field, onChange: onSave })
           : renderDisplayValue(type, value)
         }
      </div>
      <span className="opacity-0 group-hover:opacity-100 text-[14px] text-zinc-300 material-symbols-outlined ml-1.5 transition-opacity">edit</span>
    </div>
  );
}

function renderDisplayValue(type: string, value: any) {
  if (value === undefined || value === null || value === '') {
    return <span className="text-zinc-300 text-[11px] font-bold tracking-tight select-none">Empty</span>;
  }

  switch (type) {
    case 'select':
      return (
        <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-zinc-100 text-zinc-600 border border-zinc-200 shadow-sm">
          {String(value)}
        </span>
      );
    case 'number':
      return <span className="font-mono text-zinc-800 font-medium tracking-tight bg-zinc-50 px-1.5 py-0.5 rounded border border-zinc-100">{Number(value).toLocaleString()}</span>;
    case 'date':
      return (
        <div className="flex items-center gap-1.5 text-zinc-600 font-medium">
          <span className="material-symbols-outlined text-sm opacity-60">calendar_today</span>
          <span>{String(value)}</span>
        </div>
      );
    default:
      return <span className="text-zinc-800 leading-relaxed">{String(value)}</span>;
  }
}
