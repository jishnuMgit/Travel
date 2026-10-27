
import React, { useState } from "react";
import Select from "react-select";
import {
  LocalizationProvider,
} from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";

dayjs.extend(customParseFormat);

type Option = {
  value: string;
  label: string;
};

type RadioProps = {
  name: string;
  value: string;
  label: string;
  checked: boolean;
  onChange: () => void;
  disabled?: boolean;
};

const DATE_FORMAT = "DD/MM/YYYY";

const branchOptions: Option[] = [
  { value: "JEDDAH", label: "JEDDAH" },
  { value: "RIYADH", label: "RIYADH" },
  { value: "DAMMAM", label: "DAMMAM" },
];

const staffOptions: Option[] = [
  { value: "S001", label: "Staff One" },
  { value: "S002", label: "Staff Two" },
];

const customerIdOptions: Option[] = [
  { value: "C001", label: "C001" },
  { value: "C002", label: "C002" },
];

const customerNameOptions: Option[] = [
  { value: "C001", label: "Customer One" },
  { value: "C002", label: "Customer Two" },
];

/* React Select styling */
const selectClassNames = {
  control: ({
    isFocused,
    isDisabled,
  }: {
    isFocused: boolean;
    isDisabled: boolean;
  }) =>
    `!min-h-[30px] !h-[30px] !rounded-[4px] !border !shadow-none !text-[12px]
    ${
      isDisabled ? "!bg-[#f8fafc]" : "!bg-white"
    }
    ${
      isFocused
        ? "!border-[#91b8e0]"
        : "!border-[#cbd7e4]"
    }`,

  valueContainer: () =>
    "!h-[28px] !py-0 !px-[5px] !overflow-hidden",

  singleValue: () =>
    "!m-0 !text-[12px] !text-[#30465d]",

  placeholder: () =>
    "!m-0 !text-[12px] !text-[#7a8794]",

  input: () =>
    "!m-0 !p-0 !text-[12px] !text-[#30465d]",

  indicatorsContainer: () => "!h-[28px]",

  dropdownIndicator: () =>
    "!p-[4px] !text-[#64788e]",

  indicatorSeparator: () => "!hidden",

  clearIndicator: () => "!p-[3px]",

  menu: () =>
    "!mt-[1px] !rounded-[4px] !border !border-[#cbd7e4] !z-[999999] !shadow-md",

  menuList: () => "!p-0 !max-h-[180px]",

  option: ({
    isFocused,
    isSelected,
  }: {
    isFocused: boolean;
    isSelected: boolean;
  }) =>
    `!cursor-pointer !px-[7px] !py-[5px] !text-[12px]
    ${
      isSelected
        ? "!bg-[#e4f5eb] !text-[#30465d]"
        : isFocused
          ? "!bg-[#f1f7fc] !text-[#30465d]"
          : "!bg-white !text-[#30465d]"
    }`,
};

const selectProps = {
  isSearchable: false,
  isClearable: false,
  placeholder: "",
  classNames: selectClassNames,
  menuPosition: "fixed" as const,
  menuPortalTarget:
    typeof document !== "undefined"
      ? document.body
      : undefined,
};

/* Green radio buttons */
const CustomRadio: React.FC<RadioProps> = ({
  name,
  value,
  label,
  checked,
  onChange,
  disabled = false,
}) => (
  <label
    className={`flex items-center gap-[5px] whitespace-nowrap select-none ${
      disabled
        ? "cursor-not-allowed opacity-40"
        : "cursor-pointer"
    }`}
  >
    <input
      type="radio"
      name={name}
      value={value}
      checked={checked}
      onChange={onChange}
      disabled={disabled}
      className="sr-only"
    />

    <span
      className={`flex h-[19px] w-[19px] shrink-0 items-center justify-center rounded-full border ${
        checked
          ? "border-[#4ade80]"
          : "border-[#cbd5e1]"
      } bg-white`}
    >
      {checked && (
        <span className="h-[9px] w-[9px] rounded-full bg-[#4ade80]" />
      )}
    </span>

    <span className="text-[12px] leading-[17px] text-[#30465d]">
      {label}
    </span>
  </label>
);

/* Radio group panel */
const RadioPanel: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className = "" }) => (
  <div
    className={`flex flex-col justify-center gap-[5px] rounded-[3px] border border-[#d9e1e9] bg-white px-[7px] py-[7px] ${className}`}
  >
    {children}
  </div>
);

/* Period label */
const FieldLabel: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => (
  <div className="flex h-[28px] items-center justify-end rounded-[2px] border border-[#d9e1e9] bg-[#fafbfc] px-[8px] text-[12px] text-[#40566d]">
    {children}
  </div>
);

/* Date picker */
const AppDatePicker: React.FC<{
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}> = ({ id, label, value, onChange, disabled = false }) => (
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
      width: 140,
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
);

/* Action button */
const ActionButton: React.FC<{
  children: React.ReactNode;
  onClick: () => void;
}> = ({ children, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className="flex h-[40px] min-w-[90px] items-center justify-center rounded-[4px] border border-[#a9c8ed] bg-gradient-to-b from-white to-[#edf3f9] px-[18px] text-[13px] text-green-700 hover:from-[#f7fbff] hover:to-[#e4eff9] active:translate-y-px"
  >
    {children}
  </button>
);

const StaffSalesPage: React.FC = () => {
  const [branchMode, setBranchMode] =
    useState("One Branch");

  const [branch, setBranch] =
    useState<Option | null>(branchOptions[0]);

  const [staffMode, setStaffMode] =
    useState("One Staff");

  const [staff, setStaff] =
    useState<Option | null>(null);

  const [customerMode, setCustomerMode] =
    useState("One Customer");

  const [customerId, setCustomerId] =
    useState<Option | null>(null);

  const [customerName, setCustomerName] =
    useState<Option | null>(null);

  const [fromDate, setFromDate] =
    useState("01/10/2026");

  const [toDate, setToDate] =
    useState(dayjs().format(DATE_FORMAT));

  const [detailMode, setDetailMode] =
    useState("Summary");

  const [paymentType, setPaymentType] =
    useState("All");

  const [resultType, setResultType] =
    useState("Net");

  const [salesCategory, setSalesCategory] =
    useState("All");

  const [travelType, setTravelType] =
    useState("All");

  const [invoiceStatus, setInvoiceStatus] =
    useState("All");

  const handlePrint = () => {
    const reportFilters = {
      branchMode,
      branch:
        branchMode === "One Branch"
          ? branch
          : null,

      staffMode,
      staff:
        staffMode === "One Staff"
          ? staff
          : null,

      customerMode,
      customerId:
        customerMode === "One Customer"
          ? customerId
          : null,

      customerName:
        customerMode === "One Customer"
          ? customerName
          : null,

      fromDate,
      toDate,
      detailMode,
      paymentType,
      resultType,
      salesCategory,
      travelType,
      invoiceStatus,
    };

    console.log("Staff Sales Report:", reportFilters);

    // Connect your existing report/print API here.
  };

  const handleClose = () => {
    window.history.back();
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
   <div className="flex w-full justify-center">
  <div className="min-h-screen w-full bg-white p-[10px]">
    <main className="mx-auto w-full max-w-[800px] overflow-visible rounded-[3px] border border-[#9ca9b8] bg-white shadow-sm">
   

          {/* Title */}
          <header className="flex h-[33px] items-center rounded-t-[2px] bg-[#9fe0bd] px-[16px]">
            <h1 className="m-0 text-[16px] font-medium text-[#24435b]">
              Staff Sales
            </h1>
          </header>

          <section className="px-[17px] pb-[19px] pt-[19px]">

            {/* Five aligned rows */}
            <div className="grid grid-cols-[125px_minmax(0,1fr)_228px] items-center gap-x-[12px] gap-y-[12px]">

              {/* ROW 1: Branch */}
              <RadioPanel className="min-h-[70px]">
                <CustomRadio
                  name="branch"
                  value="One Branch"
                  label="One Branch"
                  checked={branchMode === "One Branch"}
                  onChange={() => setBranchMode("One Branch")}
                />

                <CustomRadio
                  name="branch"
                  value="All Branch"
                  label="All Branch"
                  checked={branchMode === "All Branch"}
                  onChange={() => setBranchMode("All Branch")}
                />
              </RadioPanel>

              <div>

                {branchMode==="One Branch" &&<div className="w-[220px] max-w-full -mt-5">
                  <Select
                    inputId="branch"
                    options={branchOptions}
                    value={branch}
                    onChange={setBranch}
                    isDisabled={branchMode !== "One Branch"}
                    {...selectProps}
                  />
                </div>}
                
              </div>

              <div className="flex items-center gap-[8px]">
                <RadioPanel className="w-[110px] min-h-[85px]">
                  <CustomRadio
                    name="payment"
                    value="Cash"
                    label="Cash"
                    checked={paymentType === "Cash"}
                    onChange={() => setPaymentType("Cash")}
                  />

                  <CustomRadio
                    name="payment"
                    value="Credit"
                    label="Credit"
                    checked={paymentType === "Credit"}
                    onChange={() => setPaymentType("Credit")}
                  />

                  <CustomRadio
                    name="payment"
                    value="All"
                    label="All"
                    checked={paymentType === "All"}
                    onChange={() => setPaymentType("All")}
                  />
                </RadioPanel>

                <RadioPanel className="w-[110px] min-h-[85px]">
                  <CustomRadio
                    name="result"
                    value="Sales"
                    label="Sales"
                    checked={resultType === "Sales"}
                    onChange={() => setResultType("Sales")}
                  />

                  <CustomRadio
                    name="result"
                    value="Refund"
                    label="Refund"
                    checked={resultType === "Refund"}
                    onChange={() => setResultType("Refund")}
                  />

                  <CustomRadio
                    name="result"
                    value="Net"
                    label="Net"
                    checked={resultType === "Net"}
                    onChange={() => setResultType("Net")}
                  />
                </RadioPanel>
              </div>

              {/* ROW 2: Staff */}
              <RadioPanel className="min-h-[70px]">
                <CustomRadio
                  name="staff"
                  value="One Staff"
                  label="One Staff"
                  checked={staffMode === "One Staff"}
                  onChange={() => setStaffMode("One Staff")}
                />

                <CustomRadio
                  name="staff"
                  value="All Staff"
                  label="All Staff"
                  checked={staffMode === "All Staff"}
                  onChange={() => setStaffMode("All Staff")}
                />
              </RadioPanel>

              <div>
                <div className="w-[220px] max-w-full">
                  <Select
                    inputId="staff"
                    options={staffOptions}
                    value={staff}
                    onChange={setStaff}
                    isDisabled={staffMode !== "One Staff"}
                    {...selectProps}
                  />
                </div>
              </div>

              <div />

              {/* ROW 3: Customer */}
              <RadioPanel className="min-h-[70px]">
                <CustomRadio
                  name="customer"
                  value="One Customer"
                  label="One Customer"
                  checked={customerMode === "One Customer"}
                  onChange={() => setCustomerMode("One Customer")}
                />

                <CustomRadio
                  name="customer"
                  value="All Customer"
                  label="All Customer"
                  checked={customerMode === "All Customer"}
                  onChange={() => setCustomerMode("All Customer")}
                />
              </RadioPanel>

              <div className="grid min-w-0 grid-cols-[85px_minmax(0,1fr)] gap-[5px]">
                <Select
                  inputId="customerId"
                  options={customerIdOptions}
                  value={customerId}
                  onChange={(option) => {
                    setCustomerId(option);

                    setCustomerName(
                      customerNameOptions.find(
                        (item) => item.value === option?.value,
                      ) ?? null,
                    );
                  }}
                  isDisabled={customerMode !== "One Customer"}
                  {...selectProps}
                />

                <Select
                  inputId="customerName"
                  options={customerNameOptions}
                  value={customerName}
                  onChange={(option) => {
                    setCustomerName(option);

                    setCustomerId(
                      customerIdOptions.find(
                        (item) => item.value === option?.value,
                      ) ?? null,
                    );
                  }}
                  isDisabled={customerMode !== "One Customer"}
                  {...selectProps}
                />
              </div>

              <div className="flex justify-end">
                <RadioPanel className="w-[110px] min-h-[85px]">
                  <CustomRadio
                    name="category"
                    value="Travel"
                    label="Travel"
                    checked={salesCategory === "Travel"}
                    onChange={() => setSalesCategory("Travel")}
                  />

                  <CustomRadio
                    name="category"
                    value="Tourism"
                    label="Tourism"
                    checked={salesCategory === "Tourism"}
                    onChange={() => setSalesCategory("Tourism")}
                  />

                  <CustomRadio
                    name="category"
                    value="All"
                    label="All"
                    checked={salesCategory === "All"}
                    onChange={() => setSalesCategory("All")}
                  />
                </RadioPanel>
              </div>

              {/* ROW 4: Period */}
              <div className="-mt-15"><FieldLabel>Period :</FieldLabel></div>

              <div className="flex flex-wrap items-center gap-[6px] -mt-15">
                <AppDatePicker
                                  id="fromDate"
                                  value={fromDate}
                                  onChange={setFromDate} label={""}                />

                <AppDatePicker
                                  id="toDate"
                                  value={toDate}
                                  onChange={setToDate} label={""}                />
              </div>

              <div className="flex items-center gap-[8px] ">
                <RadioPanel className="w-[110px] min-h-[85px]">
                  <CustomRadio
                    name="travel"
                    value="Domestic"
                    label="Domestic"
                    checked={travelType === "Domestic"}
                    onChange={() => setTravelType("Domestic")}
                  />

                  <CustomRadio
                    name="travel"
                    value="International"
                    label="International"
                    checked={travelType === "International"}
                    onChange={() => setTravelType("International")}
                  />

                  <CustomRadio
                    name="travel"
                    value="All"
                    label="All"
                    checked={travelType === "All"}
                    onChange={() => setTravelType("All")}
                  />
                </RadioPanel>

                <RadioPanel className="w-[110px] min-h-[85px]">
                  <CustomRadio
                    name="invoice"
                    value="Not-Invoiced"
                    label="Not-Invoiced"
                    checked={invoiceStatus === "Not-Invoiced"}
                    onChange={() => setInvoiceStatus("Not-Invoiced")}
                  />

                  <CustomRadio
                    name="invoice"
                    value="Invoiced"
                    label="Invoiced"
                    checked={invoiceStatus === "Invoiced"}
                    onChange={() => setInvoiceStatus("Invoiced")}
                  />

                  <CustomRadio
                    name="invoice"
                    value="All"
                    label="All"
                    checked={invoiceStatus === "All"}
                    onChange={() => setInvoiceStatus("All")}
                  />
                </RadioPanel>
              </div>

              {/* ROW 5: Detail and Summary */}
              <RadioPanel className="min-h-[70px] -mt-12">
                <CustomRadio
                  name="detail"
                  value="Detail"
                  label="Detail"
                  checked={detailMode === "Detail"}
                  onChange={() => setDetailMode("Detail")}
                />

                <CustomRadio
                  name="detail"
                  value="Summary"
                  label="Summary"
                  checked={detailMode === "Summary"}
                  onChange={() => setDetailMode("Summary")}
                />
              </RadioPanel>

              <div className="flex items-center justify-center gap-[8px] -mt-5 ">
                <ActionButton onClick={handlePrint}>
                  <u>P</u>rint
                </ActionButton>

                <ActionButton onClick={handleClose}>
                  Close
                </ActionButton>
              </div>

              <div />

            </div>
          </section>
        </main>
      </div>
      </div>
    </LocalizationProvider>
  );
};

export default StaffSalesPage;
