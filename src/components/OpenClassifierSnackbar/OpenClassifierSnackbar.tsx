import React, { useCallback } from "react";
import Alert from "@material-ui/lab/Alert";
import AlertTitle from "@material-ui/lab/AlertTitle";
import Snackbar from "@material-ui/core/Snackbar";
import { LinearProgress } from "@material-ui/core";
import Grid from "@material-ui/core/Grid";
import { useStyles } from "../Application/Application.css";
import { useSelector } from "react-redux";
import { openingSelector } from "../../store/selectors";

type OpenClassifierSnackbar = {
  onClose: () => void;
  open: boolean;
};

export const OpenClassifierSnackbar = ({
  onClose,
  open,
}: OpenClassifierSnackbar) => {
  const opening = useSelector(openingSelector);

  const classes = useStyles();

  useCallback(() => {
    if (!opening) {
      onClose();
    }
  }, [onClose, opening]);

  return (
    <Snackbar
      anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      onClose={onClose}
      open={open}
    >
      <Alert className={classes.alert} onClose={onClose} severity="info">
        <AlertTitle>Training…</AlertTitle>
        <Grid container>
          <Grid item xs={12}>
            <LinearProgress className={classes.progress} />
          </Grid>
        </Grid>
      </Alert>
    </Snackbar>
  );
};
