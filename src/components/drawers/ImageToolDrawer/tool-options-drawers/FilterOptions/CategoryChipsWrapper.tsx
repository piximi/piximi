import { Box, useTheme } from "@mui/material";
import { FilterChip } from "./FilterChip";
import { Category } from "types";

export const CategoryChipsWrapper = ({
  allCategories,
  filteredCategories,
  removeFilter,
}: {
  allCategories: Record<string, Category>;
  filteredCategories: string[];
  removeFilter: (categoryId: string) => void;
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
      {filteredCategories.map((catId) => {
        return (
          <FilterChip
            key={`cat-filter-chip-${catId}`}
            label={allCategories[catId].name}
            color={allCategories[catId].color}
            removeFilter={() => removeFilter(catId)}
          />
        );
      })}
    </Box>
  );
};
