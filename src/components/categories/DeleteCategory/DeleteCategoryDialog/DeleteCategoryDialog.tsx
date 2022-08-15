import { useHotkeys } from "react-hotkeys-hook";

import {
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";

import { Category, CategoryType } from "types";

type DeleteCategoryDialogProps = {
  category: Category;
  categoryType: CategoryType;
  deleteCategoryCallback: (categoryID: string) => void;
  onClose: () => void;
  open: boolean;
};

export const DeleteCategoryDialog = ({
  categoryType,
  category,
  deleteCategoryCallback,
  onClose,
  open,
}: DeleteCategoryDialogProps) => {
  const onDelete = () => {
    deleteCategoryCallback(category.id);

    onClose();
  };

  useHotkeys(
    "enter",
    () => {
      onDelete();
    },
    { enabled: open },
    [onDelete]
  );

  return (
    <Dialog fullWidth onClose={onClose} open={open}>
      <DialogTitle>Delete "{category.name}" category?</DialogTitle>

      <DialogContent>
        {categoryType === CategoryType.ClassifierCategory
          ? "Images"
          : "Annotations"}{" "}
        categorized as "{category.name}" will not be deleted and instead will be
        labeled as "Unknown".
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} color="primary">
          Cancel
        </Button>

        <Button onClick={onDelete} color="primary">
          Delete
        </Button>
      </DialogActions>
    </Dialog>
  );
};
