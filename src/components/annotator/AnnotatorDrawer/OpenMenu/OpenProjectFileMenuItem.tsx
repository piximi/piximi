import React from "react";
import { batch, useDispatch, useSelector } from "react-redux";

import { MenuItem, ListItemText } from "@mui/material";

import {
  AnnotatorSlice,
  annotatorImagesSelector,
  activeImageIdSelector,
} from "store/annotator";
import {
  annotationCategoriesSelector,
  availableColorsSelector,
  projectSlice,
} from "store/project";

import { deserializeCOCOFile, deserializeProjectFile } from "utils/annotator";

import { validateFileType, ProjectFileType } from "types/runtime";
import { SerializedCOCOFileType, SerializedFileType } from "types";

type OpenAnnotationsMenuItemProps = {
  onCloseMenu: () => void;
  projectType: ProjectFileType;
};

export const OpenProjectFileMenuItem = ({
  onCloseMenu,
  projectType,
}: OpenAnnotationsMenuItemProps) => {
  const dispatch = useDispatch();

  const activeImageId = useSelector(activeImageIdSelector);

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
      if (event.target && event.target.result) {
        const serializedProject: SerializedCOCOFileType | SerializedFileType =
          validateFileType(event.target.result as string, projectType);

        const { imsToAnnotate, newCategories } =
          projectType === ProjectFileType.PIXIMI
            ? deserializeProjectFile(
                serializedProject as SerializedFileType,
                existingImages,
                existingAnnotationCategories
              )
            : deserializeCOCOFile(
                serializedProject as SerializedCOCOFileType,
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
              instances: imsToAnnotate,
            })
          );
        });

        // when a deserialized annotation is associated with the active image
        // this needs to invoke the decoding process for the in-view image
        // annotations; prevImageId undefined to avoid encoding step
        dispatch(
          AnnotatorSlice.actions.setActiveImage({
            imageId: activeImageId,
            prevImageId: undefined,
            execSaga: true,
          })
        );
      }
    };

    reader.readAsText(file);
  };

  return (
    <MenuItem component="label">
      <ListItemText
        primary={
          projectType === ProjectFileType.PIXIMI
            ? "Open piximi project file"
            : "Open coco project file"
        }
      />
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
