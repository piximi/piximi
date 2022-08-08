import React from "react";
import { useDispatch } from "react-redux";

import { ListItemText, MenuItem } from "@mui/material";

import { applicationSlice, classifierSlice, projectSlice } from "store/slices";

import {
  AlertStateType,
  AlertType,
  Classifier,
  ImageType,
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
        try {
          const projectJSON = JSON.parse(event.target.result as string);
          project = projectJSON.project;
          classifier = projectJSON.classifier;
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
          dispatch(applicationSlice.actions.clearSelectedImages());

          //Open project
          dispatch(
            projectSlice.actions.openProject({
              images: images,
              categories: project.categories,
              name: project.name,
            })
          );

          //Open Classifier options
          dispatch(
            classifierSlice.actions.setClassifier({
              classifier: classifier,
            })
          );
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
