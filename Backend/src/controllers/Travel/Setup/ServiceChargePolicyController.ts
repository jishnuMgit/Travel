
import { Response } from "express";
import pool from "../../../DB/db";
import type { AuthenticatedRequest } from "../../../middleware/AuthMiddleware";
import { PoolClient } from "pg";

const validModes = [
  "GST",
  "GS",
  "GR",
  "GHD",
  "S",
  "SR",
  "M1",
  "MR1",
  "D",
  "D1",
];

const readModes = ["GST", "GS", "GR", "GHD"];
const rowSaveModes = ["S", "SR", "M1", "MR1"];


type ServiceChargePolicySaveRow = {
  intSlNo?: number | string;
  Original_fSlNo?: number | string;
  StrServiceTypeID?: string | null;
  strServiceTypeGroupID?: string | null;
  StrDivID?: string | null;
  lkpDServiceChargeType?: string | null;
  StrDServiceChargePre?: number | string | null;
  StrDMinServiceChargeAmt?: number | string | null;
  StrDServiceChargeAmt  ?: number | string | null;
  lkpIServiceChargeType?: string | null;
  StrIServiceChargePer?: number | string | null;
  StrIMinServiceChargeAmt?: number | string | null;
  StrIServiceChargeAmt?: number | string | null;
};


export const handleServiceChargePolicy = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  const {
    StrMode,
    PstrCoID,
    StrCustomerID = null,
    intSlNo = 0,
    StrSR = null,
    NumMerchantFeePer = 0,
    StrServiceTypeID = null,
    strServiceTypeGroupID = null,
    Original_fSlNo = 0,
    lkpDServiceChargeType = null,
    StrDServiceChargePre = 0,
    StrDMinServiceChargeAmt = 0,
    StrDServiceChargeAmt   = 0,
    lkpIServiceChargeType = null,
    StrIServiceChargePer = 0,
    StrIMinServiceChargeAmt = 0,
    StrIServiceChargeAmt = 0,
    StrMenuName = null,
  } = req.body;

  const StrUserID = req.user?.userId ?? null;
  const Rows = req.body.Rows as ServiceChargePolicySaveRow[] | undefined;

  console.log("================= Call Service Charge Policy =================");

  console.log(req.body)

  if (!StrMode || !validModes.includes(StrMode)) {
    res.status(400).json({
      success: false,
      message: "Invalid service charge policy mode",
    });
    return;
  }

  if (!PstrCoID) {
    res.status(400).json({
      success: false,
      message: "Company ID is required",
    });
    return;
  }

  try {
    const CustomerNameResult = await pool.query(
      `SELECT * FROM dbo.filllookupcustomername($1)`,
      [PstrCoID]
    );

    const CustomerIDResult = await pool.query(
      `SELECT * FROM dbo.filllookupcustomerid($1)`,
      [PstrCoID]
    );

    if (
      ["GS", "GR", "GHD", ...rowSaveModes, "D", "D1"].includes(StrMode) &&
      !StrCustomerID
    ) {
      res.status(400).json({
        success: false,
        message: "Customer ID is required",
      });
      return;
    }

    if (rowSaveModes.includes(StrMode)) {
      if (!Array.isArray(Rows) || Rows.length === 0) {
        res.status(400).json({
          success: false,
          message: "At least one service row is required",
        });
        return;
      }

      const invalidRow = Rows.find((row) => !row.StrServiceTypeID);

      if (invalidRow) {
        res.status(400).json({
          success: false,
          message: "Each service row requires a service type ID.",
        });
        return;
      }
    }

    let client: PoolClient | undefined;

    try {
      const dbClient = await pool.connect();
      client = dbClient;

      await dbClient.query("BEGIN");


const callProcedure = async (
  mode: string,
  row?: ServiceChargePolicySaveRow
) => {
  const result = await dbClient.query(
    `CALL dbo.sp_pageservicechargepolicy(
      $1::varchar,
      $2::varchar,
      $3::varchar,
      $4::varchar,
      $5::numeric,
      $6::varchar,
      $7::varchar,
      $8::numeric,
      $9::numeric,
      $10::numeric,
      $11::varchar,
      $12::numeric,
      $13::numeric,
      $14::numeric,
      $15::varchar,
      NULL::jsonb
    )`,
    [
      mode,
      PstrCoID,
      StrCustomerID,
      StrSR,
      NumMerchantFeePer,
      row?.StrServiceTypeID ?? StrServiceTypeID,
      row?.lkpDServiceChargeType ?? lkpDServiceChargeType,
      row?.StrDServiceChargePre ?? StrDServiceChargePre,
      row?.StrDMinServiceChargeAmt ?? StrDMinServiceChargeAmt,
      row?.StrDServiceChargeAmt ?? StrDServiceChargeAmt,
      row?.lkpIServiceChargeType ?? lkpIServiceChargeType,
      row?.StrIServiceChargePer ?? StrIServiceChargePer,
      row?.StrIMinServiceChargeAmt ?? StrIMinServiceChargeAmt,
      row?.StrIServiceChargeAmt ?? StrIServiceChargeAmt,

      StrUserID,
    ]
  );

  return result.rows[0]?.p_result ?? null;
};


      let data: unknown;

      if (rowSaveModes.includes(StrMode)) {
        const rowResults: unknown[] = [];

        for (const row of Rows ?? []) {
          let procedureMode = StrMode;

          if (StrMode === "S" || StrMode === "SR") {
            const existingPolicy = await dbClient.query(
              `SELECT EXISTS (
                SELECT 1
                FROM dbo.tblservicechargepolicy
                WHERE fcoid = $1
                  AND fcustomerid = $2
                  AND fsr = $3
                  AND fservicetypeid = $4
              ) AS policy_exists`,
              [
                PstrCoID,
                StrCustomerID,
                StrSR,
                row.StrServiceTypeID,
              ]
            );

            if (existingPolicy.rows[0]?.policy_exists) {
              procedureMode = StrSR === "S" ? "M1" : "MR1";
            }
          }

          rowResults.push(await callProcedure(procedureMode, row));
        }

        data = rowResults;
      } else {
        data = await callProcedure(StrMode);
      }

      await dbClient.query("COMMIT");

      res.status(200).json({
        success: true,
        message: readModes.includes(StrMode)
          ? "Service charge policy fetched successfully"
          : "Service charge policy processed successfully",
        data,
        customerID: CustomerIDResult,
        cutomerName: CustomerNameResult,
      });
    } catch (error) {
      if (client) {
        try {
          await client.query("ROLLBACK");
        } catch (rollbackError) {
          console.error("Service Charge Policy rollback error:", rollbackError);
        }
      }

      throw error;
    } finally {
      client?.release();
    }
  } catch (error) {
    console.error("Service Charge Policy Error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to process service charge policy",
      error:
        error instanceof Error
          ? error.message
          : "Internal server error",
    });
  }
};






export const copyServiceChargePolicy = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  const {
    PstrCoID,
    StrCustomerID,
    StrSourceCustomerID,
    StrMenuName = "Service Charge Policy",
    OverwriteExisting = false,
  } = req.body;

  if (!PstrCoID || !StrCustomerID || !StrSourceCustomerID) {
    res.status(400).json({
      success: false,
      message: "Company ID, destination customer, and source customer are required",
    });
    return;
  }

  if (typeof OverwriteExisting !== "boolean") {
    res.status(400).json({
      success: false,
      message: "OverwriteExisting must be a boolean",
    });
    return;
  }

  if (StrCustomerID === StrSourceCustomerID) {
    res.status(400).json({
      success: false,
      message: "Source and destination customers must be different",
    });
    return;
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const existingPolicy = await client.query(
      `SELECT EXISTS (
        SELECT 1
        FROM dbo.tblservicechargepolicy
        WHERE fcoid = $1 AND fcustomerid = $2
      ) AS has_existing_policy`,
      [PstrCoID, StrCustomerID],
    );

    if (existingPolicy.rows[0]?.has_existing_policy && !OverwriteExisting) {
      await client.query("ROLLBACK");
      res.status(200).json({
        success: false,
        requiresOverwriteConfirmation: true,
        message: "The destination customer already has a service charge policy.",
      });
      return;
    }

    await client.query(
      `CALL dbo.sp_pageservicechargepolicycopy(
        $1, $2, $3, $4, $5
      )`,
      [
        PstrCoID,
        StrCustomerID,
        StrSourceCustomerID,
        req.user?.userId ?? null,
        StrMenuName,
      ]
    );

    await client.query("COMMIT");

    res.status(200).json({
      success: true,
      message: "Service Charge Policy copied successfully",
    });

  } catch (error: unknown) {
    await client.query("ROLLBACK");

    console.error("Copy Service Charge Policy Error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to copy Service Charge Policy",
      error: error instanceof Error ? error.message : "Internal server error",
    });

  } finally {
    client.release();
  }
};

