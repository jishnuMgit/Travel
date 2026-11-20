import type { Request, Response } from "express";
import { getServerDateText } from "../../services/common/ServerDateService";

// GET /api/datetime/server-date -> { success: true, data: { serverDate: "YYYY-MM-DD HH:mm:ss" } }
// The page asks for it before a save and sends it back as `dtpServerDate` (Frontend utils/serverDate.ts).
export const getServerDate = async (_req: Request, res: Response) => {
  try {
    const serverDate = await getServerDateText();
    res.status(200).json({ success: true, data: { serverDate } });
  } catch (error) {
    console.error("getServerDate error:", error);
    res.status(500).json({ success: false, message: "Failed to get server date" });
  }
};
