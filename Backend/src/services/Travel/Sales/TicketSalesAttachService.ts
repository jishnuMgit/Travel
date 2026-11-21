// services/Travel/Sales/TicketSalesAttachService.ts
// Ticket Sales - Customer Attach: the files attached to a ticket (the old tblSalesAttach / SP_frmSaleAttach).
//
// The popup only collects the files; they are saved WITH the ticket (save / modify, one transaction), loaded with it and
// deleted with it, as in the old form. The files belong to the ticket (Ticket Type + Ticket No. of a branch).
//
// The checking of the uploaded files (any type, the size limits, the rows of the popup) is COMMON: utils/fileUpload.ts.
import type { PoolClient } from "pg";
import pool from "../../../DB/db";
import { getMime, type AttachRow } from "../../../utils/fileUpload";

type Db = Pick<PoolClient, "query">;

// the ticket the files belong to
export type AttachKey = {
  PstrCoID: string;
  PstrYear: string;
  lkpBranch: string;
  lkpTktType: string;
  txtTktSLNo: string;
};

// a row of the list the page gets (no file content: the file is read when it is viewed); the keys are element ids
export type AttachListItem = {
  txtAttachSlNo: number;
  txtNote: string | null;
  txtDoxName: string | null;
  txtDoxType: string | null;
  txtMimeType: string;
};

const callAttachSp = async (
  db: Db,
  mode: "S" | "M" | "D1" | "D" | "G",
  key: AttachKey,
  p: {
    txtAttachSlNo?: number | null;
    txtOriginalSlNo?: number | null;
    txtNote?: string | null;
    txtDoxName?: string | null;
    txtDoxType?: string | null;
    imgDox?: Buffer | null;
    PstrUserID?: string | null;
    dtpServerDate?: string | null;
    cursorName?: string;
  } = {},
): Promise<void> => {
  await db.query(
    `CALL dbo.sp_pageticketsalesattach(
       p_strmode         => $1::varchar,
       p_pstrcoid        => $2::varchar,
       p_pstryear        => $3::varchar,
       p_lkptkttype      => $4::varchar,
       p_txttktslno      => $5::varchar,
       p_lkpbranch       => $6::varchar,
       p_txtattachslno   => $7::smallint,
       p_txtoriginalslno => $8::smallint,
       p_txtnote         => $9::varchar,
       p_txtdoxname      => $10::varchar,
       p_txtdoxtype      => $11::varchar,
       p_imgdox          => $12::bytea,
       p_pstruserid      => $13::varchar,
       p_dtpserverdate   => $14::timestamp,
       p_result_cursor   => $15::refcursor
     )`,
    [
      mode,
      key.PstrCoID,
      key.PstrYear,
      key.lkpTktType,
      key.txtTktSLNo,
      key.lkpBranch,
      p.txtAttachSlNo ?? null,
      p.txtOriginalSlNo ?? null,
      p.txtNote ?? null,
      p.txtDoxName ?? null,
      p.txtDoxType ?? null,
      p.imgDox ?? null,
      p.PstrUserID ?? null,
      p.dtpServerDate ?? null,
      p.cursorName ?? "ticketsalesattach_cursor",
    ],
  );
};

// Save / modify: the rows that changed, in the transaction of the ticket. A modified line with no file name and no note is
// a removed line; a modified line with no new file keeps its file.
export const saveAttachRowsWith = async (
  db: Db,
  key: AttachKey,
  rows: AttachRow[] | null,
  PstrUserID: string,
  dtpServerDate: string | null,
): Promise<void> => {
  if (!rows) return;

  // the next free line for a row that has none
  const used = await db.query(
    `SELECT COALESCE(MAX(fslno), 0) AS max
       FROM dbo.tblticketsalesattach
      WHERE fcoid = $1 AND fbrid = $2 AND ftickettypeid = $3 AND fticketslno = $4`,
    [key.PstrCoID, key.lkpBranch, key.lkpTktType, key.txtTktSLNo],
  );
  let nextSlNo = Number(used.rows[0]?.max ?? 0) + 1;
  for (const row of rows) {
    if (row.txtRowState === "added" && row.txtAttachSlNo >= nextSlNo) nextSlNo = row.txtAttachSlNo + 1;
  }

  for (const row of rows) {
    const empty = !row.txtDoxName && !row.txtNote && !row.imgDox;

    if (row.txtRowState === "deleted" || (row.txtRowState === "modified" && empty)) {
      if (row.txtOriginalSlNo) await callAttachSp(db, "D1", key, { txtOriginalSlNo: row.txtOriginalSlNo, PstrUserID, dtpServerDate });
      continue;
    }

    if (row.txtRowState === "modified" && row.txtOriginalSlNo) {
      await callAttachSp(db, "M", key, { ...row, PstrUserID, dtpServerDate });
      continue;
    }

    if (empty) continue; // an empty new line
    await callAttachSp(db, "S", key, {
      ...row,
      txtAttachSlNo: row.txtAttachSlNo > 0 ? row.txtAttachSlNo : nextSlNo++,
      PstrUserID,
      dtpServerDate,
    });
  }
};

// Delete ONE line of the ticket at once (the x of the popup). Returns the file name of the line, null = there was no such line.
export const deleteAttachLineWith = async (
  db: Db,
  key: AttachKey,
  txtAttachSlNo: number,
  PstrUserID: string,
  dtpServerDate: string | null,
): Promise<string | null> => {
  const found = await db.query(
    `SELECT fdoxname FROM dbo.tblticketsalesattach
      WHERE fcoid = $1 AND fbrid = $2 AND ftickettypeid = $3 AND fticketslno = $4 AND fslno = $5`,
    [key.PstrCoID, key.lkpBranch, key.lkpTktType, key.txtTktSLNo, txtAttachSlNo],
  );
  if (found.rows.length === 0) return null;

  await callAttachSp(db, "D1", key, { txtOriginalSlNo: txtAttachSlNo, PstrUserID, dtpServerDate });
  return String(found.rows[0].fdoxname ?? "");
};

// Delete: all the files of the ticket (when the last Sl. No. of the ticket is deleted).
export const deleteAttachWith = async (db: Db, key: AttachKey): Promise<void> => {
  await callAttachSp(db, "D", key);
};

// The files of the ticket (no file content). Needs a transaction (a cursor).
export const fetchAttachListWith = async (db: Db, key: AttachKey): Promise<AttachListItem[]> => {
  const cursorName = `cur_ticketsalesattach_${Math.random().toString(36).slice(2, 10)}`;
  await callAttachSp(db, "G", key, { cursorName });
  const result = await db.query(`FETCH ALL FROM "${cursorName}"`);

  return result.rows.map((r) => ({
    txtAttachSlNo: Number(r.fslno),
    txtNote: r.fnote ?? null,
    txtDoxName: r.fdoxname ?? null,
    txtDoxType: r.fdoxtype ?? null,
    txtMimeType: getMime(r.fdoxtype),
  }));
};

// One file, to view / download it.
export const getAttachFile = async (
  key: Omit<AttachKey, "PstrYear">,
  txtAttachSlNo: number,
): Promise<{ bytes: Buffer; mime: string; name: string } | null> => {
  const result = await pool.query(
    `SELECT fdox, fdoxname, fdoxtype
       FROM dbo.tblticketsalesattach
      WHERE fcoid = $1 AND fbrid = $2 AND ftickettypeid = $3 AND fticketslno = $4 AND fslno = $5`,
    [key.PstrCoID, key.lkpBranch, key.lkpTktType, key.txtTktSLNo, txtAttachSlNo],
  );
  const row = result.rows[0];
  if (!row || !row.fdox) return null;
  return { bytes: row.fdox as Buffer, mime: getMime(row.fdoxtype), name: row.fdoxname ?? "file" };
};

