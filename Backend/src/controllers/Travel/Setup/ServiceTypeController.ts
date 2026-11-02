
import { Router, Request, Response } from "express";
import pool from "../../../DB/db";


/**
 * GET dbo.tblservicetypegroup
 */
export const getGroupOptions = async (req: Request, res: Response) => {
  try {
    const companyId = String(req.query.companyId ?? "").trim();

    if (!companyId) {
      return res.status(400).json({
        message: "Company ID is required.",
      });
    }

    const result = await pool.query(
      `SELECT
          dbo.tblservicetypegroup.fcoid,
          dbo.tblservicetypegroup.fservicetypegroupid,
          dbo.tblservicetypegroup.fservicetypegroupname,
          dbo.tblservicetypegroup.fpositionno
       FROM dbo.tblservicetypegroup
       WHERE dbo.tblservicetypegroup.fcoid = $1
       ORDER BY
          dbo.tblservicetypegroup.fpositionno NULLS LAST,
          dbo.tblservicetypegroup.fservicetypegroupname`,
      [companyId]
    );

    return res.json(result.rows);
  } catch (error) {
    console.error("Error fetching dbo.tblservicetypegroup:", error);

    return res.status(500).json({
      message: "Failed to fetch service groups.",
    });
  }
};

/**
 * GET dbo.tblservicetype
 * JOIN dbo.tblservicetypegroup
 */
export const GetData = async (req: Request, res: Response) => {
  try {
    const companyId = String(req.query.companyId ?? "").trim();

    if (!companyId) {
      return res.status(400).json({
        message: "Company ID is required.",
      });
    }

    const result = await pool.query(
      `SELECT
          dbo.tblservicetype.fcoid,
          dbo.tblservicetype.fservicetypeid,
          dbo.tblservicetype.fservicetypegroupid,
          dbo.tblservicetypegroup.fservicetypegroupname,
          dbo.tblservicetype.fservicetypename,
          dbo.tblservicetype.fpositionno
       FROM dbo.tblservicetype
       LEFT JOIN dbo.tblservicetypegroup
          ON dbo.tblservicetypegroup.fcoid =
             dbo.tblservicetype.fcoid
         AND dbo.tblservicetypegroup.fservicetypegroupid =
             dbo.tblservicetype.fservicetypegroupid
       WHERE dbo.tblservicetype.fcoid = $1
       ORDER BY
          dbo.tblservicetype.fpositionno NULLS LAST,
          dbo.tblservicetype.fservicetypeid`,
      [companyId]
    );

    return res.json(result.rows);
  } catch (error) {
    console.error("Error fetching dbo.tblservicetype:", error);

    return res.status(500).json({
      message: "Failed to fetch service types.",
    });
  }
};

/**
 * INSERT / UPDATE dbo.tblservicetype
 */
export const SaveData = async (req: Request, res: Response) => {
  const { rows,  pstrUserID,
           pstrCoID,} = req.body;

  if (!pstrCoID || !pstrUserID) {
    return res.status(400).json({
      message: "Company ID and user ID are required.",
    });
  }

  if (!Array.isArray(rows)) {
    return res.status(400).json({
      message: "Rows must be an array.",
    });
  }

  const validRows = rows.filter(
    (row: any) =>
      String(row.serviceTypeId ?? "").trim() ||
      String(row.serviceGroupId ?? "").trim() ||
      String(row.name ?? "").trim() ||
      String(row.position ?? "").trim()
  );

  if (validRows.length === 0) {
    return res.status(400).json({
      message: "Please enter at least one service type.",
    });
  }

  const seenIds = new Set<string>();

  for (const row of validRows) {
    const serviceTypeId = String(row.serviceTypeId ?? "").trim();
    const serviceGroupId = String(row.serviceGroupId ?? "").trim();
    const name = String(row.name ?? "").trim();
    const positionText = String(row.position ?? "").trim();

    if (!serviceTypeId || !serviceGroupId || !name) {
      return res.status(400).json({
        message:
          "Service Type ID, Service Group Name, and Service Type Name are required.",
      });
    }

    if (serviceTypeId.length > 4) {
      return res.status(400).json({
        message: `Service Type ID "${serviceTypeId}" must not exceed 4 characters.`,
      });
    }

    if (serviceGroupId.length > 4) {
      return res.status(400).json({
        message: "Service Group ID must not exceed 4 characters.",
      });
    }

    if (name.length > 50) {
      return res.status(400).json({
        message: `Service Type Name for "${serviceTypeId}" must not exceed 50 characters.`,
      });
    }

    if (positionText) {
      const position = Number(positionText);

      if (
        !Number.isInteger(position) ||
        position < -32768 ||
        position > 32767
      ) {
        return res.status(400).json({
          message: `Position No. for "${serviceTypeId}" must be a whole number between -32768 and 32767.`,
        });
      }
    }

    if (seenIds.has(serviceTypeId)) {
      return res.status(400).json({
        message: `Duplicate Service Type ID: ${serviceTypeId}`,
      });
    }

    seenIds.add(serviceTypeId);
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    for (const row of validRows) {
      const serviceTypeId = String(row.serviceTypeId).trim();
      const serviceGroupId = String(row.serviceGroupId).trim();
      const name = String(row.name).trim();
      const positionText = String(row.position ?? "").trim();
      const position = positionText ? Number(positionText) : null;

      const groupResult = await client.query(
        `SELECT 1
         FROM dbo.tblservicetypegroup
         WHERE dbo.tblservicetypegroup.fcoid = $1
           AND dbo.tblservicetypegroup.fservicetypegroupid = $2`,
        [pstrCoID, serviceGroupId]
      );

      if (groupResult.rowCount === 0) {
        throw new Error(
          `Service group "${serviceGroupId}" does not exist for this company.`
        );
      }

      await client.query(
        `INSERT INTO dbo.tblservicetype (
            fcoid,
            fservicetypeid,
            fservicetypegroupid,
            fservicetypename,
            fcuserid,
            fcuserdate,
            fmuserid,
            fmuserdate,
            fpositionno
         )
         VALUES (
            $1, $2, $3, $4, $5,
            CURRENT_TIMESTAMP,
            $5, CURRENT_TIMESTAMP, $6
         )
         ON CONFLICT (fcoid, fservicetypeid)
         DO UPDATE SET
            fservicetypegroupid =
                EXCLUDED.fservicetypegroupid,
            fservicetypename =
                EXCLUDED.fservicetypename,
            fmuserid = EXCLUDED.fcuserid,
            fmuserdate = CURRENT_TIMESTAMP,
            fpositionno = EXCLUDED.fpositionno`,
        [
          pstrCoID,
          serviceTypeId,
          serviceGroupId,
          name,
          String(pstrUserID),
          position,
        ]
      );
    }

    await client.query("COMMIT");

    return res.json({
      message: "Service types saved successfully.",
      count: validRows.length,
    });
  } catch (error: any) {
    await client.query("ROLLBACK");

    console.error("Error saving dbo.tblservicetype:", error);

    return res.status(400).json({
      message: error.message || "Failed to save service types.",
    });
  } finally {
    client.release();
  }
};


