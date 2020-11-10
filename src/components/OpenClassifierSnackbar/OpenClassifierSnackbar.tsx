import React from "react";
import Alert from "@material-ui/lab/Alert";
import AlertTitle from "@material-ui/lab/AlertTitle";
import Snackbar from "@material-ui/core/Snackbar";
import Grid from "@material-ui/core/Grid";
import { useStyles } from "../Application/Application.css";
import Typography from "@material-ui/core/Typography";

type OpenClassifierSnackbar = {
  epoch: number;
  loss: number;
  onClose: () => void;
  open: boolean;
};

export const OpenClassifierSnackbar = ({
  epoch,
  loss,
  onClose,
  open,
}: OpenClassifierSnackbar) => {
  const classes = useStyles();

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
            <Typography>
              {epoch}, {loss}
            </Typography>
          </Grid>
        </Grid>
      </Alert>
    </Snackbar>
  );
};
