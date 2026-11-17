import React, { useEffect, useRef, useState } from "react";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";
import { MdAttachFile } from "react-icons/md";
import { toast } from "react-toastify";
import Header from "../../../components/common/Header";
import CustomLinkedPairSelect, {
  type PairSelectOption,
} from "../../../components/common/CustomLinkedPairSelect";

dayjs.extend(customParseFormat);

/* ------------------------------------------------------------------ */
/* Types & constants                                                   */
/* ------------------------------------------------------------------ */

type Option = { value: string; label: string };

type InvoiceRow = {
  key: number;
  /** Read-only columns, filled by the search. */
  brId: string;
  entryNo: string;
  di: string;
  date: string;
  checkOut: string;
  supplierAccountName: string;
  confirmationNo: string;
  pVat: number | null;
  supplierAmt: number | null;
  /** Editable columns. */
  supInvNo: string;
  supInvDate: string;
  lkpSupplierName: string;
  file: File | null;
};

type SearchFilters = {
  lkpSupplierId: string;
  rdgperiod: "Service Period" | "Sales Period";
  rdgupdateStatus: "Updated" | "Not Updated" | "All";
  dtpfromDate: string;
  dtpToDate: string;
};

type SupplierInvoiceAttachPageProps = {
  onClose?: () => void;
  /** Replace with your API call. Must return the rows for the filters. */
  onSearch?: (filters: SearchFilters) => Promise<Omit<InvoiceRow, "key" | "supInvNo" | "supInvDate" | "lkpSupplierName" | "file">[]>;
  onSave?: (rows: InvoiceRow[]) => void | Promise<void>;
};

const DATE_FORMAT = "DD/MM/YYYY";
const TODAY = dayjs().format(DATE_FORMAT);
const MIN_ROWS = 20;

let keyCounter = 0;
const nextKey = () => ++keyCounter;

const lkpSupplierIdOptions: Option[] = [
  { value: "510TOR", label: "510TOR" },
  { value: "510HOT", label: "510HOT" },
];

const lkpSupplierNameOptions: Option[] = [
  { value: "510TOR", label: "TOURS ( ALL HOTELS )" },
  { value: "510HOT", label: "HOTELS ( ALL )" },
];

const supplierPairOptions: PairSelectOption[] = lkpSupplierIdOptions.map((id) => ({
  value: id.value,
  firstLabel: id.label,
  secondLabel: lkpSupplierNameOptions.find((item) => item.value === id.value)?.label ?? "",
}));

const emptyRow = (): InvoiceRow => ({
  key: nextKey(),
  brId: "",
  entryNo: "",
  di: "",
  date: "",
  checkOut: "",
  supplierAccountName: "",
  confirmationNo: "",
  pVat: null,
  supplierAmt: null,
  supInvNo: "",
  supInvDate: "",
  lkpSupplierName: "",
  file: null,
});

const isEmptyRow = (row: InvoiceRow) => !row.entryNo;

const padRows = (rows: InvoiceRow[]): InvoiceRow[] => {
  const result = [...rows];
  while (result.length < MIN_ROWS) result.push(emptyRow());
  return result;
};

const formatAmount = (value: number | null) =>
  value === null
    ? ""
    : value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

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

const thClass =
  "h-[30px] border border-[#B7ECD0] bg-[#E7F7ED] px-2 font-normal text-[#405066] whitespace-nowrap";
const tdReadonly =
  "border border-[#B7ECD0] bg-[#f1f3f5] px-2 py-1 whitespace-nowrap overflow-hidden text-ellipsis";

/* ------------------------------------------------------------------ */
/* Small shared pieces (same look as the report page)                  */
/* ------------------------------------------------------------------ */

const CustomRadio: React.FC<{
  name: string;
  value: string;
  label: string;
  checked: boolean;
  onChange: () => void;
}> = ({ name, value, label, checked, onChange }) => (
  <label className="flex cursor-pointer items-center gap-1.25 whitespace-nowrap select-none">
    <input
      type="radio"
      name={name}
      value={value}
      checked={checked}
      onChange={onChange}
      className="sr-only"
    />
    <span
      className={`flex h-4.75 w-4.75 shrink-0 items-center justify-center rounded-full border ${
        checked ? "border-[#4ade80]" : "border-[#c3cbd3]"
      } bg-white`}
    >
      {checked && <span className="h-2.25 w-2.25 rounded-full bg-[#4ade80]" />}
    </span>
    <span className="text-[12px] leading-4.25 text-[#172b43]">{label}</span>
  </label>
);

const RadioPanel: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className = "",
}) => (
  <div
    className={`flex border border-gray-300 rounded-sm bg-white px-1.75 py-1.75 ${className}`}
  >
    {children}
  </div>
);

const LabelBox: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="flex h-7.5 w-28 shrink-0 items-center justify-end border border-gray-300 bg-[#FAFBFC] px-1.75">
    <span className="text-[12px] text-[#172b43]">{children}</span>
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
        "& .MuiPickersInputBase-sectionContent": { fontSize: "12px", color: "#344054" },
        "& .MuiPickersInputBase-input": {
          minWidth: 0,
          width: "100%",
          fontSize: "12px",
          padding: 0,
          height: "28px",
          boxSizing: "border-box",
        },
        "& .MuiInputAdornment-root": { margin: 0, padding: 0 },
        "& .MuiIconButton-root": { width: "22px", height: "22px", padding: "2px", margin: 0 },
        "& .MuiSvgIcon-root": { fontSize: "15px" },
        ...(!value && {
          "&:not(:focus-within) .MuiPickersInputBase-sectionsContainer *": {
            color: "transparent",
          },
        }),
        "& .MuiPickersOutlinedInput-notchedOutline": { borderColor: "#B7C7D7 !important" },
        "& .MuiPickersInputBase-root:hover .MuiPickersOutlinedInput-notchedOutline": {
          borderColor: "#B7C7D7 !important",
        },
        "& .MuiPickersInputBase-root.Mui-focused .MuiPickersOutlinedInput-notchedOutline": {
          borderColor: "#B7C7D7 !important",
          borderWidth: "1px",
        },
        "& .MuiPickersInputBase-root.Mui-error .MuiPickersOutlinedInput-notchedOutline": {
          borderColor: "#B7C7D7 !important",
        },
      }}
    />
  </LocalizationProvider>
);

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

const SupplierInvoiceAttachPage: React.FC<SupplierInvoiceAttachPageProps> = ({
  onClose,
  onSearch,
  onSave,
}) => {
  const [lkpSupplierId, setlkpSupplierId] = useState<Option | null>(lkpSupplierIdOptions[0]);
  const [lkpSupplierName, setlkpSupplierName] = useState<Option | null>(lkpSupplierNameOptions[0]);
  const [rdgperiod, setrdgperiod] = useState<SearchFilters["rdgperiod"]>("Service Period");
  const [rdgupdateStatus, setrdgupdateStatus] = useState<SearchFilters["rdgupdateStatus"]>("Not Updated");
  const [dtpfromDate, setdtpfromDate] = useState(TODAY);
  const [dtpToDate, setdtpToDate] = useState(TODAY);

  const [rows, setRows] = useState<InvoiceRow[]>(() => padRows([]));
  const [selectedKey, setSelectedKey] = useState<number | null>(rows[0]?.key ?? null);
  const [searching, setSearching] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);
  const pickingKeyRef = useRef<number | null>(null);

  // Clear any stale error when the filters change.
  useEffect(() => setError(""), [lkpSupplierId, rdgperiod, rdgupdateStatus, dtpfromDate, dtpToDate]);

  const updateRow = (key: number, patch: Partial<InvoiceRow>) =>
    setRows((previous) => previous.map((row) => (row.key === key ? { ...row, ...patch } : row)));

  const handleSearch = async () => {
    if (!lkpSupplierId) {
      setError("Select a supplier.");
      return;
    }
    if (dayjs(dtpfromDate, DATE_FORMAT).isAfter(dayjs(dtpToDate, DATE_FORMAT))) {
      setError("Period start date cannot be after the end date.");
      return;
    }

    setSearching(true);
    setError("");
    try {
      const data = onSearch
        ? await onSearch({
            lkpSupplierId: lkpSupplierId.value,
            rdgperiod,
            rdgupdateStatus,
            dtpfromDate,
            dtpToDate,
          })
        : [];
      const mapped: InvoiceRow[] = data.map((item) => ({
        ...emptyRow(),
        ...item,
      }));
      const next = padRows(mapped);
      setRows(next);
      setSelectedKey(next[0]?.key ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load supplier invoices.");
    } finally {
      setSearching(false);
    }
  };

  const openFilePicker = (row: InvoiceRow) => {
    if (isEmptyRow(row)) return;
    pickingKeyRef.current = row.key;
    setSelectedKey(row.key);
    fileInputRef.current?.click();
  };

  const handleFileChosen = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    const key = pickingKeyRef.current;
    event.target.value = "";
    pickingKeyRef.current = null;
    if (file && key !== null) updateRow(key, { file });
  };

  const handleSave = async () => {
    const changed = rows.filter(
      (row) => !isEmptyRow(row) && (row.supInvNo.trim() || row.supInvDate || row.lkpSupplierName.trim() || row.file),
    );

    if (changed.length === 0) {
      toast.error("Enter supplier invoice details before saving.");
      return;
    }
    if (changed.some((row) => !row.supInvNo.trim())) {
      toast.error("Sup. Inv. No. is required for every row you edit.");
      return;
    }

    setSaving(true);
    try {
      await onSave?.(changed);
      toast.success("Saved successfully");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Unable to save supplier invoices.");
    } finally {
      setSaving(false);
    }
  };

  const handleClear = () => {
    const fresh = padRows([]);
    setRows(fresh);
    setSelectedKey(fresh[0].key);
    setError("");
  };

  const firstEmptyKey = rows.find((row) => isEmptyRow(row))?.key ?? null;

  return (
    <div className="flex min-h-full w-full items-start justify-center bg-white px-4 py-4">
      <div className="min-h-fit w-350 max-w-full min-w-340 bg-white p-0">
        <main className="w-full overflow-hidden border border-gray-400 bg-white">
          <Header Name="Tourism Supplier Invoice Attach" />

          <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileChosen} />

          {/* Filters */}
          <section className="flex flex-wrap items-start gap-x-3 gap-y-2 px-3.5 pt-3.5">
            <div className="flex flex-col gap-1.5">
              <div className="flex items-start gap-1">
                <LabelBox>Supplier :</LabelBox>
                <CustomLinkedPairSelect
                  firstInputId="lkpSupplierId"
                  secondInputId="lkpSupplierName"
                  options={supplierPairOptions}
                  firstValue={lkpSupplierId?.value ?? null}
                  secondValue={lkpSupplierName?.value ?? null}
                  firstHeader="Supplier ID"
                  secondHeader="Supplier Name"
                  firstWidth={110}
                  secondWidth={400}
                  gap={4}
                  headerFontSize="12px"
                  onChange={(option) => {
                    setlkpSupplierId(
                      option ? { value: option.value, label: option.firstLabel } : null,
                    );
                    setlkpSupplierName(
                      option ? { value: option.value, label: option.secondLabel } : null,
                    );
                  }}
                />
              </div>

              <div className="flex items-center gap-1">
                <LabelBox>Period :</LabelBox>
                <div className="w-36.5">
                  <AppDatePicker
                    id="dtpdtpfromDate"
                    label="Period start date"
                    value={dtpfromDate}
                    onChange={setdtpfromDate}
                  />
                </div>
                <div className="w-36.5">
                  <AppDatePicker
                    id="dtpdtpToDate"
                    label="Period end date"
                    value={dtpToDate}
                    onChange={setdtpToDate}
                  />
                </div>
              </div>
            </div>

            <div className="flex flex-col items-start gap-1.5">
              <RadioPanel className="h-9.5 items-center gap-5 px-3">
                <CustomRadio
                  name="rdgrdgperiod"
                  value="Service Period"
                  label="Service Period"
                  checked={rdgperiod === "Service Period"}
                  onChange={() => setrdgperiod("Service Period")}
                />
                <CustomRadio
                  name="rdgrdgperiod"
                  value="Sales Period"
                  label="Sales Period"
                  checked={rdgperiod === "Sales Period"}
                  onChange={() => setrdgperiod("Sales Period")}
                />
              </RadioPanel>
              <button
                id="btnSearch"
                type="button"
                disabled={searching}
                onClick={() => void handleSearch()}
                className="btn-style ml-3 min-w-20 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {searching ? "Searching..." : <><u>S</u>earch</>}
              </button>
            </div>

            <RadioPanel className="h-9.5 items-center gap-6 px-3">
              <CustomRadio
                name="rdgUpdate"
                value="Updated"
                label="Updated"
                checked={rdgupdateStatus === "Updated"}
                onChange={() => setrdgupdateStatus("Updated")}
              />
              <CustomRadio
                name="rdgUpdate"
                value="Not Updated"
                label="Not Updated"
                checked={rdgupdateStatus === "Not Updated"}
                onChange={() => setrdgupdateStatus("Not Updated")}
              />
              <CustomRadio
                name="rdgUpdate"
                value="All"
                label="All"
                checked={rdgupdateStatus === "All"}
                onChange={() => setrdgupdateStatus("All")}
              />
            </RadioPanel>
          </section>

          {/* Grid */}
          <section className="px-3.5 pb-3 pt-3">
            <div
              className={`max-h-[min(540px,calc(100vh-300px))] overflow-auto border border-[#B7ECD0] bg-white ${niceScrollbar}`}
            >
              <table className="w-full min-w-275 table-fixed border-collapse text-[13px] text-[#24364d]">
                <colgroup>
                  <col className="w-5.5" />
                  <col className="w-15" />
                  <col className="w-25" />
                  <col className="w-9" />
                  <col className="w-24" />
                  <col className="w-24" />
                  <col className="" />
                  <col className="w-30" />
                  <col className="w-20" />
                  <col className="w-24" />
                  <col className="w-35" />
                  <col className="w-24" />
                  <col className="w-38" />
                  <col className="w-16" />
                </colgroup>
                <thead className="sticky top-0 z-10">
                  <tr>
                    <th className={thClass} />
                    <th id="txtBRID" className={`${thClass} text-left`}>Br. ID</th>
                    <th id="txtEntryNumber" className={`${thClass} text-left`}>Entry No.</th>
                    <th id="txtDI" className={`${thClass} text-left`}>D/I</th>
                    <th id="dtpDate" className={`${thClass} text-left`}>Date</th>
                    <th id="txtCheckOut" className={`${thClass} text-left`}>Check Out</th>
                    <th id="txtSupplierAccountName" className={`${thClass} text-left`}>Supplier Account Name</th>
                    <th id="txtConfirmationNumber" className={`${thClass} text-left`}>Confirmation No.</th>
                    <th id="txtPVat" className={`${thClass} text-right`}>P. VAT</th>
                    <th id="txtSupplierAmt" className={`${thClass} text-right`}>Supplier Amt.</th>
                    <th id="txtSupplierInvoiceNumber" className={`${thClass} text-left`}>Sup. Inv. No.</th>
                    <th id="dtpSupplierInvoiceDate" className={`${thClass} text-left`}>Sup. Inv. Date</th>
                    <th id="txtSupplierName" className={`${thClass} text-left`}>Supplier Name</th>
                    <th id="file" className={`${thClass} text-center`}>File</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => {
                    const selected = row.key === selectedKey;
                    const empty = isEmptyRow(row);
                    return (
                      <tr
                        key={row.key}
                        onClick={() => setSelectedKey(row.key)}
                        className={selected ? "bg-[#f2faf5]" : "bg-white"}
                      >
                        <td className="h-7.5 border border-[#B7ECD0] bg-[#fafbfc] text-center text-[10px] text-[#405066]">
                          {selected ? "▶" : row.key === firstEmptyKey ? "*" : ""}
                        </td>
                        <td className={tdReadonly}>{row.brId}</td>
                        <td className={tdReadonly}>{row.entryNo}</td>
                        <td className={tdReadonly}>{row.di}</td>
                        <td className={tdReadonly}>{row.date}</td>
                        <td className={tdReadonly}>{row.checkOut}</td>
                        <td className={tdReadonly} title={row.supplierAccountName}>
                          {row.supplierAccountName}
                        </td>
                        <td className={tdReadonly} title={row.confirmationNo}>
                          {row.confirmationNo}
                        </td>
                        <td className={`${tdReadonly} text-right`}>{formatAmount(row.pVat)}</td>
                        <td className={`${tdReadonly} text-right`}>{formatAmount(row.supplierAmt)}</td>

                        <td className="border border-[#B7ECD0] p-0">
                          <input
                            aria-label={`Supplier invoice number for ${row.entryNo || "row"}`}
                            // disabled={empty}
                            // maxLength={30}
                            // value={row.supInvNo}
                            // onFocus={() => setSelectedKey(row.key)}
                            // onChange={(event) => updateRow(row.key, { supInvNo: event.target.value })}
                            className="h-7.5 w-full bg-white px-2 text-[13px] outline-none focus:bg-[#E6F6F8] disabled:bg-white"
                          />
                        </td>

                        <td className="border border-[#B7ECD0] p-0.5">
                          {!empty && (
                            <AppDatePicker
                              id={`supInvDate-${row.key}`}
                              label={`Supplier invoice date for ${row.entryNo}`}
                              value={row.supInvDate}
                              onChange={(value) => updateRow(row.key, { supInvDate: value })}
                            />
                          )}
                        </td>

                        <td className="border border-[#B7ECD0] p-0">
                          <input
                            aria-label={`Supplier name for ${row.entryNo || "row"}`}
                            disabled={empty}
                            maxLength={60}
                            value={row.lkpSupplierName}
                            onFocus={() => setSelectedKey(row.key)}
                            onChange={(event) => updateRow(row.key, { lkpSupplierName: event.target.value })}
                            className="h-7.5 w-full bg-white px-2 text-[13px] outline-none focus:bg-[#E6F6F8] disabled:bg-white"
                          />
                        </td>

                        <td className="border border-[#B7ECD0] text-center">
                          <button
                            type="button"
                            disabled={empty}
                            title={row.file ? row.file.name : "Attach file"}
                            aria-label={`Attach file to ${row.entryNo || "row"}`}
                            onClick={(event) => {
                              event.stopPropagation();
                              openFilePicker(row);
                            }}
                            className={`inline-flex h-6.5 w-7.5 items-center justify-center rounded hover:bg-green-50 disabled:cursor-default disabled:opacity-40 ${
                              row.file ? "text-[#16a34a]" : "text-[#287a4b]"
                            }`}
                          >
                            <MdAttachFile size={17} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {error && (
              <p role="alert" className="mt-2 text-[13px] text-[#c0392b]">
                {error}
              </p>
            )}

            <div className="mt-5 flex justify-center gap-3">
              <button
                id="btnSave"
                type="button"
                disabled={saving}
                onClick={() => void handleSave()}
                className="btn-style disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? "Saving..." : <><u>S</u>ave</>}
              </button>
              <button id="btnClear" type="button" disabled={saving} onClick={handleClear} className="btn-style">
                Clear
              </button>
            
            </div>
          </section>
        </main>
      </div>
    </div>
  );
};

export default SupplierInvoiceAttachPage;