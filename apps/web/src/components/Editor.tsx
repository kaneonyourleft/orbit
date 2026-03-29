"use client";
import "@blocknote/core/fonts/inter.css";
import "@blocknote/mantine/style.css";
import { useCreateBlockNote } from "@blocknote/react";
import { BlockNoteView } from "@blocknote/mantine";
import { useEffect, useRef, useState } from "react";

interface Props {
  initialContent?: any;
  onChange?: (content: any) => void;
  darkMode?: boolean;
}

export default function Editor({ initialContent, onChange, darkMode = false }: Props) {
  const editor = useCreateBlockNote({ initialContent: initialContent && initialContent.length > 0 ? initialContent : undefined });
  const isFirst = useRef(true);

  useEffect(() => {
    if (!onChange) return;
    const handler = () => {
      if (isFirst.current) { isFirst.current = false; return; }
      onChange(editor.document);
    };
    editor.onEditorContentChange(handler);
  }, [editor, onChange]);

  return (
    <div className="fade-in" style={{ maxWidth: 720, margin: "0 auto", padding: "48px 24px", lineHeight: 1.6 }}>
      <BlockNoteView editor={editor} theme={darkMode ? "dark" : "light"} />
    </div>
  );
}
