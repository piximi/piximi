import React from "react";
import Alert from "@material-ui/lab/Alert";
import AlertTitle from "@material-ui/lab/AlertTitle";
import Snackbar from "@material-ui/core/Snackbar";
import Grid from "@material-ui/core/Grid";
import { useStyles } from "../Application/Application.css";
import Typography from "@material-ui/core/Typography";

export type TrainingClassifierSnackbarProps = {
  epoch: number;
  loss: number;
  onClose: () => void;
  open: boolean;
};

export const TrainingClassifierSnackbar = ({
  epoch,
  loss,
  onClose,
  open,
}: TrainingClassifierSnackbarProps) => {
  const classes = useStyles();

  return (
    <Snackbar
      anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
      onClose={onClose}
      open={open}
    >
      <Alert className={classes.alert} onClose={onClose} severity="info">
        <AlertTitle>Training classifier…</AlertTitle>
        <Grid container>
          <Grid item xs={12}>
            <Typography>
              {epoch}, {loss}
            </Typography>
          </Grid>
        </Grid>
      </Alert>
    </Snackbar>
  );
};
