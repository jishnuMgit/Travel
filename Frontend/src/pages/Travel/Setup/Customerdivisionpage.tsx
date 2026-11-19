import React, { useEffect, useMemo, useRef, useState } from "react";
import CustomLinkedPairSelect, {
  type PairSelectOption,
} from "../../../components/common/CustomLinkedPairSelect";
import Header from "../../../components/common/Header";
import { toast } from "react-toastify";
import {
  getCustomerDivisionCustomers,
  getCustomerDivisionRows,
  saveCustomerDivisionRows,
  type CustomerDivisionRecord,
  type CustomerDivisionCustomerLookups,
} from "../../../utils/airlineApi";

type DivisionRow = {
  key: number;
  id: string;
  name: string;
  nameAr: string;
};

const MIN_ROWS = 16;

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

const buildRows = (divisions: CustomerDivisionRecord[] = []): DivisionRow[] =>
  padRows(
    divisions.map((division) => ({
      key: nextKey(),
      id: division.fdivid,
      name: division.fdivname ?? "",
      nameAr: division.fdivname_ar ?? "",
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
  const PstrCoID = localStorage.getItem("PstrCoID")?.trim() ?? "";
  const [customerLookups, setCustomerLookups] =
    useState<CustomerDivisionCustomerLookups>({
      SortByName: [],
      SortByID: [],
    });
  const [customer, setCustomer] = useState<string | null>(null);
  const [rows, setRows] = useState<DivisionRow[]>(() => buildRows());
  const [selectedKey, setSelectedKey] = useState<number | null>(
    () => rows[0]?.key ?? null,
  );
  const [error, setError] = useState("");
  const [loadingCustomers, setLoadingCustomers] = useState(true);
  const [loadingDivisions, setLoadingDivisions] = useState(false);
  const [saving, setSaving] = useState(false);
  const requestSequence = useRef(0);

  const customerPairOptions = useMemo<PairSelectOption[]>(
    () =>
      customerLookups.SortByID.map((item) => ({
        value: item.fcsaccountid,
        firstLabel: item.fcsaccountid,
        secondLabel: item.fcsaccountname ?? item.fcsaccountid,
      })).sort((a, b) =>
        a.firstLabel.localeCompare(b.firstLabel, undefined, {
          sensitivity: "base",
          numeric: true,
        }),
      ),
    [customerLookups.SortByID],
  );
  const customerNamePairOptions = useMemo<PairSelectOption[]>(
    () =>
      customerLookups.SortByName.map((item) => ({
        value: item.fcsaccountid,
        firstLabel: item.fcsaccountid,
        secondLabel: item.fcsaccountname ?? item.fcsaccountid,
      })),
    [customerLookups.SortByName],
  );

  // the first empty row is the "new row" at the end of the data
  const firstEmptyKey = rows.find((row) => isEmptyRow(row))?.key ?? null;

  useEffect(() => {
    let cancelled = false;
    const loadCustomers = async () => {
      if (!PstrCoID) {
        setError("Company ID (PstrCoID) was not found in localStorage.");
        setLoadingCustomers(false);
        return;
      }

      try {
        const customerData = await getCustomerDivisionCustomers(PstrCoID);
        if (!cancelled) setCustomerLookups(customerData);
      } catch (loadError) {
        if (!cancelled) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Failed to load customers.",
          );
        }
      } finally {
        if (!cancelled) setLoadingCustomers(false);
      }
    };

    void loadCustomers();
    return () => {
      cancelled = true;
      requestSequence.current += 1;
    };
  }, [PstrCoID]);

  const loadCustomer = async (customerId: string | null) => {
    const sequence = ++requestSequence.current;
    setCustomer(customerId);
    setError("");

    if (!customerId) {
      const fresh = buildRows();
      setRows(fresh);
      setSelectedKey(fresh[0]?.key ?? null);
      setLoadingDivisions(false);
      return;
    }

    const pendingRows = buildRows();
    setRows(pendingRows);
    setSelectedKey(pendingRows[0]?.key ?? null);
    setLoadingDivisions(true);
    try {
      const divisions = await getCustomerDivisionRows(PstrCoID, customerId);
      if (sequence !== requestSequence.current) return;
      const fresh = buildRows(divisions);
      setRows(fresh);
      setSelectedKey(fresh[0]?.key ?? null);
    } catch (loadError) {
      if (sequence === requestSequence.current) {
        setError(
          loadError instanceof Error
            ? loadError.message
            : "Failed to load customer divisions.",
        );
        const fresh = buildRows();
        setRows(fresh);
        setSelectedKey(fresh[0]?.key ?? null);
      }
    } finally {
      if (sequence === requestSequence.current) setLoadingDivisions(false);
    }
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

  const handleSave = async () => {
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

    setSaving(true);
    try {
      const response = await saveCustomerDivisionRows({
        PstrCoID,
        StrCustomerID: customer,
        Rows: filled.map((row) => ({
          StrDivID: row.id.trim(),
          StrDivName: row.name.trim(),
          StrDivNameAr: row.nameAr.trim(),
        })),
      });
      if (!response.success) throw new Error(response.message);
      toast.success(response.message);
      await loadCustomer(customer);
    } catch (saveError) {
      const message =
        saveError instanceof Error
          ? saveError.message
          : "Failed to save customer divisions.";
      setError(message);
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => void loadCustomer(customer);

  const handleClose = () => {
    requestSequence.current += 1;
    setCustomer(null);
    const fresh = buildRows();
    setRows(fresh);
    setSelectedKey(fresh[0]?.key ?? null);
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
                  secondOptions={customerNamePairOptions}
                  firstValue={customer ?? null}
                  secondValue={customer ?? null}
                  firstHeader="Customer ID"
                  secondHeader="Customer Name"
                  firstWidth={120}
                  secondWidth={400}
                  gap={4}
                  headerFontSize="12px"
                  isDisabled={loadingCustomers || loadingDivisions || saving}
                  onChange={(option) => void loadCustomer(option?.value ?? null)}
                />
              </div>
            </div>

            {loadingCustomers && (
              <p className="mt-2 text-[12px] text-slate-500">
                Loading customers...
              </p>
            )}

            {loadingDivisions && (
              <p className="mt-2 text-[12px] text-slate-500">
                Loading divisions...
              </p>
            )}

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
                            disabled={!customer || loadingDivisions || saving}
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
                            disabled={!customer || loadingDivisions || saving}
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
                            disabled={!customer || loadingDivisions || saving}
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
                onClick={() => void handleSave()}
                disabled={!customer || loadingCustomers || loadingDivisions || saving}
                className="btn-style disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving ? "Saving..." : <><u>S</u>ave</>}
              </button>
              <button
                id="btnCancel"
                type="button"
                onClick={handleCancel}
                disabled={loadingDivisions || saving}
                className="btn-style disabled:cursor-not-allowed disabled:opacity-50"
              >
                <u>C</u>lear
              </button>
              <button
                id="btnClose"
                type="button"
                onClick={handleClose}
                disabled={saving}
                className="btn-style disabled:cursor-not-allowed disabled:opacity-50"
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