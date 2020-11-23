import React, { useRef, useState } from "react";
import { useStyles } from "./ImageDialogCanvas.css";
import { useSelector } from "react-redux";
import { imagesSelector, selectedImagesSelector } from "../../store/selectors";
import { Image as ImageType } from "../../types/Image";
import { selectionMethodSelector } from "../../store/selectors/selectionMethodSelector";
import { SelectionMethod } from "../../types/SelectionMethod";
import { BackgroundCanvas } from "../BackgroundCanvas";
import { MasksCanvas } from "../MasksCanvas";
import { UserEventsCanvas } from "../UserEventsCanvas";

export const ImageDialogCanvas = () => {
  const classes = useStyles();

  return (
    <div className={classes.canvas}>
      <BackgroundCanvas />
      <MasksCanvas />
      <UserEventsCanvas />
    </div>
  );
};
