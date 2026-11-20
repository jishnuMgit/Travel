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
  merchant?: string; // the Merchant box: "A" Airline, "T" Travel Agent, else none (a typed Inv. Amt. works the MF out only for A and T)
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

/* =====================================================================
   A TYPED Inv. Amt. (the old frmTktSales, grdvBilling_ValidatingEditor, the colInvAmt branch)
   The user types the invoice amount of the line; the other amounts of the line are worked BACK out of it:
     - with a customer service charge policy (an S. Chg. amount): what is above Fare + Tax + VAT is the S. Chg. with its VAT,
       up to the policy's S. Chg.; whatever is still left (or missing) goes to CD. Amt. (with its VAT);
     - without one: the whole rest is the S. Chg. with its VAT (when it is above 0), else it is CD. Amt. (a discount);
     - then the MF of the policy is worked out from the typed amount and CD. Amt. takes what is left again;
     - the VAT Amt. and the S. Chg. are made to agree with the typed total (the old 0.01 rules).
   The old code kept these as many separate variables; here they are one pure function, so it can be tested.
   ===================================================================== */
export type InvAmtInput = {
  invAmt: number; // the typed Inv. Amt.
  fare: number;
  tax: number;
  hCharge: number; // the CD charge of the line now (fH_AgencyCharge); a negative one counts as 0
  hScVat: number; // the CD VAT of the line now (fH_SCVATAmt); a negative one counts as 0
  sChgV: number; // the VAT of the S. Chg. now (fSCVATAmt)
  vatAmt: number; // the VAT Amt. now
  mf: number; // the MF now
  policySChg: number; // the S. Chg. of the customer's policy (CalCustomerSCharge); 0 = no policy / no S. Chg.
  mfPer: number; // the merchant fee % of the customer's policy
};

export type InvAmtResult = {
  invAmt: number;
  sChg: number;
  sChgV: number;
  vatAmt: number;
  cdAmt: number; // CD. Amt. with its VAT (fH_AgencyChargeWVAT)
  hCharge: number;
  hScVat: number;
  mf: number;
  mfWoVat: number;
  mfVat: number;
};

export const calcLineFromInvAmt = (input: InvAmtInput, ctx: Pick<TicketLinesContext, "dorI" | "boxDorI" | "vatPer"> & { merchant?: string }): InvAmtResult => {
  const { invAmt, fare, tax, policySChg, mfPer } = input;
  const { vatPer } = ctx;
  const vatTot = 100 + vatPer;

  // CalcCustomerVATAmt(S. Chg.): the VAT of the service charge
  const vatOnSChg = (sc: number) => (sc !== 0 ? round2(sc * vatPer * 0.01) : 0);
  // CalcCustomerVATAmt(Fare, Tax, S. Chg.): domestic = on Fare + Tax + S. Chg., international = on the S. Chg. only
  const vatOnLine = (sc: number) => {
    const base = ctx.dorI === "D" ? fare + tax + sc : sc;
    return base !== 0 ? round2(base * vatPer * 0.01) : 0;
  };

  let hCharge = Math.max(0, input.hCharge);
  let hScVat = Math.max(0, input.hScVat);
  let sChgV = input.sChgV;
  let vatAmt = input.vatAmt;
  let mf = input.mf;
  let sChg = 0;
  let hInc = 0; // CD. Amt. with its VAT (numH_SCAmtInclVAT)

  // CD. Amt. split of what is left (the same in every branch below): a domestic ticket always has its VAT taken out, an
  // international one only a positive amount (a negative amount is all charge)
  const splitCd = (amount: number, round: boolean) => {
    if (amount === 0) {
      hCharge = 0;
      hScVat = 0;
    } else if (ctx.boxDorI === "D") {
      hCharge = (amount / vatTot) * 100;
      if (round) hCharge = round2(hCharge);
      hScVat = amount - hCharge;
      if (round) hScVat = round2(hScVat);
    } else if (amount > 0) {
      hCharge = round2((amount / vatTot) * 100);
      hScVat = amount - hCharge;
      if (round) hScVat = round2(hScVat);
    } else {
      hCharge = amount;
      hScVat = 0;
    }
  };

  if (policySChg !== 0) {
    // ---- the customer has a service charge policy
    let agInc = invAmt - (fare + tax + vatAmt - sChgV + mf);
    hCharge = 0;
    hScVat = 0;
    hInc = 0;

    if (agInc > 0) {
      sChg = round2((agInc / vatTot) * 100);
      sChgV = round2(agInc - sChg);
      vatAmt = vatOnLine(sChg);

      if (sChg >= policySChg) {
        sChg = policySChg;
        sChgV = vatOnSChg(sChg);
        vatAmt = vatOnLine(sChg);
        hInc = invAmt - (fare + tax + sChg + vatAmt + mf);
        if (hInc !== 0) {
          hCharge = (hInc / vatTot) * 100;
          hScVat = hInc - hCharge;
        }
      }
    } else {
      // the typed amount is less than Fare + Tax + VAT + MF: no S. Chg., the difference is CD. Amt.
      hInc = agInc;
      sChgV = 0;
      agInc = 0;
      sChg = 0;
      splitCd(hInc, false);
    }
  } else {
    // ---- no policy S. Chg.
    const agInc = invAmt - (fare + tax + hCharge + hScVat + vatAmt - sChgV + mf);
    sChgV = 0;
    sChg = 0;
    vatAmt = vatOnLine(0);

    if (agInc > 0) {
      sChg = round2((agInc / vatTot) * 100);
      sChgV = round2(agInc - sChg);
      vatAmt = vatOnLine(sChg);
    } else {
      hInc = agInc + hCharge + hScVat;
      hCharge = 0;
      hScVat = 0;
      splitCd(hInc, false);
    }
  }

  // ---- MF of the policy, worked out from the typed amount (CalcMFFromInvoiceAmt); only for merchant T and A
  let mfFromInv = 0;
  if (mfPer !== 0) {
    if (ctx.merchant === "T") {
      mfFromInv = invAmt - round2((invAmt / (100 + mfPer)) * 100);
    } else if (ctx.merchant === "A") {
      const total = sChg + sChgV;
      mfFromInv = total - round2((total / (100 + mfPer)) * 100);
    }
  }
  mfFromInv = round2(mfFromInv);

  if (mfFromInv !== 0) {
    mf = mfFromInv;
    // the MF is in the typed amount: CD. Amt. takes what is left again
    hInc = invAmt - (fare + tax + sChg + vatAmt + mf);
    hCharge = 0;
    hScVat = 0;
    splitCd(hInc, true);
  }

  let mfWoVat = 0;
  let mfVat = 0;
  if (mf !== 0) {
    mfWoVat = round2((mf / vatTot) * 100);
    mfVat = mf - mfWoVat;
  }

  // ---- the VAT Amt. and the S. Chg. agree with the typed total (the old 0.01 rules)
  vatAmt = vatOnLine(sChg);
  const vatDiff = round2(sChgV - vatAmt);
  if (vatDiff === 0.01) vatAmt = vatAmt + 0.01;
  else if (vatDiff === -0.01) vatAmt = vatAmt - 0.01;

  const billing = fare + tax + hInc + sChg + vatAmt + mf;
  const billingDiff = round2(invAmt - billing);
  if (billingDiff === 0.01) sChg = sChg + 0.01;
  else if (billingDiff === -0.01) sChg = sChg - 0.01;

  const cdAmt = hCharge + hScVat;

  return {
    invAmt,
    sChg: round2(sChg),
    sChgV: round2(sChgV),
    vatAmt: round2(vatAmt),
    cdAmt: round2(cdAmt),
    hCharge: round2(hCharge),
    hScVat: round2(hScVat),
    mf: round2(mf),
    mfWoVat: round2(mfWoVat),
    mfVat: round2(mfVat),
  };
};
