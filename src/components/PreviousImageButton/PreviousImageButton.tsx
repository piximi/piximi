import React from "react";
import IconButton from "@material-ui/core/IconButton";
import ArrowForwardIosIcon from "@material-ui/icons/ArrowForwardIos";

export const PreviousImageButton = () => {
  const onNextImage = () => {};

  return (
    <IconButton color="inherit" onClick={onNextImage}>
      <ArrowForwardIosIcon />
    </IconButton>
  );
};
