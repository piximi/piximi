import React, { useCallback } from "react";
import { batch, useDispatch, useSelector } from "react-redux";

import { MenuItem, ListItemText } from "@mui/material";

import { AnnotatorSlice, activeImageIdSelector } from "store/annotator";
import {
  dataSlice,
  selectAllCategories,
  selectUnusedCategoryColors,
  selectSelectedImages,
} from "store/data";

import { deserializeCOCOFile, deserializeProjectFile } from "utils/annotator";

import { validateFileType, ProjectFileType } from "types/runtime";
import {
  SerializedCOCOFileType,
  SerializedFileType,
  ShadowImageType,
} from "types";

type ImportAnnotationsMenuItemProps = {
  onCloseMenu: () => void;
  projectType: ProjectFileType;
};

export const ImportAnnotationsFileMenuItem = ({
  onCloseMenu,
  projectType,
}: ImportAnnotationsMenuItemProps) => {
  const dispatch = useDispatch();

  const activeImageId = useSelector(activeImageIdSelector);

  const existingAnnotationCategories = useSelector(selectAllCategories);

  const existingImages = useSelector(selectSelectedImages).map((image) => {
    return { ...image, annotations: [] } as ShadowImageType;
  });

  const availableColors = useSelector(selectUnusedCategoryColors);

  const onImportProjectFile = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>, onClose: () => void) => {
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
              dataSlice.actions.addAnnotationCategories({
                annotationCategories: newCategories,
              })
            );
            dispatch(
              dataSlice.actions.setImageInstances({
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
    },
    [
      dispatch,
      activeImageId,
      existingAnnotationCategories,
      availableColors,
      existingImages,
      projectType,
    ]
  );

  return (
    <MenuItem component="label">
      <ListItemText
        primary={
          projectType === ProjectFileType.PIXIMI
            ? "Import Piximi annotations file"
            : "Import COCO annotations file"
        }
      />
      <input
        accept="application/json"
        hidden
        id="import-project-file"
        onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
          onImportProjectFile(event, onCloseMenu)
        }
        type="file"
      />
    </MenuItem>
  );
};
