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

import { ExampleProject } from "data/exampleProjects/exampleProjectsEnum";
import {
  // TODO: image_data
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  deserialize,
  deserializeImages,
} from "image/utils/deserialize";

// TODO: image_data - all imports below
import { _importExampleProject } from "format_convertor/convertExampleProject";
import { _SerializedImageType } from "format_convertor/types/";

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
    const exampleProjectJson: any = await _importExampleProject(
      exampleProject.exampleProjectEnum
    );

    // TODO: image_data - replace above line with below
    // var exampleProjectFile: string;
    // switch (exampleProject.exampleProjectEnum) {
    //   case ExampleProject.Mnist:
    //     exampleProjectFile = "data/exampleProjects/mnistExampleProject.h5";
    //     break;
    //   case ExampleProject.CElegans:
    //     exampleProjectFile = "data/exampleProjects/cElegansExampleProject.h5";
    //     break;
    //   case ExampleProject.HumanU2OSCells:
    //     exampleProjectFile = "data/exampleProjects/humanU2OSCellsExampleProject.h5";
    //     break;
    //   case ExampleProject.BBBC013:
    //     exampleProjectFile = "data/exampleProjects/BBBC013ExampleProject.h5";
    //     break;
    //   case ExampleProject.PLP1:
    //     exampleProjectFile = "data/exampleProjects/PLP1ExampleProject.h5";
    //     break;
    //   default:
    //     return;
    // }

    // const project = deserialize(exampleProjectFile)

    const _project = exampleProjectJson.project as SerializedProjectType;
    const _classifier = exampleProjectJson.classifier as Classifier;
    const _images = await deserializeImages(
      _project.serializedImages as unknown as Array<_SerializedImageType>
    );

    dispatch(applicationSlice.actions.clearSelectedImages());

    // TODO: image_data - set to setProject
    dispatch(
      projectSlice.actions.openProject({
        images: _images,
        categories: _project.categories,
        annotationCategories: [UNKNOWN_ANNOTATION_CATEGORY],
        name: _project.name,
      })
    );

    // TODO: image_data - set to new setClassifier
    dispatch(
      classifierSlice.actions.oldSetClassifier({
        classifier: _classifier,
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
