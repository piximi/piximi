import React from "react";
import Grid from "@material-ui/core/Grid";
import TabPanel from "@material-ui/lab/TabPanel";
import { LossFunctionTextField } from "../LossFunctionTextField";
import { OptimizationAlgorithmTextField } from "../OptimizationAlgorithmTextField";
import { LearningRateTextField } from "../LearningRateTextField";
import { EpochsTextField } from "../EpochsTextField";
import { BatchSizeTextField } from "../BatchSizeTextField";

export const TrainingTabPanel = () => {
  return (
    <TabPanel value="training">
      <Grid container spacing={3}>
        <Grid item xs={6}>
          <OptimizationAlgorithmTextField />
        </Grid>

        <Grid item xs={6}>
          <LearningRateTextField />
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        <Grid item xs={6}>
          <LossFunctionTextField />
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        <Grid item xs={3}>
          <BatchSizeTextField />
        </Grid>

        <Grid item xs={3}>
          <EpochsTextField />
        </Grid>
      </Grid>
    </TabPanel>
  );
};
