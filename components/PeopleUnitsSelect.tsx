"use client";

import { Dropdown } from "semantic-ui-react";

export type SearchMultiOption = {
  key: string;
  value: string;
  text: string;
};

export type PeopleUnitsValue = {
  personIds: string[];
  unitIds: string[];
};

const PERSON_PREFIX = "person:";
const UNIT_PREFIX = "unit:";

type Props = {
  memberOptions: SearchMultiOption[];
  unitOptions: SearchMultiOption[];
  personIds: string[];
  unitIds: string[];
  onChange: (value: PeopleUnitsValue) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  "aria-label"?: string;
};

function encodePerson(id: string) {
  return `${PERSON_PREFIX}${id}`;
}

function encodeUnit(id: string) {
  return `${UNIT_PREFIX}${id}`;
}

function parseSelection(values: string[]): PeopleUnitsValue {
  const personIds: string[] = [];
  const unitIds: string[] = [];
  for (const value of values) {
    if (value.startsWith(PERSON_PREFIX)) {
      personIds.push(value.slice(PERSON_PREFIX.length));
    } else if (value.startsWith(UNIT_PREFIX)) {
      unitIds.push(value.slice(UNIT_PREFIX.length));
    }
  }
  return { personIds, unitIds };
}

export default function PeopleUnitsSelect({
  memberOptions,
  unitOptions,
  personIds,
  unitIds,
  onChange,
  placeholder = "Search members or units…",
  disabled = false,
  className,
  "aria-label": ariaLabel,
}: Props) {
  const options = [
    ...memberOptions.map((option) => ({
      key: encodePerson(option.value),
      value: encodePerson(option.value),
      text: option.text,
      description: "Person",
    })),
    ...unitOptions.map((option) => ({
      key: encodeUnit(option.value),
      value: encodeUnit(option.value),
      text: option.text,
      description: "Unit",
    })),
  ];
  const value = [
    ...personIds.map(encodePerson),
    ...unitIds.map(encodeUnit),
  ];

  return (
    <Dropdown
      placeholder={placeholder}
      className={className}
      fluid
      multiple
      search={(searchOptions, query) => {
        const needle = query.trim().toLowerCase();
        if (!needle) {
          return searchOptions;
        }
        return searchOptions.filter((option) =>
          String(option.text ?? "")
            .toLowerCase()
            .includes(needle),
        );
      }}
      selection
      clearable
      options={options}
      value={value}
      disabled={disabled}
      aria-label={ariaLabel}
      renderLabel={(item) => ({
        content: item.text,
        className: String(item.value).startsWith(UNIT_PREFIX)
          ? "people-units-label people-units-label-unit"
          : "people-units-label people-units-label-person",
      })}
      onChange={(_event, dropdownData) => {
        const selectedValues = Array.isArray(dropdownData.value)
          ? dropdownData.value.map(String)
          : [];
        onChange(parseSelection(selectedValues));
      }}
    />
  );
}
