import React from "react";
import { classifierSlice, projectSlice } from "../../store/slices";
import { useDispatch } from "react-redux";
import { MenuItem } from "@mui/material";
import * as mnistProject from "../../examples/mnist.json";
import { SerializedProjectType } from "../../types/SerializedProjectType";

type OpenExampleProjectMenuItemProps = {
  popupState: any;
};

export const OpenExampleProjectMenuItem = ({
  popupState,
}: OpenExampleProjectMenuItemProps) => {
  const dispatch = useDispatch();

  const project = mnistProject.project as SerializedProjectType;
  const classifier = mnistProject.classifier as any;

  const onClickExampleProject = async () => {
    popupState.close();

    dispatch(
      projectSlice.actions.openProject({
        images: project.serializedImages,
        categories: project.categories,
        name: project.name,
      })
    );

    dispatch(
      classifierSlice.actions.setClassifier({
        classifier: classifier,
      })
    );
  };

  return (
    <MenuItem onClick={onClickExampleProject}>Open MNIST project</MenuItem>
  );
};
