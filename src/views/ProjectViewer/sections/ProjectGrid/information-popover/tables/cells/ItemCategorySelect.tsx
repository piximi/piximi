import { useEffect, useState } from "react";

import { useSelector } from "react-redux";

import type { SelectChangeEvent } from "@mui/material";
import { MenuItem } from "@mui/material";

import { StyledSelect } from "components/inputs";

import { selectActiveCategories } from "@ProjectViewer/state/reselectors";

import { SELECT_PROPS } from "./utils";

export const ItemCategorySelect = ({
  currentCategory,
  callback,
}: {
  currentCategory: string;
  callback: (categoryId: string) => void;
}) => {
  const categories = useSelector(selectActiveCategories);
  const [selectedCategory, setSelectedCategory] =
    useState<string>(currentCategory);

  const handleChange = (event: SelectChangeEvent<unknown>) => {
    const newCategory = event.target.value as string;
    setSelectedCategory(newCategory);
    if (currentCategory !== newCategory) {
      callback(newCategory);
    }
  };
  useEffect(() => {
    setSelectedCategory(currentCategory);
  }, [currentCategory]);

  return (
    <StyledSelect
      defaultValue={currentCategory}
      value={selectedCategory}
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
