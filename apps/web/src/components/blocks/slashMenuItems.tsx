"use client";
import { insertOrUpdateBlock } from "@blocknote/core";

export const layoutSlashMenuItems = (editor: any) => [
  {
    title: "2단 컬럼",
    subtext: "2개 컬럼 레이아웃",
    onItemClick: () => insertOrUpdateBlock(editor, { type: "twoColumns" as any }),
    aliases: ["2column", "2컬럼", "columns"],
    group: "레이아웃",
  },
  {
    title: "3단 컬럼",
    subtext: "3개 컬럼 레이아웃",
    onItemClick: () => insertOrUpdateBlock(editor, { type: "threeColumns" as any }),
    aliases: ["3column", "3컬럼"],
    group: "레이아웃",
  },
  {
    title: "4단 컬럼",
    subtext: "4개 컬럼 레이아웃",
    onItemClick: () => insertOrUpdateBlock(editor, { type: "fourColumns" as any }),
    aliases: ["4column", "4컬럼"],
    group: "레이아웃",
  },
  {
    title: "구분선",
    subtext: "섹션 구분선",
    onItemClick: () => insertOrUpdateBlock(editor, { type: "divider" as any }),
    aliases: ["divider", "hr", "구분"],
    group: "레이아웃",
  },
  {
    title: "스페이서",
    subtext: "여백 공간 추가",
    onItemClick: () => insertOrUpdateBlock(editor, { type: "spacer" as any }),
    aliases: ["spacer", "여백", "공간"],
    group: "레이아웃",
  },
];
