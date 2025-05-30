import React from "react";
import { batch, useDispatch } from "react-redux";
import { ListItemText, MenuItem } from "@mui/material";

import { applicationSettingsSlice } from "store/applicationSettings";
import { classifierSlice } from "store/classifier";
import { projectSlice } from "store/project";
import { segmenterSlice } from "store/segmenter";
import { dataSlice } from "store/data/dataSlice";

import { deserializeProject } from "utils/file-io/deserialize";
import { fListToStore } from "utils/file-io/zarr/stores";

import classifierHandler from "utils/models/classification/classifierHandler";

import { AlertType } from "utils/enums";

import { AlertState } from "utils/types";
import { useConfirmReplaceDialog } from "views/ProjectViewer/hooks/useConfirmReplaceProjectDialog";

//TODO: MenuItem??

type OpenProjectMenuItemProps = {
  onMenuClose: () => void;
};

export const OpenProjectMenuItem = ({
  onMenuClose,
}: OpenProjectMenuItemProps) => {
  const dispatch = useDispatch();
  const { getConfirmation } = useConfirmReplaceDialog();
  const onOpenProject = async (
    event: React.ChangeEvent<HTMLInputElement>,
    zip: boolean,
  ) => {
    event.persist();
    if (!event.currentTarget.files) return;
    const files = event.currentTarget.files;
    const confirmation = await getConfirmation({});
    if (!confirmation) return;

    // set indefinite loading
    dispatch(
      applicationSettingsSlice.actions.setLoadPercent({
        loadPercent: -1,
        loadMessage: "deserializing project...",
      }),
    );

    const { fileStore: zarrStore, loadedClassifiers } = await fListToStore(
      files,
      zip,
    );
    const onLoadProgress = (loadPercent: number, loadMessage: string) => {
      dispatch(
        applicationSettingsSlice.actions.sendLoadPercent({
          loadPercent,
          loadMessage,
        }),
      );
    };
    deserializeProject(zarrStore, onLoadProgress)
      .then((res) => {
        if (!res) return;
        batch(() => {
          // indefinite load until dispatches complete
          dispatch(
            applicationSettingsSlice.actions.setLoadPercent({
              loadPercent: -1,
            }),
          );
          dispatch(projectSlice.actions.resetProject());
          dispatch(dataSlice.actions.initializeState({ data: res.data }));
          // loadPerecnt set to 1 here
          dispatch(
            projectSlice.actions.setProject({
              project: res.project,
            }),
          );
          classifierHandler.addModels(loadedClassifiers);
          dispatch(
            classifierSlice.actions.setClassifier({
              classifier: res.classifier,
            }),
          );

          dispatch(
            segmenterSlice.actions.setSegmenter({
              segmenter: res.segmenter,
            }),
          );
          dispatch(
            applicationSettingsSlice.actions.setLoadPercent({ loadPercent: 1 }),
          );
        });
      })
      .catch((err: Error) => {
        import.meta.env.NODE_ENV !== "production" &&
          import.meta.env.VITE_APP_LOG_LEVEL === "1" &&
          console.error(err);

        const warning: AlertState = {
          alertType: AlertType.Warning,
          name: "Could not parse project file",
          description: `Error while parsing the project file: ${err.name}\n${err.message}`,
        };

        dispatch(
          applicationSettingsSlice.actions.updateAlertState({
            alertState: warning,
          }),
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
          // @ts-ignore: need it for some reason
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
