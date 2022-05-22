import {
  applicationSlice,
  classifierSlice,
  projectSlice,
} from "../../store/slices";
import { useDispatch } from "react-redux";
import {
  Avatar,
  CircularProgress,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Typography,
} from "@mui/material";
import { SerializedProjectType } from "../../types/SerializedProjectType";
import { Classifier } from "../../types/Classifier";
import { ExampleProject } from "data/exampleProjects/exampleProjectsEnum";
import { deserializeImages } from "image/imageHelper";
import { SerializedImageType } from "types/SerializedImageType";
import React from "react";

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
  popupState: any;
  onClose: any;
};

export const OpenExampleProjectMenuItem = ({
  exampleProject,
  popupState,
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
          "data/exampleProjects/BBBC013ModeExampleProject.json"
        );
        break;
      default:
        return;
    }

    const project = exampleProjectJson.project as SerializedProjectType;
    const classifier = exampleProjectJson.classifier as Classifier;
    const images = await deserializeImages(
      project.serializedImages as Array<SerializedImageType>
    );

    dispatch(applicationSlice.actions.clearSelectedImages());

    dispatch(
      projectSlice.actions.openProject({
        images: images,
        categories: project.categories,
        name: project.name,
      })
    );

    dispatch(
      classifierSlice.actions.setClassifier({
        classifier: classifier,
      })
    );

    onClose();
    popupState.close();
  };

  return (
    <>
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
            <Typography variant="subtitle1">
              {exampleProject.projectName}
            </Typography>
          }
          secondary={
            <>
              <Typography variant="body2" style={{ whiteSpace: "pre-line" }}>
                {exampleProject.projectDescription}
              </Typography>

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
    </>
  );
};
