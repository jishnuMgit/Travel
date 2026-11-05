import type { Request, Response } from "express";
import type { QueryResult } from "pg";
import pool  from "../../../DB/db";

type AirlineBody = {
  fcoid?: unknown;
  fairlineno?: unknown;
  fairlinename?: unknown;
  fairlinecode?: unknown;
  fcuserid?: unknown;
  fmuserid?: unknown;
  fvatoncommission?: unknown;
};

const cleanString = (value: unknown) =>
  typeof value === "string" ? value.trim() : "";

const validateAirline = (body: AirlineBody, requireCompany = false) => {
  const fcoid = cleanString(body.fcoid);
  const fairlineno = cleanString(body.fairlineno);
  const fairlinename = cleanString(body.fairlinename);
  const fairlinecode = cleanString(body.fairlinecode);
  const fcuserid = cleanString(body.fcuserid);
  const fmuserid = cleanString(body.fmuserid);
  const fvatoncommission = body.fvatoncommission;


  return {
    data: {
      fcoid,
      fairlineno,
      fairlinename,
      fairlinecode: fairlinecode || null,
      fcuserid: fcuserid || null,
      fmuserid: fmuserid || null,
      fvatoncommission: fvatoncommission === true,
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
      `SELECT fcoid, fairlineno, fairlinename, fairlinecode, fvatoncommission
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
      `SELECT fcoid, fairlineno, fairlinename, fairlinecode,
              fcuserid, fcuserdate, fmuserid, fmuserdate,
              fvatoncommission
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
         (fcoid, fairlineno, fairlinename, fairlinecode,
          fcuserid, fcuserdate, fmuserid, fmuserdate, fvatoncommission)
       VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP, NULL, NULL, $6)
       RETURNING fcoid, fairlineno, fairlinename, fairlinecode,
                 fcuserid, fcuserdate, fmuserid, fmuserdate,
                 fvatoncommission`,
      [
        data.fcoid,
        data.fairlineno,
        data.fairlinename,
        data.fairlinecode,
        data.fcuserid,
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
              fairlinecode = $5,
              fmuserid = $6,
              fmuserdate = CURRENT_DATE,
              fvatoncommission = $7
        WHERE fcoid = $1 AND fairlineno = $2
        RETURNING fcoid, fairlineno, fairlinename, fairlinecode,
                  fcuserid, fcuserdate, fmuserid, fmuserdate,
                  fvatoncommission`,
      [
        fcoid,
        oldFairlineno,
        data.fairlineno,
        data.fairlinename,
        data.fairlinecode,
        data.fmuserid,
        data.fvatoncommission,
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
