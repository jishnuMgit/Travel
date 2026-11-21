import React, { useEffect, useMemo, useRef, useState } from "react";
import type { FormEvent } from "react";
import { MdAdd, MdClose } from "react-icons/md";

import { HiOutlinePencilAlt } from "react-icons/hi";
import { toast } from "react-toastify";
import { IoMdClose } from "react-icons/io";

import CustomLinkedPairSelect, {
  type PairSelectOption,
} from "../../../components/common/CustomLinkedPairSelect";
import Header from "../../../components/common/Header";
import {
  createCustomerDivision,
  deleteCustomerDivision,
  getCustomerDivisionCustomers,
  getCustomerDivisionRows,
  updateCustomerDivision,
  type CustomerDivisionCustomerLookups,
  type CustomerDivisionRecord,
  type CustomerDivisionSaveRow,
} from "../../../utils/Api";

type CustomerDivisionPageProps = {
  onClose?: () => void;
};

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

const CustomerDivisionPage: React.FC<CustomerDivisionPageProps> = ({
  onClose,
}) => {
  const PstrCoID = localStorage.getItem("PstrCoID")?.trim() ?? "";
  const PstrYear=localStorage.getItem("PstrYear")?.trim()?? ""
  const [customerLookups, setCustomerLookups] =
    useState<CustomerDivisionCustomerLookups>({
      SortByName: [],
      SortByID: [],
    });
  const [customer, setCustomer] = useState<string | null>(null);
  const [divisions, setDivisions] = useState<CustomerDivisionRecord[]>([]);
  const [error, setError] = useState("");
  const [loadingCustomers, setLoadingCustomers] = useState(true);
  const [loadingDivisions, setLoadingDivisions] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingTarget, setEditingTarget] =
    useState<CustomerDivisionRecord | null>(null);
  const [deleteTarget, setDeleteTarget] =
    useState<CustomerDivisionRecord | null>(null);
  const [formRow, setFormRow] = useState<CustomerDivisionSaveRow>({
    StrDivID: "",
    StrDivName: "",
    StrDivNameAr: "",
  });
  const [formError, setFormError] = useState("");
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
      setDivisions([]);
      setLoadingDivisions(false);
      return;
    }

    setDivisions([]);
    setLoadingDivisions(true);
    try {
      const data = await getCustomerDivisionRows(PstrCoID, customerId);
      if (sequence === requestSequence.current) setDivisions(data);
    } catch (loadError) {
      if (sequence === requestSequence.current) {
        setError(
          loadError instanceof Error
            ? loadError.message
            : "Failed to load customer divisions.",
        );
        setDivisions([]);
      }
    } finally {
      if (sequence === requestSequence.current) setLoadingDivisions(false);
    }
  };

  const openAddForm = () => {
    setEditingTarget(null);
    setFormRow({ StrDivID: "", StrDivName: "", StrDivNameAr: "" });
    setFormError("");
    setShowForm(true);
  };

  const openModifyForm = (division: CustomerDivisionRecord) => {
    setEditingTarget(division);
    setFormRow({
      StrDivID: division.fdivid,
      StrDivName: division.fdivname ?? "",
      StrDivNameAr: division.fdivname_ar ?? "",
    });
    setFormError("");
    setShowForm(true);
  };

  const handleFormSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!customer) {
      setFormError("Select the customer.");
      return;
    }

    const row = {
      StrDivID: formRow.StrDivID.trim().toUpperCase(),
      StrDivName: formRow.StrDivName.trim(),
      StrDivNameAr: formRow.StrDivNameAr.trim(),
    };
    if (!row.StrDivID || !row.StrDivName) {
      setFormError("Division ID and division name are required.");
      return;
    }

    const duplicate = divisions.some(
      (division) =>
        division.fdivid.toLowerCase() === row.StrDivID.toLowerCase() &&
        division.fdivid !== editingTarget?.fdivid,
    );
    if (duplicate) {
      setFormError("Division ID already exists for this customer.");
      return;
    }

    setSaving(true);
    setFormError("");
    try {
      const response = editingTarget
        ? await updateCustomerDivision(
            PstrCoID,
            customer,
            editingTarget.fdivid,
            row,
          )
        : await createCustomerDivision({
            PstrCoID,
            StrCustomerID: customer,
            Row: row,
          });
      if (!response.success) throw new Error(response.message);
      toast.success(response.message);
      setShowForm(false);
      setEditingTarget(null);
      await loadCustomer(customer);
    } catch (saveError) {
      setFormError(
        saveError instanceof Error
          ? saveError.message
          : editingTarget
            ? "Failed to modify customer division."
            : "Failed to add customer division.",
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget || !customer) return;
    setDeleting(true);
    setFormError("");

    try {
      const response = await deleteCustomerDivision(
        PstrCoID,
        customer,
        deleteTarget.fdivid,
        PstrYear
      );
      if (!response.success) throw new Error(response.message);
      toast.success(response.message);
      setDeleteTarget(null);
      await loadCustomer(customer);
    } catch (deleteError) {
      setFormError(
        deleteError instanceof Error
          ? deleteError.message
          : "Failed to delete customer division.",
      );
    } finally {
      setDeleting(false);
    }
  };

  const handleClose = () => {
    requestSequence.current += 1;
    setCustomer(null);
    setDivisions([]);
    setLoadingDivisions(false);
    onClose?.();
  };

  return (
    <div className="flex min-h-full w-full items-start justify-center bg-white px-4 py-4">
      <div className="min-h-fit w-225 max-w-full bg-white p-0">
        <main className="w-full overflow-hidden border border-gray-400 bg-white">
          <Header Name="Customer Division" />
          <section className="px-3.5 pb-3 pt-3">
            <div className="flex  items-center gap-2">
              <label
                htmlFor="lkpCustomerID"
                className="w-17.5 shrink-0 text-right text-[12px]"
              >
                Customer :
              </label>
              <div className="min-w-0 ">
                <CustomLinkedPairSelect
                  firstInputId="lkpCustomerID"
                  secondInputId="lkpCustomerName"
                  options={customerPairOptions}
                  secondOptions={customerNamePairOptions}
                  firstValue={customer}
                  secondValue={customer}
                  firstHeader="Customer ID"
                  secondHeader="Customer Name"
                  firstWidth={120}
                  secondWidth={450}
                  gap={10}
                  headerFontSize="12px"
                  isDisabled={loadingCustomers || loadingDivisions || saving || deleting}
                  onChange={(option) => void loadCustomer(option?.value ?? null)}
                />
              </div>
              <button
                type="button"
                onClick={openAddForm}
                disabled={!customer || loadingDivisions || saving || deleting}
                aria-label="Add customer division"
                title="Add customer division"
                className="inline-flex h-7.5 w-8 items-center justify-center rounded-sm border border-gray-600 bg-[#E6F0FA] text-green-600 hover:bg-[#dbeafa] disabled:cursor-not-allowed disabled:opacity-50 "
              >
                <MdAdd className="rounded-full bg-green-600 text-lg text-white"  />
              </button>
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

            <div
              className={`mt-3 max-h-[min(520px,calc(100vh-260px))] overflow-auto border border-[#B7ECD0] bg-white ${niceScrollbar}`}
            >
              <table className="w-full table-fixed border-collapse text-[13px] text-[#24364d]">
                <colgroup>
                  <col className="w-5.5" />
                  <col className="w-32.5" />
                  <col />
                  <col />
                  <col className="w-16" />
                  <col className="w-16" />
                </colgroup>
                <thead className="sticky top-0 z-10">
                  <tr>
                    <th className={thClass} />
                    <th className={`${thClass} text-left`}>Division ID</th>
                    <th className={`${thClass} text-left`}>Division Name</th>
                    <th className={`${thClass} text-right`}>
                      Division Name (Arabic)
                    </th>
                    <th className={`${thClass} text-center`}>Modify</th>
                    <th className={`${thClass} text-center`}>Delete</th>
                  </tr>
                </thead>
                <tbody>
                  {!customer &&
                    Array.from({ length: 10 }, (_, index) => (
                      <tr key={`empty-${index}`} className="bg-white">
                        <td className="h-7.5 border border-[#B7ECD0] bg-[#fafbfc] text-center text-[10px] text-[#405066]">
                          {index === 0 ? "*" : ""}
                        </td>
                        <td className="border border-[#B7ECD0] px-2 py-1" />
                        <td className="border border-[#B7ECD0] px-2 py-1" />
                        <td className="border border-[#B7ECD0] px-2 py-1" />
                        <td className="border border-[#B7ECD0] text-center" />
                        <td className="border border-[#B7ECD0] text-center" />
                      </tr>
                    ))}
                  {customer &&
                    divisions.map((division, index) => (
                      <tr
                        key={`${division.fdivid}-${index}`}
                        className="bg-white"
                      >
                        <td className="h-7.5 border border-[#B7ECD0] bg-[#fafbfc] text-center text-[10px] text-[#405066]">
                          {index === 0 ? "*" : ""}
                        </td>
                        <td className="border border-[#B7ECD0] px-2 py-1">
                          {division.fdivid}
                        </td>
                        <td className="border border-[#B7ECD0] px-2 py-1">
                          {division.fdivname}
                        </td>
                        <td
                          dir="rtl"
                          className="border border-[#B7ECD0] px-2 py-1 text-right"
                        >
                          {division.fdivname_ar}
                        </td>
                        <td className="border border-[#B7ECD0] text-center">
                          <button
                            type="button"
                            title={`Modify ${division.fdivid}`}
                            aria-label={`Modify division ${division.fdivid}`}
                            disabled={saving || deleting}
                            onClick={() => openModifyForm(division)}
                            className="inline-flex h-6.5 w-7.5 items-center justify-center rounded text-[#287a4b] hover:bg-green-50 disabled:opacity-50"
                          >
                            <HiOutlinePencilAlt
                              className="text-blue-500"
                              size={17}
                            />
                          </button>
                        </td>
                        <td className="border border-[#B7ECD0] text-center">
                          <button
                            type="button"
                            title={`Delete ${division.fdivid}`}
                            aria-label={`Delete division ${division.fdivid}`}
                            disabled={saving || deleting}
                            onClick={() => {
                              setDeleteTarget(division);
                              setFormError("");
                            }}
                            className="inline-flex h-6.5 w-7.5 items-center justify-center rounded text-gray-600 hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                          >
                            <IoMdClose  size={15} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  {customer &&
                    Array.from(
                      { length: Math.max(0, 10 - divisions.length) },
                      (_, index) => (
                        <tr
                          key={`empty-customer-${index}`}
                          className="bg-white"
                        >
                          <td className="h-7.5 border border-[#B7ECD0] bg-[#fafbfc] text-center text-[10px] text-[#405066]">
                            {divisions.length === 0 && index === 0 ? "*" : ""}
                          </td>
                          <td className="border border-[#B7ECD0] px-2 py-1" />
                          <td className="border border-[#B7ECD0] px-2 py-1" />
                          <td className="border border-[#B7ECD0] px-2 py-1" />
                          <td className="border border-[#B7ECD0] text-center" />
                          <td className="border border-[#B7ECD0] text-center" />
                        </tr>
                      ),
                    )}
                </tbody>
              </table>
            </div>

            {error && (
              <p role="alert" className="mt-2 text-[12px] text-[#c0392b]">
                {error}
              </p>
            )}

            <div className="mt-5 flex justify-center gap-3">
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

      {deleteTarget && (
        <div
          className="fixed inset-0 z-10000 flex items-center justify-center bg-black/40 p-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !deleting) {
              setDeleteTarget(null);
              setFormError("");
            }
          }}
        >
          <div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="division-delete-title"
            className="w-full max-w-105 overflow-hidden rounded-md border border-[#91a7bb] bg-white shadow-xl"
          >
            <div className="flex h-9.5 items-center justify-between bg-[#9fdfbc] px-3">
              <h2
                id="division-delete-title"
                className="text-[14px] font-semibold text-[#24364d]"
              >
                Customer Division - Delete
              </h2>
              <button
                type="button"
                aria-label="Close delete confirmation"
                disabled={deleting}
                onClick={() => setDeleteTarget(null)}
                className="rounded p-1 text-[#24364d] hover:bg-white/40 disabled:opacity-50"
              >
                <MdClose size={19} />
              </button>
            </div>
            <div className="space-y-4 p-4">
              <p className="text-[13px] text-[#405066]">
                Do you want to delete Division ID{" "}
                <span className="font-semibold text-[#24364d]">
                  {deleteTarget.fdivid}
                </span>
                ?
              </p>
              {formError && (
                <p role="alert" className="text-[13px] text-red-600">
                  {formError}
                </p>
              )}
              <div className="flex justify-center gap-2 border-t border-[#E5E7EB] pt-3">
                <button
                  type="button"
                  disabled={deleting}
                  onClick={() => void handleDelete()}
                  className="btn-style disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {deleting ? "Deleting..." : "Delete"}
                </button>
                <button
                  type="button"
                  disabled={deleting}
                  onClick={() => {
                    setDeleteTarget(null);
                    setFormError("");
                  }}
                  className="btn-style disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showForm && (
        <div
          className="fixed inset-0 z-10000 flex items-center justify-center bg-black/40 p-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !saving) {
              setShowForm(false);
            }
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="division-modal-title"
            className="w-full max-w-150 overflow-hidden rounded-md border border-[#91a7bb] bg-white shadow-xl"
          >
            <div className="flex h-9.5 items-center justify-between bg-[#9fdfbc] px-3">
              <h2
                id="division-modal-title"
                className="text-[14px] font-semibold text-[#24364d]"
              >
                {editingTarget ? "Customer Division - Modify" : "Add Customer Division"}
              </h2>
              <button
                type="button"
                aria-label="Close division form"
                disabled={saving}
                onClick={() => setShowForm(false)}
                className="rounded p-1 text-[#24364d] hover:bg-white/40 disabled:opacity-50"
              >
                <MdClose size={19} />
              </button>
            </div>
            <form
              onSubmit={(event) => void handleFormSubmit(event)}
              className="space-y-3 p-4"
            >
              <div className="grid grid-cols-[150px_minmax(0,1fr)] items-center gap-3">
                <label htmlFor="division-id" className="text-[13px] text-[#405066]">
                  Division ID <span className="text-red-600">*</span>
                </label>
                <input
                  id="division-id"
                  autoFocus
                  required
                  disabled={Boolean(editingTarget)}
                  value={formRow.StrDivID}
                  onChange={(event) =>
                    setFormRow((current) => ({
                      ...current,
                      StrDivID: event.target.value.toUpperCase(),
                    }))
                  }
                  className="h-7.5 rounded-sm border border-[#B7C7D7] px-2 text-[13px] outline-none focus:border-[#64c995] disabled:bg-gray-100"
                />
                <label htmlFor="division-name" className="text-[13px] text-[#405066]">
                  Division Name <span className="text-red-600">*</span>
                </label>
                <input
                  id="division-name"
                  required
                  value={formRow.StrDivName}
                  onChange={(event) =>
                    setFormRow((current) => ({
                      ...current,
                      StrDivName: event.target.value,
                    }))
                  }
                  className="h-7.5 rounded-sm border border-[#B7C7D7] px-2 text-[13px] outline-none focus:border-[#64c995]"
                />
                <label htmlFor="division-name-ar" className="text-[13px] text-[#405066] whitespace-nowrap">
                  Division Name (Arabic) <span className="text-red-600">*</span>
                </label>
                <input
                  id="division-name-ar"
                  dir="rtl"
                  required
                  value={formRow.StrDivNameAr}
                  onChange={(event) =>
                    setFormRow((current) => ({
                      ...current,
                      StrDivNameAr: event.target.value,
                    }))
                  }
                  className="h-7.5 rounded-sm border border-[#B7C7D7] px-2 text-[13px] outline-none focus:border-[#64c995]"
                />
              </div>

              {formError && (
                <p role="alert" className="text-[13px] text-red-600">
                  {formError}
                </p>
              )}
              <div className="flex justify-center gap-2 border-t border-[#E5E7EB] pt-3">
                <button
                  type="submit"
                  disabled={saving}
                  className="btn-style disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving
                    ? editingTarget
                      ? "Modifying..."
                      : "Saving..."
                    : editingTarget
                      ? "Modify"
                      : "Save"}
                </button>
                {!editingTarget && (
                  <button
                    type="button"
                    disabled={saving}
                    onClick={() =>
                      setFormRow({
                        StrDivID: "",
                        StrDivName: "",
                        StrDivNameAr: "",
                      })
                    }
                    className="btn-style disabled:opacity-60"
                  >
                    Clear
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerDivisionPage;
