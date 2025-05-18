import { Box, IconButton, Stack, useTheme } from "@mui/material";
import {
  VisibilityOutlined as VisibilityOutlinedIcon,
  VisibilityOffOutlined as VisibilityOffOutlinedIcon,
} from "@mui/icons-material";
import { FunctionalDivider } from "components/ui";
import { FilterChip } from "./FilterChip";
import { TooltipWithDisable } from "components/ui/tooltips/TooltipWithDisable";

export const FilterList = ({
  title,
  tooltipContent,
  items,
  onToggle,
  onToggleAll,
  isFiltered,
}: {
  title?: string;
  tooltipContent: string;
  items: Array<any>;
  onToggle: (item: any) => void;
  onToggleAll: (filtered: boolean) => void;
  isFiltered: (item: any | "all" | "any") => boolean;
}) => {
  const theme = useTheme();

  return (
    <Box maxWidth="100%">
      {title && (
        <FunctionalDivider
          headerText={title}
          typographyVariant="caption"
          actions={
            <Stack direction="row">
              <TooltipWithDisable title={`Show all ${tooltipContent}`}>
                <IconButton
                  onClick={() => onToggleAll(false)}
                  disabled={isFiltered("any")}
                >
                  <VisibilityOutlinedIcon fontSize="small" />
                </IconButton>
              </TooltipWithDisable>
              <TooltipWithDisable title="Hide all categories">
                <IconButton
                  onClick={() => onToggleAll(true)}
                  disabled={isFiltered("all")}
                >
                  <VisibilityOffOutlinedIcon fontSize="small" />
                </IconButton>
              </TooltipWithDisable>
            </Stack>
          }
        />
      )}
      <Box
        display="flex"
        maxWidth="100%"
        flexDirection="row"
        flexWrap="wrap"
        gap={theme.spacing(0.5)}
        padding={theme.spacing(1)}
      >
        {items.map((item) => {
          return (
            <FilterChip
              key={`filter-chip-${item.id ?? item}`}
              label={item.name ?? item}
              color={item.color ?? (theme.palette.primary.main as string)}
              toggleFilter={() => onToggle(item)}
              isFiltered={isFiltered(item)}
            />
          );
        })}
      </Box>
    </Box>
  );
};
