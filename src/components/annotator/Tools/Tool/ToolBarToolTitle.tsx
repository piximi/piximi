import Typography from "@mui/material/Typography";
import React from "react";
import { KeyboardKey } from "../../Help/HelpDialog/KeyboardKey";
import { useStyles } from "../../Help/HelpDialog/HelpDialog.css";

type ToolTitleProps = {
  toolName: string;
  letter: string;
};
export const ToolBarToolTitle = ({ toolName, letter }: ToolTitleProps) => {
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
