import { Badge, IconButton } from "@mui/material";
import { ExpandLess as ExpandLessIcon } from "@mui/icons-material";

import { FunctionalDivider } from "components/ui";

import { expandToggleStyle } from "./FilterList.styles";

export const SectionHeader = ({
  title,
  hasActiveFilters,
  onExpand: handleExpand,
  expanded,
}: {
  title: string;

  hasActiveFilters: boolean;
  onExpand: () => void;
  expanded: boolean;
}) => {
  return (
    <FunctionalDivider
      headerText={title}
      typographyVariant="body2"
      actions={
        <Badge
          variant="dot"
          color="primary"
          invisible={!hasActiveFilters}
          sx={{
            "& .MuiBadge-badge": {
              top: "50%",
              right: "-15%",
            },
          }}
        >
          <IconButton
            onClick={handleExpand}
            sx={(theme) => expandToggleStyle(theme, expanded)}
          >
            <ExpandLessIcon fontSize="small" />
          </IconButton>
        </Badge>
      }
      containerStyle={{ marginBottom: 0 }}
    />
  );
};
