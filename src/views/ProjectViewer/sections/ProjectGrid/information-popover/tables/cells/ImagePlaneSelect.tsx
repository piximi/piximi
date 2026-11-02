import { MenuItem } from "@mui/material";

import { StyledSelect } from "components/inputs";

import { SELECT_PROPS } from "./utils";

import type { SelectChangeEvent } from "@mui/material";

export const ImagePlaneSelect = ({
  currentIndex,
  indexOptions,
  callback,
}: {
  currentIndex: number;
  indexOptions: number[];
  callback: (index: number) => void;
}) => {
  const handleChange = (event: SelectChangeEvent<unknown>) => {
    const newIndex = event.target.value as number;

    if (currentIndex === newIndex) return;
    callback(newIndex);
  };

  return (
    <StyledSelect
      value={currentIndex}
      onChange={(event) => handleChange(event)}
      {...SELECT_PROPS}
    >
      {indexOptions.map((index) => (
        <MenuItem key={`im-plane-select-${index}`} value={index} dense>
          {index}
        </MenuItem>
      ))}
    </StyledSelect>
  );
};
