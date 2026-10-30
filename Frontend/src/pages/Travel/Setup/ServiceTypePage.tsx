import { useState } from "react";
import Select from "react-select";
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

const serviceGroupOptions: Option[] = [
  { value: "ticket", label: "Ticket" },
  { value: "hotel", label: "Hotel" },
  { value: "other-service", label: "Other Service" },
];

const initialRows: ServiceTypeRow[] = Array.from({ length: 10 }, (_, index) => ({
  id: index + 1,
  group: null,
  serviceTypeId: "",
  name: "",
  position: "",
}));

const headCellClass =
  "whitespace-nowrap border border-[#B7ECD0] bg-[#EEFBF4] px-3 py-2 text-left text-xs font-semibold text-slate-700";
const inputClass =
  "h-9 w-full border-0 bg-transparent px-3 text-sm text-slate-700 outline-none focus:bg-slate-50 focus:ring-1 focus:ring-inset focus:ring-slate-300";

const ServiceTypePage: React.FC = () => {
  const navigate = useNavigate();
  const [rows, setRows] = useState<ServiceTypeRow[]>(initialRows);

  const updateRow = <K extends keyof ServiceTypeRow>(
    rowId: number,
    field: K,
    value: ServiceTypeRow[K],
  ) => {
    setRows((currentRows) =>
      currentRows.map((row) =>
        row.id === rowId ? { ...row, [field]: value } : row,
      ),
    );
  };

  const handleSave = () => {
    console.log("Service Types:", rows);
  };

  return (
    <div className="min-h-screen w-full bg-white p-3 sm:p-5">
      <main className="mx-auto w-full max-w-300 overflow-hidden border border-slate-400 bg-white shadow-sm">
        <Header Name="Service Type " />

        <div className="overflow-x-auto p-4 sm:p-5">
          <table className="w-full min-w-190 border-collapse">
            <thead>
              <tr>
                <th  scope="col" className={`${headCellClass} w-20`}>
                  Line
                </th>
                <th id="lkpServiceGroupName" scope="col" className={headCellClass}>
                  Service Group Name
                </th>
                <th id="txtServiceTypeID" scope="col" className={headCellClass}>
                  Service Type ID
                </th>
                <th id="txtServiceTypeName" scope="col" className={headCellClass}>
                  Service Type Name
                </th>
                <th id="txtPositionNo" scope="col" className={`${headCellClass} w-32`}>
                  Position No.
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, index) => (
                <tr key={row.id} className="odd:bg-white even:bg-slate-50/60">
                  <td className="border border-[#B7ECD0]  px-3 py-1.5 text-center text-sm text-slate-600">
                    {index + 1}
                  </td>
                  <td className="border border-[#B7ECD0]  p-0">
                    <Select<Option, false>
                      inputId={`service-type-group-${row.id}`}
                      instanceId={`service-type-group-${row.id}`}
                      aria-label={`Service group for line ${index + 1}`}
                      components={selectComponents}
                      options={serviceGroupOptions}
                      value={row.group}
                      onChange={(option) => updateRow(row.id, "group", option)}
                      isSearchable
                      isClearable
                      placeholder=""//Select service group
                      classNames={{
                        control: () =>
                          "!min-h-[36px] !rounded-none !border-0 !bg-transparent !shadow-none",
                        valueContainer: () => "!px-3 !py-0",
                        input: () => "!m-0 !p-0 !text-sm",
                        singleValue: () => "!text-sm !text-slate-700",
                        placeholder: () => "!text-sm !text-slate-400",
                        menu: () =>
                          "!z-[999999] !mt-1 !rounded-md !border !border-[#B7ECD0]  !shadow-lg",
                        menuList: () => "!p-1",
                        option: ({ isFocused, isSelected }) =>
                          `!rounded !px-3 !py-2 !text-sm ${
                            isSelected
                              ? "!bg-slate-200 !text-slate-800"
                              : isFocused
                                ? "!bg-slate-100 !text-slate-800"
                                : "!bg-white !text-slate-700"
                          }`,
                      }}
                      menuPosition="fixed"
                      menuPortalTarget={
                        typeof document !== "undefined" ? document.body : undefined
                      }
                      styles={{
                        menuPortal: (base) => ({ ...base, zIndex: 999999 }),
                        control: (base) => ({ ...base, cursor: "pointer" }),
                        option: (base, state) => ({
                          ...base,
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
                  <td className="border border-[#B7ECD0]  p-0">
                    <input
                      aria-label={`Service type ID for line ${index + 1}`}
                      value={row.serviceTypeId}
                      onChange={(event) =>
                        updateRow(row.id, "serviceTypeId", event.target.value)
                      }
                      className={inputClass}
                    />
                  </td>
                  <td className="border border-[#B7ECD0]  p-0">
                    <input
                      aria-label={`Service type name for line ${index + 1}`}
                      value={row.name}
                      onChange={(event) =>
                        updateRow(row.id, "name", event.target.value)
                      }
                      className={inputClass}
                    />
                  </td>
                  <td className="border border-[#B7ECD0]  p-0">
                    <input
                      type="number"
                      aria-label={`Position for line ${index + 1}`}
                      value={row.position}
                      onChange={(event) =>
                        updateRow(row.id, "position", event.target.value)
                      }
                      className={`${inputClass} text-right`}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <footer className="flex justify-center gap-3  border-[#B7ECD0]  bg-slate-50 px-4 py-3 sm:px-5">
          <button
            type="button"
            onClick={handleSave}
            className="btn-style"
          >
            Save
          </button>
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="btn-style"
          >
            Close
          </button>
        </footer>
      </main>
    </div>
  );
};

export default ServiceTypePage;
