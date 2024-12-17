import { useSelector } from "react-redux";
import { Box, useTheme } from "@mui/material";

import { DividerHeader } from "components/ui";
import { FilterChip } from "./FilterChip";

import { selectUnfilteredActivePartitions } from "store/project/selectors";

import { Partition } from "utils/models/enums";

export const PartitionFilterList = ({
  header,
  filteredPartitions,
  toggleFilter,
}: {
  header: string;
  filteredPartitions: Partition[];
  toggleFilter: (partition: Partition) => void;
}) => {
  const theme = useTheme();
  const unfilteredPartitions = useSelector(selectUnfilteredActivePartitions);

  return (
    <Box maxWidth="100%">
      <DividerHeader typographyVariant="caption" textAlign="left">
        {header}
      </DividerHeader>
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
              color={theme.palette.primary.main as string}
              toggleFilter={() => toggleFilter(partition)}
              isFiltered={true}
            />
          );
        })}
        {unfilteredPartitions.map((partition) => {
          return (
            <FilterChip
              key={`cat-filter-chip-${partition}`}
              label={partition}
              color={theme.palette.primary.main as string}
              toggleFilter={() => toggleFilter(partition)}
              isFiltered={false}
            />
          );
        })}
      </Box>
    </Box>
  );
};
