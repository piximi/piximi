import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Button from "@mui/material/Button";
import { CategoryType, UNKNOWN_ANNOTATION_CATEGORY_ID } from "types/Category";
import { useHotkeys } from "react-hotkeys-hook";
import { useDispatch, batch } from "react-redux";
import { projectSlice, imageViewerSlice } from "store/slices";

type DeleteAllCategoriesDialogProps = {
  categoryType: CategoryType;
  onClose: () => void;
  open: boolean;
};

export const DeleteAllCategoriesDialog = ({
  categoryType,
  onClose,
  open,
}: DeleteAllCategoriesDialogProps) => {
  const dispatch = useDispatch();

  const onDeleteAllCategories = () => {
    if (categoryType === CategoryType.ClassifierCategory) {
      deleteAllClassifierCategories();
    } else {
      deleteAllAnnotationCategories();
    }
  };

  const deleteAllClassifierCategories = () => {
    dispatch(projectSlice.actions.deleteAllCategories({}));
  };

  const deleteAllAnnotationCategories = () => {
    batch(() => {
      dispatch(
        imageViewerSlice.actions.setSelectedCategoryId({
          selectedCategoryId: UNKNOWN_ANNOTATION_CATEGORY_ID,
        })
      );

      dispatch(imageViewerSlice.actions.deleteAllAnnotationCategories({}));

      dispatch(projectSlice.actions.deleteAllAnnotationCategories({}));
    });
  };

  useHotkeys(
    "enter",
    () => {
      onDeleteAllCategories();
    },
    { enabled: open },
    [onDeleteAllCategories]
  );

  return (
    <Dialog fullWidth onClose={onClose} open={open}>
      <DialogTitle>Delete all categories?</DialogTitle>

      <DialogContent>
        {categoryType === CategoryType.ClassifierCategory
          ? "Images"
          : "Annotations"}{" "}
        will not be deleted and instead will be labeled as "Unknown".
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} color="primary">
          Cancel
        </Button>

        <Button onClick={onDeleteAllCategories} color="primary">
          Delete
        </Button>
      </DialogActions>
    </Dialog>
  );
};
