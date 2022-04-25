import { imageViewerSlice } from "../../../../store/slices";
import { UNKNOWN_CATEGORY_ID } from "../../../../types/Category";
import ListItem from "@mui/material/ListItem";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { annotatorImagesSelector } from "../../../../store/selectors/annotatorImagesSelector";
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
    //cycle through the annotations to determine if annotations of that category exist
    // show a warning dialog box is they do exist
    let existAnnotations = false;
    for (let i = 0; i < images.length && !existAnnotations; i++) {
      for (let j = 0; j < images[i].annotations.length; j++) {
        if (images[i].annotations[j].categoryId !== UNKNOWN_CATEGORY_ID) {
          existAnnotations = true;
        }
      }
    }
    if (existAnnotations) {
      onOpenDeleteAllCategoriesDialog(); //warn user that these annotations will be relabeled as unknown
    } else {
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
