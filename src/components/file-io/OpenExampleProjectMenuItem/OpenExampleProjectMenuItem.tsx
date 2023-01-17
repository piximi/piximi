import React from "react";
import { useDispatch } from "react-redux";

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

import {
  Classifier,
  // TODO: image_data
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  SerializedImageType,
  SerializedProjectType,
  UNKNOWN_ANNOTATION_CATEGORY,
} from "types";

import { _SerializedImageType } from "types/SerializedImageType";

import { ExampleProject } from "data/exampleProjects/exampleProjectsEnum";
import { deserializeImages } from "image/utils/deserialize";

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

// TODO: image_data
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
    var exampleProjectJson: any;
    switch (exampleProject.exampleProjectEnum) {
      case ExampleProject.Mnist:
        exampleProjectJson = await import(
          "data/exampleProjects/mnistExampleProject.json"
        );
        break;
      case ExampleProject.CElegans:
        exampleProjectJson = await import(
          "data/exampleProjects/cElegansExampleProject.json"
        );
        break;
      case ExampleProject.HumanU2OSCells:
        exampleProjectJson = await import(
          "data/exampleProjects/humanU2OSCellsExampleProject.json"
        );
        break;
      case ExampleProject.BBBC013:
        exampleProjectJson = await import(
          "data/exampleProjects/BBBC013ExampleProject.json"
        );
        break;
      case ExampleProject.PLP1:
        exampleProjectJson = await import(
          "data/exampleProjects/PLP1ExampleProject.json"
        );
        break;
      default:
        return;
    }

    const project = exampleProjectJson.project as SerializedProjectType;
    const classifier = exampleProjectJson.classifier as Classifier;
    const images = await deserializeImages(
      project.serializedImages as unknown as Array<_SerializedImageType>
    );

    dispatch(applicationSlice.actions.clearSelectedImages());

    // TODO: image_data - set to setProject
    dispatch(
      projectSlice.actions.openProject({
        images: images,
        categories: project.categories,
        annotationCategories: [UNKNOWN_ANNOTATION_CATEGORY],
        name: project.name,
      })
    );

    // TODO: image_data - set to new setClassifier
    dispatch(
      classifierSlice.actions.oldSetClassifier({
        classifier: classifier,
      })
    );

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
