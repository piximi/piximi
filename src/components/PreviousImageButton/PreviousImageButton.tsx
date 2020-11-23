import React from "react";
import IconButton from "@material-ui/core/IconButton";
import ArrowBackIcon from "@material-ui/icons/ArrowBack";

export const PreviousImageButton = () => {
  const onClick = () => {};

  return (
    <IconButton onClick={onClick}>
      <ArrowBackIcon />
    </IconButton>
  );
};
