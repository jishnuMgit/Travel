
import React from "react";
import Select, {
  components,
  type ClassNamesConfig,
  type MenuListProps,
} from "react-select";
import selectComponents from "./selectComponents";

// `secondLabel` is optional. When the options have it, the dropdown list shows
// two columns (label | secondLabel) with a divider; the box shows only `label`.
// `listFirst` (optional) replaces `label` in the first column of that list, so a
// box can show the name while its list still reads "ID | Name".
export type Option = {
  value: string;
  label: string;
  secondLabel?: string;
  listFirst?: string;
};

type ComboProps = {
  id: string;
  /** width in px of the open list (only used by the two-column dropdown) */
  menuWidth?: number;
  /** plain list only: the open list is exactly as wide as the box (no 110px minimum) */
  fitMenuToBox?: boolean;
  /**
   * id of an element: the open list ends just before the label of that field
   * (or before the element itself). Use it so a list never covers the next field.
   */
  menuEndId?: string;
  /** width in px of the first column; default is the width of the box */
  firstColumnWidth?: number;
  /** fixed width in px of the second column (the first column then takes the rest) */
  secondColumnWidth?: number;
  /**
   * Extra px added to the right of the box: the first column is exactly the box
   * width, the second column is these extra px, and the list is box + extra wide.
   */
  secondColumnExtra?: number;
  /** heading texts of the two-column list */
  firstHeader?: string;
  secondHeader?: string;
  options: Option[];
  value: string | null;
  onChange?: (value: string | null) => void;
  className?: string;
  disabled?: boolean;
  isSearchable?: boolean;
};

const comboClassNames: ClassNamesConfig<Option, false> = {
  control: ({ isFocused, isDisabled }) => `
    !min-h-[30px] !h-[30px] !rounded-[4px] !border !shadow-none !text-[12px]
    hover:!border-[#A0DFBD]
    ${isDisabled ? "!bg-[#eef1f4]" : "!bg-white"}
      ${isFocused ? "!border-[#A0DFBD] !border-[2px]" : "!border-[#cfd7df]"}
  `,
  valueContainer: () => "!h-[26px] !py-0 !px-[5px] !overflow-hidden",
  singleValue: () => "!m-0 !text-[12px] !text-[#24364d]",
  placeholder: () => "!m-0 !text-[12px] !text-[#7a8794]",
  input: () => "!m-0 !p-0 !text-[12px] !text-[#24364d]",
  indicatorsContainer: () => "!h-[26px]",
  dropdownIndicator: () => "!p-[2px] !text-[#657486]",
  indicatorSeparator: () => "!hidden",
  clearIndicator: () => "!p-[2px]",
  menu: () =>
    "!mt-[1px] !rounded-none !border !border-[#cfd7df] !z-[999999] !shadow-md !min-w-[110px]",
  menuList: () => "!p-0 !max-h-[180px]",
  option: ({ isFocused, isSelected }) => `
    !cursor-pointer !px-[6px] !py-[4px] !text-[12px] !text-[#24364d]
    ${isSelected ? "!bg-[#e7f7ed]" : isFocused ? "!bg-[#f2faf5]" : "!bg-white"}
  `,
};
export const fieldSelectProps = {
  isSearchable: true,
  isClearable: false,
  placeholder: "",
  menuPosition: "fixed" as const,
  menuPortalTarget: typeof document !== "undefined" ? document.body : undefined,
  classNames: {
    control: ({ isFocused }: { isFocused: boolean }) => `
      !min-h-[30px] !h-[30px] !rounded-[4px] !border !shadow-none !text-[12px]
      hover:!border-[#A0DFBD] !bg-white
      ${isFocused ? "!border-[#A0DFBD] !border-[2px]" : "!border-[#cfd7df]"}
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

// Plain list as wide as its box: the default list has a 110px minimum width.
const fitBoxClassNames: ClassNamesConfig<Option, false> = {
  ...comboClassNames,
  menu: () =>
    "!mt-[1px] !rounded-none !border !border-[#cfd7df] !z-[999999] !shadow-md",
};

// Menu for the two-column (label | secondLabel) dropdown. Its width is set
// from the `menuWidth` prop (see styles below), so no min-width class here.
const twoColumnClassNames: ClassNamesConfig<Option, false> = {
  ...comboClassNames,
  menu: () =>
    "!mt-[1px] !rounded-none !border !border-[#cfd7df] !z-[999999] !shadow-md",
  // taller than the default 180px so a short list (heading + a few rows)
  // shows without a scrollbar; it scrolls only if the list gets long.
  menuList: () => "!p-0 !max-h-[260px]",
  // no padding on the row: the two columns carry their own padding, so the
  // divider line runs the full row height and the columns line up.
  option: ({ isFocused, isSelected }) => `
    !cursor-pointer !p-0 !text-[12px] !text-[#24364d]
    ${isSelected ? "!bg-[#e7f7ed]" : isFocused ? "!bg-[#f2faf5]" : "!bg-white"}
  `,
};

export const Combo: React.FC<ComboProps> = ({
  id,
  menuWidth,
  fitMenuToBox = false,
  menuEndId,
  firstColumnWidth,
  secondColumnWidth,
  secondColumnExtra,
  firstHeader = "ID",
  secondHeader = "Name",
  options,
  value,
  onChange,
  className = "w-full",
  disabled = false,
  isSearchable = false,
}) => {
  const hasSecondLabel = options.some((option) => option.secondLabel !== undefined);

  // The divider in the open list sits at the right edge of the closed box,
  // so the first column is as wide as the box itself.
  const boxRef = React.useRef<HTMLDivElement>(null);
  const [boxWidth, setBoxWidth] = React.useState(0);

  React.useEffect(() => {
    const el = boxRef.current;
    if (!el) return;
    const update = () => setBoxWidth(el.getBoundingClientRect().width);
    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Column sizes of the two-column list: either the first column has a fixed
  // width (default: the box width), or the second one does and the first fills.
  const firstFixed = secondColumnWidth === undefined;
  const firstStyle = firstFixed
    ? { width: firstColumnWidth ?? (boxWidth || 44) }
    : undefined;
  const secondStyle = firstFixed ? undefined : { width: secondColumnWidth };
  // Room between the box and the right edge of the window, measured when the
  // list opens. If the extra column does not fit there, the whole list is
  // shifted left by the missing amount, so it is always fully visible.
  const [rightSpace, setRightSpace] = React.useState<number | null>(null);
  const shiftLeft =
    secondColumnExtra !== undefined && rightSpace !== null
      ? Math.max(0, secondColumnExtra - Math.max(rightSpace, 0))
      : 0;
  // Width up to the next field (see menuEndId), measured when the list opens.
  const [endWidth, setEndWidth] = React.useState<number | null>(null);
  const listWidth =
    menuWidth ??
    endWidth ??
    (secondColumnExtra !== undefined
      ? boxWidth + secondColumnExtra
      : boxWidth || 200);
  const firstClass = firstFixed ? "shrink-0" : "min-w-0 flex-1";
  const secondClass = firstFixed ? "min-w-0 flex-1" : "shrink-0";

  // Heading row ("ID | Name") at the top of the two-column list. Same widths
  // as the rows, so the heading lines up with the columns and the divider.
  const TwoColumnMenuList = (props: MenuListProps<Option, false>) => (
    <components.MenuList {...props}>
      <div className="sticky top-0 z-10 flex w-full items-stretch border-b border-[#b8c4d0] bg-[#f3f5f7] font-semibold text-[#344054]">
        <span
          style={firstStyle}
          className={`${firstClass} truncate border-r border-[#b8c4d0] px-[6px] py-[4px] text-[12px]`}
        >
          {firstHeader}
        </span>
        <span
          style={secondStyle}
          className={`${secondClass} truncate px-[8px] py-[4px] text-[12px]`}
        >
          {secondHeader}
        </span>
      </div>
      {props.children}
    </components.MenuList>
  );

  return (
    <div ref={boxRef} className={`min-w-0 ${className}`}>
      <Select<Option, false>
        inputId={id}
        instanceId={id}
        components={
          hasSecondLabel
            ? { ...selectComponents, MenuList: TwoColumnMenuList }
            : selectComponents
        }
        options={options}
        value={options.find((option) => option.value === value) ?? null}
        onChange={(option) => onChange?.(option?.value ?? null)}
        isDisabled={disabled}
        isSearchable={isSearchable}
        isClearable={false}
        placeholder=""
        onMenuOpen={() => {
          const el = boxRef.current;
          if (el && menuEndId) {
            const target = document.getElementById(menuEndId);
            // the label of the next field sits before its box
            const label = target?.parentElement?.parentElement?.firstElementChild;
            const end = (label ?? target)?.getBoundingClientRect().left;
            if (end !== undefined) {
              setEndWidth(Math.max(120, end - 6 - el.getBoundingClientRect().left));
            }
          }
          if (el) {
            setRightSpace(
              document.documentElement.clientWidth - el.getBoundingClientRect().right - 6,
            );
          }
        }}
        classNames={
          hasSecondLabel
            ? twoColumnClassNames
            : fitMenuToBox
              ? fitBoxClassNames
              : comboClassNames
        }
        styles={{
          // The open list must sit above everything on the page, such as the
          // sticky header of the customer grid (z-index 10). react-select's own
          // default for the portal is 1, which let that header cover the list.
          menuPortal: (base) => ({ ...base, zIndex: 999999 }),
          ...(hasSecondLabel
            ? {
                menu: (base) => ({
                  ...base,
                  width: listWidth,
                  minWidth: listWidth,
                  marginLeft: -shiftLeft,
                }),
              }
            : {}),
        }}
        formatOptionLabel={
          hasSecondLabel
            ? (option, { context }) =>
                context === "menu" ? (
                  <div className="flex w-full items-stretch">
                    <span
                      style={firstStyle}
                      className={`${firstClass} truncate border-r border-[#b8c4d0] px-[6px] py-[4px]`}
                    >
                      {option.listFirst ?? option.label}
                    </span>
                    <span
                      style={secondStyle}
                      className={`${secondClass} truncate px-[8px] py-[4px]`}
                    >
                      {option.secondLabel}
                    </span>
                  </div>
                ) : (
                  option.label
                )
            : undefined
        }
        menuPosition="fixed"
        menuPortalTarget={
          typeof document !== "undefined" ? document.body : undefined
        }
      />
    </div>
  );
};

type PairComboProps = {
  idId: string;
  nameId: string;
  idOptions: Option[];
  nameOptions: Option[];
  value: string | null;
  onChange: (value: string | null) => void;
  idWidth?: string;
  nameWidth?: string;
  /** width in px of the ID box's open list, when its options have a secondLabel */
  idMenuWidth?: number;
  /** width in px of the ID column in the ID box's list (default: width of the box) */
  idFirstColumnWidth?: number;
  /** same for the Name box's list (use with options that have secondLabel/listFirst) */
  nameMenuWidth?: number;
  /** width in px of the ID column in the Name box's list */
  nameFirstColumnWidth?: number;
  /** fixed width in px of the second column in the Name box's list */
  nameSecondColumnWidth?: number;
  /** extra px to the right of the Name box for its second column (see Combo) */
  nameSecondColumnExtra?: number;
  /** heading texts of the Name box's list */
  nameFirstHeader?: string;
  nameSecondHeader?: string;
  /**
   * Make both open lists exactly as wide as the pair (ID box + gap + Name box),
   * so a list ends where the next field begins. Needs `containerClassName`.
   */
  fitMenuToPair?: boolean;
  isSearchable?: boolean;
  containerClassName?: string;
};

export const PairCombo: React.FC<PairComboProps> = ({
  idId,
  nameId,
  idOptions,
  nameOptions,
  value,
  onChange,
  idWidth = "w-[92px]",
  nameWidth = "flex-1",
  idMenuWidth,
  idFirstColumnWidth,
  nameMenuWidth,
  nameFirstColumnWidth,
  nameSecondColumnWidth,
  nameSecondColumnExtra,
  nameFirstHeader,
  nameSecondHeader,
  fitMenuToPair = false,
  isSearchable = false,
  containerClassName,
}) => {
  const pairRef = React.useRef<HTMLDivElement>(null);
  const [pairWidth, setPairWidth] = React.useState(0);

  React.useEffect(() => {
    const el = pairRef.current;
    if (!el || !fitMenuToPair) return;
    const update = () => setPairWidth(el.getBoundingClientRect().width);
    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, [fitMenuToPair]);

  const fitted = fitMenuToPair && pairWidth ? pairWidth : undefined;

  const controls = (
    <>
      <Combo
        id={idId}
        menuWidth={fitted ?? idMenuWidth}
        firstColumnWidth={idFirstColumnWidth}
        options={idOptions}
        value={value}
        onChange={onChange}
        className={`${idWidth} shrink-0`}
        isSearchable={isSearchable}
      />

      <Combo
        id={nameId}
        menuWidth={fitMenuToPair ? undefined : nameMenuWidth}
        firstColumnWidth={nameFirstColumnWidth}
        secondColumnWidth={nameSecondColumnWidth}
        secondColumnExtra={nameSecondColumnExtra}
        firstHeader={nameFirstHeader}
        secondHeader={nameSecondHeader}
        options={nameOptions}
        value={value}
        onChange={onChange}
        className={nameWidth}
        isSearchable={isSearchable}
      />
    </>
  );

  return containerClassName ? (
    <div ref={pairRef} className={containerClassName}>
      {controls}
    </div>
  ) : (
    controls
  );
};
