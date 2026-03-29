"use client";
import "@blocknote/core/fonts/inter.css";
import "@blocknote/mantine/style.css";
import { useCreateBlockNote } from "@blocknote/react";
import { BlockNoteView } from "@blocknote/mantine";

interface EditorProps {
  initialContent?: any[];
  onChange?: (content: any[]) => void;
}

export default function Editor({ initialContent, onChange }: EditorProps) {
  const editor = useCreateBlockNote({
    initialContent: initialContent && initialContent.length > 0 ? initialContent : undefined,
  });

  return (
    <BlockNoteView
      editor={editor}
      theme="light"
      onChange={() => {
        if (onChange) onChange(editor.document as any);
      }}
    />
  );
}
