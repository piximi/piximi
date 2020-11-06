import React from "react";
import { useStyles } from "../../../../../Application/Application.css";
import Container from "@material-ui/core/Container";
import DialogContent from "@material-ui/core/DialogContent";
import { ClassifierSettingsDialogTabContext } from "../ClassifierSettingsDialogTabContext/ClassifierSettingsDialogTabContext";

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
