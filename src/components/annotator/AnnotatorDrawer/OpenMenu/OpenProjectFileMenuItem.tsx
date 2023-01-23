import React from "react";
import { batch, useDispatch } from "react-redux";

import { MenuItem, ListItemText } from "@mui/material";

import {
  imageViewerSlice,
  setActiveImage,
  setOperation,
} from "store/image-viewer";
import { setAnnotationCategories } from "store/project";

import { AnnotationType, ToolType, UNKNOWN_ANNOTATION_CATEGORY } from "types";

import { importSerializedAnnotations } from "image/imageHelper";

// TODO: image_data
import {
  _SerializedFileType,
  _SerializedAnnotationType,
} from "format_convertor/types";

type OpenAnnotationsMenuItemProps = {
  onCloseMenu: () => void;
};

export const OpenProjectFileMenuItem = ({
  onCloseMenu,
}: OpenAnnotationsMenuItemProps) => {
  const dispatch = useDispatch();

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
        const serializedImages = JSON.parse(event.target.result as string);

        batch(() => {
          // TODO: image_data - needs to dispose data tensors of annotator uploaded images
          dispatch(
            imageViewerSlice.actions.setImages({
              images: [],
              disposeColorTensors: true,
            })
          );

          let updatedAnnotationCategories = [UNKNOWN_ANNOTATION_CATEGORY];
          serializedImages.forEach(
            (serializedImage: _SerializedFileType, index: number) => {
              const annotations = serializedImage.annotations.map(
                (annotation: _SerializedAnnotationType): AnnotationType => {
                  const { annotation_out, categories } =
                    importSerializedAnnotations(
                      annotation,
                      updatedAnnotationCategories
                    );
                  updatedAnnotationCategories = categories;
                  return annotation_out;
                }
              );

              dispatch(
                imageViewerSlice.actions.openAnnotations({
                  imageFile: serializedImage,
                  annotations: annotations,
                })
              );
            }
          );

          dispatch(
            setAnnotationCategories({ categories: updatedAnnotationCategories })
          );

          dispatch(
            setActiveImage({
              imageId: serializedImages[0].imageId,
              execSaga: true,
            })
          );

          dispatch(setOperation({ operation: ToolType.RectangularAnnotation }));
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
