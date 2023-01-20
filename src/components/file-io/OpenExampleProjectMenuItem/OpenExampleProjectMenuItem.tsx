import React from "react";
import { useDispatch, batch } from "react-redux";

import {
  Avatar,
  CircularProgress,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Typography,
} from "@mui/material";

import { applicationSlice } from "store/application";
import { classifierSlice } from "store/classifier";
import { projectSlice } from "store/project";

import { ExampleProject } from "data/exampleProjects/exampleProjectsEnum";
import { deserialize } from "image/utils/deserialize";
import { uploader } from "../utils";

type ExampleProjectProps = {
  projectName: string;
  projectDescription: string;
  exampleProjectEnum: ExampleProject;
  projectIcon: string;
  projectSource: {
    sourceName: string;
    sourceUrl: string;
  };
  license?: {
    licenseName: string;
    licenseUrl: string;
  };
};

type OpenExampleProjectMenuItemProps = {
  exampleProject: ExampleProjectProps;
  onClose: () => void;
};

export const OpenExampleProjectMenuItem = ({
  exampleProject,
  onClose,
}: OpenExampleProjectMenuItemProps) => {
  const dispatch = useDispatch();

  const [exampleClassifierIsLoading, setExampleClassifierIsLoading] =
    React.useState(false);

  const onClickExampleProject = () => {
    setExampleClassifierIsLoading(true);
    setTimeout(() => {
      openExampleProject();
    }, 20);
  };

  const openExampleProject = async () => {
    var exampleProjectFilePath: string;
    switch (exampleProject.exampleProjectEnum) {
      case ExampleProject.Mnist:
        exampleProjectFilePath = (
          await import("data/exampleProjects/mnistExampleProject.h5")
        ).default;
        break;
      case ExampleProject.CElegans:
        exampleProjectFilePath = (
          await import("data/exampleProjects/cElegansExampleProject.h5")
        ).default;
        break;
      case ExampleProject.HumanU2OSCells:
        exampleProjectFilePath = (
          await import("data/exampleProjects/HumanU2OSCellsExampleProject.h5")
        ).default;
        break;
      case ExampleProject.BBBC013:
        exampleProjectFilePath = (
          await import("data/exampleProjects/BBBC013ExampleProject.h5")
        ).default;
        break;
      case ExampleProject.PLP1:
        exampleProjectFilePath = (
          await import("data/exampleProjects/PLP1ExampleProject.h5")
        ).default;
        break;
      default:
        return;
    }

    const exampleProjectFile = await fetch(exampleProjectFilePath)
      .then((res) => res.blob())
      .then((blob) => new File([blob], exampleProject.projectName, blob));

    await uploader(exampleProjectFile);

    const deserializedProject = await deserialize(exampleProjectFile.name);

    const project = deserializedProject.project;
    const classifier = deserializedProject.classifier;

    dispatch(applicationSlice.actions.clearSelectedImages());

    batch(() => {
      dispatch(projectSlice.actions.setProject({ project }));

      dispatch(
        classifierSlice.actions.setClassifier({
          classifier,
        })
      );

      dispatch(classifierSlice.actions.setDefaults({}));
    });

    onClose();
  };

  return (
    <ListItem button onClick={onClickExampleProject}>
      <ListItemAvatar>
        {exampleClassifierIsLoading ? (
          <CircularProgress disableShrink />
        ) : (
          <Avatar src={exampleProject.projectIcon}></Avatar>
        )}
      </ListItemAvatar>

      <ListItemText
        primary={
          <Typography component="span" variant="subtitle1">
            {exampleProject.projectName}
          </Typography>
        }
        secondary={
          <>
            <Typography
              component="span"
              variant="body2"
              style={{ whiteSpace: "pre-line" }}
            >
              {exampleProject.projectDescription}
            </Typography>

            <br></br>

            {"Source: "}
            <a
              href={exampleProject.projectSource.sourceUrl}
              target="_blank"
              rel="noreferrer"
            >
              {exampleProject.projectSource.sourceName}
            </a>

            {exampleProject.license && (
              <>
                {" License: "}
                <a
                  href={exampleProject.license.licenseUrl}
                  target="_blank"
                  rel="noreferrer"
                >
                  {exampleProject.license.licenseName}
                </a>
              </>
            )}
          </>
        }
      />
    </ListItem>
  );
};
