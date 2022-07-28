import { batch, useDispatch } from "react-redux";
import React from "react";
import { MenuItem } from "@mui/material";
import ListItemText from "@mui/material/ListItemText";
import { SerializedFileType } from "../../../../types/SerializedFileType";
import { ToolType } from "../../../../types/ToolType";
import {
  imageViewerSlice,
  setActiveImage,
  setOperation,
} from "../../../../store/slices";
import { UNKNOWN_ANNOTATION_CATEGORY } from "types/Category";

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
          dispatch(
            imageViewerSlice.actions.setCategories({
              categories: [UNKNOWN_ANNOTATION_CATEGORY],
            })
          );

          serializedImages.forEach(
            (serializedImage: SerializedFileType, index: number) => {
              dispatch(
                imageViewerSlice.actions.openAnnotations({
                  file: serializedImage,
                })
              );
            }
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
