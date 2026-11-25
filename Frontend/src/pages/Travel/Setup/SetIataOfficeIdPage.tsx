import React, { useState } from "react";
import Select from "react-select";
import { IoMdAdd, IoMdClose, IoMdCreate } from "react-icons/io";
import { toast } from "react-toastify";
import selectComponents from "../../../components/common/selectComponents";
import { fieldSelectProps } from "../../../components/common/Combo";
import { GRID_CELL_FOCUS_CLASS } from "../../../hooks/useGridCellFocus";
import { deleteConfirm } from "../../../hooks/deleteMessage";
import { useConfirmModal } from "../../../hooks/useConfirmModal";
import Header from "../../../components/common/Header";
import { FiEdit } from "react-icons/fi";
import { FaPlus } from "react-icons/fa";

/* =====================================================================
   FILE MAP
   1. Types, constants, sample options (replace with your API data)
   2. Styles shared with the Budget / Staff / IATA pages
   3. Parts : OfficeIdGrid (read only), OfficeIdDialog (one-row form)
   4. SetIataOfficeIdPage : owns the state and renders the parts

   Layout:
     IATA
     [ dropdown ] [+]            <- + opens the form popup (add one line)
     grid (read only) : GDS Name | Office ID | Note | Modify | Delete
     [Clear]

   Modify (pencil) -> same form popup, filled with that line.
   Save lives inside the popup only.
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

type DialogState = {
  mode: "add" | "edit";
  /* key of the saved line being modified (edit mode only) */
  editKey: number | null;
  line: OfficeLine;
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

const gdsLabel = (value: string | null) =>
  GDS_OPTIONS.find((o) => o.value === value)?.label ?? value ?? "";

/* ---------------------------------------------------------------------
   2. STYLES (same look as the other pages)
   --------------------------------------------------------------------- */
const selectTextClassNames = {
  singleValue: () => "!m-0 !text-[14px] !text-[#24364d]",
  placeholder: () => "!m-0 !text-[14px] !text-[#7a8794]",
  input: () => "!m-0 !p-0 !text-[14px] !text-[#24364d]",
};

/* select used in the page and in the form (normal field look) */
const fieldClassNames = {
  ...fieldSelectProps.classNames,
  ...selectTextClassNames,
  control: (state: { isFocused: boolean }) =>
    `${fieldSelectProps.classNames.control(state)} !text-[14px]`,
  valueContainer: () => "!h-[26px] !py-0 !px-[2px] !overflow-hidden",
};

/* the menu is drawn on <body> so popup scrolling never clips it */
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

const labelClass = "text-[14px] text-[#405066]";
const formLabelClass = `${labelClass} w-24 shrink-0 text-right`;
const thClass =
  "h-[28px] border border-[#B7ECD0] bg-[#EEFBF4] px-[2px] text-left font-semibold text-[#405066]";
const tdClass = "h-6.5 border border-[#B7ECD0] p-0";
const readCellClass = `${tdClass} truncate px-[2px] text-[14px] text-[#24364d]`;
const tableClass =
  "w-full table-fixed border-collapse text-[12px] text-[#24364d]";
const iconButtonClass =
  "inline-flex h-6.25 w-full items-center justify-center disabled:cursor-not-allowed disabled:opacity-40";

/* ---------------------------------------------------------------------
   3. PARTS
   --------------------------------------------------------------------- */

/* 3a. Grid (read only): GDS Name, Office ID, Note, Modify, Delete */
const OfficeIdGrid: React.FC<{
  lines: OfficeLine[];
  onModify: (line: OfficeLine) => void;
  onDelete: (line: OfficeLine, index: number) => void;
}> = ({ lines, onModify, onDelete }) => {
  const cols = (gutter: boolean) => (
    <colgroup>
      <col className="w-45" />
      <col className="w-45" />
      <col />
      <col className="w-16" />
      <col className="w-16" />
      {gutter && <col className="w-2.5" />}
    </colgroup>
  );

  const fillerCount = Math.max(MIN_ROWS - lines.length, 0);

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
            <th className={`${thClass} text-center`}>Modify</th>
            <th className={`${thClass} text-center`}>Delete</th>
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
                <td className={readCellClass} title={gdsLabel(line.gds)}>
                  {gdsLabel(line.gds)}
                </td>
                <td className={readCellClass} title={line.officeId}>
                  {line.officeId}
                </td>
                <td className={readCellClass} title={line.note}>
                  {line.note}
                </td>
                <td className={`${tdClass} text-center`}>
                  <button
                    type="button"
                    aria-label={`Modify line ${index + 1}`}
                    title="Modify line"
                    onClick={() => onModify(line)}
                    className={`${iconButtonClass} text-[#4cc45a] hover:bg-[#f2faf5] hover:text-[#2f9e5a]`}
                  >
                    <FiEdit  size={17} />
                  </button>
                </td>
                <td className={`${tdClass} text-center`}>
                  <button
                    type="button"
                    aria-label={`Delete line ${index + 1}`}
                    title="Delete line"
                    onClick={() => onDelete(line, index)}
                    className={`${iconButtonClass} text-red-600 hover:bg-red-50 hover:text-red-700`}
                  >
                    <IoMdClose size={17} />
                  </button>
                </td>
              </tr>
            ))}
            {Array.from({ length: fillerCount }, (_, i) => (
              <tr key={`filler-${i}`} className="bg-white">
                <td className={tdClass} />
                <td className={tdClass} />
                <td className={tdClass} />
                <td className={tdClass} />
                <td className={tdClass} />
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

/* 3b. Popup: one-row form used for both Add and Modify */
const OfficeIdDialog: React.FC<{
  mode: "add" | "edit";
  iataLabel: string;
  line: OfficeLine;
  error: string;
  onChange: (patch: Partial<OfficeLine>) => void;
  onSave: () => void;
  onCancel: () => void;
}> = ({ mode, iataLabel, line, error, onChange, onSave, onCancel }) => {
  const title = mode === "add" ? "Add Office ID" : "Modify Office ID";
  const BtnLable=mode=== "add" ? "Save" : "Modify";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onCancel();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="w-full max-w-125 overflow-hidden rounded-lg border border-gray-400 bg-white shadow-lg"
      >
        <header className="flex h-7.5 items-center justify-between bg-[#9fdfbc] pl-3.5 pr-1">
          <h2 className="m-0 text-[15px] font-semibold text-[#24364d]">
            {title}
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

        <div className="flex flex-col gap-3 px-3.5 pb-3 pt-3">
          <div className="flex items-center gap-2">
            <label htmlFor="txtDialogIata" className={formLabelClass}>
              IATA :
            </label>
            <div className="min-w-0 flex-1">
              <input
                id="txtDialogIata"
                aria-label="IATA"
                readOnly
                value={iataLabel}
                className="w-full input-style"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <label htmlFor="lkpDialogGds" className={formLabelClass}>
              GDS Name :
            </label>
            <div className={`min-w-0 flex-1 ${GRID_CELL_FOCUS_CLASS}`}>
              <Select<SimpleOption, false>
                inputId="lkpDialogGds"
                instanceId="lkpDialogGds"
                aria-label="GDS Name"
                options={GDS_OPTIONS}
                components={selectComponents}
                value={GDS_OPTIONS.find((o) => o.value === line.gds) ?? null}
                onChange={(option) => onChange({ gds: option?.value ?? null })}
                styles={portalStyles}
                {...fieldSelectProps}
                classNames={fieldClassNames}
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <label htmlFor="txtDialogOfficeId" className={formLabelClass}>
              Office ID :
            </label>
            <div className="min-w-0 flex-1">
              <input
                id="txtDialogOfficeId"
                aria-label="Office ID"
                value={line.officeId}
                onChange={(e) =>
                  onChange({ officeId: e.target.value.toUpperCase() })
                }
                className="w-full input-style"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <label htmlFor="txtDialogNote" className={formLabelClass}>
              Note :
            </label>
            <div className="min-w-0 flex-1">
              <input
                id="txtDialogNote"
                aria-label="Note"
                value={line.note}
                onChange={(e) => onChange({ note: e.target.value })}
                className="w-full input-style"
              />
            </div>
          </div>

          {error && (
            <p role="alert" className="m-0 text-[12px] text-[#c0392b]">
              {error}
            </p>
          )}

          <div className="flex justify-center gap-2">
            <button
              id="btnDialogSave"
              type="button"
              onClick={onSave}
              className="btn-style"
            >
             <u> {BtnLable.slice(0,1)}</u>{BtnLable.slice(1)}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ---------------------------------------------------------------------
   4. MAIN PAGE : owns the state and renders the parts
   --------------------------------------------------------------------- */
const SetIataOfficeIdPage: React.FC = () => {
  const { confirm, dialog: confirmDialog } = useConfirmModal();
  const [iata, setIata] = useState<string | null>(null);
  /* saved GDS / Office ID / Note lines per IATA, kept in memory */
  const [linesByIata, setLinesByIata] = useState<Record<string, OfficeLine[]>>(
    {},
  );
  const [dialog, setDialog] = useState<DialogState | null>(null);
  const [dialogError, setDialogError] = useState("");

  const lines = iata ? (linesByIata[iata] ?? []) : [];
  const iataLabel = IATA_OPTIONS.find((o) => o.value === iata)?.label ?? "";

  /* ----- popup ----- */
  const openAdd = () => {
    if (!iata) return;
    setDialogError("");
    setDialog({ mode: "add", editKey: null, line: emptyLine() });
  };

  const openModify = (line: OfficeLine) => {
    setDialogError("");
    setDialog({ mode: "edit", editKey: line.key, line: { ...line } });
  };

  const closeDialog = () => {
    setDialog(null);
    setDialogError("");
  };

  const changeDialogLine = (patch: Partial<OfficeLine>) => {
    setDialogError("");
    setDialog((prev) =>
      prev ? { ...prev, line: { ...prev.line, ...patch } } : prev,
    );
  };

  const saveDialog = () => {
    if (!dialog || !iata) return;

    const officeId = dialog.line.officeId.trim();
    if (!dialog.line.gds) {
      setDialogError("Select a GDS Name.");
      return;
    }
    if (!officeId) {
      setDialogError("Enter an Office ID.");
      return;
    }

    /* compare against the lines already saved (except the one being edited) */
    const duplicate = (linesByIata[iata] ?? []).some(
      (line) =>
        line.key !== dialog.editKey &&
        line.gds === dialog.line.gds &&
        line.officeId.trim() === officeId,
    );
    if (duplicate) {
      setDialogError("The same GDS and Office ID cannot be added twice.");
      return;
    }

    const cleaned: OfficeLine = { ...dialog.line, officeId };

    /* TODO: call your save / update API here with `iata` and `cleaned` */
    setLinesByIata((prev) => {
      const current = prev[iata] ?? [];
      return {
        ...prev,
        [iata]:
          dialog.mode === "edit"
            ? current.map((line) =>
                line.key === dialog.editKey ? cleaned : line,
              )
            : [...current, cleaned],
      };
    });
    toast.success(
      dialog.mode === "edit"
        ? "IATA Office ID updated successfully."
        : "IATA Office ID saved successfully.",
    );
    closeDialog();
  };

  /* ----- grid / footer actions ----- */
  const deleteLine = async (line: OfficeLine, index: number) => {
    if (!iata) return;
    const confirmed = await confirm(
      deleteConfirm(
        `Do you want to Delete Line ${index + 1}?`,
        "Set IATA - Office ID",
      ),
    );
    if (!confirmed) return;
    /* TODO: call your delete API here */
    setLinesByIata((prev) => ({
      ...prev,
      [iata]: (prev[iata] ?? []).filter((l) => l.key !== line.key),
    }));
  };

  const handleClear = async () => {
    if (!iata || lines.length === 0) return;
    const confirmed = await confirm(
      deleteConfirm("Do you want to Delete all ?", "Set IATA - Office ID"),
    );
    if (!confirmed) return;
    setLinesByIata((prev) => ({ ...prev, [iata]: [] }));
  };

  return (
    <div className="flex min-h-screen w-full items-start justify-center bg-white px-4 py-4">
      <div className="min-h-fit w-full max-w-200 bg-white p-0">
        <main className="w-full overflow-hidden border border-gray-400 bg-white">
          <Header Name="Set IATA - Office ID" />

          <section className="flex flex-col gap-4 px-3.5 pb-3 pt-3">
            <div className="flex items-center gap-1">
              <label htmlFor="lkpIata" className={labelClass}>
                IATA :
              </label>
              <div className="w-80 min-w-0 max-w-full">
                <Select<SimpleOption, false>
                  inputId="lkpIata"
                  instanceId="lkpIata"
                  aria-label="IATA"
                  options={IATA_OPTIONS}
                  components={selectComponents}
                  value={IATA_OPTIONS.find((o) => o.value === iata) ?? null}
                  onChange={(option) => setIata(option?.value ?? null)}
                  styles={portalStyles}
                  {...fieldSelectProps}
                  classNames={fieldClassNames}
                />
              </div>
          
                             <button
                       id="btnAdd"
                type="button"
                aria-label="Add Office ID"
                title="Add Office ID"
                disabled={!iata}
                onClick={openAdd}
                  className=" border p-1 rounded-full text-white bg-green-400 border-black cursor-pointer hover:bg-green-500 "
                      >
                     <FaPlus/> 
              
                      </button>
            </div>

            <OfficeIdGrid
              lines={lines}
              onModify={openModify}
              onDelete={(line, index) => void deleteLine(line, index)}
            />

            <div className="flex flex-wrap justify-center gap-2">
              <button
                id="btnClear"
                type="button"
                onClick={() => void handleClear()}
                className="btn-style"
              >
                <u>D</u>elete
              </button>
            </div>
          </section>
        </main>
      </div>

      {confirmDialog}
      {dialog && (
        <OfficeIdDialog
          mode={dialog.mode}
          iataLabel={iataLabel}
          line={dialog.line}
          error={dialogError}
          onChange={changeDialogLine}
          onSave={saveDialog}
          onCancel={closeDialog}
        />
      )}
    </div>
  );
};

export default SetIataOfficeIdPage;