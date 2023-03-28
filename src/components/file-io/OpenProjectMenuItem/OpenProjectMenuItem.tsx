import React from "react";
import { batch, useDispatch } from "react-redux";

import { ListItemText, MenuItem } from "@mui/material";

import { applicationSlice } from "store/application";
import { classifierSlice } from "store/classifier";
import { projectSlice } from "store/project";
import { segmenterSlice } from "store/segmenter";

import { uploader } from "utils/common/fileHandlers";
import { deserialize } from "utils/common/image/deserialize";

import { AlertStateType, AlertType } from "types";
import { AnnotatorSlice } from "store/annotator";
import { DataSlice } from "store/data";

type OpenProjectMenuItemProps = {
  onMenuClose: () => void;
  fromAnnotator?: boolean;
};

export const OpenProjectMenuItem = ({
  onMenuClose,
  fromAnnotator = false,
}: OpenProjectMenuItemProps) => {
  const dispatch = useDispatch();

  const onOpenProjectFile = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    event.persist();

    if (!event.currentTarget.files) return;

    const file = event.currentTarget.files[0];

    await uploader(file);

    event.target.value = "";

    deserialize(file.name)
      .then((res) => {
        batch(() => {
          dispatch(classifierSlice.actions.resetClassifier());
          dispatch(segmenterSlice.actions.resetSegmenter());
          dispatch(AnnotatorSlice.actions.resetAnnotator());
          dispatch(projectSlice.actions.resetProject());

          dispatch(
            DataSlice.actions.initData({
              images: res.data.images,
              annotations: res.data.annotations,
              categories: res.data.categories,
              annotationCategories: res.data.annotationCategories,
            })
          );
          dispatch(
            projectSlice.actions.setProject({
              project: res.project,
            })
          );

          dispatch(
            classifierSlice.actions.setClassifier({
              classifier: res.classifier,
            })
          );

          dispatch(
            segmenterSlice.actions.setSegmenter({
              segmenter: res.segmenter,
            })
          );
        });

        if (fromAnnotator) {
          batch(() => {
            dispatch(
              AnnotatorSlice.actions.setActiveImageId({
                imageId: res.data.images[0].id,
                prevImageId: undefined,
                execSaga: true,
              })
            );
          });
        }
      })
      .catch((err) => {
        const error: Error = err as Error;
        const warning: AlertStateType = {
          alertType: AlertType.Warning,
          name: "Could not parse project file",
          description: `Error while parsing the project file: ${error.name}\n${error.message}`,
        };
        dispatch(
          applicationSlice.actions.updateAlertState({ alertState: warning })
        );
      });
  };

  return (
    <MenuItem component="label">
      <ListItemText primary="Open project" />
      <input
        accept="application/x-hdf5"
        hidden
        id="open-project-file"
        onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
          onMenuClose();
          onOpenProjectFile(event);
        }}
        type="file"
      />
    </MenuItem>
  );
};
