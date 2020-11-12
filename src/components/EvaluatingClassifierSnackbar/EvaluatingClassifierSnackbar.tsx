import React from "react";
import Alert from "@material-ui/lab/Alert";
import AlertTitle from "@material-ui/lab/AlertTitle";
import Snackbar from "@material-ui/core/Snackbar";
import { useStyles } from "../Application/Application.css";

type EvaluatingClassifierSnackbarProps = {
  onClose: () => void;
  open: boolean;
};

export const EvaluatingClassifierSnackbar = ({
  onClose,
  open,
}: EvaluatingClassifierSnackbarProps) => {
  const classes = useStyles();

  return (
    <Snackbar
      anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
      onClose={onClose}
      open={open}
    >
      <Alert className={classes.alert} onClose={onClose} severity="info">
        <AlertTitle>Evaluating classifier…</AlertTitle>
      </Alert>
    </Snackbar>
  );
};
