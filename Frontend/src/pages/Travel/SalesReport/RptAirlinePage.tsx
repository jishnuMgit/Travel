
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

type RadioOption = {
  value: string;
  label: string;
};

/* Radio group with green selected indicator */
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

/* Date picker with calendar button contained within the input */
const AppDatePicker: React.FC<{
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
}> = ({ id, label, value, onChange }) => (
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
      textField: {
        id,
        size: "small",
      },
      openPickerButton: {
        sx: {
          width: "22px",
          height: "26px",
          padding: 0,
          margin: 0,
        },
        "aria-label": `Choose ${label}`,
      },
      inputAdornment: {
        position: "end",
        sx: {
          margin: 0,
          padding: 0,
          height: "26px",
          maxHeight: "26px",
        },
      },
    }}
    sx={{
      width: 140,
      minWidth: 0,
      "& .MuiPickersTextField-root": {
        width: "100%",
      },
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
      "& .MuiSvgIcon-root": {
        fontSize: "15px",
      },
      "& .MuiPickersOutlinedInput-notchedOutline": {
        borderColor: "#B7C7D7",
      },
      "& .MuiPickersInputBase-root:hover .MuiPickersOutlinedInput-notchedOutline":
        {
          borderColor: "#91b8e0",
        },
      "& .MuiPickersInputBase-root.Mui-focused .MuiPickersOutlinedInput-notchedOutline":
        {
          borderColor: "#A0DFBD",
          borderWidth: "1px",
        },
    }}
  />
);

/* Period label */
const FieldLabel: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => (
  <div className="flex h-7 items-center justify-end rounded-xs border border-[#d9e1e9] bg-[#fafbfc] px-2 text-[12px] text-[#40566d]">
    {children}
  </div>
);

/* Order By radio group */
const AirlineOrderGroup: React.FC<{
  value: string;
  onChange: (value: string) => void;
}> = ({ value, onChange }) => (
  <fieldset className="m-0 min-w-0 absolute bottom-7 right-40 rounded-[3px] border border-[#d9e1e9] bg-white px-1.75 pb-1.5 pt-0.5">
    <legend className="px-1 text-[12px] text-[#40566d]">
      Order By
    </legend>

    <div className="flex flex-col gap-1.25">
      {[
        { value: "Airline No.", label: "Airline No." },
        { value: "Billing Amt.", label: "Billing Amt." },
      ].map((option) => (
        <label
          key={option.value}
          className="flex cursor-pointer select-none items-center gap-1.25 whitespace-nowrap"
        >
          <input
            type="radio"
            name="airlineOrder"
            value={option.value}
            checked={value === option.value}
            onChange={() => onChange(option.value)}
            className="accent-emerald-500"
          />

          <span className="text-[12px] leading-4.25 text-[#30465d]">
            {option.label}
          </span>
        </label>
      ))}
    </div>
  </fieldset>
);

/* Print and Close buttons */
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

const RptAirlinePage: React.FC = () => {
  const [rdgbranch, setrdgbranch] = useState("One Branch");
  const [branch, setBranch] = useState<Option | null>(
    branchOptions[0],
  );

  const [rdgairline, setrdgairline] = useState("One Airline");
  const [airlineId, setAirlineId] = useState<Option | null>(null);
  const [airlineName, setAirlineName] = useState<Option | null>(null);

  const [fromDate, setFromDate] = useState("01/10/2026");
  const [toDate, setToDate] = useState(
    dayjs().format(DATE_FORMAT),
  );

  const [rdgDetSum, setrdgDetSum] = useState("Summary");
  const [rdgSR, setrdgSR] = useState("Sales");
  const [rdginvoiced, setrdginvoiced] = useState("Invoiced");
  const [rdgDI, setrdgDI] = useState("All");
  const [orderBy, setOrderBy] = useState("Airline No.");

  const handlePrint = () => {
    console.log("Airline Sales Report:", {
      rdgbranch,
      branch: rdgbranch === "One Branch" ? branch : null,
      rdgairline,
      airlineId:
        rdgairline === "One Airline" ? airlineId : null,
      airlineName:
        rdgairline === "One Airline" ? airlineName : null,
      fromDate,
      toDate,
      rdgDetSum,
      rdgSR,
      rdginvoiced,
      rdgDI,
      orderBy,
    });

    // Connect your existing report/print API here.
  };

  const handleClose = () => {
    window.history.back();
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <div className="min-h-screen w-full bg-white p-1.5 ">
        <main className="mx-auto h-fit w-full max-w-220 relative overflow-visible rounded-[3px] border border-[#9ca9b8] bg-white shadow-sm">
          <Header Name="Airline Sales" />

          <section className="px-4.25 pb-3.5 pt-2.5">
            {/* Two main sections: left controls and right filters */}
            <div className="grid grid-cols-[minmax(0,1fr)_125px] items-start gap-x-3.5">
              {/* LEFT SECTION */}
              <div className="flex min-w-0 flex-col gap-2.5">
                {/* Branch */}
                <div className="grid min-h-17.5 grid-cols-[125px_minmax(0,1fr)] items-center gap-x-3">
                  <RadioGroup
                    name="rdgbranch"
                    value={rdgbranch}
                    onChange={setrdgbranch}
                    className="min-h-17.5"
                    options={[
                      { value: "One Branch", label: "One Branch" },
                      { value: "All Branch", label: "All Branch" },
                    ]}
                  />

                  <div className="w-55 max-w-full">
                    <Select
                      inputId="lpkBranch"
                      options={branchOptions}
                      value={branch}
                      onChange={setBranch}
                      isDisabled={rdgbranch !== "One Branch"}
                      {...fieldSelectProps}
                    />
                  </div>
                </div>

                {/* Airline */}
                <div className="grid min-h-17.5 grid-cols-[125px_minmax(0,1fr)] items-center gap-x-3">
                  <RadioGroup
                    name="rdgairline"
                    value={rdgairline}
                    onChange={setrdgairline}
                    className="min-h-17.5"
                    options={[
                      { value: "One Airline", label: "One Airline" },
                      { value: "All Airline", label: "All Airline" },
                    ]}
                  />

                  <div className="grid min-w-0 grid-cols-[120px_minmax(0,1fr)] gap-1.25">
                    <Select
                      inputId="lkpairlineId"
                      options={airlineIdOptions}
                      value={airlineId}
                      isDisabled={rdgairline !== "One Airline"}
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

                    <Select
                      inputId="lkpairlineName"
                      options={airlineNameOptions}
                      value={airlineName}
                      isDisabled={rdgairline !== "One Airline"}
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
                </div>

                {/* Period */}
                <div className="grid grid-cols-[125px_minmax(0,1fr)] items-center gap-x-3 ">
                  <FieldLabel>Period :</FieldLabel>

                  <div className="flex min-w-0 grid-cols-2 gap-2.5">
                    <AppDatePicker
                      id="dtpFromDate"
                      label="Period start date"
                      value={fromDate}
                      onChange={setFromDate}
                    />

                    <AppDatePicker
                      id="dtpToDate"
                      label="Period end date"
                      value={toDate}
                      onChange={setToDate}
                    />
                  </div>
                </div>

                {/* Detail and buttons */}
                <div className="grid grid-cols-[125px_minmax(0,1fr)] items-center gap-x-3">
                  <RadioGroup
                    name="rdgDetSum"
                    value={rdgDetSum}
                    onChange={setrdgDetSum}
                    className="min-h-17.5"
                    options={[
                      { value: "Detail", label: "Detail" },
                      { value: "Summary", label: "Summary" },
                    ]}
                  />

                  <div className="flex flex-wrap items-center justify-center gap-2 mt-10">
                    <ActionButton onClick={handlePrint}>
                      <u>P</u>rint
                    </ActionButton>

                    <ActionButton onClick={handleClose}>
                      Close
                    </ActionButton>
                  </div>
                </div>
              </div>

              {/* RIGHT SECTION */}
              <div className="flex min-w-0 flex-col items-stretch gap-2">
                {/* Sales / Refund / Net */}
                <RadioGroup
                  name="rdgSR"
                  value={rdgSR}
                  onChange={setrdgSR}
                  className="min-h-20.75"
                  options={[
                    { value: "Sales", label: "Sales" },
                    { value: "Refund", label: "Refund" },
                    { value: "Net", label: "Net" },
                  ]}
                />

                {/* Invoice Status */}
                <RadioGroup
                  name="rdginvoiced"
                  value={rdginvoiced}
                  onChange={setrdginvoiced}
                  className="min-h-20.75"
                  options={[
                    { value: "Not-Invoiced", label: "Not-Invoiced" },
                    { value: "Invoiced", label: "Invoiced" },
                    { value: "All", label: "All" },
                  ]}
                />

                {/* Domestic / International */}
                <RadioGroup
                  name="rdgDI"
                  value={rdgDI}
                  onChange={setrdgDI}
                  className="min-h-20.75"
                  options={[
                    { value: "Domestic", label: "Domestic" },
                    { value: "International", label: "International" },
                    { value: "All", label: "All" },
                  ]}
                />

                {/* Order By: directly under Domestic / International */}
                <AirlineOrderGroup
                  value={orderBy}
                  onChange={setOrderBy}
                />
              </div>
            </div>
          </section>
        </main>
      </div>
    </LocalizationProvider>
  );
};

export default RptAirlinePage;
