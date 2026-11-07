
import React, { useState } from "react";
import CommonTableSelect, {
  type TableSelectOption,
} from "../../../components/common/CommonTableSelect";
import CustomLinkedPairSelect, {
  type PairSelectOption,
} from "../../../components/common/CustomLinkedPairSelect";
import {LocalizationProvider,} from "@mui/x-date-pickers/LocalizationProvider";
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
const branchOptions: TableSelectOption[] = [
  { value: "JEDDAH", label: "JEDDAH", id: "JH" },
  { value: "RIYADH", label: "RIYADH", id: "RH" },
  { value: "DAMMAM", label: "DAMMAM", id: "DM" },
];

const branchColumns = [
  { key: "label", label: "Branch", width: "1fr" },
  { key: "id", label: "ID", width: "70px", align: "right" as const },
];
const staffIdOptions: Option[] = [
  { value: "S001", label: "S001" },
  { value: "S002", label: "S002" },
];
const staffNameOptions: Option[] = [
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
const createPairOptions = (
  idOptions: Option[],
  nameOptions: Option[],
): PairSelectOption[] =>
  idOptions.map((id) => ({
    value: id.value,
    firstLabel: id.label,
    secondLabel:
      nameOptions.find((item) => item.value === id.value)?.label ?? "",
  }));

const staffPairOptions = createPairOptions(staffIdOptions, staffNameOptions);
const customerPairOptions = createPairOptions(
  customerIdOptions,
  customerNameOptions,
);

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
    className={`flex items-center gap-1.25 whitespace-nowrap select-none ${
      disabled ? "cursor-not-allowed opacity-40" : "cursor-pointer"  }`} >
    <input
      type="radio"
      name={name}
      value={value}
      checked={checked}
      onChange={onChange}
      disabled={disabled}
      className="sr-only"/>
    <span  className={`flex h-4.75 w-4.75 shrink-0 items-center justify-center rounded-full border ${
        checked ? "border-[#4ade80]" : "border-[#cbd5e1]" } bg-white`} >
      {checked && (
        <span className="h-2.25 w-2.25 rounded-full bg-[#4ade80]" />
      )}
    </span>
    <span className="text-[12px] leading-4.25 text-[#30465d]">
      {label}
    </span>
  </label>
);
/* Radio group panel */
const RadioPanel: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className = "" }) => (
  <div   className={`flex flex-col justify-center gap-1.25 rounded-[3px] border border-[#d9e1e9] bg-white px-1.75 py-1.75 ${className}`} >
    {children}
  </div>
);
/* Period label */
const FieldLabel: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => (
  <div className="flex h-7 items-center justify-end rounded-xs border border-[#d9e1e9] bg-[#fafbfc] px-2 text-[12px] text-[#40566d]">
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
      "& .MuiPickersInputBase-root.Mui-disabled": { backgroundColor: "#eef1f4", },
      "& .MuiPickersInputBase-sectionsContainer": {
        paddingLeft: "8px !important",
        paddingRight: "0px !important",
        marginBottom: "-5px !important",
        marginLeft: "0px !important",
        boxSizing: "border-box",
        overflow: "hidden",
      },
      "& .MuiPickersInputBase-sectionContent": { fontSize: "12px",  color: "#344054",},
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
    className="flex h-10 min-w-22.5 items-center justify-center rounded-sm border border-[#a9c8ed] bg-linear-to-b from-white to-[#edf3f9] px-4.5 text-[13px] text-green-700 hover:from-[#f7fbff] hover:to-[#e4eff9] active:translate-y-px" >
    {children}
  </button>
);
const StaffSalesPage: React.FC = () => {
  const [branchMode, setBranchMode] =  useState("One Branch");
  const [branch, setBranch] = useState<TableSelectOption | null>(branchOptions[0]);
  const [staffMode, setStaffMode] = useState("One Staff");
  const [staffId, setStaffId] = useState<Option | null>(null);
  const [staffName, setStaffName] = useState<Option | null>(null);
  const [customerMode, setCustomerMode] = useState("One Customer");
  const [customerId, setCustomerId] =  useState<Option | null>(null);
  const [customerName, setCustomerName] =  useState<Option | null>(null);
  const [fromDate, setFromDate] = useState("01/10/2026");
  const [toDate, setToDate] = useState(dayjs().format(DATE_FORMAT));
  const [detailMode, setDetailMode] =useState("Summary");
  const [paymentType, setPaymentType] = useState("All");
  const [resultType, setResultType] = useState("Net");
  const [salesCategory, setSalesCategory] = useState("All");
  const [travelType, setTravelType] =useState("All");
  const [invoiceStatus, setInvoiceStatus] = useState("All");
  const handlePrint = () => {
    const reportFilters = {
      branchMode,
      branch: branchMode === "One Branch"  ? branch  : null,
      staffMode,
      staff:staffMode === "One Staff" ? staffId : null,
      staffName: staffMode === "One Staff" ? staffName : null,
      customerMode,
      customerId: customerMode === "One Customer" ? customerId : null,
      customerName:  customerMode === "One Customer" ? customerName : null,
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
  <div className="min-h-screen w-full bg-white p-2.5">
    <main className="mx-auto w-full max-w-220 overflow-visible rounded-[3px] border border-[#9ca9b8] bg-white shadow-sm">          
          <header className="flex h-8.25 items-center rounded-t-xs bg-[#9fe0bd] px-4">
            <h1 className="m-0 text-[16px] font-medium text-[#24435b]">
              Staff Sales
            </h1>
          </header>
          <section className="px-4.25 pb-4.75 pt-4.75">
          <div className="grid grid-cols-[125px_minmax(0,1fr)_228px] items-center gap-x-3 gap-y-3">         
              <RadioPanel className="min-h-17.5">
                <CustomRadio
                  name="branch"
                  value="One Branch"
                  label="One Branch"
                  checked={branchMode === "One Branch"}
                  onChange={() => setBranchMode("One Branch")}   />
                <CustomRadio
                  name="branch"
                  value="All Branch"
                  label="All Branch"
                  checked={branchMode === "All Branch"}
                  onChange={() => setBranchMode("All Branch")}  />
                     </RadioPanel>
              <div>
                {branchMode === "One Branch" && (
                  <div className="w-62.5 max-w-full -mt-5">
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
              <div className="flex items-center gap-2">
                <RadioPanel className="w-27.5 min-h-21.25">
                  <CustomRadio
                      name="payment"
                      value="Cash"
                      label="Cash"
                      checked={paymentType === "Cash"}
                      onChange={() => setPaymentType("Cash")} />
                  <CustomRadio
                    name="payment"
                    value="Credit"
                    label="Credit"
                    checked={paymentType === "Credit"}
                    onChange={() => setPaymentType("Credit")}  />
                  <CustomRadio
                    name="payment"
                    value="All"
                    label="All"
                    checked={paymentType === "All"}
                    onChange={() => setPaymentType("All")}    />
                     </RadioPanel>
                <RadioPanel className="w-27.5 min-h-21.25">
                  <CustomRadio
                    name="rdgSR"
                    value="Sales"
                    label="Sales"
                    checked={resultType === "Sales"}
                    onChange={() => setResultType("Sales")}    />
                  <CustomRadio
                    name="rdgSR"
                    value="Refund"
                    label="Refund"
                    checked={resultType === "Refund"}
                    onChange={() => setResultType("Refund")}   />
                  <CustomRadio
                    name="rdgSR"
                    value="Net"
                    label="Net"
                    checked={resultType === "Net"}
                    onChange={() => setResultType("Net")}  />
                  </RadioPanel>
              </div>
              <RadioPanel className="min-h-17.5">
                <CustomRadio
                  name="rdgStaff"
                  value="One Staff"
                  label="One Staff"
                  checked={staffMode === "One Staff"}
                  onChange={() => setStaffMode("One Staff")}   />
                <CustomRadio
                  name="rdgStaff"
                  value="All Staff"
                  label="All Staff"
                  checked={staffMode === "All Staff"}
                  onChange={() => setStaffMode("All Staff")}  />
              </RadioPanel>
              <div>
                {staffMode === "One Staff" && (
                  <CustomLinkedPairSelect
                    firstInputId="lkpStaffId"
                    secondInputId="lkpStaffName"
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
                )}
              </div>
              <div />
              <RadioPanel className="min-h-17.5">
                <CustomRadio
                    name="rdgCustomer"
                    value="One Customer"
                    label="One Customer"
                    checked={customerMode === "One Customer"}
                    onChange={() => setCustomerMode("One Customer")}  />
                <CustomRadio
                    name="rdgCustomer"
                    value="All Customer"
                    label="All Customer"
                    checked={customerMode === "All Customer"}
                    onChange={() => setCustomerMode("All Customer")}  />
              </RadioPanel>
  <div className="flex min-w-0 items-start gap-1">
              {customerMode === "One Customer" && (
                <CustomLinkedPairSelect
                  firstInputId="lkpCustomerId"
                  secondInputId="lkpCustomerName"
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
              <div className="flex justify-end">
                <RadioPanel className="w-27.5 min-h-21.25">
                  <CustomRadio
                    name="rdgSubModule"
                    value="Travel"
                    label="Travel"
                    checked={salesCategory === "Travel"}
                    onChange={() => setSalesCategory("Travel")}  />
                  <CustomRadio
                    name="rdgSubModule"
                    value="Tourism"
                    label="Tourism"
                    checked={salesCategory === "Tourism"}
                    onChange={() => setSalesCategory("Tourism")}  />
                  <CustomRadio
                    name="rdgSubModule"
                    value="All"
                    label="All"
                    checked={salesCategory === "All"}
                    onChange={() => setSalesCategory("All")}   />
                </RadioPanel>
              </div>              
              <div className="-mt-15"><FieldLabel>Period :</FieldLabel></div>
              <div className="flex flex-wrap items-center gap-1.5 -mt-15">
                <AppDatePicker
                   id="dtpFromDate"
                    value={fromDate}
                    onChange={setFromDate} label={""} />
                <AppDatePicker
                    id="dtpToDate"
                    value={toDate}
                   onChange={setToDate} label={""}  />
              </div>
              <div className="flex items-center gap-2 ">
                <RadioPanel className="w-27.5 min-h-21.25">
                  <CustomRadio
                    name="rdgDI"
                    value="Domestic"
                    label="Domestic"
                    checked={travelType === "Domestic"}
                    onChange={() => setTravelType("Domestic")} />
                  <CustomRadio
                    name="rdgDI"
                    value="International"
                    label="International"
                    checked={travelType === "International"}
                    onChange={() => setTravelType("International")} />
                  <CustomRadio
                    name="rdgDI"
                    value="All"
                    label="All"
                    checked={travelType === "All"}
                    onChange={() => setTravelType("All")} />
                 </RadioPanel>
                <RadioPanel className="w-27.5 min-h-21.25">
                  <CustomRadio
                    name="rdgInvoiced"
                    value="Not-Invoiced"
                    label="Not-Invoiced"
                    checked={invoiceStatus === "Not-Invoiced"}
                    onChange={() => setInvoiceStatus("Not-Invoiced")}  />
                  <CustomRadio
                    name="rdgInvoiced"
                    value="Invoiced"
                    label="Invoiced"
                    checked={invoiceStatus === "Invoiced"}
                    onChange={() => setInvoiceStatus("Invoiced")} />
                  <CustomRadio
                    name="rdgInvoiced"
                    value="All"
                    label="All"
                    checked={invoiceStatus === "All"}
                    onChange={() => setInvoiceStatus("All")} />
                </RadioPanel>
              </div>
              {/* ROW 5: Detail and Summary */}
              <RadioPanel className="min-h-17.5 -mt-12">
                <CustomRadio
                  name="rdgDetSum"
                  value="Detail"
                  label="Detail"
                  checked={detailMode === "Detail"}
                  onChange={() => setDetailMode("Detail")} />
                <CustomRadio
                  name="rdgDetSum"
                  value="Summary"
                  label="Summary"
                  checked={detailMode === "Summary"}
                  onChange={() => setDetailMode("Summary")}  />
              </RadioPanel>
              <div className="flex items-center justify-center gap-2 -mt-5 ">
                <ActionButton onClick={handlePrint}> <u>P</u>rint </ActionButton>
                <ActionButton onClick={handleClose}>  Close    </ActionButton>
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
