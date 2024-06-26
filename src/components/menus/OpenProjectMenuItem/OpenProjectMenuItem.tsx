import React from "react";
import { batch, useDispatch } from "react-redux";

import { ListItemText, MenuItem } from "@mui/material";

import { applicationSettingsSlice } from "store/slices/applicationSettings";
import { classifierSlice } from "store/slices/classifier";
import { projectSlice } from "store/slices/project";
import { segmenterSlice } from "store/slices/segmenter";

import { deserialize } from "utils/common/image/deserialize";

import { AlertStateType, AlertType } from "types";
import { imageViewerSlice } from "store/slices/imageViewer";
import { dataSlice } from "store/slices/data";
import { fListToStore } from "utils";
import { ImportAnnotationsFileMenuItem } from "../OpenImageMenu/ImportAnnotationsFileMenuItem";
import { ProjectFileType } from "types/runtime";

//TODO: MenuItem??

type OpenProjectMenuItemProps = {
  onMenuClose: () => void;
  fromAnnotator?: boolean;
};

export const OpenProjectMenuItem = ({
  onMenuClose,
  fromAnnotator = false,
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
        loadMessage: "deserializing project...",
      })
    );

    const files = event.currentTarget.files;

    const zarrStore = await fListToStore(files, zip);

    deserialize(zarrStore, onLoadProgress)
      .then((res) => {
        batch(() => {
          // indefinite load until dispatches complete
          dispatch(projectSlice.actions.setLoadPercent({ loadPercent: -1 }));
          dispatch(classifierSlice.actions.resetClassifier());
          dispatch(segmenterSlice.actions.resetSegmenter());
          dispatch(imageViewerSlice.actions.resetImageViewer());
          dispatch(projectSlice.actions.resetProject());

          dispatch(
            dataSlice.actions.initData({
              images: res.data.images,
              annotations: res.data.annotations,
              categories: res.data.categories,
              annotationCategories: res.data.annotationCategories,
            })
          );
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

        if (fromAnnotator) {
          batch(() => {
            dispatch(
              imageViewerSlice.actions.setActiveImageId({
                imageId: res.data.images[0].id,
                prevImageId: undefined,
                execSaga: true,
              })
            );
          });
        }
      })
      .catch((err: Error) => {
        process.env.NODE_ENV !== "production" &&
          process.env.REACT_APP_LOG_LEVEL === "1" &&
          console.error(err);

        const warning: AlertStateType = {
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
      <ImportAnnotationsFileMenuItem
        projectType={ProjectFileType.PIXIMI}
        onCloseMenu={onMenuClose}
      />
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
