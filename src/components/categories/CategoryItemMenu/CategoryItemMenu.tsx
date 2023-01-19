import React from "react";

import { Divider, Menu, MenuList } from "@mui/material";

import { HideOrShowCategoryMenuItem } from "../HideOrShowCategoryMenuItem";
import { HideOtherCategoriesMenuItem } from "../HideOtherCategoriesMenuItem";

import { DeleteCategoryMenuItem } from "../DeleteCategory";
import { EditCategoryMenuItem } from "../EditCategory";
import { ClearAnnotationMenuItem } from "../ClearAnnotation";

import {
  Category,
  CategoryType,
  UNKNOWN_ANNOTATION_CATEGORY_ID,
  UNKNOWN_CLASS_CATEGORY_ID,
} from "types";

type CategoryItemMenuProps = {
  anchorElCategoryMenu: any;
  category: Category;
  categoryType: CategoryType;
  onCloseCategoryMenu: () => void;
  onOpenCategoryMenu: (event: React.MouseEvent<HTMLButtonElement>) => void;
  openCategoryMenu: boolean;
};

export const CategoryItemMenu = ({
  anchorElCategoryMenu,
  category,
  categoryType,
  onCloseCategoryMenu,
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
        <HideOtherCategoriesMenuItem
          category={category}
          categoryType={categoryType}
          onCloseCategoryMenu={onCloseCategoryMenu}
        />

        <HideOrShowCategoryMenuItem
          category={category}
          categoryType={categoryType}
          onCloseCategoryMenu={onCloseCategoryMenu}
        />

        {category.id !== UNKNOWN_CLASS_CATEGORY_ID &&
          category.id !== UNKNOWN_ANNOTATION_CATEGORY_ID && (
            <div>
              <Divider />

              <DeleteCategoryMenuItem
                category={category}
                categoryType={categoryType}
                onCloseCategoryMenu={onCloseCategoryMenu}
              />

              <EditCategoryMenuItem
                category={category}
                categoryType={categoryType}
                onCloseCategoryMenu={onCloseCategoryMenu}
              />

              {categoryType === CategoryType.AnnotationCategory && (
                <ClearAnnotationMenuItem
                  category={category}
                  onCloseCategoryMenu={onCloseCategoryMenu}
                />
              )}
            </div>
          )}
      </MenuList>
    </Menu>
  );
};
