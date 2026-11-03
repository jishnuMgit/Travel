import React from "react";
import Select, { type StylesConfig } from "react-select";
import { fieldSelectProps } from "./Combo";
import selectComponents from "./selectComponents";

export type WideSelectOption = {
  value: string;
  label: string;
};

interface CustomWideSelectProps {
  inputId: string;
  options: WideSelectOption[];
  value: WideSelectOption | null;
  onChange: (option: WideSelectOption | null) => void;
  menuWidth?: string;
  placeholder?: string;
  isDisabled?: boolean;
}

/**
 * Reusable single-select for paired fields (ID + Name).
 * The control keeps its parent width; the dropdown menu can be wider
 * and is portalled to document.body to avoid clipping by parent containers.
 */
const CustomWideSelect: React.FC<CustomWideSelectProps> = ({
  inputId,
  options,
  value,
  onChange,
  menuWidth = "580px",
  placeholder,
  isDisabled = false,
}) => {
  const existingStyles = (
    fieldSelectProps as typeof fieldSelectProps & {
      styles?: StylesConfig<WideSelectOption, false>;
    }
  ).styles;

  const styles: StylesConfig<WideSelectOption, false> = {
    ...existingStyles,
    menu: (base, state) => ({
      ...(existingStyles?.menu
        ? existingStyles.menu(base, state)
        : base),
      width: "100%",
      minWidth: menuWidth,
      zIndex: 9999,
    }),
    menuPortal: (base) => ({
      ...base,
      width: menuWidth,
      zIndex: 9999,
    }),
  };

  return (
    <Select<WideSelectOption, false>
      {...fieldSelectProps}
      inputId={inputId}
      options={options}
      value={value}
      components={selectComponents}
      onChange={onChange}
      placeholder={placeholder}
      isDisabled={isDisabled}
      styles={styles}
      menuPortalTarget={
        typeof document !== "undefined" ? document.body : undefined
      }
      menuPosition="fixed"
    />
  );
};

export default CustomWideSelect;
