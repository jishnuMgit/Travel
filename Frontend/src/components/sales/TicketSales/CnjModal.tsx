import React, { useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";
import { GRID_CELL_FOCUS_CLASS } from "../../../hooks/useGridCellFocus";
import { useConfirmModal } from "../../../hooks/useConfirmModal";
import { CARRIER_MAX_LENGTH, cnjCarrierIssue, formatCarrierCodes, formatRoute, ROUTE_MAX_LENGTH, routeSectors } from "./ticketSalesValidation";

/* Ticket Sales-Conjunction (the old frmTktSalesCnj): opens when CNJ. is Yes (or from the CNJ button). The conjunction tickets of
   this ticket, one row each: CNJ Ticket No., Route, Carrier, Class. The grid always ends with an empty row; typing in it adds the
   next one. The CNJ Ticket No. of a row is filled by itself when it is empty and you type in the row: the Ticket No. + 1 for
   the first row, the row above + 1 for the next ones (you can change it). It cannot be the Ticket No. itself, and not the same
   twice. Esc or the X button closes it; the rows stay on the screen. The screen behind is not blocked (no dark layer). */

export type CnjRow = {
  txtCnjTktSlNo: string; // CNJ Ticket No. (fCnjTktSlNo)
  txtCnjRoute: string; // Route (fRoute)
  txtCnjCarrier: string; // Carrier (fCarrier)
  txtCnjClass: string; // Class (fClass)
};

export const emptyCnjRow = (): CnjRow => ({ txtCnjTktSlNo: "", txtCnjRoute: "", txtCnjCarrier: "", txtCnjClass: "" });

export const isEmptyCnjRow = (row: CnjRow) =>
  row.txtCnjTktSlNo.trim() === "" && row.txtCnjRoute.trim() === "" && row.txtCnjCarrier.trim() === "" && row.txtCnjClass.trim() === "";

/* The number after a ticket number, keeping its length and leading zeros ("1234567890" -> "1234567891",
   "0012345678" -> "0012345679"). A number with letters (or empty) has no next one: "". */
export const nextTicketNo = (no: string): string => {
  const t = no.trim();
  if (!/^\d+$/.test(t)) return "";
  return (BigInt(t) + 1n).toString().padStart(t.length, "0");
};

type Column = {
  key: keyof CnjRow;
  label: string;
  width: string;
  maxLength: number;
  format?: (value: string) => string;
};

const upper = (value: string) => value.toUpperCase();

const COLUMNS: Column[] = [
  { key: "txtCnjTktSlNo", label: "CNJ Ticket No.", width: "w-[26%]", maxLength: 12 },
  { key: "txtCnjRoute", label: "Route", width: "w-[30%]", maxLength: ROUTE_MAX_LENGTH, format: formatRoute },
  { key: "txtCnjCarrier", label: "Carrier Code", width: "w-[24%]", maxLength: CARRIER_MAX_LENGTH, format: formatCarrierCodes },
  { key: "txtCnjClass", label: "Class", width: "w-[20%]", maxLength: 8, format: upper },
];

const th = "h-[30px] border border-[#B7ECD0] bg-[#EEFBF4] px-2 text-left font-normal text-[#405066]";
const cell = `h-[28px] border border-[#B7ECD0] p-0 ${GRID_CELL_FOCUS_CLASS}`;

type CnjModalProps = {
  open: boolean;
  rows: CnjRow[];
  /** the Ticket No. of the ticket: the first CNJ Ticket No. is this + 1, and no CNJ Ticket No. can be this one */
  mainTicketNo: string;
  onChange: (rows: CnjRow[]) => void;
  onClose: () => void;
  /** Yes of the delete line: deletes the saved line from the database; an error (thrown) keeps the line */
  onRemoveRow?: (row: CnjRow) => void | Promise<void>;
};

const MIN_ROWS = 6; // the grid is as tall as the old one even when it has few rows

const CnjModal: React.FC<CnjModalProps> = ({ open, rows, mainTicketNo, onChange, onClose, onRemoveRow }) => {
  const firstCellRef = useRef<HTMLInputElement>(null);
  const { confirm, dialog } = useConfirmModal();
  const [carrierLeft, setCarrierLeft] = useState<number[]>([]); // the rows whose Carrier Code box was left: a wrong one shows in red
  const confirmingRef = useRef(false); // the confirm window is open: Esc is for it, not for this popup

  // the cursor goes into the first cell ONLY when the popup opens (not on every key typed: onClose is a new function on
  // every render of the screen, so it must not be a dependency of this effect)
  useEffect(() => {
    if (open) firstCellRef.current?.focus();
  }, [open]);

  // Esc closes it; the latest onClose is kept in a ref so the listener is added once while it is open
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !confirmingRef.current) {
        event.preventDefault();
        onCloseRef.current();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  if (!open) return null;

  // the saved rows, then one empty row to type the next one in
  const shown = [...rows, emptyCnjRow()];
  const blanks = Math.max(0, MIN_ROWS - shown.length);

  /* The CNJ Ticket No. a row gets by itself: the number after the row above (the Ticket No. for the first row), skipping the
     Ticket No. itself and the numbers the other rows already have. "" when there is no number to add one to. */
  const defaultNo = (index: number): string => {
    const above = rows.slice(0, index).reverse().find((row) => row.txtCnjTktSlNo.trim() !== "")?.txtCnjTktSlNo ?? mainTicketNo;
    const used = new Set(rows.map((row, i) => (i === index ? "" : row.txtCnjTktSlNo.trim())));
    used.add(mainTicketNo.trim());
    let no = nextTicketNo(above);
    for (let guard = 0; no !== "" && used.has(no) && guard < 1000; guard++) no = nextTicketNo(no);
    return no;
  };

  // the x at the end of a line: asks "Do you want to delete Line n?", then the line is taken out (the lines below move up)
  const removeRow = async (index: number) => {
    confirmingRef.current = true;
    const yes = await confirm({ message: `Do you want to delete Line ${index + 1}?` });
    setTimeout(() => { confirmingRef.current = false; }, 0);
    if (!yes) return;
    try {
      await onRemoveRow?.(rows[index]);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Unable to delete the line.");
      return;
    }
    onChange(rows.filter((_, i) => i !== index));
  };

  const update = (index: number, key: keyof CnjRow, value: string) => {
    const base = index < rows.length ? rows[index] : emptyCnjRow();
    const next: CnjRow = { ...base, [key]: value };
    // the Carrier Code has one code for each sector of the Route: a shorter Route cuts the codes it has no sector for
    if (key === "txtCnjRoute" && routeSectors(next.txtCnjRoute) > 0) {
      next.txtCnjCarrier = formatCarrierCodes(next.txtCnjCarrier, routeSectors(next.txtCnjRoute));
    }
    // typing in the row (Route ...) with no CNJ Ticket No. yet: it becomes the Ticket No. + 1 (or the row above + 1)
    if (key !== "txtCnjTktSlNo" && next.txtCnjTktSlNo.trim() === "" && value.trim() !== "") {
      next.txtCnjTktSlNo = defaultNo(index);
    }
    onChange(index < rows.length ? rows.map((row, i) => (i === index ? next : row)) : [...rows, next]);
  };

  return (
    /* no dark layer and no click blocking: the screen behind stays usable, only the window itself takes the clicks */
    <div className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center p-3">
      <div
        role="dialog"
        aria-labelledby="cnj-modal-title"
        className="pointer-events-auto w-full max-w-2xl overflow-hidden border border-slate-400 bg-white text-[12px] text-slate-800 shadow-lg outline-none"
      >
        <div className="flex h-7.5 items-center justify-between border-b border-slate-300 bg-[#a5e0c3] px-3">
          <h2 id="cnj-modal-title" className="text-[15px] font-semibold text-slate-700">
            Ticket Sales-Conjunction
          </h2>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="px-1 text-[16px] leading-none text-slate-600 hover:text-slate-900"
          >
            ×
          </button>
        </div>

        <div className="p-3">
          <div className="overflow-x-auto border border-[#B7ECD0]">
            <table id="grdCnj" className="w-full table-fixed border-collapse text-[12px]">
              <colgroup>
                <col className="w-6" />
                {COLUMNS.map((column) => (
                  <col key={column.key} className={column.width} />
                ))}
              </colgroup>
              <thead>
                <tr>
                  <th className={`${th} w-6 px-0`} />
                  {COLUMNS.map((column) => (
                    <th key={column.key} className={th}>
                      {column.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {shown.map((row, index) => (
                  <tr key={index}>
                    <td className="h-[28px] border border-[#B7ECD0] bg-[#fafbfc] text-center text-[8px] text-[#405066]">
                      {index === rows.length ? "▶" : ""}
                    </td>
                    {COLUMNS.map((column, columnIndex) => (
                      <td key={column.key} className={cell}>
                        <div className="flex h-full items-center">
                        <input
                          ref={index === 0 && columnIndex === 0 ? firstCellRef : undefined}
                          id={`cnj-${index}-${column.key}`}
                          aria-label={column.label}
                          value={row[column.key]}
                          maxLength={column.maxLength}
                          onFocus={(event) => event.target.select()}
                          onBlur={() => {
                            // leaving the Carrier Code box: it must be one code of 2 characters for each sector of the Route
                            if (column.key !== "txtCnjCarrier" || index >= rows.length) return;
                            const issue = cnjCarrierIssue(row.txtCnjRoute, row.txtCnjCarrier);
                            setCarrierLeft((previous) => (previous.includes(index) ? previous : [...previous, index]));
                            if (issue) toast.error(issue);
                          }}
                          onChange={(event) =>
                            update(
                              index,
                              column.key,
                              column.key === "txtCnjCarrier"
                                ? // as many codes as the Route has sectors (4 at most; no Route yet: 4)
                                  formatCarrierCodes(event.target.value, routeSectors(row.txtCnjRoute) || undefined)
                                : column.format
                                  ? column.format(event.target.value)
                                  : event.target.value,
                            )
                          }
                          className={`h-full min-w-0 flex-1 bg-transparent px-2 text-[12px] outline-none ${
                            column.key === "txtCnjCarrier" && carrierLeft.includes(index) && cnjCarrierIssue(row.txtCnjRoute, row.txtCnjCarrier)
                              ? "text-[#c0392b]"
                              : "text-[#24364d]"
                          }`}
                        />
                        {/* the x of the line: at the end of the last column, for a line that has something in it */}
                        {columnIndex === COLUMNS.length - 1 && index < rows.length && !isEmptyCnjRow(row) && (
                          <button
                            type="button"
                            title={`Delete Line ${index + 1}`}
                            aria-label={`Delete Line ${index + 1}`}
                            tabIndex={-1}
                            onClick={() => void removeRow(index)}
                            className="mr-1 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded text-[14px] leading-none text-gray-600 hover:bg-red-50 hover:text-red-600"
                          >
                            ×
                          </button>
                        )}
                        </div>
                      </td>
                    ))}
                  </tr>
                ))}
                {Array.from({ length: blanks }).map((_, index) => (
                  <tr key={`blank-${index}`}>
                    <td className="h-[28px] border border-[#B7ECD0] bg-[#fafbfc]" />
                    {COLUMNS.map((column) => (
                      <td key={column.key} className="h-[28px] border border-[#B7ECD0]" />
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      <div className="pointer-events-auto">{dialog}</div>
    </div>
  );
};

export default CnjModal;
