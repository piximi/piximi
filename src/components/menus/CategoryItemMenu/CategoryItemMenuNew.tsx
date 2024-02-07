import React from "react";

import { Box, Menu, MenuItem, MenuList, Typography } from "@mui/material";

import { useDialogHotkey } from "hooks";
import { DialogWithAction } from "components/dialogs";

import { UNKNOWN_CATEGORY_NAME, HotkeyView } from "types";
import { UpdateCategoryDialogNew } from "components/dialogs/UpdateCategoryDialog";
import { NewCategory } from "types/Category";
import { selectActiveKind } from "store/slices/project/selectors";
import { useDispatch, useSelector } from "react-redux";
import { newDataSlice } from "store/slices/newData/newDataSlice";

type CategoryItemMenuProps = {
  anchorElCategoryMenu: any;
  category: NewCategory;
  handleCloseCategoryMenu: () => void;
  openCategoryMenu: boolean;
  usedCategoryColors: string[];
  usedCategoryNames: string[];
  dispatchDeleteObjectsOfCategory: (categoryId: string) => void;
};

export const CategoryItemMenuNew = ({
  anchorElCategoryMenu,
  category,
  handleCloseCategoryMenu,
  openCategoryMenu,
  dispatchDeleteObjectsOfCategory,
}: CategoryItemMenuProps) => {
  const activeKind = useSelector(selectActiveKind);
  const dispatch = useDispatch();
  const {
    onClose: handleCloseEditCategoryDialog,
    onOpen: handleOpenEditCategoryDialog,
    open: isEditCategoryDialogOpen,
  } = useDialogHotkey(HotkeyView.EditCategoryDialog);
  const {
    onClose: handleCloseDeleteCategoryDialog,
    onOpen: handleOpenDeleteCategoryDialog,
    open: isDeleteCategoryDialogOpen,
  } = useDialogHotkey(HotkeyView.DeleteCategoryDialog);

  const handleRemoveCategory = () => {
    dispatch(
      newDataSlice.actions.removeCategoriesFromKind({
        categoryIds: [category.id],
        kind: activeKind,
        isPermanent: true,
      })
    );
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
      <UpdateCategoryDialogNew
        category={category}
        onClose={() => handleMenuCloseWith(handleCloseEditCategoryDialog)}
        open={isEditCategoryDialogOpen}
        kind={category.kind}
      />
      <DialogWithAction
        title={`Delete "${category.name}" Category`}
        content={`Objects categorized as "${category.name}" will NOT be deleted, and instead will be labeled as
        "Unknown".`}
        onConfirm={handleRemoveCategory}
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
