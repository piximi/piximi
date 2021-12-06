import React from "react";
import { Category, UNKNOWN_CATEGORY_ID } from "../../types/Category";
import { HideOrShowCategoryMenuItem } from "../HideOrShowCategoryMenuItem";
import { HideOtherCategoriesMenuItem } from "../HideOtherCategoriesMenuItem";
import { Divider, Menu, MenuItem, MenuList, Typography } from "@mui/material";

type CategoryMenuProps = {
  anchorElCategoryMenu: any;
  category: Category;
  onCloseCategoryMenu: (
    event: React.MouseEvent<HTMLElement, MouseEvent>
  ) => void;
  onOpenCategoryMenu: (event: React.MouseEvent<HTMLButtonElement>) => void;
  openCategoryMenu: boolean;
  onOpenDeleteCategoryDialog: () => void;
  onOpenEditCategoryDialog: () => void;
};

export const CategoryMenu = ({
  anchorElCategoryMenu,
  category,
  onCloseCategoryMenu,
  openCategoryMenu,
  onOpenDeleteCategoryDialog,
  onOpenEditCategoryDialog,
}: CategoryMenuProps) => {
  const onOpenDeleteCategoryDialogClick = (
    event: React.MouseEvent<HTMLElement, MouseEvent>
  ) => {
    onOpenDeleteCategoryDialog();
    onCloseCategoryMenu(event);
  };

  const onOpenEditCategoryDialogClick = (
    event: React.MouseEvent<HTMLElement, MouseEvent>
  ) => {
    onOpenEditCategoryDialog();
    onCloseCategoryMenu(event);
  };

  return (
    <Menu
      anchorEl={anchorElCategoryMenu}
      anchorOrigin={{ horizontal: "center", vertical: "bottom" }}
      onClose={onCloseCategoryMenu}
      open={openCategoryMenu}
      transformOrigin={{ horizontal: "center", vertical: "top" }}
    >
      <MenuList dense variant="menu">
        <HideOtherCategoriesMenuItem
          category={category}
          onCloseCategoryMenu={onCloseCategoryMenu}
        />

        <HideOrShowCategoryMenuItem
          category={category}
          onCloseCategoryMenu={onCloseCategoryMenu}
        />

        {category.id !== UNKNOWN_CATEGORY_ID && (
          <div>
            <Divider />

            <MenuItem onClick={onOpenEditCategoryDialogClick}>
              <Typography variant="inherit">Edit category</Typography>
            </MenuItem>

            <MenuItem onClick={onOpenDeleteCategoryDialogClick}>
              <Typography variant="inherit">Delete category</Typography>
            </MenuItem>
          </div>
        )}
      </MenuList>
    </Menu>
  );
};
