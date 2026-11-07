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
  lines?: unknown[];
  [elementId: string]: unknown;
};

// the ticket that was saved (the key of the row)
export type SavedTicketSales = {
  PstrCoID: string;
  PstrYear: string;
  lkpBranch: string;
  lkpTktType: string;
  txtTktSLNo: string;
};

/* ------------------------------------------------- THE TWO PROCEDURES */

// the key of a ticket: the same in both procedures
type TicketSalesKey = {
  PstrCoID: string;
  PstrYear: string;
  lkpBranch: string | null;
  lkpTktType: string | null;
  txtTktSLNo: string | null;
  txtRevNo?: number;
};

// the values of the ticket (sp_pageticketsales)
type TicketSalesValues = {
  lkpIATA?: string | null;
  lkpAirlineNo?: string | null;
  dtpDate?: string | null;
  dtpBSPDate?: string | null;
  dtpFlightDate?: string | null;
  dtpReturnDate?: string | null;
  lkpDI?: string | null;
  lkpVoid?: boolean;
  lkpSupplier?: string | null;
  lkpPaySupplierID?: string | null;
  txtPaxName?: string | null;
  lkpStaffID?: string | null;
  txtMobile?: string | null;
  lkpPaxType?: string | null;
  lkpService?: string | null;
  txtPNRNo?: string | null;
  txtEmail?: string | null;
  txtPaxNameId?: string | null;
  lkpTrip?: string | null;
  txtTourCode?: string | null;
  txtRoute?: string | null;
  txtClass?: string | null;
  lkpFOP?: string | null;
  txtDestination?: string | null;
  lkpCNJ?: boolean;
  lkpGDS?: string | null;
  lkpCCType?: string | null;
  txtCarrier?: string | null;
  txtFareBasis?: string | null;
  lkpMerchant?: string | null;
  txtFopCash?: number;
  txtFopCc?: number;
  txtFopEp?: number;
  txtGFare?: number;
  txtSFare?: number;
  txtTax?: number;
  txtK7?: number;
  txtSupFee?: number;
  lkpALCom?: string | null;
  txtALCom?: number;
  txtFeeVat?: number;
  txtSupCom?: number;
  txtALComAmt?: number;
  txtALCVat?: number;
  txtSupplierAmt?: number;
  txtKbAmt?: number;
  lkpKbAccount?: string | null;
  txtInvNote?: string | null;
  txtNote?: string | null;
};

// the values of the customer line (sp_pageticketsalesb)
type TicketSalesBValues = {
  dtpDate?: string | null;
  lkpLineCustomer?: string | null;
  lkpLineDivision?: string | null;
  txtLineBType?: string | null;
  txtLineFare?: number;
  txtLineTax?: number;
  txtLineSChg?: number;
  txtLineSChgV?: number;
  txtLineVATAmt?: number;
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

// dbo.sp_pageticketsales : the ticket
async function callSpTicketSalesPage(
  client: Db,
  p: CallParams & TicketSalesKey & TicketSalesValues,
): Promise<void> {
  await client.query(
    `
    CALL dbo.sp_pageticketsales(
      p_strmode          => $1::varchar,
      p_pstrcoid         => $2::varchar,
      p_pstryear         => $3::varchar,
      p_lkpbranch      => $4::varchar,
      p_lkptkttype       => $5::varchar,
      p_txttktslno       => $6::varchar,
      p_txtrevno         => $7::smallint,
      p_lkpiata      => $8::varchar,
      p_lkpairlineno     => $9::varchar,
      p_dtpdate          => $10::date,
      p_dtpbspdate       => $11::date,
      p_dtpflightdate    => $12::date,
      p_dtpreturndate    => $13::date,
      p_lkpdi            => $14::varchar,
      p_lkpvoid          => $15::boolean,
      p_lkpsupplier    => $16::varchar,
      p_lkppaysupplierid => $17::varchar,
      p_txtpaxname       => $18::varchar,
      p_lkpstaffid       => $19::varchar,
      p_txtmobile        => $20::varchar,
      p_lkppaxtype       => $21::varchar,
      p_lkpservice       => $22::varchar,
      p_txtpnrno         => $23::varchar,
      p_txtemail         => $24::varchar,
      p_txtpaxnameid     => $25::varchar,
      p_lkptrip          => $26::varchar,
      p_txttourcode      => $27::varchar,
      p_txtroute         => $28::varchar,
      p_txtclass         => $29::varchar,
      p_lkpfop           => $30::varchar,
      p_txtdestination   => $31::varchar,
      p_lkpcnj           => $32::boolean,
      p_lkpgds           => $33::varchar,
      p_lkpcctype        => $34::varchar,
      p_txtcarrier       => $35::varchar,
      p_txtfarebasis     => $36::varchar,
      p_lkpmerchant      => $37::varchar,
      p_txtfopcash       => $38::numeric,
      p_txtfopcc         => $39::numeric,
      p_txtfopep         => $40::numeric,
      p_txtgfare         => $41::numeric,
      p_txtsfare         => $42::numeric,
      p_txttax           => $43::numeric,
      p_txtk7            => $44::numeric,
      p_txtsupfee        => $45::numeric,
      p_lkpalcom     => $46::varchar,
      p_txtalcom         => $47::numeric,
      p_txtfeevat        => $48::numeric,
      p_txtsupcom        => $49::numeric,
      p_txtalcomamt      => $50::numeric,
      p_txtalcvat        => $51::numeric,
      p_txtsupplieramt   => $52::numeric,
      p_txtkbamt         => $53::integer,
      p_lkpkbaccount     => $54::varchar,
      p_txtinvnote       => $55::varchar,
      p_txtnote          => $56::varchar,
      p_pstruserid       => $57::varchar,
      p_result_cursor    => $58::refcursor
    )
    `,
    [
      p.strmode,
      p.PstrCoID,
      p.PstrYear,
      p.lkpBranch ?? null,
      p.lkpTktType ?? null,
      p.txtTktSLNo ?? null,
      p.txtRevNo ?? 1,
      p.lkpIATA ?? null,
      p.lkpAirlineNo ?? null,
      p.dtpDate ?? null,
      p.dtpBSPDate ?? null,
      p.dtpFlightDate ?? null,
      p.dtpReturnDate ?? null,
      p.lkpDI ?? null,
      p.lkpVoid ?? false,
      p.lkpSupplier ?? null,
      p.lkpPaySupplierID ?? null,
      p.txtPaxName ?? null,
      p.lkpStaffID ?? null,
      p.txtMobile ?? null,
      p.lkpPaxType ?? null,
      p.lkpService ?? null,
      p.txtPNRNo ?? null,
      p.txtEmail ?? null,
      p.txtPaxNameId ?? null,
      p.lkpTrip ?? null,
      p.txtTourCode ?? null,
      p.txtRoute ?? null,
      p.txtClass ?? null,
      p.lkpFOP ?? null,
      p.txtDestination ?? null,
      p.lkpCNJ ?? false,
      p.lkpGDS ?? null,
      p.lkpCCType ?? null,
      p.txtCarrier ?? null,
      p.txtFareBasis ?? null,
      p.lkpMerchant ?? null,
      p.txtFopCash ?? 0,
      p.txtFopCc ?? 0,
      p.txtFopEp ?? 0,
      p.txtGFare ?? 0,
      p.txtSFare ?? 0,
      p.txtTax ?? 0,
      p.txtK7 ?? 0,
      p.txtSupFee ?? 0,
      p.lkpALCom ?? null,
      p.txtALCom ?? 0,
      p.txtFeeVat ?? 0,
      p.txtSupCom ?? 0,
      p.txtALComAmt ?? 0,
      p.txtALCVat ?? 0,
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

// dbo.sp_pageticketsalesb : the customer line of the ticket
async function callSpTicketSalesBPage(
  client: Db,
  p: CallParams & TicketSalesKey & TicketSalesBValues,
): Promise<void> {
  await client.query(
    `
    CALL dbo.sp_pageticketsalesb(
      p_strmode         => $1::varchar,
      p_pstrcoid        => $2::varchar,
      p_pstryear        => $3::varchar,
      p_lkpbranch     => $4::varchar,
      p_lkptkttype      => $5::varchar,
      p_txttktslno      => $6::varchar,
      p_txtrevno        => $7::smallint,
      p_dtpdate         => $8::date,
      p_lkplinecustomer => $9::varchar,
      p_lkplinedivision => $10::varchar,
      p_txtlinebtype    => $11::varchar,
      p_txtlinefare     => $12::numeric,
      p_txtlinetax      => $13::numeric,
      p_txtlineschg     => $14::numeric,
      p_txtlineschgv    => $15::numeric,
      p_txtlinevatamt   => $16::numeric,
      p_txtlineinvamt   => $17::numeric,
      p_txtlinevatper   => $18::numeric,
      p_txtlinehcharge  => $19::numeric,
      p_txtlinehscvatamt => $20::numeric,
      p_txtlinemf       => $21::numeric,
      p_txtlinemfwovat  => $22::numeric,
      p_txtlinemfvatamt => $23::numeric,
      p_txtlinesctype   => $24::varchar,
      p_txtlinescper    => $25::numeric,
      p_txtref1         => $26::varchar,
      p_txtref2         => $27::varchar,
      p_txtref3         => $28::varchar,
      p_txtref4         => $29::varchar,
      p_pstruserid      => $30::varchar,
      p_result_cursor   => $31::refcursor
    )
    `,
    [
      p.strmode,
      p.PstrCoID,
      p.PstrYear,
      p.lkpBranch ?? null,
      p.lkpTktType ?? null,
      p.txtTktSLNo ?? null,
      p.txtRevNo ?? 1,
      p.dtpDate ?? null,
      p.lkpLineCustomer ?? null,
      p.lkpLineDivision ?? null,
      p.txtLineBType ?? null,
      p.txtLineFare ?? 0,
      p.txtLineTax ?? 0,
      p.txtLineSChg ?? 0,
      p.txtLineSChgV ?? 0,
      p.txtLineVATAmt ?? 0,
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
    lkpBranch: textOrNull(payload.lkpBranch, 3, "Branch"),
    lkpTktType: textOrNull(payload.lkpTktType, 4, "Ticket Type"),
    txtTktSLNo: textOrNull(payload.txtTktSLNo, 12, "Ticket No."),
  };

  const ticket: TicketSalesValues = {
    lkpIATA: textOrNull(payload.lkpIATA, 8, "IATA"),
    lkpAirlineNo: textOrNull(payload.lkpAirlineNo, 3, "Airline"),
    dtpDate,
    dtpBSPDate: dateOrNull(payload.dtpBSPDate, "BSP Date"),
    dtpFlightDate: dateOrNull(payload.dtpFlightDate, "Flight Date"),
    dtpReturnDate: dateOrNull(payload.dtpReturnDate, "Return Date"),
    lkpDI: textOrNull(payload.lkpDI, 1, "D/I"),
    lkpVoid: text(payload.lkpVoid) === "Yes",
    lkpSupplier: textOrNull(payload.lkpSupplier, 12, "Supplier"),
    lkpPaySupplierID: textOrNull(payload.lkpPaySupplierID, 12, "Sup. Payment"),
    txtPaxName: textOrNull(payload.txtPaxName, 100, "Pax Name"),
    lkpStaffID: textOrNull(payload.lkpStaffID, 4, "Staff"),
    txtMobile: textOrNull(payload.txtMobile, 20, "Mobile"),
    lkpPaxType: textOrNull(payload.lkpPaxType, 1, "Pax Type"),
    lkpService: textOrNull(payload.lkpService, 4, "Service Type"),
    txtPNRNo: textOrNull(payload.txtPNRNo, 10, "PNR"),
    txtEmail: textOrNull(payload.txtEmail, 50, "E-mail"),
    txtPaxNameId: textOrNull(payload.txtPaxNameId, 20, "Pax ID"),
    lkpTrip: textOrNull(payload.lkpTrip, 2, "Trip"),
    txtTourCode: textOrNull(payload.txtTourCode, 15, "Tour Code"),
    txtRoute: textOrNull(payload.txtRoute, 40, "Route"),
    txtClass: textOrNull(payload.txtClass, 8, "Class"),
    lkpFOP: textOrNull(payload.lkpFOP, 10, "FOP"),
    txtDestination: textOrNull(payload.txtDestination, 3, "Destination"),
    lkpCNJ: text(payload.lkpCNJ) === "Yes",
    lkpGDS: textOrNull(payload.lkpGDS, 2, "GDS"),
    lkpCCType: textOrNull(payload.lkpCCType, 5, "CC Type"),
    txtCarrier: textOrNull(payload.txtCarrier, 8, "Carrier"),
    txtFareBasis: textOrNull(payload.txtFareBasis, 8, "Fare Basis"),
    lkpMerchant: textOrNull(payload.lkpMerchant, 4, "Merchant"),
    txtFopCash: money(payload.txtFopCash),
    txtFopCc: money(payload.txtFopCc),
    txtFopEp: money(payload.txtFopEp),
    txtGFare: money(payload.txtGFare),
    txtSFare: money(payload.txtSFare),
    txtTax: money(payload.txtTax),
    txtK7: money(payload.txtK7), // K7 = the purchase VAT (fpvatamt)
    txtSupFee: money(payload.txtSupFee),
    lkpALCom: textOrNull(payload.lkpALCom, 2, "A/L Com. type"),
    txtALCom: money(payload.txtALCom),
    txtFeeVat: money(payload.txtFeeVat),
    txtSupCom: money(payload.txtSupCom),
    txtALComAmt: money(payload.txtALComAmt),
    txtALCVat: money(payload.txtALCVat),
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
    txtLineSChgV: money(line.txtLineSChgV),
    txtLineVATAmt: money(line.txtLineVATAmt),
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
    lkpBranch: key.lkpBranch ?? "",
    lkpTktType: key.lkpTktType ?? "",
    txtTktSLNo: key.txtTktSLNo ?? "",
  };

  return { key, ticket, customerLine, saved };
};

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
