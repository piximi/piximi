import { Box, useTheme } from "@mui/material";
import { FilterChip } from "./FilterChip";
import { Partition } from "types";

export const PartitionChipsWrapper = ({
  filteredPartitions,
  removeFilter,
}: {
  filteredPartitions: Partition[];
  removeFilter: (partition: Partition) => void;
}) => {
  const theme = useTheme();
  return (
    <Box
      display="flex"
      maxWidth="100%"
      flexDirection="row"
      flexWrap="wrap"
      gap={theme.spacing(0.5)}
      padding={theme.spacing(1)}
    >
      {filteredPartitions.map((partition) => {
        return (
          <FilterChip
            key={`cat-filter-chip-${partition}`}
            label={partition}
            removeFilter={() => removeFilter(partition)}
          />
        );
      })}
    </Box>
  );
};
