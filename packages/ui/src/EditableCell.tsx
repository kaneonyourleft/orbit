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
 * A cell that can be edited in-place.
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
        onClick={() => onSave(!value)}
        className={`w-5 h-5 rounded-md border flex items-center justify-center cursor-pointer transition-all duration-200 ${value ? 'bg-blue-600 border-blue-500 shadow-lg shadow-blue-500/20' : 'border-zinc-700 bg-zinc-800 hover:border-zinc-500'}`}
      >
        {value && <span className="text-[12px] text-white font-bold text-shadow-sm">✓</span>}
      </div>
    );
  }

  if (isEditing) {
    return (
      <input
        ref={inputRef}
        aria-label="Edit cell"
        type={type === 'number' ? 'number' : 'text'}
        className="w-full bg-zinc-800 border border-blue-500 outline-none px-2 py-1 rounded text-sm text-white"
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
      className="w-full h-full min-h-[1.5rem] flex items-center group cursor-text"
    >
      <div className="flex-1 truncate">
         {renderers[type] 
           ? React.createElement(renderers[type], { value, field, onChange: onSave })
           : renderDisplayValue(type, value)
         }
      </div>
      <span className="opacity-0 group-hover:opacity-100 text-[10px] text-zinc-600 ml-2 transition-opacity">✎</span>
    </div>
  );
}

function renderDisplayValue(type: string, value: any) {
  if (value === undefined || value === null || value === '') {
    return <span className="text-zinc-700 italic">Empty</span>;
  }

  switch (type) {
    case 'select':
      return (
        <span className="px-2 py-0.5 rounded-full text-xs bg-blue-500/10 text-blue-400 border border-blue-500/20">
          {String(value)}
        </span>
      );
    case 'number':
      return <span className="font-mono text-zinc-400">{Number(value).toLocaleString()}</span>;
    default:
      return <span className="text-zinc-200">{String(value)}</span>;
  }
}
