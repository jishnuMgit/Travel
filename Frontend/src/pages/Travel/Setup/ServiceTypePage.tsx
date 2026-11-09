//created by jishnu m 05-11-2026
import { useEffect, useMemo, useRef, useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { MdAdd, MdClose } from "react-icons/md";
import { FiTrash2 } from "react-icons/fi";
import Select, { components } from "react-select";
import type { GroupBase, MenuListProps } from "react-select";
import type { Option } from "../../../components/common/Combo";
import Header from "../../../components/common/Header";
import selectComponents from "../../../components/common/selectComponents";
import { API_BASE_URL } from "../../../config/api";
import { HiOutlinePencilAlt } from "react-icons/hi";

type ServiceTypeRow = {
  id: number;
  lkpServiceGroupName: ServiceGroup | null;
  txtServiceTypeID: string;
  persistedTxtServiceTypeID: string;
  txtServiceTypeName: string;
  txtPositionNo: string;
};

type ServiceGroup = Option & {
  value: string;
  label: string;
};

type ServiceGroupApi = {
  fcoid: string;
  fservicetypegroupid: string;
  fservicetypegroupname: string | null;
  fpositionno: number | null;
};

type ServiceTypeApi = {
  fcoid: string;
  fservicetypeid: string;
  fservicetypegroupid: string;
  fservicetypegroupname: string | null;
  fservicetypename: string | null;
  fpositionno: number | null;
};

type ServiceTypePayloadRow = {
  persistedTxtServiceTypeID: string;
  txtServiceTypeID: string;
  lkpServiceGroupName: string;
  txtServiceTypeName: string;
  txtPositionNo: string;
};

const API_URL = `${API_BASE_URL}/service-types`;

const headCellClass =
  "h-[30px] border border-[#B7ECD0] bg-[#E7F7ED] px-2 text-left font-normal text-[#405066]";

const ServiceGroupMenuList = (
  props: MenuListProps<ServiceGroup, false, GroupBase<ServiceGroup>>
) => (
  <components.MenuList {...props}>
    <div className="sticky top-0 z-10 flex items-center border-b border-[#B7ECD0] bg-[#E7F7ED] px-3 py-2 text-xs font-semibold text-[#405066]">
      <span className="min-w-0 flex-1 pr-3">Name</span>
      <span className="w-20 shrink-0 border-l border-[#B7ECD0] pl-3 text-center">
        ID
      </span>
    </div>
    {props.children}
  </components.MenuList>
);

const ServiceTypePage: React.FC = () => {
  const navigate = useNavigate();
  const [rows, setRows] = useState<ServiceTypeRow[]>([]);
  const [serviceGroupOptions, setServiceGroupOptions] = useState<ServiceGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [editingTarget, setEditingTarget] = useState<ServiceTypeRow | null>(null);
  const [formError, setFormError] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<ServiceTypeRow | null>(null);
  const [deleting, setDeleting] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const [formGroup, setFormGroup] = useState<ServiceGroup | null>(null);
  const [formServiceTypeID, setFormServiceTypeID] = useState("");
  const [formServiceTypeName, setFormServiceTypeName] = useState("");
  const [formPositionNo, setFormPositionNo] = useState("");

  const loadData = async () => {
    const PstrCoID = localStorage.getItem("PstrCoID");
    if (!PstrCoID) {
      setError("Company ID (PstrCoID) was not found in localStorage.");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError("");
      const [groupResponse, serviceTypeResponse] = await Promise.all([
        fetch(`${API_URL}/groups?PstrCoID=${encodeURIComponent(PstrCoID)}`),
        fetch(`${API_URL}?PstrCoID=${encodeURIComponent(PstrCoID)}`),
      ]);

      const groupData = await groupResponse.json();
      const serviceTypeData = await serviceTypeResponse.json();

      if (!groupResponse.ok) {
        throw new Error(groupData.message || "Failed to load service groups.");
      }
      if (!serviceTypeResponse.ok) {
        throw new Error(serviceTypeData.message || "Failed to load service types.");
      }

      const options: ServiceGroup[] = (groupData as ServiceGroupApi[]).map((item) => ({
        value: item.fservicetypegroupid,
        label: item.fservicetypegroupname ?? "",
      }));
      setServiceGroupOptions(options);

      const loadedRows: ServiceTypeRow[] = (serviceTypeData as ServiceTypeApi[]).map(
        (item, index) => ({
          id: index + 1,
          lkpServiceGroupName:
            options.find((option) => option.value === item.fservicetypegroupid) ?? {
              value: item.fservicetypegroupid,
              label: item.fservicetypegroupname ?? "",
            },
          txtServiceTypeID: item.fservicetypeid ?? "",
          persistedTxtServiceTypeID: item.fservicetypeid ?? "",
          txtServiceTypeName: item.fservicetypename ?? "",
          txtPositionNo: item.fpositionno == null ? "" : String(item.fpositionno),
        })
      );
      setRows(loadedRows);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
    // Load records when the page is mounted.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const visibleRows = useMemo(() => {
    const search = query.trim().toLowerCase();
    if (!search) return rows;
    return rows.filter((row) =>
      [
        row.lkpServiceGroupName?.label ?? "",
        row.lkpServiceGroupName?.value ?? "",
        row.txtServiceTypeID,
        row.txtServiceTypeName,
        row.txtPositionNo,
      ].some((value) => value.toLowerCase().includes(search))
    );
  }, [rows, query]);

  const resetForm = () => {
    setFormGroup(null);
    setFormServiceTypeID("");
    setFormServiceTypeName("");
    setFormPositionNo("");
    setFormError("");
  };

  const openAddModal = () => {
    setEditingTarget(null);
    setDeleteTarget(null);
    resetForm();
    setShowModal(true);
  };

  const openModifyModal = (row: ServiceTypeRow) => {
    setDeleteTarget(null);
    setEditingTarget(row);
    setFormGroup(row.lkpServiceGroupName);
    setFormServiceTypeID(row.txtServiceTypeID);
    setFormServiceTypeName(row.txtServiceTypeName);
    setFormPositionNo(row.txtPositionNo);
    setFormError("");
    setShowModal(true);
  };

  const openDeleteModal = (row: ServiceTypeRow) => {
    setShowModal(false);
    setEditingTarget(null);
    setDeleteTarget(row);
    setFormGroup(row.lkpServiceGroupName);
    setFormServiceTypeID(row.txtServiceTypeID);
    setFormServiceTypeName(row.txtServiceTypeName);
    setFormPositionNo(row.txtPositionNo);
    setFormError("");
  };

  const handleModalSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (deleteTarget) return;

    const PstrUserID = localStorage.getItem("PstrUserID");
    const PstrCoID = localStorage.getItem("PstrCoID");

    if (!PstrUserID || !PstrCoID) {
      setFormError("User ID or Company ID was not found in localStorage.");
      return;
    }

    const serviceTypeID = formServiceTypeID.trim();
    const serviceTypeName = formServiceTypeName.trim();
    const positionNo = formPositionNo.trim();

    if (!formGroup) {
      setFormError("Please select a Service Group Name.");
      return;
    }
    if (!serviceTypeID) {
      setFormError("Please enter Service Type ID.");
      return;
    }
    if (serviceTypeID.length > 4) {
      setFormError("Service Type ID cannot exceed 4 characters.");
      return;
    }
    if (!serviceTypeName) {
      setFormError("Please enter Service Type Name.");
      return;
    }
    if (serviceTypeName.length > 50) {
      setFormError("Service Type Name cannot exceed 50 characters.");
      return;
    }
    if (
      positionNo &&
      (!/^-?\d+$/.test(positionNo) ||
        Number(positionNo) < -32768 ||
        Number(positionNo) > 32767)
    ) {
      setFormError("Position No. must be a whole number between -32768 and 32767.");
      return;
    }

    const duplicate = rows.some(
      (row) =>
        row.persistedTxtServiceTypeID !== editingTarget?.persistedTxtServiceTypeID &&
        row.txtServiceTypeID.trim().toLowerCase() === serviceTypeID.toLowerCase()
    );
    if (duplicate) {
      setFormError(`Service Type ID "${serviceTypeID}" already exists.`);
      return;
    }

    const nextRows: ServiceTypePayloadRow[] = [
      {
        persistedTxtServiceTypeID: editingTarget?.persistedTxtServiceTypeID ?? "",
        txtServiceTypeID: serviceTypeID,
        lkpServiceGroupName: formGroup.value,
        txtServiceTypeName: serviceTypeName,
        txtPositionNo: positionNo,
      },
    ];

    try {
      setSaving(true);
      setFormError("");
      const response = await fetch(`${API_URL}/save`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ PstrUserID, PstrCoID, rows: nextRows }),
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(
          result.message ||
            (editingTarget ? "Failed to modify service type." : "Failed to add service type.")
        );
      }

      setShowModal(false);
      setEditingTarget(null);
      resetForm();
      await loadData();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Failed to save service type.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const PstrCoID = localStorage.getItem("PstrCoID");
    if (!PstrCoID) {
      setFormError("Company ID (PstrCoID) was not found in localStorage.");
      return;
    }

    try {
      setDeleting(true);
      setFormError("");
      const response = await fetch(
        `${API_URL}?PstrCoID=${encodeURIComponent(PstrCoID)}&txtServiceTypeID=${encodeURIComponent(deleteTarget.persistedTxtServiceTypeID)}`,
        { method: "DELETE" }
      );
      const result = (await response.json()) as { message?: string };
      if (!response.ok) {
        throw new Error(result.message || "Failed to delete service type.");
      }
      setDeleteTarget(null);
      resetForm();
      await loadData();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Failed to delete service type.");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="flex min-h-full w-full items-start justify-center bg-white px-4 py-4">
      <div className="min-h-fit w-220 max-w-full bg-white p-0">
        <main className="w-full overflow-hidden border border-gray-400 bg-white">
          <Header Name="Service Type" />

          <div className="flex flex-wrap items-center gap-3 px-3 pt-3">
            <input
              ref={searchInputRef}
              aria-label="Search service types"
              placeholder="Search by Service Group, Service Type ID or Name"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className="input-style h-7.5 w-150 max-w-full rounded-sm border border-gray-500!"
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
            {error && (
              <p role="alert" className="mb-2 text-[13px] text-[#c0392b]">
                {error}
              </p>
            )}
            <div className="max-h-[min(540px,calc(100vh-240px))] overflow-auto border border-[#B7ECD0] bg-white">
              {loading ? (
                <p className="py-8 text-center text-[13px] text-[#405066]">
                  Loading service types...
                </p>
              ) : (
                <table className="w-full min-w-190 table-fixed border-collapse text-[13px] text-[#24364d]">
                  <colgroup>
                    <col className="w-12" />
                    <col className="w-44" />
                    <col className="w-32" />
                    <col className="w-50" />
                    <col className="w-24" />
                    <col className="w-16" />
                    <col className="w-16" />
                  </colgroup>
                  <thead className="sticky top-0 z-10">
                    <tr>
                      <th className={headCellClass}>Line</th>
                      <th className={headCellClass}>Service Group Name</th>
                      <th className={headCellClass}>Service Type ID</th>
                      <th className={headCellClass}>Service Type Name</th>
                      <th className={headCellClass}>Position No.</th>
                      <th className={`${headCellClass} text-center`}>Modify</th>
                      <th className={`${headCellClass} text-center`}>Delete</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visibleRows.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="border border-[#B7ECD0] px-3 py-8 text-center text-slate-500">
                          {rows.length === 0
                            ? "No service types found. Click Add to create one."
                            : "No matching service types found."}
                        </td>
                      </tr>
                    ) : (
                      visibleRows.map((row) => {
                        const lineNumber = rows.findIndex((item) => item.id === row.id) + 1;
                        return (
                          <tr key={row.id} className="odd:bg-white even:bg-slate-50/60">
                            <td className="border border-[#B7ECD0] px-3 py-1.5 text-center">
                              {lineNumber}
                            </td>
                            <td className="border border-[#B7ECD0] px-3 py-1.5">
                              {row.lkpServiceGroupName?.label || "—"}
                            </td>
                            <td className="border border-[#B7ECD0] px-3 py-1.5">
                              {row.txtServiceTypeID}
                            </td>
                            <td className="border border-[#B7ECD0] px-3 py-1.5">
                              {row.txtServiceTypeName}
                            </td>
                            <td className="border border-[#B7ECD0] px-3 py-1.5 text-right">
                              {row.txtPositionNo || "—"}
                            </td>
                            <td className="border border-[#B7ECD0] px-2 py-1 text-center">
                              <button
                                type="button"
                                aria-label={`Modify service type on line ${lineNumber}`}
                                title="Modify service type"
                                disabled={saving || deleting}
                                onClick={() => openModifyModal(row)}
                                className="inline-flex h-8 w-8 items-center justify-center rounded text-[#287a50] hover:bg-[#e8f7ee] disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                <HiOutlinePencilAlt className="text-blue-500" size={17} />
                              </button>
                            </td>
                            <td className="border border-[#B7ECD0] px-2 py-1 text-center">
                              <button
                                type="button"
                                aria-label={`Delete service type on line ${lineNumber}`}
                                title="Delete service type"
                                disabled={saving || deleting}
                                onClick={() => openDeleteModal(row)}
                                className="inline-flex h-8 w-8 items-center justify-center rounded text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                <FiTrash2 aria-hidden="true" size={17} />
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              )}
            </div>
          </section>

          <footer className="flex justify-center gap-3   px-4 py-3">
            <button
              type="button"
              onClick={() => navigate("/")}
              disabled={saving || deleting}
              className="btn-style disabled:opacity-50"
            >
              Close
            </button>
          </footer>
        </main>
      </div>

      {(showModal || deleteTarget) && (
        <div
          className="fixed inset-0 z-10000 flex items-center justify-center bg-black/40 p-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !saving && !deleting) {
              setShowModal(false);
              setEditingTarget(null);
              setDeleteTarget(null);
            }
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="service-type-modal-title"
            className="w-full max-w-130 overflow-visible rounded-md border border-[#91a7bb] bg-white shadow-xl"
          >
            <div className="flex h-9.5 items-center justify-between rounded-t-md bg-[#9fdfbc] px-3">
              <h2 id="service-type-modal-title" className="text-[14px] font-semibold text-[#24364d]">
                {deleteTarget ? "Delete - Service Type" : editingTarget ? "Modify - Service Type" : "Add Service Type"}
              </h2>
              <button
                type="button"
                aria-label="Close service type form"
                disabled={saving || deleting}
                onClick={() => {
                  setShowModal(false);
                  setEditingTarget(null);
                  setDeleteTarget(null);
                }}
                className="rounded p-1 text-[#24364d] hover:bg-white/40 disabled:opacity-50"
              >
                <MdClose size={19} />
              </button>
            </div>

            <form onSubmit={(event) => void handleModalSubmit(event)} className="space-y-3 p-4">
              <div className="grid grid-cols-[125px_minmax(0,1fr)] items-center gap-3">
                <label htmlFor="service-type-group" className="text-[13px] text-[#405066]">
                  Service Group <span className="text-red-600">*</span>
                </label>
               <div className="w-[70%]">
                 <Select<ServiceGroup, false>
                  inputId="service-type-group"
                  instanceId="service-type-group"
                  aria-label="Service Group"
                  components={{ ...selectComponents, MenuList: ServiceGroupMenuList }}
                  options={serviceGroupOptions}
                  value={formGroup}
                  onChange={(option) => setFormGroup(option)}
                  isDisabled={Boolean(deleteTarget)}
                  getOptionLabel={(option) => option.label}
                  formatOptionLabel={(option, { context }) =>
                    context === "value" ? (
                      <span className="block truncate">{option.label}</span>
                    ) : (
                      <div className="flex w-full min-w-0 items-center text-[13px]">
                        <span className="min-w-0 flex-1 truncate pr-3">{option.label}</span>
                        <span className="w-20 shrink-0 border-l border-[#B7ECD0] pl-3 text-center font-semibold text-slate-600">
                          {option.value}
                        </span>
                      </div>
                    )
                  }
                  isSearchable
                  placeholder="Search service group..."
                  menuPosition="fixed"
                  menuPortalTarget={typeof document !== "undefined" ? document.body : undefined}
                  className="text-[13px]"
                  classNames={{
                    control: () => "!min-h-[30px] !rounded-sm !border-[#B7C7D7] !shadow-none",
                    valueContainer: () => "!min-w-0 !px-2 !py-0",
                    input: () => "!m-0 !p-0 !text-[13px]",
                    singleValue: () => "!text-[13px] !text-[#24364d]",
                    placeholder: () => "!text-[13px] !text-slate-400",
                    menu: () => "!z-[10001] !mt-1 !rounded-sm !border !border-[#B7ECD0] !shadow-lg ",
                    menuList: () => "!p-0",
                    option: ({ isFocused, isSelected }) =>
                      `!rounded-none !px-3 !py-2 ${
                        isSelected
                          ? "!bg-[#d9f1e3] !text-[#24364d]"
                          : isFocused
                            ? "!bg-[#eff8f2] !text-[#24364d]"
                            : "!bg-white !text-[#24364d]"
                      }`,
                  }}
                         styles={{
                             menuPortal: (base) => ({
                              ...base,
                              zIndex: 10001,
                              width: "42%",
                             }),
                            menu: (base) => ({
                             ...base,
                              width: "42%",
                            }),
                            option: (base) => ({
                              ...base,
                              padding: 0,
                            }),
                          }}
                />
               </div>

                <label htmlFor="service-type-id" className="text-[13px] text-[#405066]">
                  Service Type ID <span className="text-red-600">*</span>
                </label>
                <input
                  id="service-type-id"
                  autoFocus
                  required
                  maxLength={4}
                  readOnly={Boolean(deleteTarget)}
                  value={formServiceTypeID}
                  onChange={(event) => setFormServiceTypeID(event.target.value)}
                  className="h-7.5 w-[40%] rounded-sm border border-[#B7C7D7] px-2 text-[13px] text-[#24364d] outline-none focus:border-[#64c995] read-only:bg-gray-100"
                />

                <label htmlFor="service-type-name" className="text-[13px] text-[#405066] whitespace-nowrap">
                  Service Type Name <span className="text-red-600">*</span>
                </label>
                <input
                  id="service-type-name"
                  required
                  maxLength={50}
                  readOnly={Boolean(deleteTarget)}
                  value={formServiceTypeName}
                  onChange={(event) => setFormServiceTypeName(event.target.value)}
                  className="h-7.5 w-[70%] rounded-sm border border-[#B7C7D7] px-2 text-[13px] text-[#24364d] outline-none focus:border-[#64c995] read-only:bg-gray-100"
                />

                <label htmlFor="service-type-position" className="text-[13px] text-[#405066]">
                  Position No.<span className="text-red-600">*</span> 
                </label>
                <input
                  id="service-type-position"
                  type="number"
                  step="1"
                  readOnly={Boolean(deleteTarget)}
                  value={formPositionNo}
                  onChange={(event) => setFormPositionNo(event.target.value)}
                  className="h-7.5 w-[40%] rounded-sm border border-[#B7C7D7] px-2 text-[13px] text-[#24364d] outline-none focus:border-[#64c995] read-only:bg-gray-100"
                />
              </div>

              {formError && (
                <p role="alert" className="text-[13px] text-red-600">
                  {formError}
                </p>
              )}

              <div className="flex justify-center gap-2 border-t border-[#E5E7EB] pt-3">
                {editingTarget || deleteTarget ? (
                  <>
                    <button
                      type="submit"
                      disabled={saving || deleting || Boolean(deleteTarget)}
                      className="btn-style disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {saving ? "Modifying..." : "Modify"}
                    </button>
                    <button
                      type="button"
                      disabled={saving || deleting || !deleteTarget}
                      onClick={() => void handleDelete()}
                      className="btn-style disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {deleting ? "Deleting..." : "Delete"}
                    </button>
                  </>
                ) : (
                  <>
                    <button type="submit" disabled={saving} className="btn-style disabled:opacity-60">
                      {saving ? "Saving..." : "Save"}
                    </button>
                    <button type="button" disabled={saving} onClick={resetForm} className="btn-style disabled:opacity-60">
                      Clear
                    </button>
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

export default ServiceTypePage;
