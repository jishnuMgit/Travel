
import React, { useState } from "react";
import Select from "react-select";
import {
  LocalizationProvider,
} from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";
import Header from "../../components/comman/Header";
import { fieldSelectProps } from "../../components/comman/Combo";

dayjs.extend(customParseFormat);

type Option = {
  value: string;
  label: string;
};

const DATE_FORMAT = "DD/MM/YYYY";
const TODAY = dayjs().format(DATE_FORMAT);

const branchOptions: Option[] = [
  { value: "JEDDAH", label: "JEDDAH" },
  { value: "RIYADH", label: "RIYADH" },
  { value: "DAMMAM", label: "DAMMAM" },
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
  { value: "A001", label: "A001" },
  { value: "A002", label: "A002" },
];

const airlineNameOptions: Option[] = [
  { value: "A001", label: "Airline One" },
  { value: "A002", label: "Airline Two" },
];

const staffOptions: Option[] = [
  { value: "S001", label: "Staff One" },
  { value: "S002", label: "Staff Two" },
];

const divisionOptions: Option[] = [
  { value: "TRAVEL", label: "Travel" },
  { value: "TOURISM", label: "Tourism" },
];

type RadioProps = {
  name: string;
  value: string;
  label: string;
  checked: boolean;
  onChange: () => void;
  disabled?: boolean;
};

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
      disabled ? "cursor-not-allowed opacity-40" : "cursor-pointer"
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
        checked ? "border-[#4ade80]" : "border-[#c3cbd3]"
      } bg-white`}
    >
      {checked && (
        <span className="h-[9px] w-[9px] rounded-full bg-[#4ade80]" />
      )}
    </span>

    <span className="text-[12px] leading-[17px] text-[#172b43]">
      {label}
    </span>
  </label>
);

const RadioPanel: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className = "" }) => (
  <div
    className={`flex flex-col justify-center gap-[6px] border border-gray-300 rounded-sm bg-white px-[7px] py-[7px] ${className}`}
  >
    {children}
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
        onChange(
          newValue?.isValid()
            ? newValue.format(DATE_FORMAT)
            : "",
        );
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
          height: "28px",
          minHeight: "28px",
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
  </LocalizationProvider>
);

const ActionButton: React.FC<{
  children: React.ReactNode;
  onClick: () => void;
  className?: string;
}> = ({ children, onClick, className = "" }) => (
  <button
    type="button"
    onClick={onClick}
    className={` min-w-[80px] btn-style ${className}`}
  >
    {children}
  </button>
);

const RptStockPage: React.FC = () => {
  const [branchMode, setBranchMode] = useState("One Branch");
  const [branch, setBranch] = useState<Option | null>(
    branchOptions[0],
  );

  const [customerMode, setCustomerMode] = useState("One Customer");
  const [customerId, setCustomerId] = useState<Option | null>(null);
  const [customerName, setCustomerName] = useState<Option | null>(null);

  const [divisionMode, setDivisionMode] = useState("All Division");
  const [division, setDivision] = useState<Option | null>(null);

  const [airlineMode, setAirlineMode] = useState("One Airline");
  const [airlineId, setAirlineId] = useState<Option | null>(null);
  const [airlineName, setAirlineName] = useState<Option | null>(null);

  const [staffMode, setStaffMode] = useState("One Staff");
  const [staff, setStaff] = useState<Option | null>(null);

  const [fromDate, setFromDate] = useState("01/10/2026");
  const [toDate, setToDate] = useState(TODAY);

  const [detailMode, setDetailMode] = useState("Summary");
  const [invoiceStatus, setInvoiceStatus] = useState("All");
  const [paymentType, setPaymentType] = useState("All");
  const [travelType, setTravelType] = useState("All");
  const [resultType, setResultType] = useState("Net");
  const [salesCategory, setSalesCategory] = useState("All");

  const handlePrint = () => {
    console.log("Customer Sales Report", {
      branchMode,
      branch: branchMode === "One Branch" ? branch : null,
      customerMode,
      customerId:
        customerMode === "One Customer" ? customerId : null,
      customerName:
        customerMode === "One Customer" ? customerName : null,
      divisionMode,
      division: divisionMode === "One Division" ? division : null,
      airlineMode,
      airlineId: airlineMode === "One Airline" ? airlineId : null,
      airlineName: airlineMode === "One Airline" ? airlineName : null,
      staffMode,
      staff: staffMode === "One Staff" ? staff : null,
      fromDate,
      toDate,
      detailMode,
      invoiceStatus,
      paymentType,
      travelType,
      resultType,
      salesCategory,
    });
  };

  const handleExport = () => {
    console.log("Export Customer Sales Report");
    // Connect your Excel export function here.
  };

  const handleClose = () => {
    window.history.back();
  };

  return (
    <div className="min-h-screen w-full bg-white p-1 sm:p-2">
      <main className="mx-auto w-full max-w-[715px] overflow-hidden rounded-[3px] border border-[#91a7bb] bg-white shadow-sm">
        {/* Window title */}
      <Header Name="Customer Sales"/>

        <section className="px-[17px] pb-[38px] pt-[17px]">
          <div className="grid grid-cols-[125px_minmax(0,1fr)] gap-x-[17px] gap-y-[10px]">
            {/* Branch */}
            <RadioPanel className="h-[70px]">
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

            <div className="pt-[9px]">
              {branchMode === "One Branch" && <div className="w-[220px] max-w-full">
                <Select
                  inputId="branch"
                  options={branchOptions}
                  value={branch}
                  onChange={setBranch}
                  {...fieldSelectProps}
                />
              </div>}
            </div>

            {/* Customer */}
            <RadioPanel className="h-[70px]">
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

            <div className="flex items-start gap-1 pt-[9px]">
              {customerMode === "One Customer" && <>
              <div className="w-[85px]">
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
                  {...fieldSelectProps}
                />
              </div>

              <div className="min-w-0 flex-1">
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
                  {...fieldSelectProps}
                />
              </div>
              </>}
            </div>

            {/* Division */}
            <RadioPanel className="h-[70px]">
              <CustomRadio
                name="division"
                value="One Division"
                label="One Division"
                checked={divisionMode === "One Division"}
                
                onChange={() => setDivisionMode("One Division")}
              />
              <CustomRadio
                name="division"
                value="All Division"
                label="All Division"
                checked={divisionMode === "All Division"}
                
                onChange={() => setDivisionMode("All Division")}
              />
            </RadioPanel>

            <div className="flex min-w-0 items-center justify-between gap-2">
              {divisionMode === "One Division" ? (
                <div className="w-[220px] max-w-full">
                  <Select
                    inputId="division"
                    options={divisionOptions}
                    value={division}
                    onChange={setDivision}
                    {...fieldSelectProps}
                  />
                </div>
              ) : (
                <div />
              )}
              <RadioPanel className="w-[115px] shrink-0">
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

            {/* Airline */}
            <RadioPanel className="h-[70px]">
              <CustomRadio
                name="airline"
                value="One Airline"
                label="One Airline"
                checked={airlineMode === "One Airline"}
                onChange={() => setAirlineMode("One Airline")}
              />
              <CustomRadio
                name="airline"
                value="All Airline"
                label="All Airline"
                checked={airlineMode === "All Airline"}
                onChange={() => setAirlineMode("All Airline")}
              />
            </RadioPanel>

            <div className="flex items-start gap-1 pt-[9px]">
              {airlineMode === "One Airline" && <>
              <div className="w-[68px]">
                <Select
                  inputId="airlineId"
                  options={airlineIdOptions}
                  value={airlineId}
                  onChange={(option) => {
                    setAirlineId(option);
                    setAirlineName(
                      airlineNameOptions.find(
                        (item) => item.value === option?.value,
                      ) ?? null,
                    );
                  }}
                  {...fieldSelectProps}
                />
              </div>

              <div className="w-[248px] max-w-full">
                <Select
                  inputId="airlineName"
                  options={airlineNameOptions}
                  value={airlineName}
                  onChange={(option) => {
                    setAirlineName(option);
                    setAirlineId(
                      airlineIdOptions.find(
                        (item) => item.value === option?.value,
                      ) ?? null,
                    );
                  }}
                  {...fieldSelectProps}
                />
              </div>
              </>}

              <div className="ml-auto">
                <RadioPanel className="w-[115px] min-h-[80px]">
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
              </div>
            </div>

            {/* Staff */}
            <RadioPanel className="h-[70px]">
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

            <div className="flex min-w-0 items-center justify-between gap-2">
              {staffMode === "One Staff" ? (
                <div className="w-[220px] max-w-full">
                  <Select
                    inputId="staff"
                    options={staffOptions}
                    value={staff}
                    onChange={setStaff}
                    {...fieldSelectProps}
                  />
                </div>
              ) : (
                <div />
              )}
              <RadioPanel className="w-[145px] shrink-0">
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
            </div>

            {/* Period */}
            <div className="flex h-[30px] items-center justify-end border border-gray-300  bg-[#FAFBFC] px-[7px]">
              <span className="text-[12px] text-[#172b43]">Period :</span>
            </div>
            <div className="flex items-center gap-[5px]">
              <div className="w-[146px]">
                <AppDatePicker
                  id="fromDate"
                  label="Period start date"
                  value={fromDate}
                  onChange={setFromDate}
                />
              </div>
              <div className="w-[146px]">
                <AppDatePicker
                  id="toDate"
                  label="Period end date"
                  value={toDate}
                  onChange={setToDate}
                />
              </div>
            </div>

            {/* Details */}
            <RadioPanel className="h-[90px]">
              <CustomRadio
                name="detail"
                value="Detail 1"
                label="Detail 1"
                checked={detailMode === "Detail 1"}
                onChange={() => setDetailMode("Detail 1")}
              />
              <CustomRadio
                name="detail"
                value="Detail 2"
                label="Detail 2"
                checked={detailMode === "Detail 2"}
                onChange={() => setDetailMode("Detail 2")}
              />
              <CustomRadio
                name="detail"
                value="Summary"
                label="Summary"
                checked={detailMode === "Summary"}
                onChange={() => setDetailMode("Summary")}
              />
            </RadioPanel>

            <div className="flex items-end justify-between gap-2">
              <div className="flex flex-wrap gap-1">
                <ActionButton onClick={handlePrint} className="w-[80px]">
                  <u>P</u>rint
                </ActionButton>
                <ActionButton onClick={handleExport} className="w-[114px]">
               <u>E</u>xcel
                </ActionButton>
                <ActionButton onClick={handleClose} className="w-[80px]">
                  Close
                </ActionButton>
              </div>

              <div className="flex shrink-0 gap-1">
                <RadioPanel className="w-[105px] min-h-[90px]">
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

                <RadioPanel className="w-[115px] min-h-[90px]">
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
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default RptStockPage;
