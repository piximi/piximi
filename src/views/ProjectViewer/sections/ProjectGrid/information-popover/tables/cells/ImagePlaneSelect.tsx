import { useEffect, useState } from "react";

import type { SelectChangeEvent } from "@mui/material";
import { MenuItem } from "@mui/material";

import { StyledSelect } from "components/inputs";

import { SELECT_PROPS } from "./utils";

export const ImagePlaneSelect = ({
  currentIndex,
  indexOptions,
  callback,
}: {
  currentIndex: number;
  indexOptions: number[];
  callback: (index: number) => void;
}) => {
  const [selectedIndex, setSelectedIndex] = useState<number>(currentIndex);

  const handleChange = (event: SelectChangeEvent<unknown>) => {
    const newIndex = event.target.value as number;
    setSelectedIndex(newIndex);
    if (currentIndex !== newIndex) {
      callback(newIndex);
    }
  };

  useEffect(() => {
    setSelectedIndex(currentIndex);
  }, [currentIndex]);

  return (
    <StyledSelect
      defaultValue={currentIndex}
      value={selectedIndex}
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
