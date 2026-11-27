
import React, { useState } from "react";
import Select, { components, type MenuListProps } from "react-select";
import { IoMdClose } from "react-icons/io";
import { toast } from "react-toastify";
import selectComponents from "../../../components/common/selectComponents";
import { fieldSelectProps } from "../../../components/common/Combo";
import { deleteConfirm } from "../../../hooks/deleteMessage";
import { useConfirmModal } from "../../../hooks/useConfirmModal";
import Header from "../../../components/common/Header";
import { GRID_CELL_FOCUS_CLASS } from "../../../hooks/useGridCellFocus";

/* =====================================================================
   SET IATA - OFFICE ID
===================================================================== */

/* ---------------------------------------------------------------------
   1. TYPES AND CONSTANTS
--------------------------------------------------------------------- */

const MIN_ROWS = 10;

type SimpleOption = {
  value: string;
  label: string;
};

type OfficeLine = {
  key: number;
  gds: string | null;
  officeId: string;
  note: string;
};

const IATA_OPTIONS: SimpleOption[] = [
  { value: "12345678", label: "12345678 - Head Office" },
  { value: "87654321", label: "87654321 - City Branch" },
];

const GDS_OPTIONS: SimpleOption[] = [
  { value: "Amadeus", label: "Amadeus" },
  { value: "Sabre", label: "Sabre" },
  { value: "Galileo", label: "Galileo" },
  { value: "Travelport", label: "Travelport" },
];

const GdsMenuList = (props: MenuListProps<SimpleOption, false>) => (
  <components.MenuList {...props}>
    <div className="sticky top-0 z-10 w-full border-b border-[#b8c4d0] bg-[#f3f5f7] px-[6px] py-[4px] text-[12px] font-semibold text-[#344054]">
      GDS Name
    </div>
    {props.children}
  </components.MenuList>
);

let keyCounter = 0;

const nextKey = () => ++keyCounter;

const emptyLine = (): OfficeLine => ({
  key: nextKey(),
  gds: null,
  officeId: "",
  note: "",
});

const isEmptyLine = (line: OfficeLine) =>
  !line.gds && !line.officeId.trim() && !line.note.trim();

/* Maintain minimum 10 editable rows */
const ensureMinimumRows = (
  rows: OfficeLine[],
): OfficeLine[] => {
  const missing = Math.max(MIN_ROWS - rows.length, 0);

  return [
    ...rows,
    ...Array.from({ length: missing }, () => emptyLine()),
  ];
};

/* ---------------------------------------------------------------------
   2. STYLES
--------------------------------------------------------------------- */

const selectTextClassNames = {
  singleValue: () => "!m-0 !text-[14px] !text-[#24364d]",
  placeholder: () => "!m-0 !text-[14px] !text-[#7a8794]",
  input: () => "!m-0 !p-0 !text-[14px] !text-[#24364d]",
};

const fieldClassNames = {
  ...fieldSelectProps.classNames,
  ...selectTextClassNames,
  control: (state: { isFocused: boolean }) =>
    `${fieldSelectProps.classNames.control(state)} !text-[14px]`,
  valueContainer: () => "!h-[26px] !py-0 !px-[2px] !overflow-hidden",
};

const cellSelectProps = {
  ...fieldSelectProps,
  minMenuHeight: 40,
  menuPlacement: "bottom" as const,
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

const gdsClassNames = {
  ...cellSelectProps.classNames,
  menuList: () => "!p-0 !max-h-[260px] !overflow-x-hidden",
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
};

const portalStyles = {
  menuPortal: (base: object) => ({
    ...base,
    zIndex: 9999,
  }),
};

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

const labelClass = "text-[14px] text-[#405066]";

const thClass =
  "h-[28px] border border-[#B7ECD0] bg-[#EEFBF4] px-[2px] text-left font-semibold text-[#405066]";

const tdClass = "h-6.5 border border-[#B7ECD0] p-0";

const tableClass =
  "w-full table-fixed border-collapse text-[12px] text-[#24364d]";

const iconButtonClass =
  "inline-flex h-6.25 w-full items-center justify-center disabled:cursor-not-allowed disabled:opacity-40";

const inlineInputClass =
  "h-6 w-full min-w-0 border-0 bg-transparent px-[3px] text-[14px] text-[#24364d] outline-none focus:bg-[#f2faf5]";

/* ---------------------------------------------------------------------
   3. OFFICE ID GRID
--------------------------------------------------------------------- */

const OfficeIdGrid: React.FC<{
  lines: OfficeLine[];
  errors: Record<number, string>;
  onChange: (line: OfficeLine, patch: Partial<OfficeLine>) => void;
  onDelete: (line: OfficeLine, index: number) => void;
}> = ({ lines, errors, onChange, onDelete }) => {
  const cols = (gutter: boolean) => (
    <colgroup>
      <col className="w-45" />
      <col className="w-45" />
      <col />
      <col className="w-10" />
      {gutter && <col className="w-2.5" />}
    </colgroup>
  );

  return (
    <div className="overflow-hidden border border-[#B7ECD0] bg-white">

      {/* Table Header */}
      <table className={tableClass}>
        {cols(true)}

        <thead>
          <tr>
            <th className={thClass}>GDS</th>
            <th className={thClass}>Office ID</th>
            <th className={thClass}>Note</th>
            <th className={`${thClass} text-center`}></th>
            <th className={`${thClass} p-0`} />
          </tr>
        </thead>
      </table>

      {/* Editable Table Rows */}
      <div
        className={`max-h-[min(400px,calc(100vh-300px))] overflow-x-hidden overflow-y-scroll ${niceScrollbar}`}
      >
        <table className={tableClass}>
          {cols(false)}

          <tbody>
            {lines.map((line, index) => (
              <React.Fragment key={line.key}>

                <tr className="bg-white">

                  {/* GDS Name */}
                  <td className={`${tdClass} ${GRID_CELL_FOCUS_CLASS}`}>
                    <Select<SimpleOption, false>
                      inputId={`lkpGds-${line.key}`}
                      instanceId={`lkpGds-${line.key}`}
                      aria-label={`GDS Name for line ${index + 1}`}
                      options={GDS_OPTIONS}
                      components={{
                        ...selectComponents,
                        MenuList: GdsMenuList,
                      }}
                      value={
                        GDS_OPTIONS.find(
                          (option) => option.value === line.gds
                        ) ?? null
                      }
                      onChange={(option) =>
                        onChange(line, {
                          gds: option?.value ?? null,
                        })
                      }
                      {...cellSelectProps}
                      classNames={gdsClassNames}
                    />
                  </td>

                  {/* Office ID */}
                  <td className={tdClass}>
                    <input
                      aria-label={`Office ID for line ${index + 1}`}
                      value={line.officeId}
                      onChange={(event) =>
                        onChange(line, {
                          officeId: event.target.value.toUpperCase(),
                        })
                      }
                      className={inlineInputClass}
                    />
                  </td>

                  {/* Note */}
                  <td className={tdClass}>
                    <input
                      aria-label={`Note for line ${index + 1}`}
                      value={line.note}
                      onChange={(event) =>
                        onChange(line, {
                          note: event.target.value,
                        })
                      }
                      className={inlineInputClass}
                    />
                  </td>

                  {/* Delete */}
                  <td className={`${tdClass} text-center`}>
                    <button
                      type="button"
                      aria-label={`Delete line ${index + 1}`}
                      title="Delete line"
                      onClick={() => onDelete(line, index)}
                      disabled={isEmptyLine(line)}
                      className={`${iconButtonClass} text-red-600 hover:bg-red-50 hover:text-red-700`}
                    >
                      <IoMdClose size={17} />
                    </button>
                  </td>

                </tr>

                {/* Validation Error */}
                {errors[line.key] && (
                  <tr className="bg-white">
                    <td
                      className="border-x border-b border-[#B7ECD0] px-1 pb-1 text-[12px] text-[#c0392b]"
                      colSpan={4}
                      role="alert"
                    >
                      {errors[line.key]}
                    </td>
                  </tr>
                )}

              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

/* ---------------------------------------------------------------------
   4. MAIN PAGE
--------------------------------------------------------------------- */

const SetIataOfficeIdPage: React.FC = () => {
  const { confirm, dialog: confirmDialog } = useConfirmModal();

  // First IATA automatically selected on initial page load
  const [iata, setIata] = useState<string | null>(
    IATA_OPTIONS[0]?.value ?? null
  );

  // Initialize 10 editable rows for the first IATA
  const [linesByIata, setLinesByIata] = useState<
    Record<string, OfficeLine[]>
  >(() => {
    if (!IATA_OPTIONS[0]) return {};

    return {
      [IATA_OPTIONS[0].value]: ensureMinimumRows([]),
    };
  });

  const [rowErrors, setRowErrors] = useState<
    Record<number, string>
  >({});

  const lines = iata
    ? linesByIata[iata] ?? []
    : [];

  /* ------------------------------------------------------------------
     CHANGE ROW
  ------------------------------------------------------------------ */

  const changeLine = (
    line: OfficeLine,
    patch: Partial<OfficeLine>,
  ) => {
    if (!iata) return;

    setLinesByIata((prev) => ({
      ...prev,
      [iata]: (prev[iata] ?? []).map((current) =>
        current.key === line.key
          ? { ...current, ...patch }
          : current
      ),
    }));

    setRowErrors((prev) => {
      if (!(line.key in prev)) return prev;

      const next = { ...prev };
      delete next[line.key];

      return next;
    });
  };

  /* ------------------------------------------------------------------
     SAVE
  ------------------------------------------------------------------ */

  const saveLines = () => {
    if (!iata) return;

    const activeLines = lines.filter(
      (line) => !isEmptyLine(line)
    );

    const errors: Record<number, string> = {};

    activeLines.forEach((line) => {
      if (!line.gds) {
        errors[line.key] = "Select a GDS Name.";
      } else if (!line.officeId.trim()) {
        errors[line.key] = "Enter an Office ID.";
      }

      const duplicate = activeLines.some(
        (current) =>
          current.key !== line.key &&
          current.gds === line.gds &&
          current.officeId.trim() === line.officeId.trim()
      );

      if (!errors[line.key] && duplicate) {
        errors[line.key] =
          "The same GDS and Office ID cannot be added twice.";
      }
    });

    if (Object.keys(errors).length > 0) {
      setRowErrors(errors);
      return;
    }

    const savedLines = activeLines.map((line) => ({
      ...line,
      officeId: line.officeId.trim(),
    }));

    setLinesByIata((prev) => ({
      ...prev,
      [iata]: ensureMinimumRows(savedLines),
    }));

    setRowErrors({});

    // TODO: Call save/update API with iata and savedLines

    toast.success("IATA Office IDs saved successfully.");
  };

  /* ------------------------------------------------------------------
     DELETE INDIVIDUAL ROW
  ------------------------------------------------------------------ */

  const deleteLine = async (
    line: OfficeLine,
    index: number,
  ) => {
    if (!iata) return;

    const confirmed = await confirm(
      deleteConfirm(
        `Do you want to Delete Line ${index + 1}?`,
        "Set IATA - Office ID"
      )
    );

    if (!confirmed) return;

    // TODO: Call delete API here

    setLinesByIata((prev) => ({
      ...prev,
      [iata]: ensureMinimumRows(
        (prev[iata] ?? []).filter(
          (current) => current.key !== line.key
        )
      ),
    }));

    setRowErrors((prev) => {
      const next = { ...prev };
      delete next[line.key];

      return next;
    });
  };

  /* ------------------------------------------------------------------
     DELETE ALL
  ------------------------------------------------------------------ */

  const handleClear = async () => {
    if (!iata || !lines.some((line) => !isEmptyLine(line))) {
      return;
    }

    const confirmed = await confirm(
      deleteConfirm(
        "Do you want to Delete all ?",
        "Set IATA - Office ID"
      )
    );

    if (!confirmed) return;

    // TODO: Call delete-all API here

    setLinesByIata((prev) => ({
      ...prev,
      [iata]: ensureMinimumRows([]),
    }));

    setRowErrors((prev) => {
      const next = { ...prev };

      lines.forEach((line) => {
        delete next[line.key];
      });

      return next;
    });
  };

  /* ------------------------------------------------------------------
     RENDER
  ------------------------------------------------------------------ */

  return (
    <div className="flex min-h-screen w-full items-start justify-center bg-white px-4 py-4">

      <div className="min-h-fit w-full max-w-200 bg-white p-0">

        <main className="w-full overflow-hidden border border-gray-400 bg-white">

          <Header Name="Set IATA - Office ID" />

          <section className="flex flex-col gap-4 px-3.5 pb-3 pt-3">

            {/* IATA Dropdown */}
            <div className="flex items-center gap-1">

              <label
                htmlFor="lkpIata"
                className={labelClass}
              >
                IATA :
              </label>

              <div className="w-80 min-w-0 max-w-full">

                <Select<SimpleOption, false>
                  inputId="lkpIata"
                  instanceId="lkpIata"
                  aria-label="IATA"
                  options={IATA_OPTIONS}
                  components={selectComponents}
                  value={
                    IATA_OPTIONS.find(
                      (option) => option.value === iata
                    ) ?? null
                  }
                  onChange={(option) => {
                    const selectedIata = option?.value ?? null;

                    setIata(selectedIata);
                    setRowErrors({});

                    if (selectedIata) {
                      setLinesByIata((prev) => ({
                        ...prev,
                        [selectedIata]: ensureMinimumRows(
                          prev[selectedIata] ?? []
                        ),
                      }));
                    }
                  }}
                  styles={portalStyles}
                  {...fieldSelectProps}
                  classNames={fieldClassNames}
                />

              </div>
            </div>

            {/* Grid */}
            <OfficeIdGrid
              lines={lines}
              errors={rowErrors}
              onChange={changeLine}
              onDelete={(line, index) =>
                void deleteLine(line, index)
              }
            />

            {/* Buttons */}
            <div className="flex flex-wrap justify-center gap-2">

              <button
                id="btnSave"
                type="button"
                onClick={saveLines}
                disabled={
                  !iata ||
                  !lines.some((line) => !isEmptyLine(line))
                }
                className="btn-style"
              >
                <u>S</u>ave
              </button>

             

            </div>

          </section>
        </main>
      </div>

      {confirmDialog}

    </div>
  );
};

export default SetIataOfficeIdPage;
