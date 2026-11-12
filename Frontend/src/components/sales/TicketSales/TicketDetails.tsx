import React, { useEffect, useRef, useState } from "react";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import dayjs from "dayjs";
import { toast } from "react-toastify";
import customParseFormat from "dayjs/plugin/customParseFormat";
import { Combo, PairCombo, type Option } from "../../common/Combo";
import TicketLinesPage from "../../common/TicketLinesPage";
import Header from "../../common/Header";
import {
  getTicketSalesAirlines,
  getTicketSalesBranches,
  getTicketSalesFop,
  getTicketSalesGds,
  getTicketSalesComTypes,
  getTicketSalesDi,
  getTicketSalesIatas,
  getTicketSalesMerchants,
  getTicketSalesPaxTypes,
  getTicketSalesServiceTypes,
  getTicketSalesStaffs,
  getTicketSalesSuppliers,
  getTicketSales,
  getTicketSalesSlNos,
  getTicketSalesTktTypes,
  deleteTicketSales,
  getTicketSalesVat,
  modifyTicketSales,
  saveTicketSales,
  type LoadedTicket,
  type TicketSalesVat,
  type TicketDetailPayload,
  type TicketLinePayload,
  type TktTypeRecord,
} from "../../../utils/airlineApi";
import { formatAirportCode, formatRoute, ROUTE_MAX_LENGTH, validateTicketHeader } from "./ticketSalesValidation";
import { useConfirmModal } from "../../../hooks/useConfirmModal";
import { useEnterAsTab } from "../../../hooks/useEnterAsTab";

dayjs.extend(customParseFormat);

/* =====================================================================
   FILE MAP
   1. Types, constants and sample options
   2. Shared building blocks (Field, Combo, PairCombo, MoneyInput, ...)
   3. Form parts   : TicketTopBar, TicketDetails, TicketRoutePanel,
                     TicketAmountsPanel, TicketActions
   4. TicketDetails   : owns the state and renders the parts in order
   ===================================================================== */

/* ---------------------------------------------------------------------
   1. TYPES, CONSTANTS AND SAMPLE OPTIONS
   --------------------------------------------------------------------- */
const DATE_FORMAT = "DD-MM-YYYY";
const TODAY = dayjs().format(DATE_FORMAT);

/* Sample option lists. Replace with data from your API. */
const toOptions = (values: string[]): Option[] =>
  values.map((v) => ({ value: v, label: v }));

const yesNoOptions = toOptions(["No", "Yes"]);
// Trip: the list shows One Way / Round Trip, the value that is saved is OW / RT
const tripOptions: Option[] = [
  { value: "OW", label: "One Way" },
  { value: "RT", label: "Round Trip" },
];

type FormState = {
  ticketPrefix: string | null; // fticketTypeid
  tktName: string; // ftickttypename of the selected ticket type
  ticketNo: string;
  slNo: string; // fSlNo (txtSlNo): starts at 1
  airline: string | null;
  branch: string | null;
  iata: string | null;

  date: string;
  bspDate: string;
  flightDate: string;
  di: string | null;
  voidFlag: string | null;

  supplier: string | null;
  supPayment: string | null;

  pax: string;
  staff: string | null;
  bookingGdsLogin: string;

  mobile: string;
  paxType: string | null;
  service: string | null;
  salesGdsLogin: string;
  pnrNo: string;

  email: string;
  paxId: string;
  trip: string | null;
  returnDate: string;
  tourCode: string;

  route: string;
  travelClass: string;
  fop: string | null;
  destination: string;
  cnj: string | null;
  gds: string | null;
  ccType: string | null;
  carrier: string;
  fareBasis: string;
  merchant: string | null;
  fopCash: string;
  fopCc: string;
  fopEp: string;

  gFare: string;
  sFare: string;
  tax: string;
  k7: string;
  supFee: string;
  alComType: string | null;
  alCom: string; // A/L Com. % (typed when the type is P)
  alComAmt: string; // A/L Com. Amt. (typed when the type is A)
};

type SetField = <K extends keyof FormState>(
  key: K,
  value: FormState[K],
) => void;

/** props shared by every form part */
type PartProps = { form: FormState; set: SetField };

type Computed = {
  feeVat: number;
  supCom: number;
  alComPer: number;
  alComAmt: number;
  alCVat: number;
  supplierAmt: number;
  net: number;
};

/* ---------------------------------------------------------------------
   The calculated amounts of the fares panel (the old frmTktSales):
     A/L Com. Amt. = CalcCommAmt        S.Fare x A/L Com. % x 0.01 (type P), the typed amount (type A)
     Sup. Com.     = CalcSalesCommAmt   G.Fare - S.Fare, only for BSP tickets (B / BS) without a tour code
     A/L C. VAT    = CalcCommVATAmt     (Sup. Com. + A/L Com. Amt.) x the commission VAT % x 0.01
     Fee VAT       = CalcXOCommVATAmt   Sup. Fee x the service charge VAT % x 0.01
     Supplier Amt. = CalcSupplierAmt    (S.Fare - A/L Com. Amt.) + Tax + K7 + Sup. Fee + Fee VAT
     Net           = CalcTotalCost      Supplier Amt. - A/L C. VAT   (the old txtSupplierAmtLCVAT)
   They are worked out from the form on every render, so they follow every change.

   The VAT percentages come from the database (dbo.getvatper, dbo.getcommvatper,
   dbo.getvatoncommission, by the date, D/I and airline of the ticket).
   Fee VAT also needs the flag of the paid supplier (old fCalcSupFeeVAT), which is
   not in the database yet: until it is given the flag below stays false.
   --------------------------------------------------------------------- */
const SUPPLIER_CALC_FEE_VAT = false; // the paid supplier calculates VAT on the fee (old fCalcSupFeeVAT)

const noVat: TicketSalesVat = {
  txtSCVATPer: 0,
  txtCommVATPer: 0,
  chkVATOnCommission: false,
};

const toNumber = (value: string) => {
  const parsed = parseFloat(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const round2 = (value: number) => Math.round((value + Number.EPSILON) * 100) / 100;

const calcAmounts = (form: FormState, vat: TicketSalesVat): Computed => {
  const gFare = toNumber(form.gFare);
  const sFare = toNumber(form.sFare);
  const tax = toNumber(form.tax);
  const k7 = toNumber(form.k7);
  const supFee = toNumber(form.supFee);

  // A/L Com. (the old CalcCommAmt / CalcCommPer): type P = the % is typed and the amount is
  // worked out; type A = the amount is typed and the % is worked out.
  const alComPer =
    form.alComType === "P"
      ? toNumber(form.alCom)
      : sFare !== 0
        ? round2((toNumber(form.alComAmt) / sFare) * 100)
        : 0;
  const alComAmt =
    form.alComType === "P"
      ? round2(sFare * toNumber(form.alCom) * 0.01)
      : round2(toNumber(form.alComAmt));

  const isBspTicket = form.ticketPrefix === "B" || form.ticketPrefix === "BS";
  const supCom = isBspTicket && form.tourCode.trim() === "" ? round2(gFare - sFare) : 0;

  const vatOnCommission = form.di === "D" || vat.chkVATOnCommission;
  const alCVat = vatOnCommission
    ? round2((supCom + alComAmt) * vat.txtCommVATPer * 0.01)
    : 0;

  const feeVat =
    SUPPLIER_CALC_FEE_VAT && form.supPayment
      ? round2(supFee * vat.txtSCVATPer * 0.01)
      : 0;

  const supplierAmt = round2(sFare - alComAmt + tax + k7 + supFee + feeVat);
  const net = round2(supplierAmt - alCVat);

  return { feeVat, supCom, alComPer, alComAmt, alCVat, supplierAmt, net };
};

const initialForm = (): FormState => ({
  ticketPrefix: null,
  tktName: "",
  ticketNo: "",
  slNo: "1",
  airline: null,
  branch: null,
  iata: null,

  date: TODAY,
  bspDate: "",
  flightDate: "",
  di: "I",
  voidFlag: "No",

  supplier: null,
  supPayment: null,

  pax: "",
  staff: null,
  bookingGdsLogin: "",

  mobile: "",
  paxType: "A", // Adult (fpid of tbltlparam PXTP)
  service: "TKT",
  salesGdsLogin: "",
  pnrNo: "",

  email: "",
  paxId: "",
  trip: null,
  returnDate: "",
  tourCode: "",

  route: "",
  travelClass: "",
  fop: "CASH",
  destination: "",
  cnj: "No",
  gds: null,
  ccType: "NA",
  carrier: "",
  fareBasis: "",
  merchant: "NA",
  fopCash: "0.00",
  fopCc: "0.00",
  fopEp: "0.00",

  gFare: "0.00",
  sFare: "0.00",
  tax: "0.00",
  k7: "0.00",
  supFee: "0.00",
  alComType: "P",
  alCom: "0.00",
  alComAmt: "0.00",
});

/* A saved ticket (from the server, the keys are the element ids) -> the values of the form. The calculated boxes
   (Fee VAT, Sup. Com., A/L C. VAT, Supplier Amt., Net) are worked out again from these values. */
const money2 = (value: number) => value.toFixed(2);
const orNull = (value: string) => (value === "" ? null : value);

const formFromTicket = (t: LoadedTicket, tktName: string): Partial<FormState> => ({
  ticketPrefix: t.lkpTktType,
  tktName,
  ticketNo: t.txtTktSLNo,
  slNo: String(t.txtSlNo),
  airline: orNull(t.lkpAirlineNo),
  branch: orNull(t.lkpBranch),
  iata: orNull(t.lkpIATA),

  date: t.dtpDate,
  bspDate: t.dtpBSPDate,
  flightDate: t.dtpFlightDate,
  returnDate: t.dtpReturnDate,
  pnrNo: t.txtPNRNo,
  di: orNull(t.lkpDI),
  supplier: orNull(t.lkpSupplier),
  supPayment: orNull(t.lkpPaySupplierID),
  pax: t.txtPaxName,
  staff: orNull(t.lkpStaffID),
  bookingGdsLogin: t.txtBookingGDSLogin ?? "",
  paxType: orNull(t.lkpPaxType),
  paxId: t.txtPaxNameId,
  voidFlag: t.lkpVoid,
  service: orNull(t.lkpService),
  salesGdsLogin: t.txtSalesGDSLogin ?? "",
  mobile: t.txtMobile,
  email: t.txtEmail,
  trip: orNull(t.lkpTrip),
  tourCode: t.txtTourCode,

  route: t.txtRoute,
  travelClass: t.txtClass,
  destination: t.txtDestination,
  cnj: t.lkpCNJ,
  gds: orNull(t.lkpGDS),
  ccType: orNull(t.lkpCCType),
  carrier: t.txtCarrier,
  fareBasis: t.txtFareBasis,
  merchant: orNull(t.lkpMerchant),

  fop: orNull(t.lkpFOP),
  gFare: money2(t.txtGFare),
  supFee: money2(t.txtSupFee),
  fopCash: money2(t.txtFopCash),
  sFare: money2(t.txtSFare),
  alComType: orNull(t.lkpALCom),
  alCom: money2(t.txtALCom),
  fopCc: money2(t.txtFopCc),
  tax: money2(t.txtTax),
  alComAmt: money2(t.txtALComAmt),
  fopEp: money2(t.txtFopEp),
  k7: money2(t.txtK7),
});

/* Label widths. Every row uses the same widths per column, so the controls
   line up vertically (column groups: A, B, C, D, E). */
const LA = "w-[64px]"; // Date, Supplier, Pax., Mobile, E-mail
const LB = "w-[72px]"; // BSP Date, Pax Type, Pax ID
const LC = "w-[92px]"; // Flight Date, Sup. Payment, Staff, Service, Trip
const LD = "w-[92px]"; // D/I, Orig. Tkt.No., Return Date
const LE = "w-[72px]"; // Void, PNR No., Tour Code
const Lx = "w-[72px]"; 
/* ---------------------------------------------------------------------
   2. SHARED BUILDING BLOCKS
   --------------------------------------------------------------------- */
const inputClass =
  " w-full min-w-0 input-style";

const readOnlyClass =
  "h-[30px] w-full min-w-0 rounded-[4px] border border-[#cfd7df] bg-[#eef1f4] px-2 text-[12px] text-[#24364d] outline-none";

const panelClass = "border border-gray-300 rounded-sm bg-[#fcfdfe] p-3 shadow-sm";

/** label + controls on one line; pass a width class so columns line up */
const Field: React.FC<{
  label: string;
  htmlFor?: string;
  className?: string;
  labelClassName?: string;
  children: React.ReactNode;
}> = ({ label, htmlFor, className = "", labelClassName = "", children }) => (
  <div className={`flex min-w-0 items-center gap-2 ${className}`}>
    <label
      htmlFor={htmlFor}
      className={`shrink-0 whitespace-nowrap text-right text-[12px] text-[#405066] ${labelClassName}`}
    >
      {label}
    </label>
    <div className="flex min-w-0 flex-1 items-center gap-1.5">{children}</div>
  </div>
);

const formatMoney = (value: number) =>
  value.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

/** editable amount: right aligned, 2 decimals after leaving the box */
const MoneyInput: React.FC<{
  id: string;
  value: string;
  onChange: (value: string) => void;
}> = ({ id, value, onChange }) => (
  <input
    id={id}
    inputMode="decimal"
    value={value}
    onFocus={(event) => event.target.select()}
    onChange={(event) => {
      if (/^\d*\.?\d{0,2}$/.test(event.target.value)) onChange(event.target.value);
    }}
    onBlur={() => {
      const parsed = parseFloat(value);
      onChange(Number.isFinite(parsed) ? parsed.toFixed(2) : "0.00");
    }}
    className={`${inputClass} text-right `}
  />
);


const FareMoneyInput: React.FC<{
  id: string;
  value: string;
  onChange: (value: string) => void;
}> = ({ id, value, onChange }) => (
  <input
    id={id}
    inputMode="decimal"
    value={value}
    onFocus={(event) => event.target.select()}
    onChange={(event) => {
      if (/^\d*\.?\d{0,2}$/.test(event.target.value)) onChange(event.target.value);
    }}
    onBlur={() => {
      const parsed = parseFloat(value);
      onChange(Number.isFinite(parsed) ? parsed.toFixed(2) : "0.00");
    }}
    className={`${inputClass} text-right`}
  />
);

/** read-only calculated amount */
const MoneyReadOnly: React.FC<{
  id: string;
  value: number;
  alwaysRed?: boolean;
}> = ({ id, value, alwaysRed = false }) => (
  <input
    id={id}
    readOnly
    tabIndex={-1}
    value={formatMoney(value)}
    className={`${readOnlyClass}  text-right ${alwaysRed ? "text-[#c0392b]" : ""} `}
  />
);

/** compact MUI date picker */
const AppDatePicker: React.FC<{
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
}> = ({ id, label, value, onChange }) => (
  <LocalizationProvider dateAdapter={AdapterDayjs}>
    <DatePicker
      value={value ? dayjs(value, DATE_FORMAT) : null}
      onChange={(newValue) => {
        onChange(newValue?.isValid() ? newValue.format(DATE_FORMAT) : "");
      }}
      format={DATE_FORMAT}
      slotProps={{
        textField: { id, slotProps: { htmlInput: { "aria-label": label } } },
        openPickerButton: { sx: { padding: "2px", margin: 0 } },
        inputAdornment: { sx: { margin: 0, padding: 0 } },
      }}
      sx={{
        width: "100%",
        minWidth: 0,
        "& .MuiPickersTextField-root": { width: "100%" },
        "& .MuiPickersInputBase-root": {
          width: "100%",
          height: "30px",
          minHeight: "30px",
          boxSizing: "border-box",
          borderRadius: "4px",
          backgroundColor: "#ffffff",
          fontSize: "12px",
          padding: 0,
          overflow: "hidden",
        },
        "& .MuiPickersInputBase-sectionsContainer": {
          paddingLeft: "8px !important",
          paddingRight: "0px !important",
          marginBottom: "-5px !important",
          marginLeft: "0px !important",
          boxSizing: "border-box",
          overflow: "hidden",
        },
        "& .MuiPickersInputBase-sectionContent": {
          fontSize: "12px",
          color: "#344054",
        },
        "& .MuiPickersInputBase-input": {
          minWidth: 0,
          width: "100%",
          fontSize: "12px",
          padding: 0,
          height: "30px",
          boxSizing: "border-box",
        },
        "& .MuiInputAdornment-root": { margin: 0, padding: 0 },
        "& .MuiIconButton-root": {
          width: "22px",
          height: "22px",
          padding: "2px",
          margin: 0,
        },
        "& .MuiSvgIcon-root": { fontSize: "15px" },
        // blank look (no "DD-MM-YYYY" hint) while empty and not focused
        ...(!value && {
          "&:not(:focus-within) .MuiPickersInputBase-sectionsContainer *": {
            color: "transparent",
          },
        }),
        "& .MuiPickersOutlinedInput-notchedOutline": {
          borderColor: "#B7C7D7 !important",
        },
        "& .MuiPickersInputBase-root:hover .MuiPickersOutlinedInput-notchedOutline":
          { borderColor: "#B7C7D7 !important" },
        "& .MuiPickersInputBase-root.Mui-focused .MuiPickersOutlinedInput-notchedOutline":
          { borderColor: "#B7C7D7 !important", borderWidth: "1px" },
        "& .MuiPickersInputBase-root.Mui-error .MuiPickersOutlinedInput-notchedOutline":
          { borderColor: "#B7C7D7 !important" },
        "& .MuiPickersInputBase-root.Mui-error:hover .MuiPickersOutlinedInput-notchedOutline":
          { borderColor: "#B7C7D7 !important" },
        "& .MuiPickersInputBase-root.Mui-error.Mui-focused .MuiPickersOutlinedInput-notchedOutline":
          { borderColor: "#B7C7D7 !important" },
      }}
    />
  </LocalizationProvider>
);

/* ---------------------------------------------------------------------
   3. FORM PARTS
   --------------------------------------------------------------------- */

/** width (px) of an element, kept up to date when it resizes */
const useElementWidth = <T extends HTMLElement>() => {
  const ref = useRef<T>(null);
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const update = () => setWidth(el.getBoundingClientRect().width);
    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return [ref, width] as const;
};

/* 3a. Top bar: ticket no, airline, branch, IATA ------------------------ */

const TicketTopBar: React.FC<
  PartProps & {
    ticketNoRef: React.RefObject<HTMLInputElement | null>;
    onSearch: () => void;
    onTicketNoLeave: () => void; // leaving the Ticket No. box loads the ticket when it is saved
    airlineIdOptions: Option[];
    airlineNameOptions: Option[];
    ticketTypeOptions: Option[];
    onTicketTypeChange: (fticketTypeid: string | null) => void;
    keyLocked: boolean; // a saved ticket is shown (Modify): its Ticket Type and Ticket No. cannot be changed
    onSlNoLeave: () => void; // leaving the Sl. No. box: loads that Sl. No., or shows the next free one when it is empty
    branchIdOptions: Option[];
    branchNameOptions: Option[];
    iataIdOptions: Option[];
    iataNameOptions: Option[];
  }
> = ({
  form,
  set,
  ticketNoRef,
  onSearch,
  onTicketNoLeave,
  airlineIdOptions,
  airlineNameOptions,
  branchIdOptions,
  branchNameOptions,
  iataIdOptions,
  iataNameOptions,
  ticketTypeOptions,
  onTicketTypeChange,
  keyLocked,
  onSlNoLeave,
}) => {
  // The ticket type list is as wide as the prefix box + the ticket number box.
  const [ticketNoWrapRef, ticketNoWrapWidth] = useElementWidth<HTMLDivElement>();

  return (
  <div className="grid w-full grid-cols-1 items-center gap-x-4 gap-y-2.5 sm:grid-cols-2 lg:grid-cols-[minmax(300px,1.4fr)_1.5fr_1.3fr_1.5fr]">

    {/* Ticket No */}
    <Field
      label="Ticket No. :"
      htmlFor="txtTktSLNo"
      className="w-full min-w-0"
    >
      <div ref={ticketNoWrapRef} className="flex w-full min-w-0 items-center gap-2">
        <Combo
          id="lkpTktType"
          menuWidth={ticketNoWrapWidth || undefined}
          options={ticketTypeOptions}
          value={form.ticketPrefix}
          onChange={onTicketTypeChange}
          className="w-16.25 shrink-0"
          disabled={keyLocked}
          isSearchable
        />

        <input
          ref={ticketNoRef}
          id="txtTktSLNo"
          value={form.ticketNo}
          readOnly={keyLocked}
          maxLength={10} // the old txtTktSlNo: 10 characters at most
          onChange={(event) => set("ticketNo", event.target.value)}
          onBlur={onTicketNoLeave}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              onSearch();
            }
          }}
          className={`input-style w-full min-w-[104px] ${keyLocked ? "!bg-[#eef1f4]" : ""}`} // room for 10 digits
        />

        {/* Sl. No. (fSlNo): 1 to start with */}
        <input
          id="txtSlNo"
          aria-label="Sl. No."
          inputMode="numeric"
          maxLength={3}
          value={form.slNo}
          onFocus={(event) => event.target.select()}
          onBlur={onSlNoLeave}
          onChange={(event) => {
            if (/^\d{0,3}$/.test(event.target.value)) set("slNo", event.target.value);
          }}
          className="input-style w-9 shrink-0 text-center"
        />
      </div>
    </Field>

    {/* Airline */}
    <Field
      label="Airline :"
      className="w-full min-w-0"
    >
      <div className="w-full min-w-0  ml-[2%]">
        <PairCombo
          idId="lkpAirlineNo"
          idFirstHeader="A/L No."
          idSecondHeader="Name"
          nameId="lkpAirlineName"
          idOptions={airlineIdOptions}
          nameOptions={airlineNameOptions}
          value={form.airline}
          onChange={(v) => set("airline", v)}
          idWidth="w-[80px] shrink-0"
          fitMenuToPair
          idMenuWidth={260}
          nameMenuWidth={250}
          nameSecondColumnExtra={84}
          nameFirstHeader="Name"
          nameSecondHeader="A/L No."
          nameWidth="min-w-0 flex-1"
          isSearchable
          containerClassName="flex flex-1 gap-2"
        />
      </div>
    </Field>

    {/* Branch */}
    <Field
      label="Branch :"
      className="w-full min-w-0 ml-[2%]"
    >
      <div className="w-full min-w-0">
        <PairCombo
          idId="lkpBranch"
          nameId="lkpBranchName"
          idOptions={branchIdOptions}
          nameOptions={branchNameOptions}
          value={form.branch}
          onChange={(v) => set("branch", v)}
          idWidth="w-[55px] shrink-0"
          nameWidth="min-w-0 flex-1"
          fitMenuToPair
          nameSecondColumnExtra={50}
          nameFirstHeader="Name"
          nameSecondHeader="ID"
          isSearchable
          containerClassName="flex flex-1 gap-2"
        />
      </div>
    </Field>

    {/* IATA */}
    <Field
      label="IATA :"
      className="w-[96%] min-w-0 ml-[4%] z-20"
    >
      <div className="w-full min-w-0">
        <PairCombo
          idId="lkpIATA"
          idFirstHeader="IATA Code"
          idSecondHeader="IATA"
          nameId="lkpIATAName"
          idOptions={iataIdOptions}
          nameOptions={iataNameOptions}
          value={form.iata}
          onChange={(v) => set("iata", v)}
          idWidth="w-[110px] shrink-0"
          nameWidth="min-w-0 flex-1"
          fitMenuToPair
          nameSecondColumnExtra={88}
          nameFirstHeader="IATA"
          nameSecondHeader="IATA Code"
          isSearchable
          disabled={form.ticketPrefix === "X"} // an XO ticket is saved with IATA NA only
          containerClassName="flex flex-1 gap-2"
        />
      </div>
    </Field>

  </div>
  );
};

/* 3b. Ticket details box ------------------------------------------------
   12-column grid with five column groups on every row:
   A = 3 cols, B = 3 cols, C = 2 cols, D = 2 cols, E = 2 cols
   (wide fields span several groups, e.g. Supplier = A+B).              */
const TicketDetailsFields: React.FC<
  PartProps & {
    staffIdOptions: Option[];
    staffNameOptions: Option[];
    supplierIdOptions: Option[];
    supplierNameOptions: Option[];
    serviceOptions: Option[];
    diOptions: Option[];
    paxTypeOptions: Option[];
  }
> = ({
  form,
  set,
  staffIdOptions,
  staffNameOptions,
  supplierIdOptions,
  supplierNameOptions,
  serviceOptions,
  diOptions,
  paxTypeOptions,
}) => (
  <div
    className={`${panelClass} grid grid-cols-1 items-center md:grid-cols-2 lg:grid-cols-12`}
  >
    {/* row 1: Date | BSP Date | Flight Date | Return Date | D/I */}
    <Field label="Date :" labelClassName={LA} className="min-w-0 lg:col-span-2 mb-2">
      <div className="w-35 min-w-0">
        <AppDatePicker
        id="dtpDate"
        label="Date"
        value={form.date}
        onChange={(v) => set("date", v)}
      />
      </div>
    </Field>
    <Field label="BSP Date :" labelClassName={LB} className="min-w-0 lg:col-span-2 mb-2">
      <div className="w-35 min-w-0">
        <AppDatePicker
        id="dtpBSPDate"
        label="BSP Date"
        value={form.bspDate}
        onChange={(v) => set("bspDate", v)}
      />
      </div>
    </Field>
   
    <Field label="Flight Date :" labelClassName={LC} className="min-w-0 lg:col-span-2 mb-2">
      <div className="w-35 min-w-0">
        <AppDatePicker
        id="dtpFlightDate"
        label="Flight Date"
        value={form.flightDate}
        onChange={(v) => set("flightDate", v)}
      />
      </div>
    </Field>
    <Field label="Return Date :" labelClassName={LC} className="min-w-0 lg:col-span-2 mb-2">
      <div className="w-35 min-w-0">
        <AppDatePicker
       id="dtpReturnDate"
        label="Return Date"
        value={form.returnDate}
        onChange={(v) => set("returnDate", v)}
      />
      </div>
    </Field>
    <Field
      label="PNR :"
      htmlFor="txtPNRNo"
      labelClassName={Lx}
      className="min-w-0 lg:col-span-2 mb-2"
    >
      <input
        id="txtPNRNo"
        value={form.pnrNo}
        onChange={(event) => set("pnrNo", event.target.value)}
        className={`${inputClass} min-w-0`}
      />
    </Field>

    <Field label="D/I :" labelClassName={LA} className="min-w-0 lg:col-span-2 mb-2">
      <Combo
        id="lkpDI"
        firstHeader="Name"
        secondHeader="ID"
        secondColumnExtra={44}
        options={diOptions}
        value={form.di}
        onChange={(v) => set("di", v)}
        isSearchable
      />
    </Field>
      {/* Void : */}
     

    {/* row 2: Supplier | Supplier Payment */}
    <Field
      label="Supplier :"
      labelClassName={LA}
      className="min-w-0 md:col-span-2 lg:col-span-6 -pt-2"
    >
      <PairCombo
        idId="lkpSupplier"
        nameId="lkpSupplierName"
        idOptions={supplierIdOptions}
        nameOptions={supplierNameOptions}
        value={form.supplier}
        onChange={(v) => {
          set("supplier", v);
          if (form.supPayment === null || form.supPayment === form.supplier) {
            set("supPayment", v);
          }
        }}
        idWidth="w-[110px]"
        nameWidth="flex-1"
        fitMenuToPair
        nameSecondColumnExtra={84}
        nameFirstHeader="Name"
        nameSecondHeader="ID"
        isSearchable
        containerClassName="flex flex-1 gap-2"
      />
    </Field>
    <Field
      label="Sup. Payment :"
      labelClassName={LC}
      className="min-w-0 md:col-span-2 lg:col-span-6"
    >
      <PairCombo
        idId="lkpPaySupplierID"
        nameId="lkpPaySupplierName"
        idOptions={supplierIdOptions}
        nameOptions={supplierNameOptions}
        value={form.supPayment}
        onChange={(v) => set("supPayment", v)}
        idWidth="w-[110px]"
        nameWidth="flex-1"
        fitMenuToPair
        nameSecondColumnExtra={84}
        nameFirstHeader="Name"
        nameSecondHeader="ID"
        isSearchable
        containerClassName="flex flex-1 gap-2"
      />
    </Field>

    {/* row 3: Passenger | Staff | Booking GDS Login */}
    <Field
      label="Pax Name :"
      htmlFor="txtPaxName"
      labelClassName={LA}
      className="min-w-0 md:col-span-2 lg:col-span-6 "
    >
      <input
        id="txtPaxName"
        value={form.pax}
        onChange={(event) => set("pax", event.target.value)}
        className={inputClass}
      />
    </Field>
    <Field
      label="Staff :"
      labelClassName={LC}
      className="min-w-0 md:col-span-2 lg:col-span-4"
    >
      <PairCombo
        idId="lkpStaffID"
        nameId="lkpStaffName"
        idOptions={staffIdOptions}
        nameOptions={staffNameOptions}
        value={form.staff}
        onChange={(v) => set("staff", v)}
        idWidth="w-[72px]"
        fitMenuToPair
        nameSecondColumnExtra={88}
        nameFirstHeader="Name"
        nameSecondHeader="ID"
        isSearchable
        containerClassName="flex flex-1 gap-2"
      />
    </Field>
    <Field
      label="Booking GDS Login"
      className="min-w-0 md:col-span-2 lg:col-span-2 lg:p-2 -mr-2"
    >
      <input
        id="txtBookingGDSLogin"
        maxLength={6}
        value={form.bookingGdsLogin}
        onChange={(e) => set("bookingGdsLogin", e.target.value)}
        className={inputClass}
      />
    </Field>

    {/* row 4: Passenger type | Pax ID | Service | Original ticket | PNR | Sales GDS Login */}
    <Field label="Pax Type :" labelClassName={LB} className="min-w-0 w-[80%] lg:col-span-2 lg:-ml-2 mb-2">
      <Combo
        id="lkpPaxType"
        secondColumnExtra={44}
        firstHeader="Name"
        secondHeader="ID"
        options={paxTypeOptions}
        value={form.paxType}
        onChange={(v) => set("paxType", v)}
        isSearchable
      />
    </Field>
     <Field
      label="Pax ID :"
      htmlFor="txtPaxNameId"
      labelClassName={LB}
      className="min-w-0 lg:col-span-2 mb-2 -ml-10 w-full"
    >
      <input
        id="txtPaxNameId"
        value={form.paxId}
        onChange={(event) => set("paxId", event.target.value)}
        className={inputClass}
      />
    </Field>

     <Field label="Orig. Tkt.No. :" labelClassName={LD} className="min-w-0 lg:col-span-2 mb-2 -ml-8">
      <input
        id="txtOrigTktNo"
        
        tabIndex={-1}
        value=""
        className={readOnlyClass}

      />
    </Field>
    
    <Field label="Void :" labelClassName={LE} className="min-w-0 lg:col-span-2 ml-5 mb-2">
      <div className="w-full min-w-0">
        <Combo
        id="lkpVoid"
        fitMenuToBox
        options={yesNoOptions}
        value={form.voidFlag}
        onChange={(v) => set("voidFlag", v)}
        isSearchable
      />
      </div>
    </Field>
    <Field label="Service Type :" labelClassName={LC} className="min-w-0 lg:col-span-2 mb-2">
      <Combo
        id="lkpService"
        menuWidth={240}
        options={serviceOptions}
        value={form.service}
        onChange={(v) => set("service", v)}
        isSearchable
      />
    </Field>
    
    <Field
      label="Sales GDS Login"
      className="min-w-0 md:col-span-2 lg:col-span-2 lg:ml-4 lg:px-2 mb-2 -mr-2"
    >
      <input
        id="txtSalesGDSLogin"
        maxLength={6}
        value={form.salesGdsLogin}
        onChange={(e) => set("salesGdsLogin", e.target.value)}
        className={inputClass}
      />
    </Field>

    {/* row 5: Mobile | E-mail | Trip | Void | Tour code */}
     <Field
      label="Mobile :"
      htmlFor="txtMobile"
      labelClassName={LA}
      className="min-w-0 lg:col-span-3"
    >
      <input
        id="txtMobile"
        value={form.mobile}
        onChange={(event) => set("mobile", event.target.value)}
        className={inputClass}
      />
    </Field>
    
    <Field
      label="E-mail :"
      htmlFor="txtEmail"
      labelClassName={LA}
      className="min-w-0 lg:col-span-3"
    >
      <input
        id="txtEmail"
        type="email"
        value={form.email}
        onChange={(event) => set("email", event.target.value)}
        className={inputClass}
      />
    </Field>
   
    <Field label="Trip :" labelClassName={LC} className="min-w-0 lg:col-span-3">
      <Combo
        id="lkpTrip"
        options={tripOptions}
        value={form.trip}
        onChange={(v) => set("trip", v)}
        isSearchable
      />
    </Field>
    
    <Field
      label="Tour Code :"
      htmlFor="txtTourCode"
      labelClassName={LE}
      className="min-w-0 lg:col-span-3"
    >
      <input
        id="txtTourCode"
        value={form.tourCode}
        onChange={(event) => set("tourCode", event.target.value)}
        className={inputClass}
      />
    </Field>
  </div>
);

/* 3c. Route / payment panel (left) --------------------------------------
   Responsive to the width of the page content (container queries), so it
   stays correct when the side menu opens or closes. */

const L1 = "w-[78px] shrink-0";

// Text input
const inputClassforTicketRoutePanel = "w-full min-w-0 input-style";

// Small read-only box next to GDS
const greyBoxClass =
  "h-[30px] w-[30px] shrink-0 rounded-[2px] border border-[#cbd2dc] bg-[#e5e7eb]";

const TicketRoutePanel: React.FC<
  PartProps & { gdsOptions: Option[]; merchantOptions: Option[] }
> = ({ form, set, gdsOptions, merchantOptions }) => (
  <div className="@container min-w-0">
    <div
      className={`${panelClass} grid h-full grid-cols-1 items-center gap-x-4 gap-y-2 @md:grid-cols-2`}
    >
      <Field
        label="Route :"
        htmlFor="txtRoute"
        labelClassName={L1}
        className="min-w-0"
      >
        <input
          id="txtRoute"
          value={form.route}
          maxLength={ROUTE_MAX_LENGTH}
          autoCapitalize="characters"
          onChange={(e) => set("route", formatRoute(e.target.value))}
          className={inputClassforTicketRoutePanel}
        />
      </Field>

      <Field
        label="Class :"
        htmlFor="txtClass"
        labelClassName={L1}
        className="min-w-0"
      >
        <input
          id="txtClass"
          value={form.travelClass}
          onChange={(e) => set("travelClass", e.target.value)}
          className={inputClassforTicketRoutePanel}
        />
      </Field>

      <Field
        label="Destination :"
        htmlFor="txtDestination"
        labelClassName={L1}
        className="min-w-0"
      >
        <div className="flex w-full min-w-0 items-center gap-2">
          <input
            id="txtDestination"
            value={form.destination}
            maxLength={3}
            autoCapitalize="characters"
            onChange={(e) => set("destination", formatAirportCode(e.target.value))}
            className={`${inputClassforTicketRoutePanel} flex-1`}
          />
          <Field label="CNJ. :" className="shrink-0">
            <Combo
              id="lkpCNJ"
              fitMenuToBox
              options={yesNoOptions}
              value={form.cnj}
              onChange={(v) => set("cnj", v)}
              className="w-14.5 min-w-0"
              isSearchable
            />
          </Field>
        </div>
      </Field>

      <Field label="GDS :" labelClassName={L1} className="min-w-0">
        <div className="flex w-full min-w-0 items-center gap-1">
          <Combo
            id="lkpGDS"
            secondColumnExtra={48}
            firstHeader="Name"
            secondHeader="ID"
            options={gdsOptions}
            value={form.gds}
            onChange={(v) => set("gds", v)}
            className="min-w-0 flex-1"
            isSearchable
          />
          <input
            id="txtGdsCode"
            readOnly
            tabIndex={-1}
            aria-label="GDS code"
            value=""
            className={greyBoxClass}
          />
        </div>
      </Field>

      <Field
        label="Carrier :"
        htmlFor="txtCarrier"
        labelClassName={L1}
        className="min-w-0"
      >
        <input
          id="txtCarrier"
          value={form.carrier}
          onChange={(e) => set("carrier", e.target.value)}
          className={inputClassforTicketRoutePanel}
        />
      </Field>

      <Field label="Merchant :" labelClassName={L1} className="min-w-0">
        <Combo
          id="lkpMerchant"
          secondColumnExtra={56}
          firstHeader="Name"
          secondHeader="ID"
          options={merchantOptions}
          value={form.merchant}
          onChange={(v) => set("merchant", v)}
          className="w-full min-w-0"
          isSearchable
        />
      </Field>
    </div>
  </div>
);

/* 3d. Fares and commissions panel ----------------------------------
   Columns: 1 = FOP, 2 = fares, 3 = supplier / A/L, 4 = VAT / net.
   Labels are fixed width, inputs fill the rest of the column.
   1 column on small, 2 on medium, 4 on wide (by panel width).          */
const A1 = "w-[90px] shrink-0 @2xl:w-[60px]";
const A2 = "w-[90px] shrink-0 @2xl:w-[52px]";
const A3 = "w-[90px] shrink-0";
const A4 = "w-[90px] shrink-0 @2xl:w-[64px]";

const TicketAmountsPanel: React.FC<
  PartProps & {
    computed: Computed;
    fopOptions: Option[];
    alComTypeOptions: Option[];
  }
> = ({ form, set, computed, fopOptions, alComTypeOptions }) => (
  <div className="@container min-w-0">
    <div
      className={`${panelClass} grid h-full grid-cols-1 items-center gap-x-3 gap-y-2 @md:grid-cols-2 @2xl:grid-cols-[1.35fr_1fr_1.5fr_1fr]`}
    >
      {/* Row 1 */}
      <Field label="FOP :" labelClassName={A1} className="min-w-0">
        <Combo
          id="lkpFOP"
          options={fopOptions}
          value={form.fop}
          onChange={(v) => set("fop", v)}
          className="w-full min-w-0"
          isSearchable
        />
      </Field>

      <Field
        label="G. Fare :"
        htmlFor="txtGFare"
        labelClassName={A2}
        className="min-w-0"
      >
        <FareMoneyInput
          id="txtGFare"
          value={form.gFare}
          onChange={(v) => {
            set("gFare", v);
            // a changed G. Fare also fills S. Fare (a new ticket); a blur that only
            // formats the same value does not overwrite what was typed in S. Fare
            if (v !== form.gFare) set("sFare", v);
          }}
        />
      </Field>

      <Field
        label="Sup. Fee. :"
        htmlFor="txtSupFee"
        labelClassName={A3}
        className="min-w-0"
      >
        <MoneyInput
          id="txtSupFee"
          value={form.supFee}
          onChange={(v) => set("supFee", v)}
        />
      </Field>

      <Field label="Fee VAT :" labelClassName={A4} className="min-w-0">
        <MoneyReadOnly id="txtFeeVat" value={computed.feeVat} />
      </Field>

      {/* Row 2 */}
      <Field
        label="FOP Cash :"
        htmlFor="txtFopCash"
        labelClassName={A1}
        className="min-w-0"
      >
        <MoneyInput
          id="txtFopCash"
          value={form.fopCash}
          onChange={(v) => set("fopCash", v)}
        />
      </Field>

      <Field
        label="S. Fare :"
        htmlFor="txtSFare"
        labelClassName={A2}
        className="min-w-0"
      >
        <FareMoneyInput
          id="txtSFare"
          value={form.sFare}
          onChange={(v) => set("sFare", v)}
        />
      </Field>

      <Field label="A/L Com. :" labelClassName={A3} className="min-w-0">
        <div className="flex w-full min-w-0 items-center gap-1">
          <div className="w-[48px] shrink-0">
            <Combo
              id="lkpALCom"
              fitMenuToBox
              options={alComTypeOptions}
              value={form.alComType}
              onChange={(v) => {
                set("alComType", v);
                // a new type clears the A/L Com. % and amount (the old lkpCommType_EditValueChanged)
                set("alCom", "0.00");
                set("alComAmt", "0.00");
              }}
              className="w-full"
              isSearchable
            />
          </div>
          <div className="min-w-0 flex-1">
            {form.alComType === "P" ? (
              <MoneyInput
                id="txtALCom"
                value={form.alCom}
                onChange={(v) => set("alCom", v)}
              />
            ) : (
              <MoneyReadOnly id="txtALCom" value={computed.alComPer} />
            )}
          </div>
        </div>
      </Field>

      <Field label="Sup. Com. :" labelClassName={A4} className="min-w-0">
        <MoneyReadOnly id="txtSupCom" value={computed.supCom} />
      </Field>

      {/* Row 3 */}
      <Field
        label="FOP CC :"
        htmlFor="txtFopCc"
        labelClassName={A1}
        className="min-w-0"
      >
        <MoneyInput
          id="txtFopCc"
          value={form.fopCc}
          onChange={(v) => set("fopCc", v)}
        />
      </Field>

      <Field
        label="Tax :"
        htmlFor="txtTax"
        labelClassName={A2}
        className="min-w-0"
      >
        <FareMoneyInput
          id="txtTax"
          value={form.tax}
          onChange={(v) => set("tax", v)}
        />
      </Field>

      <Field label="A/L Com. Amt. :" labelClassName={A3} className="min-w-0">
        {form.alComType === "A" ? (
          <MoneyInput
            id="txtALComAmt"
            value={form.alComAmt}
            onChange={(v) => set("alComAmt", v)}
          />
        ) : (
          <MoneyReadOnly id="txtALComAmt" value={computed.alComAmt} />
        )}
      </Field>

      <Field label="A/L C. VAT :" labelClassName={A4} className="min-w-0">
        <MoneyReadOnly id="txtALCVat" value={computed.alCVat} />
      </Field>

      {/* Row 4 */}
      <Field
        label="FOP EP :"
        htmlFor="txtFopEp"
        labelClassName={A1}
        className="min-w-0"
      >
        <MoneyInput
          id="txtFopEp"
          value={form.fopEp}
          onChange={(v) => set("fopEp", v)}
        />
      </Field>

      <Field
        label="K7 :"
        htmlFor="txtK7"
        labelClassName={A2}
        className="min-w-0"
      >
        <FareMoneyInput
          id="txtK7"
          value={form.k7}
          onChange={(v) => set("k7", v)}
        />
      </Field>

      <Field label="Supplier Amt. :" labelClassName={A3} className="min-w-0">
        <MoneyReadOnly id="txtSupplierAmt" value={computed.supplierAmt} />
      </Field>

      <Field label="Net :" labelClassName={A4} className="min-w-0">
        <MoneyReadOnly id="txtNet" value={computed.net} alwaysRed />
      </Field>
    </div>
  </div>
);

/* 3e. Action buttons ----------------------------------------------------- */


/* ---------------------------------------------------------------------
   4. MAIN PAGE : owns the state and renders the parts in one place
   --------------------------------------------------------------------- */
type TicketDetailsProps = {
  onClose?: () => void;
};

const TicketDetails: React.FC<TicketDetailsProps> = ({ onClose }) => {
  // Same names as LoginPage.tsx; the login stores them in localStorage.
  const PstrCoID = localStorage.getItem("PstrCoID") ?? "";
  const PstrYear = localStorage.getItem("PstrYear") ?? "";
  const PstrUserID = localStorage.getItem("PstrUserID") ?? "";

  const [form, setForm] = useState<FormState>(initialForm);

  // Enter moves to the next box (as Tab), and the delete question is the confirm dialog of STOCK
  const handleEnterAsTab = useEnterAsTab();
  const { confirm, dialog } = useConfirmModal();
  const [error, setError] = useState("");
  const ticketNoRef = useRef<HTMLInputElement>(null);
console.log(onClose);

  const set: SetField = (key, value) => {
    setError("");
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  useEffect(() => {
    ticketNoRef.current?.focus();
  }, []);

  /* Ticket type lookup (tbltickettype): the box shows fticketTypeid;
     ftickttypename is kept in the form for the selected row. */
  const [tktTypes, setTktTypes] = useState<TktTypeRecord[]>([]);

  const ticketTypeOptions: Option[] = tktTypes.map((r) => ({
    value: r.ftickettypeid,
    label: r.ftickettypeid,
    secondLabel: r.ftickttypename ?? "",
  }));

  const handleTicketTypeChange = (fticketTypeid: string | null) => {
    const row = tktTypes.find((r) => r.ftickettypeid === fticketTypeid);
    setError("");
    // an XO ticket has no IATA: "NA" (not applicable); leaving XO takes the first real IATA back
    const naIata = iataIdOptions.find((option) => option.value === "NA");
    const realIata = iataIdOptions.find((option) => option.value !== "NA");
    setForm((prev) => ({
      ...prev,
      ticketPrefix: fticketTypeid,
      tktName: row?.ftickttypename ?? "",
      iata:
        fticketTypeid === "X" && naIata
          ? naIata.value
          : prev.ticketPrefix === "X" && prev.iata === "NA" && realIata
            ? realIata.value
            : prev.iata,
    }));
    autoLoad(fticketTypeid, form.ticketNo); // the number was typed first, then the type
  };

  useEffect(() => {
    let cancelled = false;

    getTicketSalesTktTypes(PstrCoID)
      .then((rows) => {
        if (cancelled) return;
        setTktTypes(rows);
        const first = rows[0];
        if (first) {
          setForm((prev) =>
            prev.ticketPrefix
              ? prev
              : {
                  ...prev,
                  ticketPrefix: first.ftickettypeid,
                  tktName: first.ftickttypename ?? "",
                },
          );
        }
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setError(
          err instanceof Error ? err.message : "Failed to load ticket types.",
        );
      });

    return () => {
      cancelled = true;
    };
  }, []);

  /* Form of payment lookup (tblfop): value = ffop (CASH, INV, CC, CASH+CC).
     The box shows the id; the list shows "Name | ID". */
  const [fopOptions, setFopOptions] = useState<Option[]>([]);

  useEffect(() => {
    let cancelled = false;

    getTicketSalesFop(PstrCoID)
      .then((rows) => {
        if (cancelled) return;
        setFopOptions(
          rows.map((r) => ({
            value: r.ffop,
            label: r.ffop, // the box and the list show only the FOP id
          })),
        );
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setError(
          err instanceof Error ? err.message : "Failed to load form of payment.",
        );
      });

    return () => {
      cancelled = true;
    };
  }, []);

  /* A/L Com. type lookup (tbltlparam, fptype = COMTP): value = fpid (P, A).
     A plain list of the ids; P = Percentage, A = Amount. */
  const [alComTypeOptions, setAlComTypeOptions] = useState<Option[]>([]);

  useEffect(() => {
    let cancelled = false;

    getTicketSalesComTypes()
      .then((rows) => {
        if (cancelled) return;
        setAlComTypeOptions(
          rows.map((r) => ({ value: r.fpid, label: r.fpid })),
        );
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setError(
          err instanceof Error
            ? err.message
            : "Failed to load commission types.",
        );
      });

    return () => {
      cancelled = true;
    };
  }, []);

  /* Pax type lookup (tbltlparam, fptype = PXTP): value = fpid (A, C, I). The box
     shows the name; the list reads "Name | ID". */
  const [paxTypeOptions, setPaxTypeOptions] = useState<Option[]>([]);

  useEffect(() => {
    let cancelled = false;

    getTicketSalesPaxTypes()
      .then((rows) => {
        if (cancelled) return;
        setPaxTypeOptions(
          rows.map((r) => ({
            value: r.fpid,
            label: r.fpname ?? r.fpid, // the box shows the name
            secondLabel: r.fpid, // the list reads "Name | ID"
          })),
        );
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setError(
          err instanceof Error ? err.message : "Failed to load pax types.",
        );
      });

    return () => {
      cancelled = true;
    };
  }, []);

  /* D/I lookup (tbltlparam, fptype = DITP): value = fpid (D, I). The box shows
     the id; the list reads "Name | ID". */
  const [diOptions, setDiOptions] = useState<Option[]>([]);

  useEffect(() => {
    let cancelled = false;

    getTicketSalesDi()
      .then((rows) => {
        if (cancelled) return;
        setDiOptions(
          rows.map((r) => ({
            value: r.fpid,
            label: r.fpid, // the box shows the id
            listFirst: r.fpname ?? r.fpid, // the list reads "Name | ID"
            secondLabel: r.fpid,
          })),
        );
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Failed to load D/I.");
      });

    return () => {
      cancelled = true;
    };
  }, []);

  /* Merchant lookup (tbltlparam, fptype = MERC): value = fpid. The box shows the
     name; the list reads "Name | ID". */
  const [merchantOptions, setMerchantOptions] = useState<Option[]>([]);

  useEffect(() => {
    let cancelled = false;

    getTicketSalesMerchants()
      .then((rows) => {
        if (cancelled) return;
        setMerchantOptions(
          rows.map((r) => ({
            value: r.fpid,
            label: r.fpname ?? r.fpid, // the box shows the name
            secondLabel: r.fpid, // the list reads "Name | ID"
          })),
        );
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setError(
          err instanceof Error ? err.message : "Failed to load merchants.",
        );
      });

    return () => {
      cancelled = true;
    };
  }, []);

  /* GDS lookup (tblgds, active): value = fgdsid. The box shows the GDS name,
     the grey box next to it stays empty, and the list shows "Name | ID". */
  const [gdsOptions, setGdsOptions] = useState<Option[]>([]);

  useEffect(() => {
    let cancelled = false;

    getTicketSalesGds(PstrCoID)
      .then((rows) => {
        if (cancelled) return;
        setGdsOptions(
          rows.map((r) => ({
            value: r.fgdsid,
            label: r.fgdsname ?? r.fgdsid,
            secondLabel: r.fgdsid, // list reads "Name | ID"
          })),
        );
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Failed to load GDS.");
      });

    return () => {
      cancelled = true;
    };
  }, []);

  /* Service type lookup (tblservicetype, ticket group): value = fservicetypeid.
     The box shows the id; the list shows "ID | Name". The ID column is as wide
     as the box (divider at the end of the box), then the Name column. */
  const [serviceOptions, setServiceOptions] = useState<Option[]>([]);

  useEffect(() => {
    let cancelled = false;

    getTicketSalesServiceTypes(PstrCoID)
      .then((rows) => {
        if (cancelled) return;
        setServiceOptions(
          rows.map((r) => ({
            value: r.fservicetypeid,
            label: r.fservicetypeid, // the box shows the id
            secondLabel: r.fservicetypename ?? "", // list: ID | Name
          })),
        );
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setError(
          err instanceof Error ? err.message : "Failed to load service types.",
        );
      });

    return () => {
      cancelled = true;
    };
  }, []);

  /* Supplier lookup (tblaccountcs where fcs = 'S'): value = fcsaccountid,
     ID combo shows fcsaccountid, Name combo shows fcsaccountname. */
  const [supplierIdOptions, setSupplierIdOptions] = useState<Option[]>([]);
  const [supplierNameOptions, setSupplierNameOptions] = useState<Option[]>([]);

  useEffect(() => {
    let cancelled = false;

    getTicketSalesSuppliers(PstrCoID)
      .then((rows) => {
        if (cancelled) return;
        setSupplierIdOptions(
          rows.map((r) => ({
            value: r.fcsaccountid,
            label: r.fcsaccountid,
            secondLabel: r.fcsaccountname ?? "", // the ID list shows "ID | Name"
          })),
        );
        setSupplierNameOptions(
          rows.map((r) => ({
            value: r.fcsaccountid,
            label: r.fcsaccountname ?? r.fcsaccountid,
            secondLabel: r.fcsaccountid, // the Name list shows "Name | ID"
          })),
        );
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setError(
          err instanceof Error ? err.message : "Failed to load suppliers.",
        );
      });

    return () => {
      cancelled = true;
    };
  }, []);

  /* Staff lookup (tblstaff): value = fstaffid,
     ID combo shows fstaffid, Name combo shows fstaffname. */
  const [staffIdOptions, setStaffIdOptions] = useState<Option[]>([]);
  const [staffNameOptions, setStaffNameOptions] = useState<Option[]>([]);

  useEffect(() => {
    let cancelled = false;

    getTicketSalesStaffs(PstrCoID)
      .then((rows) => {
        if (cancelled) return;
        setStaffIdOptions(
          rows.map((r) => ({
            value: r.fstaffid,
            label: r.fstaffid,
            secondLabel: r.fstaffname ?? "", // the ID list shows "ID | Name"
          })),
        );
        setStaffNameOptions(
          rows.map((r) => ({
            value: r.fstaffid,
            label: r.fstaffname ?? r.fstaffid,
            secondLabel: r.fstaffid, // the Name list shows "Name | ID"
          })),
        );
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setError(
          err instanceof Error ? err.message : "Failed to load staff.",
        );
      });

    return () => {
      cancelled = true;
    };
  }, []);

  /* IATA lookup (tbliata): value = fiatacode,
     ID combo shows fiatacode, Name combo shows fiataname. */
  const [iataBspAccounts, setIataBspAccounts] = useState<Record<string, string>>({});
  const [iataIdOptions, setIataIdOptions] = useState<Option[]>([]);
  const [iataNameOptions, setIataNameOptions] = useState<Option[]>([]);

  useEffect(() => {
    let cancelled = false;

    getTicketSalesIatas(PstrCoID)
      .then((rows) => {
        if (cancelled) return;
        // the IATA codes that have a BSP account (the supplier of a BSP ticket must be it)
        setIataBspAccounts(
          Object.fromEntries(
            rows
              .filter((r) => (r.fbsppurchase_csaccountid ?? "").trim() !== "")
              .map((r) => [r.fiatacode, (r.fbsppurchase_csaccountid ?? "").trim()]),
          ),
        );
        setIataIdOptions(
          rows.map((r) => ({
            value: r.fiatacode,
            label: r.fiatacode,
            secondLabel: r.fiataname ?? "", // the ID list shows "ID | Name"
          })),
        );
        setIataNameOptions(
          rows.map((r) => ({
            value: r.fiatacode,
            label: r.fiataname ?? r.fiatacode,
            secondLabel: r.fiatacode, // the Name list shows "Name | ID"
          })),
        );
        const first = rows[0];
        if (first) {
          setForm((prev) =>
            prev.iata ? prev : { ...prev, iata: first.fiatacode },
          );
        }
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setError(
          err instanceof Error ? err.message : "Failed to load IATA codes.",
        );
      });

    return () => {
      cancelled = true;
    };
  }, []);

  /* Branch lookup (tblbranch): value = fbrid,
     ID combo shows fbrid, Name combo shows fbrname. */
  const [branchIdOptions, setBranchIdOptions] = useState<Option[]>([]);
  const [branchNameOptions, setBranchNameOptions] = useState<Option[]>([]);

  useEffect(() => {
    let cancelled = false;

    getTicketSalesBranches(PstrCoID)
      .then((rows) => {
        if (cancelled) return;
        setBranchIdOptions(
          rows.map((r) => ({
            value: r.fbrid,
            label: r.fbrid,
            secondLabel: r.fbrname ?? r.fbrid, // the ID list shows "ID | Name"
          })),
        );
        setBranchNameOptions(
          rows.map((r) => ({
            value: r.fbrid,
            label: r.fbrname ?? r.fbrid,
            secondLabel: r.fbrid, // the Name list shows "Name | ID"
          })),
        );
        const first = rows[0];
        if (first) {
          setForm((prev) =>
            prev.branch ? prev : { ...prev, branch: first.fbrid },
          );
        }
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setError(
          err instanceof Error ? err.message : "Failed to load branches.",
        );
      });

    return () => {
      cancelled = true;
    };
  }, []);

  /* Airline lookup: value = fairlineno (unique key),
     ID combo shows fairlineno, Name combo shows fairlinename. */
  const [airlineIdOptions, setAirlineIdOptions] = useState<Option[]>([]);
  const [airlineNameOptions, setAirlineNameOptions] = useState<Option[]>([]);

  useEffect(() => {
    let cancelled = false;

    getTicketSalesAirlines(PstrCoID)
      .then((rows) => {
        if (cancelled) return;
        setAirlineIdOptions(
          rows.map((r) => ({
            value: r.fairlineno,
            label: r.fairlineno, // the box shows the airline no.
            secondLabel: r.fairlinename, // the ID list shows "ID | Name"
          })),
        );
        setAirlineNameOptions(
          rows.map((r) => ({
            value: r.fairlineno,
            label: r.fairlinename,
            secondLabel: r.fairlineno, // list reads "Name | No."
          })),
        );
        const first = rows[0];
        if (first) {
          setForm((prev) =>
            prev.airline ? prev : { ...prev, airline: first.fairlineno },
          );
        }
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setError(
          err instanceof Error ? err.message : "Failed to load airlines.",
        );
      });

    return () => {
      cancelled = true;
    };
  }, []);

  /* Calculated (read-only) amounts. Fill these from your pricing rules;
     they stay at 0.00 because the rules are not shown in the screenshot. */
  /* The VAT percentages (by the date, D/I and airline of the ticket). The old form
     took D/I as "D" when K7 (the purchase VAT) is entered, otherwise the D/I box. */
  const [vat, setVat] = useState<TicketSalesVat>(noVat);
  const vatDorI: "D" | "I" = form.di === "D" || toNumber(form.k7) !== 0 ? "D" : "I";

  useEffect(() => {
    let cancelled = false;

    getTicketSalesVat(PstrCoID, {
      lkpDI: vatDorI,
      dtpDate: form.date,
      lkpAirlineNo: form.airline ?? "",
    })
      .then((data) => {
        if (!cancelled) setVat(data);
      })
      .catch((err: unknown) => {
        // without them the VAT amounts stay 0
        console.error("Failed to load the VAT percentages:", err);
        if (!cancelled) setVat(noVat);
      });

    return () => {
      cancelled = true;
    };
  }, [vatDorI, form.date, form.airline]);

  const computed = calcAmounts(form, vat);

  /* Save or Modify: the Save button is Modify while the ticket of the Ticket Type + Ticket No. boxes is a saved one
     (it was loaded, or it was just saved), as in the old form. Another ticket no. is a new ticket again, and so is another
     Sl. No.: a Ticket No. has a row for each Sl. No. (both tables), the Sl. No. box starts at 1. */
  const [savedKey, setSavedKey] = useState("");
  const ticketKey = `${form.ticketPrefix ?? ""}|${form.ticketNo.trim()}|${form.slNo.trim()}`;
  const isModify = savedKey !== "" && savedKey === ticketKey;

  /* The rules of the old form (ValidateMe) before a save: the form, the fares panel, the ticket type and the D/I.
     The first rule that fails stops the save: its message is shown and the cursor goes to its box. The rules that
     only warn are shown and the save goes on. The customer lines have their own rules in the grid. */
  const validateForm = (lines: TicketLinePayload[], detail: TicketDetailPayload): boolean => {
    const result = validateTicketHeader({
      loginYear: PstrYear,
      ticketType: form.ticketPrefix,
      ticketNo: form.ticketNo,
      airline: form.airline,
      branch: form.branch,
      iata: form.iata,
      date: form.date,
      bspDate: form.bspDate,
      flightDate: form.flightDate,
      di: form.di,
      isVoid: form.voidFlag === "Yes",
      supplier: form.supplier,
      supPayment: form.supPayment,
      pax: form.pax,
      staff: form.staff,
      trip: form.trip,
      route: form.route,
      destination: form.destination,
      gds: form.gds,
      fop: form.fop,
      ccType: form.ccType,
      merchant: form.merchant,
      alComType: form.alComType,
      sFare: toNumber(form.sFare),
      tax: toNumber(form.tax),
      supFee: toNumber(form.supFee),
      k7: toNumber(form.k7),
      supplierAmt: computed.supplierAmt,
      kbAmt: detail.txtKbAmt,
      kbAccount: detail.lkpKbAccount,
      vatPer: vat.txtSCVATPer,
      iataBspAccounts,
      lines: lines.map((line) => ({
        customer: line.lkpLineCustomer,
        fare: line.txtLineFare,
        tax: line.txtLineTax,
        invAmt: line.txtLineInvAmt,
      })),
    });

    if (result.error) {
      toast.error(result.error.message);
      if (result.error.focusId) document.getElementById(result.error.focusId)?.focus();
      return false;
    }

    result.warnings.forEach((message) => toast.warn(message));
    return true;
  };

  /* Save a new ticket: the form (header) + the customer grid lines + the
     detail fields go to the server, which inserts tblticketsales and
     tblticketsalesb in one transaction. */
  const handleSave = async (
    lines: TicketLinePayload[],
    detail: TicketDetailPayload,
  ) => {
    try {
      // a saved ticket is loaded (or was just saved) and its Ticket Type + Ticket No. are still in the boxes: Modify
      const result = await (isModify ? modifyTicketSales : saveTicketSales)({
        PstrCoID,
        PstrYear,
        PstrUserID,
        // the keys are the element ids of this screen
        lkpTktType: form.ticketPrefix,
        txtTktSLNo: form.ticketNo,
        txtSlNo: form.slNo,
        lkpAirlineNo: form.airline,
        lkpBranch: form.branch,
        lkpIATA: form.iata,
        dtpDate: form.date,
        dtpBSPDate: form.bspDate,
        dtpFlightDate: form.flightDate,
        dtpReturnDate: form.returnDate,
        txtPNRNo: form.pnrNo,
        lkpDI: form.di,
        lkpSupplier: form.supplier,
        lkpPaySupplierID: form.supPayment,
        txtPaxName: form.pax,
        lkpStaffID: form.staff,
        txtBookingGDSLogin: form.bookingGdsLogin,
        lkpPaxType: form.paxType,
        txtPaxNameId: form.paxId,
        lkpVoid: form.voidFlag,
        lkpService: form.service,
        txtSalesGDSLogin: form.salesGdsLogin,
        txtMobile: form.mobile,
        txtEmail: form.email,
        lkpTrip: form.trip,
        txtTourCode: form.tourCode,
        txtRoute: form.route,
        txtClass: form.travelClass,
        txtDestination: form.destination,
        lkpCNJ: form.cnj,
        lkpGDS: form.gds,
        lkpCCType: form.ccType,
        txtCarrier: form.carrier,
        txtFareBasis: form.fareBasis,
        lkpMerchant: form.merchant,
        lkpFOP: form.fop,
        txtGFare: form.gFare,
        txtSupFee: form.supFee,
        txtFeeVat: computed.feeVat,
        txtFopCash: form.fopCash,
        txtSFare: form.sFare,
        lkpALCom: form.alComType,
        txtALCom: computed.alComPer,
        txtSupCom: computed.supCom,
        txtFopCc: form.fopCc,
        txtTax: form.tax,
        txtALComAmt: computed.alComAmt,
        txtALCVat: computed.alCVat,
        txtFopEp: form.fopEp,
        txtK7: form.k7,
        txtSupplierAmt: computed.supplierAmt,
        lines,
        ...detail,
      });
      toast.success(result.message || (isModify ? "Modified successfully" : "Saved successfully"));
      setSavedKey(ticketKey); // the ticket exists now: the button is Modify from here
    } catch (err) {
      toast.error(
        err instanceof Error
          ? err.message
          : isModify
            ? "Failed to modify the ticket."
            : "Failed to save the ticket.",
      );
    }
  };

  /* Load a saved ticket (Enter in Ticket No. or the Search button): the form and the customer grid are filled
     from the ticket and its customer line. */
  const [loaded, setLoaded] = useState<{ version: number; ticket: LoadedTicket } | undefined>(undefined);

  // silent = the automatic load: a ticket number that does not exist is a NEW ticket, so no message for it
  const loadTicket = async (type: string | null, no: string, slNo: string, silent: boolean) => {
    const ticketNo = no.trim();
    if (!type) {
      if (!silent) toast.error("Please select 'Ticket Type'");
      return;
    }
    if (ticketNo === "") {
      if (!silent) toast.error("Please enter 'Ticket No.'");
      return;
    }

    try {
      const { ticket } = await getTicketSales({
        PstrCoID,
        PstrYear,
        lkpTktType: type,
        txtTktSLNo: ticketNo,
        lkpBranch: form.branch,
        txtSlNo: slNo,
      });

      const tktName = tktTypes.find((r) => r.ftickettypeid === ticket.lkpTktType)?.ftickttypename ?? "";
      setError("");
      setForm((prev) => ({ ...prev, ...formFromTicket(ticket, tktName) }));
      setLoaded({ version: Date.now(), ticket });
      setSavedKey(`${ticket.lkpTktType}|${ticket.txtTktSLNo.trim()}|${ticket.txtSlNo}`); // a saved ticket: the button is Modify
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load the ticket.";
      if (silent && /not found$/i.test(message)) return;
      toast.error(message);
    }
  };

  /* Delete the saved ticket of the Ticket Type + Ticket No. boxes (the old cmdDelete_Click): the type and the number are
     checked, it asks "Do you want to Delete ?", deletes the ticket and its customer line, and clears the screen. */
  const [clearVersion, setClearVersion] = useState(0);

  const clearScreen = () => {
    const firstType = tktTypes[0];
    setForm({
      ...initialForm(),
      ticketPrefix: firstType?.ftickettypeid ?? null,
      tktName: firstType?.ftickttypename ?? "",
      branch: branchIdOptions[0]?.value ?? null,
      iata: iataIdOptions[0]?.value ?? null,
      airline: airlineIdOptions[0]?.value ?? null,
    });
    setSavedKey("");
    setLoaded(undefined);
    lastAutoKey.current = "";
    setClearVersion((v) => v + 1);
    ticketNoRef.current?.focus();
  };

  const handleDelete = async () => {
    if (!form.ticketPrefix) {
      toast.error("Please select a 'Ticket Type'");
      document.getElementById("lkpTktType")?.focus();
      return;
    }
    if (form.ticketNo.trim() === "") {
      toast.error("Please input 'Ticket No.'");
      document.getElementById("txtTktSLNo")?.focus();
      return;
    }
    if (!(await confirm({ message: "Do you want to delete?" }))) return;

    try {
      const result = await deleteTicketSales({
        PstrCoID,
        PstrYear,
        lkpTktType: form.ticketPrefix,
        txtTktSLNo: form.ticketNo.trim(),
        lkpBranch: form.branch,
        txtSlNo: form.slNo.trim() || null, // only this Sl. No.: the other Sl. Nos of the Ticket No. stay
      });
      toast.success(result.message || "Deleted successfully");
      clearScreen();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Not deleted, try again");
    }
  };

  // Enter in Ticket No. or the Search button: always loads (and says when the ticket is not found)
  const handleSearch = () => {
    lastAutoKey.current = `${form.ticketPrefix ?? ""}|${form.ticketNo.trim()}|${form.slNo.trim()}`;
    void loadTicket(form.ticketPrefix, form.ticketNo, form.slNo.trim(), false);
  };

  // Automatic load: when the Ticket Type and Ticket No. are given and you leave the Ticket No. box (or pick the type
  // after typing the number). The same ticket is not loaded twice by itself, so what you typed is never overwritten.
  const lastAutoKey = useRef("");
  const autoLoad = (type: string | null, no: string, slNo: string = form.slNo.trim()) => {
    const key = `${type ?? ""}|${no.trim()}|${slNo}`;
    if (!type || no.trim() === "" || key === lastAutoKey.current) return;
    lastAutoKey.current = key;
    void loadTicket(type, no, slNo, true);
  };

  /* Leaving the Sl. No. box (a Ticket No. has a row for each Sl. No., both tables):
       - a Sl. No. that is saved shows its data (Modify);
       - a Sl. No. that is not saved yet is a new row: what is on the screen stays and Save inserts it as that Sl. No.;
       - an empty box shows the next free Sl. No. (2 when Sl. No. 1 is saved, 1 when the Ticket No. is not saved yet). */
  const handleSlNoLeave = async () => {
    if (!form.ticketPrefix || form.ticketNo.trim() === "") return;

    const typed = form.slNo.trim();
    if (typed !== "" && Number(typed) >= 1) {
      autoLoad(form.ticketPrefix, form.ticketNo, typed);
      return;
    }

    try {
      const { next } = await getTicketSalesSlNos({
        PstrCoID,
        PstrYear,
        lkpTktType: form.ticketPrefix,
        txtTktSLNo: form.ticketNo.trim(),
      });
      set("slNo", String(next));
      lastAutoKey.current = `${form.ticketPrefix}|${form.ticketNo.trim()}|${next}`; // a free number: nothing to load
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to get the next Sl. No.");
    }
  };

  

  return (
    <div
      className="flex min-h-full w-full items-start justify-center bg-white px-2 py-2 sm:px-4 sm:py-4"
      onKeyDown={handleEnterAsTab}
    >
      <div className="min-h-fit w-full max-w-375 bg-white p-0">
        <main className="h-fit w-full overflow-hidden border border-gray-400 ">
          <Header Name="Ticket Sales"/>

          <section className="@container flex flex-col gap-3 px-2 pb-6 pt-3 sm:pl-3.5 sm:pr-14">
            <TicketTopBar
              form={form}
              set={set}
              ticketNoRef={ticketNoRef}
              onSearch={handleSearch}
              onTicketNoLeave={() => autoLoad(form.ticketPrefix, form.ticketNo)}
              airlineIdOptions={airlineIdOptions}
              airlineNameOptions={airlineNameOptions}
              ticketTypeOptions={ticketTypeOptions}
              onTicketTypeChange={handleTicketTypeChange}
              keyLocked={isModify}
              onSlNoLeave={handleSlNoLeave}
              branchIdOptions={branchIdOptions}
              branchNameOptions={branchNameOptions}
              iataIdOptions={iataIdOptions}
              iataNameOptions={iataNameOptions}
            />

            <TicketDetailsFields
              form={form}
              set={set}
              staffIdOptions={staffIdOptions}
              staffNameOptions={staffNameOptions}
              supplierIdOptions={supplierIdOptions}
              supplierNameOptions={supplierNameOptions}
              serviceOptions={serviceOptions}
              diOptions={diOptions}
              paxTypeOptions={paxTypeOptions}
            />

            <div className="grid grid-cols-1 gap-3 @4xl:grid-cols-[1fr_2fr]">
              <TicketRoutePanel
                form={form}
                set={set}
                gdsOptions={gdsOptions}
                merchantOptions={merchantOptions}
              />
              <TicketAmountsPanel
                form={form}
                set={set}
                computed={computed}
                fopOptions={fopOptions}
                alComTypeOptions={alComTypeOptions}
              />
            </div>

            {error && (
              <p role="alert" className="m-0 text-[12px] text-[#c0392b]">
                {error}
              </p>
            )}

          
          </section>
           <TicketLinesPage
            onSave={handleSave}
            onValidate={validateForm}
            saveLabel={isModify ? "Modify" : "Save"}
            onDeleteTicket={handleDelete}
            clearVersion={clearVersion}
            loaded={loaded}
            onAction={(name) => {
              if (name === "search") handleSearch();
              if (name === "cancel") clearScreen(); // the header too, so the Ticket Type / No. are open for another ticket
            }}
            context={{
              sFare: toNumber(form.sFare),
              supFee: toNumber(form.supFee),
              tax: toNumber(form.tax),
              dorI: vatDorI,
              boxDorI: form.di === "D" ? "D" : "I",
              vatPer: vat.txtSCVATPer,
              serviceId: form.service ?? "",
              merchantIsAirline: form.merchant === "A",
              isVoid: form.voidFlag === "Yes",
              supplierAmt: computed.supplierAmt,
              feeVat: computed.feeVat,
              k7: toNumber(form.k7),
            }}
          />
        </main>
        {dialog}
      </div>
    </div>
  );
};

export default TicketDetails;