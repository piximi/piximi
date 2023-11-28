import { Box, List, useTheme } from "@mui/material";
import { DividerHeader } from "components/styled-components";
import { CustomListItemButton } from "components/list-items/CustomListItemButton";
import { PartitionChipsWrapper } from "./PartitionChipsWrapper";
import { Partition } from "types";

export const PartitionFilterList = ({
  header,
  filteredPartitions,
  toggleFilter,
  removeFilter,
}: {
  header: string;
  filteredPartitions: Partition[];
  toggleFilter: (partition: Partition) => void;
  removeFilter: (partition: Partition) => void;
}) => {
  const theme = useTheme();
  return (
    <Box maxWidth="100%">
      <DividerHeader typographyVariant="caption" textAlign="left">
        {header}
      </DividerHeader>
      {filteredPartitions.length > 0 && (
        <PartitionChipsWrapper
          filteredPartitions={filteredPartitions}
          removeFilter={removeFilter}
        />
      )}
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
