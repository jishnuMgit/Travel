import { Request, Response } from "express";
import pool from "../../../DB/db";

/**
 * Common stored procedure executor
 *
 * Parameter order must match dbo.sp_pageservicetype:
 * 1. Mode
 * 2. Company ID
 * 3. Service Type ID
 * 4. Service Type Group ID
 * 5. Service Type Name
 * 6. User ID 
 * 7. Position Number
 * 8. Persisted Service Type ID
 * 9. OUT Result
 */
const executeServiceTypeSP = async (
  client: any,
  StrMode: string,
  PstrCoID: string,
  StrServiceTypeID: string | null = null,
  StrServiceTypeGroupID: string | null = null,
  StrServiceTypeName: string | null = null,
  PstrUserID: string | null = null,
  NumPositioNo: number | null = null,
  StrPersistedServiceTypeID: string | null = null
) => {
  const result = await client.query(
    `CALL dbo.sp_pageservicetype(
      $1, $2, $3, $4, $5, $6, $7, $8, NULL
    )`,
    [
      StrMode,
      PstrCoID,
      StrServiceTypeID,
      StrServiceTypeGroupID,
      StrServiceTypeName,
      PstrUserID,
      NumPositioNo,
      StrPersistedServiceTypeID,
    ]
  );

  return result.rows[0]?.p_result ?? null;
};

/**
 * GET dbo.tblservicetypegroup
 */
export const getGroupOptions = async (req: Request, res: Response) => {
  try {
    const StrCoID = String(req.query.PstrCoID ?? "").trim();

    if (!StrCoID) {
      return res.status(400).json({
        message: "Company ID is required.",
      });
    }

    const result = await executeServiceTypeSP(
      pool,
      "GETGROUP",
      StrCoID
    );

    return res.json(result ?? []);
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

    const result = await executeServiceTypeSP(
      pool,
      "GETALL",
      PstrCoID
    );

    return res.json(result ?? []);
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

  const StrServiceTypeID = String(
    req.query.txtServiceTypeID ?? ""
  ).trim();

  if (!PstrCoID || !StrServiceTypeID) {
    return res.status(400).json({
      message: "Company ID and service type ID are required.",
    });
  }

  try {
    const result = await executeServiceTypeSP(
      pool,
      "D",
      PstrCoID,
      StrServiceTypeID
    );

    if (!result) {
      return res.status(404).json({
        message: "Service type was not found.",
      });
    }

    return res.json(
      result
    );
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
  const { rows } = req.body;

  console.log("Received request body:", req.body);

  const PstrCoID = String(req.body.PstrCoID ?? "").trim();
  const PstrUserID = String(req.body.PstrUserID ?? "").trim();

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

  // Keep only rows containing at least one entered value.
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

  // Validate rows before starting the transaction.
  const seenIds = new Set<string>();

  for (const row of validRows) {
      const StrServiceTypeID = String(row.txtServiceTypeID ?? "").trim();

    const StrServiceTypeGroupID = String(row.lkpServiceGroupName ?? "").trim();

    const StrServiceTypeName = String(row.txtServiceTypeName ?? "").trim();

    const NumPositioNo = String(row.txtPositionNo ?? "").trim();

    if (!StrServiceTypeID || !StrServiceTypeGroupID || !StrServiceTypeName) {
      return res.status(400).json({
        message:
          "Service Type ID, Service Group Name, and Service Type Name are required.",
      });
    }

    if (!NumPositioNo) {
      return res.status(400).json({
        message: `Position number is required for Service Type ID "${StrServiceTypeID}".`,
      });
    }

    const PositionNo = Number(NumPositioNo);

    if (!Number.isInteger(PositionNo)) {
      return res.status(400).json({
        message: `Position number must be a valid integer for Service Type ID "${StrServiceTypeID}".`,
      });
    }

    if (seenIds.has(StrServiceTypeID)) {
      return res.status(400).json({
        message: `Duplicate Service Type ID: ${StrServiceTypeID}`,
      });
    }

    seenIds.add(StrServiceTypeID);
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    for (const row of validRows) {
      const StrServiceTypeID = String( row.txtServiceTypeID ?? "" ).trim();

      const StrServiceTypeGroupID = String(row.lkpServiceGroupName ?? "").trim();

      const StrServiceTypeName = String(row.txtServiceTypeName ?? "").trim();

      const NumPositioNo = Number(String(row.txtPositionNo ?? "").trim() );

      const StrPersistedServiceTypeID = String(
        row.persistedTxtServiceTypeID ?? ""
      ).trim();

      if (StrPersistedServiceTypeID) {
        // UPDATE existing service type.
        // The persisted ID identifies the original database record.
        await executeServiceTypeSP(
          client,
          "M",
          PstrCoID,
          StrServiceTypeID,
          StrServiceTypeGroupID,
          StrServiceTypeName,
          PstrUserID,
          NumPositioNo,
          StrPersistedServiceTypeID
        );
      } else {
        // INSERT new service type.
        await executeServiceTypeSP(
          client,
          "S",
          PstrCoID,
          StrServiceTypeID,
          StrServiceTypeGroupID,
          StrServiceTypeName,
          PstrUserID,
          NumPositioNo,
          null
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