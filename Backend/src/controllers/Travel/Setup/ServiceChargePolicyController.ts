
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
  StrModuleID?: string | null;
  StrCarrierCode?: string | null;
  lkpDSCType?: string | null;
  StrDSCPre?: number | string | null;
  StrMinDSCAmt?: number | string | null;
  StrDSCAmt?: number | string | null;
  lkpISCType?: string | null;
  StrISCPer?: number | string | null;
  StrIMinSCAmt?: number | string | null;
  StrISCAmt?: number | string | null;
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
    StrSOrR = null,
    NumMerchantFeePer = 0,
    StrServiceID = null,
    StrModuleID = null,
    StrCarrierCode = null,
    Original_fSlNo = 0,
    lkpDSCType = null,
    StrDSCPre = 0,
    StrMinDSCAmt = 0,
    StrDSCAmt = 0,
    lkpISCType = null,
    StrISCPer = 0,
    StrIMinSCAmt = 0,
    StrISCAmt = 0,
    StrMenuName = null,
  } = req.body;

  const StrUserID = req.user?.userId ?? null;
  const Rows = req.body.Rows as ServiceChargePolicySaveRow[] | undefined;

  console.log("================= Call Service Charge Policy =================");

  console.log(NumMerchantFeePer)

  // Validate mode
  if (!StrMode || !validModes.includes(StrMode)) {
    res.status(400).json({
      success: false,
      message: "Invalid service charge policy mode",
    });
    return;
  }

  // Validate company
  if (!PstrCoID) {
    res.status(400).json({
      success: false,
      message: "Company ID is required",
    });
    return;
  }

   const CustomerNameResult = await pool.query(
      `SELECT * FROM dbo.filllookupcustomername($1)`,
      [PstrCoID],
    );

    const CustomerIDResult = await pool.query(
      `SELECT * FROM dbo.filllookupcustomerid($1)`,
      [PstrCoID],
    );

  // Validate customer
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

  // Validate Sales / Refund type
//   if (
//     ["GS", "GR", ...rowSaveModes, "D", "D1"].includes(StrMode) &&
//     !["S", "R"].includes(StrSOrR)
//   ) {
//     res.status(400).json({
//       success: false,
//       message: "Invalid Sales / Refund type",
//     });
//     return;
//   }

  if (rowSaveModes.includes(StrMode)) {
    if (!Array.isArray(Rows) || Rows.length === 0) {
      res.status(400).json({
        success: false,
        message: "At least one service row is required",
      });
      return;
    }

    const invalidRow = Rows.find(
      (row) =>
        !row.StrServiceTypeID ||
        !Number.isInteger(Number(row.intSlNo)) ||
        !Number.isInteger(Number(row.Original_fSlNo ?? row.intSlNo)),
    );
    if (invalidRow) {
      res.status(400).json({
        success: false,
        message: "Each service row requires a service ID and valid serial number.",
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
      row?: ServiceChargePolicySaveRow,
    ) => {
        console.log("========== PROCEDURE DEBUG ==========");
console.log("Mode:", mode);
console.log("Company:", PstrCoID);
console.log("Customer:", StrCustomerID);
console.log("Serial No:", row?.intSlNo ?? intSlNo);
console.log("Sales/Refund:", StrSOrR);
console.log("Merchant Fee:", NumMerchantFeePer);
console.log("Service ID:", row?.StrServiceTypeID ?? StrServiceID);
console.log("Original Serial:", row?.Original_fSlNo ?? Original_fSlNo);
console.log("======================================");
      const result = await dbClient.query(
        `CALL dbo.sp_pageservicechargepolicy(
          $1::varchar(5),
          $2::varchar(3),
          $3::varchar(12),
          $4::smallint,
          $5::varchar(2),
          $6::numeric(18,2),
          $7::varchar(4),
          $8::varchar(3),
          $9::varchar(3),
          $10::smallint,
          $11::varchar(2),
          $12::numeric(18,2),
          $13::numeric(18,2),
          $14::numeric(18,2),
          $15::varchar(2),
          $16::numeric(18,2),
          $17::numeric(18,2),
          $18::numeric(18,2),
          $19::varchar(20),
          $20::varchar(50),
          NULL::jsonb
        )`,
        [
          mode,
          PstrCoID,
          StrCustomerID,
          row?.intSlNo ?? intSlNo,
          StrSOrR,
          NumMerchantFeePer,
          row?.StrServiceTypeID ?? StrServiceID,
          row?.StrModuleID ?? StrModuleID,
          row?.StrCarrierCode ?? StrCarrierCode,
          row?.Original_fSlNo ?? Original_fSlNo,
          row?.lkpDSCType ?? lkpDSCType,
          row?.StrDSCPre ?? StrDSCPre,
          row?.StrMinDSCAmt ?? StrMinDSCAmt,
          row?.StrDSCAmt ?? StrDSCAmt,
          row?.lkpISCType ?? lkpISCType,
          row?.StrISCPer ?? StrISCPer,
          row?.StrIMinSCAmt ?? StrIMinSCAmt,
          row?.StrISCAmt ?? StrISCAmt,
          StrUserID,
          StrMenuName,
        ],
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
                 AND fsorr = $3
                 AND fslno = $4
                 AND fserviceid = $5
             ) AS policy_exists`,
            [
              PstrCoID,
              StrCustomerID,
              StrSOrR,
              row.Original_fSlNo ?? row.intSlNo,
              row.StrServiceTypeID,
            ],
          );
          if (existingPolicy.rows[0]?.policy_exists) {
            procedureMode = StrSOrR === "S" ? "M1" : "MR1";
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
      customerID:CustomerIDResult,
      cutomerName:CustomerNameResult
    });
  } catch (error) {
    if (client) {
      try {
        await client.query("ROLLBACK");
      } catch (rollbackError) {
        console.error("Service Charge Policy rollback error:", rollbackError);
      }
    }

    console.error("Service Charge Policy Error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to process service charge policy",
      error:
        error instanceof Error
          ? error.message
          : "Internal server error",
    });
  } finally {
    client?.release();
  }
};


