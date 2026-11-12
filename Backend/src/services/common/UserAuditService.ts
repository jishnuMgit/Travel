// services/common/UserAuditService.ts
// COMMON: the user audit (the port of STOCK's utils/UserAudit.ts). Writes one row of dbo.tbluseraudit through
// dbo.sp_useraudit. Every screen calls it after its insert / modify / delete and builds its own note text.
//
// It runs on the connection of the screen's transaction, so the audit row is saved or rolled back together with the
// data it describes (a failed audit never leaves a saved ticket without its audit row, and the other way round).
import type { PoolClient } from "pg";
import pool from "../../DB/db";

type Db = Pick<PoolClient, "query">;

export type UserAuditAction = "S" | "M" | "D"; // save, modify, delete

export type UserAuditEntry = {
  PstrCoID: string;
  PstrYear: string | null; // null for a screen without a year
  lkpBranch: string | null; // null for a screen without a branch
  Type: string | null; // the document type (Ticket Sales: the Ticket Type)
  txtDocNo: string | null; // the document no. (Ticket Sales: the Ticket No.)
  screenName: string; // the menu caption of the screen
  action: UserAuditAction;
  PstrUserID: string;
  note: string;
};

export const NOTE_LINE_BREAK = "\r\n"; // one "label : value" per line, as the old audit notes

// The lines of a note joined with a line break.
export const joinNote = (lines: string[]): string => lines.join(NOTE_LINE_BREAK);

export const userAuditWith = async (db: Db, entry: UserAuditEntry): Promise<void> => {
  await db.query("CALL dbo.sp_useraudit($1, $2, $3, $4, $5, $6, $7, $8, $9)", [
    entry.PstrCoID,
    entry.PstrYear,
    entry.lkpBranch,
    entry.Type,
    entry.txtDocNo,
    entry.screenName,
    entry.action,
    entry.note,
    entry.PstrUserID,
  ]);
};

export const userAudit = (entry: UserAuditEntry) => userAuditWith(pool, entry);
