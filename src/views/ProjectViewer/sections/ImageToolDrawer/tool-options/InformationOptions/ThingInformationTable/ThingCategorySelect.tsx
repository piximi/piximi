import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { MenuItem, SelectChangeEvent } from "@mui/material";

import { selectActiveCategories } from "store/project/reselectors";
import { StyledSelect } from "components/inputs";
import { StyledSelectProps } from "components/inputs/StyledSelect";

export const ThingCategorySelect = ({
  currentCategory,
  callback,
  ...rest
}: {
  currentCategory: string;
  callback: (categoryId: string) => void;
} & StyledSelectProps) => {
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
      {...rest}
      defaultValue={currentCategory}
      value={selectedCategory}
      onChange={(event) => handleChange(event)}
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
