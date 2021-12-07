import { useStyles } from "./HelpDialog.css";
import React from "react";

type KeyboardKeyProps = {
  letter: string;
};
export const KeyboardKey = ({ letter }: KeyboardKeyProps) => {
  const classes = useStyles();

  return <div className={classes.kbd}>{letter}</div>;
};
