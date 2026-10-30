import { useMemo } from "react";
import { useMenus } from "./useMenus";
import { buildMenuTree } from "../utils/buildMenuTree";
import { ADMINISTRATION_NODE, TRAVEL_NODE } from "../config/menuConfig";

export function useMenuTree() {
  const { menus, loading, error, refetch } = useMenus();

  const userType = useMemo(() => localStorage.getItem("userType"), []);

  const menuTree = useMemo(() => {
    const tree = [TRAVEL_NODE, ...buildMenuTree(menus)];

    if (userType === "AU") {
      tree.push(ADMINISTRATION_NODE);
    }

    return tree;
  }, [menus, userType]);

  return { menuTree, loading, error, refetch };
}
