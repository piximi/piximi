import React from "react";

import { Box, Menu, MenuItem, MenuList, Typography } from "@mui/material";

import { useDialogHotkey } from "hooks";
import { DialogWithAction, UpsertCategoriesDialog } from "components/dialogs";

import { Category, UNKNOWN_CATEGORY_NAME, PartialBy, HotkeyView } from "types";

type CategoryItemMenuProps = {
  anchorElCategoryMenu: any;
  category: Category;
  categoryHidden: boolean;
  handleCloseCategoryMenu: () => void;
  handleHideOtherCategories: (category: Category) => void;
  handleHideCategory: (category: Category) => void;
  openCategoryMenu: boolean;
  usedCategoryColors: string[];
  usedCategoryNames: string[];
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
  usedCategoryColors,
  usedCategoryNames,
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
      anchorOrigin={{ horizontal: "left", vertical: "bottom" }}
      onClose={handleCloseCategoryMenu}
      open={openCategoryMenu}
      transformOrigin={{ horizontal: "left", vertical: "top" }}
      MenuListProps={{ sx: { py: 0 } }}
    >
      <MenuList dense variant="menu" sx={{ py: 0 }}>
        <CategoryMenuItem
          onClick={() => {
            handleHideCategory(category);
          }}
          label={categoryHidden ? "Show" : "Hide"}
        />

        <CategoryMenuItem
          onClick={() => {
            handleHideOtherCategories(category);
          }}
          label="Hide Other"
        />

        {category.name !== UNKNOWN_CATEGORY_NAME && (
          <Box>
            <CategoryMenuItem
              onClick={handleOpenDeleteCategoryDialog}
              label="Delete"
            />

            <CategoryMenuItem
              onClick={handleOpenEditCategoryDialog}
              label="Edit"
            />

            <CategoryMenuItem
              onClick={handleOpenDialogWithAction}
              label="Clear Annotations"
            />
          </Box>
        )}
      </MenuList>
      <UpsertCategoriesDialog
        category={category}
        usedCategoryColors={usedCategoryColors}
        usedCategoryNames={usedCategoryNames}
        dispatchUpsertCategory={dispatchUpsertCategory}
        onClose={() => handleMenuCloseWith(hendleCloseEditCategoryDialog)}
        open={isEditCategoryDialogOpen}
      />
      <DialogWithAction
        title={`Delete "${category.name}" Category`}
        content={`Objects categorized as "${category.name}" will NOT be deleted, and instead will be labeled as
        "Unknown".`}
        onConfirm={handleDeleteCategory}
        onClose={() => handleMenuCloseWith(handleCloseDeleteCategoryDialog)}
        isOpen={isDeleteCategoryDialogOpen}
      />
      <DialogWithAction
        title={`Delete All "${category.name}" Objects`}
        content={`Objects categorized as "${category.name}" will be deleted.`}
        onConfirm={handleDeleteObjects}
        onClose={() => handleMenuCloseWith(handleCloseDialogWithAction)}
        isOpen={isDialogWithActionOpen}
      />
    </Menu>
  );
};

const CategoryMenuItem = ({
  label,
  onClick: handleClick,
}: {
  label: string;
  onClick: () => void;
}) => {
  return (
    <MenuItem onClick={handleClick} dense>
      <Typography variant="inherit">{label}</Typography>
    </MenuItem>
  );
};
