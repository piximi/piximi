import React from "react";
import { batch, useDispatch, useSelector } from "react-redux";

import { MenuItem, ListItemText } from "@mui/material";

import {
  AnnotatorSlice,
  setActiveImage,
  setOperation,
  activeImageIdSelector,
} from "store/annotator";
import { setAnnotationCategories } from "store/project";

import {
  decodedAnnotationType,
  SerializedFileType,
  SerializedAnnotationType,
  ToolType,
  UNKNOWN_ANNOTATION_CATEGORY,
} from "types";

import { importSerializedAnnotations } from "utils/common/imageHelper";

type OpenAnnotationsMenuItemProps = {
  onCloseMenu: () => void;
};

export const OpenProjectFileMenuItem = ({
  onCloseMenu,
}: OpenAnnotationsMenuItemProps) => {
  const dispatch = useDispatch();
  const activeImageId = useSelector(activeImageIdSelector);

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
          dispatch(AnnotatorSlice.actions.setImages({ images: [] }));

          let updatedAnnotationCategories = [UNKNOWN_ANNOTATION_CATEGORY];
          serializedImages.forEach(
            (serializedImage: SerializedFileType, index: number) => {
              const annotations = serializedImage.annotations.map(
                (
                  annotation: SerializedAnnotationType
                ): decodedAnnotationType => {
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
                AnnotatorSlice.actions.openAnnotations({
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
              prevImageId: activeImageId,
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
