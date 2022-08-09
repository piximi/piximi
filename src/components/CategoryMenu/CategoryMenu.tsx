import React from "react";
import {
  Category,
  CategoryType,
  UNKNOWN_ANNOTATION_CATEGORY_ID,
  UNKNOWN_CATEGORY_ID,
} from "types/Category";
import { HideOrShowCategoryMenuItem } from "../HideOrShowCategoryMenuItem";
import { HideOtherCategoriesMenuItem } from "../HideOtherCategoriesMenuItem";
import { Divider, Menu, MenuList } from "@mui/material";
import { DeleteCategoryMenuItem } from "components/DeleteCategoryMenuItem";
import { EditCategoryMenuItem } from "components/EditCategoryMenuItem";
import { ClearAnnotationMenuItem } from "components/ClearCategoryMenuItem";

type CategoryMenuProps = {
  anchorElCategoryMenu: any;
  category: Category;
  categoryType: CategoryType;
  onCloseCategoryMenu: () => void;
  onOpenCategoryMenu: (event: React.MouseEvent<HTMLButtonElement>) => void;
  openCategoryMenu: boolean;
};

export const CategoryMenu = ({
  anchorElCategoryMenu,
  category,
  categoryType,
  onCloseCategoryMenu,
  openCategoryMenu,
}: CategoryMenuProps) => {
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

        {category.id !== UNKNOWN_CATEGORY_ID &&
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
