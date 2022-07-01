import { imageViewerSlice, setAnnotationCategories } from "store/slices";
import { UNKNOWN_ANNOTATION_CATEGORY } from "types/Category";
import ListItem from "@mui/material/ListItem";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { annotatorImagesSelector } from "store/selectors/annotatorImagesSelector";
import DeleteIcon from "@mui/icons-material/Delete";

type DeleteAllCategoriesListItemProps = {
  onOpenDeleteAllCategoriesDialog: () => void;
};

export const DeleteAllCategoriesListItem = ({
  onOpenDeleteAllCategoriesDialog,
}: DeleteAllCategoriesListItemProps) => {
  const dispatch = useDispatch();

  const images = useSelector(annotatorImagesSelector);

  const onDeleteAllCategories = () => {
    // Cycle through the annotations to determine if annotations of that category exist and show a warning dialog box is they do exist.
    let existAnnotations = false;
    for (let i = 0; i < images.length && !existAnnotations; i++) {
      for (let j = 0; j < images[i].annotations.length; j++) {
        if (
          images[i].annotations[j].categoryId !== UNKNOWN_ANNOTATION_CATEGORY.id
        ) {
          existAnnotations = true;
        }
      }
    }
    if (existAnnotations) {
      onOpenDeleteAllCategoriesDialog(); // Warn user that these annotations will be relabeled as unknown.
    } else {
      dispatch(
        imageViewerSlice.actions.setSelectedCategoryId({
          selectedCategoryId: UNKNOWN_ANNOTATION_CATEGORY.id,
        })
      );

      dispatch(
        setAnnotationCategories({
          categories: [UNKNOWN_ANNOTATION_CATEGORY],
        })
      );
    }
  };

  return (
    <>
      <ListItem button onClick={onDeleteAllCategories}>
        <ListItemIcon>
          <DeleteIcon color="disabled" />
        </ListItemIcon>

        <ListItemText primary={"Delete all categories"} />
      </ListItem>
    </>
  );
};
