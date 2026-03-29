"use client";
import "@blocknote/core/fonts/inter.css";
import "@blocknote/mantine/style.css";
import { BlockNoteSchema, defaultBlockSpecs } from "@blocknote/core";
import { useCreateBlockNote } from "@blocknote/react";
import { BlockNoteView } from "@blocknote/mantine";
import { SuggestionMenuController, getDefaultReactSlashMenuItems } from "@blocknote/react";
import { TwoColumns, ThreeColumns, FourColumns, Divider, Spacer } from "./blocks/ColumnsBlock";
import { ColorPanel, Banner, IconCard, CalloutBlock } from "./blocks/DesignBlocks";
import { layoutSlashMenuItems, designSlashMenuItems } from "./blocks/slashMenuItems";

const schema = BlockNoteSchema.create({
  blockSpecs: {
    ...defaultBlockSpecs,
    twoColumns: TwoColumns(),
    threeColumns: ThreeColumns(),
    fourColumns: FourColumns(),
    divider: Divider(),
    spacer: Spacer(),
    colorPanel: ColorPanel(),
    banner: Banner(),
    iconCard: IconCard(),
    callout: CalloutBlock(),
  },
});

export default function Editor() {
  const editor = useCreateBlockNote({ schema });
  return (
    <BlockNoteView editor={editor} slashMenu={false} theme="light">
      <SuggestionMenuController
        triggerCharacter="/"
        getItems={async (query) => {
          const defaultItems = getDefaultReactSlashMenuItems(editor);
          const layout = layoutSlashMenuItems(editor);
          const design = designSlashMenuItems(editor);
          return [...defaultItems, ...layout, ...design].filter(
            (item) =>
              item.title.toLowerCase().includes(query.toLowerCase()) ||
              (item.aliases?.some((a: string) => a.toLowerCase().includes(query.toLowerCase())) ?? false)
          );
        }}
      />
    </BlockNoteView>
  );
}
