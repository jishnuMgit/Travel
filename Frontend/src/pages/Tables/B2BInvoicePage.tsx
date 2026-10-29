import React, { useState } from "react";
import Select from "react-select";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";

dayjs.extend(customParseFormat);

/* =====================================================================
   FILE MAP
   1. Types, constants and sample data
   2. Shared building blocks (Field, Combo, PairCombo, cells, ScrollGrid)
   3. Parts : FilterBar (branch, customer, period ... right-hand panels),
              TransactionsGroup (select-all + grid + totals),
              BottomBar (note, hide service charge, ZATCA / Customer, buttons)
   4. B2BInvoicePage : owns the state and renders the parts
   ===================================================================== */

/* ---------------------------------------------------------------------
   1. TYPES, CONSTANTS AND SAMPLE DATA
   --------------------------------------------------------------------- */
type Option = { value: string; label: string };

const DATE_FORMAT = "DD-MM-YYYY";
const FIRST_OF_MONTH = dayjs().startOf("month").format(DATE_FORMAT);
const TODAY = dayjs().format(DATE_FORMAT);

const toOptions = (values: string[]): Option[] =>
  values.map((v) => ({ value: v, label: v }));

/* Replace these with data from your API */
const branchOptions = toOptions(["JEDDAH", "RIYADH"]);
const customerIdOptions: Option[] = [
  { value: "C001", label: "C001" },
  { value: "C002", label: "C002" },
];
const customerNameOptions: Option[] = [
  { value: "C001", label: "Customer One" },
  { value: "C002", label: "Customer Two" },
];
const diOptions = toOptions(["B", "D", "I"]);
const divisionOptions = toOptions(["DIV 1", "DIV 2"]);
const invoicingMethodOptions = toOptions(["PER TICKET", "CONSOLIDATED"]);

type TxnRow = {
  key: number;
  placeholder?: boolean; // empty filler row
  selected: boolean;
  doc: string;
  slNo: string;
  ticketNo: string;
  di: string;
  date: string;
  flightDate: string;
  pax: string;
  route: string;
  confNo: string;
  cl: string;
  staff: string;
  service: string;
  fare: number;
  tax: number;
  k7: number;
  supAmt: number;
  cdAmt: string; // editable
  sChg: string; // editable
  vatAmt: number;
  mf: string; // editable
  invAmt: string; // editable
  refNo: string;
};

type EditableMoney = "cdAmt" | "sChg" | "mf" | "invAmt";
type EditableText = "ticketNo" | "route" | "confNo" | "staff" | "service";

const MIN_ROWS = 12;
let keyCounter = 0;
const nextKey = () => ++keyCounter;

const placeholderRow = (): TxnRow => ({
  key: -nextKey(),
  placeholder: true,
  selected: false,
  doc: "",
  slNo: "",
  ticketNo: "",
  di: "",
  date: "",
  flightDate: "",
  pax: "",
  route: "",
  confNo: "",
  cl: "",
  staff: "",
  service: "",
  fare: 0,
  tax: 0,
  k7: 0,
  supAmt: 0,
  cdAmt: "",
  sChg: "",
  vatAmt: 0,
  mf: "",
  invAmt: "",
  refNo: "",
});

/* Sample transactions returned by Search. Replace with an API call that
   uses the branch, customer, period, D/I, division and category filters. */
const loadTransactions = (): TxnRow[] => {
  const base = [
    ["INV", "1", "1572201234567", "D", "SMITH/JOHN MR", "JED-RUH", "ABC123", "ST1", "TKT", 450, 90, 10, 380],
    ["INV", "2", "1572201234568", "I", "KHAN/ALI MR", "JED-DXB", "DEF456", "ST2", "TKT", 1250, 210, 25, 1100],
    ["INV", "3", "1572201234569", "D", "ALI/SARA MRS", "RUH-JED", "GHI789", "ST1", "EMD", 300, 45, 5, 250],
  ] as const;
  return base.map((r, index) => ({
    key: nextKey(),
    selected: false,
    doc: r[0],
    slNo: r[1],
    ticketNo: r[2],
    di: r[3],
    date: TODAY,
    flightDate: TODAY,
    pax: r[4],
    route: r[5],
    confNo: r[6],
    cl: "Y",
    staff: r[7],
    service: r[8],
    fare: r[9],
    tax: r[10],
    k7: r[11],
    supAmt: r[12],
    cdAmt: "",
    sChg: "",
    vatAmt: 0,
    mf: "",
    invAmt: "",
    refNo: `REF${index + 1}`,
  }));
};

type FormState = {
  branch: string | null;
  customer: string | null;
  fromDate: string;
  toDate: string;
  invoiceDate: string;
  di: string | null;
  division: string | null;
  invoicingMethod: string | null;
  manualInvoice: boolean;
  manualInvoiceNo: string;
  txnMode: string; // Selected Transactions / All Transactions
  categoryMode: string; // Travel / Tourism / All
  note: string;
  hideDomServiceCharge: boolean;
  invoiceFor: string; // ZATCA / Customer
};

type SetField = <K extends keyof FormState>(
  key: K,
  value: FormState[K],
) => void;

const initialForm = (): FormState => ({
  branch: "JEDDAH",
  customer: null,
  fromDate: FIRST_OF_MONTH,
  toDate: TODAY,
  invoiceDate: TODAY,
  di: "B",
  division: null,
  invoicingMethod: null,
  manualInvoice: false,
  manualInvoiceNo: "",
  txnMode: "All Transactions",
  categoryMode: "All",
  note: "",
  hideDomServiceCharge: true,
  invoiceFor: "ZATCA",
});

const toNumber = (value: string) => {
  const parsed = parseFloat(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const formatNumber = (value: number) =>
  value.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

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
  "h-[30px] w-full min-w-0 rounded-[4px] border border-[#cfd7df] bg-white px-2 text-[12px] text-[#24364d] outline-none focus:border-[#91a7b9] disabled:bg-[#eef1f4]";

/** label + controls on one line */
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
  idWidth = "w-[100px]",
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
      className="flex-1"
    />
  </>
);

const CustomRadio: React.FC<{
  name: string;
  value: string;
  label: string;
  checked: boolean;
  onChange: () => void;
}> = ({ name, value, label, checked, onChange }) => (
  <label className="flex cursor-pointer items-center gap-2.5 whitespace-nowrap select-none">
    <input
      type="radio"
      name={name}
      value={value}
      checked={checked}
      onChange={onChange}
      className="sr-only"
    />
    <span
      className={`flex h-[19px] w-[19px] shrink-0 items-center justify-center rounded-full border bg-white ${
        checked ? "border-[#64d96e]" : "border-[#cbd3dc]"
      }`}
    >
      <span
        className={`h-2.5 w-2.5 rounded-full bg-[#64d96e] ${
          checked ? "opacity-100" : "opacity-0"
        }`}
      />
    </span>
    <span className="text-[12px] font-normal text-[#35445a]">{label}</span>
  </label>
);

/** a radio panel built from a list of choices */
const PanelGroup: React.FC<{
  name: string;
  options: string[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
}> = ({ name, options, value, onChange, className = "" }) => (
  <div className={`border border-[#e0e5ea] bg-white px-3.5 py-3 ${className}`}>
    <div className="flex flex-col gap-3">
      {options.map((option) => (
        <CustomRadio
          key={option}
          name={name}
          value={option}
          label={option}
          checked={value === option}
          onChange={() => onChange(option)}
        />
      ))}
    </div>
  </div>
);

/** checkbox in its own box */
const CheckBox: React.FC<{
  id: string;
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  className?: string;
}> = ({ id, label, checked, onChange, className = "" }) => (
  <label
    htmlFor={id}
    className={`flex h-[30px] cursor-pointer items-center gap-2 border border-[#e0e5ea] bg-white px-2.5 text-[12px] text-[#405066] select-none ${className}`}
  >
    <input
      id={id}
      type="checkbox"
      checked={checked}
      onChange={(event) => onChange(event.target.checked)}
      className="h-4 w-4 accent-[#64d96e]"
    />
    {label}
  </label>
);

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
          height: "30px",
          minHeight: "30px",
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
        "& .Mui-disabled": { WebkitTextFillColor: "#24364d" },
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
  "h-[30px] border border-[#B7ECD0] bg-[#EEFBF4] px-2 font-normal text-[#405066]";

const gridTableClass =
  "w-full table-fixed border-collapse text-[12px] text-[#24364d]";

const GREY = "bg-[#eef1f4] px-2"; // read-only cell

function ScrollGrid<R>({
  columns,
  rows,
  getKey,
  activeKey,
  onActivate,
  totals,
  rowsHeightClass = "h-[310px]",
  minWidthClass = "min-w-[2100px]",
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
                      value={formatNumber(totals[c.id] ?? 0)}
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
   3. PARTS
   --------------------------------------------------------------------- */

/* 3a. Filter bar -------------------------------------------------------
   left   : Branch, Customer, Period + Invoice Date
   middle : D/I, Division + Invoicing Method, Search, Selected/All panel
   right  : Manual Invoice No. box and the Travel / Tourism / All panel   */
const FL = "w-[72px]"; // label width in the left block

const FilterBar: React.FC<{
  form: FormState;
  set: SetField;
  invoiceEnabled: boolean;
  onSearch: () => void;
}> = ({ form, set, invoiceEnabled, onSearch }) => (
  <div className="flex flex-wrap gap-x-5 gap-y-3 max-[900px]:flex-col">
    {/* left */}
    <div className="flex min-w-0 flex-1 basis-[420px] flex-col gap-2.5 ">
      <Field label="Branch :" labelClassName={FL}>
        <Combo
          id="lkpBranch"
          options={branchOptions}
          value={form.branch}
          onChange={(v) => set("branch", v)}
          className="w-[220px] max-w-full"
        />
      </Field>
      <Field label="Customer :" labelClassName={FL}>
        <PairCombo
          idId="lkpCustomerID"
          nameId="lkpCustomerName"
          idOptions={customerIdOptions}
          nameOptions={customerNameOptions}
          value={form.customer}
          onChange={(v) => set("customer", v)}
        />
      </Field>
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2.5">
        <Field label="Period :" labelClassName={FL}>
          <div className="w-[130px]">
            <AppDatePicker
              id="dtpFromDate"
              label="From Date"
              value={form.fromDate}
              onChange={(v) => set("fromDate", v)}
            />
          </div>
          <div className="w-[130px]">
            <AppDatePicker
              id="dtpToDate"
              label="To Date"
              value={form.toDate}
              onChange={(v) => set("toDate", v)}
            />
          </div>
        </Field>
        <Field label="Invoice Date :">
          <div className="w-[130px]">
            <AppDatePicker
              id="dtpInvoiceDate"
              label="Invoice Date"
              value={form.invoiceDate}
              onChange={(v) => set("invoiceDate", v)}
              disabled={!invoiceEnabled}
            />
          </div>
        </Field>
      </div>
    </div>

    {/* middle */}
    <div className="flex min-w-0 flex-1 basis-[400px] flex-col justify-between gap-3">
      <div className="flex flex-col gap-2.5">
        <Field label="D/I :" labelClassName="w-[72px]">
          <Combo
            id="lkpDI"
            options={diOptions}
            value={form.di}
            onChange={(v) => set("di", v)}
            className="w-[70px] shrink-0"
          />
        </Field>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2.5">
          <Field label="Division :" labelClassName="w-[72px]">
            <Combo
              id="lkpDivision"
              options={divisionOptions}
              value={form.division}
              onChange={(v) => set("division", v)}
              className="w-[108px] shrink-0"
            />
          </Field>
          <Field label="Invoicing Method :" className="min-w-0 flex-1">
            <Combo
              id="lkpInvoicingMethod"
              options={invoicingMethodOptions}
              value={form.invoicingMethod}
              onChange={(v) => set("invoicingMethod", v)}
              disabled={!invoiceEnabled}
            />
          </Field>
        </div>
        <div className="pl-[80px]">
          <button
            id="btnSearch"
            type="button"
            onClick={onSearch}
            className="btn-style min-w-[68px]"
          >
            <u>S</u>earch
          </button>
        </div>
      </div>

    <div className=" absolute right-4 top-30">
          <PanelGroup
        name="rdgTxnMode"
        options={["Selected Transactions", "All Transactions"]}
        value={form.txnMode}
        onChange={(v) => set("txnMode", v)}
        className="w-[172px] self-end"
      />
    </div>
    </div>

    {/* right */}
    <div className="flex w-[152px] shrink-0 flex-col justify-between gap-3 max-[900px]:w-full">
      <div className="border border-[#e0e5ea] bg-white p-2.5">
        <input
          id="txtManualInvoiceNo"
          aria-label="Manual invoice number"
          value={form.manualInvoiceNo}
          disabled={!form.manualInvoice}
          onChange={(event) => set("manualInvoiceNo", event.target.value)}
          className={`${inputClass} mb-2.5`}
        />
        <label
          htmlFor="chkManualInvoice"
          className="flex cursor-pointer items-center gap-2 text-[12px] text-[#405066] select-none"
        >
          <input
            id="chkManualInvoice"
            type="checkbox"
            checked={form.manualInvoice}
            onChange={(event) => {
              set("manualInvoice", event.target.checked);
              if (!event.target.checked) set("manualInvoiceNo", "");
            }}
            className="h-4 w-4 accent-[#64d96e]"
          />
          Manual Invoice No.
        </label>
      </div>
     <div className="absolute right-50 top-23 ">
         <PanelGroup
        name="rdgCategory"
        options={["Travel", "Tourism", "All"]}
        value={form.categoryMode}
        onChange={(v) => set("categoryMode", v)}
      />
     </div>
    </div>
  </div>
);

/* 3b. Transactions group: select-all checkbox, grid and totals ----------- */
const TransactionsGroup: React.FC<{
  rows: TxnRow[];
  activeKey: number | null;
  onActivate: (key: number) => void;
  onToggleRow: (key: number) => void;
  onToggleAll: () => void;
  onText: (key: number, field: EditableText, value: string) => void;
  onMoney: (key: number, field: EditableMoney, value: string) => void;
}> = ({
  rows,
  activeKey,
  onActivate,
  onToggleRow,
  onToggleAll,
  onText,
  onMoney,
}) => {
  const real = rows.filter((r) => !r.placeholder);
  const allSelected = real.length > 0 && real.every((r) => r.selected);

  const display: TxnRow[] = [...rows];
  while (display.length < MIN_ROWS) display.push(placeholderRow());

  const textColumn = (
    id: EditableText,
    header: string,
    width?: string,
  ): GridColumn<TxnRow> => ({
    id,
    header,
    width,
    render: (row) =>
      row.placeholder ? null : (
        <TextCell
          label={header}
          value={row[id]}
          onFocus={() => onActivate(row.key)}
          onChange={(v) => onText(row.key, id, v)}
        />
      ),
  });

  const moneyColumn = (
    id: EditableMoney,
    header: string,
  ): GridColumn<TxnRow> => ({
    id,
    header,
    width: "w-[84px]",
    align: "right",
    total: { format: "money" },
    render: (row) =>
      row.placeholder ? null : (
        <MoneyCell
          label={header}
          value={row[id]}
          onFocus={() => onActivate(row.key)}
          onChange={(v) => onMoney(row.key, id, v)}
        />
      ),
  });

  const readOnlyMoney = (
    id: "fare" | "tax" | "k7" | "supAmt" | "vatAmt",
    header: string,
    width: string,
  ): GridColumn<TxnRow> => ({
    id,
    header,
    width,
    align: "right",
    cellClass: `${GREY} text-right`,
    total: { format: "money" },
    render: (row) => (row.placeholder ? "" : formatNumber(row[id])),
  });

  const readOnlyText = (
    id: "doc" | "slNo" | "di" | "date" | "flightDate" | "pax" | "cl" | "refNo",
    header: string,
    width?: string,
    align: "left" | "center" = "left",
  ): GridColumn<TxnRow> => ({
    id,
    header,
    width,
    align,
    cellClass: `${GREY} ${align === "center" ? "text-center" : ""}`,
    render: (row) => row[id],
  });

  const columns: GridColumn<TxnRow>[] = [
    {
      id: "select",
      header: "Select",
      width: "w-[56px]",
      align: "center",
      cellClass: "text-center",
      render: (row) => (
        <input
          type="checkbox"
          aria-label="Select transaction"
          disabled={row.placeholder}
          checked={row.selected}
          onChange={() => onToggleRow(row.key)}
          onClick={(event) => event.stopPropagation()}
          className="h-4 w-4 align-middle accent-[#64d96e]"
        />
      ),
    },
    readOnlyText("doc", "Doc.", "w-[64px]"),
    readOnlyText("slNo", "Sl. No", "w-[56px]"),
    textColumn("ticketNo", "Ticket No.", "w-[130px]"),
    readOnlyText("di", "D/I", "w-[50px]", "center"),
    readOnlyText("date", "Date", "w-[100px]"),
    readOnlyText("flightDate", "Flight Date", "w-[100px]"),
    readOnlyText("pax", "Pax"),
    textColumn("route", "Route", "w-[120px]"),
    textColumn("confNo", "Conf. No.", "w-[90px]"),
    readOnlyText("cl", "C/L", "w-[50px]", "center"),
    textColumn("staff", "Staff", "w-[70px]"),
    textColumn("service", "Service", "w-[70px]"),
    readOnlyMoney("fare", "Fare", "w-[84px]"),
    readOnlyMoney("tax", "Tax", "w-[84px]"),
    readOnlyMoney("k7", "K7", "w-[84px]"),
    readOnlyMoney("supAmt", "Sup. Amt.", "w-[90px]"),
    moneyColumn("cdAmt", "CD. Amt."),
    moneyColumn("sChg", "S. Chg."),
    readOnlyMoney("vatAmt", "VAT Amt.", "w-[84px]"),
    moneyColumn("mf", "MF"),
    {
      ...moneyColumn("invAmt", "Inv. Amt."),
      width: "w-[90px]",
    },
    readOnlyText("refNo", "Ref No.", "w-[110px]"),
  ];

  const sum = (pick: (r: TxnRow) => number) =>
    real.reduce((total, row) => total + pick(row), 0);

  const totals = {
    fare: sum((r) => r.fare),
    tax: sum((r) => r.tax),
    k7: sum((r) => r.k7),
    supAmt: sum((r) => r.supAmt),
    cdAmt: sum((r) => toNumber(r.cdAmt)),
    sChg: sum((r) => toNumber(r.sChg)),
    vatAmt: sum((r) => r.vatAmt),
    mf: sum((r) => toNumber(r.mf)),
    invAmt: sum((r) => toNumber(r.invAmt)),
  };

  return (
    <div className="flex flex-col gap-1.5 mt-10">
      <label
        htmlFor="chkSelectAll"
        className="flex w-fit cursor-pointer items-center gap-2 pl-[14px] text-[12px] text-[#405066] select-none"
      >
        <input
          id="chkSelectAll"
          type="checkbox"
          checked={allSelected}
          disabled={real.length === 0}
          onChange={onToggleAll}
          className="h-4 w-4 accent-[#64d96e]"
        />
        Select All
      </label>

      <ScrollGrid
        columns={columns}
        rows={display}
        getKey={(row) => row.key}
        activeKey={activeKey}
        onActivate={onActivate}
        totals={totals}
      />
    </div>
  );
};

/* 3c. Bottom bar: note, hide service charge, ZATCA / Customer, buttons -- */
const BottomBar: React.FC<{
  form: FormState;
  set: SetField;
  onPrint: () => void;
  onClose: () => void;
}> = ({ form, set, onPrint, onClose }) => (
  <div className="flex flex-wrap items-end gap-x-6 gap-y-3">
    <div className="flex min-w-0 flex-1 basis-[520px] flex-col gap-3">
      <Field label="Note :" htmlFor="txtNote" labelClassName="w-[72px]">
        <input
          id="txtNote"
          value={form.note}
          onChange={(event) => set("note", event.target.value)}
          className={inputClass}
        />
      </Field>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-1 justify-center gap-3">
          <button
            id="btnPrint"
            type="button"
            onClick={onPrint}
            className="btn-style"
          >
            <u>P</u>rint
          </button>
          <button
            id="btnClose"
            type="button"
            onClick={onClose}
            className="btn-style"
          >
            <u>C</u>lose
          </button>
        </div>
        <CheckBox
          id="chkHideDomServiceCharge"
          label="Hide Dom. Service Charge"
          checked={form.hideDomServiceCharge}
          onChange={(checked) => set("hideDomServiceCharge", checked)}
        />
      </div>
    </div>

    <PanelGroup
      name="rdgInvoiceFor"
      options={["ZATCA", "Customer"]}
      value={form.invoiceFor}
      onChange={(v) => set("invoiceFor", v)}
      className="w-[152px] shrink-0"
    />
  </div>
);

/* ---------------------------------------------------------------------
   4. MAIN PAGE : owns the state and renders the parts
   --------------------------------------------------------------------- */
type B2BInvoicePageProps = {
  title?: string;
  onClose?: () => void;
};

const B2BInvoicePage: React.FC<B2BInvoicePageProps> = ({
  title = "B2B Invoice",
  onClose,
}) => {
  const [form, setForm] = useState<FormState>(initialForm);
  const [rows, setRows] = useState<TxnRow[]>([]);
  const [activeKey, setActiveKey] = useState<number | null>(null);
  const [error, setError] = useState("");

  const set: SetField = (key, value) => {
    setError("");
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const anySelected = rows.some((r) => r.selected);

  const updateRow = (key: number, patch: Partial<TxnRow>) =>
    setRows((prev) =>
      prev.map((row) => (row.key === key ? { ...row, ...patch } : row)),
    );

  const handleSearch = () => {
    if (!form.branch || !form.fromDate || !form.toDate) {
      setError("Select the branch and the period.");
      return;
    }
    setError("");
    // replace with an API call that uses the filters
    const found = loadTransactions();
    setRows(found);
    setActiveKey(found[0]?.key ?? null);
  };

  const handleToggleAll = () => {
    const allSelected = rows.length > 0 && rows.every((r) => r.selected);
    setRows((prev) => prev.map((row) => ({ ...row, selected: !allSelected })));
  };

  const handlePrint = () => {
    const chosen =
      form.txnMode === "Selected Transactions"
        ? rows.filter((r) => r.selected)
        : rows;
    if (chosen.length === 0) {
      setError(
        form.txnMode === "Selected Transactions"
          ? "Select at least one transaction."
          : "Search for transactions first.",
      );
      return;
    }
    setError("");
    console.log({
      ...form,
      manualInvoiceNo: form.manualInvoice ? form.manualInvoiceNo : null,
      transactions: chosen.map((r) => ({
        ticketNo: r.ticketNo,
        route: r.route,
        confNo: r.confNo,
        staff: r.staff,
        service: r.service,
        cdAmt: toNumber(r.cdAmt),
        sChg: toNumber(r.sChg),
        mf: toNumber(r.mf),
        invAmt: toNumber(r.invAmt),
      })),
    });
  };

  const handleClose = () => {
    setForm(initialForm());
    setRows([]);
    setActiveKey(null);
    setError("");
    onClose?.();
  };

  return (
    <div className="flex min-h-screen w-full items-start justify-center bg-white px-4 py-4">
      <div className="min-h-fit w-full max-w-[1400px] bg-white p-0">
        <main className="w-full overflow-hidden border border-gray-400 bg-white">
          <header className="flex h-7.5 items-center justify-start bg-[#9fdfbc]">
            <h1 className="m-0 ml-3.5 text-[17px] font-semibold text-[#24364d]">
              {title}
            </h1>
          </header>

          <section className="flex flex-col gap-3 px-3.5 pb-6 pt-3 relative">
            <FilterBar
              form={form}
              set={set}
              invoiceEnabled={anySelected}
              onSearch={handleSearch}
            />

            <TransactionsGroup
              rows={rows}
              activeKey={activeKey}
              onActivate={setActiveKey}
              onToggleRow={(key) =>
                updateRow(key, {
                  selected: !rows.find((r) => r.key === key)?.selected,
                })
              }
              onToggleAll={handleToggleAll}
              onText={(key, field, value) => updateRow(key, { [field]: value })}
              onMoney={(key, field, value) => updateRow(key, { [field]: value })}
            />

            {error && (
              <p role="alert" className="m-0 text-[12px] text-[#c0392b]">
                {error}
              </p>
            )}

            <BottomBar
              form={form}
              set={set}
              onPrint={handlePrint}
              onClose={handleClose}
            />
          </section>
        </main>
      </div>
    </div>
  );
};

export default B2BInvoicePage;