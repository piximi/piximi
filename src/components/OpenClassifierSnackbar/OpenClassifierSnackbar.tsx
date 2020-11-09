import React, { useCallback, useState } from "react";
import Alert from "@material-ui/lab/Alert";
import AlertTitle from "@material-ui/lab/AlertTitle";
import Snackbar from "@material-ui/core/Snackbar";
import { LinearProgress } from "@material-ui/core";
import Grid from "@material-ui/core/Grid";
import { useStyles } from "../Application/Application.css";
import { useSelector } from "react-redux";
import { lossHistorySelector } from "../../store/selectors";
import Typography from "@material-ui/core/Typography";

type OpenClassifierSnackbar = {
  onClose: () => void;
  open: boolean;
};

export const OpenClassifierSnackbar = ({
  onClose,
  open,
}: OpenClassifierSnackbar) => {
  const lossHistory: Array<{ x: number; y: number }> = useSelector(
    lossHistorySelector
  );

  const [loss, setLoss] = useState<number>(0.0);

  useCallback(() => {
    setLoss(lossHistory[lossHistory.length - 1].y);
  }, [lossHistory]);

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
            <Typography>{loss}</Typography>
          </Grid>
        </Grid>
      </Alert>
    </Snackbar>
  );
};
