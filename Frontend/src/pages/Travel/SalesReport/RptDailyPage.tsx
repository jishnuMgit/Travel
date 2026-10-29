import React, { useState } from "react";
import Select from "react-select";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";
import Header from "../../../components/comman/Header";
import {
  fieldSelectProps,
  type Option,
} from "../../../components/comman/Combo";

dayjs.extend(customParseFormat);

const DATE_FORMAT = "DD/MM/YYYY";
const branchOptions: Option[] = [
  { value: "JEDDAH", label: "JEDDAH" },
  { value: "RIYADH", label: "RIYADH" },
  { value: "DAMMAM", label: "DAMMAM" },
];
const staffIdOptions: Option[] = [
  { value: "S001", label: "S001" },
  { value: "S002", label: "S002" },
];
const staffNameOptions: Option[] = [
  { value: "S001", label: "Staff One" },
  { value: "S002", label: "Staff Two" },
];

type RadioOption = {
  value: string;
  label: string;
};

const RadioGroup: React.FC<{
  name: string;
  options: RadioOption[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
}> = ({ name, options, value, onChange, className = "" }) => (
  <div
    className={`flex flex-col justify-center gap-1.25 rounded-[3px] border border-[#d9e1e9] bg-white px-1.75 py-1.5 ${className}`}
  >
    {options.map((option) => (
      <label
        key={option.value}
        className="flex cursor-pointer select-none items-center gap-1.25 whitespace-nowrap"
      >
        <input
          type="radio"
          name={name}
          value={option.value}
          checked={value === option.value}
          onChange={() => onChange(option.value)}
          className="sr-only"
        />
        <span
          className={`flex h-4.75 w-4.75 shrink-0 items-center justify-center rounded-full border ${
            value === option.value
              ? "border-[#4ade80]"
              : "border-[#cbd5e1]"
          } bg-white`}
        >
          {value === option.value && (
            <span className="h-2.25 w-2.25 rounded-full bg-[#4ade80]" />
          )}
        </span>
        <span className="text-[12px] leading-4.25 text-[#30465d]">
          {option.label}
        </span>
      </label>
    ))}
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
      onChange={(newValue) =>
        onChange(newValue?.isValid() ? newValue.format(DATE_FORMAT) : "")
      }
      format={DATE_FORMAT}
      slotProps={{
        textField: { id, slotProps: { htmlInput: { "aria-label": label } } },
        openPickerButton: {
          sx: { width: "22px", height: "26px", padding: 0, margin: 0 },
          "aria-label": `Choose ${label}`,
        },
        inputAdornment: {
          position: "end",
          sx: { margin: 0, padding: 0, height: "26px", maxHeight: "26px" },
        },
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
          padding: "0 2px 0 7px",
          overflow: "hidden",
        },
        "& .MuiPickersInputBase-sectionsContainer": {
          padding: "0 !important",
          margin: 0,
          minWidth: 0,
          overflow: "hidden",
        },
        "& .MuiPickersInputBase-sectionContent": {
          fontSize: "12px",
          color: "#344054",
        },
        "& .MuiInputAdornment-root": {
          margin: 0,
          padding: 0,
          flexShrink: 0,
        },
        "& .MuiIconButton-root": {
          width: "22px",
          height: "26px",
          padding: 0,
          margin: 0,
          flexShrink: 0,
        },
        "& .MuiSvgIcon-root": { fontSize: "15px" },
        "& .MuiPickersOutlinedInput-notchedOutline": {
          borderColor: "#B7C7D7",
        },
        "& .MuiPickersInputBase-root:hover .MuiPickersOutlinedInput-notchedOutline":
          { borderColor: "#91b8e0" },
        "& .MuiPickersInputBase-root.Mui-focused .MuiPickersOutlinedInput-notchedOutline":
          { borderColor: "#A0DFBD", borderWidth: "1px" },
      }}
    />
  </LocalizationProvider>
);

const FieldLabel: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="flex h-7 items-center justify-end rounded-xs border border-[#d9e1e9] bg-[#fafbfc] px-2 text-[12px] text-[#40566d]">
    {children}
  </div>
);

const ActionButton: React.FC<{
  children: React.ReactNode;
  onClick: () => void;
}> = ({ children, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className="btn-style min-w-20"
  >
    {children}
  </button>
);

const RptDailyPage: React.FC = () => {
  const [branchMode, setBranchMode] = useState("One Branch");
  const [branch, setBranch] = useState<Option | null>(branchOptions[0]);
  const [staffMode, setStaffMode] = useState("One Staff");
  const [staff, setStaff] = useState<Option | null>(null);
  const [staffName, setStaffName] = useState<Option | null>(null);
  const [fromDate, setFromDate] = useState("01/10/2026");
  const [toDate, setToDate] = useState(dayjs().format(DATE_FORMAT));
  const [detailMode, setDetailMode] = useState("Detail");
  const [resultType, setResultType] = useState("Sales");
  const [travelType, setTravelType] = useState("All");
  const [salesCategory, setSalesCategory] = useState("All");
  const [invoiceStatus, setInvoiceStatus] = useState("All");
  const [onlyAmexTickets, setOnlyAmexTickets] = useState(false);

  const handlePrint = () => {
    console.log("Daily Sales Report:", {
      branchMode,
      branch: branchMode === "One Branch" ? branch : null,
      staffMode,
      staff: staffMode === "One Staff" ? staff : null,
      staffName: staffMode === "One Staff" ? staffName : null,
      fromDate,
      toDate,
      detailMode,
      resultType,
      travelType,
      salesCategory,
      invoiceStatus,
      onlyAmexTickets,
    });
  };

  const handleClose = () => window.history.back();

  return (
    <div className="min-h-screen w-full bg-white p-1 sm:p-2">
      <main className="mx-auto w-full max-w-245 overflow-hidden rounded-[3px] border border-[#91a7bb] bg-white shadow-sm">
        <Header Name="Daily Sales" />
        <section className="px-4 pb-5 pt-4 sm:px-4.25">
          <div className="space-y-2.5">
            <div className="grid min-h-19 grid-cols-[minmax(0,1fr)_220px] items-center gap-x-3">
              <div className="grid min-w-0 grid-cols-[125px_minmax(0,1fr)] items-center gap-x-3">
                <RadioGroup
                  name="dailyBranchMode"
                  value={branchMode}
                  onChange={setBranchMode}
                  className="h-17.5"
                  options={[
                    { value: "One Branch", label: "One Branch" },
                    { value: "All Branch", label: "All Branch" },
                  ]}
                />
                {branchMode === "One Branch" && (
                  <div className="w-full max-w-55">
                    <Select
                      inputId="dailySalesBranch"
                      options={branchOptions}
                      value={branch}
                      onChange={setBranch}
                      {...fieldSelectProps}
                    />
                  </div>
                )}
              </div>
              <div className="flex items-start justify-end gap-2">
                <RadioGroup
                  name="dailyResultType"
                  value={resultType}
                  onChange={setResultType}
                  className="w-25"
                  options={[
                    { value: "Sales", label: "Sales" },
                    { value: "Refund", label: "Refund" },
                    { value: "All", label: "All" },
                  ]}
                />
                <RadioGroup
                  name="dailyTravelType"
                  value={travelType}
                  onChange={setTravelType}
                  className="w-27.5"
                  options={[
                    { value: "Domestic", label: "Domestic" },
                    { value: "International", label: "International" },
                    { value: "All", label: "All" },
                  ]}
                />
              </div>
            </div>

            <div className="grid min-h-19 grid-cols-[minmax(0,1fr)_220px] items-center gap-x-3">
              <div className="grid min-w-0 grid-cols-[125px_minmax(0,1fr)] items-center gap-x-3">
                <RadioGroup
                  name="dailyStaffMode"
                  value={staffMode}
                  onChange={setStaffMode}
                  className="h-17.5"
                  options={[
                    { value: "One Staff", label: "One Staff" },
                    { value: "All Staff", label: "All Staff" },
                  ]}
                />
                {staffMode === "One Staff" && (
                  <div className="grid min-w-0 grid-cols-[120px_450px] gap-1.25">
                    <Select
                      inputId="dailySalesStaffId"
                      options={staffIdOptions}
                      value={staff}
                      onChange={(option) => {
                        setStaff(option);
                        setStaffName(
                          staffNameOptions.find(
                            (item) => item.value === option?.value,
                          ) ?? null,
                        );
                      }}
                      {...fieldSelectProps}
                    />
                    <Select
                      inputId="dailySalesStaffName"
                      options={staffNameOptions}
                      value={staffName}
                      onChange={(option) => {
                        setStaffName(option);
                        setStaff(
                          staffIdOptions.find(
                            (item) => item.value === option?.value,
                          ) ?? null,
                        );
                      }}
                      {...fieldSelectProps}
                    />
                  </div>
                )}
              </div>
              <div className="flex justify-end">
                <RadioGroup
                  name="dailySalesCategory"
                  value={salesCategory}
                  onChange={setSalesCategory}
                  className="w-27.5"
                  options={[
                    { value: "Travel", label: "Travel" },
                    { value: "Tourism", label: "Tourism" },
                    { value: "All", label: "All" },
                  ]}
                />
              </div>
            </div>

            <div className="grid min-h-16 grid-cols-[minmax(0,1fr)_220px] items-center gap-x-3">
              <div className="grid min-w-0 grid-cols-[125px_minmax(0,1fr)] items-center gap-x-3">
                <FieldLabel>Period :</FieldLabel>
                <div className="flex gap-1.25">
                  <div className="w-25">
                    <AppDatePicker
                      id="dailySalesFromDate"
                      label="Period start date"
                      value={fromDate}
                      onChange={setFromDate}
                    />
                  </div>
                  <div className="w-25">
                    <AppDatePicker
                      id="dailySalesToDate"
                      label="Period end date"
                      value={toDate}
                      onChange={setToDate}
                    />
                  </div>
                </div>
              </div>
              <div className="flex justify-end">
                <RadioGroup
                  name="dailyInvoiceStatus"
                  value={invoiceStatus}
                  onChange={setInvoiceStatus}
                  className="w-28.75"
                  options={[
                    { value: "Not-Invoiced", label: "Not-Invoiced" },
                    { value: "Invoiced", label: "Invoiced" },
                    { value: "All", label: "All" },
                  ]}
                />
              </div>
            </div>

            <div className="grid min-h-19 grid-cols-[minmax(0,1fr)_220px] items-center gap-x-3">
              <div className="grid min-w-0 grid-cols-[125px_minmax(0,1fr)] items-center gap-x-3">
                <RadioGroup
                  name="dailyDetailMode"
                  value={detailMode}
                  onChange={setDetailMode}
                  className="h-17.5"
                  options={[
                    { value: "Detail", label: "Detail" },
                    { value: "Summary", label: "Summary" },
                  ]}
                />
                <div className="flex min-w-0 items-center gap-2">
                  <ActionButton onClick={handlePrint}>
                    <u>P</u>rint
                  </ActionButton>
                  <ActionButton onClick={handleClose}>Close</ActionButton>
                  <label className="flex cursor-pointer items-center gap-1 whitespace-nowrap text-[12px] text-[#30465d]">
                    <input
                      type="checkbox"
                      checked={onlyAmexTickets}
                      onChange={(event) =>
                        setOnlyAmexTickets(event.target.checked)
                      }
                      className="accent-emerald-500"
                    />
                    Only Amex Tickets
                  </label>
                </div>
              </div>
              <div />
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default RptDailyPage;
