import FormControl from "@material-ui/core/FormControl";
import FormHelperText from "@material-ui/core/FormHelperText";
import Grid from "@material-ui/core/Grid";
import InputLabel from "@material-ui/core/InputLabel";
import MenuItem from "@material-ui/core/MenuItem";
import Select from "@material-ui/core/Select";
import {updateOptimizationFunctionAction} from "@piximi/store";
import {ClassifierState, Optimizer} from "@piximi/types";
import * as React from "react";
import {useDispatch, useSelector} from "react-redux";

import {LearningRate} from "../LearningRate";
import {useStyles} from "./OptimizationFunction.css";

const OPTIMIZATION_FUNCTIONS = new Map<Optimizer, string>();

OPTIMIZATION_FUNCTIONS.set(Optimizer.Adadelta, "Adadelta");
OPTIMIZATION_FUNCTIONS.set(Optimizer.Adagrad, "Adaptive gradient (Adagrad)");
OPTIMIZATION_FUNCTIONS.set(Optimizer.Adagrad, "Adaptive gradient (Adagrad)");
OPTIMIZATION_FUNCTIONS.set(Optimizer.Adam, "Adaptive moment estimation (Adam)");
OPTIMIZATION_FUNCTIONS.set(
  Optimizer.RMSProp,
  "Root mean square propagation (RMSProp)"
);
OPTIMIZATION_FUNCTIONS.set(Optimizer.SGD, "Stochastic gradient descent (SGD)");

type OptimizationFunctionProps = {};

export const OptimizationFunction = ({}: OptimizationFunctionProps) => {
  const dispatch = useDispatch();

  const onChange = React.useCallback(
    (event: React.ChangeEvent<{value: Optimizer}>) => {
      const action = updateOptimizationFunctionAction({
        optimizationFunction: event.target.value
      });

      dispatch(action);
    },
    [dispatch]
  );

  const optimizationFunction = useSelector(
    ({classifier}: {classifier: ClassifierState}): Optimizer => {
      return classifier.optimizationFunction as Optimizer;
    }
  );

  const classes = useStyles({});

  return (
    <>
      <Grid item xs={6}>
        <FormControl className={classes.formControl}>
          <InputLabel id="optimizer-label">Optimization function</InputLabel>

          <Select
            id="optimizer"
            labelId="optimizer-label"
            onChange={onChange}
            value={optimizationFunction}
          >
            {Array.from(OPTIMIZATION_FUNCTIONS).map(
              ([k, v]: [Optimizer, string]) => {
                return (
                  <MenuItem key={k} value={k}>
                    {v}
                  </MenuItem>
                );
              }
            )}
          </Select>

          <FormHelperText>&nbsp;</FormHelperText>
        </FormControl>
      </Grid>

      <Grid item xs={4}>
        <LearningRate />
      </Grid>
    </>
  );
};
