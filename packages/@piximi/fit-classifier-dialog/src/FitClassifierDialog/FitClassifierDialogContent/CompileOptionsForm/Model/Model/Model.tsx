import Grid from "@material-ui/core/Grid";
import * as React from "react";

import {Architecture} from "../Architecture";
import {InputShape} from "../InputShape";
import {Multiplier} from "../Multiplier";
import {Version} from "../Version";

type ModelProps = {};

export const Model = ({}: ModelProps) => {
  return (
    <>
      <Grid item xs={4}>
        <Architecture />
      </Grid>

      <Grid item xs={2}>
        <Version />
      </Grid>

      <Grid item xs={4}>
        <InputShape />
      </Grid>

      <Grid item xs={2}>
        <Multiplier />
      </Grid>
    </>
  );
};
