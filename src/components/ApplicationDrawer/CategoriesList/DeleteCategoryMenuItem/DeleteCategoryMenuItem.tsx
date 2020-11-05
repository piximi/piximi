import React from "react";
import MenuItem from "@material-ui/core/MenuItem";
import Typography from "@material-ui/core/Typography";
import { Category } from "../../../../types/Category";
import { DeleteCategoryDialog } from "../DeleteCategoryDialog";
import { useDialog } from "../../../../hooks";

type DeleteCategoryMenuItemProps = {
  category: Category;
  onCloseCategoryMenu: () => void;
};

export const DeleteCategoryMenuItem = ({
  category,
  onCloseCategoryMenu,
}: DeleteCategoryMenuItemProps) => {
  const {
    onClose: onCloseDialog,
    onOpen: onOpenDialog,
    open: openDialog,
  } = useDialog();

  const onOpenDeleteCategoryDialog = () => {
    onCloseCategoryMenu();

    onOpenDialog();
  };

  return (
    <React.Fragment>
      <MenuItem onClick={onOpenDeleteCategoryDialog}>
        <Typography variant="inherit">Delete category</Typography>
      </MenuItem>

      <DeleteCategoryDialog
        category={category}
        onClose={onCloseDialog}
        open={openDialog}
      />
    </React.Fragment>
  );
};
