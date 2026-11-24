import React, { useEffect, useState } from "react";
import Select, { components, type MenuListProps } from "react-select";
import dayjs from "dayjs";
import { IoMdClose } from "react-icons/io";
import selectComponents from "../../../components/common/selectComponents";
import {
  Combo,
  fieldSelectProps,
  type Option,
} from "../../../components/common/Combo";
import { GRID_CELL_FOCUS_CLASS } from "../../../hooks/useGridCellFocus";
import { useConfirmModal } from "../../../hooks/useConfirmModal";
import {
  deleteAllBudget,
  deleteBudgetRow,
  getBudgetFillCombos,
  getBudgetRows,
  saveBudgetRow,
  updateBudgetRow,
  type BudgetMutationRow,
  type BudgetRecord,
} from "../../../utils/Api";
import { toast } from "react-toastify";
import BudgetCopyPage from "../../../components/sales/Budget/BudgetCopyPage";

/* =====================================================================
   FILE MAP
   1. Types and constants
   2. Shared building blocks (Combo, NumberCell, ScrollGrid ...)
   3. Parts : BudgetHeader (year, head type, branch), BudgetGrid
              (account lines, months, row totals, column totals),
              BudgetFooter (Copy, Save ... Close, Saved By)
   4. BudgetPage : owns the state and renders the parts

   API usage (no more Apply):
     Save button   -> DeleteBudget (D1), UpdateBudget (M1), SaveBudget (S)
     Row X button  -> DeleteBudget (D1)
     Delete All    -> ApplyD (D)

   Year: options come from the FillCombos "Year" list. The year stored in
   localStorage "PstrYear" is the active one on load.
   ===================================================================== */

/* ---------------------------------------------------------------------
   1. TYPES, CONSTANTS AND SAMPLE DATA
   --------------------------------------------------------------------- */
const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

const MIN_ROWS = 16;
const ACCOUNT_ID_LIST_EXTRA = 44;

type BudgetRow = {
  key: number;
  accountId: string | null;
  months: string[]; // 12 values, "" when empty
  originalSlNo: number | null;
  note: string;
};

type SavedBudgetRow = {
  key: number;
  originalSlNo: number;
  accountId: string;
  months: string[];
  note: string;
};

type PairOption = {
  value: string;
  label: string;
  second: string;
};

type YearOption = { value: string; label: string };

type PairColumns = { first?: string; second?: string };
type ListSize = { width: number; firstCol: number; secondCol: number };

const accountIdColumns: PairColumns = { first: "var(--first-col, 120px)" };
const accountNameColumns: PairColumns = { first: "var(--first-col, 230px)" };

const columnStyle = (width?: string) =>
  width === undefined ? undefined : { width };
const columnClass = (width?: string) =>
  width === undefined ? "min-w-0 flex-1" : "shrink-0";

/** reads the server message from an axios error, falls back to a plain Error message */
const getErrorMessage = (error: unknown, fallback: string): string => {
  const serverMessage = (
    error as { response?: { data?: { message?: unknown } } } | null
  )?.response?.data?.message;
  if (typeof serverMessage === "string" && serverMessage) return serverMessage;
  if (error instanceof Error && error.message) return error.message;
  return fallback;
};

const makePairMenuList = (
  firstHeader: string,
  secondHeader: string,
  columns: PairColumns,
) => {
  const PairMenuList = (props: MenuListProps<PairOption, false>) => (
    <components.MenuList {...props}>
      <div className="sticky top-0 z-10 flex w-full items-stretch border-b border-[#b8c4d0] bg-[#f3f5f7] font-semibold text-[#344054]">
        <span
          style={columnStyle(columns.first)}
          className={`${columnClass(columns.first)} truncate border-r border-[#b8c4d0] px-1.5 py-1 text-[12px]`}
        >
          {firstHeader}
        </span>
        <span
          style={columnStyle(columns.second)}
          className={`${columnClass(columns.second)} truncate px-2 py-1 text-[12px]`}
        >
          {secondHeader}
        </span>
      </div>
      {props.children}
    </components.MenuList>
  );
  return PairMenuList;
};

const AccountIdMenuList = makePairMenuList(
  "Account ID",
  "Account Name",
  accountIdColumns,
);
const AccountNameMenuList = makePairMenuList(
  "Account Name",
  "Account ID",
  accountNameColumns,
);

const pairOptionLabel =
  (columns: PairColumns) =>
  (option: PairOption, { context }: { context: "menu" | "value" }) =>
    context === "menu" ? (
      <div className="flex w-full items-stretch">
        <span
          style={columnStyle(columns.first)}
          className={`${columnClass(columns.first)} truncate border-r border-[#b8c4d0] px-1.5 py-1`}
        >
          {option.label}
        </span>
        <span
          style={columnStyle(columns.second)}
          className={`${columnClass(columns.second)} truncate px-2 py-1`}
        >
          {option.second}
        </span>
      </div>
    ) : (
      option.label
    );

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

const pairClassNames = {
  ...cellSelectProps.classNames,
  // 312px = the old 260px + 20%
  menuList: () => "!p-0 !max-h-[312px] !overflow-x-hidden",
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

let keyCounter = 0;
const nextKey = () => ++keyCounter;

const emptyRow = (): BudgetRow => ({
  key: nextKey(),
  accountId: null,
  months: Array<string>(12).fill(""),
  originalSlNo: null,
  note: "",
});

const isEmptyRow = (row: BudgetRow) =>
  !row.accountId && row.months.every((m) => m === "");

/** keeps one empty row at the end and at least MIN_ROWS rows in total */
const padRows = (rows: BudgetRow[]): BudgetRow[] => {
  const result = [...rows];
  if (result.length === 0 || !isEmptyRow(result[result.length - 1])) {
    result.push(emptyRow());
  }
  while (result.length < MIN_ROWS) result.push(emptyRow());
  return result;
};

const buildRows = (): BudgetRow[] => padRows([]);

const readRecordField = (record: BudgetRecord, field: string): unknown => {
  const key = Object.keys(record).find(
    (candidate) => candidate.toLowerCase() === field.toLowerCase(),
  );
  return key ? record[key] : undefined;
};

const mapBudgetRecord = (
  record: BudgetRecord,
): { row: BudgetRow; savedRow: SavedBudgetRow } => {
  const originalSlNo = Number(readRecordField(record, "fSlNo"));
  const rawAccountId = readRecordField(record, "fGAccountID");
  if (!Number.isInteger(originalSlNo) || originalSlNo < 0 || rawAccountId == null) {
    throw new Error("The budget response contains an invalid account row.");
  }

  const accountId = String(rawAccountId).trim();
  if (!accountId) {
    throw new Error("The budget response contains a row without an account ID.");
  }
  const months = MONTHS.map((_, index) => {
    const rawAmount = readRecordField(record, `fMonthAmt${index + 1}`);
    const amount = Number(rawAmount ?? 0);
    if (!Number.isFinite(amount)) {
      throw new Error("The budget response contains an invalid monthly amount.");
    }
    return String(amount);
  });
  const rawNote = readRecordField(record, "fNote");
  const note = rawNote == null ? "" : String(rawNote);
  const key = nextKey();

  return {
    row: { key, accountId, months, originalSlNo, note },
    savedRow: { key, accountId, months, originalSlNo, note },
  };
};

const toNumber = (value: string) => {
  const parsed = parseFloat(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const rowTotal = (row: BudgetRow) =>
  row.months.reduce((total, m) => total + toNumber(m), 0);

const toBudgetMutationRow = (
  row: BudgetRow,
  fSlNo: number,
): BudgetMutationRow => ({
  fSlNo,
  fGAccountID: row.accountId ?? "",
  fMonthAmt1: toNumber(row.months[0]),
  fMonthAmt2: toNumber(row.months[1]),
  fMonthAmt3: toNumber(row.months[2]),
  fMonthAmt4: toNumber(row.months[3]),
  fMonthAmt5: toNumber(row.months[4]),
  fMonthAmt6: toNumber(row.months[5]),
  fMonthAmt7: toNumber(row.months[6]),
  fMonthAmt8: toNumber(row.months[7]),
  fMonthAmt9: toNumber(row.months[8]),
  fMonthAmt10: toNumber(row.months[9]),
  fMonthAmt11: toNumber(row.months[10]),
  fMonthAmt12: toNumber(row.months[11]),
  fTotAmt: rowTotal(row),
  fNote: row.note,
});

const isValidAmount = (value: string) =>
  value === "" ||
  (/^(?:\d+(?:\.\d{0,2})?|\.\d{1,2})$/.test(value) &&
    Number.isFinite(Number(value)));

const formatAmount = (value: number) =>
  value.toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });

/* ---------------------------------------------------------------------
   2. SHARED BUILDING BLOCKS
   --------------------------------------------------------------------- */
/* slim green scrollbar (Chrome, Edge, Safari) */
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

/** amount cell: raw text while editing, 1,234 style when you leave it */
const NumberCell: React.FC<{
  label: string;
  value: string;
  disabled?: boolean;
  onFocus: () => void;
  onChange: (value: string) => void;
}> = ({ label, value, disabled = false, onFocus, onChange }) => {
  const [focused, setFocused] = useState(false);
  const shown =
    focused || value === "" ? value : formatAmount(toNumber(value));

  return (
    <input
      aria-label={label}
      inputMode="decimal"
      value={shown}
      disabled={disabled}
      onFocus={(event) => {
        setFocused(true);
        onFocus();
        event.target.select();
      }}
      onBlur={() => setFocused(false)}
      onChange={(event) => {
        if (/^\d*\.?\d{0,2}$/.test(event.target.value)) onChange(event.target.value);
      }}
      className="h-6.5 w-full bg-transparent px-2 text-right text-[12px] text-[#24364d] outline-none focus:bg-white focus:ring-1 focus:ring-inset focus:ring-[#91a7b9]"
    />
  );
};

/* ----- ScrollGrid: header fixed, rows scroll with the bar beside them,
        totals fixed under the rows, horizontal bar along the bottom ----- */
type GridColumn<R> = {
  id: string;
  header: string;
  width?: string; // tailwind width class; omit for the one flexible column
  align?: "left" | "right" | "center";
  cellClass?: string; // default "p-0" (editor fills the cell)
  render: (row: R, index: number) => React.ReactNode;
  total?: boolean; // shows a totals box under this column
};

const SCROLLBAR_GUTTER = "w-[10px]"; // same as the 10px bar in niceScrollbar

const alignClass = {
  left: "text-left",
  right: "text-right",
  center: "text-center",
};

const thClass =
  "h-[28px] border border-[#B7ECD0] bg-[#fafbfc] px-2 font-normal text-[#405066]";

const gridTableClass =
  "w-full table-fixed border-collapse text-[12px] text-[#24364d]";

function ScrollGrid<R>({
  columns,
  rows,
  getKey,
  activeKey,
  onActivate,
  totals,
  rowsHeightClass,
  minWidthClass,
}: {
  columns: GridColumn<R>[];
  rows: R[];
  getKey: (row: R) => number;
  activeKey: number | null;
  onActivate: (key: number) => void;
  totals: Record<string, number>;
  rowsHeightClass: string;
  minWidthClass: string;
}) {
  const cols = (gutter: boolean) => (
    <colgroup>
      <col className="w-11" />
      {columns.map((c) => (
        <col key={c.id} className={c.width} />
      ))}
      {gutter && <col className={SCROLLBAR_GUTTER} />}
    </colgroup>
  );

  return (
    /* horizontal scrollbar: at the bottom of the whole grid */
    <div
      className={`overflow-x-auto border border-[#B7ECD0] bg-white ${niceScrollbar}`}
    >
      <div className={minWidthClass}>
        {/* header (fixed) */}
        <table className={gridTableClass}>
          {cols(true)}
          <thead>
            <tr>
              <th className={`${thClass} text-center`}>Line</th>
              {columns.map((c) => (
                <th
                  key={c.id}
                  className={`${thClass} ${alignClass[c.align ?? "left"]}`}
                >
                  {c.header}
                </th>
              ))}
              <th className={`${thClass} p-0`} />
            </tr>
          </thead>
        </table>

        {/* rows (vertical scrollbar sits beside them) */}
        <div
          className={`${rowsHeightClass} overflow-x-hidden overflow-y-scroll bg-white ${niceScrollbar}`}
        >
          <table className={gridTableClass}>
            {cols(false)}
            <tbody>
              {rows.map((row, index) => {
                const key = getKey(row);
                const active = key === activeKey;
                return (
                  <tr
                    key={key}
                    onClick={() => onActivate(key)}
                    className="bg-white"
                  >
                    <td
                      className={`h-6.5 border border-[#B7ECD0] bg-[#fafbfc] px-1 text-center text-[12px] text-[#405066] ${
                        active ? "font-semibold text-[#24364d]" : ""
                      }`}
                    >
                      {index + 1}
                    </td>
                    {columns.map((c) => (
                      <td
                        key={c.id}
                        className={`h-6.5 border border-[#B7ECD0] ${c.cellClass ?? "p-0"}`}
                      >
                        {c.render(row, index)}
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* totals (fixed under the rows) */}
        <table className={gridTableClass}>
          {cols(true)}
          <tfoot>
            <tr>
              <td className="border border-[#B7ECD0] bg-[#eef1f4]" />
              {columns.map((c) =>
                c.total ? (
                  <td
                    key={c.id}
                    className="border border-[#B7ECD0] bg-[#eef1f4] p-0.75"
                  >
                    <input
                      id={`txtTotal-${c.id}`}
                      readOnly
                      tabIndex={-1}
                      aria-label={`Total ${c.header}`}
                      value={formatAmount(totals[c.id] ?? 0)}
                      className="h-7.5 w-[105%] -ml-0.5 rounded-[3px] border border-[#cfd7df] bg-white px-2 text-right text-[12px] text-[#24364d] outline-none"
                    />
                  </td>
                ) : (
                  <td
                    key={c.id}
                    className="border border-[#B7ECD0] bg-[#eef1f4]"
                  />
                ),
              )}
              <td className="border border-[#B7ECD0] bg-[#eef1f4] p-0" />
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------------
   3. PARTS
   --------------------------------------------------------------------- */

/* 3a. Header: year, budget head type, branch */
const BudgetHeader: React.FC<{
  year: string;
  yearOptions: YearOption[];
  onYearChange: (value: string) => void;
  headTypeOptions: Option[];
  lkpHeadType: string | null;
  onHeadTypeChange: (value: string | null) => void;
  branchOptions: Option[];
  lkpBranch: string | null;
  onBranchChange: (value: string | null) => void;
  loadingCombos: boolean;
}> = ({
  year,
  yearOptions,
  onYearChange,
  headTypeOptions,
  lkpHeadType,
  onHeadTypeChange,
  branchOptions,
  lkpBranch,
  onBranchChange,
  loadingCombos,
}) => (
  <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2.5">
    <div className="flex items-center gap-2">
      <label
        htmlFor="lkpYear"
        className="shrink-0 text-right text-[12px] text-[#405066]"
      >
        Year :
      </label>
      <div className="w-27.5 min-w-0">
        <Select<YearOption, false>
          inputId="lkpYear"
          instanceId="lkpYear"
          aria-label="Year"
          options={yearOptions}
          components={selectComponents}
          value={yearOptions.find((option) => option.value === year) ?? null}
          onChange={(option) => onYearChange(option?.value ?? "")}
          // isClearable={false}
          // isSearchable={false}
          {...fieldSelectProps}
        />
      </div>
    </div>

    <div className="flex min-w-0 items-center gap-2">
      <label
        htmlFor="lkpBudgetHeadType"
        className="shrink-0 whitespace-nowrap text-right text-[12px] text-[#405066]"
      >
        Budget Head Type :
      </label>
      <div className="w-55 min-w-0">
        <Combo
          id="lkpBudgetHeadType"
          secondColumnExtra={56}
          firstHeader="Name"
          secondHeader="ID"
          options={headTypeOptions}
          value={lkpHeadType}
          onChange={onHeadTypeChange}
          className="w-full min-w-0"
          isSearchable
        />
      </div>
    </div>

    {loadingCombos && (
      <p className="m-0 text-[12px] text-[#667085]">
        Loading budget options...
      </p>
    )}

    <div className="flex min-w-0 items-center gap-2">
      <label
        htmlFor="lkpBranch"
        className="shrink-0 whitespace-nowrap text-right text-[12px] text-[#405066]"
      >
        Branch :
      </label>
      <div className="w-55 min-w-0">
        <Combo
          id="lkpBranch"
          secondColumnExtra={56}
          firstHeader="Name"
          secondHeader="ID"
          options={branchOptions}
          value={lkpBranch}
          onChange={onBranchChange}
          className="w-full min-w-0"
          isSearchable
        />
      </div>
    </div>
  </div>
);

/* 3b. Grid: account id, account name, 12 months, row total, column totals */
const BudgetGrid: React.FC<{
  rows: BudgetRow[];
  accountIdOptions: PairOption[];
  accountNameOptions: PairOption[];
  disabled: boolean;
  activeKey: number | null;
  onActivate: (key: number) => void;
  onAccountChange: (key: number, accountId: string | null) => void;
  onMonthChange: (key: number, month: number, value: string) => void;
  onDeleteRow: (key: number, rowNumber: number) => void;
}> = ({
  rows,
  accountIdOptions,
  accountNameOptions,
  disabled,
  activeKey,
  onActivate,
  onAccountChange,
  onMonthChange,
  onDeleteRow,
}) => {
  const startListSize: ListSize = {
    width: 350,
    firstCol: 120,
    secondCol: 230,
  };
  const [idList, setIdList] = useState<ListSize>(startListSize);
  const [nameList, setNameList] = useState<ListSize>({
    width: 308,
    firstCol: 230,
    secondCol: 78,
  });
  const accountNames = Object.fromEntries(
    accountNameOptions.map((option) => [option.value, option.label]),
  );
  const accountIds = Object.fromEntries(
    accountIdOptions.map((option) => [option.value, option.label]),
  );

  const measureList = (
    inputId: string,
    from: number,
    to: number,
    save: (size: ListSize) => void,
  ) => {
    const cells = document
      .getElementById(inputId)
      ?.closest("tr")
      ?.querySelectorAll("td");
    if (!cells || !cells[from] || !cells[to]) return;

    const widthOf = (index: number) => cells[index].getBoundingClientRect().width;
    let total = 0;
    for (let index = from; index <= to; index += 1) total += widthOf(index);
    save({
      width: total,
      firstCol: widthOf(from),
      secondCol: widthOf(to),
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

  const columns: GridColumn<BudgetRow>[] = [
    {
      id: "accountId",
      header: "Account ID",
      width: "w-[120px]",
      cellClass: `p-0 ${GRID_CELL_FOCUS_CLASS}`,
      render: (row) => {
        // an account already used in another line is not offered again
        const options = accountIdOptions
          .filter(
            (option) =>
              option.value === row.accountId ||
              !rows.some(
                (other) =>
                  other.key !== row.key && other.accountId === option.value,
              ),
          )
          .map((option) => ({
            ...option,
            second: accountNames[option.value] || option.second,
          }));
        const value: PairOption | null = row.accountId
          ? {
              value: row.accountId,
              label: row.accountId,
              second: accountNames[row.accountId] ?? "",
            }
          : null;
        return (
          <Select<PairOption, false>
            inputId={`lkpAccountID-${row.key}`}
            instanceId={`lkpAccountID-${row.key}`}
            aria-label="Account ID"
            options={options}
            value={value}
            isDisabled={disabled}
            components={{
              ...selectComponents,
              MenuList: AccountIdMenuList,
            }}
            onFocus={() => onActivate(row.key)}
            onChange={(option) =>
              onAccountChange(row.key, option?.value ?? null)
            }
            formatOptionLabel={pairOptionLabel(accountIdColumns)}
            onMenuOpen={() =>
              measureList(`lkpAccountID-${row.key}`, 1, 2, setIdList)
            }
            styles={{
              menu: (base) => listMenuStyle(base, idList),
            }}
            {...cellSelectProps}
            classNames={pairClassNames}
          />
        );
      },
    },
    {
      id: "accountName",
      header: "Account Name",
      width: "w-[230px]",
      cellClass: `p-0 ${GRID_CELL_FOCUS_CLASS}`,
      render: (row) => {
        const options = accountNameOptions
          .filter(
            (option) =>
              option.value === row.accountId ||
              !rows.some(
                (other) =>
                  other.key !== row.key && other.accountId === option.value,
              ),
          )
          .map((option) => ({
            ...option,
            second: accountIds[option.value] || option.second,
          }));
        const value: PairOption | null = row.accountId
          ? {
              value: row.accountId,
              label: accountNames[row.accountId] ?? row.accountId,
              second: row.accountId,
            }
          : null;
        return (
          <Select<PairOption, false>
            inputId={`lkpAccountName-${row.key}`}
            instanceId={`lkpAccountName-${row.key}`}
            aria-label="Account Name"
            options={options}
            value={value}
            isDisabled={disabled}
            components={{
              ...selectComponents,
              MenuList: AccountNameMenuList,
            }}
            onFocus={() => onActivate(row.key)}
            onChange={(option) =>
              onAccountChange(row.key, option?.value ?? null)
            }
            formatOptionLabel={pairOptionLabel(accountNameColumns)}
            onMenuOpen={() =>
              measureList(`lkpAccountName-${row.key}`, 2, 3, setNameList)
            }
            styles={{
              menu: (base) =>
                listMenuStyle(base, {
                  ...nameList,
                  width: nameList.width + ACCOUNT_ID_LIST_EXTRA,
                }),
            }}
            {...cellSelectProps}
            classNames={pairClassNames}
          />
        );
      },
    },
    ...MONTHS.map(
      (month, index): GridColumn<BudgetRow> => ({
        id: `m${index}`,
        header: month,
        width: "w-[68px]",
        align: "right",
        total: true,
        render: (row) => (
          <NumberCell
            label={`${month} amount`}
            value={row.months[index]}
            disabled={disabled}
            onFocus={() => onActivate(row.key)}
            onChange={(value) => onMonthChange(row.key, index, value)}
          />
        ),
      }),
    ),
    {
      id: "total",
      header: "Total",
      width: "w-[80px]",
      align: "right",
      total: true,
      cellClass: "bg-[#eef1f4] px-2 text-right",
      render: (row) => (isEmptyRow(row) ? "" : formatAmount(rowTotal(row))),
    },
    {
      id: "delete",
      header: " ",
      width: "w-[46px]",
      align: "center",
      cellClass: "p-0 text-center",
      render: (row, index) => (
        <button
          type="button"
          aria-label={`Delete row ${index + 1}`}
          title={`Delete row ${index + 1}`}
          disabled={disabled}
          onClick={(event) => {
            event.stopPropagation();
            onDeleteRow(row.key, index + 1);
          }}
          className="inline-flex h-6.25 w-full items-center justify-center hover:text-[#c0392b] hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <IoMdClose size={17} />
        </button>
      ),
    },
  ];

  const totals: Record<string, number> = {};
  MONTHS.forEach((_, index) => {
    totals[`m${index}`] = rows.reduce(
      (total, row) => total + toNumber(row.months[index]),
      0,
    );
  });
  totals.total = rows.reduce((total, row) => total + rowTotal(row), 0);

  return (
    <ScrollGrid
      columns={columns}
      rows={rows}
      getKey={(row) => row.key}
      activeKey={activeKey}
      onActivate={onActivate}
      totals={totals}
      rowsHeightClass="max-h-[min(440px,calc(100vh-300px))]"
      minWidthClass="min-w-[1460px]"
    />
  );
};

/* 3c. Footer: Copy on the left, the main buttons in the middle,
       "Saved By" on the right */
const BudgetFooter: React.FC<{
  savedBy: string;
  busy: boolean;
  saving: boolean;
  onCopy: () => void;
  onSave: () => void;
  onDelete: () => void;
  onPrint: () => void;
  onClear: () => void;
  onClose: () => void;
}> = ({
  savedBy,
  busy,
  saving,
  onCopy,
  onSave,
  onDelete,
  onPrint,
  onClear,
}) => (
  <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
    <button
      id="btnCopy"
      type="button"
      onClick={onCopy}
      disabled={busy}
      className="btn-style disabled:cursor-not-allowed disabled:opacity-50"
    >
      Copy
    </button>

    <div className="flex flex-wrap justify-center gap-2">
      <button
        id="btnSave"
        type="button"
        onClick={onSave}
        disabled={busy}
        className="btn-style disabled:cursor-not-allowed disabled:opacity-50"
      >
        {saving ? "Saving..." : <><u>S</u>ave</>}
      </button>
      <button
        id="btnDelete"
        type="button"
        onClick={onDelete}
        disabled={busy}
        className="btn-style disabled:cursor-not-allowed disabled:opacity-50"
      >
        <u>D</u>elete
      </button>
      <button
        id="btnPrint"
        type="button"
        onClick={onPrint}
        className="btn-style"
      >
        <u>P</u>rint
      </button>
      <button
        id="btnClear"
        type="button"
        onClick={onClear}
        disabled={saving}
        className="btn-style disabled:cursor-not-allowed disabled:opacity-50"
      >
        <u>C</u>lear
      </button>
    </div>

    <span className="min-w-50 text-right text-[12px] text-[#7a8794]">
      {savedBy ? `Saved By : ${savedBy}` : ""}
    </span>
  </div>
);

/* ---------------------------------------------------------------------
   4. MAIN PAGE : owns the state and renders the parts
   --------------------------------------------------------------------- */
type BudgetPageProps = {
  /** user id written into "Saved By" after a save */
  currentUser?: string;
  onCopy?: () => void;
  onPrint?: () => void;
  onClose?: () => void;
};

const BudgetPage: React.FC<BudgetPageProps> = ({
  currentUser = "ADMIN",
  onCopy,
  onPrint,
  onClose,
}) => {
  const PstrCoID = localStorage.getItem("PstrCoID")?.trim() ?? "";
  const storedYear = localStorage.getItem("PstrYear")?.trim() ?? "";
  const [lkpYear, setYear] = useState(storedYear); // lkpYear
  const [yearOptions, setYearOptions] = useState<YearOption[]>([]);
  const [defaultYear, setDefaultYear] = useState(storedYear);
  const [lkpHeadType, setlkpHeadType] = useState<string | null>(null);
  const [lkpBranch, setlkpBranch] = useState<string | null>(null);
  const [headTypeOptions, setHeadTypeOptions] = useState<Option[]>([]);
  const [branchOptions, setBranchOptions] = useState<Option[]>([]);
  const [accountIdOptions, setAccountIdOptions] = useState<PairOption[]>([]);
  const [accountNameOptions, setAccountNameOptions] = useState<PairOption[]>([]);
  const [defaultBranch, setDefaultBranch] = useState<string | null>(null);
  const [loadingCombos, setLoadingCombos] = useState(true);
  const [loadingBudget, setLoadingBudget] = useState(false);
  const [saving, setSaving] = useState(false);
  const [refreshVersion, setRefreshVersion] = useState(0);
  const [copyDialogOpen, setCopyDialogOpen] = useState(false);

  const [rows, setRows] = useState<BudgetRow[]>(() => buildRows());
  const [savedRows, setSavedRows] = useState<SavedBudgetRow[]>([]);
  const [activeKey, setActiveKey] = useState<number | null>(null);
  const [savedBy, setSavedBy] = useState("");
  const [error, setError] = useState("");
  const { confirm, dialog: confirmDialog } = useConfirmModal();

  useEffect(() => {
    let cancelled = false;
    const loadCombos = async () => {
      if (!PstrCoID) {
        setError("Company ID (PstrCoID) was not found in localStorage.");
        setLoadingCombos(false);
        return;
      }

      try {
        const data = await getBudgetFillCombos(PstrCoID);
        if (!data.success) {
          throw new Error(data.message ?? "Failed to load budget options.");
        }
        if (cancelled) return;

        const nextHeadTypeOptions = data.Types.map((type) => ({
          value: type.fpid,
          label: type.fpname ?? type.fpid,
          secondLabel: type.fpid,
        }));
        const nextBranchOptions = data.Branches.map((item) => ({
          value: item.fbrid,
          label: item.fbrname ?? item.fbrid,
          secondLabel: item.fbrid,
        }));

        setHeadTypeOptions(nextHeadTypeOptions);
        setBranchOptions(nextBranchOptions);
        setAccountIdOptions(
          data.AccountsByID.map((account) => ({
            value: account.faccountid,
            label: account.faccountid,
            second: account.faccountname ?? "",
          })),
        );
        setAccountNameOptions(
          data.AccountsByName.map((account) => ({
            value: account.faccountid,
            label: account.faccountname ?? account.faccountid,
            second: account.faccountid,
          })),
        );

        // years come from the API; the year saved in localStorage is the
        // active one, otherwise the latest year from the API
        const nextYearOptions: YearOption[] = (data.Year ?? [])
          .map((item: { fyear: any; }) => String(item.fyear))
          .sort()
          .map((value) => ({ value, label: value }));
        const activeYear =
          nextYearOptions.find((option) => option.value === storedYear)
            ?.value ??
          nextYearOptions[nextYearOptions.length - 1]?.value ??
          "";
        setYearOptions(nextYearOptions);
        setDefaultYear(activeYear);
        setYear(activeYear);

        const defaultBranch =
          nextBranchOptions.find((option) => option.value === data.DefaultBrID)
            ?.value ??
          nextBranchOptions[0]?.value ??
          null;
        setlkpHeadType(nextHeadTypeOptions[0]?.value ?? null);
        setlkpBranch(defaultBranch);
        setDefaultBranch(defaultBranch);
      } catch (loadError) {
        if (!cancelled) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Failed to load budget options.",
          );
        }
      } finally {
        if (!cancelled) setLoadingCombos(false);
      }
    };

    void loadCombos();
    return () => {
      cancelled = true;
    };
  }, [PstrCoID, storedYear]);

  useEffect(() => {
    let cancelled = false;
    if (!PstrCoID || lkpYear.length !== 4 || !lkpBranch || !lkpHeadType) {
      setRows(buildRows());
      setSavedRows([]);
      setLoadingBudget(false);
      return;
    }

    const loadBudget = async () => {
      setLoadingBudget(true);
      setRows(buildRows());
      setSavedRows([]);
      setActiveKey(null);
      setError("");
      try {
        const data = await getBudgetRows(
          PstrCoID,
          Number(lkpYear),
          lkpBranch,
          lkpHeadType,
        );
        if (!Array.isArray(data)) {
          throw new Error("The budget response is not a list of account rows.");
        }

        const mappedRows = data.map(mapBudgetRecord);
        if (cancelled) return;
        const loaded = mappedRows.map((item) => item.row);
        setRows(padRows(loaded));
        setSavedRows(mappedRows.map((item) => item.savedRow));
        setActiveKey(loaded[0]?.key ?? null);
      } catch (loadError) {
        if (!cancelled) {
          setRows(buildRows());
          setSavedRows([]);
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Failed to load budget rows.",
          );
        }
      } finally {
        if (!cancelled) setLoadingBudget(false);
      }
    };

    void loadBudget();
    return () => {
      cancelled = true;
    };
  }, [PstrCoID, lkpYear, lkpBranch, lkpHeadType, refreshVersion]);

  const reload = () => {
    setSavedBy("");
    setError("");
    setRefreshVersion((version) => version + 1);
  };

  const handleHeadTypeChange = (value: string | null) => {
    setlkpHeadType(value);
    setSavedBy("");
  };

  const updateRow = (key: number, patch: (row: BudgetRow) => BudgetRow) =>
    setRows((prev) =>
      padRows(prev.map((row) => (row.key === key ? patch(row) : row))),
    );

  /* Save button: D1 (deletes) -> M1 (updates) -> S (inserts), one request per row */
  const handleSave = async () => {
    if (saving || loadingBudget || loadingCombos) return;
    if (lkpYear.length !== 4 || !lkpHeadType || !lkpBranch) {
      setError("Select the year, budget head type and branch.");
      return;
    }
    const lines = rows.filter((row) => !isEmptyRow(row));
    if (lines.length === 0 && savedRows.length === 0) {
      setError("Add at least one account line.");
      return;
    }
    if (lines.some((row) => !row.accountId)) {
      setError("Every line needs an account.");
      return;
    }
    if (lines.some((row) => row.months.some((amount) => !isValidAmount(amount)))) {
      setError("Monthly amounts must be valid numbers with at most two decimal places.");
      return;
    }

    const savedByKey = new Map(savedRows.map((row) => [row.key, row]));
    const currentSavedSlNos = new Set<number>();
    let nextSlNo = savedRows.reduce(
      (max, row) => Math.max(max, row.originalSlNo),
      0,
    );
    const Inserted: BudgetMutationRow[] = [];
    const Updated: { OriginalSlNo: number; row: BudgetMutationRow }[] = [];

    for (const row of lines) {
      if (row.originalSlNo === null) {
        nextSlNo += 1;
        Inserted.push(toBudgetMutationRow(row, nextSlNo));
        continue;
      }

      const original = savedByKey.get(row.key);
      if (!original) {
        setError("Could not match an edited budget row to its saved version.");
        return;
      }
      currentSavedSlNos.add(original.originalSlNo);
      const changed =
        row.accountId !== original.accountId ||
        row.note !== original.note ||
        row.months.some(
          (amount, index) =>
            toNumber(amount) !== toNumber(original.months[index]),
        );
      if (changed) {
        Updated.push({
          OriginalSlNo: original.originalSlNo,
          row: toBudgetMutationRow(row, original.originalSlNo),
        });
      }
    }

    // highest serial number first, in case the procedure renumbers after a delete
    const Deleted = savedRows
      .filter((row) => !currentSavedSlNos.has(row.originalSlNo))
      .map((row) => row.originalSlNo)
      .sort((a, b) => b - a);

    if (Inserted.length === 0 && Updated.length === 0 && Deleted.length === 0) {
      setError("There are no budget changes to save.");
      return;
    }

    setSaving(true);
    setError("");
    const IntYear = Number(lkpYear);
    const key = {
      PstrCoID,
      IntYear,
      StrBrID: lkpBranch,
      StrType: lkpHeadType,
    };

    try {
      for (const slNo of Deleted) {
        const r = await deleteBudgetRow(key, slNo);
        if (!r.success) throw new Error(r.message || "Failed to delete row.");
      }
      for (const u of Updated) {
        const r = await updateBudgetRow(key, u.OriginalSlNo, u.row);
        if (!r.success) throw new Error(r.message || "Failed to update row.");
      }
      for (const row of Inserted) {
        const r = await saveBudgetRow(
          {
            PstrCoID,
            IntYear,
            StrBrID: lkpBranch,
            StrBudgetHeadType: lkpHeadType,
          },
          row,
        );
        if (!r.success) throw new Error(r.message || "Failed to save row.");
      }

      toast.success("Budget saved successfully.");
      setSavedBy(`${currentUser} ${dayjs().format("DD/MM/YYYY HH:mm:ss")}`);
      setRefreshVersion((version) => version + 1);
    } catch (saveError) {
      setError(getErrorMessage(saveError, "Failed to save budget."));
      // the calls are not one transaction: resync with what actually got saved
      setRefreshVersion((version) => version + 1);
    } finally {
      setSaving(false);
    }
  };

  /* Row X button: DeleteBudget (D1) for one saved row */
  const handleDeleteRow = async (rowKey: number, rowNumber: number) => {
    if (saving || loadingBudget || loadingCombos) return;
    const row = rows.find((r) => r.key === rowKey);
    if (!row) return;

    // never saved -> nothing on the server to delete
    if (row.originalSlNo === null) {
      setRows((prev) => padRows(prev.filter((r) => r.key !== rowKey)));
      if (activeKey === rowKey) setActiveKey(null);
      return;
    }
    if (lkpYear.length !== 4 || !lkpHeadType || !lkpBranch) return;

    if (
      !(await confirm({
        message: `Do you want to delete Line ${rowNumber} ?`,
      }))
    ) {
      return;
    }

    setSaving(true);
    setError("");
    try {
      const r = await deleteBudgetRow(
        {
          PstrCoID,
          IntYear: Number(lkpYear),
          StrBrID: lkpBranch,
          StrType: lkpHeadType,
        },
        row.originalSlNo,
      );
      if (!r.success) throw new Error(r.message || "Failed to delete row.");
      toast.success("Row deleted successfully.");
      if (activeKey === rowKey) setActiveKey(null);
      setRefreshVersion((version) => version + 1);
    } catch (deleteError) {
      setError(getErrorMessage(deleteError, "Failed to delete row."));
    } finally {
      setSaving(false);
    }
  };

  /* Delete button: ApplyD (D) removes every row for year / branch / type */
  const handleDeleteAll = async () => {
    if (saving || loadingBudget || loadingCombos) return;
    if (lkpYear.length !== 4 || !lkpHeadType || !lkpBranch) return;
    if (
      !(await confirm({
        message: "Do you want to delete Budget Entries?",
      }))
    ) {
      return;
    }

    setSaving(true);
    setError("");
    try {
      const r = await deleteAllBudget({
        PstrCoID,
        IntYear: Number(lkpYear),
        StrBrID: lkpBranch,
        StrType: lkpHeadType,
      });
      if (!r.success) throw new Error(r.message || "Failed to delete budget.");
      toast.success("Budget deleted successfully.");
      setActiveKey(null);
      setRefreshVersion((version) => version + 1);
    } catch (deleteError) {
      setError(getErrorMessage(deleteError, "Failed to delete budget."));
    } finally {
      setSaving(false);
    }
  };

  const handlePrint = () => {
    console.log("print budget", { lkpYear, lkpHeadType, lkpBranch });
    onPrint?.();
  };

  const handleCopy = () => {
    console.log("copy budget", { lkpYear, lkpHeadType, lkpBranch });
    setCopyDialogOpen(true);
    onCopy?.();
  };

  // Clear throws away the changes and reloads the saved budget
  const handleClear = () => reload();

  const handleClose = () => {
    setYear(defaultYear);
    setlkpHeadType(headTypeOptions[0]?.value ?? null);
    setlkpBranch(defaultBranch);
    reload();
    onClose?.();
  };

  return (
    <div className="flex min-h-screen w-full items-start justify-center bg-white px-4 py-4">
      <div className="min-h-fit w-full max-w-374 bg-white p-0">
        <main className="w-full overflow-hidden border border-gray-400 bg-white">
          <header className="flex h-7.5 items-center justify-start bg-[#9fdfbc]">
            <h1 className="m-0 ml-3.5 text-[17px] font-semibold text-[#24364d]">
              Budget
            </h1>
          </header>

          <section className="flex flex-col gap-3 px-3.5 pb-6 pt-3">
            <BudgetHeader
              year={lkpYear}
              yearOptions={yearOptions}
              onYearChange={(value) => {
                setYear(value);
                setError("");
                setSavedBy("");
              }}
              headTypeOptions={headTypeOptions}
              lkpHeadType={lkpHeadType}
              onHeadTypeChange={handleHeadTypeChange}
              branchOptions={branchOptions}
              lkpBranch={lkpBranch}
              onBranchChange={(value) => {
                setlkpBranch(value);
                setSavedBy("");
              }}
              loadingCombos={loadingCombos}
            />

            {loadingBudget && (
              <p className="m-0 text-[12px] text-[#667085]">
                Loading budget...
              </p>
            )}

            <BudgetGrid
              rows={rows}
              accountIdOptions={accountIdOptions}
              accountNameOptions={accountNameOptions}
              disabled={saving || loadingBudget || loadingCombos}
              activeKey={activeKey}
              onActivate={setActiveKey}
              onAccountChange={(key, accountId) => {
                setError("");
                updateRow(key, (row) => ({ ...row, accountId }));
              }}
              onMonthChange={(key, month, value) => {
                setError("");
                updateRow(key, (row) => ({
                  ...row,
                  months: row.months.map((m, i) => (i === month ? value : m)),
                }));
              }}
              onDeleteRow={handleDeleteRow}
            />

            {error && (
              <p role="alert" className="m-0 text-[12px] text-[#c0392b]">
                {error}
              </p>
            )}

            <BudgetFooter
              savedBy={savedBy}
              busy={saving || loadingBudget || loadingCombos}
              saving={saving}
              onCopy={handleCopy}
              onSave={() => void handleSave()}
              onDelete={handleDeleteAll}
              onPrint={handlePrint}
              onClear={handleClear}
              onClose={handleClose}
            />
          </section>
        </main>
      </div>
      {confirmDialog}
      {copyDialogOpen && (
        <BudgetCopyPage
          sourceCompanyId={PstrCoID}
          sourceYear={lkpYear}
          sourceBranch={lkpBranch}
          sourceHeadType={lkpHeadType}
          userId={localStorage.getItem("PstrUserID")}
          yearOptions={yearOptions}
          branchOptions={branchOptions}
          headTypeOptions={headTypeOptions}
          onClose={() => setCopyDialogOpen(false)}
        />
      )}
    </div>
  );
};

export default BudgetPage;