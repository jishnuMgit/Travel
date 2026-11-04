
import { Request, Response } from "express";
import pool from "../../../DB/db";


/**
 * GET dbo.tblservicetypegroup
 */
export const getGroupOptions = async (req: Request, res: Response) => {
  try {
    const PstrCoID = String(req.query.PstrCoID ?? "").trim();

    if (!PstrCoID) {
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
      [PstrCoID]
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
    const PstrCoID = String(req.query.PstrCoID ?? "").trim();

    if (!PstrCoID) {
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
      [PstrCoID]
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
 * DELETE dbo.tblservicetype
 */
export const DeleteData = async (req: Request, res: Response) => {
  const PstrCoID = String(req.query.PstrCoID ?? "").trim();
  const txtServiceTypeID = String(req.query.txtServiceTypeID ?? "").trim();

  if (!PstrCoID || !txtServiceTypeID) {
    return res.status(400).json({
      message: "Company ID and service type ID are required.",
    });
  }

  try {
    const result = await pool.query(
      `DELETE FROM dbo.tblservicetype
       WHERE fcoid = $1
         AND fservicetypeid = $2
       RETURNING fservicetypeid`,
      [PstrCoID, txtServiceTypeID]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({
        message: "Service type was not found.",
      });
    }

    return res.json({
      message: "Service type deleted successfully.",
    });
  } catch (error) {
    console.error("Error deleting dbo.tblservicetype:", error);

    return res.status(500).json({
      message: "Failed to delete service type.",
    });
  }
};

/**
 * INSERT / UPDATE dbo.tblservicetype
 */
export const SaveData = async (req: Request, res: Response) => {
  const { rows,  PstrUserID,
           PstrCoID,} = req.body;


           console.log("Received request body:", req.body);

  if (!PstrCoID || !PstrUserID) {
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
      String(row.txtServiceTypeID ?? "").trim() ||
      String(row.lkpServiceGroupName ?? "").trim() ||
      String(row.txtServiceTypeName ?? "").trim() ||
      String(row.txtPositionNo ?? "").trim()
  );

  if (validRows.length === 0) {
    return res.status(400).json({
      message: "Please enter at least one service type.",
    });
  }

  const seenIds = new Set<string>();

  for (const row of validRows) {
    const txtServiceTypeID = String(row.txtServiceTypeID ?? "").trim();
    const lkpServiceGroupName = String(row.lkpServiceGroupName ?? "").trim();
    const txtServiceTypeName = String(row.txtServiceTypeName ?? "").trim();
    const txtPositionNo = String(row.txtPositionNo ?? "").trim();

    if (!txtServiceTypeID || !lkpServiceGroupName || !txtServiceTypeName) {
      return res.status(400).json({
        message:
          "Service Type ID, Service Group Name, and Service Type Name are required.",
      });
    }

    if (txtServiceTypeID.length > 4) {
      return res.status(400).json({
        message: `Service Type ID "${txtServiceTypeID}" must not exceed 4 characters.`,
      });
    }

    if (lkpServiceGroupName.length > 4) {
      return res.status(400).json({
        message: "Service Group ID must not exceed 4 characters.",
      });
    }

    if (txtServiceTypeName.length > 50) {
      return res.status(400).json({
        message: `Service Type Name for "${txtServiceTypeID}" must not exceed 50 characters.`,
      });
    }

    if (!txtPositionNo) {
      return res.status(400).json({
        message: `Position number is required for Service Type ID "${txtServiceTypeID}".`,
      });
    }

    if (seenIds.has(txtServiceTypeID)) {
      return res.status(400).json({
        message: `Duplicate Service Type ID: ${txtServiceTypeID}`,
      });
    }

    seenIds.add(txtServiceTypeID);
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    for (const row of validRows) {
      const txtServiceTypeID = String(row.txtServiceTypeID).trim();
      const lkpServiceGroupName = String(row.lkpServiceGroupName).trim();
      const txtServiceTypeName = String(row.txtServiceTypeName).trim();
      const txtPositionNo = String(row.txtPositionNo ?? "").trim();
      const position = txtPositionNo ? Number(txtPositionNo) : null;

      const groupResult = await client.query(
        `SELECT 1
         FROM dbo.tblservicetypegroup
         WHERE dbo.tblservicetypegroup.fcoid = $1
           AND dbo.tblservicetypegroup.fservicetypegroupid = $2`,
        [PstrCoID, lkpServiceGroupName]
      );

      if (groupResult.rowCount === 0) {
        throw new Error(
          `Service group "${lkpServiceGroupName}" does not exist for this company.`
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
          PstrCoID,
          txtServiceTypeID,
          lkpServiceGroupName,
          txtServiceTypeName,
          String(PstrUserID),
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
