import Typography from "@mui/material/Typography";
import React from "react";
import { KeyboardKey } from "../ImageViewer/Help/HelpDialog/KeyboardKey";
import { useStyles } from "../ImageViewer/Help/HelpDialog/HelpDialog.css";

type ToolTitleProps = {
  toolName: string;
  letter: string;
};
export const ModelToolBarToolTitle = ({ toolName, letter }: ToolTitleProps) => {
  const classes = useStyles();

  return (
    <div className={classes.title}>
      <Typography>{toolName}</Typography>
      <Typography style={{ marginLeft: "5px" }}>(</Typography>
      <KeyboardKey letter="shift" />
      <Typography>+</Typography>
      <KeyboardKey letter={letter} />
      <Typography>)</Typography>
    </div>
  );
};
