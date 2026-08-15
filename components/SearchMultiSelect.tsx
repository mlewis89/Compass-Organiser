"use client";

import { Dropdown } from "semantic-ui-react";

export type SearchMultiOption = {
  key: string;
  value: string;
  text: string;
  description?: string;
};

type Props = {
  placeholder: string;
  options: SearchMultiOption[];
  value: string[];
  onChange: (ids: string[]) => void;
  disabled?: boolean;
  className?: string;
  "aria-label"?: string;
};

export default function SearchMultiSelect({
  placeholder,
  options,
  value,
  onChange,
  disabled = false,
  className,
  "aria-label": ariaLabel,
}: Props) {
  return (
    <Dropdown
      placeholder={placeholder}
      className={className}
      fluid
      multiple
      search
      selection
      clearable
      options={options}
      value={value}
      disabled={disabled}
      aria-label={ariaLabel}
      onChange={(_event, dropdownData) => {
        const selectedIds = Array.isArray(dropdownData.value)
          ? dropdownData.value.map(String)
          : [];
        onChange(selectedIds);
      }}
    />
  );
}
