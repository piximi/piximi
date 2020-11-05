import React from "react";
import MenuItem from "@material-ui/core/MenuItem";
import Typography from "@material-ui/core/Typography";
import { EditCategoryDialog } from "../EditCategoryDialog";
import { Category } from "../../../../types/Category";

type EditCategoryMenuItemProps = {
  category: Category;
  onCloseCategoryMenu: () => void;
};

export const EditCategoryMenuItem = ({
  category,
  onCloseCategoryMenu,
}: EditCategoryMenuItemProps) => {
  const [openEditCategoryDialog, setOpenEditCategoryDialog] = React.useState(
    false
  );

  const onOpenEditCategoryDialog = () => {
    onCloseCategoryMenu();
    setOpenEditCategoryDialog(true);
  };

  const onCloseEditCategoryDialog = () => {
    setOpenEditCategoryDialog(false);
  };

  return (
    <React.Fragment>
      <MenuItem onClick={onOpenEditCategoryDialog}>
        <Typography variant="inherit">Edit category</Typography>
      </MenuItem>

      <EditCategoryDialog
        category={category}
        onClose={onCloseEditCategoryDialog}
        open={openEditCategoryDialog}
      />
    </React.Fragment>
  );
};
