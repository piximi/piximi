import { Box, Collapse, List } from "@mui/material";
import { Label as LabelIcon } from "@mui/icons-material";
import { DividerHeader } from "components/styled-components";
import { CustomListItemButton } from "components/list-items/CustomListItemButton";
import { CategoryChipsWrapper } from "./CategoryChipsWrapper";
import { Category } from "types";

export const FilterCategoriesList = ({
  header,
  allCategories,
  filteredCategories,
  toggleFilter,
  removeFilter,
}: {
  header: string;
  allCategories: Record<string, Category>;
  filteredCategories: string[];
  toggleFilter: (categoryId: string) => void;
  removeFilter: (categoryId: string) => void;
}) => {
  return (
    <Box maxWidth="100%">
      <DividerHeader typographyVariant="caption" textAlign="left">
        {header}
      </DividerHeader>
      <Collapse in={filteredCategories.length > 0} timeout="auto">
        <CategoryChipsWrapper
          allCategories={allCategories}
          filteredCategories={filteredCategories}
          removeFilter={removeFilter}
        />
      </Collapse>

      <List>
        {Object.values(allCategories).map((cat) => {
          return (
            <CustomListItemButton
              key={`cat-filter-list-${cat.id}`}
              primaryText={cat.name}
              primaryTypographyProps={{
                // color: filteredCategories.includes(cat.id)
                //   ? theme.palette.text.disabled
                //   : theme.palette.text.primary,
                variant: "body2",
              }}
              disabled={filteredCategories.includes(cat.id)}
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
