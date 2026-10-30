import type { Response } from "express";
import pool from "../DB/db";
import type { AuthenticatedRequest } from "../middleware/AuthMiddleware";

type MenuRow = {
  fmenuid: string;
  fmenuname: string;
  fmenucaption: string;
  fmenubuttons: string;
  fuserbuttons?: string;
};

export const getMenus = async (
  req: AuthenticatedRequest,
  res: Response,
): Promise<Response> => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const companyId =
      typeof req.query.companyId === "string" ? req.query.companyId.trim() : "";

    if (!companyId) {
      return res.status(400).json({
        success: false,
        message: "Company ID is required",
      });
    }

    if (req.user.userType === "AU") {
      const menuResult = await pool.query<MenuRow>(
        `
          SELECT fmenuid, fmenuname, fmenucaption, fmenubuttons
          FROM dbo.tblmenu
          ORDER BY fmenuid
        `,
      );

      return res.status(200).json({
        success: true,
        data: menuResult.rows,
      });
    }

    if (req.user.userType !== "RU") {
      return res.status(403).json({
        success: false,
        message: "Invalid user type",
      });
    }

    const permittedResult = await pool.query<MenuRow>(
      `
        SELECT
          menu.fmenuid,
          menu.fmenuname,
          menu.fmenucaption,
          menu.fmenubuttons,
          permission.fuserbuttons
        FROM dbo.tblmenu AS menu
        INNER JOIN dbo.tbluserpermission AS permission
          ON menu.fmenuid = permission.fmenuid
        WHERE permission.fuserid = $1
          AND permission.fcoid = $2
      `,
      [req.user.userId, companyId],
    );

    const permittedRows = permittedResult.rows;
    const permittedIds = new Set(permittedRows.map((row) => row.fmenuid));
    const ancestorIds = new Set<string>();

    for (const { fmenuid } of permittedRows) {
      let ancestorId = fmenuid;

      while (ancestorId.length > 2) {
        ancestorId = ancestorId.slice(0, -2);
        ancestorIds.add(ancestorId);
      }
    }

    const missingAncestorIds = [...ancestorIds].filter(
      (ancestorId) => !permittedIds.has(ancestorId),
    );
    let ancestorRows: MenuRow[] = [];

    if (missingAncestorIds.length > 0) {
      const ancestorResult = await pool.query<MenuRow>(
        `
          SELECT fmenuid, fmenuname, fmenucaption, fmenubuttons
          FROM dbo.tblmenu
          WHERE fmenuid = ANY($1::varchar[])
        `,
        [missingAncestorIds],
      );

      ancestorRows = ancestorResult.rows;
    }

    const data = [...permittedRows, ...ancestorRows].sort((a, b) =>
      a.fmenuid.localeCompare(b.fmenuid),
    );

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error: unknown) {
    console.error("Get menus error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to load menus",
      error: error instanceof Error ? error.message : String(error),
    });
  }
};
