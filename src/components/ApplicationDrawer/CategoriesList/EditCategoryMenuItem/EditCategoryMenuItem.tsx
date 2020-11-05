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
  const { onClose, onOpen, open } = useDialog();

  const onClick = () => {
    onCloseCategoryMenu();

    onOpen();
  };

  return (
    <React.Fragment>
      <MenuItem onClick={onClick}>
        <Typography variant="inherit">Edit category</Typography>
      </MenuItem>

      <EditCategoryDialog
        category={category}
        onCloseDialog={onClose}
        openDialog={open}
      />
    </React.Fragment>
  );
};
