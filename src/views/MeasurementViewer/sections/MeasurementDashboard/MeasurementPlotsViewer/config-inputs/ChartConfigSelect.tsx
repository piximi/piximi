import type { ReactNode } from "react";

import type { SelectChangeEvent } from "@mui/material";
import { FormControl, InputLabel, Select } from "@mui/material";

import { formatString } from "utils/stringUtils";
import type { HTMLDataAttributes } from "utils/types";

export const ChartConfigSelect = ({
  label,
  id,
  inputValue,
  defaultValue,
  handleChange,
  selectOptions,
  renderValue,
  ...attrs
}: HTMLDataAttributes & {
  label: string;
  id: string;
  inputValue: string;
  defaultValue: string;
  handleChange: (event: SelectChangeEvent<string>) => void;
  selectOptions: ReactNode;
  renderValue: (value: string) => string;
}) => {
  return (
    <FormControl fullWidth sx={{ pb: 1, mt: 1 }}>
      <InputLabel
        data-help={attrs["data-help"]}
        variant="standard"
        htmlFor={id}
        sx={(theme) => ({
          "& .MuiInputLabel-root": {
            fontSize: theme.typography.body2,
          },
        })}
        size="small"
        shrink={defaultValue || inputValue ? true : false}
      >
        {formatString(label, undefined, "every-word")}
      </InputLabel>
      <Select
        id={id}
        value={inputValue}
        displayEmpty={defaultValue ? true : false}
        size="small"
        variant="standard"
        onChange={handleChange}
        renderValue={renderValue}
        sx={(theme) => ({
          fontSize: theme.typography.body2,
        })}
      >
        {selectOptions}
      </Select>
    </FormControl>
  );
};
