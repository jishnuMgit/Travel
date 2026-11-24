import React, { useState } from "react";
import Select, { components, type MenuListProps } from "react-select";
import { IoMdAdd, IoMdClose } from "react-icons/io";
import { toast } from "react-toastify";
import selectComponents from "../../../components/common/selectComponents";
import { fieldSelectProps } from "../../../components/common/Combo";
import { GRID_CELL_FOCUS_CLASS } from "../../../hooks/useGridCellFocus";

/* =====================================================================
   FILE MAP
   1. Types, constants, sample options (replace with your API data)
   2. Select helpers (same pair dropdown used in the Budget page)
   3. Parts : StaffGrid, GdsLoginsDialog
   4. StaffPage : owns the state and renders the parts

   Grid columns : ID | Staff | Sales Account ID (select) | Mobile | Branch |
                  Travel (checkbox) | Tourism (checkbox) | GDS Logins (+)
   Click the + icon -> small GDS Logins popup for that staff.
   ===================================================================== */

/* ---------------------------------------------------------------------
   1. TYPES, CONSTANTS AND SAMPLE OPTIONS
   --------------------------------------------------------------------- */
const MIN_ROWS = 16;
const MIN_GDS_ROWS = 4;

type StaffRow = {
  key: number;
  id: string;
  staff: string;
  salesAccountId: string | null;
  mobile: string;
  branch: string;
  travel: boolean;
  tourism: boolean;
};

type GdsLine = {
  key: number;
  gds: string | null;
  login: string;
  officeId: string;
  iataCode: string;
};

type PairOption = { value: string; label: string; second: string };
type SimpleOption = { value: string; label: string };
type PairColumns = { first?: string; second?: string };

/* TODO: replace with the API list (Sales Account ID / Account Name) */
const SALES_ACCOUNT_OPTIONS: PairOption[] = [
  { value: "SA001", label: "SA001", second: "Sales Account One" },
  { value: "SA002", label: "SA002", second: "Sales Account Two" },
  { value: "SA003", label: "SA003", second: "Sales Account Three" },
];

/* TODO: replace with the API list of GDS */
const GDS_OPTIONS: SimpleOption[] = [
  { value: "Amadeus", label: "Amadeus" },
  { value: "Sabre", label: "Sabre" },
  { value: "Galileo", label: "Galileo" },
  { value: "Travelport", label: "Travelport" },
];

const salesAccountColumns: PairColumns = { first: "120px", second: "230px" };

let keyCounter = 0;
const nextKey = () => ++keyCounter;

const emptyStaff = (): StaffRow => ({
  key: nextKey(),
  id: "",
  staff: "",
  salesAccountId: null,
  mobile: "",
  branch: "",
  travel: false,
  tourism: false,
});

const emptyGds = (): GdsLine => ({
  key: nextKey(),
  gds: null,
  login: "",
  officeId: "",
  iataCode: "",
});

const isEmptyStaff = (row: StaffRow) =>
  !row.id &&
  !row.staff &&
  !row.salesAccountId &&
  !row.mobile &&
  !row.branch &&
  !row.travel &&
  !row.tourism;

const isEmptyGds = (line: GdsLine) =>
  !line.gds && !line.login && !line.officeId && !line.iataCode;

/** keeps one empty row at the end and at least `min` rows in total */
const padList = <T,>(
  list: T[],
  isEmpty: (item: T) => boolean,
  make: () => T,
  min: number,
): T[] => {
  const result = [...list];
  if (result.length === 0 || !isEmpty(result[result.length - 1])) {
    result.push(make());
  }
  while (result.length < min) result.push(make());
  return result;
};

const padStaff = (rows: StaffRow[]) =>
  padList(rows, isEmptyStaff, emptyStaff, MIN_ROWS);
const padGds = (rows: GdsLine[]) =>
  padList(rows, isEmptyGds, emptyGds, MIN_GDS_ROWS);

/* ---------------------------------------------------------------------
   2. SELECT HELPERS (same look as the Budget page cells)
   --------------------------------------------------------------------- */
const columnStyle = (width?: string) =>
  width === undefined ? undefined : { width };
const columnClass = (width?: string) =>
  width === undefined ? "min-w-0 flex-1" : "shrink-0";

const PairMenuList = (props: MenuListProps<PairOption, false>) => (
  <components.MenuList {...props}>
    <div className="sticky top-0 z-10 flex w-full items-stretch border-b border-[#b8c4d0] bg-[#f3f5f7] font-semibold text-[#344054]">
      <span
        style={columnStyle(salesAccountColumns.first)}
        className={`${columnClass(salesAccountColumns.first)} truncate border-r border-[#b8c4d0] px-1.5 py-1 text-[12px]`}
      >
        Account ID
      </span>
      <span
        style={columnStyle(salesAccountColumns.second)}
        className={`${columnClass(salesAccountColumns.second)} truncate px-2 py-1 text-[12px]`}
      >
        Account Name
      </span>
    </div>
    {props.children}
  </components.MenuList>
);

const pairOptionLabel = (
  option: PairOption,
  { context }: { context: "menu" | "value" },
) =>
  context === "menu" ? (
    <div className="flex w-full items-stretch">
      <span
        style={columnStyle(salesAccountColumns.first)}
        className={`${columnClass(salesAccountColumns.first)} truncate border-r border-[#b8c4d0] px-1.5 py-1`}
      >
        {option.label}
      </span>
      <span
        style={columnStyle(salesAccountColumns.second)}
        className={`${columnClass(salesAccountColumns.second)} truncate px-2 py-1`}
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

const optionClass = ({
  isFocused,
  isSelected,
}: {
  isFocused: boolean;
  isSelected: boolean;
}) => `
  !cursor-pointer !text-[12px] !text-[#24364d]
  ${isSelected ? "!bg-[#e7f7ed]" : isFocused ? "!bg-[#f2faf5]" : "!bg-white"}
`;

const pairClassNames = {
  ...cellSelectProps.classNames,
  menuList: () => "!p-0 !max-h-[312px] !overflow-x-hidden",
  option: (state: { isFocused: boolean; isSelected: boolean }) =>
    `${optionClass(state)} !p-0`,
};

const simpleClassNames = {
  ...cellSelectProps.classNames,
  menuList: () => "!p-0 !max-h-[312px]",
  option: (state: { isFocused: boolean; isSelected: boolean }) =>
    `${optionClass(state)} !px-2 !py-1`,
};

/* the menu is drawn on <body> so table / popup scrolling never clips it */
const portalStyles = {
  menuPortal: (base: object) => ({ ...base, zIndex: 9999 }),
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

const thClass =
  "h-[28px] border border-[#B7ECD0] bg-[#fafbfc] px-2 font-normal text-[#405066]";
const tdClass = "h-6.5 border border-[#B7ECD0] p-0";
const tableClass =
  "w-full table-fixed border-collapse text-[12px] text-[#24364d]";
const textInputClass =
  "h-6.5 w-full bg-transparent px-2 text-[12px] text-[#24364d] outline-none focus:bg-white focus:ring-1 focus:ring-inset focus:ring-[#91a7b9]";
const checkboxClass =
  "h-3.5 w-3.5 cursor-pointer accent-[#4cc45a] disabled:cursor-not-allowed";

/* ---------------------------------------------------------------------
   3. PARTS
   --------------------------------------------------------------------- */

/* 3a. Grid: ID, Staff, Sales Account ID, Mobile, Branch, Travel, Tourism, GDS */
const StaffGrid: React.FC<{
  rows: StaffRow[];
  gdsCount: (key: number) => number;
  activeKey: number | null;
  onActivate: (key: number) => void;
  onChange: (key: number, patch: Partial<StaffRow>) => void;
  onToggleAll: (field: "travel" | "tourism", value: boolean) => void;
  onOpenGds: (key: number) => void;
}> = ({
  rows,
  gdsCount,
  activeKey,
  onActivate,
  onChange,
  onToggleAll,
  onOpenGds,
}) => {
  const filled = rows.filter((row) => !isEmptyStaff(row));
  const allTravel = filled.length > 0 && filled.every((row) => row.travel);
  const allTourism = filled.length > 0 && filled.every((row) => row.tourism);

  return (
    <div
      className={`overflow-x-auto border border-[#B7ECD0] bg-white ${niceScrollbar}`}
    >
      <div className="min-w-295">
        {/* header (fixed) */}
        <table className={tableClass}>
          <colgroup>
            <col className="w-11" />
            <col className="w-22.5" />
            <col className="w-55" />
            <col className="w-37.5" />
            <col className="w-32.5" />
            <col className="w-32.5" />
            <col className="w-27.5" />
            <col className="w-27.5" />
            <col className="w-27.5" />
            <col className="w-2.5" />
          </colgroup>
          <thead>
            <tr>
              <th className={`${thClass} text-center`}>Line</th>
              <th className={`${thClass} text-left`}>ID</th>
              <th className={`${thClass} text-left`}>Staff</th>
              <th className={`${thClass} text-left`}>Sales Account ID</th>
              <th className={`${thClass} text-left`}>Mobile</th>
              <th className={`${thClass} text-left`}>Branch</th>
              <th className={thClass}>
                <label className="flex cursor-pointer items-center justify-center gap-1.5">
                  
                  Travel
                </label>
              </th>
              <th className={thClass}>
                <label className="flex cursor-pointer items-center justify-center gap-1.5">
                
                  Tourism
                </label>
              </th>
              <th className={`${thClass} text-center`}>GDS Logins</th>
              <th className={`${thClass} p-0`} />
            </tr>
          </thead>
        </table>

        {/* rows (vertical scrollbar sits beside them) */}
        <div
          className={`max-h-[min(440px,calc(100vh-260px))] overflow-x-hidden overflow-y-scroll bg-white ${niceScrollbar}`}
        >
          <table className={tableClass}>
            <colgroup>
              <col className="w-11" />
              <col className="w-22.5" />
              <col className="w-55" />
              <col className="w-37.5" />
              <col className="w-32.5" />
              <col className="w-32.5" />
              <col className="w-27.5" />
              <col className="w-27.5" />
              <col className="w-27.5" />
            </colgroup>
            <tbody>
              {rows.map((row, index) => {
                const active = row.key === activeKey;
                const count = gdsCount(row.key);
                return (
                  <tr
                    key={row.key}
                    onClick={() => onActivate(row.key)}
                    className="bg-white"
                  >
                    <td
                      className={`h-6.5 border border-[#B7ECD0] bg-[#fafbfc] px-1 text-center text-[12px] text-[#405066] ${
                        active ? "font-semibold text-[#24364d]" : ""
                      }`}
                    >
                      {index + 1}
                    </td>
                    <td className={tdClass}>
                      <input
                        aria-label="ID"
                        value={row.id}
                        onFocus={() => onActivate(row.key)}
                        onChange={(e) =>
                          onChange(row.key, { id: e.target.value })
                        }
                        className={textInputClass}
                      />
                    </td>
                    <td className={tdClass}>
                      <input
                        aria-label="Staff"
                        value={row.staff}
                        onFocus={() => onActivate(row.key)}
                        onChange={(e) =>
                          onChange(row.key, { staff: e.target.value })
                        }
                        className={textInputClass}
                      />
                    </td>
                    <td className={`${tdClass} ${GRID_CELL_FOCUS_CLASS}`}>
                      <Select<PairOption, false>
                        inputId={`lkpSalesAccountID-${row.key}`}
                        instanceId={`lkpSalesAccountID-${row.key}`}
                        aria-label="Sales Account ID"
                        options={SALES_ACCOUNT_OPTIONS}
                        value={
                          SALES_ACCOUNT_OPTIONS.find(
                            (o) => o.value === row.salesAccountId,
                          ) ?? null
                        }
                        components={{
                          ...selectComponents,
                          MenuList: PairMenuList,
                        }}
                        onFocus={() => onActivate(row.key)}
                        onChange={(option) =>
                          onChange(row.key, {
                            salesAccountId: option?.value ?? null,
                          })
                        }
                        formatOptionLabel={pairOptionLabel}
                        styles={{
                          ...portalStyles,
                          menu: (base) => ({
                            ...base,
                            width: 350,
                            minWidth: 350,
                          }),
                        }}
                        {...cellSelectProps}
                        classNames={pairClassNames}
                      />
                    </td>
                    <td className={tdClass}>
                      <input
                        aria-label="Mobile"
                        inputMode="tel"
                        value={row.mobile}
                        onFocus={() => onActivate(row.key)}
                        onChange={(e) => {
                          if (/^[\d+\- ]*$/.test(e.target.value))
                            onChange(row.key, { mobile: e.target.value });
                        }}
                        className={textInputClass}
                      />
                    </td>
                    <td className={tdClass}>
                      <input
                        aria-label="Branch"
                        value={row.branch}
                        onFocus={() => onActivate(row.key)}
                        onChange={(e) =>
                          onChange(row.key, { branch: e.target.value })
                        }
                        className={textInputClass}
                      />
                    </td>
                    <td className={`${tdClass} text-center`}>
                      <input
                        type="checkbox"
                        aria-label={`Travel, line ${index + 1}`}
                        checked={row.travel}
                        onFocus={() => onActivate(row.key)}
                        onChange={(e) =>
                          onChange(row.key, { travel: e.target.checked })
                        }
                        className={checkboxClass}
                      />
                    </td>
                    <td className={`${tdClass} text-center`}>
                      <input
                        type="checkbox"
                        aria-label={`Tourism, line ${index + 1}`}
                        checked={row.tourism}
                        onFocus={() => onActivate(row.key)}
                        onChange={(e) =>
                          onChange(row.key, { tourism: e.target.checked })
                        }
                        className={checkboxClass}
                      />
                    </td>
                    <td className={`${tdClass} text-center`}>
                      <button
                        type="button"
                        aria-label={`GDS logins, line ${index + 1}`}
                        title="GDS Logins"
                        disabled={isEmptyStaff(row)}
                        onClick={(event) => {
                          event.stopPropagation();
                          onOpenGds(row.key);
                        }}
                        className="inline-flex h-6.25 w-full items-center justify-center gap-1 hover:bg-[#f2faf5] hover:text-[#2f9e5a] disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        <IoMdAdd size={17} />
                        {/* {count > 0 && (
                          <span className="rounded-full bg-[#e7f7ed] px-1.5 text-[11px] text-[#24364d]">
                            {count}
                          </span>
                        )} */}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

/* 3b. Popup: staff select + GDS / GDS Login / Office ID / IATA Code lines */
const GdsLoginsDialog: React.FC<{
  staffOptions: SimpleOption[];
  staffKey: number;
  lines: GdsLine[];
  onStaffChange: (key: number) => void;
  onLineChange: (line: GdsLine) => void;
  onDone: () => void;
  onCancel: () => void;
}> = ({
  staffOptions,
  staffKey,
  lines,
  onStaffChange,
  onLineChange,
  onDone,
  onCancel,
}) => (
  <div
    className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4"
    onMouseDown={(event) => {
      if (event.target === event.currentTarget) onCancel();
    }}
  >
    <div
      role="dialog"
      aria-modal="true"
      aria-label="GDS Logins"
      className="w-full max-w-190 overflow-hidden rounded-lg border border-gray-400 bg-white shadow-lg"
    >
      <header className="flex h-7.5 items-center justify-between bg-[#9fdfbc] pl-3.5 pr-1">
        <h2 className="m-0 text-[15px] font-semibold text-[#24364d]">
          GDS Logins
        </h2>
        <button
          type="button"
          aria-label="Close"
          onClick={onCancel}
          className="inline-flex h-6 w-6 items-center justify-center text-[#24364d] hover:bg-white/50"
        >
          <IoMdClose size={17} />
        </button>
      </header>

      <div className="flex flex-col gap-3 px-3.5 pb-4 pt-3">
        <div className="flex items-center gap-2">
          <label
            htmlFor="lkpGdsStaff"
            className="shrink-0 text-right text-[12px] text-[#405066]"
          >
            Staff :
          </label>
          <div className="w-72 min-w-0">
            <Select<SimpleOption, false>
              inputId="lkpGdsStaff"
              instanceId="lkpGdsStaff"
              aria-label="Staff"
              options={staffOptions}
              components={selectComponents}
              value={staffOptions.find((o) => o.value === String(staffKey)) ?? null}
              onChange={(option) => {
                if (option) onStaffChange(Number(option.value));
              }}
              styles={portalStyles}
              {...fieldSelectProps}
            />
          </div>
        </div>

        <div
          className={`max-h-65 overflow-y-auto border border-[#B7ECD0] ${niceScrollbar}`}
        >
          <table className={tableClass}>
            <colgroup>
              <col className="w-37.5" />
              <col className="w-42.5" />
              <col className="w-37.5" />
              <col />
            </colgroup>
            <thead className="sticky top-0 z-10">
              <tr>
                <th className={`${thClass} text-left`}>GDS</th>
                <th className={`${thClass} text-left`}>GDS Login</th>
                <th className={`${thClass} text-left`}>Office ID</th>
                <th className={`${thClass} text-left`}>IATA Code</th>
              </tr>
            </thead>
            <tbody>
              {lines.map((line, index) => (
                <tr key={line.key} className="bg-white">
                  <td className={`${tdClass} ${GRID_CELL_FOCUS_CLASS}`}>
                    <Select<SimpleOption, false>
                      inputId={`lkpGds-${line.key}`}
                      instanceId={`lkpGds-${line.key}`}
                      aria-label={`GDS, line ${index + 1}`}
                      options={GDS_OPTIONS}
                      components={selectComponents}
                      value={GDS_OPTIONS.find((o) => o.value === line.gds) ?? null}
                      onChange={(option) =>
                        onLineChange({ ...line, gds: option?.value ?? null })
                      }
                      styles={portalStyles}
                      {...cellSelectProps}
                      classNames={simpleClassNames}
                    />
                  </td>
                  <td className={tdClass}>
                    <input
                      aria-label={`GDS Login, line ${index + 1}`}
                      value={line.login}
                      onChange={(e) =>
                        onLineChange({ ...line, login: e.target.value })
                      }
                      className={textInputClass}
                    />
                  </td>
                  <td className={tdClass}>
                    <input
                      aria-label={`Office ID, line ${index + 1}`}
                      value={line.officeId}
                      onChange={(e) =>
                        onLineChange({ ...line, officeId: e.target.value })
                      }
                      className={textInputClass}
                    />
                  </td>
                  <td className={tdClass}>
                    <input
                      aria-label={`IATA Code, line ${index + 1}`}
                      value={line.iataCode}
                      onChange={(e) =>
                        onLineChange({ ...line, iataCode: e.target.value })
                      }
                      className={textInputClass}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex justify-center gap-2">
          <button type="button" onClick={onDone} className="btn-style">
            OK
          </button>
          <button type="button" onClick={onCancel} className="btn-style">
            Cancel
          </button>
        </div>
      </div>
    </div>
  </div>
);

/* ---------------------------------------------------------------------
   4. MAIN PAGE : owns the state and renders the parts
   --------------------------------------------------------------------- */
const StaffPage: React.FC = () => {
  const [rows, setRows] = useState<StaffRow[]>(() => padStaff([]));
  const [activeKey, setActiveKey] = useState<number | null>(null);
  const [error, setError] = useState("");

  /* GDS logins per staff row, kept in memory until the page is saved */
  const [gdsByStaff, setGdsByStaff] = useState<Record<number, GdsLine[]>>({});
  const [gdsStaffKey, setGdsStaffKey] = useState<number | null>(null);
  /* snapshot taken when the popup opens, so Cancel can undo the edits */
  const [gdsSnapshot, setGdsSnapshot] = useState<Record<number, GdsLine[]>>({});

  const updateRow = (key: number, patch: Partial<StaffRow>) => {
    setError("");
    setRows((prev) =>
      padStaff(prev.map((row) => (row.key === key ? { ...row, ...patch } : row))),
    );
  };

  const toggleAll = (field: "travel" | "tourism", value: boolean) =>
    setRows((prev) =>
      prev.map((row) => (isEmptyStaff(row) ? row : { ...row, [field]: value })),
    );

  const savedGdsLines = (key: number) =>
    (gdsByStaff[key] ?? []).filter((line) => !isEmptyGds(line));

  /* ----- GDS popup ----- */
  const openGds = (key: number) => {
    setGdsSnapshot(gdsByStaff);
    setGdsByStaff((prev) => ({ ...prev, [key]: padGds(prev[key] ?? []) }));
    setGdsStaffKey(key);
  };

  const changeGdsStaff = (key: number) => {
    setGdsByStaff((prev) => ({ ...prev, [key]: padGds(prev[key] ?? []) }));
    setGdsStaffKey(key);
  };

  const changeGdsLine = (line: GdsLine) => {
    if (gdsStaffKey === null) return;
    const staffKey = gdsStaffKey;
    setGdsByStaff((prev) => ({
      ...prev,
      [staffKey]: padGds(
        (prev[staffKey] ?? []).map((l) => (l.key === line.key ? line : l)),
      ),
    }));
  };

  const closeGds = (keepChanges: boolean) => {
    if (keepChanges) {
      /* drop the empty padding lines before leaving */
      setGdsByStaff((prev) =>
        Object.fromEntries(
          Object.entries(prev).map(([k, lines]) => [
            k,
            lines.filter((line) => !isEmptyGds(line)),
          ]),
        ),
      );
    } else {
      setGdsByStaff(gdsSnapshot);
    }
    setGdsStaffKey(null);
  };

  /* ----- footer actions ----- */
  const handleSave = () => {
    const lines = rows.filter((row) => !isEmptyStaff(row));
    if (lines.length === 0) {
      setError("Add at least one staff line.");
      return;
    }
    if (lines.some((row) => !row.id.trim() || !row.staff.trim())) {
      setError("Every line needs an ID and a staff name.");
      return;
    }
    const ids = lines.map((row) => row.id.trim().toLowerCase());
    if (new Set(ids).size !== ids.length) {
      setError("Staff IDs must be unique.");
      return;
    }
    setError("");
    /* TODO: call your save API here with `lines` and `gdsByStaff` */
    toast.success("Staff saved successfully.");
  };

  const handleClear = () => {
    setRows(padStaff([]));
    setGdsByStaff({});
    setActiveKey(null);
    setError("");
  };

  const staffOptions: SimpleOption[] = rows
    .filter((row) => !isEmptyStaff(row))
    .map((row) => ({
      value: String(row.key),
      label: row.staff || row.id,
    }));

  return (
    <div className="flex min-h-screen w-full items-start justify-center bg-white px-4 py-4">
      <div className="min-h-fit w-full max-w-374 bg-white p-0">
        <main className="w-full overflow-hidden border border-gray-400 bg-white">
          <header className="flex h-7.5 items-center justify-start bg-[#9fdfbc]">
            <h1 className="m-0 ml-3.5 text-[17px] font-semibold text-[#24364d]">
              Staff
            </h1>
          </header>

          <section className="flex flex-col gap-3 px-3.5 pb-6 pt-3">
            <StaffGrid
              rows={rows}
              gdsCount={(key) => savedGdsLines(key).length}
              activeKey={activeKey}
              onActivate={setActiveKey}
              onChange={updateRow}
              onToggleAll={toggleAll}
              onOpenGds={openGds}
            />

            {error && (
              <p role="alert" className="m-0 text-[12px] text-[#c0392b]">
                {error}
              </p>
            )}

            <div className="flex flex-wrap justify-center gap-2">
              <button
                id="btnSave"
                type="button"
                onClick={handleSave}
                className="btn-style"
              >
                <u>S</u>ave
              </button>
              <button
                id="btnClear"
                type="button"
                onClick={handleClear}
                className="btn-style"
              >
                <u>C</u>lear
              </button>
            </div>
          </section>
        </main>
      </div>

      {gdsStaffKey !== null && (
        <GdsLoginsDialog
          staffOptions={staffOptions}
          staffKey={gdsStaffKey}
          lines={gdsByStaff[gdsStaffKey] ?? padGds([])}
          onStaffChange={changeGdsStaff}
          onLineChange={changeGdsLine}
          onDone={() => closeGds(true)}
          onCancel={() => closeGds(false)}
        />
      )}
    </div>
  );
};

export default StaffPage;