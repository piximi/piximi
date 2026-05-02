import React from "react";
import { Box, Menu, MenuItem, MenuList, Typography } from "@mui/material";

import { useDialogHotkey } from "hooks";

import { ConfirmationDialog } from "components/dialogs/ConfirmationDialog";

import { HotkeyContext } from "utils/enums";

import { Category } from "store/dataV2/types";
import { CategoryDialog } from "components/dialogs/CategoryDialog";
import { useParameterizedSelector } from "store/hooks";
import { selectEntityCountByCategoryId } from "store/dataV2/selectors";

type CategoryItemMenuProps = {
  anchorElCategoryMenu: any;
  category: Category;
  handleCloseCategoryMenu: () => void;
  openCategoryMenu: boolean;
  editCategory: (id: string, name: string, color: string) => void;
  deleteCategory: (category: Category) => void;
  clearObjects: (category: Category) => void;
  options: { type: "image" } | { type: "annotation"; kindId: string };
};

export const CategoryItemMenu = ({
  options,
  anchorElCategoryMenu,
  category,
  handleCloseCategoryMenu,
  openCategoryMenu,
  editCategory,
  deleteCategory,
  clearObjects,
}: CategoryItemMenuProps) => {
  const numEntities = useParameterizedSelector(
    selectEntityCountByCategoryId,
    category.id,
  );
  const {
    onClose: handleCloseEditCategoryDialog,
    onOpen: handleOpenEditCategoryDialog,
    open: isEditCategoryDialogOpen,
  } = useDialogHotkey(HotkeyContext.ConfirmationDialog);
  const {
    onClose: handleCloseDeleteCategoryDialog,
    onOpen: handleOpenDeleteCategoryDialog,
    open: isDeleteCategoryDialogOpen,
  } = useDialogHotkey(HotkeyContext.ConfirmationDialog);

  const {
    onClose: handleCloseDeleteObjectsDialog,
    onOpen: handleOpenDeleteObjectsDialog,
    open: isDeleteObjectsDialogOpen,
  } = useDialogHotkey(HotkeyContext.ConfirmationDialog);

  const handleMenuCloseWith = (dialogClose: () => void) => {
    dialogClose();
    handleCloseCategoryMenu();
  };
  const handleDelete = () => {
    if (numEntities === 0) {
      handleMenuCloseWith(handleCloseDeleteCategoryDialog);
      deleteCategory(category);
      return;
    }
    handleOpenDeleteCategoryDialog();
  };
  return (
    <Menu
      anchorEl={anchorElCategoryMenu}
      anchorOrigin={{ horizontal: "left", vertical: "bottom" }}
      onClose={handleCloseCategoryMenu}
      open={openCategoryMenu}
      transformOrigin={{ horizontal: "left", vertical: "top" }}
      slotProps={{ list: { sx: { py: 0 } } }}
    >
      <MenuList dense variant="menu" sx={{ py: 0 }}>
        <Box>
          {!category.isUnknown && (
            <>
              <CategoryMenuItem
                onClick={handleDelete}
                label="Delete"
                data-testid="delete-category-button"
              />

              <CategoryMenuItem
                onClick={handleOpenEditCategoryDialog}
                label="Edit"
                data-testid="edit-category-button"
              />
            </>
          )}
          <CategoryMenuItem
            onClick={handleOpenDeleteObjectsDialog}
            label="Clear Objects"
          />
        </Box>
      </MenuList>
      <CategoryDialog
        action="edit"
        onConfirm={editCategory}
        initColor={category.color}
        initName={category.name}
        id={category.id}
        onClose={() => handleMenuCloseWith(handleCloseEditCategoryDialog)}
        open={isEditCategoryDialogOpen}
        options={options}
      />
      <ConfirmationDialog
        title={`Delete "${category.name}" Category`}
        content={`Objects categorized as "${category.name}" will NOT be deleted, and instead will be labeled as
        "Unknown".`}
        onConfirm={() => deleteCategory(category)}
        onClose={() => handleMenuCloseWith(handleCloseDeleteCategoryDialog)}
        isOpen={isDeleteCategoryDialogOpen}
        data-testid="delete-category-confirm-dialog"
      />
      <ConfirmationDialog
        title={`Delete All "${category.name}" Objects`}
        content={`Objects categorized as "${category.name}" will be deleted. ${
          category.type === "image"
            ? "Associated annotations will also be removed."
            : ""
        } `}
        onConfirm={() => clearObjects(category)}
        onClose={() => handleMenuCloseWith(handleCloseDeleteObjectsDialog)}
        isOpen={isDeleteObjectsDialogOpen}
      />
    </Menu>
  );
};

const CategoryMenuItem = ({
  label,
  onClick: handleClick,
  ...props
}: {
  label: string;
  onClick: () => void;
  [key: string]: any;
}) => {
  return (
    <MenuItem onClick={handleClick} dense {...props}>
      <Typography variant="inherit">{label}</Typography>
    </MenuItem>
  );
};
