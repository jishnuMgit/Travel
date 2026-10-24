import React, { useEffect, useRef, useState } from "react";
import Select from "react-select";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";
import selectComponents from "../../comman/selectComponents";
import TicketLinesPage from "../../comman/TicketLinesPage";
import Header from "../../comman/Header";

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
type Option = { value: string; label: string };

const DATE_FORMAT = "DD-MM-YYYY";
const TODAY = dayjs().format(DATE_FORMAT);

/* Sample option lists. Replace with data from your API. */
const toOptions = (values: string[]): Option[] =>
  values.map((v) => ({ value: v, label: v }));

const ticketPrefixOptions = toOptions(["B", "T", "R"]);
const airlineIdOptions: Option[] = [
  { value: "SV", label: "SV" },
  { value: "EK", label: "EK" },
  { value: "QR", label: "QR" },
];
const airlineNameOptions: Option[] = [
  { value: "SV", label: "SAUDIA" },
  { value: "EK", label: "EMIRATES" },
  { value: "QR", label: "QATAR AIRWAYS" },
];
const branchIdOptions: Option[] = [
  { value: "JD", label: "JD" },
  { value: "RY", label: "RY" },
];
const branchNameOptions: Option[] = [
  { value: "JD", label: "JEDDAH" },
  { value: "RY", label: "RIYADH" },
];
const iataIdOptions: Option[] = [
  { value: "I1", label: "I1" },
  { value: "I2", label: "I2" },
];
const iataNameOptions: Option[] = [
  { value: "I1", label: "IATA ONE" },
  { value: "I2", label: "IATA TWO" },
];
const supplierIdOptions: Option[] = [
  { value: "S01", label: "S01" },
  { value: "S02", label: "S02" },
];
const supplierNameOptions: Option[] = [
  { value: "S01", label: "SUPPLIER ONE" },
  { value: "S02", label: "SUPPLIER TWO" },
];
const supPaymentIdOptions: Option[] = [
  { value: "CASH", label: "CASH" },
  { value: "CRD", label: "CRD" },
];
const supPaymentNameOptions: Option[] = [
  { value: "CASH", label: "CASH PAYMENT" },
  { value: "CRD", label: "CREDIT PAYMENT" },
];
const staffIdOptions: Option[] = [
  { value: "ST1", label: "ST1" },
  { value: "ST2", label: "ST2" },
];
const staffNameOptions: Option[] = [
  { value: "ST1", label: "STAFF ONE" },
  { value: "ST2", label: "STAFF TWO" },
];
const gdsOptions = toOptions(["AMADEUS", "SABRE", "GALILEO"]);
const diOptions = toOptions(["D", "I"]);
const yesNoOptions = toOptions(["No", "Yes"]);
const paxTypeOptions = toOptions(["Adult", "Child", "Infant"]);
const serviceOptions = toOptions(["TKT", "EMD", "MCO"]);
const tripOptions = toOptions(["One Way", "Round Trip"]);
const fopOptions = toOptions(["CASH", "CREDIT", "CC", "EP"]);
const merchantOptions = toOptions(["NA", "MERCHANT 1", "MERCHANT 2"]);
const alComTypeOptions = toOptions(["P", "A"]); // P = percent, A = amount

type FormState = {
  ticketPrefix: string | null;
  ticketNo: string;
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

  mobile: string;
  paxType: string | null;
  service: string | null;
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
  alCom: string;
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
  alComAmt: number;
  alCVat: number;
  supplierAmt: number;
  net: number;
};

const initialForm = (): FormState => ({
  ticketPrefix: "B",
  ticketNo: "",
  airline: null,
  branch: "JD",
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

  mobile: "",
  paxType: "Adult",
  service: "TKT",
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
});

/* Label widths. Every row uses the same widths per column, so the controls
   line up vertically (column groups: A, B, C, D, E). */
const LA = "w-[64px]"; // Date, Supplier, Pax., Mobile, E-mail
const LB = "w-[72px]"; // BSP Date, Pax Type, Pax ID
const LC = "w-[92px]"; // Flight Date, Sup. Payment, Staff, Service, Trip
const LD = "w-[92px]"; // D/I, Orig. Tkt.No., Return Date
const DI = "w-[150px]";
const LE = "w-[72px]"; // Void, PNR No., Tour Code
const Lx = "w-[72px]"; 
/* ---------------------------------------------------------------------
   2. SHARED BUILDING BLOCKS
   --------------------------------------------------------------------- */
const selectClassNames = {
  control: ({
    isFocused,
    isDisabled,
  }: {
    isFocused: boolean;
    isDisabled: boolean;
  }) => `
    !min-h-[30px] !h-[30px] !rounded-[4px] !border !shadow-none !text-[12px]
    hover:!border-[#aab8c5]
    ${isDisabled ? "!bg-[#f0f3f6]" : "!bg-white"}
    ${isFocused ? "!border-[#B7E7CD]" : "!border-[#cfd7df]"}
  `,
  valueContainer: () => "!h-[26px] !py-0 !px-[5px] !overflow-hidden",
  singleValue: () => "!m-0 !text-[12px] !text-[#24364d]",
  placeholder: () => "!m-0 !text-[12px] !text-[#7a8794]",
  input: () => "!m-0 !p-0 !text-[12px] !text-[#24364d]",
  indicatorsContainer: () => "!h-[26px]",
  dropdownIndicator: () => "!p-[2px] !text-[#657486]",
  indicatorSeparator: () => "!hidden",
  clearIndicator: () => "!p-[2px]",
  menu: () =>
    "!mt-[1px] !rounded-none !border !border-[#cfd7df] !z-[999999] !shadow-md !min-w-[110px]",
  menuList: () => "!p-0 !max-h-[180px]",
  option: ({
    isFocused,
    isSelected,
  }: {
    isFocused: boolean;
    isSelected: boolean;
  }) => `
    !cursor-pointer !px-[6px] !py-[4px] !text-[12px] !text-[#24364d]
    ${isSelected ? "!bg-[#e7f7ed]" : isFocused ? "!bg-[#f2faf5]" : "!bg-white"}
  `,
};

const selectProps = {
  isSearchable: true,
  isClearable: false,
  placeholder: "",
  classNames: selectClassNames,
  menuPosition: "fixed" as const,
  menuPortalTarget: typeof document !== "undefined" ? document.body : undefined,
};

const inputClass =
  " w-full min-w-0 input-style";

const readOnlyClass =
  "h-[30px] w-full min-w-0 rounded-[4px] border border-[#cfd7df] bg-[#eef1f4] px-2 text-[12px] text-[#24364d] outline-none";
const readOnlyClass1 =
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

/** single react-select */
const Combo: React.FC<{
  id: string;
  options: Option[];
  value: string | null;
  onChange: (value: string | null) => void;
  className?: string;
}> = ({ id, options, value, onChange, className = "w-full" }) => (
  <div className={`min-w-0 ${className}`}>
    <Select
      inputId={id}
      instanceId={id}
      components={selectComponents}
      options={options}
      value={options.find((o) => o.value === value) ?? null}
      onChange={(option) => onChange(option?.value ?? null)}
      {...selectProps}
    />
  </div>
);

/** ID select + name select that always show the same record */
const PairCombo: React.FC<{
  idId: string;
  nameId: string;
  idOptions: Option[];
  nameOptions: Option[];
  value: string | null;
  onChange: (value: string | null) => void;
  idWidth?: string;
  nameWidth?:string;
}> = ({
  idId,
  nameId,
  idOptions,
  nameOptions,

  value,
  onChange,
  idWidth = "w-[110px]",
  nameWidth = "flex-1",
}) => (
  <>
   <div className="flex flex-1 gap-2">
     <Combo
      id={idId}
      options={idOptions}
      value={value}
      onChange={onChange}
      className={`${idWidth} shrink-0`}
    />
    <Combo
      id={nameId}
      options={nameOptions}
      value={value}
      onChange={onChange}
      className={nameWidth}
    />
   </div>
  </>
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

/* 3a. Top bar: ticket no, airline, branch, IATA ------------------------ */

const TicketTopBar: React.FC<
  PartProps & {
    ticketNoRef: React.RefObject<HTMLInputElement | null>;
    onSearch: () => void;
  }
> = ({ form, set, ticketNoRef, onSearch }) => (
  <div className="grid w-full grid-cols-1 items-center gap-x-4 gap-y-2.5 sm:grid-cols-2 lg:grid-cols-[1.2fr_1.5fr_1.3fr_1.5fr]">

    {/* Ticket No */}
    <Field
      label="Ticket No. :"
      htmlFor="txtTktSLNo"
      className="w-full min-w-0"
    >
      <div className="flex w-full min-w-0 items-center gap-2">
        <Combo
          id="lkpTktType"
          options={ticketPrefixOptions}
          value={form.ticketPrefix}
          onChange={(v) => set("ticketPrefix", v)}
          className="w-16.25 shrink-0"
        />

        <input
          ref={ticketNoRef}
          id="txtTktSLNo"
          value={form.ticketNo}
          onChange={(event) => set("ticketNo", event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              onSearch();
            }
          }}
          className={`${inputClass} w-full min-w-0`}
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
          nameId="lkpAirlineName"
          idOptions={airlineIdOptions}
          nameOptions={airlineNameOptions}
          value={form.airline}
          onChange={(v) => set("airline", v)}
          idWidth="w-[80px] shrink-0"
          nameWidth="min-w-0 flex-1"
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
          idId="lkpBranchID"
          nameId="lkpBranchName"
          idOptions={branchIdOptions}
          nameOptions={branchNameOptions}
          value={form.branch}
          onChange={(v) => set("branch", v)}
          idWidth="w-[55px] shrink-0"
          nameWidth="min-w-0 flex-1"
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
          idId="lkpIATACode"
          nameId="lkpIATABranchName"
          idOptions={iataIdOptions}
          nameOptions={iataNameOptions}
          value={form.iata}
          onChange={(v) => set("iata", v)}
          idWidth="w-[110px] shrink-0"
          nameWidth="min-w-0 flex-1"
        />
      </div>
    </Field>

  </div>
);

/* 3b. Ticket details box ------------------------------------------------
   12-column grid with five column groups on every row:
   A = 3 cols, B = 3 cols, C = 2 cols, D = 2 cols, E = 2 cols
   (wide fields span several groups, e.g. Supplier = A+B).              */
const TicketDetailsFields: React.FC<PartProps> = ({ form, set }) => (
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
        id="dtpBspDate"
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
      htmlFor="txtPnrNo"
      labelClassName={Lx}
      className=" min-w-0 lg:col-span-2 lg:ml-[10%] w-87.5 z-1 mb-2"
    >
      <input
        id="txtPnrNo"
        value={form.pnrNo}
        onChange={(event) => set("pnrNo", event.target.value)}
        className={`${inputClass} w-[85%]! min-w-0`}
      />
    </Field>

    <Field label="D/I :" labelClassName={DI} className="min-w-0 lg:col-span-2 float-end mb-2">
      <Combo
        id="lkpDI"
        options={diOptions}
        value={form.di}
        onChange={(v) => set("di", v)}
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
        idId="lkpSupplierID"
        nameId="lkpSupplierName"
        idOptions={supplierIdOptions}
        nameOptions={supplierNameOptions}
        value={form.supplier}
        onChange={(v) => set("supplier", v)}
      />
    </Field>
    <Field
      label="Sup. Payment :"
      labelClassName={LC}
      className="min-w-0 md:col-span-2 lg:col-span-6"
    >
      <PairCombo
        idId="lkpSupPaymentID"
        nameId="lkpSupPaymentName"
        idOptions={supPaymentIdOptions}
        nameOptions={supPaymentNameOptions}
        value={form.supPayment}
        onChange={(v) => set("supPayment", v)}
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
      />
    </Field>
    <Field
      label="Booking GDS Login"
      className="min-w-0 md:col-span-2 lg:col-span-2 lg:p-2 -mr-2"
    >
      <input
        id="txtBookingGDSLogin"
        readOnly
        tabIndex={-1}
        value={form.staff ?? ""}
        className={readOnlyClass1}
      />
    </Field>

    {/* row 4: Passenger type | Pax ID | Service | Original ticket | PNR | Sales GDS Login */}
    <Field label="Pax Type :" labelClassName={LB} className="min-w-0 w-[80%] lg:col-span-2 lg:-ml-2 mb-2">
      <Combo
        id="lkpPaxType"
        options={paxTypeOptions}
        value={form.paxType}
        onChange={(v) => set("paxType", v)}
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
    
    
    
   
    {/* <Field
      label="PNR No. :"
      htmlFor="txtPnrNo"
      labelClassName={LE}
      className="min-w-0 lg:col-span-2"
    >
      <input
        id="txtPnrNo"
        value={form.pnrNo}
        onChange={(event) => set("pnrNo", event.target.value)}
        className={inputClass}
      />
    </Field> */}
    <Field label="Void :" labelClassName={LE} className="min-w-0 lg:col-span-2 ml-5 mb-2">
      <div className="w-full min-w-0">
        <Combo
        id="lkpVoid"
        options={yesNoOptions}
        value={form.voidFlag}
        onChange={(v) => set("voidFlag", v)}
      />
      </div>
    </Field>
    <Field label="Service Type :" labelClassName={LC} className="min-w-0 lg:col-span-2 mb-2">
      <Combo
        id="lkpServiceType"
        options={serviceOptions}
        value={form.service}
        onChange={(v) => set("service", v)}
      />
    </Field>
    
    <Field
      label="Sales GDS Login"
      className="min-w-0 md:col-span-2 lg:col-span-2 lg:ml-4 lg:px-2 mb-2 -mr-2"
    >
      <input
        id="txtSalesGDSLogin"
        readOnly
        tabIndex={-1}
        value={form.staff ?? ""}
        className={`${readOnlyClass1} `}
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
   12-column grid, every row split 5 | 3 | 4 so the columns line up.     */

/* Route and Fare Details Panel */

// Label widths: every row in a column uses the same width, so the boxes line up.
/* 3c. Route / payment panel ------------------------------------------ */

// Fixed label widths to match the original WinForms layout
const L1 = "w-[68px] shrink-0 ";
const L2 = "w-[72px] shrink-0";
const L3 = "w-[64px] shrink-0";

// Text input
const inputClassforTicketRoutePanel =
  "w-full min-w-0 input-style";

// Small read-only box next to GDS
const greyBoxClass =
  "h-[30px] w-[30px] shrink-0 rounded-[2px] border border-[#cbd2dc] bg-[#e5e7eb]";

/* Three fixed columns matching the WinForms screen */
const TicketRoutePanel: React.FC<PartProps> = ({ form, set }) => (
  <div
    className={`${panelClass} grid grid-cols-1 items-center   md:grid-cols-2`}
  >
    {/* Route and payment fields use two aligned columns. */}

    <Field
      label="Route :"
      htmlFor="txtRoute"
      labelClassName={L1}
      className="min-w-0 w-[120%] "
    >
      <input
        id="txtRoute"
        value={form.route}
        onChange={(e) => set("route", e.target.value)}
        className={inputClassforTicketRoutePanel}
      />
    </Field>

    <Field
      label="Class :"
      htmlFor="txtClass"
      labelClassName={L2}
      className="min-w-0 ml-10 w-[80%] "
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
      className="min-w-0 w-[120%]  mt-1"
    >
      <div className="flex w-full min-w-0 items-center gap-2">
        <input
        id="txtDestination"
        value={form.destination}
        onChange={(e) => set("destination", e.target.value)}
        className={`${inputClassforTicketRoutePanel} flex-1`}
      />
       <Field label="CNJ. :" className="w-29 shrink-0 lg:-mr-4  ">
        <Combo
          id="lkpCNJ"
          options={yesNoOptions}
          value={form.cnj}
          onChange={(v) => set("cnj", v)}
          className="w-14.5 min-w-0"
        />
      </Field>
      </div>
    </Field>

    <div className="flex min-w-0 items-center gap-2  mb-1">
     

      <Field label="GDS :" className="min-w-0 flex-1 ml-20 mt-1">
        <div className="flex min-w-0 items-center gap-1">
          <Combo
            id="lkpGDS"
            options={gdsOptions}
            value={form.gds}
            onChange={(v) => set("gds", v)}
            className="min-w-0 flex-1 w-20"
          />

          <input
            id="txtGdsCode"
            readOnly
            tabIndex={-1}
            aria-label="GDS code"
            value=""
            className={`${greyBoxClass}`}
          />
        </div>
      </Field>
    </div>

    <Field
      label="Carrier :"
      htmlFor="txtCarrier"
      labelClassName={L1}
      className="min-w-0 w-[120%]"
    >
      <input
        id="txtCarrier"
        value={form.carrier}
        onChange={(e) => set("carrier", e.target.value)}
        className={inputClassforTicketRoutePanel}
      />
    </Field>


    <Field label="Merchant :" labelClassName={L3} className="min-w-0 w-[80%] ml-12">
      <Combo
        id="lkpMerchant"
        options={merchantOptions}
        value={form.merchant}
        onChange={(v) => set("merchant", v)}
        className="w-full min-w-0"
      />
    </Field>
    <Field
  label="Merchant :"
  labelClassName={L3}
  className="invisible min-w-0 ml-12 w-[80%]"
>
  <Combo
    id="lkpMerchantHidden"
    options={merchantOptions}
    value={form.merchant}
    onChange={(v) => set("merchant", v)}
    className="w-full min-w-0"
  />
</Field>

  </div>
);
/* 3d. Fares and commissions panel ---------------------------------- */
const R1 = "w-[90px] shrink-0";
const R2 = "w-[120px] shrink-0";
const R3 = "w-[78px] shrink-0";
const amountFieldClass =
  "min-w-0 md:flex-col md:items-stretch md:gap-0.5 lg:flex-row lg:items-center lg:gap-2";

const TicketAmountsPanel: React.FC<PartProps & { computed: Computed }> = ({
  form,
  set,
  computed,
}) => (
  <div
    className={`${panelClass} grid grid-cols-1 items-center gap-x-2 gap-y-2 sm:grid-cols-2 md:grid-cols-4`}
  >
    {/* Row 1 */}
    <Field label="FOP :" labelClassName={L3} className={amountFieldClass}>
      <Combo
        id="lkpFOP"
        options={fopOptions}
        value={form.fop}
        onChange={(v) => set("fop", v)}
        className="w-[75%] min-w-0"
      />
    </Field>

    <Field
      label="G. Fare :"
      htmlFor="txtGFare"
      labelClassName={R1}
      className={`${amountFieldClass} -ml-9 w-50 `}
    >
      <FareMoneyInput
        id="txtGFare"
        
        value={form.gFare}
        onChange={(v) => set("gFare", v)}
      />
    </Field>

    <Field
      label="Sup. Fee. :"
      htmlFor="txtSupFee"
      labelClassName={R2}
      className={`${amountFieldClass} -ml-10 `}
    >
      <div className="w-full min-w-0 lg:w-30">
        <MoneyInput
          id="txtSupFee"
          value={form.supFee}
          onChange={(v) => set("supFee", v)}
        />
      </div>
    </Field>

   <div className="w-50 ml-5">
     <Field label="Fee VAT :" labelClassName={R3} className={amountFieldClass}>
      <MoneyReadOnly id="txtFeeVat" value={computed.feeVat} />
    </Field>
   </div>

    {/* Row 2 */}
    <Field
      label="FOP Cash :"
      htmlFor="txtFopCash"
      labelClassName={L1}
      className={`${amountFieldClass} -ml-1 w-47.5`}
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
      labelClassName={R1}
      className={`${amountFieldClass} -ml-9 w-50 `}
    >
      <FareMoneyInput
        id="txtSFare"
        value={form.sFare}
        onChange={(v) => set("sFare", v)}
      />
    </Field>

    <Field
      label="A/L Com. :"
      labelClassName={R2}
      className={`${amountFieldClass} -ml-10  `}
    >
      <div className="flex min-w-0 items-center gap-1">
        <div className="w-15 shrink-0">
          <Combo
            id="lkpALComType"
            options={alComTypeOptions}
            value={form.alComType}
            onChange={(v) => set("alComType", v)}
            className="w-full"
          />
        </div>

        <div className="w-14 shrink-0">
          <MoneyInput
            id="txtALCom"
            value={form.alCom}
            onChange={(v) => set("alCom", v)}
          />
        </div>
      </div>
    </Field>

<div className="w-50 ml-5">
 <Field label="Sup. Com. :" labelClassName={R3} className={amountFieldClass}>
      <MoneyReadOnly id="txtSupCom" value={computed.supCom} />
    </Field>
</div>
   

    {/* Row 3 */}
    <Field
      label="FOP CC :"
      htmlFor="txtFopCc"
      labelClassName={L2}
      className={`${amountFieldClass} -ml-2 w-48.75`}
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
      labelClassName={R1}
      className={`${amountFieldClass} -ml-9 w-50 `}
    >
      <FareMoneyInput
        id="txtTax"
        value={form.tax}
        onChange={(v) => set("tax", v)}
      />
    </Field>

    <Field
      label="A/L Com. Amt. :"
      labelClassName={R2}
       className={`${amountFieldClass} -ml-10 `}
    >
      <div className="w-full min-w-0 lg:w-30">
        <MoneyReadOnly
          id="txtALComAmt"
          value={computed.alComAmt}
        />
      </div>
    </Field>
    <div className="w-50 ml-5">
 <Field label="A/L C. VAT :" labelClassName={R3} className={amountFieldClass}>
      <MoneyReadOnly id="txtALCVat" value={computed.alCVat} />
    </Field>
    </div>

   

    {/* Row 4 */}
    <Field
      label="FOP EP :"
      htmlFor="txtFopEp"
      labelClassName={L3}
      className={`${amountFieldClass}  w-46.75`}
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
      labelClassName={R1}
      className={`${amountFieldClass} -ml-9 w-50 `}
    >
      <FareMoneyInput
        id="txtK7"
        value={form.k7}
        onChange={(v) => set("k7", v)}
      />
    </Field>

    <Field
      label="Supplier Amt. :"
      labelClassName={R2}
       className={`${amountFieldClass} -ml-10 `}
    >
      <div className="w-full min-w-0 lg:w-30">
        <MoneyReadOnly
          id="txtSupplierAmt"
          value={computed.supplierAmt}
        />
      </div>
    </Field>

    <div className="w-50 ml-5">
      <Field label="Net :" labelClassName={R3} className={amountFieldClass}>
      <MoneyReadOnly
        id="txtNet"
        value={computed.net}
        alwaysRed
      />
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
  const [form, setForm] = useState<FormState>(initialForm);
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

  /* Calculated (read-only) amounts. Fill these from your pricing rules;
     they stay at 0.00 because the rules are not shown in the screenshot. */
  const computed: Computed = {
    feeVat: 0,
    supCom: 0,
    alComAmt: 0,
    alCVat: 0,
    supplierAmt: 0,
    net: 0,
  };

  const handleSearch = () => {
    console.log("search ticket", `${form.ticketPrefix ?? ""}${form.ticketNo}`);
  };

  // const handleSave = () => {
  //   if (!form.ticketNo.trim()) {
  //     setError("Enter the ticket number.");
  //     ticketNoRef.current?.focus();
  //     return;
  //   }
  //   setError("");
  //   console.log(form);
  // };

  // const handleCancel = () => {
  //   setForm(initialForm());
  //   setError("");
  //   ticketNoRef.current?.focus();
  // };

  // const handleClose = () => {
  //   handleCancel();
  //   onClose?.();
  // };

  return (
    <div className="flex min-h-full w-full items-start justify-center bg-white px-2 py-2 sm:px-4 sm:py-4">
      <div className="min-h-fit w-full max-w-375 bg-white p-0">
        <main className="h-fit w-full overflow-hidden border border-gray-400 ">
          <Header Name="Ticket Sales"/>

          <section className="flex flex-col gap-3 px-2 pb-6 pt-3 sm:px-3.5">
            <TicketTopBar
              form={form}
              set={set}
              ticketNoRef={ticketNoRef}
              onSearch={handleSearch}
            />

            <TicketDetailsFields form={form} set={set} />

            <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_2fr]">
              <TicketRoutePanel form={form} set={set} />
              <TicketAmountsPanel form={form} set={set} computed={computed} />
            </div>

            {error && (
              <p role="alert" className="m-0 text-[12px] text-[#c0392b]">
                {error}
              </p>
            )}

          
          </section>
           <TicketLinesPage/>
        </main>
       
      </div>
    </div>
  );
};

export default TicketDetails;