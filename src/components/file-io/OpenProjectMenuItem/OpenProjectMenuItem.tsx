import React from "react";
import { batch, useDispatch } from "react-redux";

import { ListItemText, MenuItem } from "@mui/material";

import { applicationSlice } from "store/application";
import { classifierSlice } from "store/classifier";
import { projectSlice } from "store/project";
import { segmenterSlice } from "store/segmenter";

import { uploader } from "components/file-io/utils/file_handlers";
import { deserialize } from "image/utils/deserialize";

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

    deserialize(file.name);

    // const reader = new FileReader();

    // reader.onload = async (event: ProgressEvent<FileReader>) => {
    //   if (event.target && event.target.result) {
    //     var images: Array<ImageType>;
    //     var project: SerializedProjectType;
    //     var classifier: Classifier;
    //     var segmenter: SegmenterStoreType;
    //     try {
    //       const projectJSON = JSON.parse(event.target.result as string);
    //       project = projectJSON.project;
    //       classifier = projectJSON.classifier;
    //       segmenter = projectJSON.segmenter;
    //       images = await deserializeImages(project.serializedImages);
    //     } catch (err) {
    //       const error: Error = err as Error;
    //       const warning: AlertStateType = {
    //         alertType: AlertType.Warning,
    //         name: "Could not parse JSON file",
    //         description: `Error while parsing the project file: ${error.name}\n${error.message}`,
    //       };
    //       dispatch(
    //         applicationSlice.actions.updateAlertState({ alertState: warning })
    //       );
    //       return;
    //     }

    //     try {
    //       batch(() => {
    //         dispatch(applicationSlice.actions.clearSelectedImages());

    //         dispatch(
    //           projectSlice.actions.openProject({
    //             images: images,
    //             categories: project.categories,
    //             annotationCategories: project.annotationCategories,
    //             name: project.name,
    //           })
    //         );

    //         dispatch(
    //           classifierSlice.actions.setClassifier({
    //             classifier: classifier,
    //           })
    //         );

    //         dispatch(
    //           segmenterSlice.actions.setSegmenter({
    //             segmenter: segmenter,
    //           })
    //         );
    //       });
    //     } catch (err) {
    //       const error: Error = err as Error;
    //       const warning: AlertStateType = {
    //         alertType: AlertType.Warning,
    //         name: "Could not open project file",
    //         description: `Error while opening the project file: ${error.name}\n${error.message}`,
    //       };
    //       dispatch(
    //         applicationSlice.actions.updateAlertState({ alertState: warning })
    //       );
    //     }
    //   }
    // };

    // reader.readAsText(file);
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
