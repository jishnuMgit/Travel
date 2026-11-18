import { useEffect, useMemo, useRef, useState } from "react";
import CustomLinkedPairSelect, {
  type PairSelectOption,
} from "../../../components/common/CustomLinkedPairSelect";
import  {
  type TableSelectOption,
} from "../../../components/common/CommonTableSelect";
import Header from "../../../components/common/Header";
import {
  getTicketSalesCustomers,
  type CustomerRecord,
} from "../../../utils/airlineApi";
import {
  copyServiceChargePolicy,
  runServiceChargePolicy,
  type ServiceChargePolicyApiRow,
} from "../../../utils/ServiceChargePolicyApi";
import TablesingleSelect from "../../../components/common/TablesingleSelect";
import { toast } from "react-toastify";
import { IoMdClose } from "react-icons/io";

type PolicyTab = "Sales" | "Refund";
type ChargeType = "A" | "P";
type ChargeField =
  | "lkpDSCType"
  | "txtDSCPre"
  | "txtMinDSCAmt"
  | "txtDSCAmt"
  | "lkpISCType"
  | "txtISCPer"
  | "txtIMinSCAmt"
  | "txtISCAmt";

type ServiceChargeRow = {
  txtServiceTypeID: string;
  txtServiceType: string;
  slNo: number;
  originalSlNo: number;
} & {
  [Field in ChargeField]: Field extends "lkpDSCType" | "lkpISCType"
    ? ChargeType
    : string;
};

const chargeTypeOptions: TableSelectOption[] = [
  { value: "A", label: "A", id: "A", type: "By Amount" },
  { value: "P", label: "P", id: "P", type: "By Percentage" },
];

const chargeTypeColumns = [
  {
    key: "id",
    label: "ID",
    width: "50px",
    align: "center" as const,
    borderRight: "1px solid black",
  
  },
  { key: "type", label: "Type", width: "140px", align: "left" as const },
];

const ChargeTypeSelect: React.FC<{
  id: string;
  label: string;
  value: ChargeType;
  onChange: (value: ChargeType) => void;
}> = ({ id, label, value, onChange }) => (
  <TablesingleSelect
    inputId={id}
    options={chargeTypeOptions}
    value={chargeTypeOptions.find((option) => option.value === value) ?? null}
    onChange={(option) => {
      if (option?.value === "A" || option?.value === "P") {
        onChange(option.value);
      }
    }}
    columns={chargeTypeColumns}
    width="100%"
    menuWidth="220px"
    placeholder=""
    headerFontSize="12px"
    isSearchable={false}
    ariaLabel={label}
  />
);

const amountValue = (value: number | string | null | undefined) =>
  Number(value ?? 0).toFixed(2);

const mapPolicyRows = (
  items: ServiceChargePolicyApiRow[],
): ServiceChargeRow[] =>
  items.map((item, index) => {
    const slNo = Number(item.fslno ?? item.fpositionno ?? index + 1);
    return {
      txtServiceTypeID: item.fserviceid,
      txtServiceType: item.fservicename ?? item.fserviceid,
      slNo,
      originalSlNo: slNo,
      lkpDSCType: item.fd_servicechargetype === "P" ? "P" : "A",
      txtDSCPre: amountValue(item.fd_servicechgper),
      txtMinDSCAmt: amountValue(item.fd_minservicechgamt),
      txtDSCAmt: amountValue(item.fd_servicechgamt),
      lkpISCType: item.fi_servicechargetype === "P" ? "P" : "A",
      txtISCPer: amountValue(item.fi_servicechgper),
      txtIMinSCAmt: amountValue(item.fi_minservicechgamt),
      txtISCAmt: amountValue(item.fi_servicechgamt),
    };
  });

const blankPolicyRows = (items: ServiceChargePolicyApiRow[]) =>
  mapPolicyRows(items).map((row) => ({
    ...row,
    lkpDSCType: "A" as const,
    txtDSCPre: "0.00",
    txtMinDSCAmt: "0.00",
    txtDSCAmt: "0.00",
    lkpISCType: "A" as const,
    txtISCPer: "0.00",
    txtIMinSCAmt: "0.00",
    txtISCAmt: "0.00",
  }));

const cellInputClass =
  "h-[30px] w-full min-w-[72px] border-0 bg-transparent px-2 text-right text-[12px] text-slate-700 outline-none focus:bg-emerald-50 focus:ring-1 focus:ring-inset focus:ring-emerald-400 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400";
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
  const [lkpCustomerID, setLkpCustomerID] = useState<string | null>(null);
  const [merchantFee, setMerchantFee] = useState("0.00");
  const [customers, setCustomers] = useState<CustomerRecord[]>([]);
  const [services, setServices] = useState<ServiceChargePolicyApiRow[]>([]);
  const [rows, setRows] = useState<ServiceChargeRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [copyModalOpen, setCopyModalOpen] = useState(false);
  const [copyTargetCustomerID, setCopyTargetCustomerID] = useState<string | null>(null);
  const [copying, setCopying] = useState(false);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const requestSequence = useRef(0);
  const PstrCoID = localStorage.getItem("PstrCoID")?.trim() ?? "";
  const customerPairOptions = useMemo<PairSelectOption[]>(
    () =>
      customers.map((item) => ({
        value: item.fcsaccountid,
        firstLabel: item.fcsaccountid,
        secondLabel: item.fcsaccountname ?? item.fcsaccountid,
      })),
    [customers],
  );
  const copyTargetOptions = useMemo(
    () => customerPairOptions.filter((option) => option.value !== lkpCustomerID),
    [customerPairOptions, lkpCustomerID],
  );

  useEffect(() => {
    let Clearled = false;

    const loadInitialData = async () => {
      if (!PstrCoID) {
        setError("Company ID (PstrCoID) was not found in localStorage.");
        setLoading(false);
        return;
      }

      try {
        const [customerData, serviceResponse] = await Promise.all([
          getTicketSalesCustomers(PstrCoID),
          runServiceChargePolicy({ StrMode: "GST", PstrCoID: PstrCoID }),
        ]);
        if (!serviceResponse.success) throw new Error(serviceResponse.message);
        if (!Clearled) {
          setCustomers(customerData);
          setServices(serviceResponse.data);
          setRows(blankPolicyRows(serviceResponse.data));
        }
      } catch (loadError) {
        if (!Clearled) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Failed to load service charge policy data.",
          );
        }
      } finally {
        if (!Clearled) setLoading(false);
      }
    };

    void loadInitialData();
    return () => {
      Clearled = true;
    };
  }, [PstrCoID]);

  const loadCustomerPolicy = async (
    lkpCustomerID: string,
    tab: PolicyTab,
  ) => {
    const sequence = ++requestSequence.current;
    setLoading(true);
    setError("");
    setStatus("");
    const SorR = tab === "Sales" ? "S" : "R";
    try {
      const [gridResponse, headerResponse] = await Promise.all([
        runServiceChargePolicy({
          StrSR: SorR,
          StrMode: tab === "Sales" ? "GS" : "GR",
          PstrCoID: PstrCoID,
          StrCustomerID: lkpCustomerID,
        }),
        runServiceChargePolicy({
          StrSR: SorR,
          StrMode: "GHD",
          PstrCoID: PstrCoID,
          StrCustomerID: lkpCustomerID,
        }),
      ]);
      if (!gridResponse.success) throw new Error(gridResponse.message);
      if (!headerResponse.success) throw new Error(headerResponse.message);
      if (sequence !== requestSequence.current) return;

      setRows(mapPolicyRows(gridResponse.data));
      setMerchantFee(amountValue(headerResponse.data[0]?.fmerchantfeeper));
    } catch (loadError) {
      if (sequence === requestSequence.current) {
        setError(
          loadError instanceof Error
            ? loadError.message
            : "Failed to load the selected customer's policy.",
        );
      }
    } finally {
      if (sequence === requestSequence.current) setLoading(false);
    }
  };

  const updateRow = (rowId: string, field: ChargeField, value: string) => {
    setRows((currentRows) =>
      currentRows.map((row) =>
        row.txtServiceTypeID === rowId ? { ...row, [field]: value } : row,
      ),
    );
  };

  const updateAmount = (rowId: string, field: ChargeField, value: string) => {
    if (/^\d*\.?\d{0,2}$/.test(value)) {
      updateRow(rowId, field, value);
    }
  };

  const handleSave = async () => {
    if (!PstrCoID) {
      setError("Company ID (PstrCoID) was not found in localStorage.");
      return;
    }
    if (!lkpCustomerID) {
      setError("Select a customer before saving.");
      return;
    }

    setSaving(true);
    setError("");
    setStatus("");
    try {
      const response = await runServiceChargePolicy<Record<string, unknown>>({
        StrMode: activeTab === "Sales" ? "S" : "SR",
        PstrCoID: PstrCoID,
        StrCustomerID: lkpCustomerID,
        StrSR: activeTab === "Sales" ? "S" : "R",
        NumMerchantFeePer: Number(merchantFee || 0),
        StrMenuName: "Service Charge Policy",
        Rows: rows.map((row) => ({
          intSlNo: row.slNo,
          Original_fSlNo: row.originalSlNo,
          StrServiceTypeID: row.txtServiceTypeID,
          lkpDSCType: row.lkpDSCType,
          StrDSCPre: row.txtDSCPre,
          StrMinDSCAmt: row.txtMinDSCAmt,
          StrDSCAmt: row.txtDSCAmt,
          lkpISCType: row.lkpISCType,
          StrISCPer: row.txtISCPer,
          StrIMinSCAmt: row.txtIMinSCAmt,
          StrISCAmt: row.txtISCAmt,
        })),
      });
      if (!response.success) throw new Error(response.message);
      setStatus(response.message);
      toast.success("Saved")
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Failed to save the service charge policy.",
      );
    } finally {
      setSaving(false);
    }
  };

  const handleCopy = async () => {
    if (!lkpCustomerID || !copyTargetCustomerID) return;
    if (!PstrCoID) {
      setError("Company ID (PstrCoID) was not found in localStorage.");
      return;
    }

    setCopying(true);
    setError("");
    setStatus("");
    try {
      const response = await copyServiceChargePolicy({
        PstrCoID,
        StrCustomerID: copyTargetCustomerID,
        StrSourceCustomerID: lkpCustomerID,
        StrMenuName: "Service Charge Policy",
      });
      if (!response.success) throw new Error(response.message);

      setCopyModalOpen(false);
      setCopyTargetCustomerID(null);
      setLkpCustomerID(copyTargetCustomerID);
      toast.success(response.message || "Service charge policy copied.");
      await loadCustomerPolicy(copyTargetCustomerID, activeTab);
    } catch (copyError) {
      const message =
        copyError instanceof Error
          ? copyError.message
          : "Failed to copy the service charge policy.";
      setError(message);
      toast.error(message);
    } finally {
      setCopying(false);
    }
  };

  const handleClear = () => {
    requestSequence.current += 1;
    setActiveTab("Sales");
    setLkpCustomerID(null);
    setCopyModalOpen(false);
    setCopyTargetCustomerID(null);
    setMerchantFee("0.00");
    setRows(blankPolicyRows(services));
    setError("");
    setStatus("");
  };

  return (
    <div className="min-h-screen w-full bg-slate-100 p-3 sm:p-5">
      <main className="mx-auto w-full max-w-250 overflow-hidden border border-slate-400 bg-white shadow-sm">
        <Header Name="Service Charge Policy"/>

        <section className="space-y-4 p-4 sm:p-5">
          <div className="flex flex-wrap items-end gap-x-8 gap-y-3">
            <div className="flex min-w-0 flex-1 basis-112.5 items-center gap-3">
              <label
                htmlFor="lkpCustomerID"
                className="shrink-0 text-sm font-medium text-slate-600"
              >
                Customer:
              </label>
              <div className="min-w-0 flex-1">
                <CustomLinkedPairSelect
                  firstInputId="lkpCustomerID"
                  secondInputId="lkpCustomerName"
                  options={customerPairOptions}
                  firstValue={lkpCustomerID}
                  secondValue={lkpCustomerID}
                  firstHeader="Customer ID"
                  secondHeader="Customer Name"
                  firstWidth={120}
                  secondWidth={450}
                  gap={4}
                  headerFontSize="12px"
                  isDisabled={loading}
                  onChange={(option) => {
                    const selectedCustomerID = option?.value ?? null;
                    setLkpCustomerID(selectedCustomerID);
                    if (selectedCustomerID) {
                      void loadCustomerPolicy(selectedCustomerID, activeTab);
                    } else {
                      requestSequence.current += 1;
                      setMerchantFee("0.00");
                      setRows(blankPolicyRows(services));
                      setLoading(false);
                      setError("");
                      setStatus("");
                    }
                  }}
                />
              </div>
            </div>

           
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
                  onClick={() => {
                    setActiveTab(tab);
                    if (lkpCustomerID) {
                      void loadCustomerPolicy(lkpCustomerID, tab);
                    }
                  }}
                />
              ))}
               <label className="flex items-center gap-3 text-sm font-medium text-slate-600 ml-[10%] mb-[5px]">
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
                className="h-7.5 w-12 rounded-md border border-slate-300 bg-white px-2 text-right text-xs text-slate-700 outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-200"
              />
            </label>
            </div>
            
          </div>
          

          <section
            id="service-charge-policy-panel"
            role="tabpanel"
            aria-labelledby={`service-charge-tab-${activeTab.toLowerCase()}`}
            className="overflow-hidden border border-slate-200"
          >
            {/* {error && (
              <p role="alert" className="px-3 py-2 text-sm text-red-600">
                {error}
              </p>
            )}
            {status && (
              <p role="status" className="px-3 py-2 text-sm text-emerald-700">
                {status}
              </p>
            )} */}
            <div className="overflow-x-auto">
              <table className="w-full table-fixed border-collapse">
                <colgroup>
                  <col className="w-52.5" />
                  <col className="w-14" />
                  <col className="w-12" />
                  <col className="w-20" />
                  <col className="w-22" />
                  <col className="w-22" />
                  <col className="w-12" />
                  <col className="w-20" />
                  <col className="w-22" />
                  <col className="w-22" />
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
                    <th id="txtServiceTypeID" className={headCellClass}>ID</th>
                    <th id="lkpDSCType" className={headCellClass}>Type</th>
                    <th id="txtDSCPre" className={`${headCellClass} text-right`}>S. Charge %</th>
                    <th id="txtMinDSCAmt" className={`${headCellClass} text-right`}>Min. S. Charge</th>
                    <th id="txtDSCAmt" className={`${headCellClass} text-right`}>S. Charge Amt</th>
                    <th id="lkpISCType" className={headCellClass}>Type</th>
                    <th id="txtISCPer" className={`${headCellClass} text-right`}>S. Charge %</th>
                    <th id="txtIMinSCAmt" className={`${headCellClass} text-right`}>Min. S. Charge</th>
                    <th id="txtISCAmt" className={`${headCellClass} text-right`}>S. Charge Amt</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={row.txtServiceTypeID} className="odd:bg-white even:bg-slate-50/60">
                      <th
                        scope="row"
                        id={`txtServiceType-${row.txtServiceTypeID}`}
                        className="border border-slate-400 px-2.5 py-1 text-left text-xs font-medium text-slate-700"
                      >
                        {row.txtServiceType}
                      </th>
                      <td
                        id={`txtServiceTypeID-${row.txtServiceTypeID}`}
                        className="border border-slate-400 px-2 py-1 text-xs text-slate-500"
                      >
                        {row.txtServiceTypeID}
                      </td>
                      <td className="border border-slate-400 p-0 bg-[#f7fbf3]">
                        <ChargeTypeSelect
                          id={`lkpDSCType-${row.txtServiceTypeID}`}
                          label={`${row.txtServiceType} domestic charge type`}
                          value={row.lkpDSCType}
                          onChange={(value) =>
                            updateRow(row.txtServiceTypeID, "lkpDSCType", value)
                          }
                        />
                      </td>
                      <td className="border border-slate-400 p-0 bg-[#f7fbf3]">
                        <input
                          id={`txtDSCPre-${row.txtServiceTypeID}`}
                          aria-label={`${row.txtServiceType} domestic service charge percentage`}
                          inputMode="decimal"
                          value={row.txtDSCPre}
                          onChange={(event) =>
                            updateAmount(
                              row.txtServiceTypeID,
                              "txtDSCPre",
                              event.target.value,
                            )
                          }
                          disabled={row.lkpDSCType !== "P"}
                          className={cellInputClass}
                        />
                      </td>
                      <td className="border border-slate-400 p-0 bg-[#f7fbf3]">
                        <input
                          id={`txtMinDSCAmt-${row.txtServiceTypeID}`}
                          aria-label={`${row.txtServiceType} domestic minimum service charge`}
                          inputMode="decimal"
                          value={row.txtMinDSCAmt}
                          onChange={(event) =>
                            updateAmount(
                              row.txtServiceTypeID,
                              "txtMinDSCAmt",
                              event.target.value,
                            )
                          }
                          disabled={row.lkpDSCType !== "P"}
                          className={cellInputClass}
                        />
                      </td>
                      <td className="border border-slate-400 p-0 bg-[#f7fbf3]">
                        <input
                          id={`txtDSCAmt-${row.txtServiceTypeID}`}
                          aria-label={`${row.txtServiceType} domestic service charge amount`}
                          inputMode="decimal"
                          value={row.txtDSCAmt}
                          onChange={(event) =>
                            updateAmount(
                              row.txtServiceTypeID,
                              "txtDSCAmt",
                              event.target.value,
                            )
                          }
                          disabled={row.lkpDSCType !== "A"}
                          className={cellInputClass}
                        />
                      </td>
                      <td className="border border-slate-400 p-0 bg-[#FEE4C3] ">
                        <ChargeTypeSelect
                          id={`lkpISCType-${row.txtServiceTypeID}`}
                          label={`${row.txtServiceType} international charge type`}
                          value={row.lkpISCType}
                          onChange={(value) =>
                            updateRow(row.txtServiceTypeID, "lkpISCType", value)
                          }
                        />
                      </td>
                      <td className="border border-slate-400 p-0 bg-[#FEE4C3] ">
                        <input
                          id={`txtISCPer-${row.txtServiceTypeID}`}
                          aria-label={`${row.txtServiceType} international service charge percentage`}
                          inputMode="decimal"
                          value={row.txtISCPer}
                          onChange={(event) =>
                            updateAmount(
                              row.txtServiceTypeID,
                              "txtISCPer",
                              event.target.value,
                            )
                          }
                          disabled={row.lkpISCType !== "P"}
                          className={cellInputClass}
                        />
                      </td>
                      <td className="border border-slate-400 p-0 bg-[#FEE4C3]   ">
                        <input
                          id={`txtIMinSCAmt-${row.txtServiceTypeID}`}
                          aria-label={`${row.txtServiceType} international minimum service charge`}
                          inputMode="decimal"
                          value={row.txtIMinSCAmt}
                          onChange={(event) =>
                            updateAmount(
                              row.txtServiceTypeID,
                              "txtIMinSCAmt",
                              event.target.value,
                            )
                          }
                          disabled={row.lkpISCType !== "P"}
                          className={cellInputClass}
                        />
                      </td>
                      <td className="border border-slate-400 p-0 bg-[#FEE4C3] ">
                        <input
                          id={`txtISCAmt-${row.txtServiceTypeID}`}
                          aria-label={`${row.txtServiceType} international service charge amount`}
                          inputMode="decimal"
                          value={row.txtISCAmt}
                          onChange={(event) =>
                            updateAmount(
                              row.txtServiceTypeID,
                              "txtISCAmt",
                              event.target.value,
                            )
                          }
                          disabled={row.lkpISCType !== "A"}
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
              onClick={() => {
                setCopyTargetCustomerID(null);
                setCopyModalOpen(true);
              }}
              disabled={!lkpCustomerID || loading || saving || copying}
              name="btnCopy"
              className="btn-style min-w-22.5 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Copy
            </button>
            <div className="flex flex-wrap justify-end gap-2">
              <button
                type="button"
                onClick={handleSave}
                disabled={saving || loading}
                className="btn-style disabled:cursor-not-allowed disabled:opacity-50"
                name="btnSave"
              >
                {saving ? "Saving..." : "Save"}
              </button>
              <button
                type="button"
                onClick={() =>
                  console.log("Attach service charge policy", {
                    tab: activeTab,
                    lkpCustomerID,
                  })
                }
                className="btn-style"
                name="btnAttach"
              >
                Attach
              </button>
              <button type="button" onClick={handleClear} className="btn-style" name="btnClear">
                Clear
              </button>

            </div>
          </footer>
        </section>
      </main>
      {copyModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-3"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !copying) {
              setCopyModalOpen(false);
            }
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="copy-service-charge-title"
            className="w-full max-w-xl border border-slate-400 bg-white  shadow-lg"
          >
           <header className="flex h-8.25 items-center bg-[#9fdfbc] text-gray-800 relative">
                <h1 className="ml-4 text-[17x] font-semibold ">
                  Copy Service Charge Policy
               </h1>
          
               <button className="absolute right-3  hover:bg-red-100 p-0.5 rounded-full cursor-pointer"  onClick={() => setCopyModalOpen(false)} ><IoMdClose size={20}/></button>
             </header>
           <div className="flex justify-center items-center  gap-2 mt-3 ml-3 mr-3 flex-nowrap">
             <label
              htmlFor="copyServiceChargeCustomer"
              className=" block text-[14px] text-slate-600 whitespace-nowrap"
            >
              customer :
            </label>
            <CustomLinkedPairSelect
              firstInputId="copyServiceChargeCustomer"
              secondInputId="copyServiceChargeCustomerName"
              options={copyTargetOptions}
              firstValue={copyTargetCustomerID}
              secondValue={copyTargetCustomerID}
              firstHeader="Customer ID"
              secondHeader="Customer Name"
              firstWidth={120}
              secondWidth={360}
              gap={4}
              headerFontSize="12px"
              isDisabled={copying || copyTargetOptions.length === 0}
              onChange={(option) => setCopyTargetCustomerID(option?.value ?? null)}
            />
           </div>
            {copyTargetOptions.length === 0 && (
              <p className="mt-3 text-sm text-slate-500">
                No other customers are available to copy to.
              </p>
            )}
            <div className="mt-5 mb-3 flex justify-center gap-2">
           
              <button
                type="button"
                onClick={() => void handleCopy()}
                disabled={!copyTargetCustomerID || copying}
                className="btn-style disabled:cursor-not-allowed disabled:opacity-50"
              >
                {copying ? "Copying..." : "Save"}
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
};

export default ServiceChargePolicy;