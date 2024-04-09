import { Box, useTheme } from "@mui/material";
import { DividerHeader } from "components/styled-components";
import { useSelector } from "react-redux";
import { selectUnfilteredActiveCategoryIds } from "store/project/selectors/selectUnfilteredCategoryIds";
import { FilterChipNew } from "./FilterChipNew";
import { selectCategoriesDictionary } from "store/data/selectors/selectors";

export const CategoryFilterListNew = ({
  header,
  filteredCategories,
  toggleFilter,
}: {
  header: string;
  filteredCategories: string[];
  toggleFilter: (categoryId: string) => void;
}) => {
  const theme = useTheme();
  const unfilteredCategories = useSelector(selectUnfilteredActiveCategoryIds);
  const categories = useSelector(selectCategoriesDictionary);

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
        {filteredCategories.map((catId) => {
          return (
            <FilterChipNew
              key={`cat-filter-chip-${catId}`}
              label={categories[catId].name}
              color={categories[catId].color}
              toggleFilter={() => toggleFilter(catId)}
              isFiltered={true}
            />
          );
        })}
        {unfilteredCategories.map((catId) => {
          return (
            <FilterChipNew
              key={`cat-filter-chip-${catId}`}
              label={categories[catId].name}
              color={categories[catId].color}
              toggleFilter={() => toggleFilter(catId)}
              isFiltered={false}
            />
          );
        })}
      </Box>
    </Box>
  );
};
