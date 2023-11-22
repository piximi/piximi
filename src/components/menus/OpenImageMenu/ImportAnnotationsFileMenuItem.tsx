import React, { useCallback } from "react";
import { batch, useDispatch, useSelector } from "react-redux";

import { MenuItem, ListItemText } from "@mui/material";

import {
  imageViewerSlice,
  selectActiveImageId,
} from "store/slices/imageViewer";
import {
  dataSlice,
  selectAllImageCategories,
  selectUnusedImageCategoryColors,
  selectSelectedImages,
} from "store/slices/data";

import { deserializeCOCOFile, deserializeProjectFile } from "utils/annotator";

import { validateFileType, ProjectFileType } from "types/runtime";
import { SerializedCOCOFileType, SerializedFileType } from "types";

//TODO: MenuItem??

type ImportAnnotationsMenuItemProps = {
  onCloseMenu: () => void;
  projectType: ProjectFileType;
};

export const ImportAnnotationsFileMenuItem = ({
  onCloseMenu,
  projectType,
}: ImportAnnotationsMenuItemProps) => {
  const dispatch = useDispatch();

  const activeImageId = useSelector(selectActiveImageId);

  const existingAnnotationCategories = useSelector(selectAllImageCategories);

  const existingImages = useSelector(selectSelectedImages);
  const availableColors = useSelector(selectUnusedImageCategoryColors);

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

          const { annotations, newCategories } =
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
                categories: newCategories,
              })
            );
            dispatch(dataSlice.actions.addAnnotations({ annotations }));
          });

          // when a deserialized annotation is associated with the active image
          // this needs to invoke the decoding process for the in-view image
          // annotations; prevImageId undefined to avoid encoding step
          dispatch(
            imageViewerSlice.actions.setActiveImageId({
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
