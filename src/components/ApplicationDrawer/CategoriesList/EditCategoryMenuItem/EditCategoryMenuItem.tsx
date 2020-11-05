import React from "react";
import MenuItem from "@material-ui/core/MenuItem";
import Typography from "@material-ui/core/Typography";
import { EditCategoryDialog } from "../EditCategoryDialog";
import { Category } from "../../../../types/Category";
import { useDialog } from "../../../../hooks";

type EditCategoryMenuItemProps = {
  category: Category;
  onCloseCategoryMenu: () => void;
};

export const EditCategoryMenuItem = ({
  category,
  onCloseCategoryMenu,
}: EditCategoryMenuItemProps) => {
  const {
    onClose: onCloseDialog,
    onOpen: onOpenDialog,
    open: openDialog,
  } = useDialog();

  const onOpenEditCategoryDialog = () => {
    onCloseCategoryMenu();

    onOpenDialog();
  };

  return (
    <React.Fragment>
      <MenuItem onClick={onOpenEditCategoryDialog}>
        <Typography variant="inherit">Edit category</Typography>
      </MenuItem>

      <EditCategoryDialog
        category={category}
        onClose={onCloseDialog}
        open={openDialog}
      />
    </React.Fragment>
  );
};
