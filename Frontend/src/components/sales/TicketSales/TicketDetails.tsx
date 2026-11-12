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
import CnjModal, { isEmptyCnjRow, type CnjRow } from "./CnjModal";
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
  lkpTktType: string | null; // fticketTypeid
  txtTktTypeName: string; // ftickttypename of the selected ticket type
  txtTktSLNo: string;
  txtSlNo: string; // fSlNo (txtSlNo): starts at 1
  lkpAirlineNo: string | null;
  lkpBranch: string | null;
  lkpIATA: string | null;

  dtpDate: string;
  dtpBSPDate: string;
  dtpFlightDate: string;
  lkpDI: string | null;
  lkpVoid: string | null;

  lkpSupplier: string | null;
  lkpPaySupplierID: string | null;

  txtPaxName: string;
  lkpStaffID: string | null;
  txtBookingGDSLogin: string;

  txtMobile: string;
  lkpPaxType: string | null;
  lkpService: string | null;
  txtSalesGDSLogin: string;
  txtPNRNo: string;

  txtEmail: string;
  txtPaxNameId: string;
  lkpTrip: string | null;
  dtpReturnDate: string;
  txtTourCode: string;

  txtRoute: string;
  txtClass: string;
  lkpFOP: string | null;
  txtDestination: string;
  lkpCNJ: string | null;
  lkpGDS: string | null;
  lkpCCType: string | null;
  txtCarrier: string;
  txtFareBasis: string;
  lkpMerchant: string | null;
  txtFopCash: string;
  txtFopCc: string;
  txtFopEp: string;

  txtGFare: string;
  txtSFare: string;
  txtTax: string;
  txtK7: string;
  txtSupFee: string;
  lkpALCom: string | null;
  txtALCom: string; // A/L Com. % (typed when the type is P)
  txtALComAmt: string; // A/L Com. Amt. (typed when the type is A)
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
  const gFare = toNumber(form.txtGFare);
  const sFare = toNumber(form.txtSFare);
  const tax = toNumber(form.txtTax);
  const k7 = toNumber(form.txtK7);
  const supFee = toNumber(form.txtSupFee);

  // A/L Com. (the old CalcCommAmt / CalcCommPer): type P = the % is typed and the amount is
  // worked out; type A = the amount is typed and the % is worked out.
  const alComPer =
    form.lkpALCom === "P"
      ? toNumber(form.txtALCom)
      : sFare !== 0
        ? round2((toNumber(form.txtALComAmt) / sFare) * 100)
        : 0;
  const alComAmt =
    form.lkpALCom === "P"
      ? round2(sFare * toNumber(form.txtALCom) * 0.01)
      : round2(toNumber(form.txtALComAmt));

  const isBspTicket = form.lkpTktType === "B" || form.lkpTktType === "BS";
  const supCom = isBspTicket && form.txtTourCode.trim() === "" ? round2(gFare - sFare) : 0;

  const vatOnCommission = form.lkpDI === "D" || vat.chkVATOnCommission;
  const alCVat = vatOnCommission
    ? round2((supCom + alComAmt) * vat.txtCommVATPer * 0.01)
    : 0;

  const feeVat =
    SUPPLIER_CALC_FEE_VAT && form.lkpPaySupplierID
      ? round2(supFee * vat.txtSCVATPer * 0.01)
      : 0;

  const supplierAmt = round2(sFare - alComAmt + tax + k7 + supFee + feeVat);
  const net = round2(supplierAmt - alCVat);

  return { feeVat, supCom, alComPer, alComAmt, alCVat, supplierAmt, net };
};

const initialForm = (): FormState => ({
  lkpTktType: null,
  txtTktTypeName: "",
  txtTktSLNo: "",
  txtSlNo: "1",
  lkpAirlineNo: null,
  lkpBranch: null,
  lkpIATA: null,

  dtpDate: TODAY,
  dtpBSPDate: "",
  dtpFlightDate: "",
  lkpDI: "I",
  lkpVoid: "No",

  lkpSupplier: null,
  lkpPaySupplierID: null,

  txtPaxName: "",
  lkpStaffID: null,
  txtBookingGDSLogin: "",

  txtMobile: "",
  lkpPaxType: "A", // Adult (fpid of tbltlparam PXTP)
  lkpService: "TKT",
  txtSalesGDSLogin: "",
  txtPNRNo: "",

  txtEmail: "",
  txtPaxNameId: "",
  lkpTrip: null,
  dtpReturnDate: "",
  txtTourCode: "",

  txtRoute: "",
  txtClass: "",
  lkpFOP: "CASH",
  txtDestination: "",
  lkpCNJ: "No",
  lkpGDS: null,
  lkpCCType: "NA",
  txtCarrier: "",
  txtFareBasis: "",
  lkpMerchant: "NA",
  txtFopCash: "0.00",
  txtFopCc: "0.00",
  txtFopEp: "0.00",

  txtGFare: "0.00",
  txtSFare: "0.00",
  txtTax: "0.00",
  txtK7: "0.00",
  txtSupFee: "0.00",
  lkpALCom: "P",
  txtALCom: "0.00",
  txtALComAmt: "0.00",
});

/* A saved ticket (from the server, the keys are the element ids) -> the values of the form. The calculated boxes
   (Fee VAT, Sup. Com., A/L C. VAT, Supplier Amt., Net) are worked out again from these values. */
const money2 = (value: number) => value.toFixed(2);
const orNull = (value: string) => (value === "" ? null : value);

const formFromTicket = (t: LoadedTicket, tktName: string): Partial<FormState> => ({
  lkpTktType: t.lkpTktType,
  txtTktTypeName: tktName,
  txtTktSLNo: t.txtTktSLNo,
  txtSlNo: String(t.txtSlNo),
  lkpAirlineNo: orNull(t.lkpAirlineNo),
  lkpBranch: orNull(t.lkpBranch),
  lkpIATA: orNull(t.lkpIATA),

  dtpDate: t.dtpDate,
  dtpBSPDate: t.dtpBSPDate,
  dtpFlightDate: t.dtpFlightDate,
  dtpReturnDate: t.dtpReturnDate,
  txtPNRNo: t.txtPNRNo,
  lkpDI: orNull(t.lkpDI),
  lkpSupplier: orNull(t.lkpSupplier),
  lkpPaySupplierID: orNull(t.lkpPaySupplierID),
  txtPaxName: t.txtPaxName,
  lkpStaffID: orNull(t.lkpStaffID),
  txtBookingGDSLogin: t.txtBookingGDSLogin ?? "",
  lkpPaxType: orNull(t.lkpPaxType),
  txtPaxNameId: t.txtPaxNameId,
  lkpVoid: t.lkpVoid,
  lkpService: orNull(t.lkpService),
  txtSalesGDSLogin: t.txtSalesGDSLogin ?? "",
  txtMobile: t.txtMobile,
  txtEmail: t.txtEmail,
  lkpTrip: orNull(t.lkpTrip),
  txtTourCode: t.txtTourCode,

  txtRoute: t.txtRoute,
  txtClass: t.txtClass,
  txtDestination: t.txtDestination,
  lkpCNJ: t.lkpCNJ,
  lkpGDS: orNull(t.lkpGDS),
  lkpCCType: orNull(t.lkpCCType),
  txtCarrier: t.txtCarrier,
  txtFareBasis: t.txtFareBasis,
  lkpMerchant: orNull(t.lkpMerchant),

  lkpFOP: orNull(t.lkpFOP),
  txtGFare: money2(t.txtGFare),
  txtSupFee: money2(t.txtSupFee),
  txtFopCash: money2(t.txtFopCash),
  txtSFare: money2(t.txtSFare),
  lkpALCom: orNull(t.lkpALCom),
  txtALCom: money2(t.txtALCom),
  txtFopCc: money2(t.txtFopCc),
  txtTax: money2(t.txtTax),
  txtALComAmt: money2(t.txtALComAmt),
  txtFopEp: money2(t.txtFopEp),
  txtK7: money2(t.txtK7),
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
  <div className="grid w-full grid-cols-1 items-center gap-x-4 gap-y-2.5 sm:grid-cols-2 lg:grid-cols-[minmax(385px,1.4fr)_1.5fr_1.3fr_1.5fr]">

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
          value={form.lkpTktType}
          onChange={onTicketTypeChange}
          className="w-16.25 shrink-0"
          disabled={keyLocked}
          isSearchable
        />

        <input
          ref={ticketNoRef}
          id="txtTktSLNo"
          value={form.txtTktSLNo}
          readOnly={keyLocked}
          maxLength={10} // the old txtTktSlNo: 10 characters at most
          onChange={(event) => set("txtTktSLNo", event.target.value)}
          onBlur={onTicketNoLeave}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              onSearch();
            }
          }}
          className={`input-style w-full min-w-[104px] ${keyLocked ? "!bg-[#eef1f4]" : ""}`} // room for 10 digits
        />

        {/* Sl. No. (fSlNo): 1 to start with */}
        <Field label="Sl. No. :" htmlFor="txtSlNo" className="shrink-0 whitespace-nowrap">
          <input
            id="txtSlNo"
            inputMode="numeric"
            maxLength={3}
            value={form.txtSlNo}
            onFocus={(event) => event.target.select()}
            onBlur={onSlNoLeave}
            onChange={(event) => {
              if (/^\d{0,3}$/.test(event.target.value)) set("txtSlNo", event.target.value);
            }}
            className="input-style w-9 shrink-0 text-center"
          />
        </Field>
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
          value={form.lkpAirlineNo}
          onChange={(v) => set("lkpAirlineNo", v)}
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
          value={form.lkpBranch}
          onChange={(v) => set("lkpBranch", v)}
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
          value={form.lkpIATA}
          onChange={(v) => set("lkpIATA", v)}
          idWidth="w-[110px] shrink-0"
          nameWidth="min-w-0 flex-1"
          fitMenuToPair
          nameSecondColumnExtra={88}
          nameFirstHeader="IATA"
          nameSecondHeader="IATA Code"
          isSearchable
          disabled={form.lkpTktType === "X"} // an XO ticket is saved with IATA NA only
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
        value={form.dtpDate}
        onChange={(v) => set("dtpDate", v)}
      />
      </div>
    </Field>
    <Field label="BSP Date :" labelClassName={LB} className="min-w-0 lg:col-span-2 mb-2">
      <div className="w-35 min-w-0">
        <AppDatePicker
        id="dtpBSPDate"
        label="BSP Date"
        value={form.dtpBSPDate}
        onChange={(v) => set("dtpBSPDate", v)}
      />
      </div>
    </Field>
   
    <Field label="Flight Date :" labelClassName={LC} className="min-w-0 lg:col-span-2 mb-2">
      <div className="w-35 min-w-0">
        <AppDatePicker
        id="dtpFlightDate"
        label="Flight Date"
        value={form.dtpFlightDate}
        onChange={(v) => set("dtpFlightDate", v)}
      />
      </div>
    </Field>
    <Field label="Return Date :" labelClassName={LC} className="min-w-0 lg:col-span-2 mb-2">
      <div className="w-35 min-w-0">
        <AppDatePicker
       id="dtpReturnDate"
        label="Return Date"
        value={form.dtpReturnDate}
        onChange={(v) => set("dtpReturnDate", v)}
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
        value={form.txtPNRNo}
        onChange={(event) => set("txtPNRNo", event.target.value)}
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
        value={form.lkpDI}
        onChange={(v) => set("lkpDI", v)}
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
        value={form.lkpSupplier}
        onChange={(v) => {
          set("lkpSupplier", v);
          if (form.lkpPaySupplierID === null || form.lkpPaySupplierID === form.lkpSupplier) {
            set("lkpPaySupplierID", v);
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
        value={form.lkpPaySupplierID}
        onChange={(v) => set("lkpPaySupplierID", v)}
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
        value={form.txtPaxName}
        onChange={(event) => set("txtPaxName", event.target.value)}
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
        value={form.lkpStaffID}
        onChange={(v) => set("lkpStaffID", v)}
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
        value={form.txtBookingGDSLogin}
        onChange={(e) => set("txtBookingGDSLogin", e.target.value)}
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
        value={form.lkpPaxType}
        onChange={(v) => set("lkpPaxType", v)}
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
        value={form.txtPaxNameId}
        onChange={(event) => set("txtPaxNameId", event.target.value)}
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
        value={form.lkpVoid}
        onChange={(v) => set("lkpVoid", v)}
        isSearchable
      />
      </div>
    </Field>
    <Field label="Service Type :" labelClassName={LC} className="min-w-0 lg:col-span-2 mb-2">
      <Combo
        id="lkpService"
        menuWidth={240}
        options={serviceOptions}
        value={form.lkpService}
        onChange={(v) => set("lkpService", v)}
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
        value={form.txtSalesGDSLogin}
        onChange={(e) => set("txtSalesGDSLogin", e.target.value)}
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
        value={form.txtMobile}
        onChange={(event) => set("txtMobile", event.target.value)}
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
        value={form.txtEmail}
        onChange={(event) => set("txtEmail", event.target.value)}
        className={inputClass}
      />
    </Field>
   
    <Field label="Trip :" labelClassName={LC} className="min-w-0 lg:col-span-3">
      <Combo
        id="lkpTrip"
        options={tripOptions}
        value={form.lkpTrip}
        onChange={(v) => set("lkpTrip", v)}
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
        value={form.txtTourCode}
        onChange={(event) => set("txtTourCode", event.target.value)}
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
  PartProps & { gdsOptions: Option[]; merchantOptions: Option[]; onCnjChange: (value: string | null) => void }
> = ({ form, set, gdsOptions, merchantOptions, onCnjChange }) => (
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
          value={form.txtRoute}
          maxLength={ROUTE_MAX_LENGTH}
          autoCapitalize="characters"
          onChange={(e) => set("txtRoute", formatRoute(e.target.value))}
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
          value={form.txtClass}
          maxLength={8}
          autoCapitalize="characters"
          onChange={(e) => set("txtClass", e.target.value.toUpperCase())}
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
            value={form.txtDestination}
            maxLength={3}
            autoCapitalize="characters"
            onChange={(e) => set("txtDestination", formatAirportCode(e.target.value))}
            className={`${inputClassforTicketRoutePanel} flex-1`}
          />
          <Field label="CNJ. :" className="shrink-0">
            <Combo
              id="lkpCNJ"
              fitMenuToBox
              options={yesNoOptions}
              value={form.lkpCNJ}
              onChange={(v) => onCnjChange(v)}
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
            value={form.lkpGDS}
            onChange={(v) => set("lkpGDS", v)}
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
          value={form.txtCarrier}
          onChange={(e) => set("txtCarrier", e.target.value)}
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
          value={form.lkpMerchant}
          onChange={(v) => set("lkpMerchant", v)}
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
          value={form.lkpFOP}
          onChange={(v) => set("lkpFOP", v)}
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
          value={form.txtGFare}
          onChange={(v) => {
            set("txtGFare", v);
            // a changed G. Fare also fills S. Fare (a new ticket); a blur that only
            // formats the same value does not overwrite what was typed in S. Fare
            if (v !== form.txtGFare) set("txtSFare", v);
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
          value={form.txtSupFee}
          onChange={(v) => set("txtSupFee", v)}
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
          value={form.txtFopCash}
          onChange={(v) => set("txtFopCash", v)}
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
          value={form.txtSFare}
          onChange={(v) => set("txtSFare", v)}
        />
      </Field>

      <Field label="A/L Com. :" labelClassName={A3} className="min-w-0">
        <div className="flex w-full min-w-0 items-center gap-1">
          <div className="w-[48px] shrink-0">
            <Combo
              id="lkpALCom"
              fitMenuToBox
              options={alComTypeOptions}
              value={form.lkpALCom}
              onChange={(v) => {
                set("lkpALCom", v);
                // a new type clears the A/L Com. % and amount (the old lkpCommType_EditValueChanged)
                set("txtALCom", "0.00");
                set("txtALComAmt", "0.00");
              }}
              className="w-full"
              isSearchable
            />
          </div>
          <div className="min-w-0 flex-1">
            {form.lkpALCom === "P" ? (
              <MoneyInput
                id="txtALCom"
                value={form.txtALCom}
                onChange={(v) => set("txtALCom", v)}
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
          value={form.txtFopCc}
          onChange={(v) => set("txtFopCc", v)}
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
          value={form.txtTax}
          onChange={(v) => set("txtTax", v)}
        />
      </Field>

      <Field label="A/L Com. Amt. :" labelClassName={A3} className="min-w-0">
        {form.lkpALCom === "A" ? (
          <MoneyInput
            id="txtALComAmt"
            value={form.txtALComAmt}
            onChange={(v) => set("txtALComAmt", v)}
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
          value={form.txtFopEp}
          onChange={(v) => set("txtFopEp", v)}
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
          value={form.txtK7}
          onChange={(v) => set("txtK7", v)}
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
      lkpTktType: fticketTypeid,
      txtTktTypeName: row?.ftickttypename ?? "",
      lkpIATA:
        fticketTypeid === "X" && naIata
          ? naIata.value
          : prev.lkpTktType === "X" && prev.lkpIATA === "NA" && realIata
            ? realIata.value
            : prev.lkpIATA,
    }));
    autoLoad(fticketTypeid, form.txtTktSLNo); // the number was typed first, then the type
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
            prev.lkpTktType
              ? prev
              : {
                  ...prev,
                  lkpTktType: first.ftickettypeid,
                  txtTktTypeName: first.ftickttypename ?? "",
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
            prev.lkpIATA ? prev : { ...prev, lkpIATA: first.fiatacode },
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
            prev.lkpBranch ? prev : { ...prev, lkpBranch: first.fbrid },
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
            prev.lkpAirlineNo ? prev : { ...prev, lkpAirlineNo: first.fairlineno },
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
  const vatDorI: "D" | "I" = form.lkpDI === "D" || toNumber(form.txtK7) !== 0 ? "D" : "I";

  useEffect(() => {
    let cancelled = false;

    getTicketSalesVat(PstrCoID, {
      lkpDI: vatDorI,
      dtpDate: form.dtpDate,
      lkpAirlineNo: form.lkpAirlineNo ?? "",
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
  }, [vatDorI, form.dtpDate, form.lkpAirlineNo]);

  const computed = calcAmounts(form, vat);

  /* Save or Modify: the Save button is Modify while the ticket of the Ticket Type + Ticket No. boxes is a saved one
     (it was loaded, or it was just saved), as in the old form. Another ticket no. is a new ticket again, and so is another
     Sl. No.: a Ticket No. has a row for each Sl. No. (both tables), the Sl. No. box starts at 1. */
  const [savedKey, setSavedKey] = useState("");
  const ticketKey = `${form.lkpTktType ?? ""}|${form.txtTktSLNo.trim()}|${form.txtSlNo.trim()}`;
  const isModify = savedKey !== "" && savedKey === ticketKey;

  /* The rules of the old form (ValidateMe) before a save: the form, the fares panel, the ticket type and the D/I.
     The first rule that fails stops the save: its message is shown and the cursor goes to its box. The rules that
     only warn are shown and the save goes on. The customer lines have their own rules in the grid. */
  const validateForm = (lines: TicketLinePayload[], detail: TicketDetailPayload): boolean => {
    // CNJ. = Yes needs the conjunction ticket of the popup
    if (form.lkpCNJ === "Yes" && !cnjRows.some((row) => row.txtCnjTktSlNo.trim() !== "")) {
      toast.error("Please input the 'CNJ Ticket No.'");
      setCnjOpen(true);
      return false;
    }

    // the CNJ Route is airport codes of 3 characters with a space between them (IND BHA), as the Route
    const cnjRoute = cnjRows[0]?.txtCnjRoute.trim() ?? "";
    if (form.lkpCNJ === "Yes" && cnjRoute !== "" && !/^[A-Z0-9]{3}( [A-Z0-9]{3}){1,2}$/.test(cnjRoute.toUpperCase())) {
      toast.error("'Route' of the conjunction ticket should be 2 or 3 airport codes of 3 characters, like IND BHA");
      setCnjOpen(true);
      return false;
    }

    const result = validateTicketHeader({
      loginYear: PstrYear,
      ticketType: form.lkpTktType,
      ticketNo: form.txtTktSLNo,
      airline: form.lkpAirlineNo,
      branch: form.lkpBranch,
      iata: form.lkpIATA,
      date: form.dtpDate,
      bspDate: form.dtpBSPDate,
      flightDate: form.dtpFlightDate,
      di: form.lkpDI,
      isVoid: form.lkpVoid === "Yes",
      supplier: form.lkpSupplier,
      supPayment: form.lkpPaySupplierID,
      pax: form.txtPaxName,
      staff: form.lkpStaffID,
      trip: form.lkpTrip,
      route: form.txtRoute,
      destination: form.txtDestination,
      gds: form.lkpGDS,
      fop: form.lkpFOP,
      ccType: form.lkpCCType,
      merchant: form.lkpMerchant,
      alComType: form.lkpALCom,
      sFare: toNumber(form.txtSFare),
      tax: toNumber(form.txtTax),
      supFee: toNumber(form.txtSupFee),
      k7: toNumber(form.txtK7),
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
        lkpTktType: form.lkpTktType,
        txtTktSLNo: form.txtTktSLNo,
        txtSlNo: form.txtSlNo,
        lkpAirlineNo: form.lkpAirlineNo,
        lkpBranch: form.lkpBranch,
        lkpIATA: form.lkpIATA,
        dtpDate: form.dtpDate,
        dtpBSPDate: form.dtpBSPDate,
        dtpFlightDate: form.dtpFlightDate,
        dtpReturnDate: form.dtpReturnDate,
        txtPNRNo: form.txtPNRNo,
        lkpDI: form.lkpDI,
        lkpSupplier: form.lkpSupplier,
        lkpPaySupplierID: form.lkpPaySupplierID,
        txtPaxName: form.txtPaxName,
        lkpStaffID: form.lkpStaffID,
        txtBookingGDSLogin: form.txtBookingGDSLogin,
        lkpPaxType: form.lkpPaxType,
        txtPaxNameId: form.txtPaxNameId,
        lkpVoid: form.lkpVoid,
        lkpService: form.lkpService,
        txtSalesGDSLogin: form.txtSalesGDSLogin,
        txtMobile: form.txtMobile,
        txtEmail: form.txtEmail,
        lkpTrip: form.lkpTrip,
        txtTourCode: form.txtTourCode,
        txtRoute: form.txtRoute,
        txtClass: form.txtClass,
        txtDestination: form.txtDestination,
        lkpCNJ: form.lkpCNJ,
        lkpGDS: form.lkpGDS,
        lkpCCType: form.lkpCCType,
        txtCarrier: form.txtCarrier,
        txtFareBasis: form.txtFareBasis,
        lkpMerchant: form.lkpMerchant,
        lkpFOP: form.lkpFOP,
        txtGFare: form.txtGFare,
        txtSupFee: form.txtSupFee,
        txtFeeVat: computed.feeVat,
        txtFopCash: form.txtFopCash,
        txtSFare: form.txtSFare,
        lkpALCom: form.lkpALCom,
        txtALCom: computed.alComPer,
        txtSupCom: computed.supCom,
        txtFopCc: form.txtFopCc,
        txtTax: form.txtTax,
        txtALComAmt: computed.alComAmt,
        txtALCVat: computed.alCVat,
        txtFopEp: form.txtFopEp,
        txtK7: form.txtK7,
        txtSupplierAmt: computed.supplierAmt,
        lines,
        // the conjunction ticket of the popup (only with CNJ. = Yes)
        cnjRows: form.lkpCNJ === "Yes"
          ? cnjRows
              .filter((row) => !isEmptyCnjRow(row))
              .map((row) => ({ ...row }))
          : [],
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
        lkpBranch: form.lkpBranch,
        txtSlNo: slNo,
      });

      const tktName = tktTypes.find((r) => r.ftickettypeid === ticket.lkpTktType)?.ftickttypename ?? "";
      setError("");
      setForm((prev) => ({ ...prev, ...formFromTicket(ticket, tktName) }));
      setLoaded({ version: Date.now(), ticket });
      setCnjRows(
        (ticket.cnjRows ?? []).map((row) => ({
          txtCnjTktSlNo: row.txtCnjTktSlNo,
          txtCnjRoute: row.txtCnjRoute,
          txtCnjCarrier: row.txtCnjCarrier,
          txtCnjClass: row.txtCnjClass,
        })),
      );
      setSavedKey(`${ticket.lkpTktType}|${ticket.txtTktSLNo.trim()}|${ticket.txtSlNo}`); // a saved ticket: the button is Modify
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load the ticket.";
      if (silent && /not found$/i.test(message)) return;
      toast.error(message);
    }
  };

  /* Sales Conjunction (the old frmTktSalesCnj): CNJ. = Yes opens the popup of the conjunction tickets (CNJ Ticket No., Route,
     Carrier, Class), also from the CNJ button. The airline must be chosen first, as in the old form. CNJ. = No clears them. */
  const [cnjOpen, setCnjOpen] = useState(false);
  const [cnjRows, setCnjRows] = useState<CnjRow[]>([]);

  const openCnj = () => {
    if (!form.lkpAirlineNo) {
      toast.error("Please select a 'AirlineNo'");
      document.getElementById("lkpAirlineNo")?.focus();
      return false;
    }
    setCnjOpen(true);
    return true;
  };

  const handleCnjChange = (value: string | null) => {
    if (value === "Yes") {
      if (!openCnj()) return; // no airline yet: CNJ. stays as it was
      setForm((prev) => ({ ...prev, lkpCNJ: "Yes" }));
      return;
    }
    setForm((prev) => ({ ...prev, lkpCNJ: value }));
    setCnjRows([]);
  };

  /* Fix (the old cmdFix_Click, Domestic tickets only): works the Tax and the K7 back out of the Supplier Amt. The supplier
     amount without the commission and the supplier fee (S. Fare + Tax + K7) is taken as VAT inclusive: the amount without VAT
     less the S. Fare is the Tax, and the VAT part of it is the K7. The grid line follows the new Tax. */
  const handleFix = () => {
    if (form.lkpDI !== "D") {
      toast.info("Fix is for Domestic (D) tickets only");
      return;
    }

    const supplierAmtWoComm = computed.supplierAmt + computed.alComAmt - toNumber(form.txtSupFee) - computed.feeVat;
    const withoutVat = round2((supplierAmtWoComm / (100 + vat.txtSCVATPer)) * 100);

    set("txtTax", round2(withoutVat - toNumber(form.txtSFare)).toFixed(2));
    set("txtK7", round2(supplierAmtWoComm - withoutVat).toFixed(2));
  };

  const closeCnj = () => {
    setCnjRows((rows) => rows.filter((row) => !isEmptyCnjRow(row))); // the empty rows are not kept
    setCnjOpen(false);
    setTimeout(() => document.getElementById("lkpCNJ")?.focus(), 0);
  };

  /* Delete the saved ticket of the Ticket Type + Ticket No. boxes (the old cmdDelete_Click): the type and the number are
     checked, it asks "Do you want to Delete ?", deletes the ticket and its customer line, and clears the screen. */
  const [clearVersion, setClearVersion] = useState(0);

  const clearScreen = () => {
    const firstType = tktTypes[0];
    setForm({
      ...initialForm(),
      lkpTktType: firstType?.ftickettypeid ?? null,
      txtTktTypeName: firstType?.ftickttypename ?? "",
      lkpBranch: branchIdOptions[0]?.value ?? null,
      lkpIATA: iataIdOptions[0]?.value ?? null,
      lkpAirlineNo: airlineIdOptions[0]?.value ?? null,
    });
    setSavedKey("");
    setLoaded(undefined);
    setCnjRows([]);
    setCnjOpen(false);
    lastAutoKey.current = "";
    setClearVersion((v) => v + 1);
    ticketNoRef.current?.focus();
  };

  const handleDelete = async () => {
    if (!form.lkpTktType) {
      toast.error("Please select a 'Ticket Type'");
      document.getElementById("lkpTktType")?.focus();
      return;
    }
    if (form.txtTktSLNo.trim() === "") {
      toast.error("Please input 'Ticket No.'");
      document.getElementById("txtTktSLNo")?.focus();
      return;
    }
    if (!(await confirm({ message: "Do you want to delete?" }))) return;

    try {
      const result = await deleteTicketSales({
        PstrCoID,
        PstrYear,
        lkpTktType: form.lkpTktType,
        txtTktSLNo: form.txtTktSLNo.trim(),
        lkpBranch: form.lkpBranch,
        txtSlNo: form.txtSlNo.trim() || null, // only this Sl. No.: the other Sl. Nos of the Ticket No. stay
      });
      toast.success(result.message || "Deleted successfully");
      clearScreen();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Not deleted, try again");
    }
  };

  // Enter in Ticket No. or the Search button: always loads (and says when the ticket is not found)
  const handleSearch = () => {
    lastAutoKey.current = `${form.lkpTktType ?? ""}|${form.txtTktSLNo.trim()}|${form.txtSlNo.trim()}`;
    void loadTicket(form.lkpTktType, form.txtTktSLNo, form.txtSlNo.trim(), false);
  };

  // Automatic load: when the Ticket Type and Ticket No. are given and you leave the Ticket No. box (or pick the type
  // after typing the number). The same ticket is not loaded twice by itself, so what you typed is never overwritten.
  const lastAutoKey = useRef("");
  const autoLoad = (type: string | null, no: string, slNo: string = form.txtSlNo.trim()) => {
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
    if (!form.lkpTktType || form.txtTktSLNo.trim() === "") return;

    const typed = form.txtSlNo.trim();
    if (typed !== "" && Number(typed) >= 1) {
      autoLoad(form.lkpTktType, form.txtTktSLNo, typed);
      return;
    }

    try {
      const { next } = await getTicketSalesSlNos({
        PstrCoID,
        PstrYear,
        lkpTktType: form.lkpTktType,
        txtTktSLNo: form.txtTktSLNo.trim(),
      });
      set("txtSlNo", String(next));
      lastAutoKey.current = `${form.lkpTktType}|${form.txtTktSLNo.trim()}|${next}`; // a free number: nothing to load
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
              onTicketNoLeave={() => autoLoad(form.lkpTktType, form.txtTktSLNo)}
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
                onCnjChange={handleCnjChange}
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
            cnjEnabled={form.lkpCNJ === "Yes"}
            clearVersion={clearVersion}
            loaded={loaded}
            onAction={(name) => {
              if (name === "search") handleSearch();
              if (name === "cnj") openCnj();
              if (name === "fix") handleFix();
              if (name === "cancel") clearScreen(); // the header too, so the Ticket Type / No. are open for another ticket
            }}
            context={{
              sFare: toNumber(form.txtSFare),
              supFee: toNumber(form.txtSupFee),
              tax: toNumber(form.txtTax),
              dorI: vatDorI,
              boxDorI: form.lkpDI === "D" ? "D" : "I",
              vatPer: vat.txtSCVATPer,
              serviceId: form.lkpService ?? "",
              merchantIsAirline: form.lkpMerchant === "A",
              isVoid: form.lkpVoid === "Yes",
              supplierAmt: computed.supplierAmt,
              feeVat: computed.feeVat,
              k7: toNumber(form.txtK7),
            }}
          />
        </main>
        {dialog}
        <CnjModal open={cnjOpen} rows={cnjRows} onChange={setCnjRows} onClose={closeCnj} />
      </div>
    </div>
  );
};

export default TicketDetails;