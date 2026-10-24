import React, { useState } from "react";
import Header from "../../components/comman/Header";

type AirlineRow = {
  key: number;
  no: string;
  name: string;
  code: string;
  vatOnCommission: boolean;
};

const MIN_ROWS = 20;

/* Replace with data from your API */
const initialData: Omit<AirlineRow, "key">[] = [
  { no: "000", name: "CHAM WINGS", code: "6Q", vatOnCommission: true },
  { no: "001", name: "AMERICAN AIRLINES", code: "AA", vatOnCommission: true },
  { no: "005", name: "CONTINENTAL AIRLINES", code: "CO", vatOnCommission: true },
  { no: "006", name: "DELTA AIRLINES", code: "DL", vatOnCommission: true },
  { no: "007", name: "FLYADEAL", code: "FY", vatOnCommission: true },
  { no: "009", name: "GMG AIRLINES", code: "Z5", vatOnCommission: true },
  { no: "014", name: "AIR CANADA", code: "AC", vatOnCommission: true },
  { no: "016", name: "UNITED AIRLINES", code: "UA", vatOnCommission: true },
  { no: "018", name: "Juneyao Airlines Co. Ltd", code: "DK", vatOnCommission: true },
  { no: "032", name: "ASKY AIR", code: "KP", vatOnCommission: true },
  { no: "037", name: "US AIRWAYS", code: "US", vatOnCommission: true },
  { no: "047", name: "TAP Portugal", code: "TP", vatOnCommission: true },
  { no: "048", name: "CYPRUS AIRWAYS", code: "CY", vatOnCommission: true },
  { no: "055", name: "ALITALIA SPA", code: "AZ", vatOnCommission: true },
  { no: "057", name: "AIR FRANCE", code: "AF", vatOnCommission: true },
  { no: "058", name: "INDIAN AIRLINES", code: "IC", vatOnCommission: true },
  { no: "065", name: "SAUDIA", code: "SV", vatOnCommission: true },
  { no: "066", name: "Onur Air Tasimacilik A.S", code: "8Q", vatOnCommission: true },
  { no: "06E", name: "INDIGO", code: "6E", vatOnCommission: true },
  { no: "070", name: "SYRIAN ARAB AIRLINES", code: "RB", vatOnCommission: true },
];

let keyCounter = 0;
const nextKey = () => ++keyCounter;

const emptyRow = (): AirlineRow => ({
  key: nextKey(),
  no: "",
  name: "",
  code: "",
  vatOnCommission: false,
});

const isEmptyRow = (row: AirlineRow) =>
  !row.no && !row.name && !row.code && !row.vatOnCommission;

/** keeps one empty "new" row at the end and at least MIN_ROWS rows in total */
const padRows = (rows: AirlineRow[]): AirlineRow[] => {
  const result = [...rows];
  if (result.length === 0 || !isEmptyRow(result[result.length - 1])) {
    result.push(emptyRow());
  }
  while (result.length < MIN_ROWS) result.push(emptyRow());
  return result;
};

const buildInitialRows = (): AirlineRow[] =>
  padRows(initialData.map((row) => ({ key: nextKey(), ...row })));

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

const cellInputClass =
  "h-[30px] w-full bg-transparent px-2 text-[12px] text-[#24364d] outline-none focus:bg-white focus:ring-1 focus:ring-inset focus:ring-[#91a7b9]";

const thClass =
  "h-[30px] border border-[#B7ECD0] bg-[#E7F7ED] px-2 font-normal text-[#405066]";

type AirlinePageProps = {
  onClose?: () => void;
};

const AirlinePage: React.FC<AirlinePageProps> = ({ onClose }) => {
  const [rows, setRows] = useState<AirlineRow[]>(buildInitialRows);
  const [selectedKey, setSelectedKey] = useState<number | null>(
    () => rows[0]?.key ?? null,
  );
  //@ts-ignore
  const [showSearch, setShowSearch] = useState(false);
  const [query, setQuery] = useState("");
  const [error, setError] = useState("");

  // the first empty row is the "new row" at the end of the data
  const firstEmptyKey = rows.find((row) => isEmptyRow(row))?.key ?? null;

  const updateCell = <K extends "no" | "name" | "code" | "vatOnCommission">(
    key: number,
    field: K,
    value: AirlineRow[K],
  ) => {
    setError("");
    setRows((prev) =>
      padRows(
        prev.map((row) => (row.key === key ? { ...row, [field]: value } : row)),
      ),
    );
  };

  const handleSave = () => {
    const filled = rows.filter((row) => !isEmptyRow(row));

    if (filled.some((row) => !row.no.trim() || !row.name.trim())) {
      setError("Every airline needs an airline no and an airline name.");
      return;
    }
    const numbers = filled.map((row) => row.no.trim().toLowerCase());
    if (new Set(numbers).size !== numbers.length) {
      setError("Airline numbers must be unique.");
      return;
    }

    setError("");
    console.log(
      filled.map((row) => ({
        no: row.no.trim(),
        name: row.name.trim(),
        code: row.code.trim(),
        vatOnCommission: row.vatOnCommission,
      })),
    );
  };

  const handleSearch = () => {
    setShowSearch((prev) => !prev);
    setQuery("");
  };

  const handleClose = () => {
    const fresh = buildInitialRows();
    setRows(fresh);
    setSelectedKey(fresh[0]?.key ?? null);
    setShowSearch(false);
    setQuery("");
    setError("");
    onClose?.();
  };

  const search = query.trim().toLowerCase();
  const visibleRows = search
    ? rows.filter(
        (row) =>
          row.no.toLowerCase().includes(search) ||
          row.name.toLowerCase().includes(search) ||
          row.code.toLowerCase().includes(search),
      )
    : rows;

  return (
    <div className="flex min-h-full w-full items-start justify-center bg-white px-4 py-4">
      <div className="min-h-fit w-200 max-w-full bg-white p-0">
        <main className="w-full overflow-hidden border border-gray-400 bg-white">
          <Header Name="Airline"/>

          <section className="px-3.5 pb-3 pt-3">
            {/* {showSearch && (
              <div className="mb-3 flex items-center gap-3">
                <div className="flex h-[30px] w-[110px] items-center justify-end border border-[#e0e5ea] bg-[#fafbfc] pr-3 text-[12px] text-[#405066]">
                  Search :
                </div>
                <input
                  id="txtSearch"
                  type="text"
                  autoFocus
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Airline no, name or code"
                  className="h-[30px] w-[280px] rounded-[4px] border border-[#cfd7df] bg-white px-2 text-[12px] text-[#24364d] outline-none focus:border-[#91a7b9]"
                />
              </div>
            )} */}

            {/* Grid: header stays on top, rows scroll */}
            <div
              className={`max-h-[min(540px,calc(100vh-240px))] overflow-auto border border-[#B7ECD0] bg-white ${niceScrollbar}`}
            >
              <table className="w-full table-fixed border-collapse text-[12px] text-[#24364d]">
                <colgroup>
                  <col className="w-5.5" />
                  <col className="w-22.5" />
                  <col />
                  <col className="w-25" />
                  <col className="w-37.5" />
                </colgroup>
                <thead className="sticky top-0 z-10">
                  <tr>
                    <th className={thClass} />
                    <th className={`${thClass} text-left`}>Airline No</th>
                    <th className={`${thClass} text-left`}>Airline Name</th>
                    <th className={`${thClass} text-left`}>Airline Code</th>
                    <th className={`${thClass} text-center`}>
                      VAT On Commission
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {visibleRows.map((row) => {
                    const selected = row.key === selectedKey;
                    const isNewRow = row.key === firstEmptyKey;
                    return (
                      <tr
                        key={row.key}
                        onClick={() => setSelectedKey(row.key)}
                        className={selected ? "bg-[#f2faf5]" : "bg-white"}
                      >
                        <td className="h-7.5 border border-[#B7ECD0] bg-[#fafbfc] text-center text-[10px] text-[#405066]">
                          {selected ? "▶" : isNewRow ? "*" : ""}
                        </td>
                        <td
                          className={`border border-[#B7ECD0] p-0 ${selected ? "bg-[#F2FAF5]" : ""}`}
                        >
                          <input
                            aria-label="Airline No"
                            maxLength={3}
                            value={row.no}
                            onFocus={() => setSelectedKey(row.key)}
                            onChange={(event) =>
                              updateCell(
                                row.key,
                                "no",
                                event.target.value.toUpperCase(),
                              )
                            }
                            className={cellInputClass}
                          />
                        </td>
                        <td className="border border-[#B7ECD0] p-0">
                          <input
                            aria-label="Airline Name"
                            value={row.name}
                            onFocus={() => setSelectedKey(row.key)}
                            onChange={(event) =>
                              updateCell(row.key, "name", event.target.value)
                            }
                            className={cellInputClass}
                          />
                        </td>
                        <td className="border border-[#B7ECD0] p-0">
                          <input
                            aria-label="Airline Code"
                            maxLength={3}
                            value={row.code}
                            onFocus={() => setSelectedKey(row.key)}
                            onChange={(event) =>
                              updateCell(
                                row.key,
                                "code",
                                event.target.value.toUpperCase(),
                              )
                            }
                            className={cellInputClass}
                          />
                        </td>
                        <td className="border border-[#B7ECD0] text-center">
                          <input
                            aria-label="VAT On Commission"
                            type="checkbox"
                            checked={row.vatOnCommission}
                            onFocus={() => setSelectedKey(row.key)}
                            onChange={(event) =>
                              updateCell(
                                row.key,
                                "vatOnCommission",
                                event.target.checked,
                              )
                            }
                            className="h-4 w-4 align-middle accent-[#64d96e]"
                          />
                        </td>
                      </tr>
                    );
                  })}

                  {visibleRows.length === 0 && (
                    <tr>
                      <td
                        colSpan={5}
                        className="h-15 border border-[#B7ECD0] text-center text-[12px] text-[#7a8794]"
                      >
                        No airlines found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {error && (
              <p role="alert" className="mt-2 text-[12px] text-[#c0392b]">
                {error}
              </p>
            )}

            {/* Actions */}
            <div className="mt-5 flex justify-center gap-3">
              <button
                id="btnSave"
                type="button"
                onClick={handleSave}
                className="btn-style"
              >
                <u>S</u>ave
              </button>
              <button
                id="btnSearch"
                type="button"
                onClick={handleSearch}
                className="btn-style"
              >
                <u>S</u>earch
              </button>
              <button
                id="btnClose"
                type="button"
                onClick={handleClose}
                className="btn-style"
              >
                <u>C</u>lose
              </button>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
};

export default AirlinePage;