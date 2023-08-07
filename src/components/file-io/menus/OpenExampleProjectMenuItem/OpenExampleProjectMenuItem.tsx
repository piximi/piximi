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

import { classifierSlice } from "store/classifier";
import { projectSlice } from "store/project";

import { ExampleProject } from "data/exampleProjects/exampleProjectsEnum";
import { deserialize } from "utils/common/image/deserialize";
import { dataSlice } from "store/data";
import { PseudoFileList, fListToStore } from "utils";
import { AlertStateType, AlertType } from "types";
import { applicationSlice } from "store/application";

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

  // CloudFront distribution domain
  const domain = "https://dw9hr7pc3ofrm.cloudfront.net";
  // S3 bucket path
  const rootPath = "exampleProjects";
  const ext = "zip";

  const openExampleProject = async () => {
    var exampleProjectFilePath: string;
    switch (exampleProject.exampleProjectEnum) {
      case ExampleProject.Mnist:
        exampleProjectFilePath =
          process.env.NODE_ENV === "production"
            ? `${domain}/${rootPath}/mnistExampleProject.${ext}`
            : (await import("data/exampleProjects/mnistExampleProject.zip"))
                .default;
        break;
      case ExampleProject.CElegans:
        exampleProjectFilePath =
          process.env.NODE_ENV === "production"
            ? `${domain}/${rootPath}/cElegansExampleProject.${ext}`
            : (await import("data/exampleProjects/cElegansExampleProject.zip"))
                .default;
        break;
      case ExampleProject.HumanU2OSCells:
        exampleProjectFilePath =
          process.env.NODE_ENV === "production"
            ? `${domain}/${rootPath}/HumanU2OSCellsExampleProject.${ext}`
            : (
                await import(
                  "data/exampleProjects/HumanU2OSCellsExampleProject.zip"
                )
              ).default;
        break;
      case ExampleProject.BBBC013:
        exampleProjectFilePath =
          process.env.NODE_ENV === "production"
            ? `${domain}/${rootPath}/BBBC013ExampleProject.${ext}`
            : (await import("data/exampleProjects/BBBC013ExampleProject.zip"))
                .default;
        break;
      case ExampleProject.PLP1:
        exampleProjectFilePath =
          process.env.NODE_ENV === "production"
            ? `${domain}/${rootPath}/PLP1ExampleProject.${ext}`
            : (await import("data/exampleProjects/PLP1ExampleProject.zip"))
                .default;
        break;
      default:
        return;
    }

    const exampleProjectFileList = await fetch(exampleProjectFilePath)
      .then((res) => res.blob())
      .then(
        (blob) =>
          new PseudoFileList([
            new File([blob], exampleProject.projectName, blob),
          ])
      )
      .catch((err: any) => {
        process.env.NODE_ENV === "production" &&
          process.env.REACT_APP_LOG_LEVEL === "1" &&
          console.error(err);
        throw err;
      });

    //@ts-ignore
    const fileStore = await fListToStore(exampleProjectFileList, true);

    try {
      const deserializedProject = await deserialize(fileStore);
      const project = deserializedProject.project;
      const data = deserializedProject.data;
      const classifier = deserializedProject.classifier;
      //TODO: keeps images, fix that
      batch(() => {
        dispatch(dataSlice.actions.resetData());
        dispatch(
          dataSlice.actions.initData({
            images: data.images,
            annotations: data.annotations,
            categories: data.categories,
            annotationCategories: data.annotationCategories,
          })
        );
        dispatch(projectSlice.actions.setProject({ project }));

        dispatch(
          classifierSlice.actions.setClassifier({
            classifier,
          })
        );

        dispatch(classifierSlice.actions.setDefaults({}));
      });
    } catch (err) {
      const error: Error = err as Error;

      process.env.NODE_ENV !== "production" &&
        process.env.REACT_APP_LOG_LEVEL === "1" &&
        console.error(err);

      const warning: AlertStateType = {
        alertType: AlertType.Warning,
        name: "Could not parse project file",
        description: `Error while parsing the project file: ${error.name}\n${error.message}`,
      };

      dispatch(
        applicationSlice.actions.updateAlertState({ alertState: warning })
      );
    }

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
