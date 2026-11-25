import React, { useEffect, useRef, useState } from "react";
import Select from "react-select";
import { IoMdAdd, IoMdClose } from "react-icons/io";
import { toast } from "react-toastify";
import selectComponents from "../../../components/common/selectComponents";
import { fieldSelectProps } from "../../../components/common/Combo";
import { GRID_CELL_FOCUS_CLASS } from "../../../hooks/useGridCellFocus";
import { FaPlus } from "react-icons/fa";
import Header from "../../../components/common/Header";

/* =====================================================================
   FILE MAP
   1. Types, constants, sample options (replace with your API data)
   2. Styles shared with the Budget / Staff pages
   3. Parts : AddIataDialog (opened by the + button), IataGrid
   4. IataPage : owns the state and renders the parts

   Layout (from the sketch):
     IATA [ dropdown ]  [+]
     grid : GDS (dropdown) | PCC | Note
     [+] opens a small popup to enter a new IATA, which is then added to
     the dropdown and selected.
   ===================================================================== */

/* ---------------------------------------------------------------------
   1. TYPES, CONSTANTS AND SAMPLE OPTIONS
   --------------------------------------------------------------------- */
const MIN_ROWS = 8;

type IataOption = { value: string; label: string; name: string };
type SimpleOption = { value: string; label: string };

type IataLine = {
  key: number;
  gds: string | null;
  pcc: string;
  note: string;
};

/* TODO: replace with the API list of IATA codes */
const INITIAL_IATA: IataOption[] = [
  { value: "12345678", label: "12345678 - Head Office", name: "Head Office" },
  { value: "87654321", label: "87654321 - City Branch", name: "City Branch" },
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

const emptyLine = (): IataLine => ({
  key: nextKey(),
  gds: null,
  pcc: "",
  note: "",
});

const isEmptyLine = (line: IataLine) => !line.gds && !line.pcc && !line.note;

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
   2. STYLES (same look as the Budget page)
   --------------------------------------------------------------------- */
const selectTextClassNames = {
  singleValue: () => "!m-0 !text-[14px] !text-[#24364d]",
  placeholder: () => "!m-0 !text-[14px] !text-[#7a8794]",
  input: () => "!m-0 !p-0 !text-[14px] !text-[#24364d]",
};

const cellSelectProps = {
  ...fieldSelectProps,
  classNames: {
    ...fieldSelectProps.classNames,
    ...selectTextClassNames,
    control: ({ isFocused }: { isFocused: boolean }) => `
      !min-h-[26px] !h-[26px] !rounded-none !border-0 !shadow-none !text-[14px]
      !bg-transparent
      ${isFocused ? "!bg-white !ring-1 !ring-inset !ring-[#B7ECD0]" : ""}
    `,
    valueContainer: () => "!h-[26px] !py-0 !px-[2px] !overflow-hidden",
    indicatorsContainer: () => "!h-[26px]",
    menuList: () => "!p-0 !max-h-[312px]",
    option: ({
      isFocused,
      isSelected,
    }: {
      isFocused: boolean;
      isSelected: boolean;
    }) => `
      !cursor-pointer !px-[2px] !py-1 !text-[14px] !text-[#24364d]
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
  "h-[28px] border border-[#B7ECD0] bg-[#EEFBF4] px-[2px] text-left font-semibold text-[#405066]";
  const thClassLine =
  "h-[28px] border border-[#B7ECD0] bg-[#EEFBF4]  font-semibold text-[#405066]";
const tdClass = "h-6.5 border border-[#B7ECD0] p-0";
const tableClass =
  "w-full table-fixed border-collapse text-[12px] text-[#24364d]";
const textInputClass =
  "h-6.5 w-full bg-transparent px-[2px] text-[14px] text-[#24364d] outline-none focus:bg-white focus:ring-1 focus:ring-inset focus:ring-[#91a7b9]";
const dialogInputClass =
  "h-7 w-full rounded-[3px] border border-[#cfd7df] bg-white px-[2px] text-[14px] text-[#24364d] outline-none focus:border-[#91a7b9] focus:ring-1 focus:ring-[#B7ECD0]";

/* ---------------------------------------------------------------------
   3. PARTS
   --------------------------------------------------------------------- */

/* 3a. Popup opened by the + button: enter a new IATA */
const AddIataDialog: React.FC<{
  existingCodes: string[];
  onAdd: (code: string, name: string) => void;
  onCancel: () => void;
}> = ({ existingCodes, onAdd, onCancel }) => {
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const codeRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    codeRef.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onCancel();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onCancel]);

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    const cleanCode = code.trim();
    if (!cleanCode) {
      setError("Enter the IATA code.");
      return;
    }
    if (existingCodes.includes(cleanCode)) {
      setError("This IATA code already exists.");
      return;
    }
    onAdd(cleanCode, name.trim());
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onCancel();
      }}
    >
      <form
        role="dialog"
        aria-modal="true"
        aria-label="Add IATA"
        onSubmit={submit}
        className="w-full max-w-95 overflow-hidden rounded-lg border border-gray-400 bg-white shadow-lg"
      >
        <header className="flex h-7.5 items-center justify-between bg-[#9fdfbc] pl-3.5 pr-1">
          <h2 className="m-0 text-[15px] font-semibold text-[#24364d]">
            Add IATA
          </h2>
          <button
            type="button"
            aria-label="Close"
            onClick={onCancel}
            className="inline-flex h-6 w-6 items-center justify-center text-[#24364d] hover:bg-white/50"
          >
            <IoMdClose size={17} />
          </button>
        </header>

        <div className="flex flex-col gap-3 px-3.5 pb-4 pt-3">
          <div className="flex items-center gap-2">
            <label
              htmlFor="txtIataCode"
              className="w-20 shrink-0 text-right text-[14px] text-[#405066]"
            >
              IATA Code :
            </label>
            <input
              id="txtIataCode"
              ref={codeRef}
              value={code}
              maxLength={12}
              onChange={(e) => {
                setError("");
                setCode(e.target.value.toUpperCase());
              }}
              className={dialogInputClass}
            />
          </div>
          <div className="flex items-center gap-2">
            <label
              htmlFor="txtIataName"
              className="w-20 shrink-0 text-right text-[14px] text-[#405066]"
            >
              Name :
            </label>
            <input
              id="txtIataName"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={dialogInputClass}
            />
          </div>

          {error && (
            <p role="alert" className="m-0 text-[12px] text-[#c0392b]">
              {error}
            </p>
          )}

          <div className="flex justify-center gap-2">
            <button type="submit" className="btn-style">
              OK
            </button>
            <button type="button" onClick={onCancel} className="btn-style">
              Cancel
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

/* 3b. Grid: GDS (dropdown), PCC, Note */
const IataGrid: React.FC<{
  lines: IataLine[];
  disabled: boolean;
  onChange: (key: number, patch: Partial<IataLine>) => void;
}> = ({ lines, disabled, onChange }) => {
  const cols = (gutter: boolean) => (
    <colgroup>
      <col className="w-11" />
      <col className="w-45" />
      <col className="w-45" />
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
            <th className={`${thClassLine} text-center`}>Line</th>
            <th className={thClass}>GDS</th>
            <th className={thClass}>PCC</th>
            <th className={thClass}>Note</th>
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
                <td className="h-6.5 border border-[#B7ECD0] bg-[#fafbfc] px-1 text-center text-[12px] text-[#405066]">
                  {index + 1}
                </td>
                <td className={`${tdClass} ${GRID_CELL_FOCUS_CLASS}`}>
                  <Select<SimpleOption, false>
                    inputId={`lkpGds-${line.key}`}
                    instanceId={`lkpGds-${line.key}`}
                    aria-label={`GDS, line ${index + 1}`}
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
                    aria-label={`PCC, line ${index + 1}`}
                    value={line.pcc}
                    disabled={disabled}
                    onChange={(e) =>
                      onChange(line.key, { pcc: e.target.value.toUpperCase() })
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
const IataPage: React.FC = () => {
  const [iataOptions, setIataOptions] = useState<IataOption[]>(INITIAL_IATA);
  const [iata, setIata] = useState<string | null>(
    INITIAL_IATA[0]?.value ?? null,
  );
  /* GDS / PCC / Note lines per IATA, kept in memory until saved */
  const [linesByIata, setLinesByIata] = useState<Record<string, IataLine[]>>(
    {},
  );
  const [addOpen, setAddOpen] = useState(false);
  const [error, setError] = useState("");

  const lines = iata ? padLines(linesByIata[iata] ?? []) : padLines([]);

  const updateLine = (key: number, patch: Partial<IataLine>) => {
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

  const handleAdd = (code: string, name: string) => {
    setIataOptions((prev) => [
      ...prev,
      { value: code, label: name ? `${code} - ${name}` : code, name },
    ]);
    setIata(code);
    setError("");
    setAddOpen(false);
    toast.success("IATA added.");
  };

  const handleSave = () => {
    if (!iata) {
      setError("Select an IATA.");
      return;
    }
    const filled = lines.filter((line) => !isEmptyLine(line));
    if (filled.length === 0) {
      setError("Add at least one GDS line.");
      return;
    }
    if (filled.some((line) => !line.gds)) {
      setError("Every line needs a GDS.");
      return;
    }
    const gdsList = filled.map((line) => line.gds);
    if (new Set(gdsList).size !== gdsList.length) {
      setError("A GDS can be used only once for an IATA.");
      return;
    }
    setError("");
    /* TODO: call your save API here with `iata` and `filled` */
    toast.success("IATA saved successfully.");
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
         <Header Name=" IATA"/>

          <section className="flex flex-col gap-3 px-3.5 pb-6 pt-3">
            <div className="flex items-center gap-2">
              <label
                htmlFor="lkpIata"
                className="shrink-0 text-right text-[14px] text-[#405066]"
              >
                IATA :
              </label>
              <div className="w-72 min-w-0">
                <Select<IataOption, false>
                  inputId="lkpIata"
                  instanceId="lkpIata"
                  aria-label="IATA"
                  options={iataOptions}
                  components={selectComponents}
                  value={iataOptions.find((o) => o.value === iata) ?? null}
                  onChange={(option) => {
                    setIata(option?.value ?? null);
                    setError("");
                  }}
                  styles={portalStyles}
                  {...fieldSelectProps}
                  classNames={{
                    ...fieldSelectProps.classNames,
                    ...selectTextClassNames,
                    control: (state) =>
                      `${fieldSelectProps.classNames.control(state)} !text-[14px]`,
                    valueContainer: () =>
                      "!h-[26px] !py-0 !px-[2px] !overflow-hidden",
                  }}
                />
              </div>
             
              <button
                        id="btnAddIata"
                        type="button"
                        title="Add IATA"
                        onClick={() => setAddOpen(true)}
                        className=" border p-1 rounded-full text-white bg-green-400 border-black cursor-pointer hover:bg-green-500 "
                      >
                      <FaPlus/> 
              
                      </button>
            </div>

            <IataGrid lines={lines} disabled={!iata} onChange={updateLine} />

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

      {addOpen && (
        <AddIataDialog
          existingCodes={iataOptions.map((o) => o.value)}
          onAdd={handleAdd}
          onCancel={() => setAddOpen(false)}
        />
      )}
    </div>
  );
};

export default IataPage;