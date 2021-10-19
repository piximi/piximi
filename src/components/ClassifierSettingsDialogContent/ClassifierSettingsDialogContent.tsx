import React from "react";
import { useStyles } from "../Application/Application.css";
import { ClassifierSettingsDialogTabContext } from "../ClassifierSettingsDialogTabContext";
import { Container, DialogContent } from "@mui/material";

export const ClassifierSettingsDialogContent = () => {
  const classes = useStyles();

  return (
    <DialogContent className={classes.classifierSettingsDialogContent}>
      <Container className={classes.container} maxWidth="md">
        <ClassifierSettingsDialogTabContext />
      </Container>
    </DialogContent>
  );
};
