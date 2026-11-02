
import { useEffect, useState } from "react";
import Select, { components } from "react-select";
import type {
  MenuListProps,
  GroupBase,
} from "react-select";
import type { KeyboardEvent } from "react";
import { useNavigate } from "react-router-dom";
import type { Option } from "../../../components/comman/Combo";
import Header from "../../../components/comman/Header";
import selectComponents from "../../../components/comman/selectComponents";

type ServiceTypeRow = {
  id: number;
  group: Option | null;
  serviceTypeId: string;
  name: string;
  position: string;
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

const API_URL = "http://localhost:5000/api/service-types";

const createEmptyRow = (id: number): ServiceTypeRow => ({
  id,
  group: null,
  serviceTypeId: "",
  name: "",
  position: "",
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

  // Tracks which dropdown is open so Enter can select an option normally.
  const [openDropdownRowId, setOpenDropdownRowId] = useState<number | null>(
    null
  );

  const ensureEmptyRow = (
    currentRows: ServiceTypeRow[]
  ): ServiceTypeRow[] => {
    const result = [...currentRows];

    while (result.length < 10) {
      result.push(createEmptyRow(result.length + 1));
    }

    const lastRow = result[result.length - 1];

    const lastRowIsEmpty =
      !lastRow.group &&
      !lastRow.serviceTypeId.trim() &&
      !lastRow.name.trim() &&
      !lastRow.position.trim();

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
    field: "serviceTypeId" | "name" | "position"
  ) => {
    if (event.key !== "Enter" || event.shiftKey) return;

    event.preventDefault();

    if (field === "serviceTypeId") {
      focusField(rowId, "name");
      return;
    }

    if (field === "name") {
      focusField(rowId, "position");
      return;
    }

    // Position No. -> next row's Service Group Name.
    const currentIndex = rows.findIndex((row) => row.id === rowId);
    const nextRow = rows[currentIndex + 1];

    if (nextRow) {
      focusField(nextRow.id, "group");
      return;
    }

    // Safety fallback: create a new row if one does not exist yet.
    setRows((currentRows) => ensureEmptyRow(currentRows));

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const nextRows = rows.length + 1;
        const nextRowId = nextRows;
        document
          .getElementById(`service-type-group-${nextRowId}`)
          ?.focus();
      });
    });
  };

  useEffect(() => {
    const getData = async () => {
      const companyId = localStorage.getItem("PstrCoID");

      if (!companyId) {
        setError("Company ID (PstrCoID) was not found in localStorage.");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError("");

        const [groupResponse, serviceTypeResponse] = await Promise.all([
          fetch(
            `${API_URL}/groups?companyId=${encodeURIComponent(companyId)}`
          ),
          fetch(`${API_URL}?companyId=${encodeURIComponent(companyId)}`),
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
          group:
            options.find(
              (option) => option.value === item.fservicetypegroupid
            ) ?? null,
          serviceTypeId: item.fservicetypeid ?? "",
          name: item.fservicetypename ?? "",
          position:
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

  const handleSave = async () => {
    const userId = localStorage.getItem("PstrUserID");
    const companyId = localStorage.getItem("PstrCoID");

    if (!userId || !companyId) {
      alert("User ID or Company ID was not found in localStorage.");
      return;
    }

    const validRows = rows.filter(
      (row) =>
        row.serviceTypeId.trim() ||
        row.group ||
        row.name.trim() ||
        row.position.trim()
    );

    if (validRows.length === 0) {
      alert("Please enter at least one service type.");
      return;
    }

    const seenIds = new Set<string>();

    for (const row of validRows) {
      const serviceTypeId = row.serviceTypeId.trim();
      const name = row.name.trim();
      const positionText = row.position.trim();

      if (!row.group) {
        alert(`Please select Service Group Name in line ${row.id}.`);
        return;
      }

      if (!serviceTypeId) {
        alert(`Please enter Service Type ID in line ${row.id}.`);
        return;
      }

      if (serviceTypeId.length > 4) {
        alert(`Service Type ID in line ${row.id} cannot exceed 4 characters.`);
        return;
      }

      if (!name) {
        alert(`Please enter Service Type Name in line ${row.id}.`);
        return;
      }

      if (name.length > 50) {
        alert(`Service Type Name in line ${row.id} cannot exceed 50 characters.`);
        return;
      }

      if (
        positionText &&
        (!/^-?\d+$/.test(positionText) ||
          Number(positionText) < -32768 ||
          Number(positionText) > 32767)
      ) {
        alert(
          `Position No. in line ${row.id} must be a whole number between -32768 and 32767.`
        );
        return;
      }

      if (seenIds.has(serviceTypeId)) {
        alert(`Duplicate Service Type ID: ${serviceTypeId}`);
        return;
      }

      seenIds.add(serviceTypeId);
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
          userId,
          companyId,
          rows: validRows.map((row) => ({
            serviceTypeId: row.serviceTypeId.trim(),
            serviceGroupId: row.group!.value,
            name: row.name.trim(),
            position: row.position.trim(),
          })),
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Failed to save service types.");
      }

      alert(result.message || "Service types saved successfully.");

      const refreshedResponse = await fetch(
        `${API_URL}?companyId=${encodeURIComponent(companyId)}`
      );

      if (!refreshedResponse.ok) {
        throw new Error("Records were saved, but refreshing the list failed.");
      }

      const refreshedData: ServiceTypeApi[] = await refreshedResponse.json();

      const refreshedRows: ServiceTypeRow[] = refreshedData.map(
        (item, index) => ({
          id: index + 1,
          group:
            serviceGroupOptions.find(
              (option) => option.value === item.fservicetypegroupid
            ) ?? null,
          serviceTypeId: item.fservicetypeid ?? "",
          name: item.fservicetypename ?? "",
          position:
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
                        inputId={`service-type-group-${row.id}`}
                        instanceId={`service-type-group-${row.id}`}
                        aria-label={`Service group for line ${index + 1}`}
                        components={{
                          ...selectComponents,
                          MenuList: ServiceGroupMenuList,
                        }}
                        options={serviceGroupOptions}
                        value={row.group as ServiceGroup | null}
                        onChange={(option) =>
                          updateRow(row.id, "group", option)
                        }
                        onMenuOpen={() => setOpenDropdownRowId(row.id)}
                        onMenuClose={() => setOpenDropdownRowId(null)}
                        onKeyDown={(event) => {
                          if (event.key !== "Enter" || event.shiftKey) return;

                          // Let react-select handle Enter while its menu is open.
                          if (openDropdownRowId === row.id) return;

                          event.preventDefault();
                          focusField(row.id, "serviceTypeId");
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
                        id={`service-type-serviceTypeId-${row.id}`}
                        aria-label={`Service type ID for line ${index + 1}`}
                        maxLength={4}
                        value={row.serviceTypeId}
                        onChange={(event) =>
                          updateRow(row.id, "serviceTypeId", event.target.value)
                        }
                        onKeyDown={(event) =>
                          handleEnter(event, row.id, "serviceTypeId")
                        }
                        className={inputClass}
                      />
                    </td>

                    <td className="border border-[#B7ECD0] p-0">
                      <input
                        id={`service-type-name-${row.id}`}
                        aria-label={`Service type name for line ${index + 1}`}
                        maxLength={50}
                        value={row.name}
                        onChange={(event) =>
                          updateRow(row.id, "name", event.target.value)
                        }
                        onKeyDown={(event) =>
                          handleEnter(event, row.id, "name")
                        }
                        className={inputClass}
                      />
                    </td>

                    <td className="border border-[#B7ECD0] p-0">
                      <input
                        id={`service-type-position-${row.id}`}
                        type="number"
                        step="1"
                        aria-label={`Position for line ${index + 1}`}
                        value={row.position}
                        onChange={(event) =>
                          updateRow(row.id, "position", event.target.value)
                        }
                        onKeyDown={(event) =>
                          handleEnter(event, row.id, "position")
                        }
                        className={`${inputClass} text-right`}
                      />
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
    </div>
  );
};

export default ServiceTypePage;
