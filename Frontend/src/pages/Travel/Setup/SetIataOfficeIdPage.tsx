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
   3. OfficeIdGrid : GDS Name (dropdown) | Office ID | Note
   4. SetIataOfficeIdPage : owns the state and renders the parts

   Layout (from the sketch, table tblIATAOfficeID):
     IATA
     [ dropdown ]
     grid : GDS Name (dropdown) | Office ID | Note
     [Save] [Clear]
   ===================================================================== */

/* ---------------------------------------------------------------------
   1. TYPES, CONSTANTS AND SAMPLE OPTIONS
   --------------------------------------------------------------------- */
const MIN_ROWS = 8;

type SimpleOption = { value: string; label: string };

type OfficeLine = {
  key: number;
  gds: string | null;
  officeId: string;
  note: string;
};

/* TODO: replace with the API list of IATA codes */
const IATA_OPTIONS: SimpleOption[] = [
  { value: "12345678", label: "12345678 - Head Office" },
  { value: "87654321", label: "87654321 - City Branch" },
];

/* TODO: replace with the API list of GDS */
const GDS_OPTIONS: SimpleOption[] = [
  { value: "Amadeus", label: "Amadeus" },
  { value: "Sabre", label: "Sabre" },
  { value: "Galileo", label: "Galileo" },
  { value: "Travelport", label: "Travelport" },
];

let keyCounter = 0;
const nextKey = () => ++keyCounter;

const emptyLine = (): OfficeLine => ({
  key: nextKey(),
  gds: null,
  officeId: "",
  note: "",
});

const isEmptyLine = (line: OfficeLine) =>
  !line.gds && !line.officeId && !line.note;

/** keeps one empty row at the end and at least MIN_ROWS rows in total */
const padLines = (lines: OfficeLine[]): OfficeLine[] => {
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

const labelClass = "text-[12px] text-[#405066]";
const thClass =
  "h-[28px] border border-[#B7ECD0] bg-[#EEFBF4] px-2 text-left font-normal text-[#405066]";
const tdClass = "h-6.5 border border-[#B7ECD0] p-0";
const tableClass =
  "w-full table-fixed border-collapse text-[12px] text-[#24364d]";
const textInputClass =
  "h-6.5 w-full bg-transparent px-2 text-[12px] text-[#24364d] outline-none focus:bg-white focus:ring-1 focus:ring-inset focus:ring-[#91a7b9]";

/* ---------------------------------------------------------------------
   3. GRID: GDS Name (dropdown), Office ID, Note
   --------------------------------------------------------------------- */
const OfficeIdGrid: React.FC<{
  lines: OfficeLine[];
  disabled: boolean;
  onChange: (key: number, patch: Partial<OfficeLine>) => void;
}> = ({ lines, disabled, onChange }) => {
  const cols = (gutter: boolean) => (
    <colgroup>
      <col className="w-45" />
      <col className="w-45" />n
      <col />
      {gutter && <col className="w-2.5" />}
    </colgroup>
  );

  return (
    <div className="overflow-hidden border border-[#B7ECD0] bg-white">
      {/* header (fixed) */}
      <table className={tableClass}>
        {cols(true)}
        <thead>
          <tr>
            <th className={thClass}>GDS Name</th>
            <th className={thClass}>Office ID</th>
            <th className={thClass}>Note</th>
            <th className={`${thClass} p-0`} />
          </tr>
        </thead>
      </table>

      {/* rows (vertical scrollbar sits beside them) */}
      <div
        className={`max-h-[min(400px,calc(100vh-300px))] overflow-x-hidden overflow-y-scroll ${niceScrollbar}`}
      >
        <table className={tableClass}>
          {cols(false)}
          <tbody>
            {lines.map((line, index) => (
              <tr key={line.key} className="bg-white">
                <td className={`${tdClass} ${GRID_CELL_FOCUS_CLASS}`}>
                  <Select<SimpleOption, false>
                    inputId={`lkpGds-${line.key}`}
                    instanceId={`lkpGds-${line.key}`}
                    aria-label={`GDS Name, line ${index + 1}`}
                    options={GDS_OPTIONS}
                    components={selectComponents}
                    value={
                      GDS_OPTIONS.find((o) => o.value === line.gds) ?? null
                    }
                    isDisabled={disabled}
                    onChange={(option) =>
                      onChange(line.key, { gds: option?.value ?? null })
                    }
                    styles={portalStyles}
                    {...cellSelectProps}
                  />
                </td>
                <td className={tdClass}>
                  <input
                    aria-label={`Office ID, line ${index + 1}`}
                    value={line.officeId}
                    disabled={disabled}
                    onChange={(e) =>
                      onChange(line.key, {
                        officeId: e.target.value.toUpperCase(),
                      })
                    }
                    className={textInputClass}
                  />
                </td>
                <td className={tdClass}>
                  <input
                    aria-label={`Note, line ${index + 1}`}
                    value={line.note}
                    disabled={disabled}
                    onChange={(e) =>
                      onChange(line.key, { note: e.target.value })
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
const SetIataOfficeIdPage: React.FC = () => {
  const [iata, setIata] = useState<string | null>(null);
  /* GDS / Office ID / Note lines per IATA, kept in memory until saved */
  const [linesByIata, setLinesByIata] = useState<Record<string, OfficeLine[]>>(
    {},
  );
  const [error, setError] = useState("");

  const lines = iata ? padLines(linesByIata[iata] ?? []) : padLines([]);

  const updateLine = (key: number, patch: Partial<OfficeLine>) => {
    if (!iata) return;
    setError("");
    setLinesByIata((prev) => ({
      ...prev,
      [iata]: padLines(
        padLines(prev[iata] ?? []).map((line) =>
          line.key === key ? { ...line, ...patch } : line,
        ),
      ),
    }));
  };

  const handleSave = () => {
    if (!iata) {
      setError("Select an IATA.");
      return;
    }
    const filled = lines.filter((line) => !isEmptyLine(line));
    if (filled.length === 0) {
      setError("Add at least one Office ID line.");
      return;
    }
    if (filled.some((line) => !line.gds)) {
      setError("Every line needs a GDS Name.");
      return;
    }
    if (filled.some((line) => !line.officeId.trim())) {
      setError("Every line needs an Office ID.");
      return;
    }
    const pairs = filled.map((line) => `${line.gds}|${line.officeId.trim()}`);
    if (new Set(pairs).size !== pairs.length) {
      setError("The same GDS and Office ID cannot be added twice.");
      return;
    }
    setError("");
    /* TODO: call your save API here with `iata` and `filled` */
    toast.success("IATA Office ID saved successfully.");
  };

  const handleClear = () => {
    if (!iata) return;
    setLinesByIata((prev) => ({ ...prev, [iata]: [] }));
    setError("");
  };

  return (
    <div className="flex min-h-screen w-full items-start justify-center bg-white px-4 py-4">
      <div className="min-h-fit w-full max-w-200 bg-white p-0">
        <main className="w-full overflow-hidden border border-gray-400 bg-white">
          <header className="flex h-7.5 items-center justify-between bg-[#9fdfbc] pr-3.5">
            <h1 className="m-0 ml-3.5 text-[17px] font-semibold text-[#24364d]">
              Set IATA - Office ID
            </h1>
           
          </header>

          <section className="flex flex-col gap-4 px-3.5 pb-6 pt-3">
            <div className="flex flex-col gap-1">
              <label htmlFor="lkpIata" className={labelClass}>
                IATA
              </label>
              <div className="w-72 min-w-0 max-w-full">
                <Select<SimpleOption, false>
                  inputId="lkpIata"
                  instanceId="lkpIata"
                  aria-label="IATA"
                  options={IATA_OPTIONS}
                  components={selectComponents}
                  value={IATA_OPTIONS.find((o) => o.value === iata) ?? null}
                  onChange={(option) => {
                    setIata(option?.value ?? null);
                    setError("");
                  }}
                  styles={portalStyles}
                  {...fieldSelectProps}
                />
              </div>
            </div>

            <OfficeIdGrid lines={lines} disabled={!iata} onChange={updateLine} />

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

export default SetIataOfficeIdPage;