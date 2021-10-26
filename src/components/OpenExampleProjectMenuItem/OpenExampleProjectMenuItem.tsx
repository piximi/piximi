import React from "react";
import { classifierSlice, projectSlice } from "../../store/slices";
import { useDispatch } from "react-redux";
import { MenuItem } from "@mui/material";
import * as mnistProject from "../../examples/mnist.json";

type OpenExampleProjectMenuItemProps = {
  popupState: any;
};

export const OpenExampleProjectMenuItem = ({
  popupState,
}: OpenExampleProjectMenuItemProps) => {
  const dispatch = useDispatch();

  const project = (mnistProject as any).default;

  const onClickExampleProject = async () => {
    popupState.close();

    dispatch(
      projectSlice.actions.openProject({
        images: project.project.serializedImages,
        categories: project.project.categories,
        name: project.project.name,
      })
    );

    dispatch(
      classifierSlice.actions.setClassifier({
        classifier: project.classifier,
      })
    );
  };

  return (
    <MenuItem onClick={onClickExampleProject}>
      Open example project (mnist)
    </MenuItem>
  );
};
