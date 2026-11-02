
import { useEffect, useRef, useState } from "react";
import Select, { components } from "react-select";
import type {
  MenuListProps,
  GroupBase,
} from "react-select";
import type { KeyboardEvent } from "react";
import { useNavigate } from "react-router-dom";
import { FiTrash2 } from "react-icons/fi";
import type { Option } from "../../../components/comman/Combo";
import Header from "../../../components/comman/Header";
import selectComponents from "../../../components/comman/selectComponents";
import { API_BASE_URL } from "../../../config/api";

type ServiceTypeRow = {
  id: number;
  lkpServiceGroupName: Option | null;
  txtServiceTypeID: string;
  persistedTxtServiceTypeID: string | null;
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

const API_URL = `${API_BASE_URL}/api/service-types`;

const createEmptyRow = (id: number): ServiceTypeRow => ({
  id,
  lkpServiceGroupName: null,
  txtServiceTypeID: "",
  persistedTxtServiceTypeID: null,
  txtServiceTypeName: "",
  txtPositionNo: "",
});

const headCellClass =
  "whitespace-nowrap border border-[#B7ECD0] bg-[#EEFBF4] px-3 py-2 text-left text-xs font-semibold text-slate-700";

const inputClass =
  "h-9 w-full border-0 bg-transparent px-3 text-sm text-slate-700 outline-none focus:bg-slate-50 focus:ring-1 focus:ring-inset focus:ring-slate-300";

const ServiceGroupMenuList = (
  props: MenuListProps<ServiceGroup, false, GroupBase<ServiceGroup>>
) => (
  <components.MenuList {...props}>
    <div className="sticky top-0 z-10 flex items-center border-b border-[#B7ECD0] bg-[#EEFBF4] px-3 py-2 text-xs font-semibold text-slate-700">
      <span className="min-w-0 flex-1 pr-3">Name</span>
      <span className="w-[80px] shrink-0 border-l border-[#B7ECD0] pl-3 text-center">
        ID
      </span>
    </div>
    {props.children}
  </components.MenuList>
);

const ServiceTypePage: React.FC = () => {
  const navigate = useNavigate();

  const [rows, setRows] = useState<ServiceTypeRow[]>(
    Array.from({ length: 10 }, (_, index) => createEmptyRow(index + 1))
  );

  const [serviceGroupOptions, setServiceGroupOptions] = useState<
    ServiceGroup[]
  >([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<ServiceTypeRow | null>(null);
  const [deleteError, setDeleteError] = useState("");
  const [deleting, setDeleting] = useState(false);
  const noButtonRef = useRef<HTMLButtonElement>(null);

  // Tracks which dropdown is open so Enter can select an option normally.
  const [openDropdownRowId, setOpenDropdownRowId] = useState<number | null>(
    null
  );

  useEffect(() => {
    if (deleteTarget) {
      noButtonRef.current?.focus();
    }
  }, [deleteTarget]);

  const ensureEmptyRow = (
    currentRows: ServiceTypeRow[]
  ): ServiceTypeRow[] => {
    const result = [...currentRows];

    while (result.length < 10) {
      result.push(createEmptyRow(result.length + 1));
    }

    const lastRow = result[result.length - 1];

    const lastRowIsEmpty =
      !lastRow.lkpServiceGroupName &&
      !lastRow.txtServiceTypeID.trim() &&
      !lastRow.txtServiceTypeName.trim() &&
      !lastRow.txtPositionNo.trim();

    if (!lastRowIsEmpty) {
      result.push(createEmptyRow(result.length + 1));
    }

    return result;
  };

  // Focus a field using its stable DOM ID.
  const focusField = (rowId: number, field: string) => {
    requestAnimationFrame(() => {
      const element = document.getElementById(
        `service-type-${field}-${rowId}`
      );

      element?.focus();
    });
  };

  // Move to the next field when Enter is pressed.
  const handleEnter = (
    event: KeyboardEvent<HTMLInputElement>,
    rowId: number,
    field: "txtServiceTypeID" | "txtServiceTypeName" | "txtPositionNo"
  ) => {
    if (event.key !== "Enter" || event.shiftKey) return;

    event.preventDefault();

    if (field === "txtServiceTypeID") {
      focusField(rowId, "txtServiceTypeName");
      return;
    }

    if (field === "txtServiceTypeName") {
      focusField(rowId, "txtPositionNo");
      return;
    }

    // Position No. -> next row's Service Group Name.
    const currentIndex = rows.findIndex((row) => row.id === rowId);
    const nextRow = rows[currentIndex + 1];

    if (nextRow) {
      focusField(nextRow.id, "lkpServiceGroupName");
      return;
    }

    // Safety fallback: create a new row if one does not exist yet.
    setRows((currentRows) => ensureEmptyRow(currentRows));

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const nextRows = rows.length + 1;
        const nextRowId = nextRows;
        document
          .getElementById(`service-type-lkpServiceGroupName-${nextRowId}`)
          ?.focus();
      });
    });
  };

  useEffect(() => {
    const getData = async () => {
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
          fetch(
            `${API_URL}/groups?PstrCoID=${encodeURIComponent(PstrCoID)}`
          ),
          fetch(`${API_URL}?PstrCoID=${encodeURIComponent(PstrCoID)}`),
        ]);

        const groupData = await groupResponse.json();
        const serviceTypeData = await serviceTypeResponse.json();

        if (!groupResponse.ok) {
          throw new Error(
            groupData.message || "Failed to load service groups."
          );
        }

        if (!serviceTypeResponse.ok) {
          throw new Error(
            serviceTypeData.message || "Failed to load service types."
          );
        }

        const options: ServiceGroup[] = (
          groupData as ServiceGroupApi[]
        ).map((item) => ({
          value: item.fservicetypegroupid,
          label: item.fservicetypegroupname ?? "",
        }));

        setServiceGroupOptions(options);

        const loadedRows: ServiceTypeRow[] = (
          serviceTypeData as ServiceTypeApi[]
        ).map((item, index) => ({
          id: index + 1,
          lkpServiceGroupName:
            options.find(
              (option) => option.value === item.fservicetypegroupid
            ) ?? null,
          txtServiceTypeID: item.fservicetypeid ?? "",
          persistedTxtServiceTypeID: item.fservicetypeid ?? "",
          txtServiceTypeName: item.fservicetypename ?? "",
          txtPositionNo:
            item.fpositionno == null ? "" : String(item.fpositionno),
        }));

        setRows(ensureEmptyRow(loadedRows));
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load data."
        );
      } finally {
        setLoading(false);
      }
    };

    void getData();
  }, []);

  const updateRow = <K extends keyof ServiceTypeRow>(
    rowId: number,
    field: K,
    value: ServiceTypeRow[K]
  ) => {
    setRows((currentRows) => {
      const updatedRows = currentRows.map((row) =>
        row.id === rowId ? { ...row, [field]: value } : row
      );

      return ensureEmptyRow(updatedRows);
    });
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;

    const PstrCoID = localStorage.getItem("PstrCoID");
    const persistedTxtServiceTypeID =
      deleteTarget.persistedTxtServiceTypeID;

    if (persistedTxtServiceTypeID && !PstrCoID) {
      setDeleteError("Company ID (PstrCoID) was not found in localStorage.");
      return;
    }

    try {
      setDeleting(true);
      setDeleteError("");

      if (persistedTxtServiceTypeID && PstrCoID) {
        const response = await fetch(
          `${API_URL}?PstrCoID=${encodeURIComponent(PstrCoID)}&txtServiceTypeID=${encodeURIComponent(persistedTxtServiceTypeID)}`,
          { method: "DELETE" }
        );
        const result = (await response.json()) as { message?: string };

        if (!response.ok) {
          throw new Error(result.message || "Failed to delete service type.");
        }
      }

      setRows((currentRows) =>
        ensureEmptyRow(
          currentRows
            .filter((row) => row.id !== deleteTarget.id)
            .map((row, index) => ({ ...row, id: index + 1 }))
        )
      );
      setDeleteTarget(null);
    } catch (err) {
      setDeleteError(
        err instanceof Error ? err.message : "Failed to delete service type."
      );
    } finally {
      setDeleting(false);
    }
  };

  const handleSave = async () => {
    const PstrUserID = localStorage.getItem("PstrUserID");
    const PstrCoID = localStorage.getItem("PstrCoID");

    if (!PstrUserID || !PstrCoID) {
      alert("User ID or Company ID was not found in localStorage.");
      return;
    }

    const validRows = rows.filter(
      (row) =>
        row.txtServiceTypeID.trim() ||
        row.lkpServiceGroupName ||
        row.txtServiceTypeName.trim() ||
        row.txtPositionNo.trim()
    );

    if (validRows.length === 0) {
      alert("Please enter at least one service type.");
      return;
    }

    const seenIds = new Set<string>();

    for (const row of validRows) {
      const txtServiceTypeID = row.txtServiceTypeID.trim();
      const txtServiceTypeName = row.txtServiceTypeName.trim();
      const txtPositionNo = row.txtPositionNo.trim();

      if (!row.lkpServiceGroupName) {
        alert(`Please select Service Group Name in line ${row.id}.`);
        return;
      }

      if (!txtServiceTypeID) {
        alert(`Please enter Service Type ID in line ${row.id}.`);
        return;
      }

      if (txtServiceTypeID.length > 4) {
        alert(`Service Type ID in line ${row.id} cannot exceed 4 characters.`);
        return;
      }

      if (!txtServiceTypeName) {
        alert(`Please enter Service Type Name in line ${row.id}.`);
        return;
      }

      if (txtServiceTypeName.length > 50) {
        alert(`Service Type Name in line ${row.id} cannot exceed 50 characters.`);
        return;
      }

      if (
        txtPositionNo &&
        (!/^-?\d+$/.test(txtPositionNo) ||
          Number(txtPositionNo) < -32768 ||
          Number(txtPositionNo) > 32767)
      ) {
        alert(
          `Position No. in line ${row.id} must be a whole number between -32768 and 32767.`
        );
        return;
      }

      if (seenIds.has(txtServiceTypeID)) {
        alert(`Duplicate Service Type ID: ${txtServiceTypeID}`);
        return;
      }

      seenIds.add(txtServiceTypeID);
    }

    try {
      setSaving(true);
      setError("");

      const response = await fetch(`${API_URL}/save`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
           PstrUserID,
           PstrCoID,
          rows: validRows.map((row) => ({
            txtServiceTypeID: row.txtServiceTypeID.trim(),
            lkpServiceGroupName: row.lkpServiceGroupName!.value,
            txtServiceTypeName: row.txtServiceTypeName.trim(),
            txtPositionNo: row.txtPositionNo.trim(),
          })),
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Failed to save service types.");
      }

      alert(result.message || "Service types saved successfully.");

      const refreshedResponse = await fetch(
        `${API_URL}?PstrCoID=${encodeURIComponent(PstrCoID)}`
      );

      if (!refreshedResponse.ok) {
        throw new Error("Records were saved, but refreshing the list failed.");
      }

      const refreshedData: ServiceTypeApi[] = await refreshedResponse.json();

      const refreshedRows: ServiceTypeRow[] = refreshedData.map(
        (item, index) => ({
          id: index + 1,
          lkpServiceGroupName:
            serviceGroupOptions.find(
              (option) => option.value === item.fservicetypegroupid
            ) ?? null,
          txtServiceTypeID: item.fservicetypeid ?? "",
          persistedTxtServiceTypeID: item.fservicetypeid ?? "",
          txtServiceTypeName: item.fservicetypename ?? "",
          txtPositionNo:
            item.fpositionno == null ? "" : String(item.fpositionno),
        })
      );

      setRows(ensureEmptyRow(refreshedRows));
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to save service types.";

      setError(message);
      alert(message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-white p-3 sm:p-5">
      <main className="mx-auto w-full max-w-300 overflow-hidden border border-slate-400 bg-white shadow-sm">
        <Header Name="Service Type " />

        <div className="overflow-x-auto p-4 sm:p-5">
          {error && (
            <div className="mb-3 rounded border border-red-300 bg-red-50 p-2 text-sm text-red-700">
              {error}
            </div>
          )}

          {loading ? (
            <div className="py-6 text-center text-sm text-slate-600">
              Loading service types...
            </div>
          ) : (
            <table className="w-full min-w-190 border-collapse">
              <thead>
                <tr>
                  <th scope="col" className={`${headCellClass} w-20`}>
                    Line
                  </th>
                  <th
                    id="lkpServiceGroupName"
                    scope="col"
                    className={headCellClass}
                  >
                    Service Group Name
                  </th>
                  <th
                    id="txtServiceTypeID"
                    scope="col"
                    className={headCellClass}
                  >
                    Service Type ID
                  </th>
                  <th
                    id="txtServiceTypeName"
                    scope="col"
                    className={headCellClass}
                  >
                    Service Type Name
                  </th>
                  <th
                    id="txtPositionNo"
                    scope="col"
                    className={`${headCellClass} w-32`}
                  >
                    Position No.
                  </th>
                  <th scope="col" className={`${headCellClass} w-20 text-center`}>
                    Delete
                  </th>
                </tr>
              </thead>

              <tbody>
                {rows.map((row, index) => (
                  <tr
                    key={row.id}
                    className="odd:bg-white even:bg-slate-50/60"
                  >
                    <td className="border border-[#B7ECD0] px-3 py-1.5 text-center text-sm text-slate-600">
                      {index + 1}
                    </td>

                    <td className="border border-[#B7ECD0] p-0">
                      <Select<ServiceGroup, false>
                        inputId={`service-type-lkpServiceGroupName-${row.id}`}
                        instanceId={`service-type-lkpServiceGroupName-${row.id}`}
                        aria-label={`Service group for line ${index + 1}`}
                        components={{
                          ...selectComponents,
                          MenuList: ServiceGroupMenuList,
                        }}
                        options={serviceGroupOptions}
                        value={row.lkpServiceGroupName as ServiceGroup | null}
                        onChange={(option) =>
                          updateRow(row.id, "lkpServiceGroupName", option)
                        }
                        onMenuOpen={() => setOpenDropdownRowId(row.id)}
                        onMenuClose={() => setOpenDropdownRowId(null)}
                        onKeyDown={(event) => {
                          if (event.key !== "Enter" || event.shiftKey) return;

                          // Let react-select handle Enter while its menu is open.
                          if (openDropdownRowId === row.id) return;

                          event.preventDefault();
                          focusField(row.id, "txtServiceTypeID");
                        }}
                        getOptionLabel={(option) => option.label}
                        formatOptionLabel={(option, { context }) => {
                          if (context === "value") {
                            return (
                              <span className="block truncate">
                                {option.label}
                              </span>
                            );
                          }

                          return (
                            <div className="flex w-full min-w-0 items-center text-sm">
                              <span className="min-w-0 flex-1 truncate pr-3">
                                {option.label}
                              </span>
                              <span className="w-20 shrink-0 border-l border-[#B7ECD0] pl-3 text-center font-semibold text-slate-600">
                                {option.value}
                              </span>
                            </div>
                          );
                        }}
                        isSearchable
                        isClearable
                        placeholder=""
                        classNames={{
                          control: () =>
                            "!min-h-[36px] !rounded-none !border-0 !bg-transparent !shadow-none",
                          valueContainer: () => "!min-w-0 !px-3 !py-0",
                          input: () => "!m-0 !p-0 !text-sm",
                          singleValue: () =>
                            "!max-w-full !text-sm !text-slate-700",
                          menu: () =>
                            "!z-[999999] !mt-1 !rounded-md !border !border-[#B7ECD0] !shadow-lg",
                          menuList: () => "!p-0",
                          option: ({ isFocused, isSelected }) =>
                            `!rounded-none !py-2 !px-3 ${
                              isSelected
                                ? "!bg-slate-200 !text-slate-800"
                                : isFocused
                                  ? "!bg-slate-100 !text-slate-800"
                                  : "!bg-white !text-slate-700"
                            }`,
                        }}
                        menuPosition="fixed"
                        menuPortalTarget={
                          typeof document !== "undefined"
                            ? document.body
                            : undefined
                        }
                        styles={{
                          menu: (base) => ({
                            ...base,
                            width: "132%",
                            minWidth: "200px",
                          }),
                          menuPortal: (base) => ({
                            ...base,
                            zIndex: 999999,
                          }),
                          control: (base) => ({
                            ...base,
                            cursor: "pointer",
                          }),
                          option: (base, state) => ({
                            ...base,
                            padding: 0,
                            backgroundColor: state.isSelected
                              ? "#e2e8f0"
                              : state.isFocused
                                ? "#f1f5f9"
                                : "#ffffff",
                            color: "#334155",
                          }),
                        }}
                      />
                    </td>

                    <td className="border border-[#B7ECD0] p-0">
                      <input
                        id={`service-type-txtServiceTypeID-${row.id}`}
                        aria-label={`Service type ID for line ${index + 1}`}
                        maxLength={4}
                        value={row.txtServiceTypeID}
                        onChange={(event) =>
                          updateRow(row.id, "txtServiceTypeID", event.target.value)
                        }
                        onKeyDown={(event) =>
                          handleEnter(event, row.id, "txtServiceTypeID")
                        }
                        className={inputClass}
                      />
                    </td>

                    <td className="border border-[#B7ECD0] p-0">
                      <input
                        id={`service-type-txtServiceTypeName-${row.id}`}
                        aria-label={`Service type name for line ${index + 1}`}
                        maxLength={50}
                        value={row.txtServiceTypeName}
                        onChange={(event) =>
                          updateRow(row.id, "txtServiceTypeName", event.target.value)
                        }
                        onKeyDown={(event) =>
                          handleEnter(event, row.id, "txtServiceTypeName")
                        }
                        className={inputClass}
                      />
                    </td>

                    <td className="border border-[#B7ECD0] p-0">
                      <input
                        id={`service-type-txtPositionNo-${row.id}`}
                        type="number"
                        step="1"
                        aria-label={`Position for line ${index + 1}`}
                        value={row.txtPositionNo}
                        onChange={(event) =>
                          updateRow(row.id, "txtPositionNo", event.target.value)
                        }
                        onKeyDown={(event) =>
                          handleEnter(event, row.id, "txtPositionNo")
                        }
                        className={`${inputClass} text-right`}
                      />
                    </td>

                    <td className="border border-[#B7ECD0] px-2 py-1 text-center">
                      <button
                        type="button"
                        aria-label={`Delete service type on line ${index + 1}`}
                        title="Delete service type"
                        disabled={saving || deleting}
                        onClick={() => {
                          setDeleteError("");
                          setDeleteTarget(row);
                        }}
                        className="inline-flex h-8 w-8 items-center justify-center rounded text-red-600 hover:bg-red-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <FiTrash2 aria-hidden="true" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <footer className="flex justify-center gap-3 border-t border-[#B7ECD0] bg-slate-50 px-4 py-3 sm:px-5">
          <button
            type="button"
            onClick={handleSave}
            disabled={loading || saving}
            className="btn-style disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save"}
          </button>

          <button
            type="button"
            onClick={() => navigate('/')}
            disabled={saving}
            className="btn-style disabled:opacity-50"
          >
            Close
          </button>
        </footer>
      </main>
      {deleteTarget && (
        <div
          className="fixed inset-0 z-[1000000] flex items-center justify-center bg-slate-950/40 p-4"
          onKeyDown={(event) => {
            if (event.key === "Escape" && !deleting) {
              setDeleteTarget(null);
              setDeleteError("");
            }
          }}
        >
          <section
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="delete-service-type-title"
            aria-describedby="delete-service-type-description"
            className="w-full max-w-sm rounded-lg bg-white p-5 shadow-xl"
          >
            <h2
              id="delete-service-type-title"
              className="text-lg font-semibold text-slate-800"
            >
              Delete service type?
            </h2>
            <p
              id="delete-service-type-description"
              className="mt-2 text-sm text-slate-600"
            >
              Do you want to delete service type{" "}
              <span className="font-medium text-slate-800">
                {deleteTarget.txtServiceTypeID || "on this row"}
              </span>
              ?
            </p>
            {deleteError && (
              <p className="mt-3 text-sm text-red-700" role="alert">
                {deleteError}
              </p>
            )}
            <div className="mt-5 flex justify-end gap-3">
              <button
                ref={noButtonRef}
                type="button"
                onClick={() => {
                  setDeleteTarget(null);
                  setDeleteError("");
                }}
                disabled={deleting}
                className="rounded border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-500 disabled:opacity-50"
              >
                No
              </button>
              <button
                type="button"
                onClick={() => void handleDelete()}
                disabled={deleting}
                className="rounded bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {deleting ? "Deleting..." : "Yes"}
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
};

export default ServiceTypePage;
