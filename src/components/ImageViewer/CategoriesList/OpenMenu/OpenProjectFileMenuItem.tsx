import { useDispatch } from "react-redux";
import React from "react";
import {
  applicationSlice,
  setActiveImage,
  setOperation,
  setSelectedAnnotations,
} from "../../../../annotator/store/slices";
import { MenuItem } from "@mui/material";
import ListItemText from "@mui/material/ListItemText";
import { SerializedFileType } from "../../../../annotator/types/SerializedFileType";
import { ToolType } from "../../../../annotator/types/ToolType";

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
        const project = JSON.parse(event.target.result as string);

        //clear all images
        dispatch(applicationSlice.actions.setImages({ images: [] }));

        project.forEach(
          (serializedImage: SerializedFileType, index: number) => {
            if (index === 0) {
              dispatch(
                setActiveImage({
                  image: serializedImage.imageId,
                })
              );

              dispatch(
                setSelectedAnnotations({
                  selectedAnnotations: [],
                  selectedAnnotation: undefined,
                })
              );

              dispatch(
                setOperation({ operation: ToolType.RectangularAnnotation })
              );
            }
            dispatch(
              applicationSlice.actions.openAnnotations({
                file: serializedImage,
              })
            );
          }
        );
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
