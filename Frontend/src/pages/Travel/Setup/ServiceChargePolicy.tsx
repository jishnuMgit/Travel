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
  getServiceChargePolicyAttachments,
  runServiceChargePolicy,
  saveServiceChargePolicyAttachments,
  type ServiceChargePolicyAttachment,
  type ServiceChargePolicyApiRow,
} from "../../../utils/ServiceChargePolicyApi";
import TablesingleSelect from "../../../components/common/TablesingleSelect";
import { toast } from "react-toastify";
import { IoMdClose } from "react-icons/io";
import { useConfirmModal } from "../../../hooks/useConfirmModal";
import HotelSalesAttachPage, {
  type AttachSavePayload,
} from "./HotelSalesAttachPage";

type PolicyTab = "Sales" | "Refund";
type ChargeType = "A" | "P";
type ChargeField =
  | "lkpDServiceChargeType"
  | "txtDServiceChargePer"
  | "txtDMinServiceChargeAmt"
  | "txtDServiceChargeAmt"
  | "lkpIServiceChargeType"
  | "txtIServiceChargePer"
  | "txtIMinServiceChargeAmt"
  | "txtIServiceChargeAmt";

type ServiceChargeRow = {
  txtServiceTypeID: string;
  txtServiceType: string;
} & {
  [Field in ChargeField]: Field extends
    | "lkpDServiceChargeType"
    | "lkpIServiceChargeType"
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

const firstValue = (
  ...values: (number | string | null | undefined)[]
) => values.find((value) => value !== null && value !== undefined);

const mapPolicyRows = (
  items: ServiceChargePolicyApiRow[],
): ServiceChargeRow[] =>
  items.map((item) => {
    return {
      txtServiceTypeID: item.fservicetypeid,
      txtServiceType: item.fservicetypename ?? item.fservicetypeid,
      lkpDServiceChargeType: item.fd_servicechargetype === "P" ? "P" : "A",
      txtDServiceChargePer: amountValue(firstValue(
        item.fd_servicechargeper,
        item.fd_servicechgper,
        item.fd_servicecchargeper,
      )),
      txtDMinServiceChargeAmt: amountValue(firstValue(
        item.fd_minservicechargeamt,
        item.fd_minservicechgamt,
      )),
      txtDServiceChargeAmt: amountValue(firstValue(
        item.fd_servicechargeamt,
        item.fd_servicechgamt,
      )),
      lkpIServiceChargeType: item.fi_servicechargetype === "P" ? "P" : "A",
      txtIServiceChargePer: amountValue(firstValue(
        item.fi_servicechargeper,
        item.fi_servicechgper,
      )),
      txtIMinServiceChargeAmt: amountValue(firstValue(
        item.fi_minservicechargeamt,
        item.fi_minservicechgamt,
      )),
      txtIServiceChargeAmt: amountValue(firstValue(
        item.fi_servicechargeamt,
        item.fi_servicechgamt,
      )),
    };
  });

const blankPolicyRows = (items: ServiceChargePolicyApiRow[]) =>
  mapPolicyRows(items).map((row) => ({
    ...row,
    lkpDServiceChargeType: "A" as const,
    txtDServiceChargePer: "0.00",
    txtDMinServiceChargeAmt: "0.00",
    txtDServiceChargeAmt: "0.00",
    lkpIServiceChargeType: "A" as const,
    txtIServiceChargePer: "0.00",
    txtIMinServiceChargeAmt: "0.00",
    txtIServiceChargeAmt: "0.00",
  }));

const cellInputClass =
  "h-[30px] w-full min-w-[72px] border-0 bg-transparent px-2 text-right text-[12px] text-slate-700 outline-none focus:bg-emerald-50 focus:ring-1 focus:ring-inset focus:ring-emerald-400 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400";
const editableCellClass =
  "focus-within:z-20 focus-within:shadow-[inset_0_0_0_3px_#15803d]";
const headCellClass =
  "whitespace-nowrap border border-slate-400 bg-[#EEFBF4] px-2 py-2 text-left text-[11px] font-semibold text-slate-600";

const PolicyTabButton: React.FC<{
  tab: PolicyTab;
  active: boolean;
  disabled?: boolean;
  onClick: (event: React.MouseEvent<HTMLButtonElement>) => void;
  onKeyDown: (event: React.KeyboardEvent<HTMLButtonElement>) => void;
}> = ({ tab, active, disabled = false, onClick, onKeyDown }) => (
  <button
    type="button"
    disabled={disabled}
    role="tab"
    id={`service-charge-tab-${tab.toLowerCase()}`}
    aria-selected={active}
    aria-controls="service-charge-policy-panel"
    tabIndex={active ? 0 : -1}
    onClick={onClick}
    onKeyDown={onKeyDown}
    className={`rounded-t-lg border px-5 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 disabled:cursor-not-allowed disabled:opacity-50 ${
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
  const [attachModalOpen, setAttachModalOpen] = useState(false);
  const [attachmentsLoading, setAttachmentsLoading] = useState(false);
  const [attachments, setAttachments] = useState<ServiceChargePolicyAttachment[]>([]);
  const [, setError] = useState("");
  const [, setStatus] = useState("");
  const { confirm, dialog: overwriteDialog } = useConfirmModal();
  const requestSequence = useRef(0);
  const initialCustomerFocusSet = useRef(false);
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
    if (!loading && !initialCustomerFocusSet.current) {
      initialCustomerFocusSet.current = true;
      document.getElementById("lkpCustomerID")?.focus();
    }
  }, [loading]);

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
      setMerchantFee(amountValue(
        firstValue(headerResponse.data[0]?.fmerchantfeeper),
      ));
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

  const focusAmount = (rowId: string, field: ChargeField, value: string) => {
    if (value !== "" && Number(value) === 0) {
      updateRow(rowId, field, "");
    }
  };

  const blurAmount = (rowId: string, field: ChargeField, value: string) => {
    const amount = Number(value);
    updateRow(
      rowId,
      field,
      Number.isFinite(amount) ? amount.toFixed(2) : "0.00",
    );
  };

  const focusMerchantFee = () => {
    window.requestAnimationFrame(() => {
      document.getElementById("servicePolicyMerchantFee")?.focus();
    });
  };

  const handleFormKeyDown = (event: React.KeyboardEvent<HTMLElement>) => {
    if (
      event.key === "Enter" &&
      !event.defaultPrevented &&
      (event.target as HTMLElement).id === "lkpCustomerID"
    ) {
      event.preventDefault();
      document.getElementById("service-charge-tab-sales")?.focus();
    }
  };

  const handleTabKeyDown = (
    event: React.KeyboardEvent<HTMLButtonElement>,
    tab: PolicyTab,
  ) => {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
    event.preventDefault();
    const nextTab = tab === "Sales" ? "Refund" : "Sales";
    document
      .getElementById(`service-charge-tab-${nextTab.toLowerCase()}`)
      ?.focus();
  };

  const getEnabledGridControls = () => {
    const panel = document.getElementById("service-charge-policy-panel");
    if (!panel) return [];

    return Array.from(
      panel.querySelectorAll<HTMLElement>(
        'input:not([disabled]):not([type="hidden"]), select:not([disabled])',
      ),
    ).filter((control) => control.closest("td") !== null);
  };

  const focusFirstEnabledCell = () => {
    getEnabledGridControls()[0]?.focus();
  };

  const handleGridKeyDownCapture = (
    event: React.KeyboardEvent<HTMLElement>,
  ) => {
    if (event.key !== "Enter") return;

    const target = event.target as HTMLElement;
    if (target.getAttribute("aria-expanded") === "true") return;

    const controls = getEnabledGridControls();
    const currentIndex = controls.indexOf(target);
    if (currentIndex === -1) return;

    event.preventDefault();
    const nextControl = controls[currentIndex + 1];
    if (nextControl) {
      nextControl.focus();
    } else {
      document.querySelector<HTMLButtonElement>('button[name="btnSave"]')?.focus();
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
        Rows: rows.map((row) => ({
          StrServiceTypeID: row.txtServiceTypeID,
          lkpDServiceChargeType: row.lkpDServiceChargeType,
          StrDServiceChargePre: row.txtDServiceChargePer,
          StrDMinServiceChargeAmt: row.txtDMinServiceChargeAmt,
          StrDServiceChargeAmt: row.txtDServiceChargeAmt,
          lkpIServiceChargeType: row.lkpIServiceChargeType,
          StrIServiceChargePer: row.txtIServiceChargePer,
          StrIMinServiceChargeAmt: row.txtIMinServiceChargeAmt,
          StrIServiceChargeAmt: row.txtIServiceChargeAmt,
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
      const requestCopy = (overwriteExisting: boolean) =>
        copyServiceChargePolicy({
          PstrCoID,
          StrCustomerID: lkpCustomerID,
          StrCopyToCustomerID: copyTargetCustomerID,
          StrMenuName: "Service Charge Policy",
          OverwriteExisting: overwriteExisting,
        });

      let response = await requestCopy(false);
      if (response.requiresOverwriteConfirmation) {
        setCopying(false);
        const confirmed = await confirm({
          title: "Service Charge Policy - Copy",
          message: ` Do you want to overwrite the existing data?`,
          confirmLabel: "Yes",
          cancelLabel: "No",
        });
        if (!confirmed) return;

        setCopying(true);
        response = await requestCopy(true);
      }
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

  const handleOpenAttachments = async () => {
    if (!lkpCustomerID || !PstrCoID) return;

    setAttachmentsLoading(true);
    try {
      const attachmentRows = await getServiceChargePolicyAttachments(
        PstrCoID,
        lkpCustomerID,
        activeTab === "Sales" ? "S" : "R",
      );
      setAttachments(attachmentRows);
      setAttachModalOpen(true);
    } catch (attachmentError) {
      toast.error(
        attachmentError instanceof Error
          ? attachmentError.message
          : "Failed to load service charge policy attachments.",
      );
    } finally {
      setAttachmentsLoading(false);
    }
  };

  const handleSaveAttachments = async (attachmentRows: AttachSavePayload) => {
    if (!lkpCustomerID || !PstrCoID) {
      throw new Error("Select a customer before attaching files.");
    }

    const response = await saveServiceChargePolicyAttachments({
      PstrCoID,
      StrCustomerID: lkpCustomerID,
      StrSR: activeTab === "Sales" ? "S" : "R",
      Rows: attachmentRows,
    });
    if (!response.success) throw new Error(response.message);
  };

  const handleClear = () => {
    requestSequence.current += 1;
    setActiveTab("Sales");
    setLkpCustomerID(null);
    setCopyModalOpen(false);
    setCopyTargetCustomerID(null);
    setAttachModalOpen(false);
    setMerchantFee("0.00");
    setRows(blankPolicyRows(services));
    setError("");
    setStatus("");
  };

  return (
    <div className="min-h-screen w-full bg-slate-100 p-3 sm:p-5">
      <main className="mx-auto w-full max-w-250 overflow-hidden border border-slate-400 bg-white shadow-sm">
        <Header Name="Service Charge Policy"/>

        <section
          className="space-y-4 p-4 sm:p-5"
          onKeyDown={handleFormKeyDown}
        >
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
                  secondWidth={585}
                  gap={4}
                  headerFontSize="12px"
                  menuMaxHeight={400}
                  isDisabled={loading || attachmentsLoading}
                  onChange={(option) => {
                    const selectedCustomerID = option?.value ?? null;
                    setLkpCustomerID(selectedCustomerID);
                    if (selectedCustomerID) {
                      void loadCustomerPolicy(selectedCustomerID, activeTab).then(
                        () => {
                          window.requestAnimationFrame(() => {
                            document.getElementById("lkpCustomerID")?.focus();
                          });
                        },
                      );
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
                  disabled={attachmentsLoading}
                  onKeyDown={(event) => handleTabKeyDown(event, tab)}
                  onClick={(event) => {
                    setActiveTab(tab);
                    const activatedByKeyboard = event.detail === 0;
                    if (lkpCustomerID) {
                      void loadCustomerPolicy(lkpCustomerID, tab).then(() => {
                        if (activatedByKeyboard) {
                          focusMerchantFee();
                        }
                      });
                    } else if (activatedByKeyboard) {
                      focusMerchantFee();
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
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.defaultPrevented) {
                    event.preventDefault();
                    focusFirstEnabledCell();
                  }
                }}
                className="h-7.5 w-20 rounded-md border border-slate-300 bg-white px-2 text-right text-xs text-slate-700 outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-200"
              />
            </label>
            </div>
            
          </div>
          

          <section
            id="service-charge-policy-panel"
            role="tabpanel"
            aria-labelledby={`service-charge-tab-${activeTab.toLowerCase()}`}
            className="overflow-hidden border border-slate-200"
            onKeyDownCapture={handleGridKeyDownCapture}
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
                      className="border border-emerald-200 bg-[#f7fbf3] px-2 py-2 text-center text-xs font-semibold  tracking-wide text-emerald-900"
                    >
                      Domestic
                    </th>
                    <th
                      colSpan={4}
                      className="border border-emerald-200 bg-[#FEE4C3] px-2 py-2 text-center text-xs font-semibold  tracking-wide text-emerald-900"
                    >
                      International
                    </th>
                  </tr>
                  <tr className="bg-[#EEFBF4]">
                    <th id="txtServiceType" className={headCellClass}>Service Type</th>
                    <th id="txtServiceTypeID" className={headCellClass}>ID</th>
                    <th id="lkpDServiceChargeType" className={headCellClass}>Type</th>
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
                      <td className={`border border-slate-400 p-0 bg-[#f7fbf3] ${editableCellClass}`}>
                        <ChargeTypeSelect
                          id={`lkpDServiceChargeType-${row.txtServiceTypeID}`}
                          label={`${row.txtServiceType} domestic charge type`}
                          value={row.lkpDServiceChargeType}
                          onChange={(value) =>
                            updateRow(row.txtServiceTypeID, "lkpDServiceChargeType", value)
                          }
                        />
                      </td>
                      <td className={`border border-slate-400 p-0 bg-[#f7fbf3] ${editableCellClass}`}>
                        <input
                          id={`txtDSCPre-${row.txtServiceTypeID}`}
                          aria-label={`${row.txtServiceType} domestic service charge percentage`}
                          inputMode="decimal"
                          value={row.txtDServiceChargePer}
                          onFocus={() =>
                            focusAmount(
                              row.txtServiceTypeID,
                              "txtDServiceChargePer",
                              row.txtDServiceChargePer,
                            )
                          }
                          onChange={(event) =>
                            updateAmount(
                              row.txtServiceTypeID,
                              "txtDServiceChargePer",
                              event.target.value,
                            )
                          }
                          onBlur={(event) =>
                            blurAmount(
                              row.txtServiceTypeID,
                              "txtDServiceChargePer",
                              event.target.value,
                            )
                          }
                          disabled={row.lkpDServiceChargeType !== "P"}
                          className={cellInputClass}
                        />
                      </td>
                      <td className={`border border-slate-400 p-0 bg-[#f7fbf3] ${editableCellClass}`}>
                        <input
                          id={`txtMinDSCAmt-${row.txtServiceTypeID}`}
                          aria-label={`${row.txtServiceType} domestic minimum service charge`}
                          inputMode="decimal"
                          value={row.txtDMinServiceChargeAmt}
                          onFocus={() =>
                            focusAmount(
                              row.txtServiceTypeID,
                              "txtDMinServiceChargeAmt",
                              row.txtDMinServiceChargeAmt,
                            )
                          }
                          onChange={(event) =>
                            updateAmount(
                              row.txtServiceTypeID,
                              "txtDMinServiceChargeAmt",
                              event.target.value,
                            )
                          }
                          onBlur={(event) =>
                            blurAmount(
                              row.txtServiceTypeID,
                              "txtDMinServiceChargeAmt",
                              event.target.value,
                            )
                          }
                          disabled={row.lkpDServiceChargeType !== "P"}
                          className={cellInputClass}
                        />
                      </td>
                      <td className={`border border-slate-400 p-0 bg-[#f7fbf3] ${editableCellClass}`}>
                        <input
                          id={`txtDSCAmt-${row.txtServiceTypeID}`}
                          aria-label={`${row.txtServiceType} domestic service charge amount`}
                          inputMode="decimal"
                          value={row.txtDServiceChargeAmt}
                          onFocus={() =>
                            focusAmount(
                              row.txtServiceTypeID,
                              "txtDServiceChargeAmt",
                              row.txtDServiceChargeAmt,
                            )
                          }
                          onChange={(event) =>
                            updateAmount(
                              row.txtServiceTypeID,
                              "txtDServiceChargeAmt",
                              event.target.value,
                            )
                          }
                          onBlur={(event) =>
                            blurAmount(
                              row.txtServiceTypeID,
                              "txtDServiceChargeAmt",
                              event.target.value,
                            )
                          }
                          disabled={row.lkpDServiceChargeType !== "A"}
                          className={cellInputClass}
                        />
                      </td>
                      <td className={`border border-slate-400 p-0 bg-[#FEE4C3] ${editableCellClass}`}>
                        <ChargeTypeSelect
                          id={`lkpISCType-${row.txtServiceTypeID}`}
                          label={`${row.txtServiceType} international charge type`}
                          value={row.lkpIServiceChargeType}
                          onChange={(value) =>
                            updateRow(row.txtServiceTypeID, "lkpIServiceChargeType", value)
                          }
                        />
                      </td>
                      <td className={`border border-slate-400 p-0 bg-[#FEE4C3] ${editableCellClass}`}>
                        <input
                          id={`txtIServiceChargePer-${row.txtServiceTypeID}`}
                          aria-label={`${row.txtServiceType} international service charge percentage`}
                          inputMode="decimal"
                          value={row.txtIServiceChargePer}
                          onFocus={() =>
                            focusAmount(
                              row.txtServiceTypeID,
                              "txtIServiceChargePer",
                              row.txtIServiceChargePer,
                            )
                          }
                          onChange={(event) =>
                            updateAmount(
                              row.txtServiceTypeID,
                              "txtIServiceChargePer",
                              event.target.value,
                            )
                          }
                          onBlur={(event) =>
                            blurAmount(
                              row.txtServiceTypeID,
                              "txtIServiceChargePer",
                              event.target.value,
                            )
                          }
                          disabled={row.lkpIServiceChargeType !== "P"}
                          className={cellInputClass}
                        />
                      </td>
                      <td className={`border border-slate-400 p-0 bg-[#FEE4C3] ${editableCellClass}`}>
                        <input
                          id={`txtIMinSCAmt-${row.txtServiceTypeID}`}
                          aria-label={`${row.txtServiceType} international minimum service charge`}
                          inputMode="decimal"
                          value={row.txtIMinServiceChargeAmt}
                          onFocus={() =>
                            focusAmount(
                              row.txtServiceTypeID,
                              "txtIMinServiceChargeAmt",
                              row.txtIMinServiceChargeAmt,
                            )
                          }
                          onChange={(event) =>
                            updateAmount(
                              row.txtServiceTypeID,
                              "txtIMinServiceChargeAmt",
                              event.target.value,
                            )
                          }
                          onBlur={(event) =>
                            blurAmount(
                              row.txtServiceTypeID,
                              "txtIMinServiceChargeAmt",
                              event.target.value,
                            )
                          }
                          disabled={row.lkpIServiceChargeType !== "P"}
                          className={cellInputClass}
                        />
                      </td>
                      <td className={`border border-slate-400 p-0 bg-[#FEE4C3] ${editableCellClass}`}>
                        <input
                          id={`txtISCAmt-${row.txtServiceTypeID}`}
                          aria-label={`${row.txtServiceType} international service charge amount`}
                          inputMode="decimal"
                          value={row.txtIServiceChargeAmt}
                          onFocus={() =>
                            focusAmount(
                              row.txtServiceTypeID,
                              "txtIServiceChargeAmt",
                              row.txtIServiceChargeAmt,
                            )
                          }
                          onChange={(event) =>
                            updateAmount(
                              row.txtServiceTypeID,
                              "txtIServiceChargeAmt",
                              event.target.value,
                            )
                          }
                          onBlur={(event) =>
                            blurAmount(
                              row.txtServiceTypeID,
                              "txtIServiceChargeAmt",
                              event.target.value,
                            )
                          }
                          disabled={row.lkpIServiceChargeType !== "A"}
                          className={cellInputClass}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <footer className="grid grid-cols-1 items-center gap-3 border-t border-slate-100 pt-4 sm:grid-cols-[1fr_auto_1fr]">
            <button
              type="button"
              onClick={() => {
                setCopyTargetCustomerID(null);
                setCopyModalOpen(true);
              }}
              disabled={
                !lkpCustomerID ||
                loading ||
                saving ||
                copying ||
                attachmentsLoading
              }
              name="btnCopy"
              className="btn-style min-w-22.5 justify-self-start disabled:cursor-not-allowed disabled:opacity-50"
            >
              Copy
            </button>
            <div className="flex flex-wrap justify-center gap-2 sm:col-start-2 sm:row-start-1">
              <button
                type="button"
                onClick={handleSave}
                disabled={saving || loading || attachmentsLoading}
                className="btn-style disabled:cursor-not-allowed disabled:opacity-50"
                name="btnSave"
              >
                {saving ? "Saving..." : "Save"}
              </button>
              <button
                type="button"
                onClick={() => void handleOpenAttachments()}
                disabled={
                  !lkpCustomerID ||
                  loading ||
                  saving ||
                  copying ||
                  attachmentsLoading
                }
                className="btn-style disabled:cursor-not-allowed disabled:opacity-50"
                name="btnAttach"
              >
                {attachmentsLoading ? "Loading..." : "Attach"}
              </button>
              <button
                type="button"
                onClick={handleClear}
                disabled={attachmentsLoading}
                className="btn-style disabled:cursor-not-allowed disabled:opacity-50"
                name="btnClear"
              >
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
            className="w-full max-w-4xl border border-slate-400 bg-white shadow-lg"
          >
           <header className="flex h-8.25 items-center bg-[#9fdfbc] text-gray-800 relative">
                <h1 className="ml-4 text-[17x] font-semibold ">
                  Service Charge Policy - Copy
               </h1>
          
               <button className="absolute right-3  hover:bg-red-100 p-0.5 rounded-full cursor-pointer"  onClick={() => setCopyModalOpen(false)} ><IoMdClose size={20}/></button>
             </header>
           <div className="flex justify-center items-center gap-2 mt-3 px-[5px] flex-nowrap">
             <label
              htmlFor="copyServiceChargeCustomer"
              className=" block text-[14px] text-slate-600 whitespace-nowrap"
            >
              Copy To Customer :
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
              secondWidth={585}
              gap={4}
              headerFontSize="12px"
              menuMaxHeight={400}
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
                {copying ? "Copying..." : "Copy"}
              </button>
            </div>
          </section>
        </div>
      )}
      {attachModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-3">
          <section
            role="dialog"
            aria-modal="true"
            aria-label="Service charge policy attachments"
            className="max-h-[95vh] w-full max-w-[1050px] overflow-auto bg-white shadow-xl"
          >
            <HotelSalesAttachPage
              key={`${lkpCustomerID}-${activeTab}`}
              headerName="Service Charge Policy - Attach"
              attachments={attachments}
              onClose={() => setAttachModalOpen(false)}
              onSave={handleSaveAttachments}
            />
          </section>
        </div>
      )}
      {overwriteDialog}
    </div>
  );
};

export default ServiceChargePolicy;