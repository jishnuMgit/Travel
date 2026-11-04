import React, { useState } from "react";

import CustomLinkedPairSelect, {
  type PairSelectOption,
} from "../../../components/comman/CustomLinkedPairSelect";
import Header from "../../../components/comman/Header";


type DivisionRow = {
  key: number;
  id: string;
  name: string;
  nameAr: string;
};

const MIN_ROWS = 16;

/* Replace these with data from your API */
const customerIdOptions = [
  { value: "C001", label: "C001" },
  { value: "C002", label: "C002" },
  { value: "C003", label: "C003" },
];
const customerNameOptions = [
  { value: "C001", label: "Customer One" },
  { value: "C002", label: "Customer Two" },
  { value: "C003", label: "Customer Three" },
];

const customerPairOptions: PairSelectOption[] = customerIdOptions.map((item) => ({
  value: item.value,
  firstLabel: item.label,
  secondLabel:
    customerNameOptions.find((name) => name.value === item.value)?.label ?? "",
}));

/* Sample divisions per customer. Replace with an API call that uses the
   selected customer. */
const divisionsByCustomer: Record<string, Omit<DivisionRow, "key">[]> = {
  C001: [
    { id: "D1", name: "HEAD OFFICE", nameAr: "المكتب الرئيسي" },
    { id: "D2", name: "SALES", nameAr: "المبيعات" },
  ],
  C002: [{ id: "D1", name: "OPERATIONS", nameAr: "العمليات" }],
  C003: [],
};

let keyCounter = 0;
const nextKey = () => ++keyCounter;

const emptyRow = (): DivisionRow => ({
  key: nextKey(),
  id: "",
  name: "",
  nameAr: "",
});

const isEmptyRow = (row: DivisionRow) => !row.id && !row.name && !row.nameAr;

/** keeps one empty "new" row at the end and at least MIN_ROWS rows in total */
const padRows = (rows: DivisionRow[]): DivisionRow[] => {
  const result = [...rows];
  if (result.length === 0 || !isEmptyRow(result[result.length - 1])) {
    result.push(emptyRow());
  }
  while (result.length < MIN_ROWS) result.push(emptyRow());
  return result;
};

const buildRows = (customerId: string | null): DivisionRow[] =>
  padRows(
    (customerId ? divisionsByCustomer[customerId] ?? [] : []).map((row) => ({
      key: nextKey(),
      ...row,
    })),
  );

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
  "h-[26px] w-full bg-transparent px-2 text-[12px] text-[#24364d] outline-none focus:bg-white focus:ring-1 focus:ring-inset focus:ring-[#91a7b9]";

const thClass =
  "h-[28px] border border-[#B7ECD0] bg-[#EEFBF4] px-2 font-semibold text-[#405066]";

type CustomerDivisionPageProps = {
  onClose?: () => void;
};

const CustomerDivisionPage: React.FC<CustomerDivisionPageProps> = ({
  onClose,
}) => {
  const [customer, setCustomer] = useState<string | null>(null); // lkpCustomerID / lkpCustomerName
  const [rows, setRows] = useState<DivisionRow[]>(() => buildRows(null));
  const [selectedKey, setSelectedKey] = useState<number | null>(
    () => rows[0]?.key ?? null,
  );
  const [error, setError] = useState("");

  // the first empty row is the "new row" at the end of the data
  const firstEmptyKey = rows.find((row) => isEmptyRow(row))?.key ?? null;

  const loadCustomer = (customerId: string | null) => {
    setCustomer(customerId);
    const fresh = buildRows(customerId);
    setRows(fresh);
    setSelectedKey(fresh[0]?.key ?? null);
    setError("");
  };

  const updateCell = (
    key: number,
    field: "id" | "name" | "nameAr",
    value: string,
  ) => {
    setError("");
    setRows((prev) =>
      padRows(
        prev.map((row) => (row.key === key ? { ...row, [field]: value } : row)),
      ),
    );
  };

  const handleSave = () => {
    if (!customer) {
      setError("Select the customer.");
      return;
    }
    const filled = rows.filter((row) => !isEmptyRow(row));
    if (filled.some((row) => !row.id.trim() || !row.name.trim())) {
      setError("Every division needs a division ID and a division name.");
      return;
    }
    const ids = filled.map((row) => row.id.trim().toLowerCase());
    if (new Set(ids).size !== ids.length) {
      setError("Division IDs must be unique.");
      return;
    }
    setError("");
    console.log({
      customer,
      divisions: filled.map((row) => ({
        id: row.id.trim(),
        name: row.name.trim(),
        nameAr: row.nameAr.trim(),
      })),
    });
  };

  const handleCancel = () => loadCustomer(customer);

  const handleClose = () => {
    loadCustomer(null);
    onClose?.();
  };
  return (
    <div className="flex min-h-full w-full items-start justify-center bg-white px-4 py-4">
      <div className="min-h-fit w-225 max-w-full bg-white p-0">
        <main className="w-full overflow-hidden border border-gray-400 bg-white">
          <Header Name="Customer Division " />
          <section className="px-3.5 pb-3 pt-3">
            {/* Customer */}
            <div className="flex items-center gap-2">
              <label
                htmlFor="lkpCustomerID"
                className="w-17.5 shrink-0 text-right text-[12px] "  >
                Customer :
              </label>
              <div className="min-w-0 flex-1">
                <CustomLinkedPairSelect
                  firstInputId="lkpCustomerID"
                  secondInputId="lkpCustomerName"
                  options={customerPairOptions}
                  firstValue={customer ?? null}
                  secondValue={customer ?? null}
                  firstHeader="Customer ID"
                  secondHeader="Customer Name"
                  firstWidth={120}
                  secondWidth={400}
                  gap={4}
                  headerFontSize="12px"
                  onChange={(option) => loadCustomer(option?.value ?? null)}
                />
              </div>
            </div>

            {/* Grid: header stays on top, rows scroll */}
            <div
              className={`mt-3 max-h-[min(520px,calc(100vh-260px))] overflow-auto border border-[#B7ECD0] bg-white ${niceScrollbar}`}
            >
              <table className="w-full table-fixed border-collapse text-[12px] text-[#24364d]">
                <colgroup>
                  <col className="w-5.5" />
                  <col className="w-32.5" />
                  <col />
                  <col />
                </colgroup>
                <thead className="sticky top-0 z-10 bg-[#EEFBF4]">
                  <tr className="bg-[#EEFBF4]"  >
                    <th className={thClass} />
                    <th className={`${thClass} text-left`}>Division ID</th>
                    <th className={`${thClass} text-left`}>Division Name</th>
                    <th className={`${thClass} text-right`}>
                      Division Name (Arabic)
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => {
                    const selected = row.key === selectedKey;
                    const isNewRow = row.key === firstEmptyKey;
                    return (
                      <tr
                        key={row.key}
                        onClick={() => setSelectedKey(row.key)}
                        className="bg-white"
                      >
                        <td className="h-6.5 border border-[#B7ECD0] bg-[#fafbfc] text-center text-[10px] text-[#405066]">
                          {selected ? "▶" : isNewRow ? "*" : ""}
                        </td>
                        <td
                          className={`border border-[#B7ECD0] p-0 ${selected ? "bg-[#e7f7ed]" : ""}`}
                        >
                          <input
                            aria-label="Division ID"
                            value={row.id}
                            onFocus={() => setSelectedKey(row.key)}
                            onChange={(event) =>
                              updateCell(
                                row.key,
                                "id",
                                event.target.value.toUpperCase(),
                              )
                            }
                            className={cellInputClass}
                          />
                        </td>
                        <td className="border border-[#B7ECD0] p-0">
                          <input
                            aria-label="Division Name"
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
                            aria-label="Division Name (Arabic)"
                            dir="rtl"
                            value={row.nameAr}
                            onFocus={() => setSelectedKey(row.key)}
                            onChange={(event) =>
                              updateCell(row.key, "nameAr", event.target.value)
                            }
                            className={`${cellInputClass} text-right`}
                          />
                        </td>
                      </tr>
                    );
                  })}
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
                id="btnCancel"
                type="button"
                onClick={handleCancel}
                className="btn-style"
              >
                <u>C</u>ancel
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

export default CustomerDivisionPage;