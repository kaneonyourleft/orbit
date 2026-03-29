"use client";
import "@blocknote/core/fonts/inter.css";
import "@blocknote/mantine/style.css";
import { useCreateBlockNote } from "@blocknote/react";
import { BlockNoteView } from "@blocknote/mantine";
import { useEffect, useRef, useState, useMemo } from "react";

interface Props {
  initialContent?: any;
  onChange?: (content: any) => void;
  darkMode?: boolean;
}

export default function Editor({ initialContent, onChange, darkMode = false }: Props) {
  // BlockNote v0.47+ requires initialContent to be an array of blocks.
  // If it's a string (legacy data), we treat it as empty or should convert it.
  const validatedContent = useMemo(() => {
    if (Array.isArray(initialContent) && initialContent.length > 0) {
      return initialContent;
    }
    return undefined;
  }, [initialContent]);

  const editor = useCreateBlockNote({ initialContent: validatedContent });
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
    <div className="fade-in" style={{ maxWidth: "100%", margin: "0", padding: "48px 48px", lineHeight: 1.6 }}>
      <BlockNoteView editor={editor} theme={darkMode ? "dark" : "light"} />
    </div>
  );
}
