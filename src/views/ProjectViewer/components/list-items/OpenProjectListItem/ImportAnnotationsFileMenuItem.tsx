import React, { useCallback } from "react";
import { batch, useDispatch, useSelector } from "react-redux";

import { MenuItem, ListItemText } from "@mui/material";

import { dataSlice } from "store/data";
import {
  selectObjectCategoryDict,
  selectObjectKindDict,
  selectSplitThingDict,
} from "store/data/selectors";

import {
  deserializeCOCOFile,
  deserializePiximiAnnotations,
} from "utils/file-io/deserialize";

import { CATEGORY_COLORS } from "utils/common/constants";

import { ProjectFileType, validateFileType } from "utils/file-io/runtimeTypes";
import {
  SerializedCOCOFileType,
  SerializedFileType,
} from "utils/file-io/types";

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

  const existingObjectCategories = useSelector(selectObjectCategoryDict);

  const existingThings = useSelector(selectSplitThingDict);
  const existingObjectKinds = useSelector(selectObjectKindDict);

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
          const { newAnnotations, newCategories, newKinds } =
            projectType === ProjectFileType.PIXIMI
              ? await deserializePiximiAnnotations(
                  serializedProject as SerializedFileType,
                  existingThings.images,
                  existingObjectCategories,
                  existingObjectKinds
                )
              : await deserializeCOCOFile(
                  serializedProject as SerializedCOCOFileType,
                  Object.values(existingThings.images),
                  Object.values(existingObjectCategories),
                  Object.values(existingObjectKinds),
                  Object.values(CATEGORY_COLORS)
                );

          batch(() => {
            dispatch(
              dataSlice.actions.addKinds({
                kinds: newKinds,
                isPermanent: true,
              })
            );
            dispatch(
              dataSlice.actions.addCategories({
                categories: newCategories,
                isPermanent: true,
              })
            );
            dispatch(
              dataSlice.actions.addThings({
                things: newAnnotations,
                isPermanent: true,
              })
            );
          });
        }
      };

      reader.readAsText(file);
    },
    [
      dispatch,
      existingObjectCategories,
      existingThings.images,
      existingObjectKinds,
      projectType,
    ]
  );

  return (
    <MenuItem component="label" dense>
      <ListItemText
        primary={
          projectType === ProjectFileType.PIXIMI
            ? "Import Piximi"
            : "Import COCO"
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
