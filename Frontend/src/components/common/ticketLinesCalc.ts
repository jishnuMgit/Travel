/* =====================================================================
   The calculations of the customer grid of Ticket Sales
   (the old frmTktSales: CalcCustomerVATAmt, CalcCustomerVATAmt_RowWise, CalcINVAmt, CalCustomerSCharge,
   CalcMF and CalcProfitAmt). Pure functions, so they can be tested without the screen.
   ===================================================================== */

export const round2 = (value: number) =>
  Math.round((value + Number.EPSILON) * 100) / 100;

export type DorI = "D" | "I";

/* What a row is worked out from. Amounts are numbers. */
export type LineInput = {
  fare: number;
  tax: number;
  cdAmt: number; // CD. Amt.: the "agency charge" of the home office, VAT included (old fH_AgencyChargeWVAT)
  sChg: number; // S. Chg.: the service charge of the customer (without VAT)
  prevVatAmt: number; // the VAT Amt. the row had (kept when only 0.01 different, as the old form)
  prevSChgV: number; // the S. Chg. V. the row had
  mfPer: number; // the merchant fee % of the customer's policy
};

export type LineContext = {
  dorI: DorI; // D when the D/I box is D or K7 is entered (the old strDorI): used for the VAT
  boxDorI?: DorI; // the D/I box only (the old lkpDorI.Text): used for the CD. Amt. split; defaults to dorI
  vatPer: number; // the service charge VAT % (dbo.getvatper)
  merchantIsAirline: boolean; // the Merchant is "A" (Airline)
};

export type LineAmounts = {
  sChgV: number;
  vatAmt: number;
  hCharge: number; // CD. Amt. without VAT
  hScVat: number; // the VAT of CD. Amt.
  mf: number;
  mfWoVat: number;
  mfVat: number;
  invAmt: number;
};

export const calcLineAmounts = (input: LineInput, ctx: LineContext): LineAmounts => {
  const { fare, tax, cdAmt, sChg, prevVatAmt, prevSChgV, mfPer } = input;
  const { dorI, vatPer, merchantIsAirline } = ctx;
  const boxDorI = ctx.boxDorI ?? dorI;

  // S. Chg. V.: the VAT of the service charge
  let sChgV = sChg !== 0 ? round2(sChg * vatPer * 0.01) : 0;

  // VAT Amt.: domestic = on Fare + Tax + S. Chg., international = on S. Chg. only
  const vatBase = dorI === "D" ? fare + tax + sChg : sChg;
  let vatAmt = vatBase !== 0 ? round2(vatBase * vatPer * 0.01) : 0;

  // the old rounding rules (a difference of exactly 0.01)
  const calcDiff = round2(sChgV - vatAmt);
  if (calcDiff === 0.01) vatAmt = round2(vatAmt + 0.01);
  else if (calcDiff === -0.01) vatAmt = round2(vatAmt - 0.01);

  if (prevVatAmt !== 0 && vatAmt !== 0 && Math.abs(round2(prevVatAmt - vatAmt)) === 0.01) {
    vatAmt = prevVatAmt;
  }
  if (prevSChgV !== 0 && sChgV !== 0 && Math.abs(round2(prevSChgV - sChgV)) === 0.01) {
    sChgV = prevSChgV;
  }

  // CD. Amt. includes VAT: split it into the charge and its VAT
  let hCharge = 0;
  let hScVat = 0;
  if (cdAmt !== 0) {
    if (cdAmt > 0 || boxDorI === "D") {
      hCharge = round2((cdAmt / (100 + vatPer)) * 100);
      hScVat = round2(cdAmt - hCharge);
    } else {
      hCharge = cdAmt; // an international negative amount has no VAT
    }
  }

  // MF: the merchant fee of the customer's policy
  let mf = 0;
  if (mfPer !== 0) {
    const mfBase = merchantIsAirline
      ? sChg + sChgV
      : fare + tax + sChg + vatAmt + cdAmt;
    mf = mfBase !== 0 ? round2(mfBase * mfPer * 0.01) : 0;
  }
  const mfWoVat = mf !== 0 ? round2((mf / (100 + vatPer)) * 100) : 0;
  const mfVat = mf !== 0 ? round2(mf - mfWoVat) : 0;

  // Inv. Amt.
  const invAmt = round2(fare + tax + sChg + hCharge + hScVat + vatAmt + mfWoVat + mfVat);

  return { sChgV, vatAmt, hCharge, hScVat, mf, mfWoVat, mfVat, invAmt };
};

/* The service charge policy of a customer + service (a row of dbo.tblservicechargepolicy, fsr = S). */
type NumLike = number | string | null; // the database gives numbers as text

export type ServiceChargePolicy = {
  fcustomerid: string;
  fservicetypeid: string;
  fmf: NumLike;
  fd_servicechargetype: string | null;
  fd_servicechgper: NumLike;
  fd_minservicechgamt: NumLike;
  fd_servicechgamt: NumLike;
  fi_servicechargetype: string | null;
  fi_servicechgper: NumLike;
  fi_minservicechgamt: NumLike;
  fi_servicechgamt: NumLike;
};

/* What the grid needs to know from the Ticket Sales form (the fares panel and the header). */
export type TicketLinesContext = {
  sFare: number;
  supFee: number;
  tax: number;
  dorI: DorI; // for the VAT (the D/I box, or D when K7 is entered)
  boxDorI: DorI; // the D/I box only: the policy rate and the CD. Amt. split follow it (the old lkpDorI.Text)
  vatPer: number;
  serviceId: string;
  merchantIsAirline: boolean;
  isVoid: boolean; // the Void box is Yes
  supplierAmt: number; // for Profit Amt.
  feeVat: number;
  k7: number;
};

export type PolicyCharge = {
  amount: number; // S. Chg.
  per: number; // the service charge %
  type: string; // "A" = by amount, "P" = by percentage, "" = no policy
};

const num = (value: number | string | null | undefined) => {
  const parsed = typeof value === "number" ? value : parseFloat(String(value ?? ""));
  return Number.isFinite(parsed) ? parsed : 0;
};

/* CalCustomerSCharge: by amount, or a percentage of (Fare + Tax) with a minimum. */
export const calcPolicyCharge = (
  policy: ServiceChargePolicy | undefined,
  dorI: DorI,
  fare: number,
  tax: number,
): PolicyCharge => {
  if (!policy) return { amount: 0, per: 0, type: "" };

  const domestic = dorI === "D";
  const type = (domestic ? policy.fd_servicechargetype : policy.fi_servicechargetype) ?? "";
  let amount = 0;
  let per = 0;
  let minAmt = 0;

  if (type === "A") {
    amount = num(domestic ? policy.fd_servicechgamt : policy.fi_servicechgamt);
  } else {
    per = num(domestic ? policy.fd_servicechgper : policy.fi_servicechgper);
    minAmt = num(domestic ? policy.fd_minservicechgamt : policy.fi_minservicechgamt);
  }

  if (amount === 0 && per > 0) {
    amount = round2(((fare + tax) * per) / 100);
    if (minAmt !== 0 && amount < minAmt) amount = minAmt;
  }

  return { amount, per, type };
};

/* CalcProfitAmt */
export const calcProfitAmt = (p: {
  invTotal: number; // total of Inv. Amt.
  vatTotal: number; // total of VAT Amt.
  feeVat: number; // Fee VAT
  supplierAmt: number;
  kbAmt: number;
  mfVatTotal: number;
  hScVatTotal: number;
  k7: number;
}) =>
  round2(
    p.invTotal -
      p.vatTotal +
      p.feeVat -
      (p.supplierAmt + p.kbAmt + p.mfVatTotal + p.hScVatTotal - p.k7),
  );
