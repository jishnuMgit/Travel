// services/common/ServerDateService.ts
// COMMON: the date and time of the server (the port of the old objCommon.GetServerDate / dbo.SP_GetServerDate).
// It reads dbo.getserverdate(), the same function the procedures use for fcuserdate / fmuserdate, so a page that needs
// "now" (for a created / modified date, a default date, a check against today) gets the same clock as the database.
//
// The time of a save: the PAGE asks for the server date (GET /api/datetime/server-date) and sends it with the request as
// `dtpServerDate` (Frontend utils/serverDate.ts, the same as the STOCK project). resolveServerDate checks it and the
// procedures write it on every row of the transaction (fcuserdate / fmuserdate and the user audit), so all the rows carry the
// same time. A wrong value from a page can never write a wrong time: it is ignored and the server's own time is used.
import type { PoolClient } from "pg";
import pool from "../../DB/db";

type Db = Pick<PoolClient, "query">;

// On one connection / transaction (the caller gives a client, or the pool).
export const getServerDateWith = async (db: Db): Promise<Date> => {
  const { rows } = await db.query("SELECT dbo.getserverdate() AS fserverdate");
  return rows[0].fserverdate as Date;
};

export const getServerDate = () => getServerDateWith(pool);

/* VB objCommon.GetServerDate() -> "YYYY-MM-DD HH:mm:ss" (what the page gets and sends back) */
export const getServerDateTextWith = async (db: Db): Promise<string> => {
  const { rows } = await db.query(`SELECT to_char(dbo.getserverdate(), 'YYYY-MM-DD HH24:MI:SS') AS fserverdate`);
  return String(rows[0]?.fserverdate ?? "");
};

export const getServerDateText = () => getServerDateTextWith(pool);

/* The time of a save / modify / delete: the value the page sent as `dtpServerDate`, when it is good; else the server's own.
   Good = "YYYY-MM-DD HH:mm:ss", a real date, and within `toleranceSeconds` (5 minutes) of this server's own clock. Nothing
   sent, a wrong format, an old or a future time are ignored. */
const SERVER_DATE_FORMAT = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/;

const asUtcMs = (value: string): number => Date.parse(`${value.replace(" ", "T")}Z`);

export const resolveServerDate = async (db: Db, supplied?: unknown, toleranceSeconds = 300): Promise<string> => {
  const serverNow = await getServerDateTextWith(db);

  if (typeof supplied !== "string" || !SERVER_DATE_FORMAT.test(supplied.trim())) return serverNow;

  const value = supplied.trim();
  const difference = Math.abs(asUtcMs(value) - asUtcMs(serverNow));

  return Number.isFinite(difference) && difference <= toleranceSeconds * 1000 ? value : serverNow;
};
