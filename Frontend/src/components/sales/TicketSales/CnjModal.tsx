import React, { useEffect, useRef } from "react";
import { GRID_CELL_FOCUS_CLASS } from "../../../hooks/useGridCellFocus";
import { formatRoute } from "./ticketSalesValidation";

/* Sales Conjunction (the old frmTktSalesCnj): opens when CNJ. is Yes (or from the CNJ button). The conjunction ticket of this
   ticket: CNJ Ticket No., Route, Carrier, Class. One conjunction ticket per ticket (the table has one row per ticket), so the
   grid has one row. Esc, the X button or Close closes it; the row stays on the screen. The screen behind is not blocked
   (no dark layer). */

export type CnjRow = {
  txtCnjTktSlNo: string; // CNJ Ticket No. (fCnjTktSlNo)
  txtCnjRoute: string; // Route (fRoute)
  txtCnjCarrier: string; // Carrier (fCarrier)
  txtCnjClass: string; // Class (fClass)
};

export const emptyCnjRow = (): CnjRow => ({ txtCnjTktSlNo: "", txtCnjRoute: "", txtCnjCarrier: "", txtCnjClass: "" });

export const isEmptyCnjRow = (row: CnjRow) =>
  row.txtCnjTktSlNo.trim() === "" && row.txtCnjRoute.trim() === "" && row.txtCnjCarrier.trim() === "" && row.txtCnjClass.trim() === "";

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
  { key: "txtCnjRoute", label: "Route", width: "w-[30%]", maxLength: 11, format: formatRoute },
  { key: "txtCnjCarrier", label: "Carrier", width: "w-[24%]", maxLength: 8, format: upper },
  { key: "txtCnjClass", label: "Class", width: "w-[20%]", maxLength: 8, format: upper },
];

const th = "h-[30px] border border-[#B7ECD0] bg-[#EEFBF4] px-2 text-left font-normal text-[#405066]";
const cell = `h-[28px] border border-[#B7ECD0] p-0 ${GRID_CELL_FOCUS_CLASS}`;

type CnjModalProps = {
  open: boolean;
  rows: CnjRow[];
  onChange: (rows: CnjRow[]) => void;
  onClose: () => void;
};

const MIN_ROWS = 6; // the grid is as tall as the old one even when it has few rows

const CnjModal: React.FC<CnjModalProps> = ({ open, rows, onChange, onClose }) => {
  const firstCellRef = useRef<HTMLInputElement>(null);

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
      if (event.key === "Escape") {
        event.preventDefault();
        onCloseRef.current();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  if (!open) return null;

  // one conjunction ticket per ticket (the table has one row per ticket, as the old form which used only the first row)
  const shown = [rows[0] ?? emptyCnjRow()];
  const blanks = Math.max(0, MIN_ROWS - shown.length);

  const update = (_index: number, key: keyof CnjRow, value: string) => {
    onChange([{ ...(rows[0] ?? emptyCnjRow()), [key]: value }]);
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
            Sales Conjunction
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
                      {index === 0 ? "▶" : ""}
                    </td>
                    {COLUMNS.map((column, columnIndex) => (
                      <td key={column.key} className={cell}>
                        <input
                          ref={index === 0 && columnIndex === 0 ? firstCellRef : undefined}
                          id={`cnj-${index}-${column.key}`}
                          aria-label={column.label}
                          value={row[column.key]}
                          maxLength={column.maxLength}
                          onFocus={(event) => event.target.select()}
                          onChange={(event) =>
                            update(index, column.key, column.format ? column.format(event.target.value) : event.target.value)
                          }
                          className="h-full w-full bg-transparent px-2 text-[12px] text-[#24364d] outline-none"
                        />
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

          <div className="mt-3 flex justify-center">
            <button type="button" id="btnCnjClose" onClick={onClose} className="btn-style">
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CnjModal;
