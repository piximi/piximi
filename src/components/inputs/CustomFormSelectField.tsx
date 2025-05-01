import React from "react";
import {
  FormControl,
  FormHelperText,
  MenuItem,
  Select,
  SelectChangeEvent,
} from "@mui/material";

import { enumKeys } from "utils/common/objectUtils";

type CustomFormSelectFieldProps = {
  keySource: object;
  value: string;
  onChange: (event: SelectChangeEvent) => void;
  disabled?: boolean;
  size?: "small" | "medium";
  helperText?: string;
};
export const CustomFormSelectField = ({
  keySource,
  value,
  onChange,
  disabled = false,
  helperText,
  size = "small",
}: CustomFormSelectFieldProps) => {
  return (
    <FormControl size={size}>
      {helperText && <FormHelperText>{helperText}</FormHelperText>}
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
