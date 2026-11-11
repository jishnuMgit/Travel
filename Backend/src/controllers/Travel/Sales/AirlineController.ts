import type { Request, Response } from "express";
import pool from "../../../DB/db";
import {UserAudit} from "../../../utils/UserAudit";
type AirlineBody = {
  PstrCoID?: unknown;
  StrAirlineNo?: unknown;
  StrAirlineName?: unknown;
  StrAirlineCode?: unknown;
  ChkVatOnCommission?: boolean | unknown;
  PstrUserID?: unknown;
  dtpUserDate?: unknown;
};

const cleanString = (value: unknown) =>
  typeof value === "string" ? value.trim() : "";

const validateAirline = (
  body: AirlineBody,
  requireCompany = false
) => {
  const PstrCoID = cleanString(body.PstrCoID);
  const StrAirlineNo = cleanString(body.StrAirlineNo);
  const StrAirlineName = cleanString(body.StrAirlineName);
  const StrAirlineCode = cleanString(body.StrAirlineCode);
  const ChkVatOnCommission = body.ChkVatOnCommission;
  const PstrUserID = cleanString(body.PstrUserID);
  const dtpUserDate = body.dtpUserDate;

  if (requireCompany && !PstrCoID) {
    return { error: "PstrCoID is required." };
  }

  if (!StrAirlineNo) {
    return { error: "Airline No is required." };
  }

  if (!StrAirlineName) {
    return { error: "Airline Name is required." };
  }

  return {
    data: {
      PstrCoID,
      StrAirlineNo,
      StrAirlineName,
      StrAirlineCode: StrAirlineCode || null,
      ChkVatOnCommission: ChkVatOnCommission === true,
      PstrUserID: PstrUserID || null,
      dtpUserDate: typeof dtpUserDate === "string" ? dtpUserDate : null,
    },
  };
};

// Common database error handler
const handleDatabaseError = (
  error: unknown,
  res: Response
) => {
  const pgError = error as {
    code?: string;
    constraint?: string;
    message?: string;
  };

  if (pgError.code === "23505") {
    res.status(409).json({
      message: "This Airline No already exists for this company.",
    });
    return;
  }

  if (pgError.code === "23503") {
    res.status(400).json({
      message: "This airline is referenced by other records and cannot be changed or deleted.",
    });
    return;
  }

  console.error("Airline API database error:", error);

  res.status(500).json({
    message: "Internal server error while processing airline.",
  });
};

// Common stored procedure caller
const executeAirlinePageSP = async (
  StrMode: string,
  StrCoID: string,
  OldStrAirlineNo: string | null = null,
  StrAirlineNo: string | null = null,
  StrAirlineName: string | null = null,
  StrAirlineCode: string | null = null,
  ChkVatOnCommission: boolean = false,
  StrUserID: string | null = null,
  UserDate: string | null = null
) => {
  const result = await pool.query(
    `CALL dbo.sp_pageairline(
      $1, $2, $3, $4, $5, $6, $7, $8, $9, NULL
    )`,
    [
      StrMode,
      StrCoID,
      OldStrAirlineNo,
      StrAirlineNo,
      StrAirlineName,
      StrAirlineCode,
      ChkVatOnCommission,
      StrUserID,
      UserDate,
    ]
  );

  return result.rows[0]?.p_result ?? null;
};
// GET /api/airlines/:PstrCoID
export const getAirlines = async (
  req: Request,
  res: Response
) => {
  const PstrCoID = getRouteParam(req.params.PstrCoID);

  if (!PstrCoID || PstrCoID.length > 3) {
    res.status(400).json({
      message: "A valid PstrCoID is required.",
    });
    return;
  }

  try {
    const data = await executeAirlinePageSP(
      "GETALL",
      PstrCoID
    );

    res.status(200).json(data ?? []);

  } catch (error) {
    handleDatabaseError(error, res);
  }
};

// GET /api/airlines/:PstrCoID/:StrAirlineNo
export const getAirline = async (
  req: Request,
  res: Response
) => {
  const PstrCoID = getRouteParam(req.params.PstrCoID);
  const StrAirlineNo = getRouteParam(req.params.StrAirlineNo);

  try {
    const data = await executeAirlinePageSP(
      "GETONE",
      PstrCoID,
      StrAirlineNo
    );

    if (!data) {
      res.status(404).json({
        message: "Airline not found.",
      });
      return;
    }

    res.status(200).json(data);

  } catch (error) {
    handleDatabaseError(error, res);
  }
};

// POST /api/airlines
export const createAirline = async (
  req: Request,
  res: Response
) => {
  const validation = validateAirline(
    req.body as AirlineBody,
    true
  );

  if ("error" in validation) {
    res.status(400).json({
      message: validation.error,
    });
    return;
  }

  const data = validation.data;

  try {
    const responseData = await executeAirlinePageSP(
      "S",
      data.PstrCoID,
      null,
      data.StrAirlineNo,
      data.StrAirlineName,
      data.StrAirlineCode,
      data.ChkVatOnCommission,
      data.PstrUserID,
      data.dtpUserDate
    );

    res.status(201).json(responseData);

  } catch (error) {
    handleDatabaseError(error, res);
  }
};

// PUT /api/airlines/:PstrCoID/:oldStrAirlineNo
export const updateAirline = async (
  req: Request,
  res: Response
) => {
  const PstrCoID = getRouteParam(req.params.PstrCoID);
  const oldStrAirlineNo = getRouteParam(req.params.oldStrAirlineNo);

  console.log("Updating airline:", { PstrCoID, oldStrAirlineNo, body: req.body });

  const validation = validateAirline({
    ...(req.body as AirlineBody),
    PstrCoID,
  });

  if ("error" in validation) {
    res.status(400).json({
      message: validation.error,
    });
    return;
  }

  const data = validation.data;

  try {
    // Current procedure uses StrAirlineNo as the
    // WHERE condition and does not change the Airline No.
    // See note below if you need to change Airline No.

    const responseData = await executeAirlinePageSP(
      "M",
      PstrCoID,
      oldStrAirlineNo,
      data.StrAirlineNo,
      data.StrAirlineName,
      data.StrAirlineCode,
      data.ChkVatOnCommission,
      data.PstrUserID,
      data.dtpUserDate
    );

    if (!responseData) {
      res.status(404).json({
        message: "Airline not found.",
      });
      return;
    }

    res.status(200).json(responseData);

  } catch (error) {
    handleDatabaseError(error, res);
  }
};

// DELETE /api/airlines/:PstrCoID/:StrAirlineNo
export const deleteAirline = async (
  req: Request,
  res: Response
) => {
  const PstrCoID = getRouteParam(req.params.PstrCoID);
  const StrAirlineNo = getRouteParam(req.params.StrAirlineNo);
  const PstrYear=getRouteParam(req.params.PstrYear)
const PstrUserID=req.body.PstrUserID
  try {
    const responseData = await executeAirlinePageSP(
      "D",
      PstrCoID,
      "NULL",
      StrAirlineNo
    );

    if (!responseData) {
      res.status(404).json({
        message: "Airline not found.",
      });
      return;
    }
 await UserAudit(PstrCoID, PstrYear, "", "", StrAirlineNo, "AirlinePage", "D",PstrUserID , `Deleted airline ${StrAirlineNo}`);
    res.status(200).json(responseData);

  } catch (error) {
    handleDatabaseError(error, res);
  }
};




function getRouteParam(PstrCoID: string | string[]): string {
  return Array.isArray(PstrCoID) ? PstrCoID[0] ?? "" : PstrCoID;
}
