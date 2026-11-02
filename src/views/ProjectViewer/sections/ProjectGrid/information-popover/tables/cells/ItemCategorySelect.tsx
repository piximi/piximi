import { useSelector } from "react-redux";

import { MenuItem } from "@mui/material";

import { StyledSelect } from "components/inputs";

import { selectActiveCategories } from "@ProjectViewer/state/reselectors";

import { SELECT_PROPS } from "./utils";

import type { SelectChangeEvent } from "@mui/material";

export const ItemCategorySelect = ({
  currentCategory,
  callback,
}: {
  currentCategory: string;
  callback: (categoryId: string) => void;
}) => {
  const categories = useSelector(selectActiveCategories);

  const handleChange = (event: SelectChangeEvent<unknown>) => {
    const newCategory = event.target.value as string;

    if (currentCategory === newCategory) return;
    callback(newCategory);
  };

  return (
    <StyledSelect
      value={currentCategory}
      onChange={(event) => handleChange(event)}
      {...SELECT_PROPS}
    >
      {Object.values(categories).map((category) => (
        <MenuItem
          key={`im-cat-select-${category.id}`}
          value={category.id}
          dense
        >
          {category.name}
        </MenuItem>
      ))}
    </StyledSelect>
  );
};
