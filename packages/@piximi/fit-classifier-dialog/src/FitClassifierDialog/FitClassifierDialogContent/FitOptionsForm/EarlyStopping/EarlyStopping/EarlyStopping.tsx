import * as React from "react";
import Grid from "@material-ui/core/Grid";
import {Baseline} from "../Baseline";
import {Mode} from "../Mode";
import {Patience} from "../Patience";
import {MinimumDelta} from "../MinimumDelta";
import {Monitor} from "../Monitor";
import {Typography} from "@material-ui/core";
import {useStyles} from "./EarlyStopping.css";

type EarlyStoppingProps = {};

export const EarlyStopping = ({}: EarlyStoppingProps) => {
  const classes = useStyles({});

  return (
    <>
      <Typography className={classes.typography} variant="subtitle1">
        Early stopping
      </Typography>

      <Grid container spacing={4}>
        <Grid item xs={4}>
          <Monitor />
        </Grid>

        <Grid item xs={2}>
          <MinimumDelta />
        </Grid>

        <Grid item xs={2}>
          <Patience />
        </Grid>

        <Grid item xs={2}>
          <Mode />
        </Grid>

        <Grid item xs={2}>
          <Baseline />
        </Grid>
      </Grid>
    </>
  );
};
