import type { MenuNode } from "../types/menu";
import { getMenuRoute } from "../config/menuConfig";

export const isNodeActive = (
  node: MenuNode,
  activePath: string,
): boolean => {
  return (
    getMenuRoute(node) === activePath ||
    node.children.some((child) => isNodeActive(child, activePath))
  );
};
