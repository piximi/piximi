import React from "react";

import { Menu, MenuItem, Typography } from "@mui/material";

import { useDialogHotkey } from "hooks";
import { DialogWithAction, UpsertCategoriesDialog } from "components/dialogs";
import { StyledDivider } from "components/styled-components/";

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
      anchorOrigin={{ horizontal: "center", vertical: "top" }}
      onClose={handleCloseCategoryMenu}
      open={openCategoryMenu}
      transformOrigin={{ horizontal: "center", vertical: "bottom" }}
      sx={(theme) => ({
        "& .MuiMenu-list": {
          px: theme.spacing(1),
          display: "flex",
          flexDirection: "row",
        },
      })}
    >
      <CategoryMenuItem
        onClick={() => {
          handleHideCategory(category);
        }}
        label={categoryHidden ? "Show" : "Hide"}
      />
      <MenuItemDivider />
      <CategoryMenuItem
        onClick={() => {
          handleHideOtherCategories(category);
        }}
        label="Hide Other"
      />

      {category.name !== UNKNOWN_CATEGORY_NAME && (
        <>
          <MenuItemDivider />

          <CategoryMenuItem
            onClick={handleOpenDeleteCategoryDialog}
            label="Delete"
          />
          <MenuItemDivider />
          <CategoryMenuItem
            onClick={handleOpenEditCategoryDialog}
            label="Edit"
          />
          <MenuItemDivider />
          <CategoryMenuItem
            onClick={handleOpenDialogWithAction}
            label="Clear Annotations"
          />
        </>
      )}
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
    <MenuItem
      onClick={handleClick}
      dense
      sx={(theme) => ({ px: theme.spacing(0.5) })}
    >
      <Typography variant="inherit">{label}</Typography>
    </MenuItem>
  );
};

const MenuItemDivider = () => {
  return (
    <StyledDivider
      orientation="vertical"
      flexItem
      sx={(theme) => ({ mx: theme.spacing(0.5) })}
    />
  );
};
