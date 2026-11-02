import { MenuItem } from "@mui/material";

import { Partition } from "core/dl/enums";

import { StyledSelect } from "components/inputs";

import { SELECT_PROPS } from "./utils";

import type { SelectChangeEvent } from "@mui/material";

export const ItemPartitionSelect = ({
  currentPartition,
  callback,
}: {
  currentPartition: Partition;
  callback: (partition: Partition) => void;
}) => {
  const handleChange = (event: SelectChangeEvent<unknown>) => {
    const newPartition = event.target.value as Partition;

    if (currentPartition === newPartition) return;
    callback(newPartition);
  };

  return (
    <StyledSelect
      value={currentPartition}
      onChange={(event) => handleChange(event)}
      {...SELECT_PROPS}
    >
      {Object.values(Partition).map((partition) => (
        <MenuItem key={`im-cat-select-${partition}`} value={partition} dense>
          {partition}
        </MenuItem>
      ))}
    </StyledSelect>
  );
};
