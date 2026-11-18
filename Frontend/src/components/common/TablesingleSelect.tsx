
import Select, {
  components,
  type StylesConfig,
  type OptionProps,
  type MenuListProps,
} from "react-select";

import selectComponents from "./selectComponents";

export interface TableSelectOption {
  label: string;
  value: string;
  [key: string]: any;
}

interface Column {
  key: string;
  label: string;
  width?: string;
  align?: "left" | "center" | "right";
  borderRight?: string;
}

interface TablesingleSelectProps {
  options: TableSelectOption[];
  value: TableSelectOption | null;
  onChange: (value: TableSelectOption | null) => void;
  columns: Column[];
  placeholder?: string;
  width?: string;
  menuWidth?: string;
  isClearable?: boolean;
  isSearchable?: boolean;
  isDisabled?: boolean;
  inputId?: string;
  headerFontSize?: string;
  ariaLabel?: string;
}

const TablesingleSelect = ({
  options,
  value,
  onChange,
  columns,
  placeholder = "Select...",
  width = "250px",
  menuWidth = "305px",
  isClearable = false,
  isSearchable = true,
  isDisabled = false,
  inputId,
  headerFontSize = "13px",
  ariaLabel,
}: TablesingleSelectProps) => {

  const gridTemplate = columns
    .map((col) => col.width || "1fr")
    .join(" ");

  // Reusable column alignment
  const getAlignment = (align?: Column["align"]) => {
    switch (align) {
      case "right":
        return "text-right";
      case "center":
        return "text-center";
      default:
        return "text-left";
    }
  };

  // Reusable column border
  const getColumnStyle = (col: Column) => ({
    borderRight: col.borderRight || "none",
    padding: "7px 10px",
    boxSizing: "border-box" as const,
    minWidth: 0,
  });

  const customComponents = {
    Option: (props: OptionProps<TableSelectOption, false>) => (
      <components.Option {...props}>
        <div
          className="grid items-center w-full"
          style={{
            gridTemplateColumns: gridTemplate,
            fontSize: headerFontSize,
          }}
        >
            
          {columns.map((col) => (
            <span
              key={col.key}
              className={`truncate ${getAlignment(col.align)}`}
              style={getColumnStyle(col)}
            >
              {props.data[col.key] ?? "-"}
            </span>
          ))}
        </div>
      </components.Option>
    ),

    MenuList: (props: MenuListProps<TableSelectOption, false>) => (
      <components.MenuList {...props}>
        {/* Header */}
        <div
          className="grid items-center bg-[#F3F5F7] border-b border-[#D5DDE5] font-semibold text-[#334155]"
          style={{
            gridTemplateColumns: gridTemplate,
            fontSize: headerFontSize,
          }}
        >
          {columns.map((col) => (
            <span
              key={col.key}
              className={`truncate ${getAlignment(col.align)}`}
              style={getColumnStyle(col)}
            >
              {col.label}
            </span>
          ))}
        </div>

        {props.children}
      </components.MenuList>
    ),
  };

  const styles: StylesConfig<TableSelectOption, false> = {
    control: (base, state) => ({
      ...base,
      minHeight: "31px",
      height: "31px",
      width: width,
      borderColor: state.isFocused ? "#75E9C2" : "#CBD5E1",
      borderRadius: "0px",
      boxShadow: state.isFocused ? "inset 0 0 0 1px #75E9C2" : "none",
      fontSize: "13px",
      position: "relative",
      zIndex: state.isFocused ? 2 : 0,
      "&:hover": {
        borderColor: state.isFocused ? "#75E9C2" : "#94A3B8",
      },
    }),

    valueContainer: (base) => ({
      ...base,
      padding: "0 10px",
    }),

    indicatorsContainer: (base) => ({
      ...base,
      height: "30px",
      display: "none",
    }),

    menu: (base) => ({
      ...base,
      width: menuWidth,
      minWidth: menuWidth,
      marginTop: "4px",
      borderRadius: "0px",
      border: "1px solid #E5E7EB",
      boxShadow: "0 4px 10px rgba(0,0,0,0.12)",
      zIndex: 9999,
      overflow: "hidden",
    }),

    menuList: (base) => ({
      ...base,
      padding: 0,
      maxHeight: "220px",
    }),

    option: (base, state) => ({
      ...base,
      padding: 0,
      fontSize: "13px",
      color: "#334155",
      backgroundColor: state.isSelected
        ? "#EAF7F0"
        : state.isFocused
          ? "#F0F8F4"
          : "#FFFFFF",
      cursor: "pointer",
      borderBottom: "1px solid #E5E7EB",
      "&:active": {
        backgroundColor: "#DDF2E7",
      },
    }),

    singleValue: (base) => ({
      ...base,
      color: "#334155",
    }),
  };

  return (
    <Select<TableSelectOption, false>
      inputId={inputId}
      aria-label={ariaLabel}
      options={options}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      components={{
        ...selectComponents,
        ...customComponents,
      }}
      styles={styles}
      isClearable={isClearable}
      isSearchable={isSearchable}
      isDisabled={isDisabled}
      getOptionLabel={(option) => option.label}
      getOptionValue={(option) => option.value}
    />
  );
};

export default TablesingleSelect;
