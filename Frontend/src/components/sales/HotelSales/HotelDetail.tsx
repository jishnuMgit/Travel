import React, { useState } from "react";
import Select from "react-select";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";
import Header from "../../comman/Header";
import selectComponents from "../../comman/selectComponents";

dayjs.extend(customParseFormat);

/* =====================================================================
   FILE MAP
   1. Types, constants and sample options
   2. Shared building blocks (Field, Combo, PairCombo, inputs, ScrollGrid)
   3. The four bordered groups
        HotelHeaderGroup   : branch, entry no, service, city, hotel, guest ...
        RoomsGroup         : room table + totals          (Room Price/N removed)
        SupplierGroup      : services, supplier, FOP, currency, amounts
        CustomersGroup     : customer table + totals      (Type removed)
      + HotelActions       : Save, Cancel, Close
   4. HotelDetail : owns the state and renders everything in one place

   X/O No. is removed.
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

const branchOptions = toOptions(["JEDDAH", "RIYADH"]);
const serviceOptions = toOptions(["H", "T", "V"]);
const serviceCpOptions = toOptions(["HTL", "TKT", "VISA"]);
const carrierOptions = toOptions(["HOTEL", "AIRLINE"]);
const yesNoOptions = toOptions(["No", "Yes"]);
const diOptions = toOptions(["D", "I"]);
const cityOptions = toOptions(["RIYADH", "JEDDAH", "MAKKAH", "DUBAI"]);
const cityCountry: Record<string, string> = {
  RIYADH: "SAUDI ARABIA",
  JEDDAH: "SAUDI ARABIA",
  MAKKAH: "SAUDI ARABIA",
  DUBAI: "UAE",
};
const hotelOptions = toOptions(["HILTON", "MARRIOTT", "RADISSON"]);
const staffIdOptions: Option[] = [
  { value: "ST1", label: "ST1" },
  { value: "ST2", label: "ST2" },
];
const staffNameOptions: Option[] = [
  { value: "ST1", label: "STAFF ONE" },
  { value: "ST2", label: "STAFF TWO" },
];
const fopOptions = toOptions(["CASH", "CREDIT", "CC"]);
const ccTypeOptions = toOptions(["NA", "VISA", "MASTER"]);
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
const currencyOptions = toOptions(["SAR", "USD", "EUR"]);
const currencyRates: Record<string, string> = {
  SAR: "1.0000",
  USD: "3.7500",
  EUR: "4.0500",
};
const roomTypeOptions = toOptions(["SINGLE", "DOUBLE", "TWIN", "SUITE"]);
const mealOptions = toOptions(["RO", "BB", "HB", "FB"]);
const customerIdOptions: Option[] = [
  { value: "C001", label: "C001" },
  { value: "C002", label: "C002" },
  { value: "C003", label: "C003" },
];
const customerNames: Record<string, string> = {
  C001: "CUSTOMER ONE",
  C002: "CUSTOMER TWO",
  C003: "CUSTOMER THREE",
};

/* ----- header + supplier fields (one state object) ----- */
type FormState = {
  // header group
  branch: string | null;
  entryNo: string;
  service: string | null;
  serviceCp: string | null;
  carrier: string | null;
  date: string;
  voidFlag: string | null;
  di: string | null;
  city: string | null;
  hotel: string | null;
  staff: string | null;
  guest: string;
  adults: string;
  childs: string;
  infants: string;
  // supplier group
  services: string;
  fop: string | null;
  ccType: string | null;
  supplier: string | null;
  supPayment: string | null;
  suppInvDate: string;
  confirmationNo: string;
  currency: string | null;
  rate: string;
  supplierAmtFc: string;
  supplierExclVat: string;
  supVat: string;
};

type SetField = <K extends keyof FormState>(
  key: K,
  value: FormState[K],
) => void;

type PartProps = { form: FormState; set: SetField };

const initialForm = (): FormState => ({
  branch: "JEDDAH",
  entryNo: "",
  service: "H",
  serviceCp: "HTL",
  carrier: "HOTEL",
  date: TODAY,
  voidFlag: "No",
  di: "I",
  city: null,
  hotel: null,
  staff: null,
  guest: "",
  adults: "",
  childs: "",
  infants: "",
  services: "",
  fop: "CASH",
  ccType: "NA",
  supplier: null,
  supPayment: null,
  suppInvDate: "",
  confirmationNo: "",
  currency: "SAR",
  rate: "1.0000",
  supplierAmtFc: "0.0000",
  supplierExclVat: "0.00",
  supVat: "0.00",
});

/* ----- room table rows ----- */
type RoomRow = {
  key: number;
  roomType: string | null;
  checkIn: string; // YYYY-MM-DD (native date input)
  nights: string;
  roomQty: string;
  totNights: string;
  guestQty: string;
  meal: string | null;
  mealPrice: string;
};

/* ----- customer table rows ----- */
type MoneyField = "suppAmt" | "cdAmt" | "sChg" | "sChgV" | "mf" | "invAmt";

type CustomerRow = {
  key: number;
  customerId: string | null;
  division: string;
  suppAmt: string;
  cdAmt: string;
  sChg: string;
  sChgV: string;
  mf: string;
  invAmt: string;
  invNo: string; // read-only
};

let keyCounter = 0;
const nextKey = () => ++keyCounter;

const emptyRoom = (): RoomRow => ({
  key: nextKey(),
  roomType: null,
  checkIn: "",
  nights: "",
  roomQty: "",
  totNights: "",
  guestQty: "",
  meal: null,
  mealPrice: "",
});

const emptyCustomer = (): CustomerRow => ({
  key: nextKey(),
  customerId: null,
  division: "",
  suppAmt: "",
  cdAmt: "",
  sChg: "",
  sChgV: "",
  mf: "",
  invAmt: "",
  invNo: "",
});

const isEmptyRoom = (r: RoomRow) =>
  !r.roomType &&
  !r.checkIn &&
  !r.nights &&
  !r.roomQty &&
  !r.totNights &&
  !r.guestQty &&
  !r.meal &&
  !r.mealPrice;

const customerMoneyFields: MoneyField[] = [
  "suppAmt",
  "cdAmt",
  "sChg",
  "sChgV",
  "mf",
  "invAmt",
];

const isEmptyCustomer = (r: CustomerRow) =>
  !r.customerId &&
  !r.division &&
  customerMoneyFields.every((field) => r[field] === "");

/** keeps one empty row at the end and at least `min` rows in total */
const padRows = <T,>(
  rows: T[],
  make: () => T,
  isEmpty: (row: T) => boolean,
  min: number,
): T[] => {
  const result = [...rows];
  if (result.length === 0 || !isEmpty(result[result.length - 1])) {
    result.push(make());
  }
  while (result.length < min) result.push(make());
  return result;
};

const padRooms = (rows: RoomRow[]) => padRows(rows, emptyRoom, isEmptyRoom, 3);
const padCustomers = (rows: CustomerRow[]) =>
  padRows(rows, emptyCustomer, isEmptyCustomer, 3);

const toNumber = (value: string) => {
  const parsed = parseFloat(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const formatNumber = (value: number, decimals = 2) =>
  value.toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });

/** Check Out = Check In + Nights */
const computeCheckOut = (row: RoomRow) => {
  const nights = parseInt(row.nights, 10);
  if (!row.checkIn || !Number.isFinite(nights)) return "";
  const out = dayjs(row.checkIn);
  return out.isValid() ? out.add(nights, "day").format(DATE_FORMAT) : "";
};

/** Room Total. Fill from your pricing rules; 0 until then. */
const computeRoomTotal = (_row: RoomRow) => 0;

/** VAT Amt. of a customer line. Fill from your VAT rules; 0 until then. */
const computeVatAmt = (_row: CustomerRow) => 0;

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
    !min-h-[28px] !h-[28px] !rounded-[4px] !border !shadow-none !text-[12px]
    hover:!border-[#aab8c5]
    ${isDisabled ? "!bg-[#eef1f4]" : "!bg-white"}
    ${isFocused ? "!border-[#91a7b9]" : "!border-[#cfd7df]"}
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
  isSearchable: false,
  isClearable: false,
  placeholder: "",
  classNames: selectClassNames,
  menuPosition: "fixed" as const,
  menuPortalTarget: typeof document !== "undefined" ? document.body : undefined,
};

/* select that fills a grid cell (no border) */
const cellSelectProps = {
  ...selectProps,
  classNames: {
    ...selectClassNames,
    control: ({ isFocused }: { isFocused: boolean }) => `
      !min-h-[26px] !h-[26px] !rounded-none !border-0 !shadow-none !text-[12px]
      !bg-transparent
      ${isFocused ? "!bg-white !ring-1 !ring-inset !ring-[#91a7b9]" : ""}
    `,
    valueContainer: () => "!h-[26px] !py-0 !px-[8px] !overflow-hidden",
    indicatorsContainer: () => "!h-[26px]",
  },
};

/* slim green scrollbar (Chrome, Edge, Safari) */
const niceScrollbar = [
  "[&::-webkit-scrollbar]:h-2.5",
  "[&::-webkit-scrollbar]:w-2.5",
  "[&::-webkit-scrollbar-track]:bg-[#f2f8f4]",
  "[&::-webkit-scrollbar-thumb]:rounded-full",
  "[&::-webkit-scrollbar-thumb]:border-2",
  "[&::-webkit-scrollbar-thumb]:border-solid",
  "[&::-webkit-scrollbar-thumb]:border-[#f2f8f4]",
  "[&::-webkit-scrollbar-thumb]:bg-[#9fdfbc]",
  "[&::-webkit-scrollbar-thumb:hover]:bg-[#64d96e]",
  "[&::-webkit-scrollbar-thumb:active]:bg-[#4cc45a]",
  "[&::-webkit-scrollbar-corner]:bg-[#f2f8f4]",
].join(" ");

const inputClass =
  "h-[28px] w-full min-w-0 rounded-[4px] border border-[#cfd7df] bg-white px-2 text-[12px] text-[#24364d] outline-none focus:border-[#91a7b9]";

const readOnlyClass =
  "h-[28px] w-full min-w-0 rounded-[4px] border border-[#cfd7df] bg-[#eef1f4] px-2 text-[12px] text-[#24364d] outline-none";

/** bordered group box (the four groups of the page) */
const GroupBox: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className = "",
}) => (
  <div className={`border border-[#d5ebdd] bg-[#fcfdfe] p-2 ${className}`}>
    {children}
  </div>
);

const groupGrid =
  "grid grid-cols-1 items-center gap-x-4 gap-y-1 sm:grid-cols-2 lg:grid-cols-12 ";

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
  onChange?: (value: string | null) => void;
  className?: string;
  disabled?: boolean;
}> = ({
  id,
  options,
  value,
  onChange,
  className = "w-full",
  disabled = false,
}) => (
  <div className={`min-w-0 ${className}`}>
    <Select
      inputId={id}
      instanceId={id}
      components={selectComponents}
      options={options}
      value={options.find((o) => o.value === value) ?? null}
      onChange={(option) => onChange?.(option?.value ?? null)}
      isDisabled={disabled}
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
  NameWidth?:string;
}> = ({
  idId,
  nameId,
  idOptions,
  nameOptions,
  value,
  onChange,
  idWidth = "w-[92px]",
  NameWidth
}) => (
  <>
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
   className={NameWidth || "flex-1"}
    />
  </>
);

/** editable amount: right aligned, fixed decimals after leaving the box */
const MoneyInput: React.FC<{
  id: string;
  value: string;
  onChange: (value: string) => void;
  decimals?: number;
}> = ({ id, value, onChange, decimals = 2 }) => (
  <input
    id={id}
    inputMode="decimal"
    value={value}
    onFocus={(event) => event.target.select()}
    onChange={(event) => {
      const pattern = new RegExp(`^\\d*\\.?\\d{0,${decimals}}$`);
      if (pattern.test(event.target.value)) onChange(event.target.value);
    }}
    onBlur={() => onChange(toNumber(value).toFixed(decimals))}
    className={`${inputClass} text-right`}
  />
);

/** whole-number box (adults, childs, infants) */
const IntInput: React.FC<{
  id: string;
  value: string;
  onChange: (value: string) => void;
}> = ({ id, value, onChange }) => (
  <input
    id={id}
    inputMode="numeric"
    value={value}
    onFocus={(event) => event.target.select()}
    onChange={(event) => {
      if (/^\d*$/.test(event.target.value)) onChange(event.target.value);
    }}
    className={`${inputClass} text-right`}
  />
);

/** read-only grey box */
const ReadOnlyBox: React.FC<{
  id: string;
  value: string;
  right?: boolean;
}> = ({ id, value, right = false }) => (
  <input
    id={id}
    readOnly
    tabIndex={-1}
    value={value}
    className={`${readOnlyClass} ${right ? "text-right" : ""}`}
  />
);

/** compact MUI date picker */
const AppDatePicker: React.FC<{
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}> = ({ id, label, value, onChange, disabled = false }) => (
  <LocalizationProvider dateAdapter={AdapterDayjs}>
    <DatePicker
      value={value ? dayjs(value, DATE_FORMAT) : null}
      onChange={(newValue) => {
        onChange(newValue?.isValid() ? newValue.format(DATE_FORMAT) : "");
      }}
      format={DATE_FORMAT}
      disabled={disabled}
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
          height: "28px",
          minHeight: "28px",
          boxSizing: "border-box",
          borderRadius: "4px",
          backgroundColor: "#ffffff",
          fontSize: "12px",
          padding: 0,
          overflow: "hidden",
        },
        "& .MuiPickersInputBase-root.Mui-disabled": {
          backgroundColor: "#eef1f4",
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
          height: "28px",
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
        "& .Mui-disabled": { WebkitTextFillColor: "#24364d" },
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

/* ----- grid cell editors ----- */
const cellFocusClass =
  "focus:bg-white focus:ring-1 focus:ring-inset focus:ring-[#91a7b9]";

const MoneyCell: React.FC<{
  label: string;
  value: string;
  onFocus: () => void;
  onChange: (value: string) => void;
}> = ({ label, value, onFocus, onChange }) => (
  <input
    aria-label={label}
    inputMode="decimal"
    value={value}
    onFocus={(event) => {
      onFocus();
      event.target.select();
    }}
    onChange={(event) => {
      if (/^\d*\.?\d{0,2}$/.test(event.target.value)) onChange(event.target.value);
    }}
    onBlur={() => {
      if (value !== "") onChange(toNumber(value).toFixed(2));
    }}
    className={`h-[26px] w-full bg-transparent px-2 text-right text-[12px] text-[#24364d] outline-none ${cellFocusClass}`}
  />
);

const IntCell: React.FC<{
  label: string;
  value: string;
  onFocus: () => void;
  onChange: (value: string) => void;
}> = ({ label, value, onFocus, onChange }) => (
  <input
    aria-label={label}
    inputMode="numeric"
    value={value}
    onFocus={(event) => {
      onFocus();
      event.target.select();
    }}
    onChange={(event) => {
      if (/^\d*$/.test(event.target.value)) onChange(event.target.value);
    }}
    className={`h-[26px] w-full bg-transparent px-2 text-right text-[12px] text-[#24364d] outline-none ${cellFocusClass}`}
  />
);

const TextCell: React.FC<{
  label: string;
  value: string;
  onFocus: () => void;
  onChange: (value: string) => void;
}> = ({ label, value, onFocus, onChange }) => (
  <input
    aria-label={label}
    value={value}
    onFocus={onFocus}
    onChange={(event) => onChange(event.target.value)}
    className={`h-[26px] w-full bg-transparent px-2 text-[12px] text-[#24364d] outline-none ${cellFocusClass}`}
  />
);

const DateCell: React.FC<{
  label: string;
  value: string;
  onFocus: () => void;
  onChange: (value: string) => void;
}> = ({ label, value, onFocus, onChange }) => (
  <input
    aria-label={label}
    type="date"
    value={value}
    onFocus={onFocus}
    onChange={(event) => onChange(event.target.value)}
    className={`h-[26px] w-full bg-transparent px-2 text-[12px] text-[#24364d] outline-none [color-scheme:light] ${cellFocusClass}`}
  />
);

const SelectCell: React.FC<{
  id: string;
  label: string;
  options: Option[];
  value: string | null;
  onFocus: () => void;
  onChange: (value: string | null) => void;
}> = ({ id, label, options, value, onFocus, onChange }) => (
  <Select
    inputId={id}
    instanceId={id}
    aria-label={label}
    options={options}
    components={selectComponents}
    value={options.find((o) => o.value === value) ?? null}
    onFocus={onFocus}
    onChange={(option) => onChange(option?.value ?? null)}
    {...cellSelectProps}
  />
);

/* ----- ScrollGrid: header fixed, rows scroll with the bar beside them,
        totals fixed under the rows, horizontal bar along the bottom ----- */
type GridColumn<R> = {
  id: string;
  header: string;
  width?: string; // tailwind width class; omit for the one flexible column
  align?: "left" | "right" | "center";
  cellClass?: string; // default "p-0" (editor fills the cell)
  render: (row: R, index: number) => React.ReactNode;
  total?: { format: "int" | "money" }; // shows a totals box under this column
};

const SCROLLBAR_GUTTER = "w-[10px]"; // same as the 10px bar in niceScrollbar

const alignClass = { left: "text-left", right: "text-right", center: "text-center" };

const thClass =
  "h-[28px] border border-[#B7ECD0] bg-[#fafbfc] px-2 font-normal text-[#405066]";

const gridTableClass =
  "w-full table-fixed border-collapse text-[12px] text-[#24364d]";

function ScrollGrid<R>({
  columns,
  rows,
  getKey,
  activeKey,
  onActivate,
  totals,
  rowsHeightClass = "h-[110px]",
  minWidthClass = "min-w-[1100px]",
}: {
  columns: GridColumn<R>[];
  rows: R[];
  getKey: (row: R) => number;
  activeKey: number | null;
  onActivate: (key: number) => void;
  totals: Record<string, number>;
  rowsHeightClass?: string;
  minWidthClass?: string;
}) {
  const cols = (gutter: boolean) => (
    <colgroup>
      <col className="w-[22px]" />
      {columns.map((c) => (
        <col key={c.id} className={c.width} />
      ))}
      {gutter && <col className={SCROLLBAR_GUTTER} />}
    </colgroup>
  );

  return (
    /* horizontal scrollbar: at the bottom of the whole grid */
    <div
      className={`overflow-x-auto border border-[#B7ECD0] bg-white ${niceScrollbar}`}
    >
      <div className={minWidthClass}>
        {/* header (fixed) */}
        <table className={gridTableClass}>
          {cols(true)}
          <thead>
            <tr>
              <th className={thClass} />
              {columns.map((c) => (
                <th
                  key={c.id}
                  className={`${thClass} ${alignClass[c.align ?? "left"]}`}
                >
                  {c.header}
                </th>
              ))}
              <th className={`${thClass} p-0`} />
            </tr>
          </thead>
        </table>

        {/* rows (vertical scrollbar sits beside them) */}
        <div
          className={`${rowsHeightClass} overflow-x-hidden overflow-y-scroll bg-white ${niceScrollbar}`}
        >
          <table className={gridTableClass}>
            {cols(false)}
            <tbody>
              {rows.map((row, index) => {
                const key = getKey(row);
                const active = key === activeKey;
                return (
                  <tr
                    key={key}
                    onClick={() => onActivate(key)}
                    className="bg-white"
                  >
                    <td className="h-[26px] border border-[#B7ECD0] bg-[#fafbfc] text-center text-[8px] text-[#405066]">
                      {active ? "▶" : ""}
                    </td>
                    {columns.map((c) => (
                      <td
                        key={c.id}
                        className={`h-[26px] border border-[#B7ECD0] ${c.cellClass ?? "p-0"}`}
                      >
                        {c.render(row, index)}
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* totals (fixed under the rows) */}
        <table className={gridTableClass}>
          {cols(true)}
          <tfoot>
            <tr>
              <td className="border border-[#B7ECD0] bg-[#eef1f4]" />
              {columns.map((c) =>
                c.total ? (
                  <td
                    key={c.id}
                    className="border border-[#B7ECD0] bg-[#eef1f4] p-[3px]"
                  >
                    <input
                      id={`txtTotal-${c.id}`}
                      readOnly
                      tabIndex={-1}
                      aria-label={`Total ${c.header}`}
                      value={formatNumber(
                        totals[c.id] ?? 0,
                        c.total.format === "int" ? 0 : 2,
                      )}
                      className="h-[26px] w-full rounded-[3px] border border-[#cfd7df] bg-white px-2 text-right text-[12px] text-[#24364d] outline-none"
                    />
                  </td>
                ) : (
                  <td
                    key={c.id}
                    className="border border-[#B7ECD0] bg-[#eef1f4]"
                  />
                ),
              )}
              <td className="border border-[#B7ECD0] bg-[#eef1f4] p-0" />
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------------
   3. THE FOUR BORDERED GROUPS
   --------------------------------------------------------------------- */

/* 3a. Group 1 : header ---------------------------------------------------
   12 columns, five column groups on every row:
   A = 4 | B = 2 | C = 2 | D = 2 | E = 2                                   */
const HA = "w-[56px]"; // Branch, Date, City, Hotel, Guest
const HB = "w-[64px]"; // Entry No.
const HC = "w-[56px]"; // Service, Void, Country, Staff, Adults
const HD = "w-[76px]"; // Service CP, Childs
const HE = "w-[52px]"; // Carrier, D/I, Infants

const HotelHeaderGroup: React.FC<
  PartProps & {
    onFind: () => void;
    onOpenMaster: (name: "city" | "hotel") => void;
  }
> = ({ form, set, onFind, onOpenMaster }) => (
  <GroupBox>
    <div className={groupGrid}>
      {/* row 1 : Branch | Entry No. | Service | Service CP | Carrier */}
      <Field label="Branch :" labelClassName={HA} className="lg:col-span-4">
        <Combo
          id="lkpBranch"
          options={branchOptions}
          value={form.branch}
          onChange={(v) => set("branch", v)}
        />
      </Field>
      <Field
        label="Entry No. :"
        htmlFor="txtEntryNo"
        labelClassName={HB}
        className="lg:col-span-2"
      >
        <input
          id="txtEntryNo"
          value={form.entryNo}
          onChange={(event) => set("entryNo", event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") onFind();
          }}
          className={inputClass}
        />
      </Field>
      <Field label="Service :" labelClassName={HC} className="lg:col-span-2 ml-[40%]">
        <Combo
          id="lkpService"
          options={serviceOptions}
          value={form.service}
          onChange={(v) => set("service", v)}
          className="w-[72px] shrink-0"
        />
      </Field>
      <Field label="Service CP :" labelClassName={HD} className="lg:col-span-2 ">
        <Combo
          id="lkpServiceCp"
          options={serviceCpOptions}
          value={form.serviceCp}
          onChange={(v) => set("serviceCp", v)}
           className="w-[72px] shrink-0"
        />
      </Field>
      <Field label="Carrier :" labelClassName={HE} className="lg:col-span-2 -ml-[30%]">
        <Combo
          id="lkpCarrier"
          options={carrierOptions}
          value={form.carrier}
          onChange={(v) => set("carrier", v)}
            className="w-[215px] shrink-0"
        />
      </Field>

      {/* row 2 : Date | - | Void | - | D/I */}
      <Field label="Date :" labelClassName={HA} className="lg:col-span-4">
        <div className="w-[140px] max-w-full">
          <AppDatePicker
            id="dtpDate"
            label="Date"
            value={form.date}
            onChange={(v) => set("date", v)}
          />
        </div>
      </Field>
      <div className="hidden lg:col-span-2 lg:block" />
      <Field label="Void :" labelClassName={HC} className="lg:col-span-2 ml-[40%]" >
        <Combo
          id="lkpVoid"
          options={yesNoOptions}
          value={form.voidFlag}
          onChange={(v) => set("voidFlag", v)}
          className="w-[72px] shrink-0"
        />
      </Field>
      <div className="hidden lg:col-span-2 lg:block" />
      <Field label="D/I :" labelClassName={HE} className="lg:col-span-2 -ml-[30%]">
        <Combo
          id="lkpDI"
          options={diOptions}
          value={form.di}
          onChange={(v) => set("di", v)}
          className="w-[130px] shrink-0"
        />
      </Field>

      {/* row 3 : City | City button | Country */}
      <Field label="City :" labelClassName={HA} className="lg:col-span-4">
        <Combo
          id="lkpCity"
          options={cityOptions}
          value={form.city}
          onChange={(v) => set("city", v)}
        />
      </Field>
      <div className="flex justify-center lg:col-span-2 mr-40">
        <button
          id="btnCity"
          type="button"
          onClick={() => onOpenMaster("city")}
          className="min-w-[70px] text-sm border border-gray-600 bg-[#e6e6eb] h-6 rounded-sm cursor-pointer hover:bg-[#dedee2] transition-all "
        >
          City
        </button>
      </div>
      <Field
        label="Country :"
        labelClassName={HC}
        className="sm:col-span-2 lg:col-span-4   ml-[19%]"
      >
        <Combo
          id="lkpCountry"
          options={toOptions(Array.from(new Set(Object.values(cityCountry))))}
          value={form.city ? cityCountry[form.city] ?? null : null}
          
          className="w-[450px] shrink-0"
        />
      </Field>
      <div className="hidden lg:col-span-2 lg:block" />

      {/* row 4 : Hotel | Hotel button | Staff */}
      <Field label="Hotel :" labelClassName={HA} className="lg:col-span-4">
        <Combo
          id="lkpHotel"
          options={hotelOptions}
          value={form.hotel}
          onChange={(v) => set("hotel", v)}
        />
      </Field>
      <div className="flex justify-center lg:col-span-2 mr-40">
        <button
          id="btnHotel"
          type="button"
          onClick={() => onOpenMaster("hotel")}
          className=" min-w-[70px] text-sm border border-gray-600 bg-[#e6e6eb] h-6 rounded-sm cursor-pointer hover:bg-[#dedee2] transition-all "
        >
          Hotel
        </button>
      </div>
      <Field
        label="Staff :"
        labelClassName={HC}
        className="sm:col-span-2 lg:col-span-6 ml-[12.5%]"
      >
        <PairCombo
          idId="lkpStaffID"
          nameId="lkpStaffName"
          idOptions={staffIdOptions}
          nameOptions={staffNameOptions}
          value={form.staff}
          onChange={(v) => set("staff", v)}
          idWidth="w-[72px]"
          NameWidth="w-[372px]"

        />
      </Field>
      <div className="hidden lg:col-span-2 lg:block" />

      {/* row 5 : Guest | Adults | Childs | Infants */}
      <Field
        label="Guest :"
        htmlFor="txtGuest"
        labelClassName={HA}
        className="sm:col-span-2 lg:col-span-4 -ml-60 w-full"
      >
        <input
          id="txtGuest"
          value={form.guest}
          onChange={(event) => set("guest", event.target.value)}
          className={inputClass}
        />
      </Field>
      <Field label="Adults :" labelClassName={HC} className="lg:col-span-2 ml-[40%]">
        <div className="w-[74px]">
          <IntInput
            id="txtAdults"
            value={form.adults}
            onChange={(v) => set("adults", v)}
          />
        </div>
      </Field>
      <Field label="Childs :" labelClassName={HD} className="lg:col-span-2 ml-[10%]">
        <div className="w-[64px]">
          <IntInput
            id="txtChilds"
            value={form.childs}
            onChange={(v) => set("childs", v)}
          />
        </div>
      </Field>
      <Field label="Infants :" labelClassName={HE} className="lg:col-span-2">
        <div className="w-[64px]">
          <IntInput
            id="txtInfants"
            value={form.infants}
            onChange={(v) => set("infants", v)}
          />
        </div>
      </Field>
    </div>
  </GroupBox>
);

/* 3b. Group 2 : rooms table (Room Price/N column removed) ---------------- */
const RoomsGroup: React.FC<{
  rows: RoomRow[];
  activeKey: number | null;
  onActivate: (key: number) => void;
  onChange: (key: number, patch: Partial<RoomRow>) => void;
}> = ({ rows, activeKey, onActivate, onChange }) => {
  const filledIndex = (row: RoomRow) =>
    rows.filter((r) => !isEmptyRoom(r)).indexOf(row) + 1;

  const columns: GridColumn<RoomRow>[] = [
    {
      id: "sl",
      header: "Sl.#",
      width: "w-[44px]",
      align: "center",
      cellClass: "px-2 text-center",
      render: (row) => (isEmptyRoom(row) ? "" : filledIndex(row)),
    },
    {
      id: "roomType",
      header: "Room Type",
      render: (row) => (
        <SelectCell
          id={`lkpRoomType-${row.key}`}
          label="Room Type"
          options={roomTypeOptions}
          value={row.roomType}
          onFocus={() => onActivate(row.key)}
          onChange={(v) => onChange(row.key, { roomType: v })}
        />
      ),
    },
    {
      id: "checkIn",
      header: "Check In",
      width: "w-[130px]",
      render: (row) => (
        <DateCell
          label="Check In"
          value={row.checkIn}
          onFocus={() => onActivate(row.key)}
          onChange={(v) => onChange(row.key, { checkIn: v })}
        />
      ),
    },
    {
      id: "nights",
      header: "Nights",
      width: "w-[80px]",
      align: "right",
      total: { format: "int" },
      render: (row) => (
        <IntCell
          label="Nights"
          value={row.nights}
          onFocus={() => onActivate(row.key)}
          onChange={(v) => onChange(row.key, { nights: v })}
        />
      ),
    },
    {
      id: "checkOut",
      header: "Check Out",
      width: "w-[110px]",
      cellClass: "bg-[#eef1f4] px-2",
      render: (row) => computeCheckOut(row),
    },
    {
      id: "roomQty",
      header: "Room Qty.",
      width: "w-[90px]",
      align: "right",
      render: (row) => (
        <IntCell
          label="Room Qty."
          value={row.roomQty}
          onFocus={() => onActivate(row.key)}
          onChange={(v) => onChange(row.key, { roomQty: v })}
        />
      ),
    },
    {
      id: "totNights",
      header: "Tot. Nights",
      width: "w-[90px]",
      align: "right",
      total: { format: "int" },
      render: (row) => (
        <IntCell
          label="Tot. Nights"
          value={row.totNights}
          onFocus={() => onActivate(row.key)}
          onChange={(v) => onChange(row.key, { totNights: v })}
        />
      ),
    },
    {
      id: "guestQty",
      header: "Guest Qty.",
      width: "w-[90px]",
      align: "right",
      render: (row) => (
        <IntCell
          label="Guest Qty."
          value={row.guestQty}
          onFocus={() => onActivate(row.key)}
          onChange={(v) => onChange(row.key, { guestQty: v })}
        />
      ),
    },
    {
      id: "meal",
      header: "Meal",
      width: "w-[80px]",
      render: (row) => (
        <SelectCell
          id={`lkpMeal-${row.key}`}
          label="Meal"
          options={mealOptions}
          value={row.meal}
          onFocus={() => onActivate(row.key)}
          onChange={(v) => onChange(row.key, { meal: v })}
        />
      ),
    },
    {
      id: "mealPrice",
      header: "Meal Price",
      width: "w-[100px]",
      align: "right",
      render: (row) => (
        <MoneyCell
          label="Meal Price"
          value={row.mealPrice}
          onFocus={() => onActivate(row.key)}
          onChange={(v) => onChange(row.key, { mealPrice: v })}
        />
      ),
    },
    {
      id: "total",
      header: "Total",
      width: "w-[110px]",
      align: "right",
      cellClass: "bg-[#eef1f4] px-2 text-right",
      total: { format: "money" },
      render: (row) =>
        isEmptyRoom(row) ? "" : formatNumber(computeRoomTotal(row)),
    },
  ];

  const totals = {
    nights: rows.reduce((t, r) => t + toNumber(r.nights), 0),
    totNights: rows.reduce((t, r) => t + toNumber(r.totNights), 0),
    total: rows.reduce((t, r) => t + computeRoomTotal(r), 0),
  };

  return (
    <GroupBox>
      <ScrollGrid
        columns={columns}
        rows={rows}
        getKey={(row) => row.key}
        activeKey={activeKey}
        onActivate={onActivate}
        totals={totals}
      />
    </GroupBox>
  );
};

/* 3c. Group 3 : supplier, payment and amounts ----------------------------
   left half = 6 columns, right half = 2 x 3 columns                      */
const SA = "w-[116px]"; // Services, Supplier, Supp. Inv. No., Confirmation No., Supplier Excl. VAT
const SB = "w-[110px]"; // FOP, Sup. Payment, Supplier Name, Currency, Sup. VAT
const SC = "w-[132px]"; // CC Type, Supplier Amt. (FC), Supplier Amt.

const SupplierGroup: React.FC<PartProps & { supplierAmt: number }> = ({
  form,
  set,
  supplierAmt,
}) => {
  const supplierName =
    supplierNameOptions.find((o) => o.value === form.supplier)?.label ?? "";

  return (
    <GroupBox>
      <div className={groupGrid}>
        {/* row 1 : Services | FOP | CC Type */}
        <Field
          label="Services :"
          htmlFor="txtServices"
          labelClassName={SA}
          className="sm:col-span-2 lg:col-span-6"
        >
          <input
            id="txtServices"
            value={form.services}
            onChange={(event) => set("services", event.target.value)}
            className={inputClass}
          />
        </Field>
        <Field label="FOP :" labelClassName={SB} className="lg:col-span-3">
          <Combo
            id="lkpFOP"
            options={fopOptions}
            value={form.fop}
            onChange={(v) => set("fop", v)}
          />
        </Field>
        <Field label="CC Type :" labelClassName={SC} className="lg:col-span-3">
          <Combo
            id="lkpCCType"
            options={ccTypeOptions}
            value={form.ccType}
            onChange={(v) => set("ccType", v)}
            className="w-[110px] shrink-0"
          />
        </Field>

        {/* row 2 : Supplier | Sup. Payment */}
        <Field
          label="Supplier :"
          labelClassName={SA}
          className="sm:col-span-2 lg:col-span-6"
        >
          <PairCombo
            idId="lkpSupplierID"
            nameId="lkpSupplierName"
            idOptions={supplierIdOptions}
            nameOptions={supplierNameOptions}
            value={form.supplier}
            onChange={(v) => set("supplier", v)}
            idWidth="w-[110px]"
          />
        </Field>
        <Field
          label="Sup. Payment :"
          labelClassName={SB}
          className="sm:col-span-2 lg:col-span-6"
        >
          <PairCombo
            idId="lkpSupPaymentID"
            nameId="lkpSupPaymentName"
            idOptions={supPaymentIdOptions}
            nameOptions={supPaymentNameOptions}
            value={form.supPayment}
            onChange={(v) => set("supPayment", v)}
            idWidth="w-[110px]"
          />
        </Field>

        {/* row 3 : Supp. Inv. No. + Date | Supplier Name */}
        <div className="flex min-w-0 items-center gap-3 sm:col-span-2 lg:col-span-6">
          <Field
            label="Supp. Inv. No. :"
            labelClassName={SA}
            className="min-w-0 flex-1"
          >
            <ReadOnlyBox id="txtSuppInvNo" value="" />
          </Field>
          <Field label="Supp. Inv. Date :" className="min-w-0 flex-1">
            <div className="w-[140px] ml-[42.5%]">
                <AppDatePicker
              id="dtpSuppInvDate"
              label="Supp. Inv. Date"
              value={form.suppInvDate}
              onChange={(v) => set("suppInvDate", v)}
              
            />
            </div>
          </Field>
        </div>
        <Field
          label="Supplier Name :"
          labelClassName={SB}
          className="sm:col-span-2 lg:col-span-6"
        >
          <ReadOnlyBox id="txtSupplierName" value={supplierName} />
        </Field>

        {/* row 4 : Confirmation No. | Currency | Supplier Amt. (FC) */}
        <Field
          label="Confirmation No. :"
          htmlFor="txtConfirmationNo"
          labelClassName={SA}
          className="sm:col-span-2 lg:col-span-6"
        >
          <input
            id="txtConfirmationNo"
            value={form.confirmationNo}
            onChange={(event) => set("confirmationNo", event.target.value)}
            className={inputClass}
          />
        </Field>
        <Field label="Currency :" labelClassName={SB} className="lg:col-span-3">
          <Combo
            id="lkpCurrency"
            options={currencyOptions}
            value={form.currency}
            onChange={(v) => {
              set("currency", v);
              if (v) set("rate", currencyRates[v] ?? "1.0000");
            }}
            className="w-[76px] shrink-0"
          />
          <MoneyInput
            id="txtRate"
            value={form.rate}
            decimals={4}
            onChange={(v) => set("rate", v)}
          />
        </Field>
        <Field
          label="Supplier Amt. (FC) :"
          labelClassName={SC}
          className="lg:col-span-3"
        >
          <MoneyInput
            id="txtSupplierAmtFc"
            value={form.supplierAmtFc}
            decimals={4}
            onChange={(v) => set("supplierAmtFc", v)}
          />
        </Field>

        {/* row 5 : Supplier Excl. VAT | Sup. VAT | Supplier Amt. */}
        <Field
          label="Supplier Excl. VAT :"
          labelClassName={SA}
          className="sm:col-span-2 lg:col-span-6"
        >
          <div className="w-[120px] max-w-full">
            <MoneyInput
              id="txtSupplierExclVat"
              value={form.supplierExclVat}
              onChange={(v) => set("supplierExclVat", v)}
            />
          </div>
        </Field>
        <Field label="Sup. VAT :" labelClassName={SB} className="lg:col-span-3">
          <MoneyInput
            id="txtSupVat"
            value={form.supVat}
            onChange={(v) => set("supVat", v)}
          />
        </Field>
        <Field label="Supplier Amt. :" labelClassName={SC} className="lg:col-span-3">
          <ReadOnlyBox
            id="txtSupplierAmt"
            value={formatNumber(supplierAmt)}
            right
          />
        </Field>
      </div>
    </GroupBox>
  );
};

/* 3d. Group 4 : customers table (Type column removed) -------------------- */
const CustomersGroup: React.FC<{
  rows: CustomerRow[];
  activeKey: number | null;
  onActivate: (key: number) => void;
  onChange: (key: number, patch: Partial<CustomerRow>) => void;
}> = ({ rows, activeKey, onActivate, onChange }) => {
  const moneyColumn = (
    field: MoneyField,
    header: string,
  ): GridColumn<CustomerRow> => ({
    id: field,
    header,
    width: "w-[84px]",
    align: "right",
    total: { format: "money" },
    render: (row) => (
      <MoneyCell
        label={header}
        value={row[field]}
        onFocus={() => onActivate(row.key)}
        onChange={(v) => onChange(row.key, { [field]: v })}
      />
    ),
  });

  const columns: GridColumn<CustomerRow>[] = [
    {
      id: "customerId",
      header: "Customer ID",
      width: "w-[100px]",
      render: (row) => (
        <SelectCell
          id={`lkpCustomer-${row.key}`}
          label="Customer ID"
          options={customerIdOptions}
          value={row.customerId}
          onFocus={() => onActivate(row.key)}
          onChange={(v) => onChange(row.key, { customerId: v })}
        />
      ),
    },
    {
      id: "customerName",
      header: "Customer Name",
      cellClass: "px-2",
      render: (row) => (row.customerId ? customerNames[row.customerId] ?? "" : ""),
    },
    {
      id: "division",
      header: "Division",
      width: "w-[84px]",
      render: (row) => (
        <TextCell
          label="Division"
          value={row.division}
          onFocus={() => onActivate(row.key)}
          onChange={(v) => onChange(row.key, { division: v })}
        />
      ),
    },
    moneyColumn("suppAmt", "Supp. Amt."),
    moneyColumn("cdAmt", "CD. Amt."),
    moneyColumn("sChg", "S. Chg."),
    {
      id: "vatAmt",
      header: "VAT Amt.",
      width: "w-[84px]",
      align: "right",
      cellClass: "bg-[#eef1f4] px-2 text-right",
      total: { format: "money" },
      render: (row) =>
        isEmptyCustomer(row) ? "" : formatNumber(computeVatAmt(row)),
    },
    moneyColumn("sChgV", "S. Chg. V."),
    moneyColumn("mf", "MF"),
    moneyColumn("invAmt", "Inv. Amt."),
    {
      id: "invNo",
      header: "Inv. No.",
      width: "w-[110px]",
      cellClass: "bg-[#eef1f4] px-2",
      render: (row) => row.invNo,
    },
  ];

  const sum = (field: MoneyField) =>
    rows.reduce((total, row) => total + toNumber(row[field]), 0);

  const totals = {
    suppAmt: sum("suppAmt"),
    cdAmt: sum("cdAmt"),
    sChg: sum("sChg"),
    vatAmt: rows.reduce((total, row) => total + computeVatAmt(row), 0),
    sChgV: sum("sChgV"),
    mf: sum("mf"),
    invAmt: sum("invAmt"),
  };

  return (
    <GroupBox>
      <ScrollGrid
        columns={columns}
        rows={rows}
        getKey={(row) => row.key}
        activeKey={activeKey}
        onActivate={onActivate}
        totals={totals}
      />
    </GroupBox>
  );
};

/* 3e. Button bar --------------------------------------------------------- */
const HotelActions: React.FC<{
  onSave: () => void;
  onCancel: () => void;
  onClose: () => void;
}> = ({ onSave, onCancel, onClose }) => (
  <div className="flex justify-center gap-3">
    <button id="btnSave" type="button" onClick={onSave} className="btn-style">
      <u>S</u>ave
    </button>
    <button
      id="btnCancel"
      type="button"
      onClick={onCancel}
      className="btn-style"
    >
      <u>C</u>ancel
    </button>
    <button id="btnClose" type="button" onClick={onClose} className="btn-style">
      Cl<u>o</u>se
    </button>
  </div>
);

/* ---------------------------------------------------------------------
   4. MAIN PAGE : owns the state and renders everything in one place
   --------------------------------------------------------------------- */
type HotelDetailProps = {
  title?: string;
  onOpenMaster?: (name: "city" | "hotel") => void;
  onClose?: () => void;
};

const HotelDetail: React.FC<HotelDetailProps> = ({
  title = "Hotel Sales",
  onOpenMaster,
  onClose,
}) => {
  const [form, setForm] = useState<FormState>(initialForm);
  const [rooms, setRooms] = useState<RoomRow[]>(() => padRooms([]));
  const [customers, setCustomers] = useState<CustomerRow[]>(() =>
    padCustomers([]),
  );
  const [roomKey, setRoomKey] = useState<number | null>(null);
  const [customerKey, setCustomerKey] = useState<number | null>(null);
  const [error, setError] = useState("");

  const set: SetField = (key, value) => {
    setError("");
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const updateRoom = (key: number, patch: Partial<RoomRow>) =>
    setRooms((prev) =>
      padRooms(prev.map((row) => (row.key === key ? { ...row, ...patch } : row))),
    );

  const updateCustomer = (key: number, patch: Partial<CustomerRow>) =>
    setCustomers((prev) =>
      padCustomers(
        prev.map((row) => (row.key === key ? { ...row, ...patch } : row)),
      ),
    );

  /* Supplier Amt. is calculated from your rules; 0.00 until then. */
  const supplierAmt = 0;

  const handleFind = () => console.log("find entry", form.entryNo);

  const handleOpenMaster = (name: "city" | "hotel") => {
    console.log("open master", name);
    onOpenMaster?.(name);
  };

  const reset = () => {
    setForm(initialForm());
    setRooms(padRooms([]));
    setCustomers(padCustomers([]));
    setRoomKey(null);
    setCustomerKey(null);
    setError("");
  };

  const handleSave = () => {
    const filledRooms = rooms.filter((r) => !isEmptyRoom(r));
    if (filledRooms.length === 0) {
      setError("Add at least one room line.");
      return;
    }
    setError("");
    console.log({
      ...form,
      rooms: filledRooms.map((r) => ({
        roomType: r.roomType,
        checkIn: r.checkIn,
        nights: toNumber(r.nights),
        checkOut: computeCheckOut(r),
        roomQty: toNumber(r.roomQty),
        totNights: toNumber(r.totNights),
        guestQty: toNumber(r.guestQty),
        meal: r.meal,
        mealPrice: toNumber(r.mealPrice),
      })),
      customers: customers
        .filter((c) => !isEmptyCustomer(c))
        .map((c) => ({
          customerId: c.customerId,
          division: c.division,
          suppAmt: toNumber(c.suppAmt),
          cdAmt: toNumber(c.cdAmt),
          sChg: toNumber(c.sChg),
          sChgV: toNumber(c.sChgV),
          mf: toNumber(c.mf),
          invAmt: toNumber(c.invAmt),
        })),
    });
  };

  const handleClose = () => {
    reset();
    onClose?.();
  };

  return (
    <div className="flex min-h-screen w-full items-start justify-center bg-white px-4 py-4">
      <div className="min-h-fit w-full max-w-[1500px] bg-white p-0">
        <main className="w-full overflow-hidden border border-[#d5dce2] bg-white">
         <Header Name={title}/>

          <section className="flex flex-col gap-3 px-3.5 pb-6 pt-3">
            {/* group 1 */}
            <HotelHeaderGroup
              form={form}
              set={set}
              onFind={handleFind}
              onOpenMaster={handleOpenMaster}
            />

            {/* group 2 */}
            <RoomsGroup
              rows={rooms}
              activeKey={roomKey}
              onActivate={setRoomKey}
              onChange={updateRoom}
            />

            {/* group 3 */}
            <SupplierGroup form={form} set={set} supplierAmt={supplierAmt} />

            {/* group 4 */}
            <CustomersGroup
              rows={customers}
              activeKey={customerKey}
              onActivate={setCustomerKey}
              onChange={updateCustomer}
            />

            {error && (
              <p role="alert" className="m-0 text-[12px] text-[#c0392b]">
                {error}
              </p>
            )}

            <HotelActions
              onSave={handleSave}
              onCancel={reset}
              onClose={handleClose}
            />
          </section>
        </main>
      </div>
    </div>
  );
};

export default HotelDetail;