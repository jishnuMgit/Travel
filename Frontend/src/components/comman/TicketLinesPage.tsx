import React, { useEffect, useRef, useState } from "react";
import Select, {
  components,
  createFilter,
  type MenuListProps,
} from "react-select";
import selectComponents from "./selectComponents";
import TicketLinesFields from "./TicketLinesFields";
import { fieldSelectProps } from "./Combo";
import {
  calcLineAmounts,
  calcPolicyCharge,
  calcProfitAmt,
  type TicketLinesContext,
} from "./ticketLinesCalc";
import {
  getTicketSalesCustomerDivisions,
  getTicketSalesCustomers,
  getTicketSalesServiceChargePolicies,
  type CustomerDivisionRecord,
  type CustomerRecord,
  type ServiceChargePolicyRecord,
  type TicketDetailPayload,
  type TicketLinePayload,
} from "../../utils/airlineApi";

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
/* Options of the customer and division lists: the cell shows `label`; the list
   shows `first | second` (`first` defaults to `label`). */
type PairOption = {
  value: string;
  label: string;
  second: string;
  first?: string;
};

/* Column widths of a list. A column with no width fills the rest. The widths
   are CSS variables that the grid sets on the list when it opens: the width of
   the grid cells the list should line up with. */
type Columns = { first?: string; second?: string };
const customerIdColumns: Columns = { first: "var(--first-col, 100px)" };
const customerNameColumns: Columns = { second: "var(--second-col, 84px)" };
const divisionColumns: Columns = { first: "var(--first-col, 84px)" };

const columnStyle = (width?: string) =>
  width === undefined ? undefined : { width };
const columnClass = (width?: string) =>
  width === undefined ? "min-w-0 flex-1" : "shrink-0";

/* Heading row on top of a list, same columns as the rows. */
const makePairMenuList = (
  firstHeader: string,
  secondHeader: string,
  columns: Columns,
) => {
  const PairMenuList = (props: MenuListProps<PairOption, false>) => (
    <components.MenuList {...props}>
      <div className="sticky top-0 z-10 flex w-full items-stretch border-b border-[#b8c4d0] bg-[#f3f5f7] font-semibold text-[#344054]">
        <span
          style={columnStyle(columns.first)}
          className={`${columnClass(columns.first)} truncate border-r border-[#b8c4d0] px-[6px] py-[4px] text-[12px]`}
        >
          {firstHeader}
        </span>
        <span
          style={columnStyle(columns.second)}
          className={`${columnClass(columns.second)} truncate px-[8px] py-[4px] text-[12px]`}
        >
          {secondHeader}
        </span>
      </div>
      {props.children}
    </components.MenuList>
  );
  return PairMenuList;
};

const CustomerIdMenuList = makePairMenuList("ID", "Name", customerIdColumns);
const CustomerNameMenuList = makePairMenuList("Name", "ID", customerNameColumns);
const DivisionMenuList = makePairMenuList("ID", "Name", divisionColumns);

/* A row of a list: two columns with a divider. */
const pairOptionLabel =
  (columns: Columns) =>
  (option: PairOption, { context }: { context: "menu" | "value" }) =>
    context === "menu" ? (
      <div className="flex w-full items-stretch">
        <span
          style={columnStyle(columns.first)}
          className={`${columnClass(columns.first)} truncate border-r border-[#b8c4d0] px-[6px] py-[4px]`}
        >
          {option.first ?? option.label}
        </span>
        <span
          style={columnStyle(columns.second)}
          className={`${columnClass(columns.second)} truncate px-[8px] py-[4px]`}
        >
          {option.second}
        </span>
      </div>
    ) : (
      option.label
    );

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
  // worked out by the calculations (when the form gives the grid its context)
  vatAmt: number;
  hCharge: number;
  hScVat: number;
  mf: number;
  mfWoVat: number;
  mfVat: number;
  mfPer: number; // the merchant fee % of the customer's policy
  scType: string; // the service charge type of the policy (A / P)
  scPer: number; // the service charge % of the policy
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
  // | "attach"
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
  vatAmt: 0,
  hCharge: 0,
  hScVat: 0,
  mf: 0,
  mfWoVat: 0,
  mfVat: 0,
  mfPer: 0,
  scType: "",
  scPer: 0,
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

/* ---------------------------------------------------------------------
   2. SHARED BUILDING BLOCKS
   --------------------------------------------------------------------- */

/* form-field select (30px) */


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
  /** customers (tblaccountcs, fcs = C) */
  customers: CustomerRecord[];
  /** divisions (tblcustdivision) of each customer, loaded when it is picked */
  divisionsByCustomer: Record<string, CustomerDivisionRecord[]>;
  activeKey: number | null;
  onActivate: (key: number) => void;
  onCustomerChange: (key: number, customerId: string | null) => void;
  onDivisionChange: (key: number, value: string) => void;
  onTypeChange: (key: number, value: string) => void;
  onMoneyChange: (key: number, field: MoneyField, value: string) => void;
  /** true = VAT Amt., S. Chg. V. and Inv. Amt. are worked out (read-only) */
  calculated: boolean;
}> = ({
  rows,
  customers,
  divisionsByCustomer,
  activeKey,
  onActivate,
  onCustomerChange,
  onDivisionChange,
  onTypeChange,
  onMoneyChange,
  calculated,
}) => {
  // Each list is as wide as the grid cells it should cover. The widths are
  // measured when the list opens (cells of a row: 0 marker, 1 Customer ID,
  // 2 Customer Name, 3 Division, 4 B.Type):
  //   ID list       = Customer ID + Customer Name cells
  //   Name list     = Customer Name + Division cells (ID column = Division cell)
  //   Division list = Division + B.Type + Fare cells (ID column = Division cell)
  type ListSize = { width: number; firstCol: number; secondCol: number };
  const startSize: ListSize = { width: 320, firstCol: 100, secondCol: 84 };
  const [idList, setIdList] = useState<ListSize>(startSize);
  const [nameList, setNameList] = useState<ListSize>(startSize);
  const [divisionList, setDivisionList] = useState<ListSize>(startSize);

  const measureList = (
    inputId: string,
    from: number,
    to: number,
    save: (size: ListSize) => void,
    secondColWidth?: number, // fixed ID column; the first column takes the rest
    minWidth?: number, // the list is at least this wide
  ) => {
    const cells = document
      .getElementById(inputId)
      ?.closest("tr")
      ?.querySelectorAll("td");
    if (!cells || !cells[from] || !cells[to]) return;
    const widthOf = (i: number) => cells[i].getBoundingClientRect().width;
    let total = 0;
    for (let i = from; i <= to; i++) total += widthOf(i);
    save({
      width: Math.max(total, minWidth ?? 0),
      firstCol: widthOf(from),
      secondCol: secondColWidth ?? widthOf(to),
    });
  };

  const listMenuStyle = <T extends object>(base: T, size: ListSize) =>
    ({
      ...base,
      width: size.width,
      minWidth: size.width,
      "--first-col": `${size.firstCol}px`,
      "--second-col": `${size.secondCol}px`,
    }) as T;

  // ID list reads "ID | Name"; Name list reads "Name | ID"
  const customerIdOptions: PairOption[] = customers.map((c) => ({
    value: c.fcsaccountid,
    label: c.fcsaccountid,
    second: c.fcsaccountname ?? "",
  }));
  const customerNameOptions: PairOption[] = customers.map((c) => ({
    value: c.fcsaccountid,
    label: c.fcsaccountname ?? c.fcsaccountid,
    second: c.fcsaccountid,
  }));
  const customerNames: Record<string, string> = Object.fromEntries(
    customers.map((c) => [c.fcsaccountid, c.fcsaccountname ?? c.fcsaccountid]),
  );
  const pairFilter = createFilter<PairOption>({
    stringify: (o) => `${o.label} ${o.data.first ?? ""} ${o.data.second}`,
  });
  // keep the row padding off, so the divider runs the full row height
  const pairClassNames = {
    ...cellSelectProps.classNames,
    // tall enough for the heading + the customers, no scrollbar for a short list
    menuList: () => "!p-0 !max-h-[260px]",
    option: ({
      isFocused,
      isSelected,
    }: {
      isFocused: boolean;
      isSelected: boolean;
    }) => `
      !cursor-pointer !p-0 !text-[12px] !text-[#24364d]
      ${isSelected ? "!bg-[#e7f7ed]" : isFocused ? "!bg-[#f2faf5]" : "!bg-white"}
    `,
  };

  const sum = (field: MoneyField) =>
    rows.reduce((total, row) => total + toNumber(row[field]), 0);

  const vatTotal = rows.reduce((total, row) => total + row.vatAmt, 0);

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
            <th className={`${th} text-left`}>B.Type</th>
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

            const customerValue: PairOption | null = row.customerId
              ? {
                  value: row.customerId,
                  label: row.customerId,
                  second: customerNames[row.customerId] ?? "",
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

                {/* Customer ID: list reads "ID | Name" over ID + Name cells */}
                <td className="border border-[#B7ECD0] p-0">
                  <Select<PairOption, false>
                    inputId={`lkpLineCustomer-${row.key}`}
                    instanceId={`lkpLineCustomer-${row.key}`}
                    aria-label="Customer ID"
                    options={customerIdOptions}
                    value={customerValue}
                    components={{
                      ...selectComponents,
                      MenuList: CustomerIdMenuList,
                    }}
                    onFocus={() => onActivate(row.key)}
                    onChange={(option) =>
                      onCustomerChange(row.key, option?.value ?? null)
                    }
                    filterOption={pairFilter}
                    formatOptionLabel={pairOptionLabel(customerIdColumns)}
                    onMenuOpen={() =>
                      measureList(`lkpLineCustomer-${row.key}`, 1, 2, setIdList)
                    }
                    styles={{
                      menu: (base) => listMenuStyle(base, idList),
                    }}
                    {...cellSelectProps}
                    classNames={pairClassNames}
                  />
                </td>

                {/* Customer Name: list reads "Name | ID" over Name + Division cells */}
                <td className="border border-[#B7ECD0] p-0">
                  <Select<PairOption, false>
                    inputId={`lkpLineCustomerName-${row.key}`}
                    instanceId={`lkpLineCustomerName-${row.key}`}
                    aria-label="Customer Name"
                    options={customerNameOptions}
                    value={
                      row.customerId
                        ? {
                            value: row.customerId,
                            label: customerNames[row.customerId] ?? row.customerId,
                            second: row.customerId,
                          }
                        : null
                    }
                    components={{
                      ...selectComponents,
                      MenuList: CustomerNameMenuList,
                    }}
                    onFocus={() => onActivate(row.key)}
                    onChange={(option) =>
                      onCustomerChange(row.key, option?.value ?? null)
                    }
                    filterOption={pairFilter}
                    formatOptionLabel={pairOptionLabel(customerNameColumns)}
                    onMenuOpen={() =>
                      measureList(
                        `lkpLineCustomerName-${row.key}`,
                        2,
                        3,
                        setNameList,
                      )
                    }
                    styles={{
                      menu: (base) => listMenuStyle(base, nameList),
                    }}
                    {...cellSelectProps}
                    classNames={pairClassNames}
                  />
                </td>

                {/* Division: list reads "ID | Name" over Division + B.Type + Fare cells */}
                <td className="border border-[#B7ECD0] p-0">
                  {(() => {
                    const divisionOptions: PairOption[] = (
                      (row.customerId && divisionsByCustomer[row.customerId]) ||
                      []
                    ).map((d) => ({
                      value: d.fdivid,
                      label: d.fdivid,
                      second: d.fdivname ?? "",
                    }));

                    return (
                      <Select<PairOption, false>
                        inputId={`lkpLineDivision-${row.key}`}
                        instanceId={`lkpLineDivision-${row.key}`}
                        aria-label="Division"
                        options={divisionOptions}
                        value={
                          divisionOptions.find((o) => o.value === row.division) ??
                          null
                        }
                        components={{
                          ...selectComponents,
                          MenuList: DivisionMenuList,
                        }}
                        onFocus={() => onActivate(row.key)}
                        onChange={(option) =>
                          onDivisionChange(row.key, option?.value ?? "")
                        }
                        isDisabled={!row.customerId}
                        filterOption={pairFilter}
                        formatOptionLabel={pairOptionLabel(divisionColumns)}
                        onMenuOpen={() =>
                          measureList(
                            `lkpLineDivision-${row.key}`,
                            3,
                            5, // Division, B.Type and Fare cells
                            setDivisionList,
                          )
                        }
                        styles={{
                          menu: (base) => listMenuStyle(base, divisionList),
                        }}
                        {...cellSelectProps}
                        classNames={pairClassNames}
                      />
                    );
                  })()}
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
                  {isEmptyLine(row) ? "" : formatMoney(row.vatAmt)}
                </td>

                {/* S. Chg. V. and Inv. Amt. */}
                {(["sChgV", "invAmt"] as MoneyField[]).map((field) =>
                  calculated ? (
                    <td key={field} className={`${td} bg-[#eef1f4] text-right`}>
                      {isEmptyLine(row) ? "" : formatMoney(toNumber(row[field]))}
                    </td>
                  ) : (
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
        {/* <ActionButton
          id="btnAttach"
          label="Attach"
          onClick={() => onAction("attach")}
        /> */}
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

/* --------------------------l -------------------------------------------
   4. MAIN PAGE : owns the state and renders the parts in one place
   --------------------------------------------------------------------- */
type TicketLinesPageProps = {
  /** true = render only the section (to place under the Ticket Sales form) */
  embedded?: boolean;
  actionVariant?: "ticket" | "otherService";
  /** called for Fix, search, Delete, Print, Attach, Copy, CNJ, CC, INV, CI */
  onAction?: (name: ActionName) => void;
  /** called by Save with the filled customer lines and the detail fields */
  onSave?: (lines: TicketLinePayload[], detail: TicketDetailPayload) => void;
  /** the fares panel and header of the form: when given, the lines are worked out as the old form did */
  context?: TicketLinesContext;
  onClose?: () => void;
};

const TicketLinesPage: React.FC<TicketLinesPageProps> = ({
  embedded = false,
  actionVariant = "ticket",
  onAction,
  onSave,
  context,
  onClose,
}) => {
  const [rows, setRows] = useState<LineRow[]>(() => padLines([]));

  /* Customers (fcs = C) and, per customer, its divisions. The company is
     the one chosen at login. */
  const PstrCoID = localStorage.getItem("PstrCoID") ?? "";
  const [customers, setCustomers] = useState<CustomerRecord[]>([]);
  const [divisionsByCustomer, setDivisionsByCustomer] = useState<
    Record<string, CustomerDivisionRecord[]>
  >({});

  useEffect(() => {
    let cancelled = false;

    getTicketSalesCustomers(PstrCoID)
      .then((data) => {
        if (!cancelled) setCustomers(data);
      })
      .catch((err: unknown) => console.error("Failed to load customers:", err));

    return () => {
      cancelled = true;
    };
  }, []);

  /* The service charge policies (tblservicechargepolicy) of the customers. */
  const [policies, setPolicies] = useState<ServiceChargePolicyRecord[]>([]);

  useEffect(() => {
    if (!context) return;
    let cancelled = false;

    getTicketSalesServiceChargePolicies(PstrCoID)
      .then((data) => {
        if (!cancelled) setPolicies(data);
      })
      .catch((err: unknown) =>
        console.error("Failed to load the service charge policies:", err),
      );

    return () => {
      cancelled = true;
    };
  }, []);

  /* A line, worked out as the old form did (VAT Amt., S. Chg. V., CD. Amt. split, MF, Inv. Amt.).
     applyPolicy: the S. Chg. of the customer's policy replaces the typed one (a new customer, a changed
     Fare / Tax, or a changed D/I / service type); typing in S. Chg. keeps what was typed. */
  const recalcRow = (row: LineRow, applyPolicy: boolean): LineRow => {
    if (!context) return row;

    let sChg = toNumber(row.sChg);
    let { scType, scPer, mfPer } = row;
    let sChgText = row.sChg;

    if (applyPolicy) {
      const customer = customers.find((c) => c.fcsaccountid === row.customerId);
      const policy = customer?.fisservicechargepolicy
        ? policies.find(
            (p) =>
              p.fcustomerid === row.customerId &&
              p.fservicetypeid === context.serviceId,
          )
        : undefined;
      const charge = calcPolicyCharge(
        policy,
        context.boxDorI,
        toNumber(row.fare),
        toNumber(row.tax),
      );
      scType = charge.type;
      scPer = charge.per;
      mfPer = policy ? toNumber(String(policy.fmf ?? "")) : 0;
      if (charge.amount !== 0) {
        sChg = charge.amount;
        sChgText = charge.amount.toFixed(2);
      }
    }

    const amounts = calcLineAmounts(
      {
        fare: toNumber(row.fare),
        tax: toNumber(row.tax),
        cdAmt: toNumber(row.cdAmt),
        sChg,
        prevVatAmt: row.vatAmt,
        prevSChgV: toNumber(row.sChgV),
        mfPer,
      },
      context,
    );

    return {
      ...row,
      sChg: sChgText,
      sChgV: amounts.sChgV.toFixed(2),
      invAmt: amounts.invAmt.toFixed(2),
      vatAmt: amounts.vatAmt,
      hCharge: amounts.hCharge,
      hScVat: amounts.hScVat,
      mf: amounts.mf,
      mfWoVat: amounts.mfWoVat,
      mfVat: amounts.mfVat,
      mfPer,
      scType,
      scPer,
    };
  };

  const [activeKey, setActiveKey] = useState<number | null>(() => null);
  const [detail, setDetail] = useState<DetailForm>(initialDetail);

  const set: SetDetail = (key, value) =>
    setDetail((prev) => ({ ...prev, [key]: value }));

  /* Buttons that depend on the loaded ticket. Enable them from your own
     rules, for example once a saved ticket is loaded. */
  const enabled = { copy: false, cnj: false, cc: false, inv: false, ci: false };

  /* Profit Amt. is calculated from your pricing rules; 0.00 until then. */
  const filledRows = rows.filter((row) => !isEmptyLine(row));
  const sumRows = (pick: (row: LineRow) => number) =>
    filledRows.reduce((total, row) => total + pick(row), 0);

  const profitAmt = context
    ? calcProfitAmt({
        invTotal: sumRows((row) => toNumber(row.invAmt)),
        vatTotal: sumRows((row) => row.vatAmt),
        feeVat: context.feeVat,
        supplierAmt: context.supplierAmt,
        kbAmt: toNumber(detail.kbAmt),
        mfVatTotal: sumRows((row) => row.mfVat),
        hScVatTotal: sumRows((row) => row.hScVat),
        k7: context.k7,
      })
    : 0;

  const updateRow = (
    key: number,
    patch: Partial<LineRow>,
    applyPolicy = false,
  ) =>
    setRows((prev) =>
      padLines(
        prev.map((row) =>
          row.key === key ? recalcRow({ ...row, ...patch }, applyPolicy) : row,
        ),
      ),
    );

  /* The fares panel: the first line's Fare = S. Fare + Sup. Fee and its Tax = Tax (the old
     SetRowCellValue(0, ...)). Only when one of them changes, and only once the line has a
     customer: the old grid has no row until a customer is chosen, so nothing was filled before. */
  const panelKey = context ? `${context.sFare}|${context.supFee}|${context.tax}` : "";
  const lastPanelKey = useRef(panelKey);

  useEffect(() => {
    if (!context || lastPanelKey.current === panelKey) return;
    lastPanelKey.current = panelKey;

    setRows((prev) =>
      padLines(
        prev.map((row, index) =>
          index === 0 && row.customerId
            ? recalcRow(
                {
                  ...row,
                  fare: (context.sFare + context.supFee).toFixed(2),
                  tax: context.tax.toFixed(2),
                },
                true,
              )
            : row,
        ),
      ),
    );
  }, [panelKey]);

  /* D/I, VAT %, service type, merchant, customers or policies changed: every line again. */
  const settingsKey = context
    ? `${context.dorI}|${context.boxDorI}|${context.vatPer}|${context.serviceId}|${context.merchantIsAirline}`
    : "";

  useEffect(() => {
    if (!context) return;
    setRows((prev) =>
      prev.map((row) =>
        row.customerId || !isEmptyLine(row) ? recalcRow(row, true) : row,
      ),
    );
  }, [settingsKey, customers, policies]);

  /* Fills the division of a row with the customer's first division, when the
     customer has one and the row still has no division. */
  const prefillDivision = (
    key: number,
    customerId: string,
    divisions: CustomerDivisionRecord[],
  ) => {
    const first = divisions[0];
    if (!first) return;

    setRows((prev) =>
      padLines(
        prev.map((row) =>
          row.key === key && row.customerId === customerId && !row.division
            ? { ...row, division: first.fdivid }
            : row,
        ),
      ),
    );
  };

  const handleCustomerChange = (key: number, customerId: string | null) => {
    // a new customer clears the division (it belonged to the old customer) and takes its policy
    // the first line always carries the fares panel (old SetRowCellValue(0, ...)): a customer picked
    // there takes the panel's Fare (S. Fare + Sup. Fee) and Tax when the line has none yet
    const isFirstLine = rows[0]?.key === key;
    const row = rows.find((r) => r.key === key);
    const fromPanel =
      context && customerId && isFirstLine && row && !row.fare && !row.tax
        ? {
            fare: (context.sFare + context.supFee).toFixed(2),
            tax: context.tax.toFixed(2),
          }
        : {};

    updateRow(key, { customerId, division: "", ...fromPanel }, true);

    if (!customerId) return;

    // already loaded for this customer: fill the division straight away
    const loaded = divisionsByCustomer[customerId];
    if (loaded) {
      prefillDivision(key, customerId, loaded);
      return;
    }

    getTicketSalesCustomerDivisions(PstrCoID, customerId)
      .then((data) => {
        setDivisionsByCustomer((prev) => ({ ...prev, [customerId]: data }));
        prefillDivision(key, customerId, data);
      })
      .catch((err: unknown) =>
        console.error("Failed to load divisions:", err),
      );
  };

  const handleAction = (name: ActionName) => {
    switch (name) {
      case "save":
        onSave?.(
          rows
            .filter((row) => !isEmptyLine(row))
            .map((row) => ({
              lkpLineCustomer: row.customerId,
              lkpLineDivision: row.division,
              txtLineBType: row.type,
              txtLineFare: toNumber(row.fare),
              txtLineTax: toNumber(row.tax),
              txtLineCDAmt: toNumber(row.cdAmt),
              txtLineSChg: toNumber(row.sChg),
              txtLineSChgV: toNumber(row.sChgV),
              txtLineInvAmt: toNumber(row.invAmt),
              txtLineVATAmt: row.vatAmt,
              txtLineVATPer: context?.vatPer ?? 0,
              txtLineHCharge: row.hCharge,
              txtLineHSCVATAmt: row.hScVat,
              txtLineMF: row.mf,
              txtLineMFWOVAT: row.mfWoVat,
              txtLineMFVATAmt: row.mfVat,
              txtLineSChgType: row.scType,
              txtLineSChgPer: row.scPer,
            })),
          {
            txtRef1: detail.ref1,
            txtRef2: detail.ref2,
            txtRef3: detail.ref3,
            txtRef4: detail.ref4,
            txtKbAmt: toNumber(detail.kbAmt),
            lkpKbAccount: detail.kbAccount,
            txtInvNote: detail.invNote,
            txtNote: detail.note,
          },
        );
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
        customers={customers}
        divisionsByCustomer={divisionsByCustomer}
        activeKey={activeKey}
        onActivate={setActiveKey}
        onCustomerChange={handleCustomerChange}
        onDivisionChange={(key, division) => updateRow(key, { division })}
        onMoneyChange={(key, field, value) =>
          updateRow(key, { [field]: value }, field === "fare" || field === "tax")
        }
        calculated={context !== undefined}
        onTypeChange={(key, type) => updateRow(key, { type })}
      />
      <TicketLinesFields
        form={detail}
        set={set}
        profitAmt={profitAmt}
        onAction={handleAction}
      />
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