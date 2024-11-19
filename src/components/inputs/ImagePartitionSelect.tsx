import { useEffect, useState } from "react";
import { MenuItem, SelectChangeEvent } from "@mui/material";
import { StyledSelect, StyledSelectProps } from "./StyledSelect";
import { Partition } from "utils/models/enums";

export const ImagePartitionSelect = ({
  currentPartition,
  callback,
  ...rest
}: {
  currentPartition: Partition;
  callback: (partition: Partition) => void;
} & StyledSelectProps) => {
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
      {...rest}
      defaultValue={currentPartition}
      value={selectedPartition}
      onChange={(event) => handleChange(event)}
    >
      {Object.values(Partition).map((partition) => (
        <MenuItem key={`im-cat-select-${partition}`} value={partition} dense>
          {partition}
        </MenuItem>
      ))}
    </StyledSelect>
  );
};
