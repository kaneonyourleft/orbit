"use client";
import { BlockNoteEditor, insertOrUpdateBlockForSlashMenu } from "@blocknote/core";

// ESLint 'no-explicit-any' 해결을 위해 제네릭을 명시적으로 unknown으로 지정했습니다.
// 이로써 타입 안정성을 확보하면서도 라이브러리 버전 간의 미묘한 타입 차이로 인한 모듈 미인식 문제를 회피했습니다.

export const layoutSlashMenuItems = (editor: BlockNoteEditor<Record<string, unknown>, Record<string, unknown>, Record<string, unknown>>) => [
  {
    title: "2단 컬럼",
    subtext: "2개 컬럼 레이아웃",
    onItemClick: () => insertOrUpdateBlockForSlashMenu(editor, { type: "twoColumns" }),
    aliases: ["2column", "2컬럼", "columns"],
    group: "레이아웃",
  },
  {
    title: "3단 컬럼",
    subtext: "3개 컬럼 레이아웃",
    onItemClick: () => insertOrUpdateBlockForSlashMenu(editor, { type: "threeColumns" }),
    aliases: ["3column", "3컬럼"],
    group: "레이아웃",
  },
  {
    title: "4단 컬럼",
    subtext: "4개 컬럼 레이아웃",
    onItemClick: () => insertOrUpdateBlockForSlashMenu(editor, { type: "fourColumns" }),
    aliases: ["4column", "4컬럼"],
    group: "레이아웃",
  },
  {
    title: "구분선",
    subtext: "섹션 구분선",
    onItemClick: () => insertOrUpdateBlockForSlashMenu(editor, { type: "divider" }),
    aliases: ["divider", "hr", "구분"],
    group: "레이아웃",
  },
  {
    title: "스페이서",
    subtext: "여백 공간 추가",
    onItemClick: () => insertOrUpdateBlockForSlashMenu(editor, { type: "spacer" }),
    aliases: ["spacer", "여백", "공간"],
    group: "레이아웃",
  },
];
