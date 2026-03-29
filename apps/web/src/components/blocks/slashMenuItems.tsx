"use client";
import { insertOrUpdateBlockForSlashMenu } from "@blocknote/core";

export const layoutSlashMenuItems = (editor: any) => [
  { title: "2단 컬럼", subtext: "2개 컬럼 레이아웃", onItemClick: () => insertOrUpdateBlockForSlashMenu(editor, { type: "twoColumns" as any }), aliases: ["2column", "2컬럼", "columns"], group: "레이아웃" },
  { title: "3단 컬럼", subtext: "3개 컬럼 레이아웃", onItemClick: () => insertOrUpdateBlockForSlashMenu(editor, { type: "threeColumns" as any }), aliases: ["3column", "3컬럼"], group: "레이아웃" },
  { title: "4단 컬럼", subtext: "4개 컬럼 레이아웃", onItemClick: () => insertOrUpdateBlockForSlashMenu(editor, { type: "fourColumns" as any }), aliases: ["4column", "4컬럼"], group: "레이아웃" },
  { title: "구분선", subtext: "섹션 구분선", onItemClick: () => insertOrUpdateBlockForSlashMenu(editor, { type: "divider" as any }), aliases: ["divider", "hr", "구분"], group: "레이아웃" },
  { title: "스페이서", subtext: "여백 공간 추가", onItemClick: () => insertOrUpdateBlockForSlashMenu(editor, { type: "spacer" as any }), aliases: ["spacer", "여백", "공간"], group: "레이아웃" },
];

export const designSlashMenuItems = (editor: any) => [
  { title: "컬러 패널", subtext: "배경색이 있는 텍스트 패널", onItemClick: () => insertOrUpdateBlockForSlashMenu(editor, { type: "colorPanel" as any }), aliases: ["color", "컬러", "패널"], group: "디자인" },
  { title: "배너", subtext: "그라데이션 배너", onItemClick: () => insertOrUpdateBlockForSlashMenu(editor, { type: "banner" as any }), aliases: ["banner", "배너", "hero"], group: "디자인" },
  { title: "아이콘 카드", subtext: "아이콘이 있는 카드", onItemClick: () => insertOrUpdateBlockForSlashMenu(editor, { type: "iconCard" as any }), aliases: ["icon", "card", "아이콘", "카드"], group: "디자인" },
  { title: "콜아웃", subtext: "강조 텍스트 박스", onItemClick: () => insertOrUpdateBlockForSlashMenu(editor, { type: "callout" as any }), aliases: ["callout", "콜아웃", "강조"], group: "디자인" },
];
