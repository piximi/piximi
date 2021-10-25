import React from "react";
import { useDispatch } from "react-redux";
import { MenuItem } from "@mui/material";

type OpenExampleProjectMenuItemProps = {
  popupState: any;
};

export const OpenProjectMenuItem = ({
  popupState,
}: OpenExampleProjectMenuItemProps) => {
  const dispatch = useDispatch();

  const onClickProject = () => {
    console.info("Clicked");
  };

  return <MenuItem onClick={onClickProject}>Open project</MenuItem>;
};
