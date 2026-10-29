import { useState } from "react";
import Select from "react-select";
import { PairCombo, type Option } from "../../../components/comman/Combo";
import Header from "../../../components/comman/Header";
import selectComponents from "../../../components/comman/selectComponents";

type PolicyTab = "Sales" | "Refund";
type ChargeType = "A" | "P";
type ChargeField =
  | "domesticType"
  | "domesticPercent"
  | "domesticMinimum"
  | "domesticAmount"
  | "internationalType"
  | "internationalPercent"
  | "internationalMinimum"
  | "internationalAmount";

type ServiceChargeRow = {
  id: string;
  service: string;
} & {
  [Field in ChargeField]: Field extends "domesticType" | "internationalType"
    ? ChargeType
    : string;
};

const customerOptions: Option[] = [
  { value: "C001", label: "Customer One" },
  { value: "C002", label: "Customer Two" },
];

const customerIdOptions: Option[] = customerOptions.map(({ value }) => ({
  value,
  label: value,
}));

const chargeTypeOptions: Option[] = [
  { value: "A", label: "A" },
  { value: "P", label: "P" },
];

const chargeTypeSelectClassNames = {
  control: ({ isFocused }: { isFocused: boolean }) =>
    `!h-[30px] !min-h-[30px] !rounded-none !border-0 !shadow-none ${
      isFocused ? "!bg-emerald-50" : "!bg-transparent"
    }`,
  valueContainer: () => "!px-2 !py-0",
  singleValue: () => "!m-0 !text-[12px] !text-slate-700",
  indicatorsContainer: () => "!h-[28px]",
  dropdownIndicator: () => "!p-[2px] !text-slate-500",
  indicatorSeparator: () => "!hidden",
  menu: () =>
    "!z-[999999] !mt-1 !rounded-md !border !border-slate-200 !shadow-lg",
  menuList: () => "!p-1",
  option: ({ isFocused, isSelected }: { isFocused: boolean; isSelected: boolean }) =>
    `!rounded !px-2 !py-1 !text-[12px] ${
      isSelected
        ? "!bg-slate-200 !text-slate-800"
        : isFocused
          ? "!bg-slate-100 !text-slate-800"
          : "!bg-white !text-slate-700"
    }`,
};

const ChargeTypeSelect: React.FC<{
  id: string;
  label: string;
  value: ChargeType;
  onChange: (value: ChargeType) => void;
}> = ({ id, label, value, onChange }) => (
  <Select<Option, false>
    inputId={id}
    instanceId={id}
    components={selectComponents}
    aria-label={label}
    options={chargeTypeOptions}
    value={chargeTypeOptions.find((option) => option.value === value) ?? null}
    onChange={(option) => {
      if (option) onChange(option.value as ChargeType);
    }}
    isSearchable={false}
    isClearable={false}
    classNames={chargeTypeSelectClassNames}
    menuPosition="fixed"
    menuPortalTarget={typeof document !== "undefined" ? document.body : undefined}
    styles={{
      menuPortal: (base) => ({ ...base, zIndex: 999999 }),
      control: (base) => ({ ...base, cursor: "pointer" }),
    }}
  />
);

const initialRows: ServiceChargeRow[] = [
  ["TKT", "Air Ticket"],
  ["VOID", "Void"],
  ["EMD", "EMD"],
  ["REI", "Re-Issue"],
  ["TOFF", "Air Ticket Offline"],
  ["TON", "Air Ticket Online"],
  ["TONA", "Air Ticket Online (Assisted)"],
  ["TONN", "Air Ticket Online (Not Assisted)"],
  ["LCC", "LLC Tickets"],
  ["HTL", "Hotel"],
  ["CAR", "Car Rental"],
  ["LIM", "Limousine"],
  ["MA", "Meet & Assist"],
  ["TOUR", "Tourism"],
  ["CR", "Cruise/Ferries"],
  ["RT", "Rail Ticket"],
  ["INS", "Insurance"],
  ["IDL", "International Driving License"],
].map(([id, service]): ServiceChargeRow => ({
  id,
  service,
  domesticType: "A",
  domesticPercent: "0.00",
  domesticMinimum: "0.00",
  domesticAmount: "0.00",
  internationalType: "A",
  internationalPercent: "0.00",
  internationalMinimum: "0.00",
  internationalAmount: "0.00",
}));

const cellInputClass =
  "h-[30px] w-full min-w-[72px] border-0 bg-transparent px-2 text-right text-[12px] text-slate-700 outline-none focus:bg-emerald-50 focus:ring-1 focus:ring-inset focus:ring-emerald-400";
const headCellClass =
  "whitespace-nowrap border border-slate-400 bg-[#EEFBF4] px-2 py-2 text-left text-[11px] font-semibold text-slate-600";

const PolicyTabButton: React.FC<{
  tab: PolicyTab;
  active: boolean;
  onClick: () => void;
}> = ({ tab, active, onClick }) => (
  <button
    type="button"
    role="tab"
    id={`service-charge-tab-${tab.toLowerCase()}`}
    aria-selected={active}
    aria-controls="service-charge-policy-panel"
    onClick={onClick}
    className={`rounded-t-lg border px-5 py-2  text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${
      active
        ? "border-emerald-200 border-b-white  text-emerald-800 bg-green-200"
        : "border-slate-400 bg-slate-50 text-slate-600 hover:bg-emerald-50"
    }`}
  >
    {tab}
  </button>
);

const ServiceChargePolicy: React.FC = () => {
  const [activeTab, setActiveTab] = useState<PolicyTab>("Sales");
  const [customer, setCustomer] = useState<string | null>(null);
  const [merchantFee, setMerchantFee] = useState("0.00");
  const [rows, setRows] = useState<ServiceChargeRow[]>(initialRows);

  const updateRow = (rowId: string, field: ChargeField, value: string) => {
    setRows((currentRows) =>
      currentRows.map((row) =>
        row.id === rowId ? { ...row, [field]: value } : row,
      ),
    );
  };

  const updateAmount = (rowId: string, field: ChargeField, value: string) => {
    if (/^\d*\.?\d{0,2}$/.test(value)) {
      updateRow(rowId, field, value);
    }
  };

  const handleSave = () => {
    console.log("Service Charge Policy:", {
      tab: activeTab,
      customer,
      merchantFee,
      rows,
    });
  };

  const handleCancel = () => {
    setActiveTab("Sales");
    setCustomer(null);
    setMerchantFee("0.00");
    setRows(initialRows);
  };

  return (
    <div className="min-h-screen w-full bg-slate-100 p-3 sm:p-5">
      <main className="mx-auto w-full max-w-375 overflow-hidden border border-slate-400 bg-white shadow-sm">
        <Header Name="Service Charge Policy"/>

        <section className="space-y-4 p-4 sm:p-5">
          <div className="flex flex-wrap items-end gap-x-8 gap-y-3">
            <div className="flex min-w-0 flex-1 basis-112.5 items-center gap-3">
              <label
                htmlFor="servicePolicyCustomerId"
                className="shrink-0 text-sm font-medium text-slate-600"
              >
                Customer:
              </label>
              <PairCombo
                idId="servicePolicyCustomerId"
                nameId="servicePolicyCustomerName"
                idOptions={customerIdOptions}
                nameOptions={customerOptions}
                value={customer}
                onChange={setCustomer}
                idWidth="w-[120px]"
                nameWidth="w-[450px]"
                containerClassName="grid min-w-0 flex-1 grid-cols-[120px_minmax(0,1fr)] gap-2"
              />
            </div>

            <label className="flex items-center gap-3 text-sm font-medium text-slate-600">
              Merchant Fee %:
              <input
                id="servicePolicyMerchantFee"
                aria-label="Merchant Fee percentage"
                inputMode="decimal"
                value={merchantFee}
                onChange={(event) => {
                  if (/^\d*\.?\d{0,2}$/.test(event.target.value)) {
                    setMerchantFee(event.target.value);
                  }
                }}
                className="h-7.5 w-25 rounded-md border border-slate-300 bg-white px-2 text-right text-xs text-slate-700 outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-200"
              />
            </label>
          </div>

          <div className="-mb-0.5">
            <div
              role="tablist"
              aria-label="Policy type"
              className="flex items-end gap-1 "
            >
              {(["Sales", "Refund"] as const).map((tab) => (
                <PolicyTabButton
                  key={tab}
                  tab={tab}
                  active={activeTab === tab}
                  onClick={() => setActiveTab(tab)}
                />
              ))}
            </div>
          </div>

          <section
            id="service-charge-policy-panel"
            role="tabpanel"
            aria-labelledby={`service-charge-tab-${activeTab.toLowerCase()}`}
            className="overflow-hidden border border-slate-200"
          >
            <div className="overflow-x-auto">
              <table className="w-full min-w-280 table-fixed border-collapse">
                <colgroup>
                  <col className="w-52.5" />
                  <col className="w-18.75" />
                  <col className="w-17.5" />
                  <col className="w-27.5" />
                  <col className="w-30" />
                  <col className="w-30" />
                  <col className="w-17.5" />
                  <col className="w-27.5" />
                  <col className="w-30" />
                  <col className="w-30" />
                </colgroup>
                <thead>
                  <tr className="border border-gray-400">
                    <th
                      colSpan={2}
                      className="border border-slate-400 bg-white p-2"
                    />
                    <th
                      colSpan={4}
                      className="border border-emerald-200 bg-[#f7fbf3] px-2 py-2 text-center text-xs font-semibold uppercase tracking-wide text-emerald-900"
                    >
                      Domestic
                    </th>
                    <th
                      colSpan={4}
                      className="border border-emerald-200 bg-[#FEE4C3] px-2 py-2 text-center text-xs font-semibold uppercase tracking-wide text-emerald-900"
                    >
                      International
                    </th>
                  </tr>
                  <tr className="bg-[#EEFBF4]">
                    <th id="txtServiceType" className={headCellClass}>Service Type</th>
                    <th id="txtID" className={headCellClass}>ID</th>
                    <th id="lkpType" className={headCellClass}>Type</th>
                    <th id="txtSCharge" className={headCellClass}>S. Charge %</th>
                    <th id="txtMinSCharge" className={headCellClass}>Min. S. Charge</th>
                    <th id="txtSChargeAmt" className={headCellClass}>S. Charge Amt</th>
                   <th id="lkpType" className={headCellClass}>Type</th>
                    <th id="txtSCharge" className={headCellClass}>S. Charge %</th>
                    <th id="txtMinSCharge" className={headCellClass}>Min. S. Charge</th>
                    <th id="txtSChargeAmt" className={headCellClass}>S. Charge Amt</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={row.id} className="odd:bg-white even:bg-slate-50/60">
                      <th
                        scope="row"
                        className="border border-slate-400 px-2.5 py-1 text-left text-xs font-medium text-slate-700"
                      >
                        {row.service}
                      </th>
                      <td className="border border-slate-400 px-2 py-1 text-xs text-slate-500">
                        {row.id}
                      </td>
                      <td className="border border-slate-400 p-0 bg-[#f7fbf3]">
                        <ChargeTypeSelect
                          id={`${row.id}-domestic-charge-type`}
                          label={`${row.service} domestic charge type`}
                          value={row.domesticType}
                          onChange={(value) =>
                            updateRow(row.id, "domesticType", value)
                          }
                        />
                      </td>
                      <td className="border border-slate-400 p-0 bg-[#f7fbf3]">
                        <input
                          aria-label={`${row.service} domestic service charge percentage`}
                          inputMode="decimal"
                          value={row.domesticPercent}
                          onChange={(event) =>
                            updateAmount(
                              row.id,
                              "domesticPercent",
                              event.target.value,
                            )
                          }
                          className={cellInputClass}
                        />
                      </td>
                      <td className="border border-slate-400 p-0 bg-[#f7fbf3]">
                        <input
                          aria-label={`${row.service} domestic minimum service charge`}
                          inputMode="decimal"
                          value={row.domesticMinimum}
                          onChange={(event) =>
                            updateAmount(
                              row.id,
                              "domesticMinimum",
                              event.target.value,
                            )
                          }
                          className={cellInputClass}
                        />
                      </td>
                      <td className="border border-slate-400 p-0 bg-[#f7fbf3]">
                        <input
                          aria-label={`${row.service} domestic service charge amount`}
                          inputMode="decimal"
                          value={row.domesticAmount}
                          onChange={(event) =>
                            updateAmount(
                              row.id,
                              "domesticAmount",
                              event.target.value,
                            )
                          }
                          className={cellInputClass}
                        />
                      </td>
                      <td className="border border-slate-400 p-0 bg-[#FEE4C3] ">
                        <ChargeTypeSelect
                          id={`${row.id}-international-charge-type`}
                          label={`${row.service} international charge type`}
                          value={row.internationalType}
                          onChange={(value) =>
                            updateRow(row.id, "internationalType", value)
                          }
                        />
                      </td>
                      <td className="border border-slate-400 p-0 bg-[#FEE4C3] ">
                        <input
                          aria-label={`${row.service} international service charge percentage`}
                          inputMode="decimal"
                          value={row.internationalPercent}
                          onChange={(event) =>
                            updateAmount(
                              row.id,
                              "internationalPercent",
                              event.target.value,
                            )
                          }
                          className={cellInputClass}
                        />
                      </td>
                      <td className="border border-slate-400 p-0 bg-[#FEE4C3]   ">
                        <input
                          aria-label={`${row.service} international minimum service charge`}
                          inputMode="decimal"
                          value={row.internationalMinimum}
                          onChange={(event) =>
                            updateAmount(
                              row.id,
                              "internationalMinimum",
                              event.target.value,
                            )
                          }
                          className={cellInputClass}
                        />
                      </td>
                      <td className="border border-slate-400 p-0 bg-[#FEE4C3] ">
                        <input
                          aria-label={`${row.service} international service charge amount`}
                          inputMode="decimal"
                          value={row.internationalAmount}
                          onChange={(event) =>
                            updateAmount(
                              row.id,
                              "internationalAmount",
                              event.target.value,
                            )
                          }
                          className={cellInputClass}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
            <button
              type="button"
              disabled
              name="btnCopy"
              className="btn-style min-w-22.5 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Copy
            </button>
            <div className="flex flex-wrap justify-end gap-2">
              <button type="button" onClick={handleSave} className="btn-style" name="btnSave">
                Save
              </button>
              <button
                type="button"
                onClick={() =>
                  console.log("Attach service charge policy", {
                    tab: activeTab,
                    customer,
                  })
                }
                className="btn-style"
                name="btnAttach"
              >
                Attach
              </button>
              <button type="button" onClick={handleCancel} className="btn-style" name="btnCancel">
                Cancel
              </button>
              <button
                type="button"
                name="btnClose"
                onClick={() => window.history.back()}
                className="btn-style"
              >
                Close
              </button>
            </div>
          </footer>
        </section>
      </main>
    </div>
  );
};

export default ServiceChargePolicy;