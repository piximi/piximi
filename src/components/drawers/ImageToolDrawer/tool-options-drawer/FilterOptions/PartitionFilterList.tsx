import { Box, Collapse, List, useTheme } from "@mui/material";
import { DividerHeader } from "components/styled-components";
import { CustomListItemButton } from "components/list-items/CustomListItemButton";
import { PartitionChipsWrapper } from "./PartitionChipsWrapper";
import { Partition } from "types";
import { useEffect, useState } from "react";

export const PartitionFilterList = ({
  header,
  filteredPartitions,
  toggleFilter,
  addFilter,
}: {
  header: string;
  filteredPartitions: Partition[];
  toggleFilter: (partition: Partition) => void;
  addFilter: (partition: Partition) => void;
}) => {
  const theme = useTheme();
  const [unfilteredPartitions, setUnfilteredPartitions] = useState<Partition[]>(
    []
  );
  useEffect(() => {
    setUnfilteredPartitions(
      Object.entries(Partition).reduce(
        (unfiltered: Partition[], entry: [string, Partition]) => {
          if (!filteredPartitions.includes(entry[1])) {
            unfiltered.push(entry[1]);
          }
          return unfiltered;
        },
        []
      )
    );
  }, [filteredPartitions]);
  return (
    <Box maxWidth="100%">
      <DividerHeader typographyVariant="caption" textAlign="left">
        {header}
      </DividerHeader>
      <Collapse in={unfilteredPartitions.length > 0} timeout="auto">
        <PartitionChipsWrapper
          filteredPartitions={unfilteredPartitions}
          removeFilter={addFilter}
        />
      </Collapse>

      <List>
        {Object.entries(Partition).map((partition) => {
          return (
            <CustomListItemButton
              key={`ip-filter-list-${partition}`}
              primaryText={partition[0]}
              primaryTypographyProps={{
                color: filteredPartitions.includes(partition[1])
                  ? theme.palette.text.disabled
                  : theme.palette.text.primary,
                variant: "body2",
              }}
              onClick={() => {
                toggleFilter(partition[1]);
              }}
              dense
            />
          );
        })}
      </List>
    </Box>
  );
};
