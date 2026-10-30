import type { Request, Response } from "express";
import { getCompanies as loadCompanies } from "../services/CompanyService";

const errorMessage = (error: unknown): string =>
  error instanceof Error ? error.message : String(error);

export const getCompanies = async (
  _req: Request,
  res: Response,
): Promise<Response> => {
  try {
    const companies = await loadCompanies();
    return res.status(200).json({ success: true, companies });
  } catch (error: unknown) {
    console.error("Get companies error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to load companies",
      error: errorMessage(error),
    });
  }
};
