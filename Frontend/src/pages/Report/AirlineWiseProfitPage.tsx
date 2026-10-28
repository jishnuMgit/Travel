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
type FormState = {
  branchMode: string;
  branch: string | null;
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

const DATE_FORMAT = "DD/MM/YYYY";
const branchOptions: Option[] = [
  { value: "JEDDAH", label: "JEDDAH" },
  { value: "RIYADH", label: "RIYADH" },
];
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

const initialForm = (): FormState => ({
  branchMode: "One Branch",
  branch: "JEDDAH",
  airlineMode: "One Airline",
  airline: null,
  fromDate: dayjs().startOf("month").format(DATE_FORMAT),
  toDate: dayjs().format(DATE_FORMAT),
  reportType: "Summary",
  saleMode: "Net",
  invoiceMode: "All",
  regionMode: "All",
  orderBy: "Airline No.",
  includeIncentive: false,
});

type SetField = <K extends keyof FormState>(
  key: K,
  value: FormState[K],
) => void;
type PartProps = { form: FormState; set: SetField };

const selectClassNames = {
  control: ({
    isFocused,
    isDisabled,
  }: {
    isFocused: boolean;
    isDisabled: boolean;
  }) =>
    `!h-[30px] !min-h-[30px] !rounded-[4px] !border !text-[13px] !shadow-none ${
      isDisabled ? "!bg-[#f6f8fa]" : "!bg-white"
    } ${isFocused ? "!border-[#91a7b9]" : "!border-[#cfd7df]"}`,
  valueContainer: () => "!px-[6px] !py-0",
  singleValue: () => "!m-0 !text-[13px] !text-[#24364d]",
  indicatorsContainer: () => "!h-[28px]",
  dropdownIndicator: () => "!p-[3px] !text-[#657486]",
  indicatorSeparator: () => "!hidden",
  menu: () => "!z-[999999] !mt-[1px] !rounded-none !border !border-[#cfd7df]",
  menuList: () => "!p-0 !max-h-[180px]",
  option: ({
    isFocused,
    isSelected,
  }: {
    isFocused: boolean;
    isSelected: boolean;
  }) =>
    `!px-2 !py-1 !text-[13px] !text-[#24364d] ${
      isSelected ? "!bg-[#e7f7ed]" : isFocused ? "!bg-[#f2faf5]" : "!bg-white"
    }`,
};

const Combo: React.FC<{
  id: string;
  options: Option[];
  value: string | null;
  onChange: (value: string | null) => void;
  className?: string;
}> = ({ id, options, value, onChange, className = "" }) => (
  <div className={`min-w-0 ${className}`}>
    <Select
      inputId={id}
      instanceId={id}
      options={options}
      value={options.find((option) => option.value === value) ?? null}
      onChange={(option) => onChange(option?.value ?? null)}
      isSearchable={false}
      isClearable={false}
      classNames={selectClassNames}
      menuPosition="fixed"
      menuPortalTarget={typeof document === "undefined" ? undefined : document.body}
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
  <div
    className={`flex flex-col gap-2.5 border border-[#d5dce2] bg-white px-3 py-2.5 ${className}`}
  >
    {options.map((option) => {
      const checked = value === option;
      return (
        <label
          key={option}
          className="flex cursor-pointer items-center gap-2 whitespace-nowrap select-none"
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
            className={`flex h-[15px] w-[15px] shrink-0 items-center justify-center rounded-full border ${
              checked ? "border-[#64d96e]" : "border-[#cbd3dc]"
            }`}
          >
            <span
              className={`h-2 w-2 rounded-full bg-[#64d96e] ${
                checked ? "opacity-100" : "opacity-0"
              }`}
            />
          </span>
          <span className="text-[12px] text-[#35445a]">{option}</span>
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
      onChange={(date) =>
        onChange(date?.isValid() ? date.format(DATE_FORMAT) : "")
      }
      format={DATE_FORMAT}
      slotProps={{
        textField: { id, slotProps: { htmlInput: { "aria-label": label } } },
        openPickerButton: { sx: { padding: "2px", margin: 0 } },
        inputAdornment: { sx: { margin: 0, padding: 0 } },
      }}
      sx={{
        width: "140px",
        "& .MuiPickersInputBase-root": {
          width: "140px",
          height: "30px",
          minHeight: "30px",
          boxSizing: "border-box",
          borderRadius: "4px",
          backgroundColor: "#fff",
          fontSize: "12px",
          padding: 0,
          overflow: "hidden",
        },
        "& .MuiPickersInputBase-sectionsContainer": {
          paddingLeft: "8px !important",
          paddingRight: "0 !important",
          overflow: "hidden",
        },
        "& .MuiPickersInputBase-sectionContent": {
          fontSize: "12px",
          color: "#344054",
        },
        "& .MuiIconButton-root": { width: "24px", height: "24px", padding: "2px" },
        "& .MuiSvgIcon-root": { fontSize: "16px" },
        "& .MuiPickersOutlinedInput-notchedOutline": {
          borderColor: "#B7C7D7 !important",
        },
        "& .MuiPickersInputBase-root.Mui-focused .MuiPickersOutlinedInput-notchedOutline":
          { borderColor: "#B7C7D7 !important", borderWidth: "1px" },
      }}
    />
  </LocalizationProvider>
);

const LeftFilters: React.FC<PartProps> = ({ form, set }) => (
  <div className="flex min-w-0 flex-col gap-3">
    <div className="grid grid-cols-[125px_minmax(0,220px)] items-center gap-4 max-[560px]:grid-cols-1">
      <RadioGroup
        name="branchMode"
        options={["One Branch", "All Branch"]}
        value={form.branchMode}
        onChange={(value) => set("branchMode", value)}
      />
      {form.branchMode === "One Branch" && (
       <div className="-mt-7">
         <Combo
          id="lkpBranch"
          options={branchOptions}
          value={form.branch}
          onChange={(value) => set("branch", value)}
        />
       </div>
      )}
    </div>
    <div className="grid grid-cols-[125px_minmax(0,1fr)] items-center gap-4 max-[560px]:grid-cols-1">
      <RadioGroup
        name="airlineMode"
        options={["One Airline", "All Airline"]}
        value={form.airlineMode}
        onChange={(value) => set("airlineMode", value)}
      />
      {form.airlineMode === "One Airline" && (
        <div className="grid w-[355px] max-w-full min-w-0 grid-cols-[minmax(65px,85px)_minmax(0,1fr)] gap-1.5 -mt-7">
          <Combo
            id="lkpAirlineID"
            options={airlineIdOptions}
            value={form.airline}
            onChange={(value) => set("airline", value)}
          />
          <Combo
            id="lkpAirlineName"
            options={airlineNameOptions}
            value={form.airline}
            onChange={(value) => set("airline", value)}
          />
        </div>
      )}
    </div>
    <div className="grid grid-cols-[125px_minmax(0,1fr)] items-center gap-4 max-[560px]:grid-cols-1">
      <div className="flex h-[30px] items-center justify-end border border-[#d5dce2] bg-[#fafbfc] px-2 text-[12px] text-[#405066]">
        Period :
      </div>
      <div className="flex flex-wrap items-center gap-2">
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

const RightFilters: React.FC<PartProps> = ({ form, set }) => (
  <div className="grid min-w-0 grid-cols-2 items-start gap-3">
    <RadioGroup
      name="saleMode"
      options={["Sales", "Refund", "Net"]}
      value={form.saleMode}
      onChange={(value) => set("saleMode", value)}
    />
    <RadioGroup
      name="invoiceMode"
      options={["Not-Invoiced", "Invoiced", "All"]}
      value={form.invoiceMode}
      onChange={(value) => set("invoiceMode", value)}
      className="px-2"
    />
    <label
      htmlFor="chkIncludeIncentive"
      className="col-start-1 flex h-[30px] cursor-pointer items-center gap-2 border border-[#d5dce2] bg-white px-2.5 text-[12px] text-[#405066] select-none"
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
    <RadioGroup
      name="regionMode"
      options={["Domestic", "International", "All"]}
      value={form.regionMode}
      onChange={(value) => set("regionMode", value)}
      className="col-start-1 px-2 -mt-25"
    />
    <fieldset className="col-start-2 row-start-2 -mt-2 min-w-0 border border-[#d5dce2] px-2 pb-2 pt-0.5">
      <legend className="mx-auto whitespace-nowrap px-1.5 text-[12px] text-[#405066]">
        Order By
      </legend>
      <RadioGroup
        name="orderBy"
        options={["Airline No.", "Billing Amt.", "Profit Amt.", "Profit %"]}
        value={form.orderBy}
        onChange={(value) => set("orderBy", value)}
        className="!gap-2 !border-0 !bg-transparent !px-1 !py-1.5"
      />
    </fieldset>
  </div>
);

const AirlineWiseProfitPage = () => {
  const [form, setForm] = useState<FormState>(initialForm);
  const set: SetField = (key, value) =>
    setForm((previous) => ({ ...previous, [key]: value }));

  const handlePrint = () => {
    console.log({
      ...form,
      branch: form.branchMode === "One Branch" ? form.branch : null,
      airline: form.airlineMode === "One Airline" ? form.airline : null,
    });
  };

  return (
    <div className="flex min-h-screen w-full items-start justify-center bg-white px-4 py-4">
      <div className="min-h-fit w-230 max-w-full bg-white">
        <main className="relative w-full overflow-hidden border border-gray-400 bg-white">
          <Header Name="Airline wise Profit" />
          <section className="px-3.5 pb-5 pt-3">
            <div className="grid grid-cols-[minmax(0,1fr)_minmax(250px,0.8fr)] items-start gap-5 max-[900px]:grid-cols-1">
              <div className="flex min-w-0 flex-col justify-between gap-10">
                <LeftFilters form={form} set={set} />
                <div className="flex flex-wrap items-end gap-3">
                  <RadioGroup
                    name="reportType"
                    options={["Detail", "Summary"]}
                    value={form.reportType}
                    onChange={(value) => set("reportType", value)}
                    className="w-[125px]"
                  />
                  <div className="flex gap-2 ml-10">
                    <button
                      type="button"
                      onClick={handlePrint}
                      className="btn-style"
                    >
                      <u>P</u>rint
                    </button>
                    <button
                      type="button"
                      onClick={() => setForm(initialForm())}
                      className="btn-style"
                    >
                      <u>C</u>lose
                    </button>
                  </div>
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

export default AirlineWiseProfitPage;
