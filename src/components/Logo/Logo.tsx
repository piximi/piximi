import React from "react";
import { useStyles } from "./Logo.css";
import { Typography } from "@mui/material";
import { useSelector } from "react-redux";
import { taskSelector } from "../../store/selectors/taskSelector";

export const Logo = () => {
  const classes = useStyles();

  const task = useSelector(taskSelector);

  const parsedTaskMap: { [key: string]: string } = {
    0: "Classifier",
    1: "Segmenter",
    2: "Measurer",
    3: "Annotator",
  };

  return (
    <Typography className={classes.title} color="inherit" noWrap variant="h6">
      {`Piximi ${parsedTaskMap[task]}`}
    </Typography>
  );
};
