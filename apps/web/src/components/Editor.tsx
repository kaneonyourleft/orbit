"use client";
import "@blocknote/core/fonts/inter.css";
import { BlockNoteSchema, defaultBlockSpecs } from "@blocknote/core";
import { useCreateBlockNote } from "@blocknote/react";
import { BlockNoteView } from "@blocknote/mantine";
import "@blocknote/mantine/style.css";
import {
  TwoColumns,
  ThreeColumns,
  FourColumns,
  Divider,
  Spacer,
} from "./blocks/ColumnsBlock";
import { layoutSlashMenuItems } from "./blocks/slashMenuItems";
import {
  SuggestionMenuController,
  getDefaultReactSlashMenuItems,
} from "@blocknote/react";

const schema = BlockNoteSchema.create({
  blockSpecs: {
    ...defaultBlockSpecs,
    twoColumns: TwoColumns,
    threeColumns: ThreeColumns,
    fourColumns: FourColumns,
    divider: Divider,
    spacer: Spacer,
  },
});

export default function Editor() {
  const editor = useCreateBlockNote({ schema });

  return (
    <BlockNoteView editor={editor} theme="light" slashMenu={false}>
      <SuggestionMenuController
        triggerCharacter="/"
        getItems={async (query) => {
          const defaultItems = getDefaultReactSlashMenuItems(editor);
          const customItems = layoutSlashMenuItems(editor);
          return [...defaultItems, ...customItems].filter(
            (item) =>
              item.title.toLowerCase().includes(query.toLowerCase()) ||
              (item.aliases?.some((a: string) =>
                a.toLowerCase().includes(query.toLowerCase())
              ) ?? false)
          );
        }}
      />
    </BlockNoteView>
  );
}
