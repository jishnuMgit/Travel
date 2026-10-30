import type { NextFunction, Request, Response } from "express";
import pool from "../DB/db";

export type AuthenticatedUser = {
  userId: string;
  userType: string | null;
};

export interface AuthenticatedRequest extends Request {
  user?: AuthenticatedUser;
}

type SessionUserRow = {
  userId: string;
  userType: string | null;
  userStatus: string | null;
};

const getSessionToken = (req: Request): string | null => {
  const cookieHeader = req.headers.cookie;

  if (!cookieHeader) {
    return null;
  }

  const tokenCookie = cookieHeader
    .split(";")
    .map((cookie) => cookie.trim())
    .find((cookie) => cookie.startsWith("sessionToken="));
  const token = tokenCookie?.slice("sessionToken=".length);

  return token && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(token)
    ? token
    : null;
};

export const requireAuthentication = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  const sessionToken = getSessionToken(req);

  if (!sessionToken) {
    res.status(401).json({
      success: false,
      message: "Authentication required",
    });
    return;
  }

  try {
    const result = await pool.query<SessionUserRow>(
      `
        SELECT
          userlogin.fuserid AS "userId",
          userlogin.fusertype AS "userType",
          userlogin.fuserstatus AS "userStatus"
        FROM dbo.tblusersession AS usersession
        JOIN dbo.tbluserlogin AS userlogin
          ON userlogin.fuserid = usersession.fuserid
        WHERE usersession.fsessiontoken = $1::uuid
          AND usersession.fexpiresat > now()
      `,
      [sessionToken],
    );
    const user = result.rows[0];

    if (
      !user ||
      (user.userId.toUpperCase() !== "ADMIN" &&
        user.userStatus?.trim().toUpperCase() !== "A")
    ) {
      res.status(401).json({
        success: false,
        message: "Authentication required",
      });
      return;
    }

    req.user = {
      userId: user.userId,
      userType: user.userType,
    };
    next();
  } catch (error: unknown) {
    console.error("Authentication middleware error:", error);
    res.status(500).json({
      success: false,
      message: "Authentication check failed",
    });
  }
};
