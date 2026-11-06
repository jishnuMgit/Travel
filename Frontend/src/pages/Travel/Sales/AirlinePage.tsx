import React, { useEffect, useMemo, useRef, useState } from "react";
import type { FormEvent } from "react";
import Header from "../../../components/comman/Header";
import { MdAdd, MdClose } from "react-icons/md";
import {
  createAirline,
  deleteAirline,
  getAirlines,
  updateAirline,
} from "../../../utils/airlineApi";
import type { AirlinePayload, AirlineRecord } from "../../../utils/airlineApi";
import { FiTrash2 } from "react-icons/fi";
import { HiOutlinePencilAlt } from "react-icons/hi";
import { toast } from "react-toastify";


type AirlineRow = {
  key: number;
  /** Original primary-key value, retained when the airline number is edited. */
  originalNo: string | null;
  originalValues: { no: string; name: string; code: string; vatOnCommission: boolean } | null;
  no: string;
  name: string;
  code: string;
  vatOnCommission: boolean;
};

type AirlinePageProps = {
  onClose?: () => void;
  /** Company ID (dbo.tblairline.fcoid). If omitted, VITE_COMPANY_ID is used. */
  PstrCoID?: string;
  /** User ID saved in fcuserid/fmuserid. */
  PstrUserID?: string;
};

const MIN_ROWS = 20;
let keyCounter = 0;
const nextKey = () => ++keyCounter;

const emptyRow = (): AirlineRow => ({
  key: nextKey(),
  originalNo: null,
  originalValues: null,
  no: "",
  name: "",
  code: "",
  vatOnCommission: false,
});

const isEmptyRow = (row: AirlineRow) =>
  row.originalNo === null &&
  !row.no.trim() &&
  !row.name.trim() &&
  !row.code.trim() &&
  !row.vatOnCommission;

const padRows = (rows: AirlineRow[]): AirlineRow[] => {
  const result = [...rows];
  if (result.length === 0 || !isEmptyRow(result[result.length - 1])) {
    result.push(emptyRow());
  }
  while (result.length < MIN_ROWS) result.push(emptyRow());
  return result;
};

const mapRecordToRow = (record: AirlineRecord): AirlineRow => ({
  key: nextKey(),
  originalNo: record.fairlineno ?? null,
  originalValues: {
    no: record.fairlineno ?? "",
    name: record.fairlinename ?? "",
    code: record.fairlinecode ?? "",
    vatOnCommission: Boolean(record.fvatoncommission),
  },
  no: record.fairlineno ?? "",
  name: record.fairlinename ?? "",
  code: record.fairlinecode ?? "",
  vatOnCommission: Boolean(record.fvatoncommission),
});

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
  "h-[30px] border border-[#B7ECD0] bg-[#E7F7ED] px-2 font-normal text-[#405066]";

const AirlinePage: React.FC<AirlinePageProps> = ({ onClose, PstrCoID , PstrUserID }) => {
const CoID = (
  PstrCoID  ||
  localStorage.getItem("PstrCoID") ||
  ""
).trim();
  const [rows, setRows] = useState<AirlineRow[]>(() => padRows([]));
  const [selectedKey, setSelectedKey] = useState<number | null>(null);
  const [query, setQuery] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingTarget, setEditingTarget] = useState<AirlineRow | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AirlineRow | null>(null);
  const [deleting, setDeleting] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const [txtAirlineNo, txtsetAirlineNo] = useState("");
  const [txtAirlineName, txtsetAirlineName] = useState("");
  const [txtAirlineCode, txtsetAirlineCode] = useState("");
  const [chkVatOnCommision, txtsetVatOnCommission] = useState(false);
  const [formError, setFormError] = useState("");
  const [adding, setAdding] = useState(false);

  const loadAirlines = async () => {
    if (!CoID) {
      setError("Company ID (fcoid) is missing. Pass fcoid to AirlinePage or set VITE_COMPANY_ID.");
      setRows(padRows([]));
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const data = await getAirlines(CoID);
      const mapped = data.map(mapRecordToRow);
      const nextRows = padRows(mapped);
      setRows(nextRows);
      setSelectedKey(nextRows[0]?.key ?? null);
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load airlines.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadAirlines();
    // loadAirlines intentionally runs when the company changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [CoID]);

  const firstEmptyKey = rows.find((row) => isEmptyRow(row))?.key ?? null;


  const visibleRows = useMemo(() => {
    const search = query.trim().toLowerCase();
    if (!search) return rows;
    return rows.filter(
      (row) =>
        row.no.toLowerCase().includes(search) ||
        row.name.toLowerCase().includes(search) ||
        row.code.toLowerCase().includes(search),
    );
  }, [rows, query]);


  const handleDelete = async () => {
    if (!deleteTarget || isEmptyRow(deleteTarget)) return;
    const row = deleteTarget;
    setFormError("");
    setDeleting(true);
    try {
      if (row.originalNo) {
        if (!CoID) throw new Error("Company ID (fcoid) is missing.");
        await deleteAirline(CoID, row.originalNo);
        toast.success("Deleted successfully");
        await loadAirlines();
      } else {
        setRows((previous) => padRows(previous.filter((item) => item.key !== row.key)));
        toast.success("Deleted successfully");
      }
      setDeleteTarget(null);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Unable to delete airline.");
    } finally {
      setDeleting(false);
    }
  };

  const resetAddForm = () => {
    txtsetAirlineNo("");
    txtsetAirlineName("");
    txtsetAirlineCode("");
    txtsetVatOnCommission(false);
    setFormError("");
  };

  const openAddModal = () => {
    setEditingTarget(null);
    setDeleteTarget(null);
    resetAddForm();
    setShowAddModal(true);
  };

  const openModifyModal = (row: AirlineRow) => {
    if (isEmptyRow(row)) return;
    setDeleteTarget(null);
    setEditingTarget(row);
    txtsetAirlineNo(row.no);
    txtsetAirlineName(row.name);
    txtsetAirlineCode(row.code);
    txtsetVatOnCommission(row.vatOnCommission);
    setFormError("");
    setShowAddModal(true);
  };

  const openDeleteModal = (row: AirlineRow) => {
    if (isEmptyRow(row)) return;
    setEditingTarget(null);
    setDeleteTarget(row);
    txtsetAirlineNo(row.no);
    txtsetAirlineName(row.name);
    txtsetAirlineCode(row.code);
    txtsetVatOnCommission(row.vatOnCommission);
    setFormError("");
  };

  const handleModalSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (deleteTarget) return;

    if (!CoID) {
      setFormError("Company ID (fcoid) is missing.");
      return;
    }

    const airlineNo = txtAirlineNo.trim().toUpperCase();
    const airlineName = txtAirlineName.trim();
    const airlineCode = txtAirlineCode.trim().toUpperCase();

    if (!airlineNo || !airlineName || !airlineCode) {
      setFormError("Airline No, Airline Name, and Airline Code are required.");
      return;
    }

    if (airlineNo.length > 3 || airlineCode.length > 3 || airlineName.length > 50) {
      setFormError("Airline No and Airline Code allow 3 characters; Airline Name allows 50 characters.");
      return;
    }

    const duplicate = rows.some((row) =>
      !isEmptyRow(row) &&
      row.key !== editingTarget?.key &&
      row.no.trim().toUpperCase() === airlineNo
    );

    if (duplicate) {
      setFormError("Airline number already exists.");
      return;
    }

    setAdding(true);
    setFormError("");

    const payload: AirlinePayload = {
      StrAirlineNo: airlineNo,
      StrAirlineName: airlineName,
      StrAirlineCode: airlineCode || null,
      ChkVatOnCommission: chkVatOnCommision,
      PstrUserID: PstrUserID || localStorage.getItem("PstrUserID") || null,
      userdate: new Date().toISOString(),
      
    };

    try { 
      if (editingTarget) {
        const originalNo = editingTarget.originalNo ?? editingTarget.no;
        await updateAirline(CoID, originalNo, payload);
        toast.success("Modified successfully");
      } else {
        await createAirline(CoID, payload);
        toast.success("Saved successfully");
      }

      setShowAddModal(false);
      setEditingTarget(null);
      resetAddForm();
      await loadAirlines();
    } catch (err) {
      setFormError(
        err instanceof Error
          ? err.message
          : editingTarget
            ? "Unable to modify airline."
            : "Unable to add airline."
      );
    } finally {
      setAdding(false);
    }
  };

  const handleClose = () => onClose?.();

  return (
    <div className="flex min-h-full w-full items-start justify-center bg-white px-4 py-4">
      <div className="min-h-fit w-200 max-w-full bg-white p-0">
        <main className="w-full overflow-hidden border border-gray-400 bg-white">
          <Header Name="Airline" />

          <div className="flex flex-wrap items-center gap-3 px-3 pt-3">
            <input
              ref={searchInputRef}
              aria-label="Search airlines"
              placeholder="Search by Airline No, Airline Name or Airline Code"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className="input-style h-7.5 w-121 max-w-full rounded-sm border border-gray-500!"
            />
            <button
              type="button"
              onClick={openAddModal}
              className="mt-0 flex h-7.5 items-center gap-1 rounded-sm border border-gray-600 bg-[#E6F0FA] px-3 text-sm text-green-600 hover:bg-[#dbeafa]"
            >
              <MdAdd className="rounded-full bg-green-600 text-lg text-white" />
              Add
            </button>
          </div>

          <section className="px-3.5 pb-3 pt-3">
            <div className={`max-h-[min(540px,calc(100vh-240px))] overflow-auto border border-[#B7ECD0] bg-white ${niceScrollbar}`}>
              <table className="w-full table-fixed border-collapse text-[13px] text-[#24364d]">
                <colgroup>
                  <col className="w-5.5" />
                  <col className="w-22.5" />
                  <col />
                  <col className="w-25" />
                  <col className="w-37.5" />
                  <col className="w-16" />
                  <col className="w-16" />
                </colgroup>
                <thead className="sticky top-0 z-10">
                  <tr>
                    <th className={thClass} />
                    <th id="txtAirlineNo" className={`${thClass} text-left`}>Airline No.</th>
                    <th id="txtAirlineName" className={`${thClass} text-left`}>Airline Name</th>
                    <th id="txtAirlineCode" className={`${thClass} text-left`}>Airline Code</th>
                    <th id="chkVatOnCommision" className={`${thClass} text-center`}>VAT On Commission</th>
                    <th className={`${thClass} text-center`}>Modify</th>
                    <th className={`${thClass} text-center`}>Delete</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleRows.map((row) => {
                    const selected = row.key === selectedKey;
                    const isNewRow = row.key === firstEmptyKey;
                    const canDelete = !isEmptyRow(row);
                    return (
                      <tr
                        key={row.key}
                        onClick={() => setSelectedKey(row.key)}
                        className={selected ? "bg-[#f2faf5]" : "bg-white"}
                      >
                        <td className="h-7.5 border border-[#B7ECD0] bg-[#fafbfc] text-center text-[10px] text-[#405066]">
                          {selected ? "▶" : isNewRow ? "*" : ""}
                        </td>
                        <td className={`border border-[#B7ECD0] px-2 py-1 ${selected ? "bg-[#F2FAF5]" : ""}`}>
                          <span>{row.no}</span>
                        </td>
                        <td className="border border-[#B7ECD0] px-2 py-1">
                          <span>{row.name}</span>
                        </td>
                        <td className="border border-[#B7ECD0] px-2 py-1">
                          <span>{row.code}</span>
                        </td>
                        <td className="border border-[#B7ECD0] text-center">
                          <input
                            aria-label={`VAT on commission for ${row.no}`}
                            type="checkbox"
                            checked={row.vatOnCommission}
                            readOnly
                            tabIndex={-1}
                            className="h-4 w-4 align-middle accent-[#64d96e]"
                          />
                        </td>
                        <td className="border border-[#B7ECD0] text-center">
                          {canDelete && (
                            <button
                              type="button"
                              title={`Modify ${row.no}`}
                              aria-label={`Modify airline ${row.no}`}
                              onClick={(event) => {
                                event.stopPropagation();
                                openModifyModal(row);
                              }}
                              className="inline-flex h-6.5 w-7.5 items-center justify-center rounded text-[#287a4b] hover:bg-green-50"
                            >
                              <HiOutlinePencilAlt className="text-blue-500" size={17} />
                            </button>
                          )}
                        </td>
                        <td className="border border-[#B7ECD0] text-center">
                          {canDelete && (
                            <button
                              type="button"
                              title={`Delete ${row.no}`}
                              aria-label={`Delete airline ${row.no}`}
                              onClick={(event) => {
                                event.stopPropagation();
                                openDeleteModal(row);
                              }}
                              className="inline-flex h-6.5 w-7.5 items-center justify-center rounded text-[#c0392b] hover:bg-red-50"
                            >
                              <FiTrash2 size={18} />
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}

                  {visibleRows.length === 0 && (
                    <tr>
                      <td colSpan={7} className="h-15 border border-[#B7ECD0] text-center text-[13px] text-[#7a8794]">
                        No airlines found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {loading && <p className="mt-2 text-[13px] text-[#667085]">Loading airlines...</p>}
            {error && <p role="alert" className="mt-2 text-[13px] text-[#c0392b]">{error}</p>}

            <div className="mt-5 flex justify-center gap-3">

              <button id="btnClose" type="button" onClick={handleClose} className="btn-style">
                <u>C</u>lose
              </button>
            </div>
          </section>
        </main>
      </div>

      {(showAddModal || deleteTarget) && (
        <div className="fixed inset-0 z-10000 flex items-center justify-center bg-black/40 p-4" onMouseDown={(event) => {
          if (event.target === event.currentTarget && !adding && !deleting) {
            setShowAddModal(false);
            setDeleteTarget(null);
          }
        }}>
          <div role="dialog" aria-modal="true" aria-labelledby="airline-modal-title" className="w-full max-w-150 overflow-hidden rounded-md border border-[#91a7bb] bg-white shadow-xl">
            <div className="flex h-9.5 items-center justify-between bg-[#9fdfbc] px-3">
              <h2 id="airline-modal-title" className="text-[14px] font-semibold text-[#24364d]">{deleteTarget ? "Airline - Delete " : editingTarget ? "Airline - Modify " : "Add Airline"}</h2>
              <button type="button" aria-label="Close airline form" disabled={adding || deleting} onClick={() => {
                setShowAddModal(false);
                setDeleteTarget(null);
              }} className="rounded p-1 text-[#24364d] hover:bg-white/40">
                <MdClose size={19} />
              </button>
            </div>

            <form onSubmit={(event) => void handleModalSubmit(event)} className="space-y-3 p-4">
              <div className="grid grid-cols-[150px_minmax(0,1fr)] items-center gap-3">
                <label htmlFor="add-airline-no" className="text-[13px] text-[#405066]">Airline No. <span className="text-red-600">*</span></label>
                <input id="add-airline-no" autoFocus maxLength={3} required readOnly={Boolean(deleteTarget)} value={txtAirlineNo} onChange={(event) => txtsetAirlineNo(event.target.value.toUpperCase())} className="h-7.5 w-[30%] rounded-sm border border-[#B7C7D7] px-2 text-[13px] outline-none focus:border-[#64c995] read-only:bg-gray-100" />

                <label htmlFor="add-airline-name" className="text-[13px] text-[#405066]">Airline Name <span className="text-red-600">*</span></label>
                <input id="add-airline-name" maxLength={50} required readOnly={Boolean(deleteTarget)} value={txtAirlineName} onChange={(event) => txtsetAirlineName(event.target.value)} className="h-7.5 rounded-sm border border-[#B7C7D7] px-2 text-[13px] outline-none focus:border-[#64c995] read-only:bg-gray-100" />

                <label htmlFor="add-airline-code" className="text-[13px] text-[#405066]">Airline Code  <span className="text-red-600">*</span></label>
                <input id="add-airline-code" maxLength={3} readOnly={Boolean(deleteTarget)} value={txtAirlineCode} onChange={(event) => txtsetAirlineCode(event.target.value.toUpperCase())} className="h-7.5 w-[30%] rounded-sm border border-[#B7C7D7] px-2 text-[13px] outline-none focus:border-[#64c995] read-only:bg-gray-100" />

                <span className="text-[13px] text-[#405066] whitespace-nowrap">VAT On Commission</span>
                <label className="flex items-center gap-2 text-[13px] text-[#24364d]">
                  <input type="checkbox" checked={chkVatOnCommision} disabled={Boolean(deleteTarget)} onChange={(event) => txtsetVatOnCommission(event.target.checked)} className="h-4 w-4 accent-[#64d96e]" />
                  
                </label>
              </div>

              {formError && <p role="alert" className="text-[13px] text-red-600">{formError}</p>}

              <div className="flex justify-center gap-2 border-t border-[#E5E7EB] pt-3">
                {editingTarget || deleteTarget ? (
                  <>
                    <button type="submit" disabled={adding || deleting || Boolean(deleteTarget)} className="btn-style disabled:cursor-not-allowed disabled:opacity-60">
                      {adding ? "Modifying..." : "Modify"}
                    </button>
                    <button
                      type="button"
                      disabled={adding || deleting || !deleteTarget}
                      onClick={() => void handleDelete()}
                      className="btn-style disabled:cursor-not-allowed disabled:opacity-60"
                    >
                     
                      {deleting ? "Deleting..." : "Delete"}
                    </button>
                  </>
                ) : (
                  <>
                    <button type="submit" disabled={adding} className="btn-style disabled:opacity-60">{adding ? "Saving..." : "Save"}</button>
                    <button type="button" disabled={adding} onClick={resetAddForm} className="btn-style">Clear</button>
                  </>
                )}
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AirlinePage;
