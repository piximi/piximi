import {
  FormControl,
  FormHelperText,
  Grid,
  MenuItem,
  Select,
  SelectChangeEvent,
  TextField,
} from "@mui/material";
import * as _ from "lodash";
import * as React from "react";
import { useDispatch, useSelector } from "react-redux";
import { classifierSlice } from "../../../../store/slices";
import { LossFunction } from "../../../../types/LossFunction";
import { fitOptionsSelector } from "../../../../store/selectors";
import { learningRateSelector } from "../../../../store/selectors/learningRateSelector";
import { OptimizationAlgorithm } from "../../../../types/OptimizationAlgorithm";
import { useStyles } from "../../FitClassifierDialog/FitClassifierDialog.css";
import { optimizationAlgorithmSelector } from "../../../../store/selectors/optimizationAlgorithmSelector";
import { lossFunctionSelector } from "../../../../store/selectors/lossFunctionSelector";

const optimizationAlgorithms = {
  Adadelta: "Adadelta",
  Adagrad: "Adagrad",
  Adam: "Adam",
  Adamax: "Adamax",
  Momentum: "Momentum",
  RmsProp: "RMSProp",
  StochasticGradientDescent: "Stochastic gradient descent (SGD)",
};

const lossFunctions = {
  AbsoluteDifference: "Absolute difference",
  CosineDistance: "Cosine distance",
  Hinge: "Hinge",
  Huber: "Huber",
  Log: "Log",
  MeanSquaredError: "Mean squared error (MSE)",
  SigmoidCrossEntropy: "Sigmoid cross entropy",
  CategoricalCrossEntropy: "Categorical cross entropy",
};

export const OptimizerSettingsGrid = () => {
  const classes = useStyles();
  const dispatch = useDispatch();

  const fitOptions = useSelector(fitOptionsSelector);
  const optimizationAlgorithm = useSelector(optimizationAlgorithmSelector);
  const lossFunction = useSelector(lossFunctionSelector);
  const learningRate = useSelector(learningRateSelector);

  const onBatchSizeChange = (event: React.FormEvent<EventTarget>) => {
    const target = event.target as HTMLInputElement;
    const batchSize = Number(target.value);
    dispatch(classifierSlice.actions.updateBatchSize({ batchSize: batchSize }));
  };

  const onEpochsChange = (event: React.FormEvent<EventTarget>) => {
    const target = event.target as HTMLInputElement;
    const epochs = Number(target.value);
    dispatch(classifierSlice.actions.updateEpochs({ epochs: epochs }));
  };

  const onOptimizationAlgorithmChange = (event: SelectChangeEvent) => {
    const target = event.target as HTMLInputElement; //target.value is string

    const selectedAlgorithm = () => {
      switch (target.value) {
        case "Adadelta":
          return OptimizationAlgorithm.Adadelta;
        case "Adagrad":
          return OptimizationAlgorithm.Adagrad;
        case "Adam":
          return OptimizationAlgorithm.Adam;
        case "Adamax":
          return OptimizationAlgorithm.Adamax;
        case "Momentum":
          return OptimizationAlgorithm.Momentum;
        case "RMSProp":
          return OptimizationAlgorithm.RMSProp;
        case "Stochastic gradient descent (SGD)":
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

  const onLossFunctionChange = (event: SelectChangeEvent) => {
    const target = event.target as HTMLInputElement; //target.value is string

    const selectedLossFunction = () => {
      switch (target.value) {
        case "Absolute difference":
          return LossFunction.AbsoluteDifference;
        case "Cosine distance":
          return LossFunction.CosineDistance;
        case "Hinge":
          return LossFunction.Hinge;
        case "Huber":
          return LossFunction.Huber;
        case "Log":
          return LossFunction.Log;
        case "Mean squared error (MSE)":
          return LossFunction.MeanSquaredError;
        case "Sigmoid cross entropy":
          return LossFunction.SigmoidCrossEntropy;
        case "Categorical cross entropy":
          return LossFunction.CategoricalCrossEntropy;
        default:
          return LossFunction.CategoricalCrossEntropy;
      }
    };
    dispatch(
      classifierSlice.actions.updateLossFunction({
        lossFunction: selectedLossFunction(),
      })
    );
  };

  return (
    <>
      <FormControl className={classes.container} sx={{ m: 1, minWidth: 120 }}>
        <Grid container spacing={2}>
          <Grid item xs={4}>
            <FormHelperText>Optimization Algorithm</FormHelperText>
            <Select
              value={optimizationAlgorithm as string}
              onChange={onOptimizationAlgorithmChange}
              className={classes.select}
              displayEmpty
              inputProps={{ "aria-label": "Without label" }}
            >
              {_.map(optimizationAlgorithms, (v, k) => {
                return (
                  <MenuItem dense key={k} value={v}>
                    {v}
                  </MenuItem>
                );
              })}
            </Select>
          </Grid>
        </Grid>
        <Grid container spacing={2}>
          <Grid item xs={4}>
            <TextField
              id="learning-rate"
              label="Learning rate"
              className={classes.textField}
              value={learningRate}
              onChange={onLearningRateChange}
              type="number"
            />
          </Grid>
        </Grid>
      </FormControl>
      <FormControl className={classes.container} sx={{ m: 1, minWidth: 120 }}>
        <Grid container spacing={2}>
          <Grid item xs={4}>
            <FormHelperText>Loss Function</FormHelperText>
            <Select
              value={lossFunction as string} //TODO #130 fix so that multiple lossFunctions are shown, if we do have multiple loss functions
              onChange={onLossFunctionChange}
              className={classes.select}
              displayEmpty
              inputProps={{ "aria-label": "Without label" }}
            >
              {_.map(lossFunctions, (v, k) => {
                return (
                  <MenuItem dense key={k} value={v}>
                    {v}
                  </MenuItem>
                );
              })}
            </Select>
          </Grid>
        </Grid>
        <Grid container direction={"row"} spacing={2}>
          <Grid item xs={2}>
            <TextField
              id="batch-size"
              label="Batch size"
              className={classes.textField}
              value={fitOptions.batchSize}
              onChange={onBatchSizeChange}
              type="number"
              margin="normal"
            />
          </Grid>

          <Grid item xs={2}>
            <TextField
              id="epochs"
              label="Epochs"
              className={classes.textField}
              value={fitOptions.epochs}
              onChange={onEpochsChange}
              margin="normal"
              type="number"
            />
          </Grid>
        </Grid>
      </FormControl>
    </>
  );
};
