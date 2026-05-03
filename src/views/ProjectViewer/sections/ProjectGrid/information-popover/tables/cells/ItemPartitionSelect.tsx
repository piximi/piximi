import { useEffect, useState } from "react";

import type { SelectChangeEvent } from "@mui/material";
import { MenuItem } from "@mui/material";

import { StyledSelect } from "components/inputs";

import { Partition } from "utils/dl/enums";

import { SELECT_PROPS } from "./utils";

export const ItemPartitionSelect = ({
  currentPartition,
  callback,
}: {
  currentPartition: Partition;
  callback: (partition: Partition) => void;
}) => {
  const [selectedPartition, setSelectedPartition] =
    useState<Partition>(currentPartition);

  const handleChange = (event: SelectChangeEvent<unknown>) => {
    const newPartition = event.target.value as Partition;
    setSelectedPartition(newPartition);
    if (currentPartition !== newPartition) {
      callback(newPartition);
    }
  };

  useEffect(() => {
    setSelectedPartition(currentPartition);
  }, [currentPartition]);

  return (
    <StyledSelect
      defaultValue={currentPartition}
      value={selectedPartition}
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
