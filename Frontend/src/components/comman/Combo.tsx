
import React from "react";
import Select, { type ClassNamesConfig } from "react-select";
import selectComponents from "./selectComponents";

export type Option = { value: string; label: string };

type ComboProps = {
  id: string;
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

export const Combo: React.FC<ComboProps> = ({
  id,
  options,
  value,
  onChange,
  className = "w-full",
  disabled = false,
  isSearchable = false,
}) => (
  <div className={`min-w-0 ${className}`}>
    <Select<Option, false>
      inputId={id}
      instanceId={id}
      components={selectComponents}
      options={options}
      value={options.find((option) => option.value === value) ?? null}
      onChange={(option) => onChange?.(option?.value ?? null)}
      isDisabled={disabled}
      isSearchable={isSearchable}
      isClearable={false}
      placeholder=""
      classNames={comboClassNames}
      menuPosition="fixed"
      menuPortalTarget={
        typeof document !== "undefined" ? document.body : undefined
      }
    />
  </div>
);

type PairComboProps = {
  idId: string;
  nameId: string;
  idOptions: Option[];
  nameOptions: Option[];
  value: string | null;
  onChange: (value: string | null) => void;
  idWidth?: string;
  nameWidth?: string;
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
  isSearchable = false,
  containerClassName,
}) => {
  const controls = (
    <>
      <Combo
        id={idId}
        options={idOptions}
        value={value}
        onChange={onChange}
        className={`${idWidth} shrink-0`}
        isSearchable={isSearchable}
      />

      <Combo
        id={nameId}
        options={nameOptions}
        value={value}
        onChange={onChange}
        className={nameWidth}
        isSearchable={isSearchable}
      />
    </>
  );

  return containerClassName ? (
    <div className={containerClassName}>{controls}</div>
  ) : (
    controls
  );
};
