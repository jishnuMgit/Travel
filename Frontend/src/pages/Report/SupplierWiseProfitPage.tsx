import { useState } from "react";
import Select from "react-select";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";
import Header from "../../components/comman/Header";

dayjs.extend(customParseFormat);

type Option = { value: string; label: string };

const DATE_FORMAT = "DD-MM-YYYY";
const FIRST_OF_MONTH = dayjs().startOf("month").format(DATE_FORMAT);
const TODAY = dayjs().format(DATE_FORMAT);

const branchOptions: Option[] = [
  { value: "JEDDAH", label: "JEDDAH" },
  { value: "RIYADH", label: "RIYADH" },
];
const supplierIdOptions: Option[] = [
  { value: "SUP001", label: "SUP001" },
  { value: "SUP002", label: "SUP002" },
];
const supplierNameOptions: Option[] = [
  { value: "SUP001", label: "Supplier One" },
  { value: "SUP002", label: "Supplier Two" },
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
  branchMode: string;
  branch: string | null;
  supplierMode: string;
  supplier: string | null;
  airlineMode: string;
  airline: string | null;
  fromDate: string;
  toDate: string;
  reportType: string;
  saleMode: string;
  invoiceMode: string;
  regionMode: string;
  orderBy: string;
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
  supplierMode: "One Supplier",
  supplier: null,
  airlineMode: "One Airline",
  airline: null,
  fromDate: FIRST_OF_MONTH,
  toDate: TODAY,
  reportType: "Summary",
  saleMode: "Net",
  invoiceMode: "All",
  regionMode: "All",
  orderBy: "Supplier ID",
  includeIncentive: false,
});

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
      value={options.find((option) => option.value === value) ?? null}
      onChange={(option) => onChange(option?.value ?? null)}
      isDisabled={disabled}
      {...selectProps}
    />
  </div>
);

const PairCombo: React.FC<{
  idId: string;
  nameId: string;
  idOptions: Option[];
  nameOptions: Option[];
  value: string | null;
  onChange: (value: string | null) => void;
  disabled?: boolean;
}> = ({ idId, nameId, idOptions, nameOptions, value, onChange, disabled }) => (
  <div className="flex min-w-0 items-center gap-2">
    <Combo
      id={idId}
      options={idOptions}
      value={value}
      onChange={onChange}
      disabled={disabled}
      className="w-[120px] shrink-0"
    />
    <Combo
      id={nameId}
      options={nameOptions}
      value={value}
      onChange={onChange}
      disabled={disabled}
      className="w-[450px] shrink-0"
    />
  </div>
);

const RadioGroup: React.FC<{
  name: string;
  options: string[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
}> = ({ name, options, value, onChange, className = "" }) => (
  <div className={`flex flex-col  gap-3 border border-[#e0e5ea] bg-white px-3.5 py-3 ${className}`}>
    {options.map((option) => {
      const checked = value === option;
      return (
        <label
          key={option}
          className="flex cursor-pointer items-center gap-2.5 whitespace-nowrap select-none"
        >
          <input
            type="radio"
            name={name}
            value={option}
            checked={checked}
            onChange={() => onChange(option)}
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
          <span className="text-[12px] font-normal text-[#35445a]">
            {option}
          </span>
        </label>
      );
    })}
  </div>
);

const DateField: React.FC<{
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
}> = ({ id, label, value, onChange }) => (
  <LocalizationProvider dateAdapter={AdapterDayjs}>
    <DatePicker
      value={value ? dayjs(value, DATE_FORMAT) : null}
      onChange={(newValue) =>
        onChange(newValue?.isValid() ? newValue.format(DATE_FORMAT) : "")
      }
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
      }}
    />
  </LocalizationProvider>
);

const LeftFilters: React.FC<PartProps> = ({ form, set }) => {
  const row = "grid grid-cols-[168px_1fr] items-start gap-x-4";
  return (
    <div className="flex flex-col gap-3">
      <div className={row}>
        <RadioGroup
          name="rdgBranch"
          options={["One Branch", "All Branch"]}
          value={form.branchMode}
          onChange={(value) => set("branchMode", value)}
        />
        {form.branchMode === "One Branch" && (
          <div className="w-[250px] max-w-full pt-3">
            <Combo
              id="lkpBranch"
              options={branchOptions}
              value={form.branch}
              onChange={(value) => set("branch", value)}
            />
          </div>
        )}
      </div>
      <div className={row}>
        <RadioGroup
          name="rdgSupplier"
          options={["One Supplier", "All Supplier"]}
          value={form.supplierMode}
          onChange={(value) => set("supplierMode", value)}
        />
        {form.supplierMode === "One Supplier" && (
          <div className="pt-3">
            <PairCombo
              idId="lkpSupplierID"
              nameId="lkpSupplierName"
              idOptions={supplierIdOptions}
              nameOptions={supplierNameOptions}
              value={form.supplier}
              onChange={(value) => set("supplier", value)}
            />
          </div>
        )}
      </div>
      <div className={row}>
        <RadioGroup
          name="rdgAirline"
          options={["One Airline", "All Airline"]}
          value={form.airlineMode}
          onChange={(value) => set("airlineMode", value)}
        />
        {form.airlineMode === "One Airline" && (
          <div className="pt-3">
            <PairCombo
              idId="lkpAirlineID"
              nameId="lkpAirlineName"
              idOptions={airlineIdOptions}
              nameOptions={airlineNameOptions}
              value={form.airline}
              onChange={(value) => set("airline", value)}
            />
          </div>
        )}
      </div>
      <div className={`${row} items-center`}>
        <div className="flex h-[30px] items-center justify-end border border-[#e0e5ea] bg-[#fafbfc] pr-3 text-[12px] text-[#405066]">
          Period :
        </div>
        <div className="flex items-start gap-2">
          <DateField
            id="dtpFromDate"
            label="From Date"
            value={form.fromDate}
            onChange={(value) => set("fromDate", value)}
          />
          <DateField
            id="dtpToDate"
            label="To Date"
            value={form.toDate}
            onChange={(value) => set("toDate", value)}
          />
        </div>
      </div>
    </div>
  );
};

const RightFilters: React.FC<PartProps> = ({ form, set }) => (
  <div className="grid w-[284px] shrink-0 grid-cols-2 content-between gap-3 max-[1064px]:w-full">
    <RadioGroup
      name="rdgSaleMode"
      options={["Sales", "Refund", "Net"]}
      value={form.saleMode}
      onChange={(value) => set("saleMode", value)}
    />
    <RadioGroup
      name="rdgInvoice"
      options={["Not-Invoiced", "Invoiced", "All"]}
      value={form.invoiceMode}
      onChange={(value) => set("invoiceMode", value)}
      className="!px-2.5"
    />
    <RadioGroup
      name="rdgRegion"
      options={["Domestic", "International", "All"]}
      value={form.regionMode}
      onChange={(value) => set("regionMode", value)}
      className="!px-2.5 mt-2.5 h-[110px] "
    />
    <fieldset className="min-w-0 border border-[#d5dce2] px-2.5 pb-2.5 pt-1">
      <legend className="mx-auto whitespace-nowrap px-1.5 text-[12px] text-[#405066]">
        Order By
      </legend>
      <RadioGroup
        name="rdgOrderBy"
        options={["Supplier ID", "Billing Amt", "Profit Amt.", "Profit %"]}
        value={form.orderBy}
        onChange={(value) => set("orderBy", value)}
        className="!border-0 !bg-transparent !px-1 !py-2"
      />
    </fieldset>
  </div>
);

const SupplierWiseProfitPage = () => {
  const [form, setForm] = useState<FormState>(initialForm);

  const set: SetField = (key, value) =>
    setForm((previous) => ({ ...previous, [key]: value }));

  const handlePrint = () => {
    console.log({
      ...form,
      branch: form.branchMode === "One Branch" ? form.branch : null,
      supplier: form.supplierMode === "One Supplier" ? form.supplier : null,
      airline: form.airlineMode === "One Airline" ? form.airline : null,
    });
  };

  const handleClose = () => setForm(initialForm());

  return (
    <div className="flex min-h-screen w-full items-start justify-center bg-white px-4 py-4">
      <div className="min-h-fit w-270 max-w-full bg-white p-0">
        <main className="w-full overflow-hidden border border-gray-400 bg-white relative">
          <Header Name="Supplier wise Profit" />
          <section className="px-3.5 pb-6 pt-3">
            <div className="flex gap-4 max-[1064px]:flex-col">
              <div className="flex min-w-0 flex-1 flex-col justify-between gap-3">
                <LeftFilters form={form} set={set} />
                <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-3">
                  <div className="flex flex-wrap items-end gap-x-4 gap-y-3">
                    <RadioGroup
                      name="rdgReportType"
                      options={["Detail", "Summary"]}
                      value={form.reportType}
                      onChange={(value) => set("reportType", value)}
                      className="w-[168px]"
                    />
                    <div className="flex gap-2">
                      <button
                        id="btnPrint"
                        type="button"
                        onClick={handlePrint}
                        className="btn-style"
                      >
                        <u>P</u>rint
                      </button>
                      <button
                        id="btnClose"
                        type="button"
                        onClick={handleClose}
                        className="btn-style"
                      >
                        <u>C</u>lose
                      </button>
                    </div>
                  </div>
                  <label
                    htmlFor="chkIncludeIncentive"
                    className="flex h-[30px] absolute right-40 bottom-6 cursor-pointer items-center gap-2 self-start border border-[#e0e5ea] bg-white px-2.5 text-[12px] text-[#405066] select-none"
                  >
                    <input
                      id="chkIncludeIncentive"
                      type="checkbox"
                      checked={form.includeIncentive}
                      onChange={(event) =>
                        set("includeIncentive", event.target.checked)
                      }
                      className="h-4 w-4 accent-[#64d96e]"
                    />
                    Include Incentive
                  </label>
                </div>
              </div>
              <RightFilters form={form} set={set} />
            </div>
          </section>
        </main>
      </div>
    </div>
  );
};

export default SupplierWiseProfitPage;
