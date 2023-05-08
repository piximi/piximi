import React from "react";

import { Divider, Menu, MenuItem, MenuList, Typography } from "@mui/material";

import { useDialogHotkey } from "hooks";
import {
  DialogWithAction,
  UpsertCategoriesDialog,
} from "components/common/dialogs";

import { Category, UNKNOWN_CATEGORY_NAME, PartialBy, HotkeyView } from "types";

type CategoryItemMenuProps = {
  anchorElCategoryMenu: any;
  category: Category;
  categoryHidden: boolean;
  handleCloseCategoryMenu: () => void;
  handleHideOtherCategories: (category: Category) => void;
  handleHideCategory: (category: Category) => void;
  openCategoryMenu: boolean;
  usedCategoryInfo: { names: string[]; colors: string[] };
  dispatchDeleteObjectsOfCategory: (categoryId: string) => void;
  dispatchDeleteCategories: (categories: Category | Category[]) => void;
  dispatchUpsertCategory: (
    category: PartialBy<Category, "id" | "visible">
  ) => void;
};

export const CategoryItemMenu = ({
  anchorElCategoryMenu,
  category,
  categoryHidden,
  handleCloseCategoryMenu,
  handleHideOtherCategories,
  handleHideCategory,
  openCategoryMenu,
  usedCategoryInfo,
  dispatchDeleteObjectsOfCategory,
  dispatchDeleteCategories,
  dispatchUpsertCategory,
}: CategoryItemMenuProps) => {
  const {
    onClose: hendleCloseEditCategoryDialog,
    onOpen: handleOpenEditCategoryDialog,
    open: isEditCategoryDialogOpen,
  } = useDialogHotkey(HotkeyView.EditCategoryDialog);
  const {
    onClose: handleCloseDeleteCategoryDialog,
    onOpen: handleOpenDeleteCategoryDialog,
    open: isDeleteCategoryDialogOpen,
  } = useDialogHotkey(HotkeyView.DeleteCategoryDialog);
  const handleDeleteCategory = () => {
    dispatchDeleteCategories(category);
  };
  const {
    onClose: handleCloseDialogWithAction,
    onOpen: handleOpenDialogWithAction,
    open: isDialogWithActionOpen,
  } = useDialogHotkey(HotkeyView.DeleteCategoryDialog);
  const handleDeleteObjects = () => {
    dispatchDeleteObjectsOfCategory(category.id);
  };

  const handleMenuCloseWith = (dialogClose: () => void) => {
    dialogClose();
    handleCloseCategoryMenu();
  };
  return (
    <Menu
      anchorEl={anchorElCategoryMenu}
      anchorOrigin={{ horizontal: "center", vertical: "bottom" }}
      onClose={handleCloseCategoryMenu}
      open={openCategoryMenu}
      transformOrigin={{ horizontal: "center", vertical: "top" }}
    >
      <MenuList dense variant="menu">
        <MenuItem
          onClick={() => {
            handleHideOtherCategories(category);
          }}
        >
          <Typography variant="inherit">Hide Other Categories</Typography>
        </MenuItem>

        <MenuItem
          onClick={() => {
            handleHideCategory(category);
          }}
        >
          <Typography variant="inherit">
            {categoryHidden ? "Show" : "Hide"} Category
          </Typography>
        </MenuItem>

        {category.name !== UNKNOWN_CATEGORY_NAME && (
          <div>
            <Divider />

            <MenuItem onClick={handleOpenDeleteCategoryDialog}>
              <Typography variant="inherit">Delete Category</Typography>
            </MenuItem>

            <MenuItem onClick={handleOpenEditCategoryDialog}>
              <Typography variant="inherit">Edit Category</Typography>
            </MenuItem>

            <MenuItem onClick={handleOpenDialogWithAction}>
              <Typography variant="inherit">Clear Annotations</Typography>
            </MenuItem>
          </div>
        )}
      </MenuList>
      <UpsertCategoriesDialog
        category={category}
        usedCategoryInfo={usedCategoryInfo}
        dispatchUpsertCategory={dispatchUpsertCategory}
        onClose={() => handleMenuCloseWith(hendleCloseEditCategoryDialog)}
        open={isEditCategoryDialogOpen}
      />
      <DialogWithAction
        title={`Delete "${category.name}" Category`}
        content={`Objects categorized as "${category.name}" will NOT be deleted, and instead will be labeled as
        "Unknown".`}
        handleConfirmCallback={handleDeleteCategory}
        onClose={() => handleMenuCloseWith(handleCloseDeleteCategoryDialog)}
        open={isDeleteCategoryDialogOpen}
      />
      <DialogWithAction
        title={`Delete All "${category.name}" Objects`}
        content={`Objects categorized as "${category.name}" will be deleted.`}
        handleConfirmCallback={handleDeleteObjects}
        onClose={() => handleMenuCloseWith(handleCloseDialogWithAction)}
        open={isDialogWithActionOpen}
      />
    </Menu>
  );
};
