"use client";
import "@blocknote/core/fonts/inter.css";
import "@blocknote/mantine/style.css";
import "../styles/blocks.css"; // 커스텀 블록 스타일 임포트
import { BlockNoteSchema, defaultBlockSpecs } from "@blocknote/core";
import { useCreateBlockNote } from "@blocknote/react";
import { BlockNoteView } from "@blocknote/mantine";
import { SuggestionMenuController, getDefaultReactSlashMenuItems } from "@blocknote/react";
import { TwoColumns, ThreeColumns, FourColumns, Divider, Spacer } from "./blocks/ColumnsBlock";
import { ColorPanel, Banner, IconCard, CalloutBlock } from "./blocks/DesignBlocks";
import { KpiCard, StatusBoard, EscProduction, ProgressBar } from "./blocks/WidgetBlocks";
import { layoutSlashMenuItems, designSlashMenuItems, widgetSlashMenuItems } from "./blocks/slashMenuItems";

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
    kpiCard: KpiCard(),
    statusBoard: StatusBoard(),
    escProduction: EscProduction(),
    progressBar: ProgressBar(),
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
          const widgets = widgetSlashMenuItems(editor);
          return [...defaultItems, ...layout, ...design, ...widgets].filter(
            (item) =>
              item.title.toLowerCase().includes(query.toLowerCase()) ||
              (item.aliases?.some((a: string) => a.toLowerCase().includes(query.toLowerCase())) ?? false)
          );
        }}
      />
    </BlockNoteView>
  );
}
