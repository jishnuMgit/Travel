import React, { useState } from "react";
import Select from "react-select";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";
import Header from "../../components/comman/Header";

dayjs.extend(customParseFormat);

/* =====================================================================
   FILE MAP
   1. Types, constants and sample options
   2. Shared building blocks
   3. Parts : LeftFilters (branch, customer, airline, period), RightFilters
              (two columns of radio panels + the Order By box), BottomRow
              (Detail / Summary, buttons, Include Incentive)
   4. RptCustomerWiseProfitPage : owns the state and renders the parts
   ===================================================================== */

/* ---------------------------------------------------------------------
   1. TYPES, CONSTANTS AND SAMPLE OPTIONS
   --------------------------------------------------------------------- */
type Option = { value: string; label: string };

const DATE_FORMAT = "DD-MM-YYYY";
const FIRST_OF_MONTH = dayjs().startOf("month").format(DATE_FORMAT);
const TODAY = dayjs().format(DATE_FORMAT);

/* Replace these with data from your API */
const branchOptions: Option[] = [
  { value: "JEDDAH", label: "JEDDAH" },
  { value: "RIYADH", label: "RIYADH" },
];
const customerIdOptions: Option[] = [
  { value: "C001", label: "C001" },
  { value: "C002", label: "C002" },
];
const customerNameOptions: Option[] = [
  { value: "C001", label: "Customer One" },
  { value: "C002", label: "Customer Two" },
];
const airlineIdOptions: Option[] = [
  { value: "SV", label: "SV" },
  { value: "EK", label: "EK" },
];
const airlineNameOptions: Option[] = [
  { value: "SV", label: "SAUDIA" },
  { value: "EK", label: "EMIRATES" },
];

type FormState = {
  branchMode: string; // One Branch / All Branch
  branch: string | null;
  customerMode: string; // One Customer / All Customer
  customer: string | null;
  airlineMode: string; // One Airline / All Airline
  airline: string | null;
  fromDate: string;
  toDate: string;
  reportType: string; // Detail / Summary
  saleMode: string; // Sales / Refund / Net
  invoiceMode: string; // Not-Invoiced / Invoiced / All
  regionMode: string; // Domestic / International / All
  paymentMode: string; // Cash / Credit / All
  orderBy: string; // Customer ID / Billing Amt / Profit Amt. / Profit %
  categoryMode: string; // Travel / Tourism / All
  includeIncentive: boolean;
};

type SetField = <K extends keyof FormState>(
  key: K,
  value: FormState[K],
) => void;

type PartProps = { form: FormState; set: SetField };

const initialForm = (): FormState => ({
  branchMode: "One Branch",
  branch: "JEDDAH",
  customerMode: "One Customer",
  customer: null,
  airlineMode: "One Airline",
  airline: null,
  fromDate: FIRST_OF_MONTH,
  toDate: TODAY,
  reportType: "Summary",
  saleMode: "Net",
  invoiceMode: "All",
  regionMode: "All",
  paymentMode: "All",
  orderBy: "Customer ID",
  categoryMode: "All",
  includeIncentive: false,
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
    !min-h-[25px] !h-[30px] !rounded-[4px] !border !shadow-none !text-[13px]
    hover:!border-[#aab8c5]
    ${isDisabled ? "!bg-[#f6f8fa]" : "!bg-white"}
    ${isFocused ? "!border-[#91a7b9]" : "!border-[#cfd7df]"}
  `,
  valueContainer: () => "!h-[23px] !py-0 !px-[5px] !overflow-hidden",
  singleValue: () => "!m-0 !text-[13px] !text-[#24364d]",
  placeholder: () => "!m-0 !text-[13px] !text-[#7a8794]",
  input: () => "!m-0 !p-0 !text-[13px] !text-[#24364d]",
  indicatorsContainer: () => "!h-[23px]",
  dropdownIndicator: () => "!p-[3px] !text-[#657486]",
  indicatorSeparator: () => "!hidden",
  clearIndicator: () => "!p-[3px]",
  menu: () =>
    "!mt-[1px] !rounded-none !border !border-[#cfd7df] !z-[999999] !shadow-md",
  menuList: () => "!p-0 !max-h-[180px]",
  option: ({
    isFocused,
    isSelected,
  }: {
    isFocused: boolean;
    isSelected: boolean;
  }) => `
    !cursor-pointer !px-[6px] !py-[5px] !text-[13px] !text-[#24364d]
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
      className={`flex h-4.75 w-4.75 shrink-0 items-center justify-center rounded-full border bg-white ${
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

const FieldLabel: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="flex h-7.5 items-center justify-end border border-[#e0e5ea] bg-[#fafbfc] pr-3 text-[12px] text-[#405066]">
    {children}
  </div>
);

/** single react-select */
const Combo: React.FC<{
  id: string;
  options: Option[];
  value: string | null;
  onChange: (value: string | null) => void;
  disabled?: boolean;
  className?: string;
}> = ({
  id,
  options,
  value,
  onChange,
  disabled = false,
  className = "w-full",
}) => (
  <div className={`min-w-0 ${className}`}>
    <Select
      inputId={id}
      instanceId={id}
      options={options}
      value={options.find((o) => o.value === value) ?? null}
      onChange={(option) => onChange(option?.value ?? null)}
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
  disabled?: boolean;
}> = ({
  idId,
  nameId,
  idOptions,
  nameOptions,
  value,
  onChange,
  disabled = false,
}) => (
  <div className="flex min-w-0 items-center gap-2">
    <Combo
      id={idId}
      options={idOptions}
      value={value}
      onChange={onChange}
      disabled={disabled}
      className="w-30 shrink-0"
    />
    <Combo
      id={nameId}
      options={nameOptions}
      value={value}
      onChange={onChange}
      disabled={disabled}
      className="w-112.5 shrink-0"
    />
  </div>
);

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
        width: "140px",
        "& .MuiPickersTextField-root": { width: "120px" },
        "& .MuiPickersInputBase-root": {
          width: "140px",
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
          paddingLeft: "10px !important",
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
          width: "24px",
          height: "24px",
          padding: "2px",
          margin: 0,
        },
        "& .MuiSvgIcon-root": { fontSize: "16px" },
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
   3. PARTS
   --------------------------------------------------------------------- */
const filterRow = "grid grid-cols-[168px_1fr] items-start gap-x-4";

/* 3a. Left filters: branch, customer, airline, period */
const LeftFilters: React.FC<PartProps> = ({ form, set }) => (
  <div className="flex flex-col gap-3">
    {/* Branch */}
    <div className={filterRow}>
      <PanelGroup
        name="rdgBranch"
        options={["One Branch", "All Branch"]}
        value={form.branchMode}
        onChange={(v) => set("branchMode", v)}
      />
      <div className="w-62.5 max-w-full pt-3">
        <Combo
          id="lkpBranch"
          options={branchOptions}
          value={form.branch}
          onChange={(v) => set("branch", v)}
          disabled={form.branchMode !== "One Branch"}
        />
      </div>
    </div>

    {/* Customer */}
    <div className={filterRow}>
      <PanelGroup
        name="rdgCustomer"
        options={["One Customer", "All Customer"]}
        value={form.customerMode}
        onChange={(v) => set("customerMode", v)}
      />
      <div className="pt-3">
        <PairCombo
          idId="lkpCustomerID"
          nameId="lkpCustomerName"
          idOptions={customerIdOptions}
          nameOptions={customerNameOptions}
          value={form.customer}
          onChange={(v) => set("customer", v)}
          disabled={form.customerMode !== "One Customer"}
        />
      </div>
    </div>

    {/* Airline */}
    <div className={filterRow}>
      <PanelGroup
        name="rdgAirline"
        options={["One Airline", "All Airline"]}
        value={form.airlineMode}
        onChange={(v) => set("airlineMode", v)}
      />
      <div className="pt-3">
        <PairCombo
          idId="lkpAirlineID"
          nameId="lkpAirlineName"
          idOptions={airlineIdOptions}
          nameOptions={airlineNameOptions}
          value={form.airline}
          onChange={(v) => set("airline", v)}
          disabled={form.airlineMode !== "One Airline"}
        />
      </div>
    </div>

    {/* Period */}
    <div className={`${filterRow} items-center`}>
      <FieldLabel>Period :</FieldLabel>
      <div className="flex items-start gap-2">
        <AppDatePicker
          id="dtpFromDate"
          label="From Date"
          value={form.fromDate}
          onChange={(v) => set("fromDate", v)}
        />
        <AppDatePicker
          id="dtpToDate"
          label="To Date"
          value={form.toDate}
          onChange={(v) => set("toDate", v)}
        />
      </div>
    </div>
  </div>
);

/* 3b. Right side: two columns of panels.
     row 1 : Sales / Refund / Net        | Not-Invoiced / Invoiced / All
     row 2 : Domestic / International    | Cash / Credit / All
     row 3 : Order By box                | Travel / Tourism / All (bottom)   */
const RightFilters: React.FC<PartProps> = ({ form, set }) => (
  <div className="grid w-59 shrink-0 grid-cols-2 content-between gap-3 max-[700px]:w-full">
    <PanelGroup
      name="rdgSaleMode"
      options={["Sales", "Refund", "Net"]}
      value={form.saleMode}
      onChange={(v) => set("saleMode", v)}
    />
    <PanelGroup
      name="rdgInvoice"
      options={["Not-Invoiced", "Invoiced", "All"]}
      value={form.invoiceMode}
      onChange={(v) => set("invoiceMode", v)}
    />

    <PanelGroup
      name="rdgRegion"
      options={["Domestic", "International", "All"]}
      value={form.regionMode}
      onChange={(v) => set("regionMode", v)}
    />
    <PanelGroup
      name="rdgPayment"
      options={["Cash", "Credit", "All"]}
      value={form.paymentMode}
      onChange={(v) => set("paymentMode", v)}
    />

    {/* Order By: a titled box around its own radio panel */}
    <div className="relative border border-[#d5dce2] px-2 pb-2 pt-3.5">
      <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-white px-1.5 text-[12px] text-[#405066]">
        Order By
      </span>
      <PanelGroup
        name="rdgOrderBy"
        options={["Customer ID", "Billing Amt", "Profit Amt.", "Profit %"]}
        value={form.orderBy}
        onChange={(v) => set("orderBy", v)}
        className="px-2.5"
      />
    </div>
    <PanelGroup
      name="rdgCategory"
      options={["Travel", "Tourism", "All"]}
      value={form.categoryMode}
      onChange={(v) => set("categoryMode", v)}
      className="self-end"
    />
  </div>
);

/* 3c. Bottom row: Detail / Summary, buttons, Include Incentive */
const BottomRow: React.FC<
  PartProps & { onPrint: () => void; onClose: () => void }
> = ({ form, set, onPrint, onClose }) => (
  <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-3">
    <div className="flex flex-wrap items-end gap-x-4 gap-y-3">
      <PanelGroup
        name="rdgReportType"
        options={["Detail", "Summary"]}
        value={form.reportType}
        onChange={(v) => set("reportType", v)}
        className="w-42"
      />
      <div className="flex gap-2">
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
    </div>

    <label
      htmlFor="chkIncludeIncentive"
      className="flex h-7.5 cursor-pointer items-center gap-2 self-start border border-[#e0e5ea] bg-white px-2.5 text-[12px] text-[#405066] select-none"
    >
      <input
        id="chkIncludeIncentive"
        type="checkbox"
        checked={form.includeIncentive}
        onChange={(event) => set("includeIncentive", event.target.checked)}
        className="h-4 w-4 accent-[#64d96e]"
      />
      Include Incentive
    </label>
  </div>
);

/* ---------------------------------------------------------------------
   4. MAIN PAGE : owns the state and renders the parts
   --------------------------------------------------------------------- */
type RptCustomerWiseProfitPageProps = {
  onClose?: () => void;
};

const RptCustomerWiseProfitPage: React.FC<RptCustomerWiseProfitPageProps> = ({
  onClose,
}) => {
  const [form, setForm] = useState<FormState>(initialForm);

  const set: SetField = (key, value) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handlePrint = () => {
    // only the lookups that belong to a "One ..." choice are sent
    console.log({
      ...form,
      branch: form.branchMode === "One Branch" ? form.branch : null,
      customer: form.customerMode === "One Customer" ? form.customer : null,
      airline: form.airlineMode === "One Airline" ? form.airline : null,
    });
  };

  const handleClose = () => {
    setForm(initialForm());
    onClose?.();
  };

  return (
    <div className="flex min-h-screen w-full items-start justify-center bg-white px-4 py-4">
      <div className="min-h-fit w-260 max-w-full bg-white p-0">
        <main className="w-full overflow-hidden border border-[#d5dce2] bg-white">
         <Header Name="Customer wise Profit"/>

          <section className="px-3.5 pb-6 pt-3">
            <div className="flex gap-4 max-[700px]:flex-col">
              {/* left side: filters and the bottom row */}
              <div className="flex min-w-0 flex-1 flex-col justify-between gap-3">
                <LeftFilters form={form} set={set} />
                <BottomRow
                  form={form}
                  set={set}
                  onPrint={handlePrint}
                  onClose={handleClose}
                />
              </div>

              {/* right side: radio panels and the Order By box */}
              <RightFilters form={form} set={set} />
            </div>
          </section>
        </main>
      </div>
    </div>
  );
};

export default RptCustomerWiseProfitPage;