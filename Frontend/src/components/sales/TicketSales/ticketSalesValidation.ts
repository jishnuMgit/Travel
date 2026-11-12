/* =====================================================================
   The validation of the Ticket Sales screen before it is saved: the port of the old frmTktSales
     ValidateMe("S" / "M")  -> validateTicketHeader   (the form, the fares panel, the ticket type / D/I rules)
     ValidateGrid           -> validateTicketLines    (the customer lines)
   The messages are the old ones. The first rule that fails stops the save (an "error"); a few rules of the old form only
   show a message and let the save go on (a "warning"); one asks Yes / No (a "confirm").

   Rules of the old form that are NOT here, because the data they need is not in the database (traveldb):
     the stock check of the ticket no., the active / closed period of the date, the Tour Code check, the X/O No. box,
     Orig. Tkt.No. for a re-issue, the CC / Amex / CTA rules and the Trans Type column, the inactive customer
     (tblaccountcs.fstatus is false for every account).
   ===================================================================== */

export type Issue = {
  message: string;
  focusId?: string; // the element id of the box to put the cursor in (the old form did the same)
};

export type HeaderInput = {
  loginYear: string; // PstrYear of the login

  ticketType: string | null;
  ticketNo: string;
  airline: string | null;
  branch: string | null;
  iata: string | null;
  date: string; // DD-MM-YYYY
  bspDate: string;
  flightDate: string;
  di: string | null; // the D/I box
  isVoid: boolean;
  supplier: string | null;
  supPayment: string | null;
  pax: string;
  staff: string | null;
  trip: string | null;
  route: string;
  destination: string;
  gds: string | null;
  fop: string | null;
  ccType: string | null;
  merchant: string | null;
  alComType: string | null;

  sFare: number;
  tax: number;
  supFee: number;
  k7: number;
  supplierAmt: number;
  kbAmt: number;
  kbAccount: string | null;
  vatPer: number; // the service charge VAT % (the old numPVATPer is the same % by the travel date)

  /** IATA code -> its BSP purchase account (only the IATA codes that have one) */
  iataBspAccounts: Record<string, string>;
  /** the customer lines of the grid */
  lines: { customer: string | null; fare: number; tax: number; invAmt: number }[];
};

const round2 = (value: number) => Math.round((value + Number.EPSILON) * 100) / 100;

// "DD-MM-YYYY" -> { day, month, year } or null
const parseDate = (value: string) => {
  const m = /^(\d{2})-(\d{2})-(\d{4})$/.exec(value.trim());
  return m ? { day: Number(m[1]), month: Number(m[2]), year: Number(m[3]) } : null;
};
const dateNumber = (d: { day: number; month: number; year: number }) => d.year * 10000 + d.month * 100 + d.day;

const isBspType = (type: string | null) => type === "B" || type === "BS" || type === "M";
const isCardFop = (fop: string | null) => fop === "CC" || fop === "CASH+CC";

/* Route: airport codes of 3 characters with a space between them (COK BEH, BHK SAU COK), up to 3 codes, upper case.
   The space is put in while typing: "cok beh" -> "COK BEH", "bhksaucok" -> "BHK SAU COK". */
export const ROUTE_MAX_CODES = 3;
export const ROUTE_MAX_LENGTH = ROUTE_MAX_CODES * 4 - 1;
export const formatRoute = (value: string): string => {
  const letters = value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, ROUTE_MAX_CODES * 3);
  return (letters.match(/.{1,3}/g) ?? []).join(" ");
};

/* Destination (the old txtDestID: upper case, 3 characters): an airport code, capital letters whatever is typed. */
export const formatAirportCode = (value: string): string =>
  value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 3);

export type HeaderResult = { error?: Issue; warnings: string[] };

export const validateTicketHeader = (i: HeaderInput): HeaderResult => {
  const warnings: string[] = [];
  const fail = (message: string, focusId?: string): HeaderResult => ({ error: { message, focusId }, warnings });

  if (!i.ticketType) return fail("Please select a 'Ticket Type'", "lkpTktType");
  if (i.ticketNo.trim() === "") return fail("Please input 'Ticket No.'", "txtTktSLNo");
  if (!i.airline) return fail("Please Select 'Airline No.'", "lkpAirlineNo");
  if (!i.branch) return fail("Please select a 'Branch'", "lkpBranch");
  if (!i.iata) return fail("Please select an 'IATA Code'", "lkpIATA");

  // ---- dates
  const date = parseDate(i.date);
  if (!date) return fail("Please select 'Date'", "dtpDate");
  if (String(date.year) !== i.loginYear.trim()) {
    return fail("'Login Year' should be same as 'Transaction Year'", "dtpDate");
  }

  const bspDate = parseDate(i.bspDate);
  if (!bspDate) return fail("Please select 'BSP Date'", "dtpBSPDate");
  if (String(bspDate.year) !== i.loginYear.trim()) {
    return fail("'Login Year' should be same as 'BSP Year'", "dtpBSPDate");
  }
  if (date.month !== bspDate.month) {
    return fail("'Date' & 'BSP Date' should be in same month", "dtpBSPDate");
  }

  const flightDate = parseDate(i.flightDate);
  if (!flightDate) return fail("Please select 'Flight Date'", "dtpFlightDate");
  if (dateNumber(date) > dateNumber(flightDate)) {
    return fail("'Flight Date' should be greater than or equal to 'Date'", "dtpFlightDate");
  }

  // ---- by the ticket type
  if (isBspType(i.ticketType) && i.ticketNo.trim().length < 10) {
    return fail("Ticket Number should be 10 digits width", "txtTktSLNo");
  }

  if (!i.supplier) return fail("Please select a 'Supplier'", "lkpSupplier");
  if (!i.supPayment) return fail("Please select a 'Supplier Payment'", "lkpPaySupplierID");

  if (isBspType(i.ticketType) && i.iata === "NA") {
    return fail("You cannot select 'NA' as 'IATA'", "lkpIATA");
  }
  if (!["B", "BS", "D", "M", "P"].includes(i.ticketType) && i.iata !== "NA") {
    return fail("Please select 'NA' as 'IATA'", "lkpIATA");
  }

  // the supplier of a BSP ticket is the BSP account of its IATA (only when the IATA has one)
  const bspAccount = i.iataBspAccounts[i.iata] ?? "";
  if (bspAccount !== "") {
    if (isBspType(i.ticketType) && i.supplier !== bspAccount) {
      return fail(`Please select '${bspAccount}' as 'Supplier ID'`, "lkpSupplier");
    }
    if (i.iata !== "NA" && (i.ticketType === "D" || i.ticketType === "P") && i.supplier !== bspAccount) {
      return fail(`Please select '${bspAccount}' as 'Supplier ID'`, "lkpSupplier");
    }
  }
  const allBspAccounts = Object.values(i.iataBspAccounts).filter((a) => a !== "");
  if (
    allBspAccounts.includes(i.supplier) &&
    (!["B", "BS", "D", "M", "ADM", "P"].includes(i.ticketType) || i.iata === "NA")
  ) {
    return fail("You cannot select BSP Account ID as 'Supplier ID'", "lkpSupplier");
  }

  if (!i.gds) return fail("Please Select 'GDS'", "lkpGDS");

  // ---- a ticket that is not void needs its passenger and route
  if (i.ticketType !== "P" && !i.isVoid) {
    if (i.pax.trim() === "") return fail("Please input 'Pax'", "txtPaxName");
    if (i.ticketType !== "X" && i.route.trim() === "") return fail("Please input 'Route'", "txtRoute");
  }

  // the Destination is an airport code of 3 characters (BHA)
  if (i.destination.trim() !== "" && i.destination.trim().length !== 3) {
    return fail("'Destination' should be 3 characters, like BHA", "txtDestination");
  }

  // the Route is 2 or 3 airport codes of 3 characters (COK BEH, BHK SAU COK)
  if (i.route.trim() !== "" && !/^[A-Z0-9]{3}( [A-Z0-9]{3}){1,2}$/.test(i.route.trim().toUpperCase())) {
    return fail("'Route' should be 2 or 3 airport codes of 3 characters with a space between them, like BHK SAU COK", "txtRoute");
  }

  // ---- payment
  if (!i.fop) return fail("Please Select 'FOP'", "lkpFOP");
  if (!i.ccType) return fail("Please Select 'CC Type'", "lkpCCType");

  if (isCardFop(i.fop) && (i.merchant === "NA" || !i.merchant)) {
    return fail("Please select Merchant As either Airline Or Travel Agent", "lkpMerchant");
  }
  if (!isCardFop(i.fop) && i.merchant !== "NA" && i.merchant !== "T") {
    return fail("Please Select Merchant As either 'Not Applicable  Or Travel Agent'", "lkpMerchant");
  }

  // ---- the customer lines
  if (i.lines.length === 0) {
    return fail("There is no 'Billing information' for Saving,\nPlease Input the 'Billing information'.");
  }
  if (!i.lines[0].customer) return fail("Please select 'Customer ID'");

  if (!i.staff) return fail("Please select a 'Sales Staff'", "lkpStaffID");
  if (!i.trip) return fail("Please select 'Trip'", "lkpTrip");
  if (!i.alComType) return fail("Please select a 'Commission Type'", "lkpALCom");

  if (round2(i.kbAmt) !== 0 && !i.kbAccount) {
    return fail("Please select 'KB Account.'", "lkpKbAccount");
  }

  // ---- amounts (a ticket that is not void)
  if (!i.isVoid) {
    const fareTotal = round2(i.lines.reduce((t, l) => t + l.fare + l.tax, 0));
    if (fareTotal !== round2(i.sFare + i.tax + i.supFee)) {
      return fail("'Fare Total + Tax Total' should be equal To 'S. Fare' + 'Tax' + 'Sup. Fee'");
    }

    // K7 total: 15 % (the VAT %) of S. Fare + Tax; the old form only shows the message
    if (i.di === "D" && round2(i.k7) !== 0) {
      const expected = round2(((i.sFare + i.tax) * i.vatPer) / 100);
      const difference = round2(i.k7 - expected);
      if (difference !== 0 && Math.abs(difference) !== 0.01) {
        warnings.push(`'K7 Total' should be ${i.vatPer}% of 'S. Fare + Tax'`);
      }
    }

    if (round2(i.supplierAmt) !== 0 && round2(i.k7) === 0 && i.di === "D") {
      return fail("Please input K7 Amt. for Domestic Tickets.", "txtK7");
    }
    if (round2(i.k7) !== 0 && i.di === "I") {
      return fail("You can't input K7 Amt. for International Tickets.", "txtK7");
    }

    const invTotal = round2(i.lines.reduce((t, l) => t + l.invAmt, 0));
    if (invTotal < round2(i.supplierAmt)) {
      warnings.push("'Inv. Amt.' is less than 'Supplier Amt.'");
    }
  }

  return { warnings };
};

/* ---------------------------------------------------------------------
   The customer lines (the old ValidateGrid)
   --------------------------------------------------------------------- */
export type GridRowInput = {
  customer: string | null;
  division: string;
  sChg: number;
  sChgV: number;
  invAmt: number;
};

export type LinesResult = {
  error?: Issue;
  /** a Yes / No question: when the answer is No the save stops */
  confirm?: string;
};

export const validateTicketLines = (
  rows: GridRowInput[],
  opts: { vatPer: number; isVoid: boolean; customerHasDivision: (customerId: string) => boolean },
): LinesResult => {
  let confirm: string | undefined;

  for (const row of rows) {
    if (!row.customer) return { error: { message: "Please select the 'Customer'" } };

    if (row.division === "" && opts.customerHasDivision(row.customer)) {
      return { error: { message: "Please select Division" } };
    }

    if (round2(row.sChg) < 0) return { error: { message: "'S. Chg.' cannot be Negative" } };
    if (round2(row.invAmt) < 0) return { error: { message: "'Inv. Amt.' cannot be Negative" } };

    if (opts.vatPer !== 0 && round2(row.sChg) !== 0 && Math.abs(row.sChg) >= 1 && round2(row.sChgV) === 0) {
      return { error: { message: "Service Charge VAT not found. Please Input Service Charge Again" } };
    }

    if (!opts.isVoid && round2(row.sChg) === 0 && confirm === undefined) {
      confirm = "Service Charge found zero. Do you want to continue?";
    }
  }

  return { confirm };
};
