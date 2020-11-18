import React from "react";
import Snackbar from "@material-ui/core/Snackbar";
import Grid from "@material-ui/core/Grid";
import { useStyles } from "./TrainingClassifierSnackbar.css";
import { Alert } from "@material-ui/lab";
import AlertTitle from "@material-ui/lab/AlertTitle";
import { VictoryLine } from "victory";

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
      className={classes.snackbar}
      onClose={onClose}
      open={open}
    >
      <Alert
        classes={{ message: classes.message }}
        className={classes.snackbar}
        severity="info"
      >
        <AlertTitle>Training classifier…</AlertTitle>

        <div>
          <Grid container className={classes.gridContainer} spacing={2}>
            <Grid item xs={6}>
              <Grid container>
                <Grid className={classes.item} item xs={12}>
                  <VictoryLine
                    data={[
                      { x: 1, y: 2 },
                      { x: 2, y: 3 },
                      { x: 3, y: 5 },
                      { x: 4, y: 4 },
                      { x: 5, y: 7 },
                    ]}
                  />
                </Grid>
              </Grid>
            </Grid>

            <Grid item xs={6}>
              <Grid container>
                <Grid className={classes.item} item xs={12}>
                  <VictoryLine
                    data={[
                      { x: 1, y: 2 },
                      { x: 2, y: 3 },
                      { x: 3, y: 5 },
                      { x: 4, y: 4 },
                      { x: 5, y: 7 },
                    ]}
                  />
                </Grid>
              </Grid>
            </Grid>
          </Grid>
        </div>
      </Alert>
    </Snackbar>
  );
};
