import React from "react";

import { MenuItem, Select, SelectChangeEvent } from "@mui/material";
import { enumKeys } from "utils";

type CustomFormSelectFieldProps = {
  keySource: object;
  value: string;
  onChange: (event: SelectChangeEvent) => void;
  disabled?: boolean;
};
export const CustomFormSelectField = ({
  keySource,
  value,
  onChange,
  disabled = false,
}: CustomFormSelectFieldProps) => {
  return (
    <Select
      value={value} //TODO #130 fix so that multiple lossFunctions are shown, if we do have multiple loss functions
      onChange={onChange}
      disabled={disabled}
      displayEmpty
      inputProps={{ "aria-label": "Without label" }}
      sx={(theme) => ({
        flexBasis: 300,
        width: "100%",
        marginRight: theme.spacing(1),
        marginTop: theme.spacing(0),
      })}
    >
      {enumKeys(keySource).map((k) => {
        return (
          <MenuItem key={k} value={keySource[k]}>
            {keySource[k]}
          </MenuItem>
        );
      })}
    </Select>
  );
};
