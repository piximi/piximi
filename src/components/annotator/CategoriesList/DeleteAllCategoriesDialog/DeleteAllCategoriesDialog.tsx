import React from "react";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Button from "@mui/material/Button";
import { batch, useDispatch, useSelector } from "react-redux";
import { AnnotationType } from "../../../../types/AnnotationType";
import { imageViewerSlice } from "../../../../store/slices";
import { unknownCategorySelector } from "../../../../store/selectors";
import { UNKNOWN_CATEGORY_ID } from "../../../../types/Category";
import { ShadowImageType } from "../../../../types/ImageType";
import { annotatorImagesSelector } from "../../../../store/selectors/annotatorImagesSelector";

type DeleteAllCategoriesDialogProps = {
  onClose: () => void;
  open: boolean;
};

export const DeleteAllCategoriesDialog = ({
  onClose,
  open,
}: DeleteAllCategoriesDialogProps) => {
  const dispatch = useDispatch();

  const unknownCategory = useSelector(unknownCategorySelector);

  const images = useSelector(annotatorImagesSelector);

  const onDelete = () => {
    images.forEach((image: ShadowImageType) => {
      const instances = image.annotations.map((instance: AnnotationType) => {
        return {
          ...instance,
          categoryId: UNKNOWN_CATEGORY_ID,
        };
      });
      dispatch(
        imageViewerSlice.actions.setImageInstances({
          instances: instances as Array<AnnotationType>,
          imageId: image.id,
        })
      );
    });

    batch(() => {
      const unknownCategory = {
        color: "#AAAAAA",
        id: UNKNOWN_CATEGORY_ID,
        name: "Unknown",
        visible: true,
      };

      dispatch(
        imageViewerSlice.actions.setSelectedCategoryId({
          selectedCategoryId: unknownCategory.id,
        })
      );

      dispatch(
        imageViewerSlice.actions.setCategories({
          categories: [unknownCategory],
        })
      );
    });
    onClose();
  };

  return (
    <Dialog fullWidth onClose={onClose} open={open}>
      <DialogTitle>Delete all categories?</DialogTitle>

      <DialogContent>
        Annotations will not be deleted and instead will be labeled as "
        {unknownCategory.name}".
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} color="primary">
          Cancel
        </Button>

        <Button onClick={onDelete} color="primary">
          Delete category
        </Button>
      </DialogActions>
    </Dialog>
  );
};
