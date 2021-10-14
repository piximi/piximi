import * as React from "react";
import { createStyles, makeStyles, Theme } from "@material-ui/core/styles";
import { Grid, MenuItem, TextField } from "@material-ui/core";
import * as _ from "lodash";
import { optimizationAlgorithmSelector } from "../../../../store/selectors/optimizationAlgorithmSelector";
import { useDispatch, useSelector } from "react-redux";
import { classifierSlice } from "../../../../store/slices";
import { OptimizationAlgorithm } from "../../../../types/OptimizationAlgorithm";
import { learningRateSelector } from "../../../../store/selectors/learningRateSelector";

const optimizationAlgorithms = {
  adadelta: "Adadelta",
  adagrad: "Adagrad",
  adam: "Adam",
  adamax: "Adamax",
  momentum: "Momentum",
  rmsProp: "RMSProp",
  stochasticGradientDescent: "Stochastic gradient descent (SGD)",
};

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    menu: {
      // width: 200,
    },
    textField: {
      // marginLeft: theme.spacing(1),
      marginRight: theme.spacing(1),
      flexBasis: 300,
      width: "100%",
    },
  })
);

export const OptimizationGrid = () => {
  const dispatch = useDispatch();

  const learningRate = useSelector(learningRateSelector);

  const onOptimizationAlgorithmChange = (
    event: React.FormEvent<EventTarget>
  ) => {
    const target = event.target as HTMLInputElement; //target.value is string

    const selectedAlgorithm = () => {
      switch (target.value) {
        case "adadelta":
          return OptimizationAlgorithm.Adadelta;
        case "adagrad":
          return OptimizationAlgorithm.Adagrad;
        case "adam":
          return OptimizationAlgorithm.Adam;
        case "adamax":
          return OptimizationAlgorithm.Adamax;
        case "momentum":
          return OptimizationAlgorithm.Momentum;
        case "rmsProp":
          return OptimizationAlgorithm.RMSProp;
        case "stochasticGradientDescent":
          return OptimizationAlgorithm.StochasticGradientDescent;
        default:
          return OptimizationAlgorithm.Adam;
      }
    };

    dispatch(
      classifierSlice.actions.updateOptimizationAlgorithm({
        optimizationAlgorithm: selectedAlgorithm(),
      })
    );
  };

  const onLearningRateChange = (event: React.FormEvent<EventTarget>) => {
    const target = event.target as HTMLInputElement;
    const learningRate = Number(target.value);

    dispatch(
      classifierSlice.actions.updateLearningRate({ learningRate: learningRate })
    );
  };

  const classes = useStyles({});

  return (
    <Grid container spacing={2}>
      <Grid item xs={4}>
        <form noValidate>
          <TextField
            id="optimization-algorithm"
            select
            label="Optimization algorithm"
            className={classes.textField}
            defaultValue={""}
            onChange={onOptimizationAlgorithmChange}
            SelectProps={{
              MenuProps: {
                className: classes.menu,
              },
            }}
            margin="normal"
          >
            {_.map(optimizationAlgorithms, (v, k) => {
              return (
                <MenuItem dense key={k} value={k}>
                  {v}
                </MenuItem>
              );
            })}
          </TextField>
        </form>
      </Grid>

      <Grid item xs={4}>
        <TextField
          id="learning-rate"
          label="Learning rate"
          className={classes.textField}
          value={learningRate}
          onChange={onLearningRateChange}
          margin="normal"
          type="number"
        />
      </Grid>
    </Grid>
  );
};
