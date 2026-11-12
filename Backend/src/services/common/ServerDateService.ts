// services/common/ServerDateService.ts
// COMMON: the date and time of the server (the port of the old objCommon.GetServerDate / dbo.SP_GetServerDate).
// It reads dbo.getserverdate(), the same function the procedures use for fcuserdate / fmuserdate, so a page that needs
// "now" (for a created / modified date, a default date, a check against today) gets the same clock as the database.
import type { PoolClient } from "pg";
import pool from "../../DB/db";

type Db = Pick<PoolClient, "query">;

// On one connection / transaction (the caller gives a client, or the pool).
export const getServerDateWith = async (db: Db): Promise<Date> => {
  const { rows } = await db.query("SELECT dbo.getserverdate() AS fserverdate");
  return rows[0].fserverdate as Date;
};

export const getServerDate = () => getServerDateWith(pool);
