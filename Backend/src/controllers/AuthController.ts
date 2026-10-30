import { randomUUID } from "node:crypto";
import type { Request, Response } from "express";
import pool from "../DB/db";
import type { AuthenticatedRequest } from "../middleware/AuthMiddleware";

type LoginRequestBody = {
  pstrCOID?: unknown;
  PstrYear?: unknown;
  PstrUserID?: unknown;
  txtPwd?: unknown;
};

type UserRow = {
  fuserid: string;
  fuserpwd: string | null;
  fuserstatus: string | null;
  fusertype: string | null;
};

const decryptPwd = (encryptedPwd: string, userPwdSeed: number): string => {
  if (!encryptedPwd) {
    return "";
  }

  let decryptedPwd = "";

  for (let i = 0; i < encryptedPwd.length; i += 5) {
    const encryptedChar = encryptedPwd.substring(i, i + 4);

    if (encryptedChar.length < 4) {
      continue;
    }

    const asciiValue = Number.parseInt(encryptedChar, 10) - userPwdSeed;
    decryptedPwd += String.fromCharCode(asciiValue);
  }

  return decryptedPwd;
};

const isUserActive = (
  userId: string,
  userStatus: string | null,
): boolean =>
  userId.toUpperCase() === "ADMIN" ||
  userStatus?.trim().toUpperCase() === "A";

const idleUserMessage = (userId: string): string =>
  `User '${userId}' is inactive. Please contact your administrator.`;

export const login = async (
  req: Request,
  res: Response,
): Promise<Response> => {
  try {
    const body =
      req.body && typeof req.body === "object"
        ? (req.body as LoginRequestBody)
        : {};
    const pstrCOID =
      typeof body.pstrCOID === "string" ? body.pstrCOID.trim() : "";
    const PstrYear =
      typeof body.PstrYear === "string" || typeof body.PstrYear === "number"
        ? String(body.PstrYear).trim()
        : "";
    const PstrUserID =
      typeof body.PstrUserID === "string" ? body.PstrUserID.trim() : "";
    const txtPwd = typeof body.txtPwd === "string" ? body.txtPwd : "";

    if (!pstrCOID) {
      return res.status(400).json({
        success: false,
        message: "Please select a Company",
      });
    }

    if (!PstrYear) {
      return res.status(400).json({
        success: false,
        message: "Please select a Year",
      });
    }

    if (!PstrUserID) {
      return res.status(400).json({
        success: false,
        message: "Please input User ID",
      });
    }

    if (!txtPwd) {
      return res.status(400).json({
        success: false,
        message: "Please input Password",
      });
    }

    const userResult = await pool.query<UserRow>(
      `
        SELECT fuserid, fuserpwd, fuserstatus, fusertype
        FROM dbo.tbluserlogin
        WHERE fuserid = $1
      `,
      [PstrUserID],
    );

    const user = userResult.rows[0];

    if (!user || !user.fuserpwd) {
      return res.status(401).json({
        success: false,
        message: "User does not exist",
      });
    }

    const seedValue = process.env.USER_PWD_SEED;
    const userPwdSeed =
      seedValue && seedValue.trim() !== "" ? Number(seedValue) : Number.NaN;

    if (!Number.isFinite(userPwdSeed)) {
      console.error("USER_PWD_SEED is missing or invalid");
      return res.status(500).json({
        success: false,
        message: "Login is not configured correctly",
      });
    }

    if (decryptPwd(user.fuserpwd, userPwdSeed) !== txtPwd) {
      return res.status(401).json({
        success: false,
        message: "Please input the Password correctly",
      });
    }

    if (!isUserActive(user.fuserid, user.fuserstatus)) {
      return res.status(403).json({
        success: false,
        message: idleUserMessage(user.fuserid || PstrUserID),
      });
    }

    if (user.fusertype !== "AU") {
      const companyRightResult = await pool.query<{
        hasCoRight: number | string | boolean;
      }>(
        `SELECT dbo.hascoright($1, $2) AS "hasCoRight"`,
        [pstrCOID, PstrUserID],
      );

      if (Number(companyRightResult.rows[0]?.hasCoRight ?? 0) <= 0) {
        return res.status(403).json({
          success: false,
          message: `User '${PstrUserID}' does not have access to the selected Company`,
        });
      }
    }

    await pool.query(
      `DELETE FROM dbo.tblusersession WHERE fuserid = $1 AND fexpiresat <= now()`,
      [PstrUserID],
    );

    const sessionToken = randomUUID();
    const sessionResult = await pool.query<{ fsessionid: number }>(
      `
        INSERT INTO dbo.tblusersession (fuserid, fsessiontoken, fcoid)
        VALUES ($1, $2, $3)
        ON CONFLICT (fuserid) DO UPDATE
          SET fsessiontoken = EXCLUDED.fsessiontoken,
              fcoid = EXCLUDED.fcoid,
              fcreatedat = now(),
              flastactivity = now(),
              fexpiresat = now() + interval '24 hours'
          WHERE dbo.tblusersession.fexpiresat <= now()
        RETURNING fsessionid
      `,
      [PstrUserID, sessionToken, pstrCOID],
    );

    if (sessionResult.rowCount === 0) {
      return res.status(409).json({
        success: false,
        message: "This user is already logged in on another device",
      });
    }

    res.cookie("sessionToken", sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 24 * 60 * 60 * 1000,
    });

    return res.status(200).json({
      success: true,
      message: "Login successful",
      data: {
        txtUserID: user.fuserid,
        pstrCOID,
        PstrYear,
        userType: user.fusertype,
      },
    });
  } catch (error: unknown) {
    console.error("Login controller error:", error);

    return res.status(500).json({
      success: false,
      message: "Login failed",
    });
  }
};

export const getMe = async (
  req: AuthenticatedRequest,
  res: Response,
): Promise<Response> => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        userId: req.user.userId,
        userType: req.user.userType,
      },
    });
  } catch (error: unknown) {
    console.error("Get current user error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to get current user",
    });
  }
};

export const logout = async (
  req: AuthenticatedRequest,
  res: Response,
): Promise<Response> => {
  try {
    const cookieHeader = req.headers.cookie;
    const tokenCookie = cookieHeader
      ?.split(";")
      .map((cookie) => cookie.trim())
      .find((cookie) => cookie.startsWith("sessionToken="));
    const sessionToken = tokenCookie?.slice("sessionToken=".length);

    if (
      sessionToken &&
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        sessionToken,
      )
    ) {
      await pool.query(
        `DELETE FROM dbo.tblusersession WHERE fsessiontoken = $1::uuid`,
        [sessionToken],
      );
    }

    res.clearCookie("sessionToken", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
    });

    return res.status(200).json({
      success: true,
      message: "Logout successful",
    });
  } catch (error: unknown) {
    console.error("Logout controller error:", error);

    return res.status(500).json({
      success: false,
      message: "Logout failed",
    });
  }
};
