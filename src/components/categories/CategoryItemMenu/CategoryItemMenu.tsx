import React from "react";

import { Divider, Menu, MenuItem, MenuList, Typography } from "@mui/material";

import { EditCategoryMenuItem } from "../EditCategory";
import { ClearAnnotationMenuItem } from "../ClearAnnotation";
import { DeleteAnnotationCategoryMenuItem } from "../DeleteCategory/DeleteCategoryMenuItem/DeleteAnnotationCategoryMenuItem";

import { Category, CategoryType, UNKNOWN_CATEGORY_NAME } from "types";

type CategoryItemMenuProps = {
  anchorElCategoryMenu: any;
  category: Category;
  categoryHidden: boolean;
  onCloseCategoryMenu: () => void;
  handleHideOtherCategories: (
    event: React.MouseEvent<HTMLElement, MouseEvent>,
    category: Category
  ) => void;
  handleHideCategory: (
    event: React.MouseEvent<HTMLLIElement, MouseEvent>,
    category: Category
  ) => void;
  openCategoryMenu: boolean;
};

export const CategoryItemMenu = ({
  anchorElCategoryMenu,
  category,
  categoryHidden,
  onCloseCategoryMenu,
  handleHideOtherCategories,
  handleHideCategory,
  openCategoryMenu,
}: CategoryItemMenuProps) => {
  return (
    <Menu
      anchorEl={anchorElCategoryMenu}
      anchorOrigin={{ horizontal: "center", vertical: "bottom" }}
      onClose={onCloseCategoryMenu}
      open={openCategoryMenu}
      transformOrigin={{ horizontal: "center", vertical: "top" }}
    >
      <MenuList dense variant="menu">
        <MenuItem
          onClick={(event) => {
            handleHideOtherCategories(event, category);
          }}
        >
          <Typography variant="inherit">Hide other categories</Typography>
        </MenuItem>

        <MenuItem
          onClick={(event) => {
            handleHideCategory(event, category);
          }}
        >
          <Typography variant="inherit">
            {categoryHidden ? "Show" : "Hide"} category
          </Typography>
        </MenuItem>

        {category.name !== UNKNOWN_CATEGORY_NAME && (
          <div>
            <Divider />

            <DeleteAnnotationCategoryMenuItem
              category={category}
              onCloseCategoryMenu={onCloseCategoryMenu}
            />

            <EditCategoryMenuItem
              category={category}
              categoryType={CategoryType.AnnotationCategory}
              onCloseCategoryMenu={onCloseCategoryMenu}
            />

            <ClearAnnotationMenuItem
              category={category}
              onCloseCategoryMenu={onCloseCategoryMenu}
            />
          </div>
        )}
      </MenuList>
    </Menu>
  );
};
