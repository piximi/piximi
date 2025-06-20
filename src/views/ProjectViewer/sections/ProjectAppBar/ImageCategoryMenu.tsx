import React from "react";
import { Menu, MenuItem, MenuList, PopoverReference } from "@mui/material";
import { Label as LabelIcon } from "@mui/icons-material";

import { Category } from "store/data/types";

type ImageCategoryMenuProps = {
  anchorEl?: HTMLElement;
  onClose: () => void;
  anchorReference?: PopoverReference;
  anchorPosition?: { top: number; left: number };
  open: boolean;
  container?: Element | null;
  categories: Category[];
  onUpdateCategories: (categoryId: string) => void;
};

export const ImageCategoryMenu = ({
  anchorEl,
  onClose,
  anchorReference,
  anchorPosition,
  open,
  container,
  categories,
  onUpdateCategories: handleUpdateCategories,
}: ImageCategoryMenuProps) => {
  const handleUpdateCategoriesAndClose = (categoryId: string) => {
    onClose();

    handleUpdateCategories(categoryId);
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
            onClick={() => handleUpdateCategoriesAndClose(category.id)}
          >
            <LabelIcon style={{ color: category.color, paddingRight: "8px" }} />
            {category.name}
          </MenuItem>
        ))}
      </MenuList>
    </Menu>
  );
};
