import { batch, useDispatch } from "react-redux";
import React from "react";
import { MenuItem } from "@mui/material";
import ListItemText from "@mui/material/ListItemText";
import { SerializedFileType } from "types/SerializedFileType";
import { ToolType } from "types/ToolType";
import {
  imageViewerSlice,
  setActiveImage,
  setAnnotationCategories,
  setOperation,
} from "store/slices";
import { UNKNOWN_ANNOTATION_CATEGORY } from "types/Category";
import { importSerializedAnnotations } from "image/imageHelper";
import { AnnotationType } from "types/AnnotationType";
import { SerializedAnnotationType } from "types/SerializedAnnotationType";

type OpenAnnotationsMenuItemProps = {
  popupState: any;
};

export const OpenProjectFileMenuItem = ({
  popupState,
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
          dispatch(imageViewerSlice.actions.setImages({ images: [] }));

          let updatedAnnotationCategories = [UNKNOWN_ANNOTATION_CATEGORY];
          serializedImages.forEach(
            (serializedImage: SerializedFileType, index: number) => {
              const annotations = serializedImage.annotations.map(
                (annotation: SerializedAnnotationType): AnnotationType => {
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
          onOpenProjectFile(event, popupState.close)
        }
        type="file"
      />
    </MenuItem>
  );
};
