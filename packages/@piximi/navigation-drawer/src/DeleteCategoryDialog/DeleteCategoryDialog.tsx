import * as React from "react";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle
} from "@material-ui/core";
import {useTranslation} from "react-i18next";
import {Category} from "@piximi/types";

type DeleteCategoryDialogProps = {
  category: Category;
  deleteCategory: (category: Category) => void;
  open: boolean;
  onClose: () => void;
};

export const DeleteCategoryDialog = (props: DeleteCategoryDialogProps) => {
  const {category, deleteCategory, open, onClose} = props;

  const onDeleteCategoryClick = () => {
    deleteCategory(category);
  };

  const dialogTitle = `Delete ${category.description}?`;

  const dialogContentText = `Images categorized as ${category.description} won’t be deleted.`;

  const {t: translation} = useTranslation();

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle id="alert-dialog-title">{dialogTitle}</DialogTitle>

      <DialogContent>
        <DialogContentText id="alert-dialog-description">
          {dialogContentText}
        </DialogContentText>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} color="primary">
          {translation("Cancel")}
        </Button>

        <Button onClick={onDeleteCategoryClick} color="primary">
          {translation("Yes")}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
