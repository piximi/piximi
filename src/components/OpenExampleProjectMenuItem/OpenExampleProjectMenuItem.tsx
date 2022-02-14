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
} from "@mui/material";
import { SerializedProjectType } from "../../types/SerializedProjectType";
import { Classifier } from "../../types/Classifier";
import { ExampleProject } from "data/exampleProjects/exampleProjectsEnum";
import {
  convertSrcURIToOriginalSrcURIs,
  deserializeImages,
  generateDefaultChannels,
} from "image/imageHelper";
import React from "react";

type OpenExampleProjectMenuItemProps = {
  exampleProject: ExampleProject;
  projectName: string;
  projectIcon: string;
  popupState: any;
  onClose: any;
};

export const OpenExampleProjectMenuItem = ({
  exampleProject,
  projectName,
  projectIcon,
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
    switch (exampleProject) {
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
      default:
        return;
    }

    const project = exampleProjectJson.project as SerializedProjectType;
    const classifier = exampleProjectJson.classifier as Classifier;
    const images = await deserializeImages(project.serializedImages);

    dispatch(applicationSlice.actions.clearSelectedImages());

    // @ts-ignore
    const updatedImages = await Promise.all(
      images.map(async (image: any) => {
        const uri = image.originalSrc[0];

        //Compute the actual src and originalSrc of example projects from the single RGB URI we have
        // @ts-ignore
        const uris = await convertSrcURIToOriginalSrcURIs(uri, image.shape);

        if (exampleProject === ExampleProject.CElegans) {
          return {
            ...image,
            shape: { ...image.shape, channels: 2 },
            colors: generateDefaultChannels(2),
            originalSrc: [uris.slice(0, 2)],
            src: uri,
          }; //for worms project, we keep red and green
        } else if (exampleProject === ExampleProject.HumanU2OSCells) {
          return {
            ...image,
            shape: { ...image.shape, channels: 2 },
            colors: generateDefaultChannels(3).slice(1, 3),
            originalSrc: [uris.slice(1, 3)],
            src: uri,
          }; //for human cells project, we keep green and blue
        } else {
          return {
            ...image,
            shape: { ...image.shape, channels: 1 },
            originalSrc: [[uris[0]]],
            src: uris[0],
          }; //for mnist we only keep the red channel, that's our greyscale
        }
      })
    );

    dispatch(
      projectSlice.actions.openProject({
        images: updatedImages,
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
    <ListItem button onClick={onClickExampleProject}>
      <ListItemAvatar>
        <Avatar src={projectIcon}></Avatar>
      </ListItemAvatar>

      <ListItemText primary={projectName} />

      {exampleClassifierIsLoading && <CircularProgress disableShrink />}
    </ListItem>
  );
};
