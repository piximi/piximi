import { Box, Collapse, List, useTheme } from "@mui/material";
import { Label as LabelIcon } from "@mui/icons-material";
import { DividerHeader } from "components/styled-components";
import { CustomListItemButton } from "components/list-items/CustomListItemButton";
import { CategoryChipsWrapper } from "./CategoryChipsWrapper";
import { Category } from "types";
import { useEffect, useState } from "react";

export const FilterCategoriesList = ({
  header,
  allCategories,
  filteredCategories,
  toggleFilter,
  addFilter,
}: {
  header: string;
  allCategories: Record<string, Category>;
  filteredCategories: string[];
  toggleFilter: (categoryId: string) => void;
  addFilter: (categoryId: string) => void;
}) => {
  const theme = useTheme();
  const [unfilteredCategories, setUnfilteredCategories] = useState<string[]>(
    []
  );
  useEffect(() => {
    const unfiltered = Object.keys(allCategories).filter((id) => {
      return !filteredCategories.includes(id);
    });
    setUnfilteredCategories(unfiltered);
  }, [allCategories, filteredCategories]);
  return (
    <Box maxWidth="100%">
      <DividerHeader typographyVariant="caption" textAlign="left">
        {header}
      </DividerHeader>
      <Collapse in={unfilteredCategories.length > 0} timeout="auto">
        <CategoryChipsWrapper
          allCategories={allCategories}
          filteredCategories={unfilteredCategories}
          removeFilter={addFilter}
        />
      </Collapse>

      <List>
        {Object.values(allCategories).map((cat) => {
          return (
            <CustomListItemButton
              key={`cat-filter-list-${cat.id}`}
              primaryText={cat.name}
              primaryTypographyProps={{
                color: filteredCategories.includes(cat.id)
                  ? theme.palette.text.disabled
                  : theme.palette.text.primary,
                variant: "body2",
              }}
              icon={<LabelIcon sx={{ color: cat.color }} />}
              onClick={() => {
                toggleFilter(cat.id);
              }}
              dense
            />
          );
        })}
      </List>
    </Box>
  );
};
