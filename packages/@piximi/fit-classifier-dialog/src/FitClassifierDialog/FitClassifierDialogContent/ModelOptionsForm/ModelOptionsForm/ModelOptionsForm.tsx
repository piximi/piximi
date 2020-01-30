import Grid from "@material-ui/core/Grid";
import * as React from "react";
import {Architecture} from "../Architecture";
import {VersionSelect} from "../VersionSelect";
import {InputShape} from "../InputShape";
import {MultiplierSelect} from "../MultiplierSelect";

type ModelOptionsFormProps = {};

export const ModelOptionsForm = ({}: ModelOptionsFormProps) => {
  return (
    <Grid container spacing={2}>
      <Grid item xs={4}>
        <Architecture />
      </Grid>

      <Grid item xs={2}>
        <VersionSelect />
      </Grid>

      <Grid item xs={4}>
        <InputShape />
      </Grid>

      <Grid item xs={2}>
        <MultiplierSelect />
      </Grid>
    </Grid>
  );
};
