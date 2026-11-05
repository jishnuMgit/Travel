
import { Request, Response } from "express";
import pool from "../../../DB/db";


/**
 * GET dbo.tblservicetypegroup
 */
export const getGroupOptions = async (req: Request, res: Response) => {
  try {
    const fcoid = String(req.query.PstrCoID ?? "").trim();

    if (!fcoid) {
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
      [fcoid]
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
    const fcoid = String(req.query.PstrCoID ?? "").trim();

    if (!fcoid) {
      return res.status(400).json({
        message: "Company ID is required.",
      });
    }

    const result = await pool.query(
      `SELECT
          dbo.tblservicetype.fcoid,
          dbo.tblservicetype.fservicetypeid,
          dbo.tblservicetype.fservicetypegroupid,
          dbo.tblservicetype.fservicetypename,
          dbo.tblservicetype.fctacarriercode,
          dbo.tblservicetype.fcuserid,
          dbo.tblservicetype.fcuserdate,
          dbo.tblservicetype.fmuserid,
          dbo.tblservicetype.fmuserdate,
          dbo.tblservicetype.fpositionno,
          dbo.tblservicetypegroup.fservicetypegroupname
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
      [fcoid]
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
  const fcoid = String(req.query.PstrCoID ?? "").trim();
  const fservicetypeid = String(req.query.txtServiceTypeID ?? "").trim();

  if (!fcoid || !fservicetypeid) {
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
      [fcoid, fservicetypeid]
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
    const fservicetypeid = String(row.txtServiceTypeID ?? "").trim();
    const fservicetypegroupid = String(row.lkpServiceGroupName ?? "").trim();
    const fservicetypename = String(row.txtServiceTypeName ?? "").trim();
    const fpositionno = String(row.txtPositionNo ?? "").trim();

    if (!fservicetypeid || !fservicetypegroupid || !fservicetypename) {
      return res.status(400).json({
        message:
          "Service Type ID, Service Group Name, and Service Type Name are required.",
      });
    }

    if (fservicetypeid.length > 4) {
      return res.status(400).json({
        message: `Service Type ID "${fservicetypeid}" must not exceed 4 characters.`,
      });
    }

    if (fservicetypegroupid.length > 4) {
      return res.status(400).json({
        message: "Service Group ID must not exceed 4 characters.",
      });
    }

    if (fservicetypename.length > 50) {
      return res.status(400).json({
        message: `Service Type Name for "${fservicetypeid}" must not exceed 50 characters.`,
      });
    }

    if (!fpositionno) {
      return res.status(400).json({
        message: `Position number is required for Service Type ID "${fservicetypeid}".`,
      });
    }

    if (seenIds.has(fservicetypeid)) {
      return res.status(400).json({
        message: `Duplicate Service Type ID: ${fservicetypeid}`,
      });
    }

    seenIds.add(fservicetypeid);
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    for (const row of validRows) {
      const fservicetypeid = String(row.txtServiceTypeID).trim();
      const fservicetypegroupid = String(row.lkpServiceGroupName).trim();
      const fservicetypename = String(row.txtServiceTypeName).trim();
      const txtPositionNo = String(row.txtPositionNo ?? "").trim();
      const fpositionno = txtPositionNo ? Number(txtPositionNo) : null;

      const groupResult = await client.query(
        `SELECT 1
         FROM dbo.tblservicetypegroup
         WHERE dbo.tblservicetypegroup.fcoid = $1
           AND dbo.tblservicetypegroup.fservicetypegroupid = $2`,
        [PstrCoID, fservicetypegroupid]
      );

      if (groupResult.rowCount === 0) {
        throw new Error(
          `Service group "${fservicetypegroupid}" does not exist for this company.`
        );
      }

      const persistedTxtServiceTypeID = String(
        row.persistedTxtServiceTypeID ?? ""
      ).trim();

      if (persistedTxtServiceTypeID) {
        const result = await client.query(
          `UPDATE dbo.tblservicetype
           SET fservicetypeid = $2,
               fservicetypegroupid = $3,
               fservicetypename = $4,
               fmuserid = $5,
               fmuserdate = CURRENT_TIMESTAMP,
               fpositionno = $6
           WHERE fcoid = $1
             AND fservicetypeid = $7`,
          [
            PstrCoID,
            fservicetypeid,
            fservicetypegroupid,
            fservicetypename,
            String(PstrUserID),
            fpositionno,
            persistedTxtServiceTypeID,
          ]
        );

        if (result.rowCount === 0) {
          throw new Error(
            `Service type "${persistedTxtServiceTypeID}" was not found.`
          );
        }
      } else {
        await client.query(
          `INSERT INTO dbo.tblservicetype (
              fcoid,
              fservicetypeid,
              fservicetypegroupid,
              fservicetypename,
              fctacarriercode,
              fcuserid,
              fcuserdate,
              fmuserid,
              fmuserdate,
              fpositionno
           )
           VALUES (
             $1, $2, $3, $4, NULL, $5, CURRENT_TIMESTAMP, NULL, NULL, $6
           )`,
          [
            PstrCoID,
            fservicetypeid,
            fservicetypegroupid,
            fservicetypename,
            String(PstrUserID),
            fpositionno,
          ]
        );
      }
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
