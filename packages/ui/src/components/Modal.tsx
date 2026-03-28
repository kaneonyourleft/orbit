"use client";
import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

/**
 * Universal Modal component using React Portal to ensure correct stacking and positioning.
 * Renders into document.body to avoid parent container constraints (overflow, transfroms).
 */
export function Modal({ isOpen, onClose, title, children }: ModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen || !mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-zinc-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="fixed inset-0" 
        onClick={onClose} 
      />
      <div className="relative bg-white border border-zinc-200 rounded-3xl w-full max-w-md shadow-[0_32px_64px_-12px_rgba(0,0,0,0.14)] overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between px-8 py-6 border-b border-zinc-100 bg-zinc-50/50">
          <h3 className="text-lg font-black text-zinc-800 tracking-tight">{title}</h3>
          <button 
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-800 transition-all p-2 hover:bg-zinc-100 rounded-xl"
            title="Close Modal"
            aria-label="Close Modal"
          >
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        </div>
        <div className="p-8">
          {children}
        </div>
      </div>
    </div>,
    document.body
  );
}
