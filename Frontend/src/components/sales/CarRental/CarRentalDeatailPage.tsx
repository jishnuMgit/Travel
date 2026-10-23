import React, { useState } from "react";
import Select from "react-select";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";
import Header from "../../comman/Header";
import selectComponents from "../../comman/selectComponents";
import TicketLinesPage from "../TicketSales/TicketSalesInvoice";

dayjs.extend(customParseFormat);

/* =====================================================================
   FILE MAP
   1. Types, constants and sample options
   2. Shared building blocks (Field, Combo, PairCombo, inputs, ScrollGrid)
   3. The three bordered groups
        CarHeaderGroup     : branch, entry no, service, pick/drop, guest, FOP ...
        CarSupplierGroup   : supplier, payment, invoice, currency, amounts
        CarCustomersGroup  : customer table + totals          (MF removed)
      + CarActions         : Save, Cancel, Close
   4. CarRentalDeatailPage : owns the state and renders everything in one place
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
const serviceOptions = toOptions(["C", "H", "T"]);
const serviceCpOptions = toOptions(["CAR", "HTL", "TKT"]);
const carrierOptions = toOptions(["CAR RENTAL", "HOTEL", "AIRLINE"]);
const diOptions = toOptions(["D", "I"]);
const yesNoOptions = toOptions(["No", "Yes"]);
const countryOptions = toOptions([
  "SAUDI ARABIA",
  "UAE",
  "BAHRAIN",
  "KUWAIT",
  "EGYPT",
]);
const carTypeOptions = toOptions(["SEDAN", "SUV", "VAN", "LUXURY"]);
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
  date: string;
  di: string | null;
  carrier: string | null;
  pickPoint: string;
  country: string | null;
  voidFlag: string | null;
  dropPoint: string;
  pickUpTime: string;
  flightNo: string;
  carType: string | null;
  guest: string;
  adults: string;
  childs: string;
  infants: string;
  staff: string | null;
  services: string;
  fop: string | null;
  ccType: string | null;
  pickDate: string;
  dropDate: string;
  // supplier group
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
  service: "C",
  serviceCp: "CAR",
  date: TODAY,
  di: "I",
  carrier: "CAR RENTAL",
  pickPoint: "",
  country: null,
  voidFlag: "No",
  dropPoint: "",
  pickUpTime: "",
  flightNo: "",
  carType: null,
  guest: "",
  adults: "",
  childs: "",
  infants: "",
  staff: null,
  services: "",
  fop: null,
  ccType: "NA",
  pickDate: "",
  dropDate: "",
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

/* ----- customer table rows (MF removed) ----- */
type MoneyField = "suppAmt" | "cdAmt" | "sChg" | "sChgV" | "invAmt";

type CustomerRow = {
  key: number;
  customerId: string | null;
  type: string;
  division: string;
  suppAmt: string;
  cdAmt: string;
  sChg: string;
  sChgV: string;
  invAmt: string;
  invNo: string; // read-only
};

const customerMoneyFields: MoneyField[] = [
  "suppAmt",
  "cdAmt",
  "sChg",
  "sChgV",
  "invAmt",
];

let keyCounter = 0;
const nextKey = () => ++keyCounter;

const emptyCustomer = (): CustomerRow => ({
  key: nextKey(),
  customerId: null,
  type: "",
  division: "",
  suppAmt: "",
  cdAmt: "",
  sChg: "",
  sChgV: "",
  invAmt: "",
  invNo: "",
});

const isEmptyCustomer = (r: CustomerRow) =>
  !r.customerId &&
  !r.type &&
  !r.division &&
  customerMoneyFields.every((field) => r[field] === "");

/** keeps one empty row at the end and at least 3 rows in total */
const padCustomers = (rows: CustomerRow[]): CustomerRow[] => {
  const result = [...rows];
  if (result.length === 0 || !isEmptyCustomer(result[result.length - 1])) {
    result.push(emptyCustomer());
  }
  while (result.length < 3) result.push(emptyCustomer());
  return result;
};

const toNumber = (value: string) => {
  const parsed = parseFloat(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const formatNumber = (value: number, decimals = 2) =>
  value.toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });

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
  " w-full min-w-0 input-style ";

const readOnlyClass =
  "h-[30px] w-full min-w-0 rounded-[4px] border border-[#cfd7df] bg-[#eef1f4] px-2 text-[12px] text-[#24364d] outline-none";

/** bordered group box */
const GroupBox: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className = "",
}) => (
  <div className={`border border-gray-300 shadow-sm shadow-gray-300 bg-[#fcfdfe] p-3 ${className}`}>
    {children}
  </div>
);

const groupGrid =
  "grid grid-cols-1 items-center gap-x-4 gap-y-2 sm:grid-cols-2 lg:grid-cols-12";

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
}> = ({
  idId,
  nameId,
  idOptions,
  nameOptions,
  value,
  onChange,
  idWidth = "w-[92px]",
}) => (
  <div className="flex min-w-0 flex-1 items-center gap-1.5">
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
      className="flex-1"
    />
  </div>
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
    components={selectComponents}
    options={options}
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

const alignClass = {
  left: "text-left",
  right: "text-right",
  center: "text-center",
};

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
  minWidthClass = "min-w-[1000px]",
}: {
  columns: GridColumn<R>[];
  rows: R[];
  getKey: (row: R) => number;
  activeKey: number | null;
  onActivate: (key: number) => void;
  totals: Record<string, number>;
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
          style={{ height: `${Math.min(rows.length * 26, 110)}px` }}
          className={`overflow-x-hidden overflow-y-scroll bg-white ${niceScrollbar}`}
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
   3. THE THREE BORDERED GROUPS
   --------------------------------------------------------------------- */

/* 3a. Group 1 : header ---------------------------------------------------
   12 columns = a left block (6) and a right block (6) on every row.
   Left block label width LL, right block label widths LR1 / LR2.        */
const LL = "w-[116px]"; // Branch, Date, Pick Point, Drop Point, Car Type, Guest, Adults, Services, Pick Date
const LE = "w-[64px]"; // Entry No., X/O No.
const LR1 = "w-[116px]"; // Service, D/I, Country, Pick Up Time, Telephone No., Post No., Staff, FOP, Additional Service
const LR2 = "w-[96px]"; // Service CP, Carrier, Flight No., CC Type

const CarHeaderGroup: React.FC<PartProps & { onFind: () => void }> = ({
  form,
  set,
  onFind,
}) => (
  <GroupBox>
    <div className={groupGrid}>
      {/* row 1 : Branch | Entry No. | Service | Service CP */}
      <Field label="Branch :" labelClassName={LL} className="lg:col-span-4">
        <Combo
          id="lkpBranch"
          options={branchOptions}
          value={form.branch}
          onChange={(v) => set("branch", v)}
          className="w-[250px] max-w-full shrink-0"
        />
      </Field>
      <Field
        label="Entry No. :"
        htmlFor="txtEntryNo"
        labelClassName={LE}
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
      <Field label="Service :" labelClassName={LR1} className="lg:col-span-3">
        <Combo
          id="lkpService"
          options={serviceOptions}
          value={form.service}
          onChange={(v) => set("service", v)}
          className="w-[72px] shrink-0"
        />
      </Field>
      <Field label="Service CP :" labelClassName={LR2} className="lg:col-span-3">
        <Combo
          id="lkpServiceCp"
          options={serviceCpOptions}
          value={form.serviceCp}
          onChange={(v) => set("serviceCp", v)}
          className="w-[96px] shrink-0"
        />
      </Field>

      {/* row 2 : Date | X/O No. | D/I | Carrier */}
      <Field label="Date :" labelClassName={LL} className="lg:col-span-4">
        <div className="w-[140px] shrink-0">
          <AppDatePicker
            id="dtpDate"
            label="Date"
            value={form.date}
            onChange={(v) => set("date", v)}
          />
        </div>
      </Field>
      <Field label="X/O No. :" labelClassName={LE} className="lg:col-span-2">
        <ReadOnlyBox id="txtXoNo" value="" />
      </Field>
      <Field label="D/I :" labelClassName={LR1} className="lg:col-span-3">
        <Combo
          id="lkpDI"
          options={diOptions}
          value={form.di}
          onChange={(v) => set("di", v)}
          className="w-[72px] shrink-0"
        />
      </Field>
      <Field label="Carrier :" labelClassName={LR2} className="lg:col-span-3">
        <Combo
          id="lkpCarrier"
          options={carrierOptions}
          value={form.carrier}
          onChange={(v) => set("carrier", v)}
        />
      </Field>

      {/* row 3 : Pick Point | Country | Void */}
      <Field
        label="Pick Point :"
        htmlFor="txtPickPoint"
        labelClassName={LL}
        className="lg:col-span-4"
      >
        <input
          id="txtPickPoint"
          value={form.pickPoint}
          onChange={(event) => set("pickPoint", event.target.value)}
          className={inputClass}
        />
      </Field>
      <div className="hidden lg:col-span-2 lg:block" />
      <Field label="Country :" labelClassName={LR1} className="lg:col-span-4">
        <Combo
          id="lkpCountry"
          options={countryOptions}
          value={form.country}
          onChange={(v) => set("country", v)}
        />
      </Field>
      <Field label="Void :" labelClassName="w-[44px]" className="lg:col-span-2">
        <Combo
          id="lkpVoid"
          options={yesNoOptions}
          value={form.voidFlag}
          onChange={(v) => set("voidFlag", v)}
        />
      </Field>

      {/* row 4 : Drop Point | Pick Up Time | Flight No. */}
      <Field
        label="Drop Point :"
        htmlFor="txtDropPoint"
        labelClassName={LL}
        className="lg:col-span-4"
      >
        <input
          id="txtDropPoint"
          value={form.dropPoint}
          onChange={(event) => set("dropPoint", event.target.value)}
          className={inputClass}
        />
      </Field>
      <div className="hidden lg:col-span-2 lg:block" />
      <Field
        label="Pick Up Time :"
        htmlFor="txtPickUpTime"
        labelClassName={LR1}
        className="lg:col-span-3"
      >
        <div className="w-[140px] shrink-0">
          <input
            id="txtPickUpTime"
            type="time"
            value={form.pickUpTime}
            onChange={(event) => set("pickUpTime", event.target.value)}
            className={`${inputClass} [color-scheme:light]`}
          />
        </div>
      </Field>
      <Field
        label="Flight No. :"
        htmlFor="txtFlightNo"
        labelClassName={LR2}
        className="lg:col-span-3"
      >
        <input
          id="txtFlightNo"
          value={form.flightNo}
          onChange={(event) => set("flightNo", event.target.value)}
          className={inputClass}
        />
      </Field>

      {/* row 5 : Car Type | Telephone No. */}
      <Field label="Car Type :" labelClassName={LL} className="lg:col-span-4">
        <Combo
          id="lkpCarType"
          options={carTypeOptions}
          value={form.carType}
          onChange={(v) => set("carType", v)}
          className="w-[160px] max-w-full shrink-0"
        />
      </Field>
      <div className="hidden lg:col-span-2 lg:block" />
      <Field
        label="Telephone No. :"
        labelClassName={LR1}
        className="sm:col-span-2 lg:col-span-6"
      >
        <ReadOnlyBox id="txtTelephoneNo" value="" />
      </Field>

      {/* row 6 : Guest | Post No. */}
      <Field
        label="Guest :"
        htmlFor="txtGuest"
        labelClassName={LL}
        className="sm:col-span-2 lg:col-span-6"
      >
        <input
          id="txtGuest"
          value={form.guest}
          onChange={(event) => set("guest", event.target.value)}
          className={inputClass}
        />
      </Field>
      <Field label="Post No. :" labelClassName={LR1} className="lg:col-span-3">
        <ReadOnlyBox id="txtPostNo" value="" />
      </Field>
      <div className="hidden lg:col-span-3 lg:block" />

      {/* row 7 : Adults | Childs | Infants | Staff */}
      <Field label="Adults :" labelClassName={LL} className="lg:col-span-2">
        <div className="w-[46px]">
          <IntInput
            id="txtAdults"
            value={form.adults}
            onChange={(v) => set("adults", v)}
          />
        </div>
      </Field>
      <Field label="Childs :" labelClassName="w-[56px]" className="lg:col-span-2">
        <div className="w-[46px]">
          <IntInput
            id="txtChilds"
            value={form.childs}
            onChange={(v) => set("childs", v)}
          />
        </div>
      </Field>
      <Field label="Infants :" labelClassName="w-[56px]" className="lg:col-span-2">
        <div className="w-[46px]">
          <IntInput
            id="txtInfants"
            value={form.infants}
            onChange={(v) => set("infants", v)}
          />
        </div>
      </Field>
      <Field
        label="Staff :"
        labelClassName={LR1}
        className="sm:col-span-2 lg:col-span-6"
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

      {/* row 8 : Services | FOP | CC Type */}
      <Field
        label="Services :"
        htmlFor="txtServices"
        labelClassName={LL}
        className="sm:col-span-2 lg:col-span-6"
      >
        <input
          id="txtServices"
          value={form.services}
          onChange={(event) => set("services", event.target.value)}
          className={inputClass}
        />
      </Field>
      <Field label="FOP :" labelClassName={LR1} className="lg:col-span-3">
        <Combo
          id="lkpFOP"
          options={fopOptions}
          value={form.fop}
          onChange={(v) => set("fop", v)}
          className="w-[110px] shrink-0"
        />
      </Field>
      <Field label="CC Type :" labelClassName={LR2} className="lg:col-span-3">
        <Combo
          id="lkpCCType"
          options={ccTypeOptions}
          value={form.ccType}
          onChange={(v) => set("ccType", v)}
          className="w-[96px] shrink-0"
        />
      </Field>

      {/* row 9 : Pick Date | Drop Date | Additional Service */}
      <Field label="Pick Date :" labelClassName={LL} className="lg:col-span-3">
        <div className="w-[140px] shrink-0">
          <AppDatePicker
            id="dtpPickDate"
            label="Pick Date"
            value={form.pickDate}
            onChange={(v) => set("pickDate", v)}
          />
        </div>
      </Field>
      <Field label="Drop Date :" labelClassName="w-[64px]" className="lg:col-span-3">
        <div className="w-[140px] shrink-0">
          <AppDatePicker
            id="dtpDropDate"
            label="Drop Date"
            value={form.dropDate}
            onChange={(v) => set("dropDate", v)}
          />
        </div>
      </Field>
      <Field
        label="Additional Service :"
        labelClassName={LR1}
        className="sm:col-span-2 lg:col-span-6"
      >
        <ReadOnlyBox id="txtAdditionalService" value="" />
      </Field>
    </div>
  </GroupBox>
);

/* 3b. Group 2 : supplier, payment and amounts ----------------------------
   left half = 6 columns, right half = 2 x 3 columns                      */
const SA = "w-[116px]"; // Supplier, Sup. Inv. No., Confirmation No., Supplier Excl. VAT
const SB = "w-[110px]"; // Sup. Payment, Supplier Name, Currency, Sup. VAT
const SC = "w-[132px]"; // Supplier Amt. (FC), Supplier Amt.

const CarSupplierGroup: React.FC<PartProps & { supplierAmt: number }> = ({
  form,
  set,
  supplierAmt,
}) => {
  const supplierName =
    supplierNameOptions.find((o) => o.value === form.supplier)?.label ?? "";

  return (
    <GroupBox>
      <div className={groupGrid}>
        {/* row 1 : Supplier | Sup. Payment */}
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

        {/* row 2 : Sup. Inv. No. + Date | Supplier Name */}
        <div className="flex min-w-0 items-center gap-3 sm:col-span-2 lg:col-span-6">
          <Field
            label="Sup. Inv. No. :"
            labelClassName={SA}
            className="min-w-0 flex-1"
          >
            <ReadOnlyBox id="txtSuppInvNo" value="" />
          </Field>
          <Field label="Sup. Inv. Date :" className="min-w-0 flex-1">
            <div className="w-[140px] shrink-0">
              <AppDatePicker
                id="dtpSuppInvDate"
                label="Sup. Inv. Date"
                value={form.suppInvDate}
                onChange={(v) => set("suppInvDate", v)}
                disabled
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

        {/* row 3 : Confirmation No. | Currency | Supplier Amt. (FC) */}
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

        {/* row 4 : Supplier Excl. VAT | Sup. VAT | Supplier Amt. */}
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
        <Field
          label="Supplier Amt. :"
          labelClassName={SC}
          className="lg:col-span-3"
        >
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

/* 3c. Group 3 : customers table (MF column and MF total removed) --------- */
const CarCustomersGroup: React.FC<{
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
      id: "type",
      header: "Type",
      width: "w-[64px]",
      render: (row) => (
        <TextCell
          label="Type"
          value={row.type}
          onFocus={() => onActivate(row.key)}
          onChange={(v) => onChange(row.key, { type: v })}
        />
      ),
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

/* 3d. Button bar --------------------------------------------------------- */
const CarActions: React.FC<{
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
type CarRentalDeatailPageProps = {
  title?: string;
  onClose?: () => void;
};

const CarRentalDeatailPage: React.FC<CarRentalDeatailPageProps> = ({
  title = "Other Service Sales",
  onClose,
}) => {
  const [form, setForm] = useState<FormState>(initialForm);
  const [customers, setCustomers] = useState<CustomerRow[]>(() =>
    padCustomers([]),
  );
  const [customerKey, setCustomerKey] = useState<number | null>(null);
  const [error, setError] = useState("");

  const set: SetField = (key, value) => {
    setError("");
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const updateCustomer = (key: number, patch: Partial<CustomerRow>) =>
    setCustomers((prev) =>
      padCustomers(
        prev.map((row) => (row.key === key ? { ...row, ...patch } : row)),
      ),
    );

  /* Supplier Amt. is calculated from your rules; 0.00 until then. */
  const supplierAmt = 0;

  const handleFind = () => console.log("find entry", form.entryNo);

  const reset = () => {
    setForm(initialForm());
    setCustomers(padCustomers([]));
    setCustomerKey(null);
    setError("");
  };

  const handleSave = () => {
    if (!form.pickPoint.trim() || !form.dropPoint.trim()) {
      setError("Enter the pick point and the drop point.");
      return;
    }
    setError("");
    console.log({
      ...form,
      customers: customers
        .filter((c) => !isEmptyCustomer(c))
        .map((c) => ({
          customerId: c.customerId,
          type: c.type,
          division: c.division,
          suppAmt: toNumber(c.suppAmt),
          cdAmt: toNumber(c.cdAmt),
          sChg: toNumber(c.sChg),
          sChgV: toNumber(c.sChgV),
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
        <main className="w-full overflow-hidden border border-gray-400 bg-white">
          <Header Name={title}/>

          <section className="flex flex-col gap-3 px-3.5 pb-6 pt-3">
            {/* group 1 */}
            <CarHeaderGroup form={form} set={set} onFind={handleFind} />

            {/* group 2 */}
            <CarSupplierGroup
              form={form}
              set={set}
              supplierAmt={supplierAmt}
            />

            {/* group 3 */}
            {/* <CarCustomersGroup
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

            <CarActions
              onSave={handleSave}
              onCancel={reset}
              onClose={handleClose}
            /> */}
          </section>
           <TicketLinesPage
             actionVariant={
               title === "Other Service Sales" ? "otherService" : "ticket"
             }
           />
        </main>
      </div>
    </div>
  );
};

export default CarRentalDeatailPage;