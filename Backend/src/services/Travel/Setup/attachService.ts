import { PoolClient } from "pg";
import  pool  from "../../../DB/db";
import { AttachDto, AttachViewDto } from "../../../types";
import { fromBase64, getMime } from "../../../utils/doxHelper";

const CALL_SQL = `
  CALL dbo.sp_pageservicechgpolydocattach(
    $1::varchar,  -- mode
    $2::varchar,  -- coid
    $3::varchar,  -- accountid
    $4::smallint, -- slno
    $5::varchar,  -- note
    $6::varchar,  -- doxtype
    $7::varchar,  -- doxname
    $8::bytea,    -- dox
    $9::varchar,  -- userid
    $10::smallint,-- original slno
    $11::varchar, -- type
    NULL          -- OUT p_result
  )`;

interface SpArgs {
  mode: string;
  coId: string;
  accountId: string;
  type: string;
  slNo?: number | null;
  note?: string | null;
  doxType?: string | null;
  doxName?: string | null;
  dox?: Buffer | null;
  userId?: string | null;
  originalSlNo?: number | null;
}

// A CALL with an OUT param returns one row: { p_result: <jsonb already parsed> }
async function callSp(client: PoolClient, a: SpArgs): Promise<any> {
  const r = await client.query(CALL_SQL, [
    a.mode,
    a.coId,
    a.accountId,
    a.slNo ?? null,
    a.note ?? null,
    a.doxType ?? null,
    a.doxName ?? null,
    a.dox ?? null,
    a.userId ?? null,
    a.originalSlNo ?? null,
    a.type,
  ]);
  return r.rows[0]?.p_result ?? null;
}

// ---------- GET list: base64 + mime + dataUrl ----------
export async function getAttachments(
  coId: string,
  accountId: string,
  type: string
): Promise<AttachViewDto[]> {
  const client = await pool.connect();
  try {
    const rows: any[] = (await callSp(client, { mode: "G", coId, accountId, type })) ?? [];
    return rows.map((e) => {
      const mimeType = getMime(e.fdoxtype);
      const b64: string | null = e.fdox ?? null;
      return {
        fSlNo: e.fslno,
        fNote: e.fnote ?? null,
        fDoxName: e.fdoxname ?? null,
        fDoxType: e.fdoxtype ?? null,
        mimeType,
        fDox: b64,
        dataUrl: b64 ? `data:${mimeType};base64,${b64}` : null,
      };
    });
  } finally {
    client.release();
  }
}

// ---------- GET one file as raw bytes (streaming endpoint) ----------
export async function getFile(
  coId: string,
  accountId: string,
  type: string,
  slNo: number
): Promise<{ bytes: Buffer; mime: string; name: string } | null> {
  const r = await pool.query(
    `SELECT fdox, fdoxname, fdoxtype
       FROM dbo.tblaccountattach
      WHERE fcoid = $1 AND faccountid = $2 AND ftype = $3 AND fslno = $4`,
    [coId, accountId, type, slNo]
  );
  const row = r.rows[0];
  if (!row || !row.fdox) return null;
  return {
    bytes: row.fdox as Buffer,           // pg returns bytea as Buffer
    mime: getMime(row.fdoxtype),
    name: row.fdoxname ?? "file",
  };
}

// ---------- SAVE: added / modified / deleted in ONE transaction ----------
export async function saveAttachments(
  coId: string,
  accountId: string,
  type: string,
  userId: string,
  items: AttachDto[]
): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    for (const d of items) {
      const base = { coId, accountId, type, userId };
      const common = {
        slNo: d.fSlNo,
        note: d.fNote,
        doxName: d.fDoxName,
        doxType: d.fDoxType,
        dox: fromBase64(d.fDox),
      };

      switch (d.rowState) {
        case "added":
          await callSp(client, { ...base, mode: "S", ...common });
          break;
        case "modified":
          await callSp(client, {
            ...base,
            mode: "M1",
            ...common,
            originalSlNo: d.originalSlNo ?? d.fSlNo,
          });
          break;
        case "deleted":
          await callSp(client, {
            ...base,
            mode: "D1",
            originalSlNo: d.originalSlNo ?? d.fSlNo,
          });
          break;
        default:
          break; // unchanged
      }
    }

    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}