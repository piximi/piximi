import Grid from "@material-ui/core/Grid";
import * as React from "react";
import {InitialEpoch} from "../InitialEpoch";
import {Epochs} from "../Epochs";
import {BatchSize} from "../BatchSize";
import {EarlyStopping} from "../EarlyStopping/EarlyStopping";

type FitOptionsFormProps = {};

export const FitOptionsForm = ({}: FitOptionsFormProps) => {
  return (
    <>
      <Grid container spacing={4}>
        <Grid item xs={2}>
          <BatchSize />
        </Grid>

        <Grid item xs={2}>
          <Epochs />
        </Grid>

        <Grid item xs={2}>
          <InitialEpoch />
        </Grid>
      </Grid>

      <EarlyStopping />
    </>
  );
};
