import type { Response } from "express";
import type { PoolClient } from "pg";
import pool from "../../../DB/db";
import type { AuthenticatedRequest } from "../../../middleware/AuthMiddleware";

type CustomerDivisionRow = {
  StrDivID: string;
  StrDivName: string;
  StrDivNameAr: string;
};

const callCustomerDivisionProcedure = async (
  client: PoolClient,
  mode: "G" | "S" | "D",
  PstrCoID: string,
  StrCustomerID: string,
  userId: string | null,
  row?: CustomerDivisionRow,
) => {
  const result = await client.query(
    `CALL dbo.sp_pagecustdivision(
      $1::varchar,
      $2::varchar,
      $3::varchar,
      $4::varchar,
      $5::varchar,
      $6::varchar,
      $7::varchar,
      NULL::jsonb
    )`,
    [
      mode,
      PstrCoID,
      StrCustomerID,
      row?.StrDivID ?? null,
      row?.StrDivName ?? null,
      row?.StrDivNameAr ?? null,
      userId,
    ],
  );
  return result.rows[0]?.p_result ?? null;
};

export const GetCustomer = async (
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> => {
  const PstrCoID = String(req.params.PstrCoID ?? "").trim();

  try {
    const [customersByName, customersById] = await Promise.all([
      pool.query(`SELECT * FROM dbo.filllookupcustomername($1)`, [PstrCoID]),
      pool.query(`SELECT * FROM dbo.filllookupcustomerid($1)`, [PstrCoID]),
    ]);

    res.status(200).json({
      SortByName: customersByName.rows,
      SortByID: customersById.rows,
    });
  } catch (error) {
    console.error("Customer division customer lookup error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to load customers.",
    });
  }
};

export const GetCustomerData = async (
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> => {
  const PstrCoID = String(req.params.PstrCoID ?? "").trim();
  const StrCustomerID = String(req.params.StrCustomerID ?? "").trim();
  const client = await pool.connect();

  try {
    const data = await callCustomerDivisionProcedure(
      client,
      "G",
      PstrCoID,
      StrCustomerID,
      req.user?.userId ?? null,
    );
    res.status(200).json(data ?? []);
  } catch (error) {
    console.error("Customer division load error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to load customer divisions.",
    });
  } finally {
    client.release();
  }
};

export const SaveCustomerData = async (
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> => {
  const {
    PstrCoID,
    StrCustomerID,
    Rows,
  }: {
    PstrCoID?: string;
    StrCustomerID?: string;
    Rows?: CustomerDivisionRow[];
  } = req.body ?? {};

  if (!PstrCoID || !StrCustomerID || !Array.isArray(Rows)) {
    res.status(400).json({
      success: false,
      message: "Company ID, customer ID, and division rows are required.",
    });
    return;
  }

  const invalidRow = Rows.find(
    (row) => !row.StrDivID?.trim() || !row.StrDivName?.trim(),
  );
  if (invalidRow) {
    res.status(400).json({
      success: false,
      message: "Every division requires an ID and a name.",
    });
    return;
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await callCustomerDivisionProcedure(
      client,
      "D",
      PstrCoID,
      StrCustomerID,
      req.user?.userId ?? null,
    );

    for (const row of Rows) {
      await callCustomerDivisionProcedure(
        client,
        "S",
        PstrCoID,
        StrCustomerID,
        req.user?.userId ?? null,
        row,
      );
    }

    await client.query("COMMIT");
    res.status(200).json({
      success: true,
      message: "Customer divisions saved successfully.",
    });
  } catch (error) {
    try {
      await client.query("ROLLBACK");
    } catch (rollbackError) {
      console.error("Customer division rollback error:", rollbackError);
    }
    console.error("Customer division save error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to save customer divisions.",
    });
  } finally {
    client.release();
  }
};
