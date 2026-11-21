import type { Request, Response } from "express";
import type { PoolClient } from "pg";
import pool from "../../../DB/db";
import type { AuthenticatedRequest } from "../../../middleware/AuthMiddleware";
import { UserAudit } from "../../../utils/UserAudit";

type BudgetMode = "GTL" | "S" | "M1" | "D1" | "D";

type BudgetRow = {
  fSlNo: number;
  fGAccountID: string;
  fMonthAmt1?: number;
  fMonthAmt2?: number;
  fMonthAmt3?: number;
  fMonthAmt4?: number;
  fMonthAmt5?: number;
  fMonthAmt6?: number;
  fMonthAmt7?: number;
  fMonthAmt8?: number;
  fMonthAmt9?: number;
  fMonthAmt10?: number;
  fMonthAmt11?: number;
  fMonthAmt12?: number;
  fTotAmt?: number;
  fNote?: string;
};

type BudgetUpdateRow = BudgetRow & { OriginalSlNo: number };
type BudgetDeleteRow = { OriginalSlNo: number };

type BudgetKey = {
  PstrCoID: string;
  IntYear: number;
  StrBrID: string | null;
  StrBudgetHeadType: string | null;
};

const callBudgetProcedure = async (
  client: PoolClient,
  mode: BudgetMode,
  key: BudgetKey,
  userId: string | null,
  row?: BudgetRow,
  originalSlNo?: number,
) => {
  const m = (i: number) =>
    ((row as unknown as Record<string, number | undefined>)?.[`fMonthAmt${i}`] ?? 0);

  const result = await client.query(
    `CALL dbo.sp_pagebudget(
      NULL::jsonb,
      $1::varchar,  $2::varchar,  $3::smallint, $4::varchar,  $5::varchar,
      $6::smallint, $7::varchar,
      $8::numeric,  $9::numeric,  $10::numeric, $11::numeric, $12::numeric, $13::numeric,
      $14::numeric, $15::numeric, $16::numeric, $17::numeric, $18::numeric, $19::numeric,
      $20::numeric, $21::smallint, $22::varchar, $23::varchar, $24::varchar, $25::varchar
    )`,
    [
      mode,
      key.PstrCoID,
      key.IntYear,
      key.StrBrID,
      key.StrBudgetHeadType,
      row?.fSlNo ?? 0,
      row?.fGAccountID ?? null,
      m(1), m(2), m(3), m(4), m(5), m(6),
      m(7), m(8), m(9), m(10), m(11), m(12),
      row?.fTotAmt ?? 0,
      originalSlNo ?? 0,
      userId,
      null,
      null,
      (row?.fNote ?? "").slice(0, 150),
    ],
  );
  return result.rows[0]?.p_result ?? null;
};

const isValidRow = (row: BudgetRow | undefined): row is BudgetRow =>
  Boolean(row && Number.isFinite(Number(row.fSlNo)) && row.fGAccountID?.trim());

// ---------------------------------------------------------------
// FillCombos (Branch + Type)
// ---------------------------------------------------------------

export const FillCombos = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const PstrCoID = String(req.params.PstrCoID ?? "").trim();

    if (!PstrCoID) {
      res.status(400).json({
        success: false,
        message: "Company ID is required.",
      });
      return;
    }

    const [branches, types, accountsByID, accountsByName,year] =
      await Promise.all([
        pool.query(
          `SELECT *
           FROM dbo.tblbranch
           WHERE fcoid = $1
           ORDER BY fbrid`,
          [PstrCoID],
        ),

        pool.query(
          `SELECT *
           FROM dbo.filllookupbudgetfinparam($1)`,
          [PstrCoID],
        ),

        pool.query(
          `SELECT *
           FROM dbo.filllookupbudgetaccountid($1)`,
          [PstrCoID],
        ),

        pool.query(
          `SELECT *
           FROM dbo.filllookupbudgetaccountname($1)`,
          [PstrCoID],
        ),
        pool.query(
          `SELECT *
           FROM dbo.fillyear($1)`,
          [PstrCoID],
        ),
      ]);

    res.status(200).json({
      success: true,
      DefaultBrID: process.env.DEFAULT_BR_ID ?? null,
      Branches: branches.rows,
      Types: types.rows,
      AccountsByID: accountsByID.rows,
      AccountsByName: accountsByName.rows,
      Year:year.rows
    });

  } catch (error) {
    console.error("Budget FillCombos error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to load budget combos.",
    });
  }
};


// ---------------------------------------------------------------
// FillCombos (Account ID / Account Name by budget head type)
// ---------------------------------------------------------------
// export const FillAccountCombos = async (
//   req: AuthenticatedRequest,
//   res: Response,
// ): Promise<void> => {
//   const StrBudgetHeadType = String(req.params.StrBudgetHeadType ?? "").trim();
//   if (!StrBudgetHeadType) {
//     res.status(400).json({ success: false, message: "Budget head type is required." });
//     return;
//   }

//   const flag = StrBudgetHeadType === "E" ? "fisexpense" : "fisincome";
//   try {
//     const [byId, byName] = await Promise.all([
//       pool.query(
//         `SELECT * FROM dbo.tblaccountg
//          WHERE fisbudgethead::int = 1 AND ${flag}::int = 1 ORDER BY fgaccountid`,
//       ),
//       pool.query(
//         `SELECT * FROM dbo.tblaccountg
//          WHERE fisbudgethead::int = 1 AND ${flag}::int = 1 ORDER BY faccountname`,
//       ),
//     ]);
//     res.status(200).json({ SortByID: byId.rows, SortByName: byName.rows });
//   } catch (error) {
//     console.error("Budget account combo error:", error);
//     res.status(500).json({ success: false, message: "Failed to load accounts." });
//   }
// };

// ---------------------------------------------------------------
// GetDataTL  (mode GTL)
// ---------------------------------------------------------------
export const GetDataTL = async (
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> => {
  const PstrCoID = String(req.params.PstrCoID ?? "").trim();
  const IntYear = Number(req.params.IntYear);
  const StrBrID = String(req.params.StrBrID ?? "").trim();
  const StrType = String(req.params.StrType ?? "").trim();

  if (!PstrCoID || !IntYear || !StrBrID || !StrType) {
    res.status(400).json({
      success: false,
      message: "Company ID, year, branch ID, and budget head type are required.",
    });
    return;
  }

  const client = await pool.connect();
  try {
    const data = await callBudgetProcedure(
      client,
      "GTL",
      { PstrCoID, IntYear, StrBrID, StrBudgetHeadType: StrType },
      req.user?.userId ?? null,
    );
    res.status(200).json(data ?? []);
  } catch (error) {
    console.error("Budget load error:", error);
    res.status(500).json({ success: false, message: "Failed to load budget." });
  } finally {
    client.release();
  }
};

// ---------------------------------------------------------------
// Apply  (D1 -> M1 -> S in one transaction)
// ---------------------------------------------------------------
export const Apply = async (
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> => {
  const {
    PstrCoID,
    IntYear,
    StrBrID,
    StrBudgetHeadType,
    Inserted = [],
    Updated = [],
    Deleted = [],
  }: {
    PstrCoID?: string;
    IntYear?: number;
    StrBrID?: string;
    StrBudgetHeadType?: string;
    Inserted?: BudgetRow[];
    Updated?: BudgetUpdateRow[];
    Deleted?: BudgetDeleteRow[];
  } = req.body ?? {};

  if (!PstrCoID || !IntYear || !StrBrID || !StrBudgetHeadType) {
    res.status(400).json({
      success: false,
      message: "Company ID, year, branch ID, and budget head type are required.",
    });
    return;
  }

  if (
    !Array.isArray(Inserted) || !Array.isArray(Updated) || !Array.isArray(Deleted) ||
    !Inserted.every(isValidRow) || !Updated.every(isValidRow)
  ) {
    res.status(400).json({
      success: false,
      message: "Every budget row requires a serial number and an account ID.",
    });
    return;
  }

  const key: BudgetKey = { PstrCoID, IntYear, StrBrID, StrBudgetHeadType };
  const PstrUserID = req.user?.userId ?? null;


  console.log("++++++++++++++++++++++++")
  console.log(PstrUserID)

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const ensure = (r: { success?: boolean; message?: string } | null) => {
      if (!r || r.success === false) throw new Error(r?.message ?? "Budget procedure failed.");
    };

    for (const r of Deleted) {
      ensure(await callBudgetProcedure(client, "D1", key, PstrUserID, undefined, r.OriginalSlNo));
    }
    for (const r of Updated) {
      ensure(await callBudgetProcedure(client, "M1", key, PstrUserID, r, r.OriginalSlNo));
    }
    for (const r of Inserted) {
      ensure(await callBudgetProcedure(client, "S", key, PstrUserID, r));
    }

    await client.query("COMMIT");
    res.status(200).json({ success: true, message: "Budget saved successfully." });
  } catch (error) {
    try {
      await client.query("ROLLBACK");
    } catch (rollbackError) {
      console.error("Budget rollback error:", rollbackError);
    }
    console.error("Budget apply error:", error);
    res.status(500).json({ success: false, message: "Failed to save budget." });
  } finally {
    client.release();
  }
};

// ---------------------------------------------------------------
// ApplyD  (mode D - delete all for year / branch / type)
// ---------------------------------------------------------------
export const ApplyD = async (
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> => {
  const PstrCoID = String(req.params.PstrCoID ?? "").trim();
  const IntYear = Number(req.params.IntYear);
  const StrBrID = String(req.params.StrBrID ?? "").trim();
  const StrType = String(req.params.StrType ?? "").trim();

  if (!PstrCoID || !IntYear || !StrBrID || !StrType) {
    res.status(400).json({
      success: false,
      message: "Company ID, year, branch ID, and budget head type are required.",
    });
    return;
  }

  const client = await pool.connect();
  try {
    const result = await callBudgetProcedure(
      client,
      "D",
      { PstrCoID, IntYear, StrBrID, StrBudgetHeadType: StrType },
      req.user?.userId ?? null,
    );
    if (!result?.affected_count) {
      res.status(404).json({ success: false, message: "Budget not found." });
      return;
    } 
       const fbudgetheadtype=StrType ==='E'? 'Expense': 'Revenue'


    const user = String(req.user?.userId ?? "");
    await UserAudit(
      PstrCoID,
      String(IntYear),
      null,
      null,
      null,
      "Budget",
      "D",
      user,
      `Deleted Budget (Branch ${StrBrID}, Type ${fbudgetheadtype}, Year ${IntYear}) by ${user}`,
    );

    res.status(200).json({
      success: true,
      message: result.message ?? "Budget deleted successfully.",
    });
  } catch (error) {
    console.error("Budget delete error:", error);
    res.status(500).json({ success: false, message: "Failed to delete budget." });
  } finally {
    client.release();
  }
};

// ---------------------------------------------------------------
// SaveBudget  (mode S - insert a single row)
// ---------------------------------------------------------------
export const SaveBudget = async (
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> => {
  const { PstrCoID, IntYear, StrBrID, StrBudgetHeadType, Row } = req.body ?? {};

  if (!PstrCoID || !IntYear || !StrBrID || !StrBudgetHeadType || !isValidRow(Row)) {
    res.status(400).json({
      success: false,
      message: "Company ID, year, branch ID, budget head type, serial number, and account ID are required.",
    });
    return;
  }

  const client = await pool.connect();
  try {
    const result = await callBudgetProcedure(
      client,
      "S",
      {
        PstrCoID: String(PstrCoID).trim(),
        IntYear: Number(IntYear),
        StrBrID: String(StrBrID).trim(),
        StrBudgetHeadType: String(StrBudgetHeadType).trim(),
      },
      req.user?.userId ?? null,
      Row,
    );
    res.status(201).json({
      success: true,
      message: result?.message ?? "Budget saved successfully.",
    });
  } catch (error) {
    console.error("Budget save error:", error);
    res.status(500).json({ success: false, message: "Failed to save budget." });
  } finally {
    client.release();
  }
};

// ---------------------------------------------------------------
// UpdateBudget  (mode M1 - modify a single row)
// ---------------------------------------------------------------
export const UpdateBudget = async (
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> => {
  const PstrCoID = String(req.params.PstrCoID ?? "").trim();
  const IntYear = Number(req.params.IntYear);
  const StrBrID = String(req.params.StrBrID ?? "").trim();
  const StrType = String(req.params.StrType ?? "").trim();
  const OriginalSlNo = Number(req.params.OriginalSlNo);
  const Row = req.body as BudgetRow | undefined;

  if (!PstrCoID || !IntYear || !StrBrID || !StrType || !Number.isFinite(OriginalSlNo) || !isValidRow(Row)) {
    res.status(400).json({
      success: false,
      message: "Company ID, year, branch ID, type, original serial number, and a valid row are required.",
    });
    return;
  }
  const userId=req.user?.userId
  console.log("++++++++++++++++++++++++")
  console.log(userId)

  const client = await pool.connect();
  try {
    const result = await callBudgetProcedure(
      client,
      "M1",
      { PstrCoID, IntYear, StrBrID, StrBudgetHeadType: StrType },
      String(userId),
      Row,
      OriginalSlNo,
    );
    if (!result?.affected_count) {
      res.status(404).json({ success: false, message: "Budget not found." });
      return;
    }
    res.status(200).json({
      success: true,
      message: result.message ?? "Budget updated successfully.",
    });
  } catch (error) {
    console.error("Budget update error:", error);
    res.status(500).json({ success: false, message: "Failed to update budget." });
  } finally {
    client.release();
  }
};

// ---------------------------------------------------------------
// DeleteBudget  (mode D1 - delete a single row)
// ---------------------------------------------------------------
export const DeleteBudget = async (
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> => {
  const PstrCoID = String(req.params.PstrCoID ?? "").trim();
  const IntYear = Number(req.params.IntYear);
  const StrBrID = String(req.params.StrBrID ?? "").trim();
  const StrType = String(req.params.StrType ?? "").trim();
  const OriginalSlNo = Number(req.params.OriginalSlNo);

  if (!PstrCoID || !IntYear || !StrBrID || !StrType || !Number.isFinite(OriginalSlNo)) {
    res.status(400).json({
      success: false,
      message: "Company ID, year, branch ID, type, and serial number are required.",
    });
    return;
  }

  const client = await pool.connect();
  try {
    const result = await callBudgetProcedure(
      client,
      "D1",
      { PstrCoID, IntYear, StrBrID, StrBudgetHeadType: StrType },
      req.user?.userId ?? null,
      undefined,
      OriginalSlNo,
    );
    if (!result?.affected_count) {
      res.status(404).json({ success: false, message: "Budget not found." });
      return;
    }

    const fbudgetheadtype=StrType ==='E'? 'Expense': 'Revenue'

    const PstrUserID = String(req.user?.userId ?? "");
    await UserAudit(
      PstrCoID,
      String(IntYear),
      null,
      null,
      null,
      "Budget",
      "D",
      PstrUserID,
      `Deleted Budget Serial No ${OriginalSlNo} (Branch ${StrBrID}, Type ${fbudgetheadtype}) by ${PstrUserID}`,
    );

    res.status(200).json({
      success: true,
      message: result.message ?? "Budget deleted successfully.",
    });
  } catch (error) {
    console.error("Budget delete error:", error);
    res.status(500).json({ success: false, message: "Failed to delete budget." });
  } finally {
    client.release();
  }
};