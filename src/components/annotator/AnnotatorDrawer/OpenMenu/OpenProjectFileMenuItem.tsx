import React from "react";
import { useDispatch, useSelector } from "react-redux";

import { MenuItem, ListItemText } from "@mui/material";

import { imageViewerSlice } from "store/image-viewer";
import { projectSlice } from "store/project";

import { deserializeAnnotations } from "image/utils/loadExampleImage";

import { validateFileType } from "types/runtime";

import { activeImageSelector } from "store/common";

type OpenAnnotationsMenuItemProps = {
  onCloseMenu: () => void;
};

export const OpenProjectFileMenuItem = ({
  onCloseMenu,
}: OpenAnnotationsMenuItemProps) => {
  const dispatch = useDispatch();

  const activeImage = useSelector(activeImageSelector);

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
        const serializedAnnotations = validateFileType(
          event.target.result as string
        );

        // TODO: BIG_MERGE - check if this is still correct
        const deserializedAnnotations = deserializeAnnotations(
          serializedAnnotations.annotations
        );

        const newAnnotations = [
          ...activeImage.annotations,
          ...deserializedAnnotations,
        ];

        dispatch(
          projectSlice.actions.addAnnotationCategories({
            categories: serializedAnnotations.categories,
          })
        );
        dispatch(
          imageViewerSlice.actions.setImageInstances({
            imageId: activeImage.id,
            instances: newAnnotations,
          })
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
          onOpenProjectFile(event, onCloseMenu)
        }
        type="file"
      />
    </MenuItem>
  );
};
