import type { Request, Response } from "express";
import type { QueryResult } from "pg";
import pool  from "../../../DB/db";

type AirlineBody = {
  fcoid?: unknown;
  fairlineno?: unknown;
  fairlinename?: unknown;
  fairlineid?: unknown;
  fvatoncommission?: unknown;
  fsuserid?: unknown;
  fmuserid?: unknown;
};

const cleanString = (value: unknown) =>
  typeof value === "string" ? value.trim() : "";

const validateAirline = (body: AirlineBody, requireCompany = false) => {
  const fcoid = cleanString(body.fcoid);
  const fairlineno = cleanString(body.fairlineno);
  const fairlinename = cleanString(body.fairlinename);
  const fairlineid = cleanString(body.fairlineid);
  const fsuserid = cleanString(body.fsuserid);
  const fmuserid = cleanString(body.fmuserid);

  if (requireCompany && !fcoid) return { error: "fcoid is required." };
  if (!fairlineno) return { error: "Airline No is required." };
  if (!fairlinename) return { error: "Airline Name is required." };
  if (fcoid.length > 3) return { error: "fcoid must not exceed 3 characters." };
  if (fairlineno.length > 3) return { error: "Airline No must not exceed 3 characters." };
  if (fairlinename.length > 50) return { error: "Airline Name must not exceed 50 characters." };
  if (fairlineid.length > 3) return { error: "Airline Code must not exceed 3 characters." };
  if (fsuserid.length > 30 || fmuserid.length > 30) {
    return { error: "User ID must not exceed 30 characters." };
  }
  if (body.fvatoncommission !== undefined && typeof body.fvatoncommission !== "boolean") {
    return { error: "fvatoncommission must be true or false." };
  }

  return {
    data: {
      fcoid,
      fairlineno,
      fairlinename,
      fairlineid: fairlineid || null,
      fvatoncommission: body.fvatoncommission === true,
      fsuserid: fsuserid || null,
      fmuserid: fmuserid || null,
    },
  };
};

const handleDatabaseError = (error: unknown, res: Response) => {
  const pgError = error as { code?: string; constraint?: string; message?: string };
  if (pgError.code === "23505") {
    res.status(409).json({ message: "This Airline No already exists for this company." });
    return;
  }
  if (pgError.code === "23503") {
    res.status(400).json({ message: "This airline is referenced by other records and cannot be changed or deleted." });
    return;
  }
  console.error("Airline API database error:", error);
  res.status(500).json({ message: "Internal server error while processing airline." });
};

// GET /api/airlines/:fcoid
export const getAirlines = async (req: Request, res: Response) => {
  const { fcoid } = req.params;
  if (!fcoid || fcoid.length > 3) {
    res.status(400).json({ message: "A valid fcoid is required." });
    return;
  }

  try {
    const result = await pool.query(
      `SELECT fcoid, fairlineno, fairlinename, fairlineid,
              fsuserid, fsuserdate, fmuserid, fmuserdate, fvatoncommission
         FROM dbo.tblairline
        WHERE fcoid = $1
        ORDER BY fairlineno`,
      [fcoid],
    );
    res.status(200).json(result.rows);
  } catch (error) {
    handleDatabaseError(error, res);
  }
};

// GET /api/airlines/:fcoid/:fairlineno
export const getAirline = async (req: Request, res: Response) => {
  const { fcoid, fairlineno } = req.params;
  try {
    const result = await pool.query(
      `SELECT fcoid, fairlineno, fairlinename, fairlineid,
              fsuserid, fsuserdate, fmuserid, fmuserdate, fvatoncommission
         FROM dbo.tblairline
        WHERE fcoid = $1 AND fairlineno = $2`,
      [fcoid, fairlineno],
    );

    if (result.rowCount === 0) {
      res.status(404).json({ message: "Airline not found." });
      return;
    }
    res.status(200).json(result.rows[0]);
  } catch (error) {
    handleDatabaseError(error, res);
  }
};

// POST /api/airlines
export const createAirline = async (req: Request, res: Response) => {
  const validation = validateAirline(req.body as AirlineBody, true);
  if ("error" in validation) {
    res.status(400).json({ message: validation.error });
    return;
  }
  const data = validation.data;

  try {
    const result = await pool.query(
      `INSERT INTO dbo.tblairline
         (fcoid, fairlineno, fairlinename, fairlineid,
          fsuserid, fsuserdate, fvatoncommission)
       VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP, $6)
       RETURNING fcoid, fairlineno, fairlinename, fairlineid,
                 fsuserid, fsuserdate, fmuserid, fmuserdate, fvatoncommission`,
      [
        data.fcoid,
        data.fairlineno,
        data.fairlinename,
        data.fairlineid,
        data.fsuserid,
        data.fvatoncommission,
      ],
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    handleDatabaseError(error, res);
  }
};

// PUT /api/airlines/:fcoid/:oldFairlineno
export const updateAirline = async (req: Request, res: Response) => {
  const { fcoid, oldFairlineno } = req.params;
  const body = req.body as AirlineBody;
  const validation = validateAirline({ ...body, fcoid });
  if ("error" in validation) {
    res.status(400).json({ message: validation.error });
    return;
  }
  const data = validation.data;

  try {
    const result = await pool.query(
      `UPDATE dbo.tblairline
          SET fairlineno = $3,
              fairlinename = $4,
              fairlineid = $5,
              fvatoncommission = $6,
              fmuserid = $7,
              fmuserdate = CURRENT_DATE
        WHERE fcoid = $1 AND fairlineno = $2
        RETURNING fcoid, fairlineno, fairlinename, fairlineid,
                  fsuserid, fsuserdate, fmuserid, fmuserdate, fvatoncommission`,
      [
        fcoid,
        oldFairlineno,
        data.fairlineno,
        data.fairlinename,
        data.fairlineid,
        data.fvatoncommission,
        data.fmuserid,
      ],
    );

    if (result.rowCount === 0) {
      res.status(404).json({ message: "Airline not found." });
      return;
    }
    res.status(200).json(result.rows[0]);
  } catch (error) {
    handleDatabaseError(error, res);
  }
};

// DELETE /api/airlines/:fcoid/:fairlineno
export const deleteAirline = async (req: Request, res: Response) => {
  const { fcoid, fairlineno } = req.params;
  try {
    const result: QueryResult = await pool.query(
      `DELETE FROM dbo.tblairline
        WHERE fcoid = $1 AND fairlineno = $2`,
      [fcoid, fairlineno],
    );

    if (result.rowCount === 0) {
      res.status(404).json({ message: "Airline not found." });
      return;
    }
    res.status(200).json({ message: "Airline deleted successfully." });
  } catch (error) {
    handleDatabaseError(error, res);
  }
};
