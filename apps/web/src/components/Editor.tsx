"use client";
import "@blocknote/core/fonts/inter.css";
import { BlockNoteSchema, defaultBlockSpecs } from "@blocknote/core";
import { useCreateBlockNote, SuggestionMenuController, getDefaultReactSlashMenuItems } from "@blocknote/react";
import { BlockNoteView } from "@blocknote/mantine";
import "@blocknote/mantine/style.css";
import {
  createTwoColumns,
  createThreeColumns,
  createFourColumns,
  createDivider,
  createSpacer,
} from "./blocks/ColumnsBlock";
import { layoutSlashMenuItems } from "./blocks/slashMenuItems";

const schema = BlockNoteSchema.create({
  blockSpecs: {
    ...defaultBlockSpecs,
    // 0.47.3 버전에서 createReactBlockSpec은 함수가 아닌 BlockSpec 객체를 반환하므로 호출() 없이 할당합니다.
    twoColumns: createTwoColumns,
    threeColumns: createThreeColumns,
    fourColumns: createFourColumns,
    divider: createDivider,
    spacer: createSpacer,
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
              (item.aliases?.some((a) =>
                a.toLowerCase().includes(query.toLowerCase())
              ) ?? false)
          );
        }}
      />
    </BlockNoteView>
  );
}
