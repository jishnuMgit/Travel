import React, { useState } from "react";
import Select from "react-select";
import { toast } from "react-toastify";
import selectComponents from "../../../components/common/selectComponents";
import { fieldSelectProps } from "../../../components/common/Combo";
import { GRID_CELL_FOCUS_CLASS } from "../../../hooks/useGridCellFocus";

/* =====================================================================
   FILE MAP
   1. Types, constants, sample options (replace with your API data)
   2. Styles shared with the Budget / Staff / IATA pages
   3. SetIataGrid : IATA Code | IATA Name | Supplier (lookup) | Position
   4. SetIataPage : owns the state and renders the grid + Save / Clear

   Layout (from the sketch, table tblIATA):
     grid : IATA Code | IATA Name | Supplier (dropdown) | Position
     [Save] [Clear]
   ===================================================================== */

/* ---------------------------------------------------------------------
   1. TYPES, CONSTANTS AND SAMPLE OPTIONS
   --------------------------------------------------------------------- */
const MIN_ROWS = 8;

type SimpleOption = { value: string; label: string };

type IataLine = {
  key: number;
  code: string;
  name: string;
  supplier: string | null;
  position: string;
};

/* TODO: replace with the API list of suppliers (lookup) */
const SUPPLIER_OPTIONS: SimpleOption[] = [
  { value: "S001", label: "Amadeus" },
  { value: "S002", label: "Sabre" },
  { value: "S003", label: "Galileo" },
  { value: "S004", label: "Travelport" },
];

let keyCounter = 0;
const nextKey = () => ++keyCounter;

const emptyLine = (): IataLine => ({
  key: nextKey(),
  code: "",
  name: "",
  supplier: null,
  position: "",
});

const isEmptyLine = (line: IataLine) =>
  !line.code && !line.name && !line.supplier && !line.position;

/** keeps one empty row at the end and at least MIN_ROWS rows in total */
const padLines = (lines: IataLine[]): IataLine[] => {
  const result = [...lines];
  if (result.length === 0 || !isEmptyLine(result[result.length - 1])) {
    result.push(emptyLine());
  }
  while (result.length < MIN_ROWS) result.push(emptyLine());
  return result;
};

/* ---------------------------------------------------------------------
   2. STYLES (same look as the other pages)
   --------------------------------------------------------------------- */
const cellSelectProps = {
  ...fieldSelectProps,
  classNames: {
    ...fieldSelectProps.classNames,
    control: ({ isFocused }: { isFocused: boolean }) => `
      !min-h-[26px] !h-[26px] !rounded-none !border-0 !shadow-none !text-[12px]
      !bg-transparent
      ${isFocused ? "!bg-white !ring-1 !ring-inset !ring-[#B7ECD0]" : ""}
    `,
    valueContainer: () => "!h-[26px] !py-0 !px-[8px] !overflow-hidden",
    indicatorsContainer: () => "!h-[26px]",
    menuList: () => "!p-0 !max-h-[312px]",
    option: ({
      isFocused,
      isSelected,
    }: {
      isFocused: boolean;
      isSelected: boolean;
    }) => `
      !cursor-pointer !px-2 !py-1 !text-[12px] !text-[#24364d]
      ${isSelected ? "!bg-[#e7f7ed]" : isFocused ? "!bg-[#f2faf5]" : "!bg-white"}
    `,
  },
};

/* the menu is drawn on <body> so the grid scrolling never clips it */
const portalStyles = {
  menuPortal: (base: object) => ({ ...base, zIndex: 9999 }),
};

/* slim green scrollbar (Chrome, Edge, Safari) */
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
  "h-[28px] border border-[#B7ECD0] bg-[#fafbfc] px-2 text-left font-normal text-[#405066]";
const tdClass = "h-6.5 border border-[#B7ECD0] p-0";
const tableClass =
  "w-full table-fixed border-collapse text-[12px] text-[#24364d]";
const textInputClass =
  "h-6.5 w-full bg-transparent px-2 text-[12px] text-[#24364d] outline-none focus:bg-white focus:ring-1 focus:ring-inset focus:ring-[#91a7b9]";

/* ---------------------------------------------------------------------
   3. GRID: IATA Code, IATA Name, Supplier (dropdown), Position
   --------------------------------------------------------------------- */
const SetIataGrid: React.FC<{
  lines: IataLine[];
  onChange: (key: number, patch: Partial<IataLine>) => void;
}> = ({ lines, onChange }) => {
  const cols = (gutter: boolean) => (
    <colgroup>
      <col className="w-[130px]" />
      <col />
      <col className="w-[180px]" />
      <col className="w-[90px]" />
      {gutter && <col className="w-[10px]" />}
    </colgroup>
  );

  return (
    <div className="overflow-hidden border border-[#B7ECD0] bg-white">
      {/* header (fixed) */}
      <table className={tableClass}>
        {cols(true)}
        <thead>
          <tr>
            <th className={thClass}>IATA Code</th>
            <th className={thClass}>IATA Name</th>
            <th className={thClass}>Supplier</th>
            <th className={thClass}>Position</th>
            <th className={`${thClass} p-0`} />
          </tr>
        </thead>
      </table>

      {/* rows (vertical scrollbar sits beside them) */}
      <div
        className={`max-h-[min(400px,calc(100vh-260px))] overflow-x-hidden overflow-y-scroll ${niceScrollbar}`}
      >
        <table className={tableClass}>
          {cols(false)}
          <tbody>
            {lines.map((line, index) => (
              <tr key={line.key} className="bg-white">
                <td className={tdClass}>
                  <input
                    id={index === 0 ? "txtIataCode" : undefined}
                    aria-label={`IATA Code, line ${index + 1}`}
                    value={line.code}
                    maxLength={12}
                    onChange={(e) =>
                      onChange(line.key, { code: e.target.value.toUpperCase() })
                    }
                    className={textInputClass}
                  />
                </td>
                <td className={tdClass}>
                  <input
                    aria-label={`IATA Name, line ${index + 1}`}
                    value={line.name}
                    onChange={(e) =>
                      onChange(line.key, { name: e.target.value })
                    }
                    className={textInputClass}
                  />
                </td>
                <td className={`${tdClass} ${GRID_CELL_FOCUS_CLASS}`}>
                  <Select<SimpleOption, false>
                    inputId={`lkpSupplier-${line.key}`}
                    instanceId={`lkpSupplier-${line.key}`}
                    aria-label={`Supplier, line ${index + 1}`}
                    options={SUPPLIER_OPTIONS}
                    components={selectComponents}
                    value={
                      SUPPLIER_OPTIONS.find((o) => o.value === line.supplier) ??
                      null
                    }
                    onChange={(option) =>
                      onChange(line.key, { supplier: option?.value ?? null })
                    }
                    styles={portalStyles}
                    {...cellSelectProps}
                  />
                </td>
                <td className={tdClass}>
                  <input
                    aria-label={`Position, line ${index + 1}`}
                    value={line.position}
                    inputMode="numeric"
                    maxLength={4}
                    onChange={(e) =>
                      onChange(line.key, {
                        position: e.target.value.replace(/\D/g, ""),
                      })
                    }
                    className={textInputClass}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

/* ---------------------------------------------------------------------
   4. MAIN PAGE : owns the state and renders the parts
   --------------------------------------------------------------------- */
const SetIataPage: React.FC = () => {
  /* TODO: load the saved rows from your API (tblIATA) and pass them
     through padLines() when setting the initial state */
  const [lines, setLines] = useState<IataLine[]>(() => padLines([]));
  const [error, setError] = useState("");

  const updateLine = (key: number, patch: Partial<IataLine>) => {
    setError("");
    setLines((prev) =>
      padLines(
        prev.map((line) => (line.key === key ? { ...line, ...patch } : line)),
      ),
    );
  };

  const handleSave = () => {
    const filled = lines.filter((line) => !isEmptyLine(line));

    if (filled.length === 0) {
      setError("Add at least one IATA line.");
      return;
    }
    if (filled.some((line) => !line.code.trim())) {
      setError("Every line needs an IATA Code.");
      return;
    }
    if (filled.some((line) => !line.supplier)) {
      setError("Every line needs a Supplier.");
      return;
    }

    const codes = filled.map((line) => line.code.trim());
    if (new Set(codes).size !== codes.length) {
      setError("An IATA Code can be used only once.");
      return;
    }

    setError("");
    /* TODO: call your save API here with `filled` */
    toast.success("IATA saved successfully.");
  };

  const handleClear = () => {
    setLines(padLines([]));
    setError("");
  };

  return (
    <div className="flex min-h-screen w-full items-start justify-center bg-white px-4 py-4">
      <div className="min-h-fit w-full max-w-200 bg-white p-0">
        <main className="w-full overflow-hidden border border-gray-400 bg-white">
          <header className="flex h-7.5 items-center justify-between bg-[#9fdfbc] pr-3.5">
            <h1 className="m-0 ml-3.5 text-[17px] font-semibold text-[#24364d]">
              Set IATA
            </h1>
            <span className="text-[11px] text-[#405066]">tblIATA</span>
          </header>

          <section className="flex flex-col gap-3 px-3.5 pb-6 pt-3">
            <SetIataGrid lines={lines} onChange={updateLine} />

            {error && (
              <p role="alert" className="m-0 text-[12px] text-[#c0392b]">
                {error}
              </p>
            )}

            <div className="flex flex-wrap justify-center gap-2">
              <button
                id="btnSave"
                type="button"
                onClick={handleSave}
                className="btn-style"
              >
                <u>S</u>ave
              </button>
              <button
                id="btnClear"
                type="button"
                onClick={handleClear}
                className="btn-style"
              >
                <u>C</u>lear
              </button>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
};

export default SetIataPage;