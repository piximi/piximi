import React, { useRef, useState } from "react";
import { useStyles } from "../ImageDialogCanvas/ImageDialogCanvas.css";

export const MasksCanvas = () => {
  const classes = useStyles();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  return <canvas className={classes.masksCanvas} />;
};
