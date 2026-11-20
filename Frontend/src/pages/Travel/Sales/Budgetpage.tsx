import React, { useEffect, useState } from "react";
import Select, { components, type MenuListProps } from "react-select";
import dayjs from "dayjs";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import selectComponents from "../../../components/common/selectComponents";
import { fieldSelectProps, type Option } from "../../../components/common/Combo";
import { GRID_CELL_FOCUS_CLASS } from "../../../hooks/useGridCellFocus";
import { getBudgetFillCombos } from "../../../utils/Api";

/* =====================================================================
   FILE MAP
   1. Types and constants
   2. Shared building blocks (Combo, NumberCell, ScrollGrid ...)
   3. Parts : BudgetHeader (year, head type, branch), BudgetGrid
              (account lines, months, row totals, column totals),
              BudgetFooter (Copy, Save ... Close, Saved By)
   4. BudgetPage : owns the state and renders the parts
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

const MIN_ROWS = 14;
const ACCOUNT_ID_LIST_EXTRA = 44;

type BudgetRow = {
  key: number;
  accountId: string | null;
  months: string[]; // 12 values, "" when empty
};

type PairOption = {
  value: string;
  label: string;
  second: string;
};

type PairColumns = { first?: string; second?: string };
type ListSize = { width: number; firstCol: number; secondCol: number };

const accountIdColumns: PairColumns = { first: "var(--first-col, 120px)" };
const accountNameColumns: PairColumns = { first: "var(--first-col, 230px)" };

const columnStyle = (width?: string) =>
  width === undefined ? undefined : { width };
const columnClass = (width?: string) =>
  width === undefined ? "min-w-0 flex-1" : "shrink-0";

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
          className={`${columnClass(columns.first)} truncate border-r border-[#b8c4d0] px-[6px] py-[4px]`}
        >
          {option.label}
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
  menuList: () => "!p-0 !max-h-[260px] !overflow-x-hidden",
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

const toNumber = (value: string) => {
  const parsed = parseFloat(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const formatAmount = (value: number) =>
  value.toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });

const rowTotal = (row: BudgetRow) =>
  row.months.reduce((total, m) => total + toNumber(m), 0);

/* ---------------------------------------------------------------------
   2. SHARED BUILDING BLOCKS
   --------------------------------------------------------------------- */
const selectClassNames = {
  control: ({
    isFocused,
    isDisabled,
  }: {
    isFocused: boolean;
    isDisabled: boolean;
  }) => `
    !min-h-[25px] !h-[30px] !rounded-[4px] !border !shadow-none !text-[13px]
    hover:!border-[#aab8c5]
    ${isDisabled ? "!bg-[#f6f8fa]" : "!bg-white"}
    ${isFocused ? "!border-[#91a7b9]" : "!border-[#cfd7df]"}
  `,
  valueContainer: () => "!h-[23px] !py-0 !px-[5px] !overflow-hidden",
  singleValue: () => "!m-0 !text-[13px] !text-[#24364d]",
  placeholder: () => "!m-0 !text-[13px] !text-[#7a8794]",
  input: () => "!m-0 !p-0 !text-[13px] !text-[#24364d]",
  indicatorsContainer: () => "!h-[23px]",
  dropdownIndicator: () => "!p-[3px] !text-[#657486]",
  indicatorSeparator: () => "!hidden",
  clearIndicator: () => "!p-[3px]",
  menu: () =>
    "!mt-[1px] !rounded-none !border !border-[#cfd7df] !z-[999999] !shadow-md ",
  menuList: () => "!p-0 !max-h-[180px]",
  option: ({
    isFocused,
    isSelected,
  }: {
    isFocused: boolean;
    isSelected: boolean;
  }) => `
    !cursor-pointer !px-[6px] !py-[5px] !text-[13px] !text-[#24364d]
    ${isSelected ? "!bg-[#e7f7ed]" : isFocused ? "!bg-[#f2faf5]" : "!bg-white"}
  `,
};

const selectProps = {
  isSearchable: false,
  isClearable: false,
  placeholder: "",
  classNames: selectClassNames,
  menuPosition: "fixed" as const,
  menuPortalTarget: typeof document !== "undefined" ? document.body : undefined,
};

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

/** label + control on one line */
const LabeledCombo: React.FC<{
  id: string;
  label: string;
  options: Option[];
  value: string | null;
  onChange: (value: string | null) => void;
  className?: string;
}> = ({ id, label, options, value, onChange, className = "" }) => (
  <div className="flex min-w-0 items-center gap-2">
    <label
      htmlFor={id}
      className="shrink-0 whitespace-nowrap text-right text-[12px] text-[#405066]"
    >
      {label}
    </label>
    <div className={`min-w-0 ${className}`}>
      <Select
        inputId={id}
        instanceId={id}
        components={selectComponents}
        options={options}
        value={options.find((o) => o.value === value) ?? null}
        onChange={(option) => onChange(option?.value ?? null)}
        {...selectProps}
      />
    </div>
  </div>
);

/** amount cell: raw text while editing, 1,234 style when you leave it */
const NumberCell: React.FC<{
  label: string;
  value: string;
  onFocus: () => void;
  onChange: (value: string) => void;
}> = ({ label, value, onFocus, onChange }) => {
  const [focused, setFocused] = useState(false);
  const shown =
    focused || value === "" ? value : formatAmount(toNumber(value));

  return (
    <input
      aria-label={label}
      inputMode="decimal"
      value={shown}
      onFocus={(event) => {
        setFocused(true);
        onFocus();
        event.target.select();
      }}
      onBlur={() => setFocused(false)}
      onChange={(event) => {
        if (/^\d*\.?\d{0,2}$/.test(event.target.value)) onChange(event.target.value);
      }}
      className="h-[26px] w-full bg-transparent px-2 text-right text-[12px] text-[#24364d] outline-none focus:bg-white focus:ring-1 focus:ring-inset focus:ring-[#91a7b9]"
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
      <col className="w-[20px]" />
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
              <th className={thClass} />
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
                    <td className="h-[26px] border border-[#B7ECD0] bg-[#fafbfc] text-center text-[8px] text-[#405066]">
                      {active ? "▶" : ""}
                    </td>
                    {columns.map((c) => (
                      <td
                        key={c.id}
                        className={`h-[26px] border border-[#B7ECD0] ${c.cellClass ?? "p-0"}`}
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
                    className="border border-[#B7ECD0] bg-[#eef1f4] p-[3px]"
                  >
                    <input
                      id={`txtTotal-${c.id}`}
                      readOnly
                      tabIndex={-1}
                      aria-label={`Total ${c.header}`}
                      value={formatAmount(totals[c.id] ?? 0)}
                      className="h-[30px] w-[105%] -ml-0.5 rounded-[3px] border border-[#cfd7df] bg-white px-2 text-right text-[12px] text-[#24364d] outline-none"
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
  onYearChange: (value: string) => void;
  headTypeOptions: Option[];
  headType: string | null;
  onHeadTypeChange: (value: string | null) => void;
  branchOptions: Option[];
  branch: string | null;
  onBranchChange: (value: string | null) => void;
  loadingCombos: boolean;
}> = ({
  year,
  onYearChange,
  headTypeOptions,
  headType,
  onHeadTypeChange,
  branchOptions,
  branch,
  onBranchChange,
  loadingCombos,
}) => (
  <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2.5">
    
<div className="flex items-center gap-2">
  <label
    htmlFor="txtYear"
    className="shrink-0 text-right text-[12px] text-[#405066]"
  >
    Year :
  </label>

  <LocalizationProvider dateAdapter={AdapterDayjs}>
    <DatePicker
      views={["year"]}
      openTo="year"
      format="YYYY"
      value={year ? dayjs(`${year}-01-01`) : null}
      onChange={(value) =>
        onYearChange(value?.isValid() ? value.format("YYYY") : "")
      }
      slotProps={{
        textField: {
          id: "txtYear",
          size: "small",
          sx: {
            width: "82px",

            "& .MuiPickersInputBase-root": {
              height: "30px !important",
              minHeight: "30px !important",
              fontSize: "12px",
            },

            "& .MuiPickersOutlinedInput-root": {
              height: "30px !important",
              minHeight: "30px !important",
            },

            "& .MuiPickersInputBase-sectionsContainer": {
              padding: "0 4px",
            },

            "& .MuiPickersSectionList-root": {
              padding: "0 !important",
              fontSize: "12px",
            },

            "& .MuiInputBase-input": {
              padding: "3px 4px !important",
              fontSize: "12px",
            },

            "& .MuiInputAdornment-root": {
              marginLeft: "0px",
            },

            "& .MuiIconButton-root": {
              width: "20px",
              height: "20px",
              padding: "2px",
            },

            "& .MuiSvgIcon-root": {
              fontSize: "15px",
            },
          },
        },
      }}
    />
  </LocalizationProvider>
</div>


    <LabeledCombo
      id="lkpBudgetHeadType"
      label="Budget Head Type :"
      options={headTypeOptions}
      value={headType}
      onChange={onHeadTypeChange}
      className="w-[220px]"
    />

    {loadingCombos && (
      <p className="m-0 text-[12px] text-[#667085]">
        Loading budget options...
      </p>
    )}

    <LabeledCombo
      id="lkpBranch"
      label="Branch :"
      options={branchOptions}
      value={branch}
      onChange={onBranchChange}
      className="w-[220px]"
    />
  </div>
);

/* 3b. Grid: account id, account name, 12 months, row total, column totals */
const BudgetGrid: React.FC<{
  rows: BudgetRow[];
  accountIdOptions: PairOption[];
  accountNameOptions: PairOption[];
  activeKey: number | null;
  onActivate: (key: number) => void;
  onAccountChange: (key: number, accountId: string | null) => void;
  onMonthChange: (key: number, month: number, value: string) => void;
}> = ({
  rows,
  accountIdOptions,
  accountNameOptions,
  activeKey,
  onActivate,
  onAccountChange,
  onMonthChange,
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
        width: "w-[78px]",
        align: "right",
        total: true,
        render: (row) => (
          <NumberCell
            label={`${month} amount`}
            value={row.months[index]}
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
      minWidthClass="min-w-[1400px]"
    />
  );
};

/* 3c. Footer: Copy on the left, the main buttons in the middle,
       "Saved By" on the right */
const BudgetFooter: React.FC<{
  savedBy: string;
  onCopy: () => void;
  onSave: () => void;
  onDelete: () => void;
  onPrint: () => void;
  onCancel: () => void;
  onClose: () => void;
}> = ({ savedBy, onCopy, onSave, onDelete, onPrint, onCancel, onClose }) => (
  <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
    <button id="btnCopy" type="button" onClick={onCopy} className="btn-style">
      Copy
    </button>

    <div className="flex flex-wrap justify-center gap-2">
      <button id="btnSave" type="button" onClick={onSave} className="btn-style">
        <u>S</u>ave
      </button>
      <button
        id="btnDelete"
        type="button"
        onClick={onDelete}
        className="btn-style"
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
        id="btnCancel"
        type="button"
        onClick={onCancel}
        className="btn-style"
      >
        <u>C</u>ancel
      </button>
      <button
        id="btnClose"
        type="button"
        onClick={onClose}
        className="btn-style"
      >
        Cl<u>o</u>se
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
  const [year, setYear] = useState(String(new Date().getFullYear())); // txtYear
  const [headType, setHeadType] = useState<string | null>(null); // lkpBudgetHeadType
  const [branch, setBranch] = useState<string | null>(null); // lkpBranch
  const [headTypeOptions, setHeadTypeOptions] = useState<Option[]>([]);
  const [branchOptions, setBranchOptions] = useState<Option[]>([]);
  const [accountIdOptions, setAccountIdOptions] = useState<PairOption[]>([]);
  const [accountNameOptions, setAccountNameOptions] = useState<PairOption[]>([]);
  const [defaultBranch, setDefaultBranch] = useState<string | null>(null);
  const [loadingCombos, setLoadingCombos] = useState(true);

  const [rows, setRows] = useState<BudgetRow[]>(() => buildRows());
  const [activeKey, setActiveKey] = useState<number | null>(null);
  const [savedBy, setSavedBy] = useState("");
  const [error, setError] = useState("");

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
        }));
        const nextBranchOptions = data.Branches.map((item) => ({
          value: item.fbrid,
          label: item.fbrname ?? item.fbrid,
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

        const defaultBranch =
          nextBranchOptions.find((option) => option.value === data.DefaultBrID)
            ?.value ??
          nextBranchOptions[0]?.value ??
          null;
        setHeadType(nextHeadTypeOptions[0]?.value ?? null);
        setBranch(defaultBranch);
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
  }, [PstrCoID]);

  const reload = () => {
    const fresh = buildRows();
    setRows(fresh);
    setActiveKey(fresh[0]?.key ?? null);
    setSavedBy("");
    setError("");
  };

  const handleHeadTypeChange = (value: string | null) => {
    setHeadType(value);
    reload();
  };

  const updateRow = (key: number, patch: (row: BudgetRow) => BudgetRow) =>
    setRows((prev) =>
      padRows(prev.map((row) => (row.key === key ? patch(row) : row))),
    );

  const handleSave = () => {
    if (year.length !== 4 || !headType || !branch) {
      setError("Enter the year and select the budget head type and branch.");
      return;
    }
    const lines = rows.filter((row) => !isEmptyRow(row));
    if (lines.length === 0) {
      setError("Add at least one account line.");
      return;
    }
    if (lines.some((row) => !row.accountId)) {
      setError("Every line needs an account.");
      return;
    }
    setError("");
    console.log({
      year: Number(year),
      headType,
      branch,
      lines: lines.map((row) => ({
        accountId: row.accountId,
        months: row.months.map(toNumber),
        total: rowTotal(row),
      })),
    });
    setSavedBy(`${currentUser} ${dayjs().format("DD/MM/YYYY HH:mm:ss")}`);
  };

  // Delete removes the highlighted account line
  const handleDelete = () => {
    if (activeKey === null) return;
    setRows((prev) => padRows(prev.filter((row) => row.key !== activeKey)));
    setActiveKey(null);
  };

  const handlePrint = () => {
    console.log("print budget", { year, headType, branch });
    onPrint?.();
  };

  const handleCopy = () => {
    console.log("copy budget", { year, headType, branch });
    onCopy?.();
  };

  // Cancel throws away the changes and reloads the saved budget
  const handleCancel = () => reload();

  const handleClose = () => {
    setYear(String(new Date().getFullYear()));
    setHeadType(headTypeOptions[0]?.value ?? null);
    setBranch(defaultBranch);
    reload();
    onClose?.();
  };

  return (
    <div className="flex min-h-screen w-full items-start justify-center bg-white px-4 py-4">
      <div className="min-h-fit w-full max-w-362.5 bg-white p-0">
        <main className="w-full overflow-hidden border border-gray-400 bg-white">
          <header className="flex h-7.5 items-center justify-start bg-[#9fdfbc]">
            <h1 className="m-0 ml-3.5 text-[17px] font-semibold text-[#24364d]">
              Budget
            </h1>
          </header>

          <section className="flex flex-col gap-3 px-3.5 pb-6 pt-3">
            <BudgetHeader
              year={year}
              onYearChange={(value) => {
                setYear(value);
                setError("");
              }}
              headTypeOptions={headTypeOptions}
              headType={headType}
              onHeadTypeChange={handleHeadTypeChange}
              branchOptions={branchOptions}
              branch={branch}
              onBranchChange={(value) => {
                setBranch(value);
                reload();
              }}
              loadingCombos={loadingCombos}
            />

            <BudgetGrid
              rows={rows}
              accountIdOptions={accountIdOptions}
              accountNameOptions={accountNameOptions}
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
            />

            {error && (
              <p role="alert" className="m-0 text-[12px] text-[#c0392b]">
                {error}
              </p>
            )}

            <BudgetFooter
              savedBy={savedBy}
              onCopy={handleCopy}
              onSave={handleSave}
              onDelete={handleDelete}
              onPrint={handlePrint}
              onCancel={handleCancel}
              onClose={handleClose}
            />
          </section>
        </main>
      </div>
    </div>
  );
};

export default BudgetPage;