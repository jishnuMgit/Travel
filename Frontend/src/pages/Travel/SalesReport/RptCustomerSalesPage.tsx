
import React, { useState } from "react";
import {
  LocalizationProvider,
} from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";
import Header from "../../../components/common/Header";
import CommonTableSelect, {
  type TableSelectOption,
} from "../../../components/common/CommonTableSelect";
import CustomLinkedPairSelect, {
  type PairSelectOption,
} from "../../../components/common/CustomLinkedPairSelect";
dayjs.extend(customParseFormat);

type Option = {
  value: string;
  label: string;
};

const DATE_FORMAT = "DD/MM/YYYY";
const TODAY = dayjs().format(DATE_FORMAT);
const branchOptions = [
  { label: "Jeddah", value: "JD", id: "JD" },
  { label: "Riyadh", value: "RH", id: "RH" },
];

const branchColumns = [
  { key: "label", label: "Branch", width: "1fr" },
  { key: "id", label: "ID", width: "70px", align: "right" as const },
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

const staffIdOptions: Option[] = [
  { value: "S001", label: "S001" },
  { value: "S002", label: "S002" },
];

const staffNameOptions: Option[] = [
  { value: "S001", label: "Staff One" },
  { value: "S002", label: "Staff Two" },
];

const divisionOptions: TableSelectOption[] = [
  { value: "TRAVEL", label: "Travel", id: "TR" },
  { value: "TOURISM", label: "Tourism", id: "TO" },
];

const divisionColumns = [
  { key: "label", label: "Division", width: "1fr" },
  { key: "id", label: "ID", width: "70px", align: "right" as const },
];

const createPairOptions = (
  idOptions: Option[],
  nameOptions: Option[],
): PairSelectOption[] => {
  return idOptions.map((id) => ({
    value: id.value,
    firstLabel: id.label,
    secondLabel:
      nameOptions.find((item) => item.value === id.value)?.label ?? "",
  }));
};

const customerPairOptions = createPairOptions(
  customerIdOptions,
  customerNameOptions,
);

const airlinePairOptions = createPairOptions(
  airlineIdOptions,
  airlineNameOptions,
);

const staffPairOptions = createPairOptions(
  staffIdOptions,
  staffNameOptions,
);


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
    className={`flex items-center gap-1.25 whitespace-nowrap select-none ${
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
      className={`flex h-4.75 w-4.75 shrink-0 items-center justify-center rounded-full border ${
        checked ? "border-[#4ade80]" : "border-[#c3cbd3]"
      } bg-white`}
    >
      {checked && (
        <span className="h-2.25 w-2.25 rounded-full bg-[#4ade80]" />
      )}
    </span>

    <span className="text-[12px] leading-4.25 text-[#172b43]">
      {label}
    </span>
  </label>
);

const RadioPanel: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className = "" }) => (
  <div
    className={`flex flex-col justify-center gap-1.5 border border-gray-300 rounded-sm bg-white px-1.75 py-1.75 ${className}`}
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
    className={` min-w-20 btn-style ${className}`}
  >
    {children}
  </button>
);

const RptCustomerSalesPage: React.FC = () => {
  const [branchMode, setBranchMode] = useState("One Branch");
  const [branch, setBranch] = useState<Option | null>(
    branchOptions[0],
  );

  const [customerMode, setCustomerMode] = useState("One Customer");
  const [customerId, setCustomerId] = useState<Option | null>(null);
  const [customerName, setCustomerName] = useState<Option | null>(null);

  const [divisionMode, setDivisionMode] = useState("All Divisions");
  const [division, setDivision] = useState<TableSelectOption | null>(null);

  const [airlineMode, setAirlineMode] = useState("One Airline");
  const [airlineId, setAirlineId] = useState<Option | null>(null);
  const [airlineName, setAirlineName] = useState<Option | null>(null);

  const [staffMode, setStaffMode] = useState("One Staff");
  const [staffId, setStaffId] = useState<Option | null>(null);
  const [staffName, setStaffName] = useState<Option | null>(null);

  const [fromDate, setFromDate] = useState("01/10/2026");
  const [toDate, setToDate] = useState(TODAY);

  const [detailMode, setDetailMode] = useState("Summary");
  const [invoiceStatus, setInvoiceStatus] = useState("All");
  const [paymentType, setPaymentType] = useState("All");
  const [travelType, setTravelType] = useState("All");
  const [resultType, setResultType] = useState("Net");
  const [salesCategory, setSalesCategory] = useState("All");
console.log(setPaymentType)
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
      staffId: staffMode === "One Staff" ? staffId : null,
      staffName: staffMode === "One Staff" ? staffName : null,
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
      <main className="mx-auto w-full max-w-220 overflow-hidden rounded-[3px] border border-[#91a7bb] bg-white shadow-sm">
        {/* Window title */}
        <Header Name="Customer Sales" />

        <section className="px-4.25 pb-9.5 pt-4.25 relative">
          <div className="grid grid-cols-[125px_minmax(0,1fr)] gap-x-4.25 gap-y-2.5">
            {/* Branch */}
            <RadioPanel className="h-17.5">
              <CustomRadio
                name="rgdBranch"
                value="One Branch"
                label="One Branch"
                checked={branchMode === "One Branch"}
                onChange={() => setBranchMode("One Branch")}                             
              />                                                                                           
              <CustomRadio
                name="rgdBranch"
                value="All Branches"
                label="All Branches"
                checked={branchMode === "All Branches"}
                onChange={() => setBranchMode("All Branches")}
              />
            </RadioPanel>

            <div className="pt-2.25">
             {branchMode === "One Branch" && (
  <div className="w-62.5 max-w-full">
    <CommonTableSelect
      inputId="branch"
      options={branchOptions}
      value={branch}
      onChange={setBranch}
      columns={branchColumns}
      width="250px"
      menuWidth="305px"
      placeholder="Select Branch"
    />
  </div>
)}
            </div>

            {/* Customer */}
            <RadioPanel className="h-17.5">
              <CustomRadio
                name="rgdCustomer"
                value="One Customer"
                label="One Customer"
                checked={customerMode === "One Customer"}
                onChange={() => setCustomerMode("One Customer")}
              />
              <CustomRadio
                name="rgdCustomer"
                value="All Customers"
                label="All Customers"
                checked={customerMode === "All Customers"}
                onChange={() => setCustomerMode("All Customers")}
              />
            </RadioPanel>

            <div className="flex items-start gap-1 pt-2.25">
              {customerMode === "One Customer" && (
                <CustomLinkedPairSelect
                  firstInputId="customerId"
                  secondInputId="customerName"
                  options={customerPairOptions}
                  firstValue={customerId?.value ?? null}
                  secondValue={customerName?.value ?? null}
                  firstHeader="Customer ID"
                  secondHeader="Customer Name"
                  firstWidth={120}
                  secondWidth={450}
                  gap={4}
                  headerFontSize="12px"
                  onChange={(option) => {
                    setCustomerId(
                      option
                        ? { value: option.value, label: option.firstLabel }
                        : null,
                    );
                    setCustomerName(
                      option
                        ? { value: option.value, label: option.secondLabel }
                        : null,
                    );
                  }}
                />
              )}
            </div>

            {/* Division */}
            <RadioPanel className="h-17.5">
              <CustomRadio
                name="rgdDivision"
                value="One Division"
                label="One Division"
                checked={divisionMode === "One Division"}
                
                onChange={() => setDivisionMode("One Division")}
              />
              <CustomRadio
                name="rgdDivision"
                value="All Divisions"
                label="All Divisions"
                checked={divisionMode === "All Divisions"}
                
                onChange={() => setDivisionMode("All Divisions")}
              />
            </RadioPanel>

            <div className="flex min-w-0 items-center justify-between gap-2">
              {divisionMode === "One Division" ? (
                <div className="w-62.5 max-w-full">
                  <CommonTableSelect
                    inputId="division"
                    options={divisionOptions}
                    value={division}
                    onChange={setDivision}
                    columns={divisionColumns}
                    width="250px"
                    menuWidth="310px"
                    placeholder=""
                  />
                </div>
              ) : (
                <div />
              )}
              <RadioPanel className="w-28.75 shrink-0 absolute right-4 top-30">
                <CustomRadio
                  name="rdginvoiced"
                  value="Not-Invoiced"
                  label="Not-Invoiced"
                  checked={invoiceStatus === "Not-Invoiced"}
                  onChange={() => setInvoiceStatus("Not-Invoiced")}
                />
                <CustomRadio
                  name="rdginvoiced"
                  value="Invoiced"
                  label="Invoiced"
                  checked={invoiceStatus === "Invoiced"}
                  onChange={() => setInvoiceStatus("Invoiced")}
                />
                <CustomRadio
                  name="rdginvoiced"
                  value="All"
                  label="All"
                  checked={invoiceStatus === "All"}
                  onChange={() => setInvoiceStatus("All")}
                />
              </RadioPanel>
            </div>

            {/* Airline */}
            <RadioPanel className="h-17.5">
              <CustomRadio
                name="rdgairline"
                value="One Airline"
                label="One Airline"
                checked={airlineMode === "One Airline"}
                onChange={() => setAirlineMode("One Airline")}
              />
              <CustomRadio
                name="rdgairline"
                value="All Airlines"
                label="All Airlines"
                checked={airlineMode === "All Airlines"}
                onChange={() => setAirlineMode("All Airlines")}
              />
            </RadioPanel>

            <div className="flex items-start gap-1 pt-2.25">
              {airlineMode === "One Airline" && (
                <CustomLinkedPairSelect
                  firstInputId="airlineId"
                  secondInputId="airlineName"
                  options={airlinePairOptions}
                  firstValue={airlineId?.value ?? null}
                  secondValue={airlineName?.value ?? null}
                  firstHeader="Airline ID"
                  secondHeader="Airline Name"
                  firstWidth={120}
                  secondWidth={450}
                  gap={4}
                  headerFontSize="12px"
                  onChange={(option) => {
                    setAirlineId(
                      option
                        ? { value: option.value, label: option.firstLabel }
                        : null,
                    );
                    setAirlineName(
                      option
                        ? { value: option.value, label: option.secondLabel }
                        : null,
                    );
                  }}
                />
              )}

             
            </div>

            {/* Staff */}
            <RadioPanel className="h-17.5">
              <CustomRadio
                name="rgdStaff"
                value="One Staff"
                label="One Staff"
                checked={staffMode === "One Staff"}
                onChange={() => setStaffMode("One Staff")}
              />
              <CustomRadio
                name="rgdStaff"
                value="All staffs"
                label="All staffs"
                checked={staffMode === "All staffs"}
                onChange={() => setStaffMode("All staffs")}
              />
            </RadioPanel>

            <div className="flex min-w-0 items-center justify-between gap-1">
              {staffMode === "One Staff" ? (
                <CustomLinkedPairSelect
                  firstInputId="staffId"
                  secondInputId="staffName"
                  options={staffPairOptions}
                  firstValue={staffId?.value ?? null}
                  secondValue={staffName?.value ?? null}
                  firstHeader="Staff ID"
                  secondHeader="Staff Name"
                  firstWidth={120}
                  secondWidth={450}
                  gap={4}
                  headerFontSize="12px"
                  onChange={(option) => {
                    setStaffId(
                      option
                        ? { value: option.value, label: option.firstLabel }
                        : null,
                    );
                    setStaffName(
                      option
                        ? { value: option.value, label: option.secondLabel }
                        : null,
                    );
                  }}
                />
              ) : (
                <div />
              )}
              <RadioPanel className="w-31.25 shrink-0 absolute right-4 top-4">
                <CustomRadio
                  name="rdgDI"
                  value="Domestic"
                  label="Domestic"
                  checked={travelType === "Domestic"}
                  onChange={() => setTravelType("Domestic")}
                />
                <CustomRadio
                  name="rdgDI"
                  value="International"
                  label="International"
                  checked={travelType === "International"}
                  onChange={() => setTravelType("International")}
                />
                <CustomRadio
                  name="rdgDI"
                  value="All"
                  label="All"
                  checked={travelType === "All"}
                  onChange={() => setTravelType("All")}
                />
              </RadioPanel>
            </div>

            {/* Period */}
            <div className="flex h-7.5 items-center justify-end border border-gray-300  bg-[#FAFBFC] px-1.75">
              <span className="text-[12px] text-[#172b43]">Period :</span>
            </div>
            <div className="flex items-center gap-1.25">
              <div className="w-36.5">
                <AppDatePicker
                  id="dtpfromDate"
                  label="Period start date"
                  value={fromDate}
                  onChange={setFromDate}
                />
              </div>
              <div className="w-36.5">
                <AppDatePicker
                  id="dtptoDate"
                  label="Period end date"
                  value={toDate}
                  onChange={setToDate}
                />
              </div>
            </div>

            {/* Details */}
            <RadioPanel className="h-22.5" >
              <CustomRadio
                name="rgdDetSum"
                value="Detail 1"
                label="Detail 1"
                checked={detailMode === "Detail 1"}
                onChange={() => setDetailMode("Detail 1")}
              />
              <CustomRadio
                name="rgdDetSum"
                value="Detail 2"
                label="Detail 2"
                checked={detailMode === "Detail 2"}
                onChange={() => setDetailMode("Detail 2")}
              />
              <CustomRadio
                name="rgdDetSum"
                value="Summary"
                label="Summary"
                checked={detailMode === "Summary"}
                onChange={() => setDetailMode("Summary")}
              />
            </RadioPanel>

            <div className="flex items-end justify-between gap-2">
              <div className="flex flex-wrap gap-1">
                <ActionButton onClick={handlePrint} className="w-20">
                  <u>P</u>rint
                </ActionButton>
                <ActionButton onClick={handleExport} className="w-28.5">
               <u>E</u>xcel
                </ActionButton>
                <ActionButton onClick={handleClose} className="w-20">
                  Close
                </ActionButton>
              </div>

              <div className="flex shrink-0 gap-1 ">
                <RadioPanel className="w-28.25 min-h-22.5 absolute  right-4 top-81">
                  <CustomRadio
                    name="rdgSR"
                    value="Sales"
                    label="Sales"
                    checked={resultType === "Sales"}
                    onChange={() => setResultType("Sales")}
                  />
                  <CustomRadio
                    name="rdgSR"
                    value="Refund"
                    label="Refund"
                    checked={resultType === "Refund"}
                    onChange={() => setResultType("Refund")}
                  />
                  <CustomRadio
                    name="rdgSR"
                    value="Net"
                    label="Net"
                    checked={resultType === "Net"}
                    onChange={() => setResultType("Net")}
                  />
                </RadioPanel>

                <RadioPanel className="w-28.75 min-h-22.5 absolute right-4 top-55">
                  <CustomRadio
                    name="rdgSubModule"
                    value="Travel"
                    label="Travel"
                    checked={salesCategory === "Travel"}
                    onChange={() => setSalesCategory("Travel")}
                  />
                  <CustomRadio
                    name="rdgSubModule"
                    value="Tourism"
                    label="Tourism"
                    checked={salesCategory === "Tourism"}
                    onChange={() => setSalesCategory("Tourism")}
                  />
                  <CustomRadio
                    name="rdgSubModule"
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

export default RptCustomerSalesPage;
