import { useSelector } from "react-redux";
import { StyledSelect, StyledSelectProps } from "./StyledSelect";
import { useState } from "react";
import { selectAllImageCategories } from "store/slices/data";
import { MenuItem, SelectChangeEvent } from "@mui/material";

export const ImageCategorySelect = ({
  currentCategory,
  callback,
  ...rest
}: {
  currentCategory: string;
  callback: (categoryId: string) => void;
} & StyledSelectProps) => {
  const imageCategories = useSelector(selectAllImageCategories);
  const [selectedCategory, setSelectedCategory] =
    useState<string>(currentCategory);

  const handleChange = (event: SelectChangeEvent<unknown>) => {
    const newCategory = event.target.value as string;
    setSelectedCategory(newCategory);
    if (currentCategory !== newCategory) {
      callback(newCategory);
    }
  };

  return (
    <StyledSelect
      {...rest}
      defaultValue={currentCategory}
      value={selectedCategory}
      onChange={(event) => handleChange(event)}
    >
      {Object.values(imageCategories).map((category) => (
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
