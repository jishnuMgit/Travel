import { Request, Response } from "express";
import pool from "../../DB/db";

export const getAirlines = async (
  req: Request,
  res: Response,
): Promise<Response> => {
  try {
    const { fcoid } = req.query;

    if (!fcoid) {
      return res.status(400).json({
        success: false,
        message: "fcoid is required",
      });
    }

    const query = `
      SELECT 
        fairlineno,
        fairlinename,
        fairlinecode
      FROM dbo.tblairline
      WHERE fcoid = $1
      ORDER BY fairlineno ASC
    `;

    const result = await pool.query(query, [fcoid]);

    return res.status(200).json({
      success: true,
      data: result.rows,
    });

  } catch (error) {
    console.error("Error fetching airlines:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
