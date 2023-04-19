import React from "react";

import { Divider, Menu, MenuList } from "@mui/material";

import { HideOrShowCategoryMenuItem } from "../HideOrShowCategoryMenuItem";
import { HideOtherCategoriesMenuItem } from "../HideOtherCategoriesMenuItem";

import { EditCategoryMenuItem } from "../EditCategory";
import { ClearAnnotationMenuItem } from "../ClearAnnotation";

import { Category, CategoryType, UNKNOWN_ANNOTATION_CATEGORY_ID } from "types";
import { useDispatch } from "react-redux";
import { dataSlice } from "store/data";
import { DeleteAnnotationCategoryMenuItem } from "../DeleteCategory/DeleteCategoryMenuItem/DeleteAnnotationCategoryMenuItem";

type CategoryItemMenuProps = {
  anchorElCategoryMenu: any;
  category: Category;
  onCloseCategoryMenu: () => void;
  onOpenCategoryMenu: (event: React.MouseEvent<HTMLButtonElement>) => void;
  openCategoryMenu: boolean;
};

export const AnnotationCategoryItemMenu = ({
  anchorElCategoryMenu,
  category,
  onCloseCategoryMenu,
  openCategoryMenu,
}: CategoryItemMenuProps) => {
  const dispatch = useDispatch();
  const handleHideOtherCategories = (
    event: React.MouseEvent<HTMLElement, MouseEvent>
  ) => {
    dispatch(
      dataSlice.actions.setOtherAnnotationCategoriesInvisible({
        id: category.id,
      })
    );

    onCloseCategoryMenu();
  };
  const handleHideCategory = (
    event: React.MouseEvent<HTMLLIElement, MouseEvent>
  ) => {
    const payload = {
      categoryId: category.id,
      visible: !category.visible,
    };

    dispatch(dataSlice.actions.setAnnotationCategoryVisibility(payload));

    onCloseCategoryMenu();
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
          handleHideOtherCategories={handleHideOtherCategories}
        />

        <HideOrShowCategoryMenuItem
          category={category}
          handleHideCategory={handleHideCategory}
        />

        {category.id !== UNKNOWN_ANNOTATION_CATEGORY_ID && (
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
