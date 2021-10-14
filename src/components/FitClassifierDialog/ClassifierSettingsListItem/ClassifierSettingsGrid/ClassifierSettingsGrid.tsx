import { Grid, MenuItem, TextField } from "@material-ui/core";
import * as _ from "lodash";
import * as React from "react";
import { createStyles, makeStyles, Theme } from "@material-ui/core/styles";
import { lossFunctionSelector } from "../../../../store/selectors/lossFunctionSelector";
import { useDispatch, useSelector } from "react-redux";
import { classifierSlice } from "../../../../store/slices";
import { LossFunction } from "../../../../types/LossFunction";
import { fitOptionsSelector } from "../../../../store/selectors";
import { inputShapeSelector } from "../../../../store/selectors/inputShapeSelector";
import { learningRateSelector } from "../../../../store/selectors/learningRateSelector";
import { optimizationAlgorithmSelector } from "../../../../store/selectors/optimizationAlgorithmSelector";
import { OptimizationAlgorithm } from "../../../../types/OptimizationAlgorithm";

const optimizationAlgorithms = {
  adadelta: "Adadelta",
  adagrad: "Adagrad",
  adam: "Adam",
  adamax: "Adamax",
  momentum: "Momentum",
  rmsProp: "RMSProp",
  stochasticGradientDescent: "Stochastic gradient descent (SGD)",
};

const lossFunctions = {
  absoluteDifference: "Absolute difference",
  cosineDistance: "Cosine distance",
  hingeLoss: "Hinge",
  huberLoss: "Huber",
  logLoss: "Log",
  meanSquaredError: "Mean squared error (MSE)",
  sigmoidCrossEntropy: "Sigmoid cross entropy",
  categoricalCrossentropy: "Categorical cross entropy",
};

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    container: {
      width: "100%",
      display: "flex",
      flexWrap: "wrap",
    },
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

export const ClassifierSettingsGrid = () => {
  const classes = useStyles();
  const dispatch = useDispatch();

  const fitOptions = useSelector(fitOptionsSelector);
  const inputShape = useSelector(inputShapeSelector);

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

  const onRowsChange = (event: React.FormEvent<EventTarget>) => {
    const target = event.target as HTMLInputElement;
    const rows = Number(target.value);
    dispatch(
      classifierSlice.actions.updateInputShape({
        inputShape: { ...inputShape, r: rows },
      })
    );
  };
  const onColsChange = (event: React.FormEvent<EventTarget>) => {
    const target = event.target as HTMLInputElement;
    const cols = Number(target.value);
    dispatch(
      classifierSlice.actions.updateInputShape({
        inputShape: { ...inputShape, c: cols },
      })
    );
  };
  const onChannelsChange = (event: React.FormEvent<EventTarget>) => {
    const target = event.target as HTMLInputElement;
    const channels = Number(target.value);
    dispatch(
      classifierSlice.actions.updateInputShape({
        inputShape: { ...inputShape, channels: channels },
      })
    );
  };

  const learningRate = useSelector(learningRateSelector);
  const optimizationAlgorithm = useSelector(optimizationAlgorithmSelector);

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

  const onLossFunctionChange = (event: React.FormEvent<EventTarget>) => {
    const target = event.target as HTMLInputElement; //target.value is string

    const selectedLossFunction = () => {
      switch (target.value) {
        case "absoluteDifference":
          return LossFunction.AbsoluteDifference;
        case "cosineDistance":
          return LossFunction.CosineDistance;
        case "hingeLoss":
          return LossFunction.Hinge;
        case "huberLoss":
          return LossFunction.Huber;
        case "logLoss":
          return LossFunction.Log;
        case "meanSquaredError":
          return LossFunction.MeanSquaredError;
        case "sigmoidCrossEntropy":
          return LossFunction.SigmoidCrossEntropy;
        case "categoricalCrossentropy":
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
      <form className={classes.container} noValidate>
        <Grid container spacing={2}>
          <Grid item xs={4}>
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
      </form>
      <Grid container spacing={2}>
        <Grid item xs={4}>
          <form noValidate>
            <TextField
              id="loss-function"
              select
              label="Loss function"
              className={classes.textField}
              defaultValue={""}
              onChange={onLossFunctionChange}
              SelectProps={{
                MenuProps: {
                  className: classes.menu,
                },
              }}
              margin="normal"
            >
              {_.map(lossFunctions, (v, k) => {
                return (
                  <MenuItem dense key={k} value={k}>
                    {v}
                  </MenuItem>
                );
              })}
            </TextField>
          </form>
        </Grid>
      </Grid>
      <Grid container direction="row" spacing={2}>
        <Grid item xs={1}>
          <TextField
            id="shape-rows"
            label="Rows"
            className={classes.textField}
            value={inputShape.r}
            onChange={onRowsChange}
            margin="normal"
          />
        </Grid>
        <Grid item xs={1}>
          <TextField
            id="shape-cols"
            label="Cols"
            className={classes.textField}
            value={inputShape.c}
            margin="normal"
            onChange={onColsChange}
          />
        </Grid>
        <Grid item xs={1}>
          <TextField
            id="shape-channels"
            label="Channels"
            className={classes.textField}
            value={inputShape.channels}
            margin="normal"
            onChange={onChannelsChange}
          />
        </Grid>
      </Grid>
      <Grid container>
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
    </>
  );
};
