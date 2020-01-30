import FormControlLabel from "@material-ui/core/FormControlLabel";
import FormGroup from "@material-ui/core/FormGroup";
import FormHelperText from "@material-ui/core/FormHelperText";
import FormLabel from "@material-ui/core/FormLabel";
import Grid from "@material-ui/core/Grid";
import {Metric} from "@piximi/types";
import * as React from "react";

import {MetricCheckbox} from "../MetricCheckbox";
import {useStyles} from "./Metrics.css";

export const Metrics = () => {
  const classes = useStyles({});

  return (
    <>
      <FormLabel className={classes.formLabel} component="legend">
        Metrics
      </FormLabel>

      <Grid container>
        <Grid item xs>
          <FormGroup>
            <FormControlLabel
              control={<MetricCheckbox metric={Metric.BinaryAccuracy} />}
              label="Binary accuracy"
            />
            <FormControlLabel
              control={<MetricCheckbox metric={Metric.CategoricalAccuracy} />}
              label="Categorical accuracy"
            />
            <FormControlLabel
              control={
                <MetricCheckbox metric={Metric.CategoricalCrossentropy} />
              }
              label="Categorical cross-entropy"
            />
            <FormControlLabel
              control={<MetricCheckbox metric={Metric.Cosine} />}
              label="Cosine proximity"
            />
            <FormControlLabel
              control={<MetricCheckbox metric={Metric.MAE} />}
              label="Mean absolute error (MAE)"
            />
          </FormGroup>
        </Grid>

        <Grid item xs>
          <FormGroup>
            <FormControlLabel
              control={<MetricCheckbox metric={Metric.MAPE} />}
              label="Mean absolute percentage error (MAPE)"
            />
            <FormControlLabel
              control={<MetricCheckbox metric={Metric.MSE} />}
              label="Mean squared error (MSE)"
            />
            <FormControlLabel
              control={<MetricCheckbox metric={Metric.Precision} />}
              label="Precision"
            />
            <FormControlLabel
              control={
                <MetricCheckbox metric={Metric.SparseCategoricalCrossentropy} />
              }
              label="Sparse categorical cross-entropy"
            />
          </FormGroup>
        </Grid>
      </Grid>

      <FormHelperText>&nbsp;</FormHelperText>
    </>
  );
};
