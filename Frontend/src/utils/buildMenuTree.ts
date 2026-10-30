import type { MenuNode, MenuRow } from "../types/menu";

export const buildMenuTree = (rows: MenuRow[]): MenuNode[] => {
  const nodes = new Map<string, MenuNode>();

  for (const row of rows) {
    if (nodes.has(row.fmenuid)) {
      continue;
    }

    nodes.set(row.fmenuid, { ...row, children: [] });
  }

  const roots: MenuNode[] = [];

  for (const node of nodes.values()) {
    const parentId =
      node.fmenuid.length > 2 ? node.fmenuid.slice(0, -2) : undefined;
    const parent = parentId ? nodes.get(parentId) : undefined;

    if (parent) {
      parent.children.push(node);
    } else {
      roots.push(node);
    }
  }

  const sortNodes = (items: MenuNode[]) => {
    items.sort((a, b) => a.fmenuid.localeCompare(b.fmenuid));
    items.forEach((item) => sortNodes(item.children));
  };

  sortNodes(roots);
  return roots;
};

export const filterMenuTree = (
  nodes: MenuNode[],
  searchText: string,
): MenuNode[] => {
  const query = searchText.trim().toLocaleLowerCase();

  if (!query) {
    return nodes;
  }

  return nodes.reduce<MenuNode[]>((matches, node) => {
    const children = filterMenuTree(node.children, query);
    const matchesText = node.fmenucaption.toLocaleLowerCase().includes(query);

    if (matchesText || children.length > 0) {
      matches.push({ ...node, children });
    }

    return matches;
  }, []);
};

export const collectIds = (nodes: MenuNode[]): string[] =>
  nodes.flatMap((node) => [
    node.fmenuid,
    ...collectIds(node.children),
  ]);

export const findAncestorIds = (
  nodes: MenuNode[],
  predicate: (node: MenuNode) => boolean,
): string[] => {
  const visit = (items: MenuNode[], ancestors: string[]): string[] | null => {
    for (const node of items) {
      if (predicate(node)) {
        return ancestors;
      }

      const found = visit(node.children, [...ancestors, node.fmenuid]);
      if (found) {
        return found;
      }
    }

    return null;
  };

  return visit(nodes, []) ?? [];
};
