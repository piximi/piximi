import { Grid, MenuItem, TextField } from "@material-ui/core";
import * as _ from "lodash";
import * as React from "react";
import { createStyles, makeStyles, Theme } from "@material-ui/core/styles";
import { lossFunctionSelector } from "../../../../store/selectors/lossFunctionSelector";
import { useDispatch, useSelector } from "react-redux";
import { classifierSlice } from "../../../../store/slices";
import { LossFunction } from "../../../../types/LossFunction";

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

export const LossFunctionGrid = () => {
  const classes = useStyles();
  const dispatch = useDispatch();

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
    <Grid container spacing={2}>
      <Grid item xs={4}>
        <form noValidate>
          <TextField
            id="loss-function"
            select
            label="Loss function"
            className={classes.textField}
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
  );
};
