import React from "react";
import { useDispatch, useSelector } from "react-redux";

import { Menu, MenuItem, MenuList, PopoverReference } from "@mui/material";
import LabelIcon from "@mui/icons-material/Label";

import { applicationSlice } from "store/application";
import { dataSlice, selectAllCategories } from "store/data";

import { Category } from "types";

type ImageCategoryMenuProps = {
  anchorEl?: HTMLElement;
  imageIds: Array<string>;
  onClose: () => void;
  anchorReference?: PopoverReference;
  anchorPosition?: { top: number; left: number };
  open: boolean;
  container?: Element | null;
};

export const ImageCategoryMenu = ({
  anchorEl,
  imageIds,
  onClose,
  anchorReference,
  anchorPosition,
  open,
  container,
}: ImageCategoryMenuProps) => {
  const categories = useSelector(selectAllCategories);

  const dispatch = useDispatch();

  const onClick = (
    event: React.MouseEvent<HTMLLIElement>,
    categoryId: string
  ) => {
    onClose();

    dispatch(
      dataSlice.actions.updateImageCategories({
        imageIds: imageIds,
        categoryId: categoryId,
      })
    );
    dispatch(applicationSlice.actions.clearSelectedImages());
  };

  return (
    <Menu
      anchorReference={anchorReference}
      anchorPosition={anchorPosition}
      anchorOrigin={{
        horizontal: "center",
        vertical: "bottom",
      }}
      transformOrigin={{
        horizontal: "center",
        vertical: "top",
      }}
      anchorEl={anchorEl}
      open={open}
      onClose={onClose}
      container={container}
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
