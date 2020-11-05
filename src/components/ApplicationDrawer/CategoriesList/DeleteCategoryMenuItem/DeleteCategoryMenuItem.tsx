import React from "react";
import MenuItem from "@material-ui/core/MenuItem";
import Typography from "@material-ui/core/Typography";
import { Category } from "../../../../types/Category";
import { DeleteCategoryDialog } from "../DeleteCategoryDialog";

type DeleteCategoryMenuItemProps = {
  category: Category;
  onCloseCategoryMenu: () => void;
};

export const DeleteCategoryMenuItem = ({
  category,
  onCloseCategoryMenu,
}: DeleteCategoryMenuItemProps) => {
  const [
    openDeleteCategoryDialog,
    setOpenDeleteCategoryDialog,
  ] = React.useState(false);

  const onCloseDeleteCategoryDialog = () => {
    setOpenDeleteCategoryDialog(false);
  };

  const onOpenDeleteCategoryDialog = () => {
    onCloseCategoryMenu();
    setOpenDeleteCategoryDialog(true);
  };

  return (
    <React.Fragment>
      <MenuItem onClick={onOpenDeleteCategoryDialog}>
        <Typography variant="inherit">Delete category</Typography>
      </MenuItem>

      <DeleteCategoryDialog
        category={category}
        onClose={onCloseDeleteCategoryDialog}
        open={openDeleteCategoryDialog}
      />
    </React.Fragment>
  );
};
