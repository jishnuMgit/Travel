import React, { useState } from "react";
import Select from "react-select";
import selectComponents from "./selectComponents";
import TicketLinesFields from "./TicketLinesFields";

/* =====================================================================
   FILE MAP
   1. Types, constants and sample options
   2. Shared building blocks
   3. Parts   : TicketLinesGrid (customer grid + totals),
                TicketLinesFields (Ref. 1-4, Post No., KB., notes),
                TicketLinesActions (button bar)
   4. TicketLinesPage : owns the state and renders the parts in one place

   Type and MF are removed (columns and totals boxes), as requested.
   ===================================================================== */

/* ---------------------------------------------------------------------
   1. TYPES, CONSTANTS AND SAMPLE OPTIONS
   --------------------------------------------------------------------- */
type Option = { value: string; label: string };

/* Sample customers. Replace with data from your API. */
const customerIdOptions: Option[] = [
  { value: "C001", label: "C001" },
  { value: "C002", label: "C002" },
  { value: "C003", label: "C003" },
];
const customerNames: Record<string, string> = {
  C001: "CUSTOMER ONE",
  C002: "CUSTOMER TWO",
  C003: "CUSTOMER THREE",
};
const customerNameOptions: Option[] = customerIdOptions.map(({ value }) => ({
  value,
  label: customerNames[value],
}));

type MoneyField = "fare" | "tax" | "cdAmt" | "sChg" | "sChgV" | "invAmt";

type LineRow = {
  key: number;
  customerId: string | null;
  division: string;
   type: string;
  fare: string;
  tax: string;
  cdAmt: string;
  sChg: string;
  sChgV: string;
  invAmt: string;
  invNo: string; // read-only
};

type DetailForm = {
  ref1: string;
  ref2: string;
  ref3: string;
  ref4: string;
  postNo: string; // read-only
  kbAmt: string;
  kbAccount: string | null;
  invNote: string;
  note: string;
};

type SetDetail = <K extends keyof DetailForm>(
  key: K,
  value: DetailForm[K],
) => void;

type ActionName =
  | "copy"
  | "fix"
  | "save"
  | "search"
  | "delete"
  | "cnj"
  | "printSv"
  | "print"
  | "attach"
  | "customerAttach"
  | "supplierAttach"
  | "cancel"
  | "close"
  | "cc"
  | "inv"
  | "ci";

const MIN_ROWS = 3;

let keyCounter = 0;
const nextKey = () => ++keyCounter;

const emptyLine = (): LineRow => ({
  key: nextKey(),
  customerId: null,
  division: "",
  type:"",
  fare: "",
  tax: "",
  cdAmt: "",
  sChg: "",
  sChgV: "",
  invAmt: "",
  invNo: "",
});

const moneyFields: MoneyField[] = [
  "fare",
  "tax",
  "cdAmt",
  "sChg",
  "sChgV",
  "invAmt",
];

const isEmptyLine = (row: LineRow) =>
  !row.customerId &&
  !row.division &&
  moneyFields.every((field) => row[field] === "");

/** keeps one empty row at the end and at least MIN_ROWS rows in total */
const padLines = (rows: LineRow[]): LineRow[] => {
  const result = [...rows];
  if (result.length === 0 || !isEmptyLine(result[result.length - 1])) {
    result.push(emptyLine());
  }
  while (result.length < MIN_ROWS) result.push(emptyLine());
  return result;
};

const initialDetail = (): DetailForm => ({
  ref1: "",
  ref2: "",
  ref3: "",
  ref4: "",
  postNo: "",
  kbAmt: "0",
  kbAccount: null,
  invNote: "",
  note: "",
});

const toNumber = (value: string) => {
  const parsed = parseFloat(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const formatMoney = (value: number) =>
  value.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

/** VAT Amt. of a line. Fill this from your VAT rules; it is 0 until then. */
const computeVatAmt = (_row: LineRow) => 0;

/* ---------------------------------------------------------------------
   2. SHARED BUILDING BLOCKS
   --------------------------------------------------------------------- */

/* form-field select (30px) */
const fieldSelectProps = {
  isSearchable: true,
  isClearable: false,
  placeholder: "",
  menuPosition: "fixed" as const,
  menuPortalTarget: typeof document !== "undefined" ? document.body : undefined,
  classNames: {
    control: ({ isFocused }: { isFocused: boolean }) => `
      !min-h-[30px] !h-[30px] !rounded-[4px] !border !shadow-none !text-[12px]
      hover:!border-[#aab8c5] !bg-white
      ${isFocused ? "!border-[#91a7b9]" : "!border-[#cfd7df]"}
    `,
    valueContainer: () => "!h-[26px] !py-0 !px-[5px] !overflow-hidden",
    singleValue: () => "!m-0 !text-[12px] !text-[#24364d]",
    placeholder: () => "!m-0 !text-[12px] !text-[#7a8794]",
    input: () => "!m-0 !p-0 !text-[12px] !text-[#24364d]",
    indicatorsContainer: () => "!h-[26px]",
    dropdownIndicator: () => "!p-[2px] !text-[#657486]",
    indicatorSeparator: () => "!hidden",
    menu: () =>
      "!mt-[1px] !rounded-none !border !border-[#cfd7df] !z-[999999] !shadow-md",
    menuList: () => "!p-0 !max-h-[180px]",
    option: ({
      isFocused,
      isSelected,
    }: {
      isFocused: boolean;
      isSelected: boolean;
    }) => `
      !cursor-pointer !px-[6px] !py-[4px] !text-[12px] !text-[#24364d]
      ${isSelected ? "!bg-[#e7f7ed]" : isFocused ? "!bg-[#f2faf5]" : "!bg-white"}
    `,
  },
};

/* grid-cell select (borderless, fills the cell) */
const cellSelectProps = {
  ...fieldSelectProps,
  classNames: {
    ...fieldSelectProps.classNames,
    control: ({ isFocused }: { isFocused: boolean }) => `
      !min-h-[26px] !h-[26px] !rounded-none !border-0 !shadow-none !text-[12px]
      !bg-transparent
      ${isFocused ? "!bg-white !ring-1 !ring-inset !ring-[#B7ECD0]" : ""}
    `,
    valueContainer: () => "!h-[26px] !py-0 !px-[8px] !overflow-hidden",
    indicatorsContainer: () => "!h-[26px]",
  },
};

/** label + control on one line */


/** editable amount for a grid cell: right aligned, 2 decimals after leaving it */
const MoneyCell: React.FC<{
  label: string;
  value: string;
  onFocus: () => void;
  onChange: (value: string) => void;
}> = ({ label, value, onFocus, onChange }) => (
  <input
    aria-label={label}
    inputMode="decimal"
    value={value}
    onFocus={(event) => {
      onFocus();
      event.target.select();
    }}
    onChange={(event) => {
      if (/^\d*\.?\d{0,2}$/.test(event.target.value)) onChange(event.target.value);
    }}
    onBlur={() => {
      if (value !== "") onChange(toNumber(value).toFixed(2));
    }}
    className="h-6.5 w-full bg-transparent px-2 text-right text-[12px] text-[#24364d] outline-none focus:bg-white focus:ring-1 focus:ring-inset focus:ring-[#91a7b9]"
  />
);

/* ---------------------------------------------------------------------
   3. PARTS
   --------------------------------------------------------------------- */

/* 3a. Customer grid with the totals row ---------------------------------
   Columns: Customer ID, Customer Name, Division, Fare, Tax, CD. Amt.,
   S. Chg., VAT Amt., S. Chg. V., Inv. Amt., Inv. No.                    */
const th =
  "h-[30px] border border-[#B7ECD0] px-2 font-normal bg-[#EEFBF4] text-[#405066]";
const td = "h-[26px] border border-[#B7ECD0] px-2";


const TicketLinesGrid: React.FC<{
  rows: LineRow[];
  activeKey: number | null;
  onActivate: (key: number) => void;
  onCustomerChange: (key: number, customerId: string | null) => void;
  onDivisionChange: (key: number, value: string) => void;
  onTypeChange: (key: number, value: string) => void;
  onMoneyChange: (key: number, field: MoneyField, value: string) => void;
}> = ({
  rows,
  activeKey,
  onActivate,
  onCustomerChange,
  onDivisionChange,
  onTypeChange,
  onMoneyChange,
}) => {
  const sum = (field: MoneyField) =>
    rows.reduce((total, row) => total + toNumber(row[field]), 0);

  const vatTotal = rows.reduce(
    (total, row) => total + computeVatAmt(row),
    0,
  );

  const totalBox = (id: string, value: number) => (
    <td
      key={id}
      className="border border-[#B7ECD0] bg-[#eef1f4] p-0.75"
    >
      <input
        id={id}
        readOnly
        tabIndex={-1}
        aria-label={id}
        value={formatMoney(value)}
        className="h-6.5 w-full rounded-[3px] border border-[#cfd7df] bg-white px-2 text-right text-[12px] text-[#24364d] outline-none"
      />
    </td>
  );

  return (
    <div className="h-37.3 overflow-auto border border-[#B7ECD0] bg-white">
      <table className="w-full min-w-240 table-fixed border-collapse text-[12px] text-[#24364d]">
        <colgroup>
          <col className="w-5.5" />
          <col className="w-25" />
          <col className="min-w-60" />
          <col className="w-21" /> {/* Division */}
          <col className="w-15" /> {/* Type */}
          <col className="w-22.5" /> {/* Fare */}
          <col className="w-21" /> {/* Tax */}
          <col className="w-21" /> {/* CD. Amt. */}
          <col className="w-21" /> {/* S. Chg. */}
          <col className="w-21" /> {/* VAT Amt. */}
          <col className="w-21" /> {/* S. Chg. V. */}
          <col className="w-21" /> {/* Inv. Amt. */}
          <col className="w-25" /> {/* Inv. No. */}
        </colgroup>

        <thead className="sticky top-0 z-10">
          <tr>
            <th className={th} />
            <th className={`${th} text-left`}>Customer ID</th>
            <th className={`${th} text-left`}>Customer Name</th>
            <th className={`${th} text-left`}>Division</th>
            <th className={`${th} text-left`}>Type</th>
            <th className={`${th} text-right`}>Fare</th>
            <th className={`${th} text-right`}>Tax</th>
            <th className={`${th} text-right`}>CD. Amt.</th>
            <th className={`${th} text-right`}>S. Chg.</th>
            <th className={`${th} text-right`}>VAT Amt.</th>
            <th className={`${th} text-right`}>S. Chg. V.</th>
            <th className={`${th} text-right`}>Inv. Amt.</th>
            <th className={`${th} text-left`}>Inv. No.</th>
          </tr>
        </thead>

        <tbody>
          {rows.map((row) => {
            const active = row.key === activeKey;

            const customerValue = row.customerId
              ? {
                  value: row.customerId,
                  label: row.customerId,
                }
              : null;

            return (
              <tr
                key={row.key}
                onClick={() => onActivate(row.key)}
                className="bg-white"
              >
                {/* Active row indicator */}
                <td className="h-6.5 border border-[#B7ECD0] bg-[#fafbfc] text-center text-[8px] text-[#405066]">
                  {active ? "▶" : ""}
                </td>

                {/* Customer ID */}
                <td className="border border-[#B7ECD0] p-0">
                  <Select
                    inputId={`lkpLineCustomer-${row.key}`}
                    instanceId={`lkpLineCustomer-${row.key}`}
                    aria-label="Customer ID"
                    options={customerIdOptions}
                    value={customerValue}
                    components={selectComponents}
                    onFocus={() => onActivate(row.key)}
                    onChange={(option) =>
                      onCustomerChange(row.key, option?.value ?? null)
                    }
                    {...cellSelectProps}
                  />
                </td>

                {/* Customer Name */}
                <td className="border border-[#B7ECD0] p-0">
                  <Select
                    inputId={`lkpLineCustomerName-${row.key}`}
                    instanceId={`lkpLineCustomerName-${row.key}`}
                    aria-label="Customer Name"
                    options={customerNameOptions}
                    value={
                      row.customerId
                        ? {
                            value: row.customerId,
                            label: customerNames[row.customerId] ?? row.customerId,
                          }
                        : null
                    }
                    components={selectComponents}
                    onFocus={() => onActivate(row.key)}
                    onChange={(option) =>
                      onCustomerChange(row.key, option?.value ?? null)
                    }
                    {...cellSelectProps}
                  />
                </td>

                {/* Division */}
                <td className="border border-[#B7ECD0] p-0">
                  <input
                    aria-label="Division"
                    value={row.division}
                    onFocus={() => onActivate(row.key)}
                    onChange={(event) =>
                      onDivisionChange(row.key, event.target.value)
                    }
                    className="h-6.5 w-full bg-transparent px-2 text-[12px] text-[#24364d] outline-none focus:bg-white focus:ring-1 focus:ring-inset focus:ring-[#91a7b9]"
                  />
                </td>

                {/* Type */}
                <td className="border border-[#B7ECD0] p-0">
                  <input
                    aria-label="Type"
                    value={row.type ?? ""}
                    onFocus={() => onActivate(row.key)}
                    onChange={(event) =>
                      onTypeChange(row.key, event.target.value)
                    }
                    className="h-6.5 w-full bg-transparent px-2 text-[12px] text-[#24364d] outline-none focus:bg-white focus:ring-1 focus:ring-inset focus:ring-[#91a7b9]"
                  />
                </td>

                {/* Fare, Tax, CD. Amt., S. Chg. */}
                {(["fare", "tax", "cdAmt", "sChg"] as MoneyField[]).map(
                  (field) => (
                    <td
                      key={field}
                      className="border border-[#B7ECD0] p-0"
                    >
                      <MoneyCell
                        label={field}
                        value={row[field]}
                        onFocus={() => onActivate(row.key)}
                        onChange={(value) =>
                          onMoneyChange(row.key, field, value)
                        }
                      />
                    </td>
                  ),
                )}

                {/* VAT Amt. — read-only */}
                <td className={`${td} bg-[#eef1f4] text-right`}>
                  {isEmptyLine(row)
                    ? ""
                    : formatMoney(computeVatAmt(row))}
                </td>

                {/* S. Chg. V. and Inv. Amt. */}
                {(["sChgV", "invAmt"] as MoneyField[]).map((field) => (
                  <td
                    key={field}
                    className="border border-[#B7ECD0] p-0"
                  >
                    <MoneyCell
                      label={field}
                      value={row[field]}
                      onFocus={() => onActivate(row.key)}
                      onChange={(value) =>
                        onMoneyChange(row.key, field, value)
                      }
                    />
                  </td>
                ))}

                {/* Inv. No. — read-only */}
                <td className={`${td} bg-[#eef1f4]`}>
                  {row.invNo}
                </td>
              </tr>
            );
          })}
        </tbody>

        {/* Totals row — Type has no separate total box */}
        <tfoot className="sticky bottom-0 z-0">
          <tr>
            <td
              colSpan={5}
              className="border border-[#B7ECD0] bg-[#eef1f4]"
            />

            {totalBox("txtTotalFare", sum("fare"))}
            {totalBox("txtTotalTax", sum("tax"))}
            {totalBox("txtTotalCdAmt", sum("cdAmt"))}
            {totalBox("txtTotalSChg", sum("sChg"))}
            {totalBox("txtTotalVatAmt", vatTotal)}
            {totalBox("txtTotalSChgV", sum("sChgV"))}
            {totalBox("txtTotalInvAmt", sum("invAmt"))}

            <td className="border border-[#B7ECD0] bg-[#eef1f4]" />
          </tr>
        </tfoot>
      </table>
    </div>
  );
};




/* 3c. Button bar ---------------------------------------------------------
   left: Copy, Fix | middle: Save ... Close | right: CC, INV, CI          */
type ActionButtonProps = {
  id: string;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  compact?: boolean;
};

const ActionButton: React.FC<ActionButtonProps> = ({
  id,
  label,
  onClick,
  disabled = false,
  compact = false,
}) => (
  <button
    id={id}
    type="button"
    onClick={onClick}
    disabled={disabled}
    className={`btn-style min-w-20 disabled:cursor-not-allowed disabled:opacity-50 ${
      compact ? "h-8.5! min-w-20!  px-2! text-[12px]!" : ""
    }`}
  >
    {label}
  </button>
);

const TicketLinesActions: React.FC<{
  onAction: (name: ActionName) => void;
  enabled: Record<"copy" | "cnj" | "cc" | "inv" | "ci", boolean>;
  variant: "ticket" | "otherService";
}> = ({ onAction, enabled, variant }) => {
  if (variant === "otherService") {
    return (
      <div className="flex min-w-0 items-center justify-between gap-1 overflow-x-auto   bg-white px-1 py-1">
        <div className="flex shrink-0 gap-1">
          <ActionButton
            id="btnCopy"
            label="Copy"
            disabled
            compact
            onClick={() => onAction("copy")}
          />
        </div>
        <div className="flex shrink-0 gap-1">
          <ActionButton
            id="btnSave"
            label="Save"
            compact
            onClick={() => onAction("save")}
          />
          <ActionButton
            id="btnSearch"
            label="Search"
            compact
            onClick={() => onAction("search")}
          />
          <ActionButton
            id="btnDelete"
            label="Delete"
            disabled
            compact
            onClick={() => onAction("delete")}
          />
          <ActionButton
            id="btnPrintSV"
            label="Print SV"
            compact
            onClick={() => onAction("printSv")}
          />
          <ActionButton
            id="btnPrint"
            label="Print"
            disabled
            compact
            onClick={() => onAction("print")}
          />
          <ActionButton
            id="btnCustomerAttach"
            label="Cust. Attach"
            compact
            onClick={() => onAction("customerAttach")}
          />
          <ActionButton
            id="btnSupplierAttach"
            label="Supp. Attach"
            disabled
            compact
            onClick={() => onAction("supplierAttach")}
          />
          <ActionButton
            id="btnCancel"
            label="Cancel"
            compact
            onClick={() => onAction("cancel")}
          />
          <ActionButton
            id="btnClose"
            label="Close"
            compact
            onClick={() => onAction("close")}
          />
        </div>
        <div className="flex shrink-0 gap-1">
          <ActionButton
            id="btnCC"
            label="CC"
            disabled
            compact
            onClick={() => onAction("cc")}
          />
          <ActionButton
            id="btnINV"
            label="INV"
            disabled
            compact
            onClick={() => onAction("inv")}
          />
          <ActionButton
            id="btnCI"
            label="CI"
            disabled
            compact
            onClick={() => onAction("ci")}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-stretch gap-3 md:flex-row md:flex-wrap md:items-center md:justify-between md:gap-x-6 md:gap-y-2">
      <div className="flex flex-wrap gap-2">
        <ActionButton
          id="btnCopy"
          label="Copy"
          disabled={!enabled.copy}
          onClick={() => onAction("copy")}
        />
        <ActionButton id="btnFix" label="Fix" onClick={() => onAction("fix")} />
      </div>

      <div className="flex flex-wrap gap-2">
        <ActionButton id="btnSave" label="Save" onClick={() => onAction("save")} />
        <ActionButton id="btnSearch" label="Search" onClick={() => onAction("search")} />
        <ActionButton
          id="btnDelete"
          label="Delete"
          onClick={() => onAction("delete")}
        />
        <ActionButton
          id="btnCNJ"
          label="CNJ"
          disabled={!enabled.cnj}
          onClick={() => onAction("cnj")}
        />
        <ActionButton
          id="btnPrint"
          label="Print"
          onClick={() => onAction("print")}
        />
        <ActionButton
          id="btnAttach"
          label="Attach"
          onClick={() => onAction("attach")}
        />
        <ActionButton
          id="btnCancel"
          label="Cancel"
          onClick={() => onAction("cancel")}
        />
        <ActionButton
          id="btnClose"
          label="Close"
          onClick={() => onAction("close")}
        />
      </div>

      <div className="flex flex-wrap gap-2">
        <ActionButton
          id="btnCC"
          label="CC"
          disabled={!enabled.cc}
          onClick={() => onAction("cc")}
        />
        <ActionButton
          id="btnINV"
          label="INV"
          disabled={!enabled.inv}
          onClick={() => onAction("inv")}
        />
        <ActionButton
          id="btnCI"
          label="CI"
          disabled={!enabled.ci}
          onClick={() => onAction("ci")}
        />
      </div>
    </div>
  );
};

/* ---------------------------------------------------------------------
   4. MAIN PAGE : owns the state and renders the parts in one place
   --------------------------------------------------------------------- */
type TicketLinesPageProps = {
  /** true = render only the section (to place under the Ticket Sales form) */
  embedded?: boolean;
  actionVariant?: "ticket" | "otherService";
  /** called for Fix, search, Delete, Print, Attach, Copy, CNJ, CC, INV, CI */
  onAction?: (name: ActionName) => void;
  onClose?: () => void;
};

const TicketLinesPage: React.FC<TicketLinesPageProps> = ({
  embedded = false,
  actionVariant = "ticket",
  onAction,
  onClose,
}) => {
  const [rows, setRows] = useState<LineRow[]>(() => padLines([]));
  const [activeKey, setActiveKey] = useState<number | null>(() => null);
  const [detail, setDetail] = useState<DetailForm>(initialDetail);

  const set: SetDetail = (key, value) =>
    setDetail((prev) => ({ ...prev, [key]: value }));

  /* Buttons that depend on the loaded ticket. Enable them from your own
     rules, for example once a saved ticket is loaded. */
  const enabled = { copy: false, cnj: false, cc: false, inv: false, ci: false };

  /* Profit Amt. is calculated from your pricing rules; 0.00 until then. */
  const profitAmt = 0;

  const updateRow = (key: number, patch: Partial<LineRow>) =>
    setRows((prev) =>
      padLines(prev.map((row) => (row.key === key ? { ...row, ...patch } : row))),
    );

  const handleAction = (name: ActionName) => {
    switch (name) {
      case "save":
        console.log({
          lines: rows
            .filter((row) => !isEmptyLine(row))
            .map((row) => ({
              customerId: row.customerId,
              division: row.division,
              fare: toNumber(row.fare),
              tax: toNumber(row.tax),
              cdAmt: toNumber(row.cdAmt),
              sChg: toNumber(row.sChg),
              sChgV: toNumber(row.sChgV),
              invAmt: toNumber(row.invAmt),
            })),
          ...detail,
          kbAmt: toNumber(detail.kbAmt),
        });
        break;

      case "delete":
        // remove the highlighted line
        setRows((prev) =>
          padLines(prev.filter((row) => row.key !== activeKey)),
        );
        setActiveKey(null);
        break;

      case "cancel":
        setRows(padLines([]));
        setActiveKey(null);
        setDetail(initialDetail());
        break;

      case "close":
        setRows(padLines([]));
        setActiveKey(null);
        setDetail(initialDetail());
        onClose?.();
        break;

      default:
        console.log(name);
        onAction?.(name);
    }
  };

  const body = (
    <div className="flex flex-col gap-3  ">
      <TicketLinesGrid
        rows={rows}
        activeKey={activeKey}
        onActivate={setActiveKey}
        onCustomerChange={(key, customerId) => updateRow(key, { customerId })}
        onDivisionChange={(key, division) => updateRow(key, { division })}
        onMoneyChange={(key, field, value) => updateRow(key, { [field]: value })} onTypeChange={function (): void {
          throw new Error("Function not implemented.");
        } }      />
      <TicketLinesFields form={detail} set={set} profitAmt={profitAmt} />
      <TicketLinesActions
        onAction={handleAction}
        enabled={enabled}
        variant={actionVariant}
      />
    </div>
  );

  if (embedded) return body;

  return (
    <div className="flex min-h-fit w-full items-start justify-center bg-white px-4 pb-3 ">
      <div className="min-h-fit w-full max-w-375 bg-white p-0">
        <main className="w-full overflow-hidden border border-gray-300 rounded-sm shadow-sm bg-white -mt-3">
          
          <section className="px-3.5 pb-3 pt-3">{body}</section>
        </main>
      </div>
    </div>
  );
};

export default TicketLinesPage;