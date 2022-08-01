import React from "react";
import { useDispatch, useSelector } from "react-redux";

import { Menu, MenuItem, MenuList } from "@mui/material";
import LabelIcon from "@mui/icons-material/Label";

import { categoriesSelector } from "store/selectors";

import { applicationSlice, updateImageCategories } from "store/slices";

import { Category } from "types/Category";

type ImageCategoryMenuProps = {
  anchorEl: HTMLElement;
  imageIds: Array<string>;
  onClose: () => void;
};

export const ImageCategoryMenu = ({
  anchorEl,
  imageIds,
  onClose,
}: ImageCategoryMenuProps) => {
  const categories = useSelector(categoriesSelector);

  const dispatch = useDispatch();

  const onClick = (
    event: React.MouseEvent<HTMLLIElement>,
    categoryId: string
  ) => {
    onClose();

    dispatch(updateImageCategories({ ids: imageIds, categoryId: categoryId }));
    dispatch(applicationSlice.actions.clearSelectedImages());
  };

  return (
    <Menu
      anchorOrigin={{
        horizontal: "center",
        vertical: "bottom",
      }}
      transformOrigin={{
        horizontal: "center",
        vertical: "top",
      }}
      anchorEl={anchorEl}
      open={Boolean(anchorEl)}
      onClose={onClose}
    >
      <MenuList dense variant="menu">
        {categories.map((category: Category) => (
          <MenuItem
            key={category.id}
            onClick={(event: any) => onClick(event, category.id)}
          >
            <LabelIcon style={{ color: category.color, paddingRight: "8px" }} />
            {category.name}
          </MenuItem>
        ))}
      </MenuList>
    </Menu>
  );
};
