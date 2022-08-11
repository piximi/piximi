import React from "react";
import { batch, useDispatch } from "react-redux";

import { ListItemText, MenuItem } from "@mui/material";

import {
  applicationSlice,
  classifierSlice,
  projectSlice,
  segmenterSlice,
} from "store/slices";

import {
  AlertStateType,
  AlertType,
  Classifier,
  ImageType,
  SegmenterStoreType,
  SerializedProjectType,
} from "types";

import { deserializeImages } from "image/imageHelper";

type OpenProjectMenuItemProps = {
  popupState: any;
};

export const OpenProjectMenuItem = ({
  popupState,
}: OpenProjectMenuItemProps) => {
  const dispatch = useDispatch();

  const onOpenProjectFile = (
    event: React.ChangeEvent<HTMLInputElement>,
    close: () => void
  ) => {
    popupState.close();
    event.persist();

    close();

    if (!event.currentTarget.files) return;

    const file = event.currentTarget.files[0];

    const reader = new FileReader();

    reader.onload = async (event: ProgressEvent<FileReader>) => {
      if (event.target && event.target.result) {
        var images: Array<ImageType>;
        var project: SerializedProjectType;
        var classifier: Classifier;
        var segmenter: SegmenterStoreType;
        try {
          const projectJSON = JSON.parse(event.target.result as string);
          project = projectJSON.project;
          classifier = projectJSON.classifier;
          segmenter = projectJSON.segmenter;
          images = await deserializeImages(project.serializedImages);
        } catch (err) {
          const error: Error = err as Error;
          const warning: AlertStateType = {
            alertType: AlertType.Warning,
            name: "Could not parse JSON file",
            description: `Error while parsing the project file: ${error.name}\n${error.message}`,
          };
          dispatch(
            applicationSlice.actions.updateAlertState({ alertState: warning })
          );
          return;
        }

        try {
          batch(() => {
            dispatch(applicationSlice.actions.clearSelectedImages());

            dispatch(
              projectSlice.actions.openProject({
                images: images,
                categories: project.categories,
                annotationCategories: project.annotationCategories,
                name: project.name,
              })
            );

            dispatch(
              classifierSlice.actions.setClassifier({
                classifier: classifier,
              })
            );

            dispatch(
              segmenterSlice.actions.setSegmenter({
                segmenter: segmenter,
              })
            );
          });
        } catch (err) {
          const error: Error = err as Error;
          const warning: AlertStateType = {
            alertType: AlertType.Warning,
            name: "Could not open project file",
            description: `Error while opening the project file: ${error.name}\n${error.message}`,
          };
          dispatch(
            applicationSlice.actions.updateAlertState({ alertState: warning })
          );
        }
      }
    };

    reader.readAsText(file);
  };

  return (
    <MenuItem component="label">
      <ListItemText primary="Open project" />
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
