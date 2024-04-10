import React from "react";
import { batch, useDispatch } from "react-redux";

import { ListItemText, MenuItem } from "@mui/material";

import { applicationSettingsSlice } from "store/applicationSettings";
import { classifierSlice } from "store/classifier";
import { projectSlice } from "store/project";
import { segmenterSlice } from "store/segmenter";

import { imageViewerSlice } from "store/imageViewer";
import { dataSlice } from "store/data/dataSlice";
import { deserializeProject } from "utils/file-io/deserialize";
import { fListToStore } from "utils/file-io/zarrStores";
import { AlertState } from "utils/common/types";
import { AlertType } from "utils/common/enums";

//TODO: MenuItem??

type OpenProjectMenuItemProps = {
  onMenuClose: () => void;
};

export const OpenProjectMenuItem = ({
  onMenuClose,
}: OpenProjectMenuItemProps) => {
  const dispatch = useDispatch();

  const onLoadProgress = (loadPercent: number, loadMessage: string) => {
    dispatch(
      projectSlice.actions.sendLoadPercent({ loadPercent, loadMessage })
    );
  };

  const onOpenProject = async (
    event: React.ChangeEvent<HTMLInputElement>,
    zip: boolean
  ) => {
    event.persist();

    if (!event.currentTarget.files) return;

    // set indefinite loading
    dispatch(
      projectSlice.actions.setLoadPercent({
        loadPercent: -1,
        loadMessage: "deserializing proejct...",
      })
    );

    const files = event.currentTarget.files;

    const zarrStore = await fListToStore(files, zip);

    deserializeProject(zarrStore, onLoadProgress)
      .then((res) => {
        if (!res) return;
        batch(() => {
          // indefinite load until dispatches complete
          dispatch(projectSlice.actions.setLoadPercent({ loadPercent: -1 }));
          dispatch(classifierSlice.actions.resetClassifier());
          dispatch(segmenterSlice.actions.resetSegmenter());
          dispatch(imageViewerSlice.actions.resetImageViewer());
          dispatch(projectSlice.actions.resetProject());

          dispatch(dataSlice.actions.initializeState({ data: res.data }));
          // loadPerecnt set to 1 here
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
      .catch((err: Error) => {
        process.env.NODE_ENV !== "production" &&
          process.env.REACT_APP_LOG_LEVEL === "1" &&
          console.error(err);

        const warning: AlertState = {
          alertType: AlertType.Warning,
          name: "Could not parse project file",
          description: `Error while parsing the project file: ${err.name}\n${err.message}`,
        };

        dispatch(
          applicationSettingsSlice.actions.updateAlertState({
            alertState: warning,
          })
        );
      });

    event.target.value = "";
  };

  return (
    <>
      <MenuItem component="label" dense>
        <ListItemText primary="Project from Zarr" />
        <input
          accept=".zarr"
          hidden
          id="open-project-zarr"
          onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
            onMenuClose();
            onOpenProject(event, false);
          }}
          type="file"
          // @ts-ignore
          webkitdirectory=""
        />
      </MenuItem>
      <MenuItem component="label" dense>
        <ListItemText primary="Project from Zip" />
        <input
          accept="application/zip"
          hidden
          id="open-project-zip"
          onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
            onMenuClose();
            onOpenProject(event, true);
          }}
          type="file"
        />
      </MenuItem>
    </>
  );
};
