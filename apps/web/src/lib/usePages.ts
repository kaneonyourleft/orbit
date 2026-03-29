import { useState, useCallback, useEffect } from "react";
import { createClient } from "./supabase";

export interface TreeNode {
  id: string;
  type: "folder" | "page";
  name: string;
  parent_id: string | null;
  position: number;
  collapsed: boolean;
  content: any;
  children: TreeNode[];
}

const supabase = createClient();

export function usePages() {
  const [loading, setLoading] = useState(true);

  // ── 데이터 로드 & 트리 변환 ──
  const loadTree = useCallback(async (): Promise<TreeNode[]> => {
    setLoading(true);
    const { data: pages, error } = await supabase
      .from("pages")
      .select("*")
      .order("position", { ascending: true });

    if (error) {
      console.error("Error loading pages:", error);
      setLoading(false);
      return [];
    }

    const map: Record<string, TreeNode> = {};
    const rootNodes: TreeNode[] = [];

    pages.forEach((p) => {
      map[p.id] = { ...p, children: [] };
    });

    pages.forEach((p) => {
      if (p.parent_id && map[p.parent_id]) {
        map[p.parent_id].children.push(map[p.id]);
      } else {
        rootNodes.push(map[p.id]);
      }
    });

    setLoading(false);
    return rootNodes;
  }, []);

  // ── 페이지/폴더 저장 ──
  const saveNode = useCallback(async (node: Partial<TreeNode>) => {
    const { children, ...rest } = node as any;
    const { error } = await supabase.from("pages").upsert({
      id: rest.id,
      type: rest.type,
      name: rest.name,
      parent_id: rest.parent_id,
      position: rest.position,
      collapsed: rest.collapsed,
      content: rest.content || [],
      updated_at: new Date().toISOString(),
    });
    if (error) console.error("Error saving node:", error);
  }, []);

  // ── 노드 삭제 ──
  const deleteNode = useCallback(async (id: string) => {
    const { error } = await supabase.from("pages").delete().eq("id", id);
    if (error) console.error("Error deleting node:", error);
  }, []);

  // ── 북마크 관리 ──
  const loadBookmarks = useCallback(async (): Promise<string[]> => {
    const { data, error } = await supabase.from("bookmarks").select("page_id");
    if (error) return [];
    return data.map((b) => b.page_id);
  }, []);

  const syncBookmarks = useCallback(async (bookmarkIds: string[]) => {
    // 단순화를 위해 기존 모두 삭제 후 다시 입력
    await supabase.from("bookmarks").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    if (bookmarkIds.length > 0) {
      const { error } = await supabase.from("bookmarks").insert(
        bookmarkIds.map((id) => ({ page_id: id }))
      );
      if (error) console.error("Error syncing bookmarks:", error);
    }
  }, []);

  return { loading, loadTree, saveNode, deleteNode, loadBookmarks, syncBookmarks };
}
