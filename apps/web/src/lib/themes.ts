/* ── ORBIT Theme System ── */

export interface ThemeConfig {
  n: string;
  bg: string;
  sb: string;
  rb: string;
  tx: string;
  tx2: string;
  ac: string;
  bd: string;
  hv: string;
  card: string;
  [key: string]: string;
}

export const THEMES: Record<string, ThemeConfig> = {
  obsidian: { n: "Obsidian", bg: "#0f0f12", sb: "#16161a", rb: "#1a1a20", tx: "#ececf1", tx2: "#9ca3af", ac: "#8b5cf6", bd: "#26262b", hv: "#232329", card: "#1e1e24" },
  nord: { n: "Nordic", bg: "#2e3440", sb: "#3b4252", rb: "#2e3440", tx: "#d8dee9", tx2: "#a3be8c", ac: "#88c0d0", bd: "#434c5e", hv: "#4c566a", card: "#3b4252" },
  dracula: { n: "Dracula", bg: "#282a36", sb: "#21222c", rb: "#191a21", tx: "#f8f8f2", tx2: "#6272a4", ac: "#bd93f9", bd: "#44475a", hv: "#44475a", card: "#21222c" },
  forest: { n: "Forest", bg: "#1a1d1a", sb: "#242924", rb: "#1a1d1a", tx: "#e0e7e0", tx2: "#889b88", ac: "#4ade80", bd: "#2d352d", hv: "#384138", card: "#242924" },
  ocean: { n: "Ocean", bg: "#0f172a", sb: "#1e293b", rb: "#0f172a", tx: "#f8fafc", tx2: "#64748b", ac: "#38bdf8", bd: "#334155", hv: "#1e293b", card: "#1e293b" },
  light: { n: "Snow", bg: "#ffffff", sb: "#f9fafb", rb: "#ffffff", tx: "#111827", tx2: "#6b7280", ac: "#6366f1", bd: "#e5e7eb", hv: "#f3f4f6", card: "#ffffff" }
};

export const PALETTE_PRESETS = [
  { name: "Neon Violet", colors: { bg: "#09090b", sb: "#101014", rb: "#09090b", tx: "#fafafa", tx2: "#a1a1aa", ac: "#d946ef", bd: "#27272a", hv: "#18181b", card: "#09090b" } },
  { name: "Cyberpunk", colors: { bg: "#0d0221", sb: "#0f084b", rb: "#0d0221", tx: "#ffffff", tx2: "#2de1fc", ac: "#ff0054", bd: "#261447", hv: "#1c0b3d", card: "#0d0221" } },
  { name: "Desert Dusk", colors: { bg: "#1c1917", sb: "#292524", rb: "#1c1917", tx: "#fafaf9", tx2: "#a8a29e", ac: "#f97316", bd: "#44403c", hv: "#292524", card: "#1c1917" } },
  { name: "Midnight Rose", colors: { bg: "#0f172a", sb: "#1e1b4b", rb: "#0f172a", tx: "#f1f5f9", tx2: "#94a3b8", ac: "#fb7185", bd: "#312e81", hv: "#1e1b4b", card: "#0f172a" } }
];
