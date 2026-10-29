import React, { useRef, useState } from "react";
import Select from "react-select";

/* =====================================================================
   FILE MAP
   1. Types, constants and sample options
   2. Shared building blocks
   3. Parts : TabBar, ImportPanel, ExportPanel, StatusLine, Actions
   4. BspBillImportExportPage : owns the state and renders the parts
   ===================================================================== */

/* ---------------------------------------------------------------------
   1. TYPES, CONSTANTS AND SAMPLE OPTIONS
   --------------------------------------------------------------------- */
type Option = { value: string; label: string };

type TabName = "Import" | "Export";

type Status =
  | { kind: "idle" }
  | { kind: "running"; text: string }
  | { kind: "done"; text: string }
  | { kind: "error"; text: string };

/* Replace these with data from your API */
const iataOptions: Option[] = [
  { value: "KHOBAR", label: "KHOBAR" },
  { value: "JEDDAH", label: "JEDDAH" },
  { value: "RIYADH", label: "RIYADH" },
];

const currentYear = new Date().getFullYear();
const yearOptions: Option[] = Array.from({ length: 6 }, (_, index) => {
  const value = String(currentYear - index);
  return { value, label: value };
});

const monthNames = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];
const monthOptions: Option[] = monthNames.map((name, index) => ({
  value: String(index + 1),
  label: name,
}));

const periodOptions: Option[] = ["1", "2", "3", "4"].map((v) => ({
  value: v,
  label: v,
}));

type ImportRequest = { path: string; file: File | null };

type ExportRequest = {
  iata: string;
  year: string;
  month: string;
  period: string;
};

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

/** single react-select with a label above it */
const LabeledCombo: React.FC<{
  id: string;
  label: string;
  options: Option[];
  value: string | null;
  onChange: (value: string | null) => void;
  disabled?: boolean;
  className?: string;
}> = ({
  id,
  label,
  options,
  value,
  onChange,
  disabled = false,
  className = "",
}) => (
  <div className={`flex min-w-0 flex-col gap-1 ${className}`}>
    <label htmlFor={id} className="text-[12px] text-[#405066]">
      {label}
    </label>
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

/* ---------------------------------------------------------------------
   3. PARTS
   --------------------------------------------------------------------- */

/* 3a. Tabs. The active tab joins the panel below it. */
const tabs: TabName[] = ["Import", "Export"];

const TabBar: React.FC<{
  active: TabName;
  onChange: (tab: TabName) => void;
  disabled: boolean;
}> = ({ active, onChange, disabled }) => {
  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (disabled) return;
    if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
      event.preventDefault();
      onChange(active === "Import" ? "Export" : "Import");
    }
  };

  return (
    <div
      role="tablist"
      aria-label="BSP bill"
      onKeyDown={handleKeyDown}
      className="flex items-end gap-1 pl-2 -ml-2"
    >
      {tabs.map((tab) => {
        const selected = tab === active;
        return (
          <button
            key={tab}
            id={`tab${tab}`}
            type="button"
            role="tab"
            aria-selected={selected}
            aria-controls={`panel${tab}`}
            tabIndex={selected ? 0 : -1}
            disabled={disabled && !selected}
            onClick={() => onChange(tab)}
            className={`-mb-px rounded-t-sm border px-4 text-[12px] outline-none focus-visible:ring-1 focus-visible:ring-[#91a7b9] disabled:cursor-not-allowed ${
              selected
                ? "h-7 border-[#B7ECD0] border-b-white bg-white text-[#24364d]"
                : "h-6.25 border-[#d5dce2] bg-[#f2f8f4] text-[#405066] hover:bg-[#e7f7ed]"
            }`}
          >
            {tab}
          </button>
        );
      })}
    </div>
  );
};

/* 3b. Import tab: BSP Bill path (with the browse button inside the box)
   and the progress bar. */
const ImportPanel: React.FC<{
  path: string;
  onPathChange: (value: string) => void;
  onFileChosen: (file: File | null) => void;
  progress: number;
  running: boolean;
  onEnter: () => void;
}> = ({ path, onPathChange, onFileChosen, progress, running, onEnter }) => {
  const fileRef = useRef<HTMLInputElement>(null);

  return (
    <div className="flex flex-col gap-6 pt-6">
      <div className="flex items-center gap-3">
        <label
          htmlFor="txtBspBill"
          className="shrink-0 whitespace-nowrap text-right text-[12px] text-[#405066]"
        >
          BSP Bill :
        </label>

        {/* the browse button sits inside the box, at its right edge */}
        <div className="relative min-w-0 flex-1">
          <input
            id="txtBspBill"
            type="text"
            value={path}
            disabled={running}
            onChange={(event) => onPathChange(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") onEnter();
            }}
            className="h-7.5 w-full rounded-sm border border-[#cfd7df] bg-white py-0 pl-2 pr-9 text-[12px] text-[#24364d] outline-none focus:border-[#91a7b9] disabled:bg-[#f6f8fa]"
          />
          <button
            id="btnBrowse"
            type="button"
            aria-label="Browse"
            title="Browse"
            disabled={running}
            onClick={() => fileRef.current?.click()}
            className="absolute right-1 top-1/2 flex h-5.5 w-7 -translate-y-1/2 items-center justify-center rounded-[3px] pb-1 text-[17px] leading-none text-[#405066] hover:bg-[#eef3f7] disabled:cursor-not-allowed disabled:opacity-60"
          >
            &hellip;
          </button>
          <input
            ref={fileRef}
            type="file"
            tabIndex={-1}
            aria-hidden="true"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0] ?? null;
              onFileChosen(file);
              event.target.value = ""; // allows choosing the same file again
            }}
          />
        </div>
      </div>

      {/* progress bar */}
      <div
        role="progressbar"
        aria-label="Import progress"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(progress)}
        className="h-5 w-full overflow-hidden border border-[#cfd7df] bg-[#f2f5f8]"
      >
        <div
          className="h-full bg-[#9fdfbc] transition-[width] duration-200"
          style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
        />
      </div>
    </div>
  );
};

/* 3c. Export tab: IATA #, Year, Month, Period with labels above the boxes */
const ExportPanel: React.FC<{
  values: {
    iata: string | null;
    year: string | null;
    month: string | null;
    period: string | null;
  };
  onChange: (
    key: "iata" | "year" | "month" | "period",
    value: string | null,
  ) => void;
  disabled: boolean;
}> = ({ values, onChange, disabled }) => (
  <div className="flex flex-wrap items-start justify-center gap-x-1.5 gap-y-3 pt-8">
    <LabeledCombo
      id="lkpIata"
      label="IATA #"
      options={iataOptions}
      value={values.iata}
      onChange={(v) => onChange("iata", v)}
      disabled={disabled}
      className="w-32.5"
    />
    <LabeledCombo
      id="lkpYear"
      label="Year"
      options={yearOptions}
      value={values.year}
      onChange={(v) => onChange("year", v)}
      disabled={disabled}
      className="w-25"
    />
    <LabeledCombo
      id="lkpMonth"
      label="Month"
      options={monthOptions}
      value={values.month}
      onChange={(v) => onChange("month", v)}
      disabled={disabled}
      className="w-37.5"
    />
    <LabeledCombo
      id="lkpPeriod"
      label="Period"
      options={periodOptions}
      value={values.period}
      onChange={(v) => onChange("period", v)}
      disabled={disabled}
      className="w-18"
    />
  </div>
);

/* 3d. Status message under the panel content */
const StatusLine: React.FC<{ status: Status }> = ({ status }) => (
  <div aria-live="polite" className="mt-4 min-h-4.5 text-[12px]">
    {status.kind === "running" && (
      <span className="text-[#405066]">{status.text}</span>
    )}
    {status.kind === "done" && (
      <span className="text-[#2e8b57]">{status.text}</span>
    )}
    {status.kind === "error" && (
      <span role="alert" className="text-[#c0392b]">
        {status.text}
      </span>
    )}
  </div>
);

/* 3e. Button bar: Import is active on the Import tab, Export on the Export tab */
const Actions: React.FC<{
  tab: TabName;
  running: boolean;
  onImport: () => void;
  onExport: () => void;
  onClose: () => void;
}> = ({ tab, running, onImport, onExport, onClose }) => (
  <div className="mt-5 flex justify-center gap-3">
    <button
      id="btnImport"
      type="button"
      onClick={onImport}
      disabled={tab !== "Import" || running}
      className="btn-style disabled:cursor-not-allowed disabled:opacity-50"
    >
      <u>I</u>mport
    </button>
    <button
      id="btnExport"
      type="button"
      onClick={onExport}
      disabled={tab !== "Export" || running}
      className="btn-style disabled:cursor-not-allowed disabled:opacity-50"
    >
      <u>E</u>xport
    </button>
    <button
      id="btnClose"
      type="button"
      onClick={onClose}
      disabled={running}
      className="btn-style disabled:cursor-not-allowed disabled:opacity-50"
    >
      <u>C</u>lose
    </button>
  </div>
);

/* ---------------------------------------------------------------------
   4. MAIN PAGE : owns the state and renders the parts
   --------------------------------------------------------------------- */
type BspBillImportExportPageProps = {
  /** Run the import on your server. Call report(0-100) to move the bar.
      Throw an Error to show its message. */
  onImport?: (
    request: ImportRequest,
    report: (percent: number) => void,
  ) => Promise<void> | void;
  /** Run the export on your server. Throw an Error to show its message. */
  onExport?: (request: ExportRequest) => Promise<void> | void;
  onClose?: () => void;
};

const BspBillImportExportPage: React.FC<BspBillImportExportPageProps> = ({
  onImport,
  onExport,
  onClose,
}) => {
  const [tab, setTab] = useState<TabName>("Import");
  const [status, setStatus] = useState<Status>({ kind: "idle" });

  // import tab
  const [path, setPath] = useState(""); // txtBspBill
  const [file, setFile] = useState<File | null>(null);
  const [progress, setProgress] = useState(0);

  // export tab
  const [exportValues, setExportValues] = useState<{
    iata: string | null;
    year: string | null;
    month: string | null;
    period: string | null;
  }>({ iata: null, year: null, month: null, period: null });

  const running = status.kind === "running";

  const changeTab = (next: TabName) => {
    setTab(next);
    setStatus({ kind: "idle" });
  };

  const handleImport = async () => {
    if (!path.trim()) {
      setStatus({ kind: "error", text: "Choose the BSP bill file to import." });
      return;
    }
    setProgress(0);
    setStatus({ kind: "running", text: "Importing…" });
    try {
      if (onImport) {
        await onImport({ path: path.trim(), file }, setProgress);
      } else {
        console.log("import", { path: path.trim(), file });
      }
      setProgress(100);
      setStatus({ kind: "done", text: "Import completed." });
    } catch (error) {
      setStatus({
        kind: "error",
        text: error instanceof Error ? error.message : "Import failed.",
      });
    }
  };

  const handleExport = async () => {
    const { iata, year, month, period } = exportValues;
    if (!iata || !year || !month || !period) {
      setStatus({
        kind: "error",
        text: "Select the IATA #, year, month and period.",
      });
      return;
    }
    setStatus({ kind: "running", text: "Exporting…" });
    try {
      const request: ExportRequest = { iata, year, month, period };
      if (onExport) await onExport(request);
      else console.log("export", request);
      setStatus({ kind: "done", text: "Export completed." });
    } catch (error) {
      setStatus({
        kind: "error",
        text: error instanceof Error ? error.message : "Export failed.",
      });
    }
  };

  const handleClose = () => {
    setTab("Import");
    setPath("");
    setFile(null);
    setProgress(0);
    setExportValues({ iata: null, year: null, month: null, period: null });
    setStatus({ kind: "idle" });
    onClose?.();
  };

  return (
    <div className="flex min-h-screen w-full items-start justify-center bg-white px-4 py-4">
      <div className="min-h-fit w-175 max-w-full bg-white p-0">
        <main className="w-full overflow-hidden border border-[#d5dce2] bg-white">
          <header className="flex h-7.5 items-center justify-start bg-[#9fdfbc]">
            <h1 className="m-0 ml-3.5 text-[17px] font-semibold text-[#24364d]">
              BSP Bill Import/Export
            </h1>
          </header>

          <section className="px-3.5 pb-6 pt-3">
            <TabBar active={tab} onChange={changeTab} disabled={running} />

            <div
              id={`panel${tab}`}
              role="tabpanel"
              aria-labelledby={`tab${tab}`}
              className="min-h-42.5 border border-[#B7ECD0] bg-white px-4 pb-4"
            >
              {tab === "Import" ? (
                <ImportPanel
                  path={path}
                  onPathChange={(value) => {
                    setPath(value);
                    setFile(null); // a typed path replaces the chosen file
                    setStatus({ kind: "idle" });
                  }}
                  onFileChosen={(chosen) => {
                    if (chosen) {
                      setPath(chosen.name);
                      setFile(chosen);
                      setStatus({ kind: "idle" });
                    }
                  }}
                  progress={progress}
                  running={running}
                  onEnter={handleImport}
                />
              ) : (
                <ExportPanel
                  values={exportValues}
                  onChange={(key, value) => {
                    setExportValues((prev) => ({ ...prev, [key]: value }));
                    setStatus({ kind: "idle" });
                  }}
                  disabled={running}
                />
              )}

              <StatusLine status={status} />
            </div>

            <Actions
              tab={tab}
              running={running}
              onImport={handleImport}
              onExport={handleExport}
              onClose={handleClose}
            />
          </section>
        </main>
      </div>
    </div>
  );
};

export default BspBillImportExportPage;