/* ── ORBIT Tree Operations Utility ── */

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

export const uid = () => Math.random().toString(36).slice(2, 10);

export const findNode = (nodes: TreeNode[], id: string): TreeNode | null => {
  for (const n of nodes) {
    if (n.id === id) return n;
    const found = findNode(n.children, id);
    if (found) return found;
  }
  return null;
};

export const findParentId = (nodes: TreeNode[], id: string): string | null => {
  for (const n of nodes) {
    if (n.children.some(c => c.id === id)) return n.id;
    const pid = findParentId(n.children, id);
    if (pid) return pid;
  }
  return null;
};

export const removeLocal = (nodes: TreeNode[], id: string): TreeNode[] => {
  return nodes.filter(n => n.id !== id).map(n => ({ ...n, children: removeLocal(n.children, id) }));
};

export const insertLocal = (nodes: TreeNode[], parentId: string | null, node: TreeNode): TreeNode[] => {
  if (!parentId) return [...nodes, node];
  return nodes.map(n => {
    if (n.id === parentId) return { ...n, children: [...n.children, node] };
    return { ...n, children: insertLocal(n.children, parentId, node) };
  });
};

export const isDesc = (nodes: TreeNode[], srcId: string, targetId: string): boolean => {
  const srcNode = findNode(nodes, srcId);
  if (!srcNode) return false;
  return !!findNode(srcNode.children, targetId);
};

export const collectPages = (nodes: TreeNode[]): TreeNode[] => {
  let res: TreeNode[] = [];
  for (const n of nodes) {
    if (n.id === "__user_settings__") continue;
    if (n.type === "page") res.push(n);
    res = res.concat(collectPages(n.children));
  }
  return res;
};

export const getBreadcrumb = (nodes: TreeNode[], id: string): TreeNode[] => {
  const node = findNode(nodes, id);
  if (!node) return [];
  const pid = findParentId(nodes, id);
  if (!pid) return [node];
  return [...getBreadcrumb(nodes, pid), node];
};
