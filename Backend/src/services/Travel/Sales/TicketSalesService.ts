// services/Travel/Sales/TicketSalesService.ts
// Data access for the Ticket Sales screen (the port of the old frmTktSales / clsTktSales). The rules are in the procedures
//   dbo.sp_pageticketsales   the ticket           (dbo.tblticketsales)
//   dbo.sp_pageticketsalesb  its customer line    (dbo.tblticketsalesb)
// (sql/ticketsales). This file validates the typed values (lengths, dates, numbers) and runs the two procedures in ONE
// transaction: any error rolls both back.
//
// The procedures are called the same way as the other pages (callSp<Form>Page): one function per procedure, a typed
// parameter object whose keys are the element ids of the screen (lkp / txt / dtp, Pstr for the logged-in values), a
// fixed CALL with named arguments (p_<the same key in lower case>) and the values in the same order. The f... columns of
// the tables stay in the procedures.
import type { PoolClient } from "pg";
import pool from "../../../DB/db";
import { joinNote, userAuditWith, type UserAuditAction } from "../../common/UserAuditService";

type Db = Pick<PoolClient, "query">;
type Bag = Record<string, unknown>;

// An error with an HTTP status the controller can send back as it is.
export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

// what the screen sends
export type SaveTicketSalesPayload = {
  PstrCoID: string;
  PstrYear: string;
  PstrUserID?: string; // sent by the screen for the naming; the user that is stored (fcuserid / fmuserid) is the logged-in user of the session

  lines?: unknown[];
  [elementId: string]: unknown;
};

// the ticket that was saved (the key of the row)
export type SavedTicketSales = {
  PstrCoID: string;
  PstrYear: string;
  lkpTktType: string;
  txtTktSLNo: string;
  lkpBranch: string;
};

/* ------------------------------------------------- THE TWO PROCEDURES */

// the key of a ticket: the same in both procedures (the order of the screen: Ticket Type, Ticket No., Branch)
type TicketSalesKey = {
  PstrCoID: string;
  PstrYear: string;
  lkpTktType: string | null;
  txtTktSLNo: string | null;
  lkpBranch: string | null;
  txtRevNo?: number;
  txtSlNo?: number; // Sl. No.: one Ticket No. has a row for each Sl. No. (both tables), so it is part of the key
};

// the values of the ticket (sp_pageticketsales), in the order of the screen
type TicketSalesValues = {
  txtSlNo?: number;
  lkpAirlineNo?: string | null;
  lkpIATA?: string | null;
  dtpDate?: string | null;
  dtpBSPDate?: string | null;
  dtpFlightDate?: string | null;
  dtpReturnDate?: string | null;
  txtPNRNo?: string | null;
  lkpDI?: string | null;
  lkpSupplier?: string | null;
  lkpPaySupplierID?: string | null;
  txtPaxName?: string | null;
  lkpStaffID?: string | null;
  txtBookingGDSLogin?: string | null;
  lkpPaxType?: string | null;
  txtPaxNameId?: string | null;
  lkpVoid?: boolean;
  lkpService?: string | null;
  txtSalesGDSLogin?: string | null;
  txtMobile?: string | null;
  txtEmail?: string | null;
  lkpTrip?: string | null;
  txtTourCode?: string | null;
  txtRoute?: string | null;
  txtClass?: string | null;
  txtDestination?: string | null;
  lkpCNJ?: boolean;
  lkpGDS?: string | null;
  lkpCCType?: string | null;
  txtCarrier?: string | null;
  txtFareBasis?: string | null;
  lkpMerchant?: string | null;
  lkpFOP?: string | null;
  txtGFare?: number;
  txtSupFee?: number;
  txtFeeVat?: number;
  txtFopCash?: number;
  txtSFare?: number;
  lkpALCom?: string | null;
  txtALCom?: number;
  txtSupCom?: number;
  txtFopCc?: number;
  txtTax?: number;
  txtALComAmt?: number;
  txtALCVat?: number;
  txtFopEp?: number;
  txtK7?: number;
  txtSupplierAmt?: number;
  txtKbAmt?: number;
  lkpKbAccount?: string | null;
  txtInvNote?: string | null;
  txtNote?: string | null;
};

// the values of the customer line (sp_pageticketsalesb): the grid columns in the order of the screen, then Ref. 1-4
type TicketSalesBValues = {
  dtpDate?: string | null;
  lkpLineCustomer?: string | null;
  lkpLineDivision?: string | null;
  txtLineBType?: string | null;
  txtLineFare?: number;
  txtLineTax?: number;
  txtLineSChg?: number;
  txtLineVATAmt?: number;
  txtLineSChgV?: number;
  txtLineInvAmt?: number;
  txtLineVATPer?: number;
  txtLineHCharge?: number;
  txtLineHSCVATAmt?: number;
  txtLineMF?: number;
  txtLineMFWOVAT?: number;
  txtLineMFVATAmt?: number;
  txtLineSChgType?: string | null;
  txtLineSChgPer?: number;
  txtRef1?: string | null;
  txtRef2?: string | null;
  txtRef3?: string | null;
  txtRef4?: string | null;
};

type CallParams = {
  strmode: string; // G get | S save | M modify | D delete
  PstrUserID?: string;
  cursorName?: string; // the cursor of mode G
};

const newCursorName = (prefix: string) =>
  `${prefix}_${Date.now()}_${Math.floor(Math.random() * 100000)}`;

// dbo.sp_pageticketsales : the ticket (the fields in the order of the screen, from Ticket Type onwards)
async function callSpTicketSalesPage(
  client: Db,
  p: CallParams & TicketSalesKey & TicketSalesValues,
): Promise<void> {
  await client.query(
    `
    CALL dbo.sp_pageticketsales(
      p_strmode            => $1::varchar,
      p_pstrcoid           => $2::varchar,
      p_pstryear           => $3::varchar,
      p_lkptkttype         => $4::varchar,
      p_txttktslno         => $5::varchar,
      p_txtslno            => $6::smallint,
      p_txtrevno           => $7::smallint,
      p_lkpairlineno       => $8::varchar,
      p_lkpbranch          => $9::varchar,
      p_lkpiata            => $10::varchar,
      p_dtpdate            => $11::date,
      p_dtpbspdate         => $12::date,
      p_dtpflightdate      => $13::date,
      p_dtpreturndate      => $14::date,
      p_txtpnrno           => $15::varchar,
      p_lkpdi              => $16::varchar,
      p_lkpsupplier        => $17::varchar,
      p_lkppaysupplierid   => $18::varchar,
      p_txtpaxname         => $19::varchar,
      p_lkpstaffid         => $20::varchar,
      p_txtbookinggdslogin => $21::varchar,
      p_lkppaxtype         => $22::varchar,
      p_txtpaxnameid       => $23::varchar,
      p_lkpvoid            => $24::boolean,
      p_lkpservice         => $25::varchar,
      p_txtsalesgdslogin   => $26::varchar,
      p_txtmobile          => $27::varchar,
      p_txtemail           => $28::varchar,
      p_lkptrip            => $29::varchar,
      p_txttourcode        => $30::varchar,
      p_txtroute           => $31::varchar,
      p_txtclass           => $32::varchar,
      p_txtdestination     => $33::varchar,
      p_lkpcnj             => $34::boolean,
      p_lkpgds             => $35::varchar,
      p_lkpcctype          => $36::varchar,
      p_txtcarrier         => $37::varchar,
      p_txtfarebasis       => $38::varchar,
      p_lkpmerchant        => $39::varchar,
      p_lkpfop             => $40::varchar,
      p_txtgfare           => $41::numeric,
      p_txtsupfee          => $42::numeric,
      p_txtfeevat          => $43::numeric,
      p_txtfopcash         => $44::numeric,
      p_txtsfare           => $45::numeric,
      p_lkpalcom           => $46::varchar,
      p_txtalcom           => $47::numeric,
      p_txtsupcom          => $48::numeric,
      p_txtfopcc           => $49::numeric,
      p_txttax             => $50::numeric,
      p_txtalcomamt        => $51::numeric,
      p_txtalcvat          => $52::numeric,
      p_txtfopep           => $53::numeric,
      p_txtk7              => $54::numeric,
      p_txtsupplieramt     => $55::numeric,
      p_txtkbamt           => $56::integer,
      p_lkpkbaccount       => $57::varchar,
      p_txtinvnote         => $58::varchar,
      p_txtnote            => $59::varchar,
      p_pstruserid         => $60::varchar,
      p_result_cursor      => $61::refcursor
    )
    `,
    [
      p.strmode,
      p.PstrCoID,
      p.PstrYear,
      p.lkpTktType ?? null,
      p.txtTktSLNo ?? null,
      p.txtSlNo ?? 1,
      p.txtRevNo ?? 1,
      p.lkpAirlineNo ?? null,
      p.lkpBranch ?? null,
      p.lkpIATA ?? null,
      p.dtpDate ?? null,
      p.dtpBSPDate ?? null,
      p.dtpFlightDate ?? null,
      p.dtpReturnDate ?? null,
      p.txtPNRNo ?? null,
      p.lkpDI ?? null,
      p.lkpSupplier ?? null,
      p.lkpPaySupplierID ?? null,
      p.txtPaxName ?? null,
      p.lkpStaffID ?? null,
      p.txtBookingGDSLogin ?? null,
      p.lkpPaxType ?? null,
      p.txtPaxNameId ?? null,
      p.lkpVoid ?? false,
      p.lkpService ?? null,
      p.txtSalesGDSLogin ?? null,
      p.txtMobile ?? null,
      p.txtEmail ?? null,
      p.lkpTrip ?? null,
      p.txtTourCode ?? null,
      p.txtRoute ?? null,
      p.txtClass ?? null,
      p.txtDestination ?? null,
      p.lkpCNJ ?? false,
      p.lkpGDS ?? null,
      p.lkpCCType ?? null,
      p.txtCarrier ?? null,
      p.txtFareBasis ?? null,
      p.lkpMerchant ?? null,
      p.lkpFOP ?? null,
      p.txtGFare ?? 0,
      p.txtSupFee ?? 0,
      p.txtFeeVat ?? 0,
      p.txtFopCash ?? 0,
      p.txtSFare ?? 0,
      p.lkpALCom ?? null,
      p.txtALCom ?? 0,
      p.txtSupCom ?? 0,
      p.txtFopCc ?? 0,
      p.txtTax ?? 0,
      p.txtALComAmt ?? 0,
      p.txtALCVat ?? 0,
      p.txtFopEp ?? 0,
      p.txtK7 ?? 0,
      p.txtSupplierAmt ?? 0,
      p.txtKbAmt ?? 0,
      p.lkpKbAccount ?? null,
      p.txtInvNote ?? null,
      p.txtNote ?? null,
      p.PstrUserID ?? null,
      p.cursorName ?? newCursorName("cur_ticketsales"),
    ],
  );
}

// dbo.sp_pageticketsalesb : the customer line of the ticket (the grid columns in the order of the screen)
async function callSpTicketSalesBPage(
  client: Db,
  p: CallParams & TicketSalesKey & TicketSalesBValues,
): Promise<void> {
  await client.query(
    `
    CALL dbo.sp_pageticketsalesb(
      p_strmode          => $1::varchar,
      p_pstrcoid         => $2::varchar,
      p_pstryear         => $3::varchar,
      p_lkptkttype       => $4::varchar,
      p_txttktslno       => $5::varchar,
      p_txtrevno         => $6::smallint,
      p_lkpbranch        => $7::varchar,
      p_dtpdate          => $8::date,
      p_lkplinecustomer  => $9::varchar,
      p_lkplinedivision  => $10::varchar,
      p_txtlinebtype     => $11::varchar,
      p_txtlinefare      => $12::numeric,
      p_txtlinetax       => $13::numeric,
      p_txtlineschg      => $14::numeric,
      p_txtlinevatamt    => $15::numeric,
      p_txtlineschgv     => $16::numeric,
      p_txtlineinvamt    => $17::numeric,
      p_txtlinevatper    => $18::numeric,
      p_txtlinehcharge   => $19::numeric,
      p_txtlinehscvatamt => $20::numeric,
      p_txtlinemf        => $21::numeric,
      p_txtlinemfwovat   => $22::numeric,
      p_txtlinemfvatamt  => $23::numeric,
      p_txtlineschgtype  => $24::varchar,
      p_txtlineschgper   => $25::numeric,
      p_txtref1          => $26::varchar,
      p_txtref2          => $27::varchar,
      p_txtref3          => $28::varchar,
      p_txtref4          => $29::varchar,
      p_pstruserid       => $30::varchar,
      p_result_cursor    => $31::refcursor,
      p_txtslno          => $32::smallint
    )
    `,
    [
      p.strmode,
      p.PstrCoID,
      p.PstrYear,
      p.lkpTktType ?? null,
      p.txtTktSLNo ?? null,
      p.txtRevNo ?? 1,
      p.lkpBranch ?? null,
      p.dtpDate ?? null,
      p.lkpLineCustomer ?? null,
      p.lkpLineDivision ?? null,
      p.txtLineBType ?? null,
      p.txtLineFare ?? 0,
      p.txtLineTax ?? 0,
      p.txtLineSChg ?? 0,
      p.txtLineVATAmt ?? 0,
      p.txtLineSChgV ?? 0,
      p.txtLineInvAmt ?? 0,
      p.txtLineVATPer ?? 0,
      p.txtLineHCharge ?? 0,
      p.txtLineHSCVATAmt ?? 0,
      p.txtLineMF ?? 0,
      p.txtLineMFWOVAT ?? 0,
      p.txtLineMFVATAmt ?? 0,
      p.txtLineSChgType ?? null,
      p.txtLineSChgPer ?? 0,
      p.txtRef1 ?? null,
      p.txtRef2 ?? null,
      p.txtRef3 ?? null,
      p.txtRef4 ?? null,
      p.PstrUserID ?? null,
      p.cursorName ?? newCursorName("cur_ticketsalesb"),
      p.txtSlNo ?? 1,
    ],
  );
}

/* ---------------------------------------------------------- VALIDATION */

const text = (value: unknown): string =>
  typeof value === "string" ? value.trim() : "";

// "" -> null; longer than the column -> a message, not a database error
const textOrNull = (value: unknown, max: number, label: string): string | null => {
  const result = text(value);
  if (result === "") return null;
  if (result.length > max) {
    throw new ApiError(400, `${label} can be ${max} characters at most`);
  }
  return result;
};

const money = (value: unknown): number => {
  const parsed =
    typeof value === "number" ? value : Number.parseFloat(String(value ?? ""));
  return Number.isFinite(parsed) ? parsed : 0;
};

// "DD-MM-YYYY" of the screen -> "YYYY-MM-DD" of the database
const dateOrNull = (value: unknown, label: string): string | null => {
  const result = text(value);
  if (result === "") return null;

  const match = /^(\d{2})-(\d{2})-(\d{4})$/.exec(result);
  if (!match) throw new ApiError(400, `${label} must be DD-MM-YYYY`);

  const iso = `${match[3]}-${match[2]}-${match[1]}`;
  const parsed = new Date(`${iso}T00:00:00Z`);
  if (Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== iso) {
    throw new ApiError(400, `${label} is not a valid date`);
  }
  return iso;
};

// the values of the ticket and of its customer line, ready for the procedures
const cleanTicketSales = (payload: SaveTicketSalesPayload) => {
  const PstrCoID = text(payload.PstrCoID);
  const PstrYear = text(payload.PstrYear);

  if (!PstrCoID) throw new ApiError(400, "Company not found");
  if (!PstrYear) throw new ApiError(400, "Year not found");
  if (PstrCoID.length > 3) throw new ApiError(400, "Company can be 3 characters at most");
  if (PstrYear.length > 4) throw new ApiError(400, "Year can be 4 characters at most");

  // one customer line: the table has one row per ticket
  const lines = (Array.isArray(payload.lines) ? payload.lines : []) as Bag[];
  const filled = lines.filter((line) => text(line.lkpLineCustomer) !== "");
  if (filled.length === 0) throw new ApiError(400, "Please select 'Customer'");
  if (filled.length > 1) {
    throw new ApiError(400, "Only one customer line can be saved for a ticket");
  }
  const line = filled[0];

  const dtpDate = dateOrNull(payload.dtpDate, "Date");

  // the ticket key, the same in both procedures
  const key: TicketSalesKey = {
    PstrCoID,
    PstrYear,
    lkpTktType: textOrNull(payload.lkpTktType, 4, "Ticket Type"),
    txtTktSLNo: textOrNull(payload.txtTktSLNo, 12, "Ticket No."),
    lkpBranch: textOrNull(payload.lkpBranch, 3, "Branch"),
  };

  // Sl. No. (fSlNo, a tinyint): empty = 1
  const slNoText = text(payload.txtSlNo);
  const txtSlNo = slNoText === "" ? 1 : Number(slNoText);
  if (!Number.isInteger(txtSlNo) || txtSlNo < 1 || txtSlNo > 255) {
    throw new ApiError(400, "Sl. No. must be a whole number from 1 to 255");
  }
  key.txtSlNo = txtSlNo;

  const ticket: TicketSalesValues = {
    txtSlNo,
    lkpAirlineNo: textOrNull(payload.lkpAirlineNo, 3, "Airline"),
    lkpIATA: textOrNull(payload.lkpIATA, 8, "IATA"),
    dtpDate,
    dtpBSPDate: dateOrNull(payload.dtpBSPDate, "BSP Date"),
    dtpFlightDate: dateOrNull(payload.dtpFlightDate, "Flight Date"),
    dtpReturnDate: dateOrNull(payload.dtpReturnDate, "Return Date"),
    txtPNRNo: textOrNull(payload.txtPNRNo, 10, "PNR"),
    lkpDI: textOrNull(payload.lkpDI, 1, "D/I"),
    lkpSupplier: textOrNull(payload.lkpSupplier, 12, "Supplier"),
    lkpPaySupplierID: textOrNull(payload.lkpPaySupplierID, 12, "Sup. Payment"),
    txtPaxName: textOrNull(payload.txtPaxName, 100, "Pax Name"),
    lkpStaffID: textOrNull(payload.lkpStaffID, 4, "Staff"),
    txtBookingGDSLogin: textOrNull(payload.txtBookingGDSLogin, 6, "Booking GDS Login"),
    lkpPaxType: textOrNull(payload.lkpPaxType, 1, "Pax Type"),
    txtPaxNameId: textOrNull(payload.txtPaxNameId, 20, "Pax ID"),
    lkpVoid: text(payload.lkpVoid) === "Yes",
    lkpService: textOrNull(payload.lkpService, 4, "Service Type"),
    txtSalesGDSLogin: textOrNull(payload.txtSalesGDSLogin, 6, "Sales GDS Login"),
    txtMobile: textOrNull(payload.txtMobile, 20, "Mobile"),
    txtEmail: textOrNull(payload.txtEmail, 50, "E-mail"),
    lkpTrip: textOrNull(payload.lkpTrip, 2, "Trip"),
    txtTourCode: textOrNull(payload.txtTourCode, 15, "Tour Code"),
    txtRoute: textOrNull(payload.txtRoute, 40, "Route"),
    txtClass: textOrNull(payload.txtClass, 8, "Class"),
    txtDestination: textOrNull(payload.txtDestination, 3, "Destination"),
    lkpCNJ: text(payload.lkpCNJ) === "Yes",
    lkpGDS: textOrNull(payload.lkpGDS, 2, "GDS"),
    lkpCCType: textOrNull(payload.lkpCCType, 5, "CC Type"),
    txtCarrier: textOrNull(payload.txtCarrier, 8, "Carrier"),
    txtFareBasis: textOrNull(payload.txtFareBasis, 8, "Fare Basis"),
    lkpMerchant: textOrNull(payload.lkpMerchant, 4, "Merchant"),
    lkpFOP: textOrNull(payload.lkpFOP, 10, "FOP"),
    txtGFare: money(payload.txtGFare),
    txtSupFee: money(payload.txtSupFee),
    txtFeeVat: money(payload.txtFeeVat),
    txtFopCash: money(payload.txtFopCash),
    txtSFare: money(payload.txtSFare),
    lkpALCom: textOrNull(payload.lkpALCom, 2, "A/L Com. type"),
    txtALCom: money(payload.txtALCom),
    txtSupCom: money(payload.txtSupCom),
    txtFopCc: money(payload.txtFopCc),
    txtTax: money(payload.txtTax),
    txtALComAmt: money(payload.txtALComAmt),
    txtALCVat: money(payload.txtALCVat),
    txtFopEp: money(payload.txtFopEp),
    txtK7: money(payload.txtK7), // K7 = the purchase VAT (fpvatamt)
    txtSupplierAmt: money(payload.txtSupplierAmt),
    txtKbAmt: Math.round(money(payload.txtKbAmt)),
    lkpKbAccount: textOrNull(payload.lkpKbAccount, 12, "KB. Account"),
    txtInvNote: textOrNull(payload.txtInvNote, 60, "INV Note"),
    txtNote: textOrNull(payload.txtNote, 100, "Note"),
  };

  const customerLine: TicketSalesBValues = {
    dtpDate,
    lkpLineCustomer: textOrNull(line.lkpLineCustomer, 12, "Customer"),
    lkpLineDivision: textOrNull(line.lkpLineDivision, 4, "Division"),
    txtLineBType: textOrNull(line.txtLineBType, 3, "B.Type"),
    txtLineFare: money(line.txtLineFare),
    txtLineTax: money(line.txtLineTax),
    txtLineSChg: money(line.txtLineSChg),
    txtLineVATAmt: money(line.txtLineVATAmt),
    txtLineSChgV: money(line.txtLineSChgV),
    txtLineInvAmt: money(line.txtLineInvAmt),
    txtLineVATPer: money(line.txtLineVATPer),
    txtLineHCharge: money(line.txtLineHCharge),
    txtLineHSCVATAmt: money(line.txtLineHSCVATAmt),
    txtLineMF: money(line.txtLineMF),
    txtLineMFWOVAT: money(line.txtLineMFWOVAT),
    txtLineMFVATAmt: money(line.txtLineMFVATAmt),
    txtLineSChgType: textOrNull(line.txtLineSChgType, 2, "Service Charge Type"),
    txtLineSChgPer: money(line.txtLineSChgPer),
    txtRef1: textOrNull(payload.txtRef1, 30, "Ref. 1"),
    txtRef2: textOrNull(payload.txtRef2, 30, "Ref. 2"),
    txtRef3: textOrNull(payload.txtRef3, 30, "Ref. 3"),
    txtRef4: textOrNull(payload.txtRef4, 30, "Ref. 4"),
  };

  const saved: SavedTicketSales = {
    PstrCoID,
    PstrYear,
    lkpTktType: key.lkpTktType ?? "",
    txtTktSLNo: key.txtTktSLNo ?? "",
    lkpBranch: key.lkpBranch ?? "",
  };

  return { key, ticket, customerLine, saved };
};

// the key of a save / modify as the key of a load (the ticket type and no. are checked by cleanTicketSales)
const loadKeyOf = (key: TicketSalesKey) => ({
  PstrCoID: key.PstrCoID,
  PstrYear: key.PstrYear,
  lkpTktType: key.lkpTktType ?? "",
  txtTktSLNo: key.txtTktSLNo ?? "",
  lkpBranch: key.lkpBranch,
  txtSlNo: key.txtSlNo,
});

/* ---------------------------------------------------------------- SAVE */

// The two procedures on one connection / transaction (the caller begins, commits and rolls back).
export const saveTicketSalesWith = async (
  db: Db,
  payload: SaveTicketSalesPayload,
  PstrUserID: string,
): Promise<SavedTicketSales> => {
  const { key, ticket, customerLine, saved } = cleanTicketSales(payload);

  // 1) the ticket, 2) its customer line (it needs the ticket)
  await callSpTicketSalesPage(db, { strmode: "S", ...key, ...ticket, PstrUserID });
  await callSpTicketSalesBPage(db, { strmode: "S", ...key, ...customerLine, PstrUserID });

  // the user audit (S): what was saved
  const after = await fetchTicketSalesWith(db, loadKeyOf(key));
  if (after) await writeTicketAudit(db, after, "S", auditSavedNote(after), PstrUserID);

  return saved;
};

// A rule of a procedure (RAISE EXCEPTION, SQLSTATE P0001) -> its message, as it is.
const toApiError = (error: unknown): unknown => {
  if (error instanceof ApiError) return error;

  const pgError = error as { code?: string; message?: string };
  if (pgError?.code === "P0001") return new ApiError(400, pgError.message ?? "");
  if (pgError?.code === "23505") return new ApiError(409, "This ticket already exists");
  if (pgError?.code === "22001") return new ApiError(400, "A value is too long");
  return error;
};

export const saveTicketSales = async (
  payload: SaveTicketSalesPayload,
  PstrUserID: string,
): Promise<SavedTicketSales> => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");
    const saved = await saveTicketSalesWith(client, payload, PstrUserID);
    await client.query("COMMIT");
    return saved;
  } catch (error) {
    try {
      await client.query("ROLLBACK");
    } catch {
      /* ignore */
    }
    throw toApiError(error);
  } finally {
    client.release();
  }
};

/* ------------------------------------------------------------- MODIFY */

// Modify a saved ticket: the same payload as Save, mode M of the two procedures (the ticket, then its customer line).
// The ticket is found by its key (company, year, branch, ticket type, ticket no., revision); fcuserid / fcuserdate stay as
// they were, fmuserid / fmuserdate get the logged-in user and the server date.
export const modifyTicketSalesWith = async (
  db: Db,
  payload: SaveTicketSalesPayload,
  PstrUserID: string,
): Promise<SavedTicketSales> => {
  const { key, ticket, customerLine, saved } = cleanTicketSales(payload);

  // the ticket as it was, for the audit note (a ticket that is not saved is refused by the procedure below)
  const before = await fetchTicketSalesWith(db, loadKeyOf(key));

  await callSpTicketSalesPage(db, { strmode: "M", ...key, ...ticket, PstrUserID });
  await callSpTicketSalesBPage(db, { strmode: "M", ...key, ...customerLine, PstrUserID });

  // the user audit (M): what changed, field by field
  const after = await fetchTicketSalesWith(db, loadKeyOf(key));
  if (before && after) await writeTicketAudit(db, after, "M", auditChangedNote(before, after), PstrUserID);

  return saved;
};

export const modifyTicketSales = async (
  payload: SaveTicketSalesPayload,
  PstrUserID: string,
): Promise<SavedTicketSales> => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");
    const saved = await modifyTicketSalesWith(client, payload, PstrUserID);
    await client.query("COMMIT");
    return saved;
  } catch (error) {
    try {
      await client.query("ROLLBACK");
    } catch {
      /* ignore */
    }
    throw toApiError(error);
  } finally {
    client.release();
  }
};

/* ---------------------------------------------------------------- LOAD */

// the ticket that is asked for (the keys are the element ids of the form, as when it is saved)
export type LoadTicketSalesKey = {
  PstrCoID: string;
  PstrYear: string;
  lkpTktType: string;
  txtTktSLNo: string;
  lkpBranch?: string | null; // the branch of the screen: when the ticket was saved in another branch, that branch is used
  txtSlNo?: number | string | null; // the Sl. No. to show / delete: empty = the first one saved
};

// Sl. No. of a load / delete: empty = null (the first one), else a whole number from 1 to 255
const slNoOrNull = (value: unknown): number | null => {
  const t = text(value === null || value === undefined ? "" : String(value));
  if (t === "") return null;
  const n = Number(t);
  if (!Number.isInteger(n) || n < 1 || n > 255) throw new ApiError(400, "Sl. No. must be a whole number from 1 to 255");
  return n;
};

const toText = (value: unknown): string =>
  value === null || value === undefined ? "" : String(value);

const toNumber = (value: unknown): number => {
  const parsed = Number.parseFloat(String(value ?? ""));
  return Number.isFinite(parsed) ? parsed : 0;
};

const toYesNo = (value: unknown): string => (value === true ? "Yes" : "No");

const round2 = (value: number): number => Math.round((value + Number.EPSILON) * 100) / 100;

// a date of the database -> "DD-MM-YYYY" of the screen (pg gives a timestamp as a local Date)
const toScreenDate = (value: unknown): string => {
  if (!(value instanceof Date) || Number.isNaN(value.getTime())) return "";
  const dd = String(value.getDate()).padStart(2, "0");
  const mm = String(value.getMonth() + 1).padStart(2, "0");
  return `${dd}-${mm}-${value.getFullYear()}`;
};

// the f... columns never leave this file: the screen gets its element ids, in the order of the screen
const mapTicketRow = (r: Bag) => ({
  lkpTktType: toText(r.ftickettypeid),
  txtTktSLNo: toText(r.fticketslno),
  txtSlNo: toNumber(r.fslno),
  lkpAirlineNo: toText(r.fairlineno),
  lkpBranch: toText(r.fbrid),
  lkpIATA: toText(r.fiatacode),
  dtpDate: toScreenDate(r.fdate),
  dtpBSPDate: toScreenDate(r.fbspdate),
  dtpFlightDate: toScreenDate(r.ftraveldate),
  dtpReturnDate: toScreenDate(r.freturndate),
  txtPNRNo: toText(r.fpnr),
  lkpDI: toText(r.fdi),
  lkpSupplier: toText(r.fsupplierid),
  lkpPaySupplierID: toText(r.fpaysupplierid),
  txtPaxName: toText(r.fpaxname),
  lkpStaffID: toText(r.fstaffid),
  txtBookingGDSLogin: toText(r.fbgdsstaffid),
  lkpPaxType: toText(r.fpaxtype),
  txtPaxNameId: toText(r.fpaxid),
  lkpVoid: toYesNo(r.fvoid),
  lkpService: toText(r.fserviceid),
  txtSalesGDSLogin: toText(r.fgdsstaffid),
  txtMobile: toText(r.fmobileno),
  txtEmail: toText(r.femail),
  lkpTrip: toText(r.ftrip),
  txtTourCode: toText(r.ftourcode),
  txtRoute: toText(r.froute),
  txtClass: toText(r.fclass),
  txtDestination: toText(r.fdestid),
  lkpCNJ: toYesNo(r.fcnj),
  lkpGDS: toText(r.fgdsid),
  lkpCCType: toText(r.fcctype),
  txtCarrier: toText(r.fcarrier),
  txtFareBasis: toText(r.ffarebasis),
  lkpMerchant: toText(r.fmerchant),
  lkpFOP: toText(r.ffop),
  txtGFare: toNumber(r.fiataamt),
  txtSupFee: toNumber(r.fsupfee),
  txtFeeVat: toNumber(r.fsupfeevatamt),
  txtFopCash: toNumber(r.fsupplieramtcash),
  txtSFare: toNumber(r.fsellingamt),
  lkpALCom: toText(r.fcommtype),
  txtALCom: toNumber(r.fcommper),
  txtSupCom: toNumber(r.fscommamt),
  txtFopCc: toNumber(r.fsupplieramtcc),
  txtTax: toNumber(r.ftaxamt),
  txtALComAmt: toNumber(r.fcommamt),
  txtALCVat: toNumber(r.fcommvatamt),
  txtFopEp: toNumber(r.fsupplieramtep),
  txtK7: toNumber(r.fpvatamt),
  txtSupplierAmt: toNumber(r.fsupplieramt),
  txtKbAmt: toNumber(r.fkbamt),
  lkpKbAccount: toText(r.fkbaccountid),
  txtInvNote: toText(r.finvnote),
  txtNote: toText(r.fnote),
});

// one customer line (the grid)
const mapLineRow = (r: Bag) => ({
  lkpLineCustomer: toText(r.fcustomerid),
  lkpLineDivision: toText(r.fdivid),
  txtLineBType: toText(r.fbusinesstypeid),
  txtLineFare: toNumber(r.ftotfare),
  txtLineTax: toNumber(r.ftaxamt),
  txtLineSChg: toNumber(r.fagencycharge),
  txtLineVATAmt: toNumber(r.fvatamt),
  txtLineSChgV: toNumber(r.fscvatamt),
  txtLineInvAmt: toNumber(r.fbillingamt),
  txtLineVATPer: toNumber(r.fvatper),
  txtLineHCharge: toNumber(r.fh_agencycharge),
  txtLineHSCVATAmt: toNumber(r.fh_scvatamt),
  txtLineMF: toNumber(r.fmf),
  txtLineMFWOVAT: toNumber(r.fmfwovat),
  txtLineMFVATAmt: toNumber(r.fmfvatamt),
  txtLineSChgType: toText(r.fservicechargetype),
  txtLineSChgPer: toNumber(r.fservicechargeper),
  // CD. Amt. is shown with its VAT: the charge + its VAT
  txtLineCDAmt: round2(toNumber(r.fh_agencycharge) + toNumber(r.fh_scvatamt)),
});

// Ref. 1-4 are kept on the customer line
const mapRefs = (r: Bag) => ({
  txtRef1: toText(r.frefno),
  txtRef2: toText(r.frefno2),
  txtRef3: toText(r.frefno3),
  txtRef4: toText(r.frefno4),
});

export type LoadedTicketSales = { PstrCoID: string; PstrYear: string } & ReturnType<typeof mapTicketRow> &
  ReturnType<typeof mapRefs> & { lines: ReturnType<typeof mapLineRow>[] };

// The ticket (mode G of the two procedures) on one connection / transaction. null = no such ticket.
export const fetchTicketSalesWith = async (
  db: Db,
  key: Partial<LoadTicketSalesKey>,
): Promise<LoadedTicketSales | null> => {
  const PstrCoID = text(key.PstrCoID);
  const PstrYear = text(key.PstrYear);

  if (!PstrCoID) throw new ApiError(400, "Company not found");
  if (!PstrYear) throw new ApiError(400, "Year not found");
  if (PstrCoID.length > 3) throw new ApiError(400, "Company can be 3 characters at most");
  if (PstrYear.length > 4) throw new ApiError(400, "Year can be 4 characters at most");

  const lkpTktType = textOrNull(key.lkpTktType, 4, "Ticket Type");
  const txtTktSLNo = textOrNull(key.txtTktSLNo, 12, "Ticket No.");
  const given = textOrNull(key.lkpBranch, 3, "Branch");
  const givenSlNo = slNoOrNull(key.txtSlNo);

  if (!lkpTktType) throw new ApiError(400, "Please select 'Ticket Type'");
  if (!txtTktSLNo) throw new ApiError(400, "Please enter 'Ticket No.'");

  // the ticket can be in any branch: the branch of the screen first, else the branch it was saved in;
  // a Ticket No. can have several Sl. Nos: the one asked for, else the first one saved
  const found = await db.query(
    `SELECT fbrid, fslno
       FROM dbo.tblticketsales
      WHERE fcoid = $1 AND fyear = $2 AND ftickettypeid = $3 AND fticketslno = $4
        AND ($5::smallint IS NULL OR fslno = $5::smallint)
      ORDER BY fslno, fbrid`,
    [PstrCoID, PstrYear, lkpTktType, txtTktSLNo, givenSlNo],
  );
  if (found.rows.length === 0) return null;

  const txtSlNo = Number(found.rows[0].fslno);
  const branches = found.rows.filter((row) => Number(row.fslno) === txtSlNo).map((row) => String(row.fbrid));
  const lkpBranch = given && branches.includes(given) ? given : branches[0];
  const k = { PstrCoID, PstrYear, lkpTktType, txtTktSLNo, lkpBranch, txtSlNo };

  const ticketCursor = newCursorName("cur_ticketsales");
  await callSpTicketSalesPage(db, { strmode: "G", ...k, cursorName: ticketCursor });
  const ticket = await db.query(`FETCH ALL FROM "${ticketCursor}"`);
  if (ticket.rows.length === 0) return null;

  const lineCursor = newCursorName("cur_ticketsalesb");
  await callSpTicketSalesBPage(db, { strmode: "G", ...k, cursorName: lineCursor });
  const lines = await db.query(`FETCH ALL FROM "${lineCursor}"`);

  return {
    PstrCoID,
    PstrYear,
    ...mapTicketRow(ticket.rows[0]),
    ...mapRefs(lines.rows[0] ?? {}),
    lines: lines.rows.map(mapLineRow),
  };
};

export const fetchTicketSales = async (
  key: Partial<LoadTicketSalesKey>,
): Promise<LoadedTicketSales | null> => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN"); // a cursor lives inside a transaction
    const ticket = await fetchTicketSalesWith(client, key);
    await client.query("COMMIT");
    return ticket;
  } catch (error) {
    try {
      await client.query("ROLLBACK");
    } catch {
      /* ignore */
    }
    throw toApiError(error);
  } finally {
    client.release();
  }
};

/* ------------------------------------------------------------- DELETE */

// Delete a saved ticket (the old cmdDelete_Click): its customer line first, then the ticket (mode D of the two procedures),
// in one transaction. The ticket is searched as for the load: in the branch of the screen first, else in the branch it was
// saved in. A ticket that is invoiced or posted is not deleted.
export const deleteTicketSalesWith = async (
  db: Db,
  key: Partial<LoadTicketSalesKey>,
  PstrUserID: string,
): Promise<SavedTicketSales> => {
  const PstrCoID = text(key.PstrCoID);
  const PstrYear = text(key.PstrYear);

  if (!PstrCoID) throw new ApiError(400, "Company not found");
  if (!PstrYear) throw new ApiError(400, "Year not found");
  if (PstrCoID.length > 3) throw new ApiError(400, "Company can be 3 characters at most");
  if (PstrYear.length > 4) throw new ApiError(400, "Year can be 4 characters at most");

  const lkpTktType = textOrNull(key.lkpTktType, 4, "Ticket Type");
  const txtTktSLNo = textOrNull(key.txtTktSLNo, 12, "Ticket No.");
  const given = textOrNull(key.lkpBranch, 3, "Branch");
  const givenSlNo = slNoOrNull(key.txtSlNo);

  if (!lkpTktType) throw new ApiError(400, "Please select a 'Ticket Type'");
  if (!txtTktSLNo) throw new ApiError(400, "Please input 'Ticket No.'");

  const found = await db.query(
    `SELECT t.fbrid, t.fslno,
            COALESCE(t.fpost, false) AS fpost,
            COALESCE((SELECT bool_or(COALESCE(b.finvoiced, false))
                        FROM dbo.tblticketsalesb AS b
                       WHERE b.fcoid = t.fcoid AND b.fyear = t.fyear AND b.fbrid = t.fbrid
                         AND b.ftickettypeid = t.ftickettypeid AND b.fticketslno = t.fticketslno AND b.fslno = t.fslno
                         AND b.frevno = t.frevno), false) AS finvoiced
       FROM dbo.tblticketsales AS t
      WHERE t.fcoid = $1 AND t.fyear = $2 AND t.ftickettypeid = $3 AND t.fticketslno = $4
        AND ($5::smallint IS NULL OR t.fslno = $5::smallint)
      ORDER BY t.fslno, t.fbrid`,
    [PstrCoID, PstrYear, lkpTktType, txtTktSLNo, givenSlNo],
  );
  if (found.rows.length === 0) {
    throw new ApiError(404, `Ticket ${lkpTktType}-${txtTktSLNo}${givenSlNo ? ` Sl. No. ${givenSlNo}` : ""} not found`);
  }

  // the Sl. No. asked for, else the first one; then the branch of the screen first, else the branch it was saved in
  const slNoRows = found.rows.filter((r) => Number(r.fslno) === Number(found.rows[0].fslno));
  const row = slNoRows.find((r) => String(r.fbrid) === given) ?? slNoRows[0];
  const lkpBranch = String(row.fbrid);
  const txtSlNo = Number(row.fslno);

  if (row.finvoiced === true) {
    throw new ApiError(400, `Ticket ${lkpTktType}-${txtTktSLNo} is invoiced and cannot be deleted`);
  }
  if (row.fpost === true) {
    throw new ApiError(400, `Ticket ${lkpTktType}-${txtTktSLNo} is posted and cannot be deleted`);
  }

  const k = { PstrCoID, PstrYear, lkpTktType, txtTktSLNo, lkpBranch, txtSlNo };

  // the ticket as it was, for the audit note
  const before = await fetchTicketSalesWith(db, k);

  await callSpTicketSalesBPage(db, { strmode: "D", ...k });
  await callSpTicketSalesPage(db, { strmode: "D", ...k });

  // the user audit (D): what was deleted
  if (before) await writeTicketAudit(db, before, "D", auditSavedNote(before), PstrUserID);

  return k;
};

export const deleteTicketSales = async (
  key: Partial<LoadTicketSalesKey>,
  PstrUserID: string,
): Promise<SavedTicketSales> => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");
    const deleted = await deleteTicketSalesWith(client, key, PstrUserID);
    await client.query("COMMIT");
    return deleted;
  } catch (error) {
    try {
      await client.query("ROLLBACK");
    } catch {
      /* ignore */
    }
    throw toApiError(error);
  } finally {
    client.release();
  }
};

/* --------------------------------------------------------- USER AUDIT */

// The user audit of the screen (dbo.sp_useraudit, as in STOCK): one row for every save (S), modify (M) and delete (D),
// written in the same transaction. The screen is its menu caption; the document is Ticket Type + Ticket No. in its branch.
const AUDIT_SCREEN = "Ticket Sales";

// the labels of the screen, by element id
const AUDIT_LABELS: Record<string, string> = {
  lkpTktType: "Ticket Type", txtTktSLNo: "Ticket No.", txtSlNo: "Sl. No.", lkpAirlineNo: "Airline No.", lkpBranch: "Branch",
  lkpIATA: "IATA", dtpDate: "Date", dtpBSPDate: "BSP Date", dtpFlightDate: "Flight Date", dtpReturnDate: "Return Date",
  txtPNRNo: "PNR No.", lkpDI: "D/I", lkpSupplier: "Supplier", lkpPaySupplierID: "Sup. Payment", txtPaxName: "Pax Name",
  lkpStaffID: "Staff", txtBookingGDSLogin: "Booking GDS Login", lkpPaxType: "Pax Type", txtPaxNameId: "Pax ID", lkpVoid: "Void",
  lkpService: "Service Type", txtSalesGDSLogin: "Sales GDS Login", txtMobile: "Mobile", txtEmail: "E-mail", lkpTrip: "Trip",
  txtTourCode: "Tour Code", txtRoute: "Route", txtClass: "Class", txtDestination: "Destination", lkpCNJ: "CNJ", lkpGDS: "GDS",
  lkpCCType: "CC Type", txtCarrier: "Carrier", txtFareBasis: "Fare Basis", lkpMerchant: "Merchant", lkpFOP: "FOP",
  txtGFare: "G. Fare", txtSupFee: "Sup. Fee", txtFeeVat: "Fee VAT", txtFopCash: "FOP Cash", txtSFare: "S. Fare",
  lkpALCom: "A/L Com. Type", txtALCom: "A/L Com.", txtSupCom: "Sup. Com.", txtFopCc: "FOP CC", txtTax: "Tax",
  txtALComAmt: "A/L Com. Amt.", txtALCVat: "A/L C. VAT", txtFopEp: "FOP EP", txtK7: "K7", txtSupplierAmt: "Supplier Amt.",
  txtKbAmt: "KB. Amt.", lkpKbAccount: "KB. Account", txtInvNote: "INV. Note", txtNote: "Note",
  txtRef1: "Ref. 1", txtRef2: "Ref. 2", txtRef3: "Ref. 3", txtRef4: "Ref. 4",
  lkpLineCustomer: "Customer ID", lkpLineDivision: "Division", txtLineBType: "B.Type", txtLineFare: "Customer Fare",
  txtLineTax: "Customer Tax", txtLineCDAmt: "CD. Amt.", txtLineSChg: "S. Chg.", txtLineVATAmt: "VAT Amt.",
  txtLineSChgV: "S. Chg. V.", txtLineMF: "MF", txtLineInvAmt: "Inv. Amt.", txtLineVATPer: "VAT %",
  txtLineHCharge: "CD. Charge", txtLineHSCVATAmt: "CD. VAT", txtLineMFWOVAT: "MF w/o VAT", txtLineMFVATAmt: "MF VAT",
  txtLineSChgType: "S. Chg. Type", txtLineSChgPer: "S. Chg. %",
};

// what a save / delete note lists (the main boxes), in the order of the screen
const AUDIT_SUMMARY_KEYS = [
  "lkpTktType", "txtTktSLNo", "txtSlNo", "lkpBranch", "lkpAirlineNo", "dtpDate", "lkpSupplier", "txtPaxName", "lkpDI",
  "txtGFare", "txtSFare", "txtTax", "txtK7", "txtSupplierAmt", "lkpLineCustomer", "txtLineInvAmt",
];

type AuditView = Record<string, string | number>;

// the ticket, its refs and its customer line as one list of boxes
const auditView = (ticket: LoadedTicketSales): AuditView => {
  const { lines, PstrCoID: _co, PstrYear: _year, ...boxes } = ticket;
  return { ...boxes, ...(lines[0] ?? {}) } as AuditView;
};

const auditShow = (key: string, value: string | number | undefined): string =>
  typeof value === "number" ? (key === "txtSlNo" ? String(value) : value.toFixed(2)) : String(value ?? "");

const auditLabel = (key: string) => AUDIT_LABELS[key] ?? key;

// save / delete: the main boxes
const auditSavedNote = (ticket: LoadedTicketSales): string => {
  const view = auditView(ticket);
  return joinNote(AUDIT_SUMMARY_KEYS.filter((key) => key in view).map((key) => `${auditLabel(key)} : ${auditShow(key, view[key])}`));
};

// modify: every box that is not as it was
const auditChangedNote = (before: LoadedTicketSales, after: LoadedTicketSales): string => {
  const was = auditView(before);
  const now = auditView(after);
  const lines = Object.keys(now)
    .filter((key) => auditShow(key, was[key]) !== auditShow(key, now[key]))
    .map((key) => `${auditLabel(key)} : Changed from ${auditShow(key, was[key])} to ${auditShow(key, now[key])}`);

  return joinNote(lines.length > 0 ? lines : ["No field changed"]);
};

const writeTicketAudit = (
  db: Db,
  ticket: LoadedTicketSales,
  action: UserAuditAction,
  note: string,
  PstrUserID: string,
) =>
  userAuditWith(db, {
    PstrCoID: ticket.PstrCoID,
    PstrYear: ticket.PstrYear,
    lkpBranch: ticket.lkpBranch,
    Type: ticket.lkpTktType,
    txtDocNo: ticket.txtTktSLNo,
    screenName: AUDIT_SCREEN,
    action,
    PstrUserID,
    note,
  });

/* ---------------------------------------------------------- SL. NOS */

// The Sl. Nos saved for a Ticket No. (in any branch) and the next free one: 1 when the ticket is not saved yet, else the
// biggest + 1. The screen shows the next one when the Sl. No. box is cleared.
export type TicketSalesSlNos = { slNos: number[]; next: number };

export const fetchTicketSalesSlNosWith = async (db: Db, key: Partial<LoadTicketSalesKey>): Promise<TicketSalesSlNos> => {
  const PstrCoID = text(key.PstrCoID);
  const PstrYear = text(key.PstrYear);
  const lkpTktType = textOrNull(key.lkpTktType, 4, "Ticket Type");
  const txtTktSLNo = textOrNull(key.txtTktSLNo, 12, "Ticket No.");

  if (!PstrCoID) throw new ApiError(400, "Company not found");
  if (!PstrYear) throw new ApiError(400, "Year not found");
  if (!lkpTktType) throw new ApiError(400, "Please select 'Ticket Type'");
  if (!txtTktSLNo) throw new ApiError(400, "Please enter 'Ticket No.'");

  const { rows } = await db.query(
    `SELECT DISTINCT fslno
       FROM dbo.tblticketsales
      WHERE fcoid = $1 AND fyear = $2 AND ftickettypeid = $3 AND fticketslno = $4
      ORDER BY fslno`,
    [PstrCoID, PstrYear, lkpTktType, txtTktSLNo],
  );
  const slNos = rows.map((row) => Number(row.fslno));
  return { slNos, next: slNos.length === 0 ? 1 : Math.max(...slNos) + 1 };
};

export const fetchTicketSalesSlNos = (key: Partial<LoadTicketSalesKey>) => fetchTicketSalesSlNosWith(pool, key);

/* ----------------------------------------------------------------- VAT */

// the VAT percentages the fares panel needs
export type TicketSalesVat = {
  txtSCVATPer: number; // the service charge VAT % (dbo.getvatper)
  txtCommVATPer: number; // the VAT % on the commission (dbo.getcommvatper)
  chkVATOnCommission: boolean; // the airline has VAT on commission (dbo.getvatoncommission)
};

const DOC_TYPE = "T"; // the document type of Ticket Sales (the old strDocType): fservicetypeid = "T" + D / I = TD, TI

// The three functions on one connection (the caller gives pool or a client).
export const fetchTicketSalesVatWith = async (
  db: Db,
  PstrCoID: string,
  lkpDI: unknown,
  dtpDate: unknown,
  lkpAirlineNo: unknown,
): Promise<TicketSalesVat> => {
  const coId = text(PstrCoID);
  if (!coId) throw new ApiError(400, "Company not found");
  if (coId.length > 3) throw new ApiError(400, "Company can be 3 characters at most");

  const dtpDateIso = dateOrNull(dtpDate, "Date");
  const airlineNo = textOrNull(lkpAirlineNo, 3, "Airline");
  const dorI = text(lkpDI) === "D" ? "D" : "I";

  const { rows } = await db.query(
    `SELECT dbo.getvatper($1::varchar, $2::varchar, $3::varchar, $4::date)   AS vatper,
            dbo.getcommvatper($1::varchar)                                  AS commvatper,
            CASE WHEN $5::varchar IS NULL THEN 0
                 ELSE dbo.getvatoncommission($1::varchar, $5::varchar) END  AS vatoncommission`,
    [coId, DOC_TYPE, dorI, dtpDateIso, airlineNo],
  );

  return {
    txtSCVATPer: Number(rows[0]?.vatper ?? 0),
    txtCommVATPer: Number(rows[0]?.commvatper ?? 0),
    chkVATOnCommission: Number(rows[0]?.vatoncommission ?? 0) === 1,
  };
};

export const fetchTicketSalesVat = (
  PstrCoID: string,
  lkpDI: unknown,
  dtpDate: unknown,
  lkpAirlineNo: unknown,
) => fetchTicketSalesVatWith(pool, PstrCoID, lkpDI, dtpDate, lkpAirlineNo);
