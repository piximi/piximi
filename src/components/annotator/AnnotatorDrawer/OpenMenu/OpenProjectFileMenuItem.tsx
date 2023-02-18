import React from "react";
import { batch, useDispatch, useSelector } from "react-redux";

import { MenuItem, ListItemText } from "@mui/material";

import {
  AnnotatorSlice,
  activeImageSelector,
  annotatorImagesSelector,
} from "store/annotator";
import {
  annotationCategoriesSelector,
  availableColorsSelector,
  projectSlice,
} from "store/project";

import { deserializeCOCOFile } from "utils/annotator";

import { validateFileType } from "types/runtime";
import { SerializedCOCOFileType } from "types";

type OpenAnnotationsMenuItemProps = {
  onCloseMenu: () => void;
};

export const OpenProjectFileMenuItem = ({
  onCloseMenu,
}: OpenAnnotationsMenuItemProps) => {
  const dispatch = useDispatch();

  const activeImage = useSelector(activeImageSelector);

  const existingAnnotationCategories = useSelector(
    annotationCategoriesSelector
  );

  const existingImages = useSelector(annotatorImagesSelector);

  const availableColors = useSelector(availableColorsSelector);

  const onOpenProjectFile = (
    event: React.ChangeEvent<HTMLInputElement>,
    onClose: () => void
  ) => {
    onClose();

    event.persist();

    if (!event.currentTarget.files) return;

    const file = event.currentTarget.files[0];

    const reader = new FileReader();

    reader.onload = async (event: ProgressEvent<FileReader>) => {
      if (event.target && event.target.result && activeImage) {
        const cocoFile: SerializedCOCOFileType = validateFileType(
          event.target.result as string
        );

        const { newAnnotations, newCategories } = deserializeCOCOFile(
          cocoFile,
          existingImages,
          existingAnnotationCategories,
          availableColors
        );

        batch(() => {
          dispatch(
            projectSlice.actions.addAnnotationCategories({
              categories: newCategories,
            })
          );
          dispatch(
            AnnotatorSlice.actions.setInstances({
              instances: newAnnotations,
            })
          );
        });
      }
    };

    reader.readAsText(file);
  };

  return (
    <MenuItem component="label">
      <ListItemText primary="Open project file" />
      <input
        accept="application/json"
        hidden
        id="open-project-file"
        onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
          onOpenProjectFile(event, onCloseMenu)
        }
        type="file"
      />
    </MenuItem>
  );
};
