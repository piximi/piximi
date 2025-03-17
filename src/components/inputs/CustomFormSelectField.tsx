import React from "react";
import {
  FormControl,
  FormHelperText,
  MenuItem,
  Select,
  SelectChangeEvent,
} from "@mui/material";

import { enumKeys } from "utils/common/helpers";
import { HelpItem } from "components/layout/HelpDrawer/HelpContent";

type CustomFormSelectFieldProps = {
  keySource: object;
  value: string;
  onChange: (event: SelectChangeEvent) => void;
  disabled?: boolean;
  size?: "small" | "medium";
  helperText?: string;
  helpContext?: HelpItem;
};
export const CustomFormSelectField = ({
  keySource,
  value,
  onChange,
  disabled = false,
  helperText,
  size = "small",
  helpContext,
}: CustomFormSelectFieldProps) => {
  return (
    <FormControl size={size}>
      {helperText && (
        <FormHelperText data-help={helpContext ? helpContext : undefined}>
          {helperText}
        </FormHelperText>
      )}
      <Select
        value={value}
        onChange={onChange}
        disabled={disabled}
        displayEmpty
        inputProps={{ "aria-label": "Without label" }}
      >
        {enumKeys(keySource).map((k) => {
          return (
            <MenuItem key={k} value={keySource[k]}>
              {keySource[k]}
            </MenuItem>
          );
        })}
      </Select>
    </FormControl>
  );
};
