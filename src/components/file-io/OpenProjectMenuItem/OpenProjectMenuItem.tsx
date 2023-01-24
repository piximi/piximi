import React from "react";
import { batch, useDispatch } from "react-redux";

import { ListItemText, MenuItem } from "@mui/material";

import { applicationSlice } from "store/application";
import { classifierSlice } from "store/classifier";
import { projectSlice } from "store/project";
import { segmenterSlice } from "store/segmenter";

import { uploader } from "components/file-io/utils/file_handlers";
import { deserialize } from "image/utils/deserialize";

import { AlertStateType, AlertType } from "types";

type OpenProjectMenuItemProps = {
  onMenuClose: () => void;
};

export const OpenProjectMenuItem = ({
  onMenuClose,
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
          dispatch(applicationSlice.actions.clearSelectedImages());

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
